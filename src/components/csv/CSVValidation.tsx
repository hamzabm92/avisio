import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { ColumnMapping, ValidationResult, CSVRow } from '../../types';
import { validateGuestRow } from '../../lib/csvUtils';

type Filter = 'all' | 'valid' | 'errors';

interface CSVValidationProps {
  rows: CSVRow[];
  mapping: ColumnMapping;
  optOutPhones?: Set<string>;
  onValidated: (validRows: CSVRow[], validationResults: ValidationResult[]) => void;
}

export default function CSVValidation({ rows, mapping, optOutPhones = new Set(), onValidated }: CSVValidationProps) {
  const [filter, setFilter] = useState<Filter>('all');

  const results = rows.map(row => ({
    row,
    result: validateGuestRow(row, mapping, optOutPhones),
  }));

  const validCount = results.filter(r => r.result.valid).length;
  const invalidCount = results.filter(r => !r.result.valid).length;

  // Notify parent
  React.useEffect(() => {
    const validRows = results.filter(r => r.result.valid).map(r => r.row);
    const validResults = results.filter(r => r.result.valid).map(r => r.result);
    onValidated(validRows, validResults);
  }, [rows.length, mapping.first_name, mapping.phone, mapping.checkout_date]);

  const filtered = results.filter(r => {
    if (filter === 'valid') return r.result.valid;
    if (filter === 'errors') return !r.result.valid;
    return true;
  });

  const previewValue = (row: CSVRow, colKey: keyof ColumnMapping) => {
    const col = mapping[colKey];
    return col ? row[col] || '—' : '—';
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ backgroundColor: '#FAF7F4', border: '1px solid #EDE8E3' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8F4F1' }}>
            <CheckCircle size={20} style={{ color: '#7EB5A6' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}>
              {validCount}
            </p>
            <p className="text-xs" style={{ color: '#8A7F78' }}>Valides</p>
          </div>
        </div>
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ backgroundColor: '#FAF7F4', border: '1px solid #EDE8E3' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F9EDEC' }}>
            <XCircle size={20} style={{ color: '#C97A7A' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}>
              {invalidCount}
            </p>
            <p className="text-xs" style={{ color: '#8A7F78' }}>Erreurs</p>
          </div>
        </div>
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ backgroundColor: '#FAF7F4', border: '1px solid #EDE8E3' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5EDD8' }}>
            <AlertTriangle size={20} style={{ color: '#C9A96E' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2C2420' }}>
              {rows.length}
            </p>
            <p className="text-xs" style={{ color: '#8A7F78' }}>Total lignes</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'valid', 'errors'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={filter === f
              ? { backgroundColor: '#C9A96E', color: 'white' }
              : { backgroundColor: '#FAF7F4', color: '#8A7F78', border: '1px solid #EDE8E3' }
            }
          >
            {f === 'all' ? 'Tous' : f === 'valid' ? 'Valides' : 'Erreurs'}
            {' '}({f === 'all' ? rows.length : f === 'valid' ? validCount : invalidCount})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #EDE8E3', maxHeight: '360px' }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0" style={{ backgroundColor: '#FAF7F4' }}>
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: '#8A7F78' }}>Statut</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: '#8A7F78' }}>Prénom</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: '#8A7F78' }}>Téléphone</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: '#8A7F78' }}>Date départ</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: '#8A7F78' }}>Erreurs</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ row, result }, i) => (
              <tr key={i} style={{ borderTop: '1px solid #EDE8E3' }}>
                <td className="px-4 py-2.5">
                  {result.valid
                    ? <CheckCircle size={16} style={{ color: '#7EB5A6' }} />
                    : <XCircle size={16} style={{ color: '#C97A7A' }} />
                  }
                </td>
                <td className="px-4 py-2.5 text-xs" style={{ color: '#2C2420' }}>{previewValue(row, 'first_name')}</td>
                <td className="px-4 py-2.5 text-xs font-mono" style={{ color: '#2C2420' }}>{previewValue(row, 'phone')}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: '#2C2420' }}>{previewValue(row, 'checkout_date')}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: '#C97A7A' }}>
                  {result.errors.join(', ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
