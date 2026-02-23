import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { parseCSV } from '../../lib/csvUtils';
import type { ParsedCSV } from '../../lib/csvUtils';

interface CSVUploadProps {
  onParsed: (result: ParsedCSV, fileName: string) => void;
}

const PMS_TIPS = [
  { name: 'Misterbooking', tip: 'Exportez depuis Planning > Départs > Exporter CSV' },
  { name: 'Cloudbeds', tip: 'Reports > Guest Report > Export to CSV' },
  { name: 'Mews', tip: 'Reservations > Export > CSV' },
  { name: 'Opera', tip: 'Reports > Departure List > Export' },
];

export default function CSVUpload({ onParsed }: CSVUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setError('');
    setLoading(true);

    if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
      setError('Seuls les fichiers CSV sont acceptés.');
      setLoading(false);
      return;
    }

    try {
      const text = await file.text();
      const result = parseCSV(text);

      if (result.headers.length === 0) {
        setError('Le fichier CSV semble vide ou invalide.');
        return;
      }
      if (result.rows.length === 0) {
        setError('Aucune ligne de données trouvée dans le CSV.');
        return;
      }

      onParsed(result, file.name);
    } catch {
      setError('Impossible de lire le fichier. Vérifiez qu\'il est encodé en UTF-8.');
    } finally {
      setLoading(false);
    }
  }, [onParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="relative rounded-2xl border-2 border-dashed transition-all text-center p-12 cursor-pointer"
        style={{
          borderColor: dragOver ? '#C9A96E' : '#EDE8E3',
          backgroundColor: dragOver ? '#F5EDD8' : '#FAF7F4',
        }}
        onClick={() => document.getElementById('csv-file-input')?.click()}
      >
        <input
          id="csv-file-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileInput}
        />
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: '#F5EDD8', color: '#C9A96E' }}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#C9A96E', borderTopColor: 'transparent' }} />
          ) : (
            <Upload size={28} />
          )}
        </div>
        <p className="font-semibold mb-1" style={{ color: '#2C2420' }}>
          Glissez votre fichier CSV ici
        </p>
        <p className="text-sm" style={{ color: '#8A7F78' }}>
          ou cliquez pour sélectionner un fichier
        </p>
        <p className="text-xs mt-2" style={{ color: '#8A7F78' }}>
          CSV (virgule ou point-virgule) · UTF-8 · Taille max 5 Mo
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: '#F9EDEC', color: '#C97A7A' }}>
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* PMS tips */}
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: '#8A7F78' }}>
          Comment exporter depuis votre PMS :
        </p>
        <div className="grid grid-cols-2 gap-3">
          {PMS_TIPS.map(pms => (
            <div
              key={pms.name}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ backgroundColor: '#FAF7F4', border: '1px solid #EDE8E3' }}
            >
              <FileText size={16} style={{ color: '#C9A96E' }} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium" style={{ color: '#2C2420' }}>{pms.name}</p>
                <p className="text-xs" style={{ color: '#8A7F78' }}>{pms.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
