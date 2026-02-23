import React, { useState, useEffect } from 'react';
import { Save, Building, MessageSquare, Shield, CreditCard } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useHotel } from '../hooks/useHotel';
import { supabase } from '../lib/supabase';
import type { Hotel, OptOut } from '../types';
import { buildSMSMessage, countSMSSegments } from '../lib/csvUtils';

type Section = 'hotel' | 'sms' | 'compliance' | 'subscription';

const TEMPLATE_VARIABLES = [
  { var: '{prenom}', desc: 'Prénom du client' },
  { var: '{hotel}', desc: 'Nom de l\'hôtel' },
  { var: '{lien}', desc: 'Lien vers la page avis' },
  { var: '{nuits}', desc: 'Nombre de nuits' },
  { var: '{chambre}', desc: 'Numéro de chambre' },
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
    if (hotel && section === 'compliance') {
      fetchOptOuts();
    }
  }, [hotel, section]);

  async function fetchOptOuts() {
    setLoadingOptOuts(true);
    try {
      const { data } = await supabase
        .from('opt_outs')
        .select('*')
        .eq('hotel_id', hotel!.id)
        .order('created_at', { ascending: false });
      setOptOuts((data as OptOut[]) || []);
    } finally {
      setLoadingOptOuts(false);
    }
  }

  async function handleSave() {
    if (!hotel) return;
    setSaving(true);
    try {
      await supabase
        .from('hotels')
        .update({
          name: form.name,
          address: form.address,
          city: form.city,
          google_review_url: form.google_review_url,
          sms_template: form.sms_template,
          sms_delay_hours: form.sms_delay_hours,
          sms_send_hour_start: form.sms_send_hour_start,
          sms_send_hour_end: form.sms_send_hour_end,
          rating_threshold: form.rating_threshold,
        })
        .eq('id', hotel.id);

      setSaved(true);
      refetch();
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  // SMS preview
  const smsPreview = form.sms_template
    ? buildSMSMessage(
        form.sms_template,
        { first_name: 'Marie', nights: 2, room_number: '204' },
        form.name || 'Mon Hôtel',
        'exemple123'
      ) + '\nSTOP au 36111'
    : '';
  const smsLength = smsPreview.length;
  const smsSegments = countSMSSegments(smsPreview);

  const SECTIONS: { key: Section; icon: React.ReactNode; label: string }[] = [
    { key: 'hotel', icon: <Building size={16} />, label: 'Établissement' },
    { key: 'sms', icon: <MessageSquare size={16} />, label: 'SMS' },
    { key: 'compliance', icon: <Shield size={16} />, label: 'Conformité' },
    { key: 'subscription', icon: <CreditCard size={16} />, label: 'Abonnement' },
  ];

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
      <div className="flex gap-8">
        {/* Sidebar nav */}
        <div className="w-52 shrink-0">
          <nav className="space-y-1">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
                style={section === s.key
                  ? { backgroundColor: '#F5EDD8', color: '#2C2420' }
                  : { color: '#8A7F78' }
                }
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {section === 'hotel' && (
            <Card>
              <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}>
                Informations de l'établissement
              </h2>
              <div className="space-y-4">
                <InputField label="Nom de l'hôtel" required value={form.name || ''} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Hôtel Le Beaumont" />
                <InputField label="Adresse" value={form.address || ''} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="12 rue de la Paix" />
                <InputField label="Ville" value={form.city || ''} onChange={v => setForm(f => ({ ...f, city: v }))} placeholder="Paris" />
                <InputField label="Lien Google My Business (page avis)" value={form.google_review_url || ''} onChange={v => setForm(f => ({ ...f, google_review_url: v }))} placeholder="https://g.page/r/xxx/review" type="url" />
              </div>
            </Card>
          )}

          {section === 'sms' && (
            <Card>
              <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}>
                Configuration SMS
              </h2>
              <div className="space-y-6">
                {/* Template */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2420' }}>
                    Template SMS
                  </label>
                  <textarea
                    value={form.sms_template || ''}
                    onChange={e => setForm(f => ({ ...f, sms_template: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl text-sm resize-none outline-none"
                    style={{ border: '1px solid #EDE8E3', color: '#2C2420', backgroundColor: '#FAF7F4' }}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-wrap gap-2">
                      {TEMPLATE_VARIABLES.map(v => (
                        <button
                          key={v.var}
                          onClick={() => setForm(f => ({ ...f, sms_template: (f.sms_template || '') + v.var }))}
                          className="text-xs px-2 py-0.5 rounded-full font-mono"
                          style={{ backgroundColor: '#F5EDD8', color: '#C9A96E' }}
                          title={v.desc}
                        >
                          {v.var}
                        </button>
                      ))}
                    </div>
                    <span
                      className="text-xs font-mono"
                      style={{ color: smsLength > 160 ? '#C97A7A' : '#8A7F78' }}
                    >
                      {smsLength}/160
                    </span>
                  </div>
                  {smsLength > 160 && (
                    <p className="text-xs mt-1" style={{ color: '#C97A7A' }}>
                      {smsSegments} segments — coût x{smsSegments}
                    </p>
                  )}
                </div>

                {/* SMS Preview */}
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: '#2C2420' }}>Prévisualisation :</p>
                  <div
                    className="p-4 rounded-xl text-sm font-mono"
                    style={{ backgroundColor: '#FAF7F4', border: '1px solid #EDE8E3', color: '#2C2420', whiteSpace: 'pre-line' }}
                  >
                    {smsPreview || '—'}
                  </div>
                </div>

                {/* Delay */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2420' }}>
                      Délai après checkout (heures)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="72"
                      value={form.sms_delay_hours || 0}
                      onChange={e => setForm(f => ({ ...f, sms_delay_hours: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ border: '1px solid #EDE8E3', color: '#2C2420', backgroundColor: '#FAF7F4' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2420' }}>
                      Note minimale pour Google (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={form.rating_threshold || 4}
                      onChange={e => setForm(f => ({ ...f, rating_threshold: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ border: '1px solid #EDE8E3', color: '#2C2420', backgroundColor: '#FAF7F4' }}
                    />
                  </div>
                </div>

                {/* Send hours */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2420' }}>
                      Heure min d'envoi
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="12"
                      value={form.sms_send_hour_start || 8}
                      onChange={e => setForm(f => ({ ...f, sms_send_hour_start: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ border: '1px solid #EDE8E3', color: '#2C2420', backgroundColor: '#FAF7F4' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2420' }}>
                      Heure max d'envoi
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="23"
                      value={form.sms_send_hour_end || 22}
                      onChange={e => setForm(f => ({ ...f, sms_send_hour_end: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ border: '1px solid #EDE8E3', color: '#2C2420', backgroundColor: '#FAF7F4' }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {section === 'compliance' && (
            <Card>
              <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}>
                Conformité CNIL &amp; Opt-outs
              </h2>
              {loadingOptOuts ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#C9A96E', borderTopColor: 'transparent' }} />
                </div>
              ) : optOuts.length === 0 ? (
                <div
                  className="p-6 rounded-xl text-center"
                  style={{ backgroundColor: '#FAF7F4', border: '1px solid #EDE8E3' }}
                >
                  <p className="text-sm" style={{ color: '#8A7F78' }}>
                    Aucun numéro en liste d'opposition.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm mb-4" style={{ color: '#8A7F78' }}>
                    {optOuts.length} numéro{optOuts.length > 1 ? 's' : ''} en liste d'opposition (STOP)
                  </p>
                  {optOuts.map(opt => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ backgroundColor: '#FAF7F4', border: '1px solid #EDE8E3' }}
                    >
                      <div>
                        <p className="text-sm font-mono" style={{ color: '#2C2420' }}>{opt.phone}</p>
                        {opt.reason && <p className="text-xs" style={{ color: '#8A7F78' }}>{opt.reason}</p>}
                      </div>
                      <p className="text-xs" style={{ color: '#8A7F78' }}>
                        {new Date(opt.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div
                className="mt-6 p-4 rounded-xl"
                style={{ backgroundColor: '#F5EDD8', border: '1px solid #EDE8E3' }}
              >
                <p className="text-sm font-medium mb-1" style={{ color: '#2C2420' }}>Règles CNIL respectées</p>
                <ul className="text-xs space-y-1" style={{ color: '#8A7F78' }}>
                  <li>• Envoi uniquement lun–sam, 8h–22h</li>
                  <li>• STOP au 36111 inclus dans chaque SMS</li>
                  <li>• Opt-out immédiat sur réponse STOP</li>
                  <li>• Relation commerciale directe (séjour hôtel)</li>
                </ul>
              </div>
            </Card>
          )}

          {section === 'subscription' && (
            <Card>
              <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}>
                Abonnement
              </h2>
              {hotel && (
                <div className="space-y-4">
                  <div
                    className="p-6 rounded-xl"
                    style={{ backgroundColor: '#F5EDD8', border: '1px solid #EDE8E3' }}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#8A7F78' }}>
                      Plan actuel
                    </p>
                    <p
                      className="text-2xl font-bold capitalize"
                      style={{ fontFamily: 'Playfair Display, serif', color: '#C9A96E' }}
                    >
                      {hotel.plan}
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#8A7F78' }}>
                      {hotel.plan === 'starter' ? '49€/mois' : hotel.plan === 'pro' ? '79€/mois' : 'Sur devis'}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    leftIcon={<CreditCard size={16} />}
                    onClick={() => window.open('/billing', '_blank')}
                  >
                    Gérer l'abonnement (Stripe)
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Save button */}
          {(section === 'hotel' || section === 'sms') && (
            <div className="flex items-center gap-4">
              <Button
                onClick={handleSave}
                loading={saving}
                leftIcon={<Save size={16} />}
                size="lg"
              >
                Enregistrer les modifications
              </Button>
              {saved && (
                <span className="text-sm" style={{ color: '#7EB5A6' }}>
                  ✓ Modifications enregistrées
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}

function InputField({ label, value, onChange, placeholder, required, type = 'text' }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2420' }}>
        {label}
        {required && <span style={{ color: '#C97A7A' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ border: '1px solid #EDE8E3', color: '#2C2420', backgroundColor: '#FAF7F4' }}
        onFocus={e => { e.target.style.borderColor = '#C9A96E'; }}
        onBlur={e => { e.target.style.borderColor = '#EDE8E3'; }}
      />
    </div>
  );
}
