import { useState, useEffect } from 'react';
import { MessageCircle, Check } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Stars from '../components/ui/Stars';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { useHotel } from '../hooks/useHotel';
import { supabase } from '../lib/supabase';
import type { Feedback, FeedbackCategory } from '../types';
import { formatDateTime } from '../lib/dateUtils';

type FilterType = 'all' | 'unread' | 'resolved';

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  'propreté': 'Propreté',
  'service': 'Service',
  'literie': 'Literie',
  'bruit': 'Bruit',
  'technique': 'Technique',
  'autre': 'Autre',
};

const CATEGORY_COLORS: Record<FeedbackCategory, string> = {
  'propreté': '#7EB5A6',
  'service': '#C9A96E',
  'literie': '#8A7F78',
  'bruit': '#C97A7A',
  'technique': '#5B9B8B',
  'autre': '#8A7F78',
};

export default function Reviews() {
  const { hotel } = useHotel();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!hotel) return;
    fetchFeedbacks();
  }, [hotel, filter]);

  async function fetchFeedbacks() {
    setLoading(true);
    try {
      let query = supabase
        .from('feedbacks')
        .select('*')
        .eq('hotel_id', hotel!.id)
        .order('created_at', { ascending: false });

      if (filter === 'unread') query = query.eq('is_read', false);
      if (filter === 'resolved') query = query.eq('is_resolved', true);

      const { data } = await query;
      setFeedbacks((data as Feedback[]) || []);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(fb: Feedback) {
    await supabase.from('feedbacks').update({ is_read: true }).eq('id', fb.id);
    setFeedbacks(prev => prev.map(f => f.id === fb.id ? { ...f, is_read: true } : f));
  }

  async function markResolved(fb: Feedback) {
    const resolved = !fb.is_resolved;
    await supabase.from('feedbacks').update({
      is_resolved: resolved,
      resolved_at: resolved ? new Date().toISOString() : null
    }).eq('id', fb.id);
    setFeedbacks(prev => prev.map(f => f.id === fb.id ? { ...f, is_resolved: resolved } : f));
    if (selectedFeedback?.id === fb.id) {
      setSelectedFeedback({ ...selectedFeedback, is_resolved: resolved });
    }
  }

  async function saveNote() {
    if (!selectedFeedback) return;
    setSavingNote(true);
    try {
      await supabase.from('feedbacks').update({ notes }).eq('id', selectedFeedback.id);
      setFeedbacks(prev => prev.map(f => f.id === selectedFeedback.id ? { ...f, notes } : f));
      setSelectedFeedback({ ...selectedFeedback, notes });
    } finally {
      setSavingNote(false);
    }
  }

  const unreadCount = feedbacks.filter(f => !f.is_read).length;

  return (
    <Layout title="Avis reçus">
      <div className="space-y-6">
        {/* Header with filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(['all', 'unread', 'resolved'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-xl text-sm font-medium transition-all"
                style={filter === f
                  ? { backgroundColor: '#C9A96E', color: 'white' }
                  : { backgroundColor: 'white', color: '#8A7F78', border: '1px solid #EDE8E3' }
                }
              >
                {f === 'all' ? 'Tous' : f === 'unread' ? `Non lus (${unreadCount})` : 'Résolus'}
              </button>
            ))}
          </div>
        </div>

        {/* Feedbacks list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-32 rounded" style={{ backgroundColor: '#F5EDD8' }} />
                  <div className="h-3 w-full rounded" style={{ backgroundColor: '#F5EDD8' }} />
                </div>
              </Card>
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-white rounded-2xl" style={{ border: '1px solid #EDE8E3' }}>
            <EmptyState
              icon={<MessageCircle size={28} />}
              title="Aucun feedback reçu"
              description="Les feedbacks apparaîtront ici quand les clients rempliront le formulaire depuis leur SMS."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map(fb => (
              <Card
                key={fb.id}
                hoverable
                onClick={() => {
                  setSelectedFeedback(fb);
                  setNotes(fb.notes || '');
                  if (!fb.is_read) markAsRead(fb);
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {!fb.is_read && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: '#C9A96E' }}
                        />
                      )}
                      {fb.category && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[fb.category as FeedbackCategory]}22`,
                            color: CATEGORY_COLORS[fb.category as FeedbackCategory] || '#8A7F78'
                          }}
                        >
                          {CATEGORY_LABELS[fb.category as FeedbackCategory] || fb.category}
                        </span>
                      )}
                      {fb.is_resolved && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: '#E8F4F1', color: '#7EB5A6' }}
                        >
                          Résolu
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-1 line-clamp-2" style={{ color: '#2C2420' }}>
                      {fb.message}
                    </p>
                    <p className="text-xs" style={{ color: '#8A7F78' }}>
                      {formatDateTime(fb.created_at)}
                      {fb.guest_phone && ` · ${fb.guest_phone}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {fb.rating && <Stars value={fb.rating} readonly size="sm" />}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Feedback detail modal */}
      {selectedFeedback && (
        <Modal
          open={true}
          onClose={() => setSelectedFeedback(null)}
          title="Détail du feedback"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {selectedFeedback.category && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: '#F5EDD8',
                    color: '#C9A96E'
                  }}
                >
                  {CATEGORY_LABELS[selectedFeedback.category as FeedbackCategory] || selectedFeedback.category}
                </span>
              )}
              {selectedFeedback.rating && (
                <Stars value={selectedFeedback.rating} readonly size="sm" />
              )}
            </div>

            <div
              className="p-4 rounded-xl text-sm"
              style={{ backgroundColor: '#FAF7F4', color: '#2C2420', border: '1px solid #EDE8E3' }}
            >
              {selectedFeedback.message}
            </div>

            <div className="text-xs" style={{ color: '#8A7F78' }}>
              Reçu le {formatDateTime(selectedFeedback.created_at)}
              {selectedFeedback.guest_phone && (
                <span> · Rappeler : {selectedFeedback.guest_phone}</span>
              )}
            </div>

            {/* Internal notes */}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: '#2C2420' }}>Notes internes</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Ajouter une note interne..."
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none outline-none"
                style={{ border: '1px solid #EDE8E3', color: '#2C2420', backgroundColor: 'white' }}
              />
              <Button
                size="sm"
                variant="secondary"
                loading={savingNote}
                onClick={saveNote}
                className="mt-2"
              >
                Sauvegarder la note
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant={selectedFeedback.is_resolved ? 'secondary' : 'primary'}
                className="flex-1"
                leftIcon={<Check size={16} />}
                onClick={() => markResolved(selectedFeedback)}
              >
                {selectedFeedback.is_resolved ? 'Rouvrir' : 'Marquer résolu'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
