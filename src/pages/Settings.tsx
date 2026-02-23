import React, { useState, useEffect } from 'react';
import { Save, Building, MessageSquare, Shield, CreditCard, CheckCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { useHotel } from '../hooks/useHotel';
import { supabase } from '../lib/supabase';
import type { Hotel, OptOut } from '../types';
import { buildSMSMessage, countSMSSegments } from '../lib/csvUtils';

type Section = 'hotel' | 'sms' | 'compliance' | 'subscription';

const TEMPLATE_VARIABLES = [
  { var: '{prenom}', desc: 'Prénom' },
  { var: '{hotel}', desc: 'Hôtel' },
  { var: '{lien}', desc: 'Lien avis' },
  { var: '{nuits}', desc: 'Nuits' },
  { var: '{chambre}', desc: 'Chambre' },
];

const SECTIONS: { key: Section; icon: React.ReactNode; label: string }[] = [
  { key: 'hotel', icon: <Building size={15} />, label: 'Établissement' },
  { key: 'sms', icon: <MessageSquare size={15} />, label: 'SMS' },
  { key: 'compliance', icon: <Shield size={15} />, label: 'Conformité' },
  { key: 'subscription', icon: <CreditCard size={15} />, label: 'Abonnement' },
];

export default function Settings() {
  const { hotel, loading: hotelLoading, refetch } = useHotel();
  const [section, setSection] = useState<Section>('hotel');
  const [form, setForm] = useState<Partial<Hotel>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [optOuts, setOptOuts] = useState<OptOut[]>([]);
  const [loadingOptOuts, setLoadingOptOuts] = useState(false);

  useEffect(() => {
    if (hotel) {
      setForm({
        name: hotel.name,
        address: hotel.address || '',
        city: hotel.city || '',
        google_review_url: hotel.google_review_url || '',
        sms_template: hotel.sms_template,
        sms_delay_hours: hotel.sms_delay_hours,
        sms_send_hour_start: hotel.sms_send_hour_start,
        sms_send_hour_end: hotel.sms_send_hour_end,
        rating_threshold: hotel.rating_threshold,
      });
    }
  }, [hotel]);

  useEffect(() => {
    if (hotel && section === 'compliance') fetchOptOuts();
  }, [hotel, section]);

  async function fetchOptOuts() {
    setLoadingOptOuts(true);
    try {
      const { data } = await supabase
        .from('opt_outs').select('*').eq('hotel_id', hotel!.id).order('created_at', { ascending: false });
      setOptOuts((data as OptOut[]) || []);
    } finally {
      setLoadingOptOuts(false);
    }
  }

  async function handleSave() {
    if (!hotel) return;
    setSaving(true);
    try {
      await supabase.from('hotels').update({
        name: form.name, address: form.address, city: form.city,
        google_review_url: form.google_review_url, sms_template: form.sms_template,
        sms_delay_hours: form.sms_delay_hours, sms_send_hour_start: form.sms_send_hour_start,
        sms_send_hour_end: form.sms_send_hour_end, rating_threshold: form.rating_threshold,
      }).eq('id', hotel.id);
      setSaved(true);
      refetch();
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const smsPreview = form.sms_template
    ? buildSMSMessage(form.sms_template, { first_name: 'Marie', nights: 2, room_number: '204' }, form.name || 'Mon Hôtel', 'exemple123') + '\nSTOP au 36111'
    : '';
  const smsLength = smsPreview.length;
  const smsSegments = countSMSSegments(smsPreview);

  if (hotelLoading) {
    return (
      <Layout title="Paramètres">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#C9A96E', borderTopColor: 'transparent' }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Paramètres">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Tab bar */}
        <div
          className="flex gap-1 p-1 rounded-2xl overflow-x-auto"
          style={{ backgroundColor: 'white', border: '1px solid #EDE8E3', boxShadow: '0 1px 6px rgba(44,36,32,0.06)' }}
        >
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 whitespace-nowrap"
              style={section === s.key
                ? { backgroundColor: '#2C2420', color: 'white' }
                : { color: '#8A7F78', backgroundColor: 'transparent' }
              }
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Section: Établissement */}
        {section === 'hotel' && (
          <div className="space-y-3">
            <SectionHeader title="Informations de l'établissement" />

            <FieldGroup>
              <Field label="Nom de l'hôtel" required>
                <Input
                  value={form.name || ''}
                  onChange={v => setForm(f => ({ ...f, name: v }))}
                  placeholder="Hôtel Le Beaumont"
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field label="Adresse">
                <Input
                  value={form.address || ''}
                  onChange={v => setForm(f => ({ ...f, address: v }))}
                  placeholder="12 rue de la Paix"
                />
              </Field>
              <Divider />
              <Field label="Ville">
                <Input
                  value={form.city || ''}
                  onChange={v => setForm(f => ({ ...f, city: v }))}
                  placeholder="Paris"
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field label="Lien Google My Business" hint="Trouvez ce lien dans Google Business Profile → Demander des avis">
                <Input
                  value={form.google_review_url || ''}
                  onChange={v => setForm(f => ({ ...f, google_review_url: v }))}
                  placeholder="https://g.page/r/xxx/review"
                  type="url"
                />
              </Field>
            </FieldGroup>

            <SaveBar saving={saving} saved={saved} onSave={handleSave} />
          </div>
        )}

        {/* Section: SMS */}
        {section === 'sms' && (
          <div className="space-y-3">
            <SectionHeader title="Configuration SMS" />

            {/* Template */}
            <FieldGroup>
              <Field label="Message SMS">
                <textarea
                  value={form.sms_template || ''}
                  onChange={e => setForm(f => ({ ...f, sms_template: e.target.value }))}
                  rows={3}
                  className="w-full text-sm outline-none resize-none"
                  style={{ color: '#2C2420', background: 'none', border: 'none', padding: 0, fontFamily: 'DM Sans, sans-serif' }}
                />
                <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid #F0EBE5' }}>
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPLATE_VARIABLES.map(v => (
                      <button
                        key={v.var}
                        onClick={() => setForm(f => ({ ...f, sms_template: (f.sms_template || '') + v.var }))}
                        className="text-xs px-2 py-0.5 rounded-full font-mono font-medium"
                        style={{ backgroundColor: '#F5EDD8', color: '#C9A96E' }}
                        title={v.desc}
                      >
                        {v.var}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-mono shrink-0 ml-2" style={{ color: smsLength > 160 ? '#C97A7A' : '#8A7F78' }}>
                    {smsLength}/160
                  </span>
                </div>
                {smsLength > 160 && (
                  <p className="text-xs mt-1" style={{ color: '#C97A7A' }}>⚠ {smsSegments} SMS — coût multiplié par {smsSegments}</p>
                )}
              </Field>
            </FieldGroup>

            {/* Preview */}
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: '#2C2420', boxShadow: '0 1px 6px rgba(44,36,32,0.12)' }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Aperçu du SMS
              </p>
              <div
                className="rounded-xl p-3 text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#F5EDD8', whiteSpace: 'pre-line', lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}
              >
                {smsPreview || '—'}
              </div>
            </div>

            {/* Numeric settings */}
            <FieldGroup>
              <Field label="Délai après checkout" hint="En heures avant l'envoi du SMS">
                <NumberInput
                  value={form.sms_delay_hours ?? 2}
                  min={0} max={72}
                  onChange={v => setForm(f => ({ ...f, sms_delay_hours: v }))}
                  suffix="h"
                />
              </Field>
              <Divider />
              <Field label="Note minimale pour Google" hint="En dessous, on priorise le feedback privé">
                <NumberInput
                  value={form.rating_threshold ?? 4}
                  min={1} max={5}
                  onChange={v => setForm(f => ({ ...f, rating_threshold: v }))}
                  suffix="★"
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field label="Heure d'envoi minimum">
                <NumberInput
                  value={form.sms_send_hour_start ?? 8}
                  min={6} max={12}
                  onChange={v => setForm(f => ({ ...f, sms_send_hour_start: v }))}
                  suffix="h"
                />
              </Field>
              <Divider />
              <Field label="Heure d'envoi maximum">
                <NumberInput
                  value={form.sms_send_hour_end ?? 22}
                  min={18} max={23}
                  onChange={v => setForm(f => ({ ...f, sms_send_hour_end: v }))}
                  suffix="h"
                />
              </Field>
            </FieldGroup>

            <SaveBar saving={saving} saved={saved} onSave={handleSave} />
          </div>
        )}

        {/* Section: Conformité */}
        {section === 'compliance' && (
          <div className="space-y-3">
            <SectionHeader title="Conformité CNIL" />

            {/* Rules */}
            <div
              className="rounded-2xl p-4 space-y-2"
              style={{ backgroundColor: 'white', border: '1px solid #EDE8E3', boxShadow: '0 1px 6px rgba(44,36,32,0.06)' }}
            >
              {[
                'Envoi uniquement lun–sam entre 8h et 22h',
                'Mention STOP au 36111 dans chaque SMS',
                'Opt-out immédiat sur réponse STOP',
                'Données issues d\'une relation commerciale directe',
                'Conservation limitée à 3 ans (RGPD)',
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#7EB5A6' }} />
                  <span className="text-sm" style={{ color: '#2C2420' }}>{rule}</span>
                </div>
              ))}
            </div>

            {/* Opt-outs list */}
            <SectionHeader title="Liste STOP" subtitle="Numéros ayant répondu STOP" />
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'white', border: '1px solid #EDE8E3', boxShadow: '0 1px 6px rgba(44,36,32,0.06)' }}
            >
              {loadingOptOuts ? (
                <div className="p-6 flex justify-center">
                  <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#C9A96E', borderTopColor: 'transparent' }} />
                </div>
              ) : optOuts.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm" style={{ color: '#8A7F78' }}>Aucun numéro en liste d'opposition</p>
                </div>
              ) : (
                optOuts.map((opt, i) => (
                  <div
                    key={opt.id}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid #F5F0EB' }}
                  >
                    <span className="text-sm font-mono" style={{ color: '#2C2420' }}>{opt.phone}</span>
                    <span className="text-xs" style={{ color: '#8A7F78' }}>
                      {new Date(opt.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Section: Abonnement */}
        {section === 'subscription' && hotel && (
          <div className="space-y-3">
            <SectionHeader title="Abonnement" />

            <div
              className="rounded-2xl p-5"
              style={{ background: 'linear-gradient(135deg, #2C2420 0%, #3D332E 100%)', boxShadow: '0 4px 16px rgba(44,36,32,0.2)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(201,169,110,0.7)' }}>
                Plan actuel
              </p>
              <p className="text-3xl font-bold capitalize mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#C9A96E' }}>
                {hotel.plan}
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {hotel.plan === 'starter' ? '49€ / mois' : hotel.plan === 'pro' ? '79€ / mois' : 'Sur devis'}
              </p>
            </div>

            <FieldGroup>
              <button
                className="w-full flex items-center justify-between py-1"
                onClick={() => window.open('/billing', '_blank')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5EDD8' }}>
                    <CreditCard size={16} style={{ color: '#C9A96E' }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#2C2420' }}>Gérer l'abonnement</span>
                </div>
                <span style={{ color: '#C9A96E', fontSize: 18 }}>›</span>
              </button>
            </FieldGroup>
          </div>
        )}
      </div>
    </Layout>
  );
}

/* ─── Sub-components ─── */

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-1 pt-2 pb-1">
      <p className="text-base font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}>
        {title}
      </p>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: '#8A7F78' }}>{subtitle}</p>}
    </div>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl px-4 py-3 space-y-0"
      style={{ backgroundColor: 'white', border: '1px solid #EDE8E3', boxShadow: '0 1px 6px rgba(44,36,32,0.06)' }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px -mx-4" style={{ backgroundColor: '#F5F0EB' }} />;
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#8A7F78', letterSpacing: '0.05em' }}>
          {label}
          {required && <span style={{ color: '#C97A7A' }}> *</span>}
        </label>
        {hint && <span className="text-xs ml-2 text-right" style={{ color: '#B8B0A8', maxWidth: 140 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="w-full text-sm outline-none"
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        color: '#2C2420',
        fontFamily: 'DM Sans, sans-serif',
        caretColor: '#C9A96E',
        opacity: focused || value ? 1 : 0.9,
      }}
    />
  );
}

function NumberInput({ value, min, max, onChange, suffix }: { value: number; min: number; max: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-bold transition-colors"
        style={{ backgroundColor: '#F5EDD8', color: '#C9A96E' }}
      >
        −
      </button>
      <span className="text-sm font-semibold min-w-[2rem] text-center" style={{ color: '#2C2420' }}>
        {value}{suffix}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-bold transition-colors"
        style={{ backgroundColor: '#F5EDD8', color: '#C9A96E' }}
      >
        +
      </button>
    </div>
  );
}

function SaveBar({ saving, saved, onSave }: { saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <Button onClick={onSave} loading={saving} leftIcon={<Save size={15} />} className="flex-1" size="lg">
        Enregistrer
      </Button>
      {saved && (
        <div className="flex items-center gap-1.5">
          <CheckCircle size={16} style={{ color: '#7EB5A6' }} />
          <span className="text-sm font-medium" style={{ color: '#7EB5A6' }}>Sauvegardé</span>
        </div>
      )}
    </div>
  );
}
