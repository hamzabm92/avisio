import { supabase } from './supabase';
import type { Guest, Hotel } from '../types';
import { buildSMSMessage } from './csvUtils';

/**
 * Schedule SMS sending for a guest via Supabase Edge Function
 */
export async function scheduleSMS(guest: Guest, hotel: Hotel): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-sms', {
      body: {
        guest_id: guest.id,
        hotel_id: hotel.id,
      },
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return { success: false, error: message };
  }
}

/**
 * Preview SMS message for a guest
 */
export function previewSMS(guest: Guest, hotel: Hotel): string {
  const msg = buildSMSMessage(
    hotel.sms_template,
    { first_name: guest.first_name, nights: guest.nights, room_number: guest.room_number },
    hotel.name,
    guest.id
  );
  return msg + '\nSTOP au 36111';
}

/**
 * Check if current time is within allowed send window
 */
export function isWithinSendWindow(hotel: Hotel): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday

  if (day === 0) return false; // No Sunday
  if (hour < hotel.sms_send_hour_start) return false;
  if (hour >= hotel.sms_send_hour_end) return false;

  return true;
}
