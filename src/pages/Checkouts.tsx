import React, { useState, useEffect } from 'react';
import { Upload, Send, RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import CSVUpload from '../components/csv/CSVUpload';
import CSVMapping from '../components/csv/CSVMapping';
import CSVValidation from '../components/csv/CSVValidation';
import CSVConfirm from '../components/csv/CSVConfirm';
import { useHotel } from '../hooks/useHotel';
import { supabase } from '../lib/supabase';
import type { Guest, ColumnMapping, CSVRow } from '../types';
import type { ParsedCSV } from '../lib/csvUtils';
import { detectColumns } from '../lib/csvUtils';
import { formatDateFR, formatDateTime } from '../lib/dateUtils';
import { formatPhoneDisplay } from '../lib/phoneUtils';
import { previewSMS } from '../lib/sms';

type ImportStep = 1 | 2 | 3 | 4;
type DelayOption = 'now' | '1h' | '2h' | 'evening';

const STEP_LABELS = ['Upload', 'Mapping', 'Validation', 'Confirmation'];

export default function Checkouts() {
  const { hotel } = useHotel();
  const today = new Date().toISOString().split('T')[0];

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState<Guest | null>(null);
  const [importStep, setImportStep] = useState<ImportStep>(1);
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [mapping, setMapping] = useState<ColumnMapping>({
    first_name: null, phone: null, checkout_date: null,
    email: null, room_number: null, nights: null,
  });
  const [validRows, setValidRows] = useState<CSVRow[]>([]);
  const [sendingAll, setSendingAll] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState(today);

  useEffect(() => {
    if (!hotel) return;
    fetchGuests();
  }, [hotel, dateFilter]);

  async function fetchGuests() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('guests')
        .select('*')
        .eq('hotel_id', hotel!.id)
        .eq('checkout_date', dateFilter)
        .order('created_at', { ascending: false });
      setGuests((data as Guest[]) || []);
    } finally {
      setLoading(false);
    }
  }

  // Load saved mapping from localStorage
  useEffect(() => {
    if (hotel && parsedCSV) {
      const saved = localStorage.getItem(`avisio_mapping_${hotel.id}`);
      if (saved) {
        try {
          setMapping(JSON.parse(saved));
        } catch {
          setMapping(detectColumns(parsedCSV.headers));
        }
      } else {
        setMapping(detectColumns(parsedCSV.headers));
      }
    }
  }, [hotel, parsedCSV]);

  function handleCSVParsed(result: ParsedCSV, fileName: string) {
    setParsedCSV(result);
    setCsvFileName(fileName);
    setImportStep(2);
  }

  function handleMappingChange(newMapping: ColumnMapping) {
    setMapping(newMapping);
    if (hotel) {
      localStorage.setItem(`avisio_mapping_${hotel.id}`, JSON.stringify(newMapping));
    }
  }

  async function handleImportConfirm(delay: DelayOption) {
    if (!hotel || validRows.length === 0) return;

    // Calculate scheduled_at based on delay
    const now = new Date();
    const scheduledAt = new Date(now);
    if (delay === '1h') scheduledAt.setHours(now.getHours() + 1);
    else if (delay === '2h') scheduledAt.setHours(now.getHours() + 2);
    else if (delay === 'evening') {
      scheduledAt.setHours(19, 0, 0, 0);
      if (scheduledAt <= now) scheduledAt.setDate(scheduledAt.getDate() + 1);
    }

    // Create import batch
    const { data: batch } = await supabase
      .from('import_batches')
      .insert({
        hotel_id: hotel.id,
        file_name: csvFileName,
        total_rows: parsedCSV!.rows.length,
        valid_rows: validRows.length,
        invalid_rows: parsedCSV!.rows.length - validRows.length,
        status: 'processing',
      })
      .select()
      .single();

    // Insert guests
    const guestRecords = validRows.map(row => {
      const firstName = mapping.first_name ? row[mapping.first_name] : '';
      const phone = mapping.phone ? row[mapping.phone] : '';
      const checkoutDate = mapping.checkout_date ? row[mapping.checkout_date] : '';
      const email = mapping.email ? row[mapping.email] : null;
      const roomNumber = mapping.room_number ? row[mapping.room_number] : null;
      const nights = mapping.nights ? parseInt(row[mapping.nights]) : null;

      return {
        hotel_id: hotel.id,
        first_name: firstName,
        phone: phone,
        email: email || null,
        checkout_date: checkoutDate,
        room_number: roomNumber || null,
        nights: nights && !isNaN(nights) ? nights : null,
        import_batch_id: batch?.id || null,
        sms_status: delay === 'now' ? 'scheduled' : 'scheduled',
      };
    });

    await supabase.from('guests').insert(guestRecords);

    // Update batch status
    if (batch) {
      await supabase
        .from('import_batches')
        .update({ status: 'completed' })
        .eq('id', batch.id);
    }

    setShowImportModal(false);
    setImportStep(1);
    setParsedCSV(null);
    fetchGuests();
  }

  async function sendSMS(guest: Guest) {
    setSmsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-sms', {
        body: { guest_id: guest.id, hotel_id: hotel!.id },
      });
      if (!error) {
        await supabase
          .from('guests')
          .update({ sms_status: 'scheduled' })
          .eq('id', guest.id);
        setShowSMSModal(null);
        fetchGuests();
      }
    } finally {
      setSmsLoading(false);
    }
  }

  async function sendAllPending() {
    if (!hotel) return;
    setSendingAll(true);
    try {
      const pending = guests.filter(g => g.sms_status === 'pending');
      for (const guest of pending) {
        await supabase
          .from('guests')
          .update({ sms_status: 'scheduled' })
          .eq('id', guest.id);
      }
      fetchGuests();
    } finally {
      setSendingAll(false);
    }
  }

  const pendingCount = guests.filter(g => g.sms_status === 'pending').length;

  const canProceedStep2 = mapping.first_name && mapping.phone && mapping.checkout_date;

  return (
    <Layout title="Départs du jour">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-sm outline-none"
              style={{ border: '1px solid #EDE8E3', color: '#2C2420', backgroundColor: 'white' }}
            />
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={fetchGuests}
            >
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                loading={sendingAll}
                leftIcon={<Send size={14} />}
                onClick={sendAllPending}
                className="flex-1 sm:flex-none"
              >
                {pendingCount} SMS en attente
              </Button>
            )}
            <Button
              leftIcon={<Upload size={16} />}
              onClick={() => { setShowImportModal(true); setImportStep(1); }}
              className="flex-1 sm:flex-none"
            >
              Importer CSV
            </Button>
          </div>
        </div>

        {/* Guests list */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #EDE8E3' }}>
            <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: '#C9A96E', borderTopColor: 'transparent' }} />
          </div>
        ) : guests.length === 0 ? (
          <div className="bg-white rounded-2xl" style={{ border: '1px solid #EDE8E3' }}>
            <EmptyState
              icon={<Upload size={28} />}
              title="Aucun départ importé"
              description="Importez un fichier CSV pour voir les clients du jour et envoyer des SMS automatiquement."
              action={{ label: 'Importer un CSV', onClick: () => setShowImportModal(true) }}
            />
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="md:hidden space-y-3">
              {guests.map(guest => (
                <div
                  key={guest.id}
                  className="bg-white rounded-2xl p-4"
                  style={{ border: '1px solid #EDE8E3', boxShadow: '0 1px 6px rgba(44,36,32,0.06)' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ backgroundColor: 'rgba(201,169,110,0.12)', color: '#B8800E' }}
                      >
                        {guest.first_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#2C2420' }}>
                          {guest.first_name}
                          {guest.room_number && (
                            <span className="ml-1.5 text-xs font-normal" style={{ color: '#8A7F78' }}>Ch. {guest.room_number}</span>
                          )}
                        </p>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: '#8A7F78' }}>
                          {formatPhoneDisplay(guest.phone)}
                        </p>
                      </div>
                    </div>
                    <Badge status={guest.sms_status} />
                  </div>
                  {guest.sms_status === 'pending' && (
                    <button
                      onClick={() => setShowSMSModal(guest)}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      style={{ backgroundColor: '#FEF3E2', color: '#B8800E', border: '1px solid rgba(201,169,110,0.3)' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDECD0'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FEF3E2'; }}
                    >
                      <Send size={14} />
                      Envoyer SMS
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EDE8E3' }}>
              <table className="w-full">
                <thead style={{ backgroundColor: '#FAF7F4' }}>
                  <tr>
                    {['Client', 'Chambre', 'Téléphone', 'Date départ', 'Statut SMS', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#8A7F78' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guests.map(guest => (
                    <tr
                      key={guest.id}
                      style={{ borderTop: '1px solid #EDE8E3', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFA'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: 'rgba(201,169,110,0.12)', color: '#B8800E' }}
                          >
                            {guest.first_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold" style={{ color: '#2C2420' }}>
                            {guest.first_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#8A7F78' }}>
                        {guest.room_number || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono" style={{ color: '#2C2420' }}>
                        {formatPhoneDisplay(guest.phone)}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#8A7F78' }}>
                        {formatDateFR(guest.checkout_date)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={guest.sms_status} />
                      </td>
                      <td className="px-6 py-4">
                        {guest.sms_status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Send size={12} />}
                            onClick={() => setShowSMSModal(guest)}
                          >
                            Envoyer SMS
                          </Button>
                        )}
                        {guest.sms_status === 'sent' && guest.sms_sent_at && (
                          <span className="text-xs" style={{ color: '#8A7F78' }}>
                            {formatDateTime(guest.sms_sent_at)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Import modal */}
      <Modal
        open={showImportModal}
        onClose={() => { setShowImportModal(false); setImportStep(1); }}
        title="Importer des départs CSV"
        size="xl"
      >
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEP_LABELS.map((label, i) => {
            const step = (i + 1) as ImportStep;
            const active = importStep === step;
            const done = importStep > step;
            return (
              <React.Fragment key={step}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={
                      done ? { backgroundColor: '#7EB5A6', color: 'white' }
                      : active ? { backgroundColor: '#C9A96E', color: 'white' }
                      : { backgroundColor: '#EDE8E3', color: '#8A7F78' }
                    }
                  >
                    {done ? '✓' : step}
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: active ? '#2C2420' : '#8A7F78' }}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className="flex-1 h-px" style={{ backgroundColor: '#EDE8E3' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {importStep === 1 && (
          <CSVUpload onParsed={handleCSVParsed} />
        )}

        {importStep === 2 && parsedCSV && (
          <>
            <CSVMapping
              headers={parsedCSV.headers}
              preview={parsedCSV.rows}
              mapping={mapping}
              onChange={handleMappingChange}
            />
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setImportStep(1)}>
                Retour
              </Button>
              <Button
                disabled={!canProceedStep2}
                onClick={() => setImportStep(3)}
              >
                Valider les colonnes
              </Button>
            </div>
          </>
        )}

        {importStep === 3 && parsedCSV && (
          <>
            <CSVValidation
              rows={parsedCSV.rows}
              mapping={mapping}
              onValidated={(rows) => setValidRows(rows)}
            />
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setImportStep(2)}>
                Retour
              </Button>
              <Button
                disabled={validRows.length === 0}
                onClick={() => setImportStep(4)}
              >
                Continuer avec {validRows.length} lignes valides
              </Button>
            </div>
          </>
        )}

        {importStep === 4 && hotel && (
          <CSVConfirm
            validCount={validRows.length}
            hotel={hotel}
            onConfirm={handleImportConfirm}
          />
        )}
      </Modal>

      {/* SMS send modal */}
      {showSMSModal && hotel && (
        <Modal
          open={true}
          onClose={() => setShowSMSModal(null)}
          title="Envoyer un SMS"
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#2C2420' }}>Destinataire</p>
              <p className="text-sm" style={{ color: '#8A7F78' }}>
                {showSMSModal.first_name} · {formatPhoneDisplay(showSMSModal.phone)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#2C2420' }}>Message</p>
              <div
                className="p-3 rounded-xl text-sm font-mono"
                style={{ backgroundColor: '#FAF7F4', border: '1px solid #EDE8E3', color: '#2C2420', whiteSpace: 'pre-line' }}
              >
                {previewSMS(showSMSModal, hotel)}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowSMSModal(null)}>
                Annuler
              </Button>
              <Button
                className="flex-1"
                loading={smsLoading}
                leftIcon={<Send size={16} />}
                onClick={() => sendSMS(showSMSModal)}
              >
                Envoyer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
