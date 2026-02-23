import { useState } from 'react';
import { MessageSquare, Clock, Shield, CheckSquare } from 'lucide-react';
import Button from '../ui/Button';
import type { Hotel } from '../../types';
import { buildSMSMessage, countSMSSegments } from '../../lib/csvUtils';

type DelayOption = 'now' | '1h' | '2h' | 'evening';

interface CSVConfirmProps {
  validCount: number;
  hotel: Hotel;
  onConfirm: (delay: DelayOption) => Promise<void>;
}

const DELAY_OPTIONS: { value: DelayOption; label: string; description: string }[] = [
  { value: 'now', label: 'Immédiatement', description: 'Envoi dès maintenant' },
  { value: '1h', label: 'Dans 1 heure', description: 'Report d\'1h' },
  { value: '2h', label: 'Dans 2 heures', description: 'Délai recommandé' },
  { value: 'evening', label: 'Ce soir à 19h', description: 'Envoi en soirée' },
];

const COMPLIANCE_ITEMS = [
  'Je confirme avoir obtenu le consentement des clients pour recevoir des SMS commerciaux',
  'Les données sont issues d\'une relation commerciale directe (réservation d\'hôtel)',
  'Chaque SMS inclut une option de désinscription (STOP)',
  'Les données seront supprimées après 3 ans conformément au RGPD',
];

export default function CSVConfirm({ validCount, hotel, onConfirm }: CSVConfirmProps) {
  const [delay, setDelay] = useState<DelayOption>('2h');
  const [checklist, setChecklist] = useState<boolean[]>(COMPLIANCE_ITEMS.map(() => false));
  const [loading, setLoading] = useState(false);

  const allChecked = checklist.every(Boolean);

  // Preview SMS with dummy guest
  const previewMsg = buildSMSMessage(
    hotel.sms_template,
    { first_name: 'Marie', nights: 2, room_number: '102' },
    hotel.name,
    'abc123'
  ) + '\nSTOP au 36111';

  const smsLength = previewMsg.length;
  const segments = countSMSSegments(previewMsg);
  const estimatedCost = (validCount * 0.07).toFixed(2);

  async function handleSubmit() {
    setLoading(true);
    try {
      await onConfirm(delay);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div
        className="rounded-xl p-4 flex items-center gap-4"
        style={{ backgroundColor: '#F5EDD8', border: '1px solid #EDE8E3' }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#C9A96E' }}
        >
          <MessageSquare size={22} color="white" />
        </div>
        <div>
          <p className="font-semibold" style={{ color: '#2C2420' }}>
            {validCount} SMS à envoyer
          </p>
          <p className="text-sm" style={{ color: '#8A7F78' }}>
            Coût estimé : ~{estimatedCost}€ · {smsLength} caractères · {segments} segment{segments > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* SMS Preview */}
      <div>
        <p className="text-sm font-medium mb-2" style={{ color: '#2C2420' }}>
          Aperçu du SMS personnalisé :
        </p>
        <div
          className="rounded-xl p-4 font-mono text-sm"
          style={{ backgroundColor: '#FAF7F4', border: '1px solid #EDE8E3', color: '#2C2420', whiteSpace: 'pre-line' }}
        >
          {previewMsg}
        </div>
        {smsLength > 160 && (
          <p className="text-xs mt-1" style={{ color: '#C97A7A' }}>
            ⚠ Message trop long ({smsLength} chars) — sera envoyé en {segments} parties
          </p>
        )}
      </div>

      {/* Delay selection */}
      <div>
        <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: '#2C2420' }}>
          <Clock size={16} />
          Délai d'envoi
        </p>
        <div className="grid grid-cols-2 gap-3">
          {DELAY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDelay(opt.value)}
              className="flex flex-col items-start p-3 rounded-xl text-left transition-all"
              style={delay === opt.value
                ? { border: '2px solid #C9A96E', backgroundColor: '#F5EDD8' }
                : { border: '1px solid #EDE8E3', backgroundColor: '#FAF7F4' }
              }
            >
              <span className="text-sm font-medium" style={{ color: '#2C2420' }}>{opt.label}</span>
              <span className="text-xs" style={{ color: '#8A7F78' }}>{opt.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compliance checklist */}
      <div>
        <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: '#2C2420' }}>
          <Shield size={16} />
          Conformité CNIL — À confirmer avant envoi
        </p>
        <div className="space-y-2">
          {COMPLIANCE_ITEMS.map((item, i) => (
            <label
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
              style={{
                backgroundColor: checklist[i] ? '#F5EDD8' : '#FAF7F4',
                border: '1px solid #EDE8E3',
              }}
            >
              <input
                type="checkbox"
                checked={checklist[i]}
                onChange={e => {
                  const newChecklist = [...checklist];
                  newChecklist[i] = e.target.checked;
                  setChecklist(newChecklist);
                }}
                className="mt-0.5"
                style={{ accentColor: '#C9A96E' }}
              />
              <span className="text-xs" style={{ color: '#2C2420' }}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        loading={loading}
        disabled={!allChecked}
        className="w-full"
        size="lg"
        leftIcon={<CheckSquare size={18} />}
      >
        Lancer l'envoi de {validCount} SMS
      </Button>

      {!allChecked && (
        <p className="text-xs text-center" style={{ color: '#8A7F78' }}>
          Cochez toutes les cases de conformité pour continuer
        </p>
      )}
    </div>
  );
}
