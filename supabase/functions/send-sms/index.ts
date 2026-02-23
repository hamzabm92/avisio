import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// French public holidays (rough list — update yearly)
const FRENCH_HOLIDAYS_2026 = [
  '2026-01-01', // Jour de l'An
  '2026-04-06', // Lundi de Pâques
  '2026-05-01', // Fête du Travail
  '2026-05-08', // Victoire 1945
  '2026-05-14', // Ascension
  '2026-05-25', // Lundi de Pentecôte
  '2026-07-14', // Fête Nationale
  '2026-08-15', // Assomption
  '2026-11-01', // Toussaint
  '2026-11-11', // Armistice
  '2026-12-25', // Noël
];

function buildMessage(template: string, firstName: string, hotelName: string, guestId: string, nights?: number | null, roomNumber?: string | null): string {
  const link = `avisio.app/g/${guestId}`;
  let msg = template
    .replace(/{prenom}/g, firstName)
    .replace(/{hotel}/g, hotelName)
    .replace(/{lien}/g, link)
    .replace(/{nuits}/g, nights ? String(nights) : '')
    .replace(/{chambre}/g, roomNumber || '');

  return msg + '\nSTOP au 36111';
}

function isWithinSendWindow(hourStart: number, hourEnd: number, dateStr: string): boolean {
  const now = new Date();

  // Check day of week (0=Sunday) — no Sunday
  const day = now.getDay();
  if (day === 0) return false;

  // Check French holidays
  const todayStr = now.toISOString().split('T')[0];
  if (FRENCH_HOLIDAYS_2026.includes(todayStr)) return false;

  // Check time window (French time — approximate, ideally use timezone library)
  const hour = now.getHours();
  if (hour < hourStart || hour >= hourEnd) return false;

  return true;
}

async function sendViaTwilio(to: string, body: string): Promise<{ sid: string; status: string; errorCode?: string; cost?: number }> {
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const formData = new URLSearchParams();
  formData.append('To', to);
  formData.append('From', TWILIO_FROM_NUMBER);
  formData.append('Body', body);

  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Twilio error ${data.code}: ${data.message}`);
  }

  return {
    sid: data.sid,
    status: data.status,
    errorCode: data.error_code,
    cost: data.price ? Math.abs(parseFloat(data.price)) : undefined,
  };
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));

    // Test mode: send to a specific phone number
    if (body.test && body.phone && body.message) {
      if (!TWILIO_ACCOUNT_SID) {
        return new Response(JSON.stringify({ ok: true, test: true, note: 'Twilio not configured' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await sendViaTwilio(body.phone, body.message);
      return new Response(JSON.stringify({ ok: true, test: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Single guest mode
    if (body.guest_id && body.hotel_id) {
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .select('*')
        .eq('id', body.guest_id)
        .eq('hotel_id', body.hotel_id)
        .single();

      if (guestError || !guest) {
        return new Response(JSON.stringify({ error: 'Guest not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: hotel } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', body.hotel_id)
        .single();

      if (!hotel) {
        return new Response(JSON.stringify({ error: 'Hotel not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check opt-out
      const { data: optOut } = await supabase
        .from('opt_outs')
        .select('id')
        .eq('hotel_id', body.hotel_id)
        .eq('phone', guest.phone)
        .maybeSingle();

      if (optOut) {
        await supabase.from('guests').update({ sms_status: 'opted_out' }).eq('id', guest.id);
        return new Response(JSON.stringify({ ok: false, reason: 'opted_out' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Build message
      const message = buildMessage(
        hotel.sms_template,
        guest.first_name,
        hotel.name,
        guest.id,
        guest.nights,
        guest.room_number
      );

      let twilioResult = null;
      let smsStatus = 'sent';
      let errorCode = null;

      if (TWILIO_ACCOUNT_SID) {
        try {
          twilioResult = await sendViaTwilio(guest.phone, message);
          smsStatus = twilioResult.status || 'sent';
        } catch (err) {
          smsStatus = 'failed';
          errorCode = err instanceof Error ? err.message : 'unknown';
        }
      } else {
        // No Twilio configured — mark as sent for demo
        console.log(`[DEMO] SMS to ${guest.phone}: ${message}`);
        smsStatus = 'sent';
      }

      const now = new Date().toISOString();

      // Update guest
      await supabase.from('guests').update({
        sms_status: smsStatus,
        sms_sent_at: now,
      }).eq('id', guest.id);

      // Log
      await supabase.from('sms_logs').insert({
        hotel_id: body.hotel_id,
        guest_id: guest.id,
        twilio_sid: twilioResult?.sid || null,
        message_body: message,
        status: smsStatus,
        error_code: errorCode,
        cost_eur: twilioResult?.cost || null,
        direction: 'outbound',
      });

      return new Response(JSON.stringify({ ok: smsStatus !== 'failed', status: smsStatus }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cron mode: process all scheduled guests
    const now = new Date();

    // Get all scheduled guests that should be sent
    const { data: scheduledGuests } = await supabase
      .from('guests')
      .select('*, hotels!inner(*)')
      .eq('sms_status', 'scheduled')
      .lte('checkout_date', now.toISOString().split('T')[0]);

    if (!scheduledGuests || scheduledGuests.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    let failed = 0;

    for (const guest of scheduledGuests) {
      const hotel = (guest as Record<string, unknown>).hotels as Record<string, unknown>;

      if (!hotel) continue;

      // Check time window
      if (!isWithinSendWindow(
        (hotel.sms_send_hour_start as number) || 8,
        (hotel.sms_send_hour_end as number) || 22,
        now.toISOString()
      )) {
        continue;
      }

      // Check opt-out
      const { data: optOut } = await supabase
        .from('opt_outs')
        .select('id')
        .eq('hotel_id', hotel.id as string)
        .eq('phone', guest.phone)
        .maybeSingle();

      if (optOut) {
        await supabase.from('guests').update({ sms_status: 'opted_out' }).eq('id', guest.id);
        continue;
      }

      const message = buildMessage(
        hotel.sms_template as string,
        guest.first_name,
        hotel.name as string,
        guest.id,
        guest.nights,
        guest.room_number
      );

      let smsStatus = 'sent';
      let twilioResult = null;
      let errorCode = null;

      if (TWILIO_ACCOUNT_SID) {
        try {
          twilioResult = await sendViaTwilio(guest.phone, message);
          smsStatus = twilioResult.status || 'sent';
          processed++;
        } catch (err) {
          smsStatus = 'failed';
          errorCode = err instanceof Error ? err.message : 'unknown';
          failed++;
        }
      } else {
        processed++;
      }

      await supabase.from('guests').update({
        sms_status: smsStatus,
        sms_sent_at: new Date().toISOString(),
      }).eq('id', guest.id);

      await supabase.from('sms_logs').insert({
        hotel_id: hotel.id as string,
        guest_id: guest.id,
        twilio_sid: twilioResult?.sid || null,
        message_body: message,
        status: smsStatus,
        error_code: errorCode,
        cost_eur: twilioResult?.cost || null,
        direction: 'outbound',
      });
    }

    return new Response(JSON.stringify({ ok: true, processed, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
