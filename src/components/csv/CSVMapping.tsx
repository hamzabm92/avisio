import { CheckCircle } from 'lucide-react';
import type { ColumnMapping, CSVRow } from '../../types';

interface CSVMappingProps {
  headers: string[];
  preview: CSVRow[];
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
}

const FIELDS: { key: keyof ColumnMapping; label: string; required: boolean; description: string }[] = [
  { key: 'first_name', label: 'Prénom', required: true, description: 'Prénom du client' },
  { key: 'phone', label: 'Téléphone', required: true, description: 'Numéro mobile français' },
  { key: 'checkout_date', label: 'Date de départ', required: true, description: 'Date du checkout' },
  { key: 'email', label: 'Email', required: false, description: 'Adresse email (optionnel)' },
  { key: 'room_number', label: 'Numéro de chambre', required: false, description: 'N° chambre (optionnel)' },
  { key: 'nights', label: 'Nombre de nuits', required: false, description: 'Durée du séjour (optionnel)' },
];

export default function CSVMapping({ headers, preview, mapping, onChange }: CSVMappingProps) {
  function handleChange(field: keyof ColumnMapping, value: string) {
    onChange({ ...mapping, [field]: value || null });
  }

  return (
    <div className="space-y-6">
      {/* Field mapping */}
      <div className="space-y-3">
        <p className="text-sm" style={{ color: '#8A7F78' }}>
          Associez les colonnes de votre CSV aux champs Avisio.
          Les colonnes obligatoires sont marquées d'un *.
        </p>

        {FIELDS.map(field => (
          <div key={field.key} className="flex items-center gap-4">
            <div className="w-44 shrink-0">
              <span className="text-sm font-medium" style={{ color: '#2C2420' }}>
                {field.label}
                {field.required && <span style={{ color: '#C97A7A' }}> *</span>}
              </span>
              <p className="text-xs" style={{ color: '#8A7F78' }}>{field.description}</p>
            </div>
            <div className="flex-1">
              <select
                value={mapping[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  border: '1px solid #EDE8E3',
                  backgroundColor: mapping[field.key] ? '#F5EDD8' : '#FAF7F4',
                  color: '#2C2420',
                }}
              >
                <option value="">— Non mappé —</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            {mapping[field.key] && (
              <CheckCircle size={18} style={{ color: '#7EB5A6' }} className="shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3" style={{ color: '#2C2420' }}>
            Aperçu des 3 premières lignes :
          </p>
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #EDE8E3' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#FAF7F4' }}>
                  {headers.map(h => {
                    const isSelected = Object.values(mapping).includes(h);
                    return (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-medium"
                        style={{
                          color: isSelected ? '#C9A96E' : '#8A7F78',
                          backgroundColor: isSelected ? '#F5EDD8' : 'transparent',
                        }}
                      >
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 3).map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #EDE8E3' }}>
                    {headers.map(h => {
                      const isSelected = Object.values(mapping).includes(h);
                      return (
                        <td
                          key={h}
                          className="px-4 py-2.5 text-xs truncate max-w-[120px]"
                          style={{
                            color: '#2C2420',
                            backgroundColor: isSelected ? '#FDFAF5' : 'transparent',
                          }}
                        >
                          {row[h] || '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
