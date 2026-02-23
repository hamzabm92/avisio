import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowRight, Smartphone, Building, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { buildSMSMessage } from '../lib/csvUtils';

type OnboardingStep = 1 | 2 | 3;

const DEFAULT_TEMPLATE = 'Bonjour {prenom}, merci pour votre séjour au {hotel} 🌟 Votre avis nous aide beaucoup → {lien}';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<OnboardingStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 data
  const [hotelName, setHotelName] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');

  // Step 2 data
  const [smsTemplate, setSmsTemplate] = useState(DEFAULT_TEMPLATE);
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Created hotel id
  const [hotelId, setHotelId] = useState('');

  const smsPreview = buildSMSMessage(
    smsTemplate,
    { first_name: 'Marie', nights: 2 },
    hotelName || 'Mon Hôtel',
    'exemple123'
  ) + '\nSTOP au 36111';

  async function handleStep1() {
    if (!hotelName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: dbError } = await supabase
        .from('hotels')
        .insert({
          owner_id: user!.id,
          name: hotelName.trim(),
          google_review_url: googleUrl.trim() || null,
          sms_template: DEFAULT_TEMPLATE,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      setHotelId(data.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2Save() {
    if (!hotelId) return;
    setLoading(true);
    try {
      await supabase
        .from('hotels')
        .update({ sms_template: smsTemplate })
        .eq('id', hotelId);
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  async function sendTestSMS() {
    if (!testPhone) return;
    setSendingTest(true);
    try {
      await supabase.functions.invoke('send-sms', {
        body: { test: true, phone: testPhone, message: smsPreview },
      });
      setTestSent(true);
    } finally {
      setSendingTest(false);
    }
  }

  function handleFinish() {
    navigate('/checkouts');
  }

  const STEPS = [
    { icon: <Building size={20} />, label: 'Votre hôtel' },
    { icon: <Smartphone size={20} />, label: 'SMS template' },
    { icon: <Upload size={20} />, label: 'Premier import' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FAF7F4' }}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#2C2420' }}
          >
            <MessageSquare size={24} color="#C9A96E" />
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}
          >
            Configurer Avisio
          </h1>
          <p className="text-sm" style={{ color: '#8A7F78' }}>
            Votre premier SMS partira dans quelques minutes
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const stepNum = (i + 1) as OnboardingStep;
            const active = step === stepNum;
            const done = step > stepNum;
            return (
              <React.Fragment key={stepNum}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={done
                      ? { backgroundColor: '#7EB5A6', color: 'white' }
                      : active
                      ? { backgroundColor: '#C9A96E', color: 'white' }
                      : { backgroundColor: '#EDE8E3', color: '#8A7F78' }
                    }
                  >
                    {done ? '✓' : stepNum}
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: active ? '#2C2420' : '#8A7F78' }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px" style={{ backgroundColor: '#EDE8E3' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid #EDE8E3' }}>
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}>
                Votre établissement
              </h2>

              {error && (
                <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: '#F9EDEC', color: '#C97A7A' }}>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2420' }}>
                  Nom de l'hôtel <span style={{ color: '#C97A7A' }}>*</span>
                </label>
                <input
                  type="text"
                  value={hotelName}
                  onChange={e => setHotelName(e.target.value)}
                  placeholder="Hôtel Le Beaumont"
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #EDE8E3', backgroundColor: 'white', color: '#2C2420' }}
                  onFocus={e => { e.target.style.borderColor = '#C9A96E'; }}
                  onBlur={e => { e.target.style.borderColor = '#EDE8E3'; }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2420' }}>
                  Lien Google My Business (page d'avis)
                </label>
                <input
                  type="url"
                  value={googleUrl}
                  onChange={e => setGoogleUrl(e.target.value)}
                  placeholder="https://g.page/r/xxx/review"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid #EDE8E3', backgroundColor: 'white', color: '#2C2420' }}
                  onFocus={e => { e.target.style.borderColor = '#C9A96E'; }}
                  onBlur={e => { e.target.style.borderColor = '#EDE8E3'; }}
                />
                <p className="text-xs mt-1" style={{ color: '#8A7F78' }}>
                  Trouvez ce lien dans Google Business Profile → Demander des avis
                </p>
              </div>

              <Button
                onClick={handleStep1}
                loading={loading}
                disabled={!hotelName.trim()}
                className="w-full"
                size="lg"
                rightIcon={<ArrowRight size={16} />}
              >
                Continuer
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}>
                Votre message SMS
              </h2>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2420' }}>
                  Template
                </label>
                <textarea
                  value={smsTemplate}
                  onChange={e => setSmsTemplate(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none outline-none"
                  style={{ border: '1px solid #EDE8E3', color: '#2C2420', backgroundColor: 'white' }}
                />
                <p className="text-xs mt-1" style={{ color: '#8A7F78' }}>
                  Variables : {'{prenom}'} {'{hotel}'} {'{lien}'} {'{nuits}'} {'{chambre}'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2" style={{ color: '#2C2420' }}>Prévisualisation :</p>
                <div
                  className="p-4 rounded-xl text-sm font-mono"
                  style={{ backgroundColor: '#FAF7F4', border: '1px solid #EDE8E3', color: '#2C2420', whiteSpace: 'pre-line' }}
                >
                  {smsPreview}
                </div>
                <p className="text-xs mt-1 text-right" style={{ color: '#8A7F78' }}>
                  {smsPreview.length} caractères
                </p>
              </div>

              {/* Test SMS */}
              <div className="pt-2">
                <p className="text-sm font-medium mb-2" style={{ color: '#2C2420' }}>
                  Tester avec votre propre numéro :
                </p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid #EDE8E3', color: '#2C2420', backgroundColor: 'white' }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={sendingTest}
                    disabled={!testPhone}
                    onClick={sendTestSMS}
                  >
                    Envoyer test
                  </Button>
                </div>
                {testSent && (
                  <p className="text-xs mt-1" style={{ color: '#7EB5A6' }}>
                    ✓ SMS de test envoyé !
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                  Retour
                </Button>
                <Button
                  loading={loading}
                  className="flex-1"
                  rightIcon={<ArrowRight size={16} />}
                  onClick={handleStep2Save}
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}>
                Importer vos premiers départs
              </h2>

              <div
                className="p-6 rounded-xl text-center"
                style={{ backgroundColor: '#F5EDD8', border: '1px solid #EDE8E3' }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: '#C9A96E' }}
                >
                  <Upload size={20} color="white" />
                </div>
                <p className="font-medium mb-1" style={{ color: '#2C2420' }}>
                  Exportez la liste des départs du jour depuis votre PMS
                </p>
                <p className="text-sm" style={{ color: '#8A7F78' }}>
                  Format CSV (virgule ou point-virgule) avec au minimum : prénom, téléphone, date de départ
                </p>
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: '#E8F4F1', border: '1px solid #B8DDD6' }}>
                <p className="text-sm font-medium" style={{ color: '#5B9B8B' }}>
                  ✓ Avisio est configuré et prêt !
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#7EB5A6' }}>
                  Allez sur la page Départs pour importer votre premier CSV.
                </p>
              </div>

              <Button
                onClick={handleFinish}
                className="w-full"
                size="lg"
                rightIcon={<ArrowRight size={16} />}
              >
                Aller aux départs du jour
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
