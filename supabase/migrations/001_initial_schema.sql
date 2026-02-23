-- Avisio — Initial Database Schema
-- Run this migration in your Supabase SQL editor

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  google_place_id TEXT,
  google_review_url TEXT,
  logo_url TEXT,
  sms_template TEXT DEFAULT 'Bonjour {prenom}, merci pour votre séjour au {hotel} 🌟 Votre avis nous aide beaucoup → {lien}',
  sms_delay_hours INTEGER DEFAULT 2,
  sms_send_hour_start INTEGER DEFAULT 8,
  sms_send_hour_end INTEGER DEFAULT 22,
  rating_threshold INTEGER DEFAULT 4,
  plan TEXT DEFAULT 'starter',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  checkout_date DATE NOT NULL,
  room_number TEXT,
  language TEXT DEFAULT 'fr',
  nights INTEGER,
  import_batch_id UUID,
  sms_status TEXT DEFAULT 'pending',
  sms_sent_at TIMESTAMPTZ,
  sms_delivered_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  rating_given INTEGER,
  went_to_google BOOLEAN DEFAULT FALSE,
  feedback_submitted BOOLEAN DEFAULT FALSE,
  CONSTRAINT chk_sms_status CHECK (sms_status IN ('pending','scheduled','sent','delivered','failed','opted_out'))
);

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hotel_id UUID REFERENCES hotels(id),
  guest_id UUID REFERENCES guests(id),
  twilio_sid TEXT,
  message_body TEXT,
  status TEXT,
  error_code TEXT,
  cost_eur DECIMAL(10,4),
  direction TEXT DEFAULT 'outbound'
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hotel_id UUID REFERENCES hotels(id),
  guest_id UUID REFERENCES guests(id),
  category TEXT,
  message TEXT NOT NULL,
  rating INTEGER,
  guest_phone TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  CONSTRAINT chk_category CHECK (category IN ('propreté','service','literie','bruit','technique','autre') OR category IS NULL),
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5 OR rating IS NULL)
);

CREATE TABLE IF NOT EXISTS import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hotel_id UUID REFERENCES hotels(id),
  file_name TEXT,
  total_rows INTEGER,
  valid_rows INTEGER,
  invalid_rows INTEGER,
  status TEXT DEFAULT 'pending',
  CONSTRAINT chk_batch_status CHECK (status IN ('pending','processing','completed','failed'))
);

CREATE TABLE IF NOT EXISTS opt_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hotel_id UUID REFERENCES hotels(id),
  phone TEXT NOT NULL,
  reason TEXT,
  UNIQUE(hotel_id, phone)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_guests_hotel_id ON guests(hotel_id);
CREATE INDEX IF NOT EXISTS idx_guests_checkout_date ON guests(checkout_date);
CREATE INDEX IF NOT EXISTS idx_guests_sms_status ON guests(sms_status);
CREATE INDEX IF NOT EXISTS idx_guests_hotel_checkout ON guests(hotel_id, checkout_date);
CREATE INDEX IF NOT EXISTS idx_feedbacks_hotel_id ON feedbacks(hotel_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_read ON feedbacks(is_read);
CREATE INDEX IF NOT EXISTS idx_sms_logs_hotel_id ON sms_logs(hotel_id);
CREATE INDEX IF NOT EXISTS idx_opt_outs_hotel_phone ON opt_outs(hotel_id, phone);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE opt_outs ENABLE ROW LEVEL SECURITY;

-- Hotels: owner only
DROP POLICY IF EXISTS "owner_only" ON hotels;
CREATE POLICY "owner_only" ON hotels
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Guests: via hotel ownership
DROP POLICY IF EXISTS "hotel_owner_only_select" ON guests;
DROP POLICY IF EXISTS "hotel_owner_only_insert" ON guests;
DROP POLICY IF EXISTS "hotel_owner_only_update" ON guests;
DROP POLICY IF EXISTS "hotel_owner_only_delete" ON guests;

CREATE POLICY "hotel_owner_only_select" ON guests
  FOR SELECT USING (
    hotel_id IN (SELECT id FROM hotels WHERE owner_id = auth.uid())
  );
CREATE POLICY "hotel_owner_only_insert" ON guests
  FOR INSERT WITH CHECK (
    hotel_id IN (SELECT id FROM hotels WHERE owner_id = auth.uid())
  );
CREATE POLICY "hotel_owner_only_update" ON guests
  FOR UPDATE USING (
    hotel_id IN (SELECT id FROM hotels WHERE owner_id = auth.uid())
  );
CREATE POLICY "hotel_owner_only_delete" ON guests
  FOR DELETE USING (
    hotel_id IN (SELECT id FROM hotels WHERE owner_id = auth.uid())
  );

-- Allow anonymous reads on guests (for guest landing page tracking)
DROP POLICY IF EXISTS "anon_guest_update" ON guests;
CREATE POLICY "anon_guest_update" ON guests
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- SMS logs: owner only
DROP POLICY IF EXISTS "sms_logs_owner" ON sms_logs;
CREATE POLICY "sms_logs_owner" ON sms_logs
  USING (hotel_id IN (SELECT id FROM hotels WHERE owner_id = auth.uid()));

-- Feedbacks: owner + anon insert (for guest form)
DROP POLICY IF EXISTS "feedbacks_owner_select" ON feedbacks;
DROP POLICY IF EXISTS "feedbacks_anon_insert" ON feedbacks;
DROP POLICY IF EXISTS "feedbacks_owner_update" ON feedbacks;

CREATE POLICY "feedbacks_owner_select" ON feedbacks
  FOR SELECT USING (
    hotel_id IN (SELECT id FROM hotels WHERE owner_id = auth.uid())
  );
CREATE POLICY "feedbacks_anon_insert" ON feedbacks
  FOR INSERT WITH CHECK (true);
CREATE POLICY "feedbacks_owner_update" ON feedbacks
  FOR UPDATE USING (
    hotel_id IN (SELECT id FROM hotels WHERE owner_id = auth.uid())
  );

-- Import batches: owner only
DROP POLICY IF EXISTS "import_batches_owner" ON import_batches;
CREATE POLICY "import_batches_owner" ON import_batches
  USING (hotel_id IN (SELECT id FROM hotels WHERE owner_id = auth.uid()));

-- Opt-outs: owner select + anon insert (for guest page)
DROP POLICY IF EXISTS "opt_outs_owner_select" ON opt_outs;
DROP POLICY IF EXISTS "opt_outs_anon_insert" ON opt_outs;

CREATE POLICY "opt_outs_owner_select" ON opt_outs
  FOR SELECT USING (
    hotel_id IN (SELECT id FROM hotels WHERE owner_id = auth.uid())
  );
CREATE POLICY "opt_outs_anon_insert" ON opt_outs
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to get monthly SMS stats
CREATE OR REPLACE FUNCTION get_monthly_sms_stats(p_hotel_id UUID, p_month DATE)
RETURNS TABLE (
  sent INTEGER,
  delivered INTEGER,
  clicked INTEGER,
  feedback_count INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(CASE WHEN sms_status IN ('sent','delivered') THEN 1 END)::INTEGER AS sent,
    COUNT(CASE WHEN sms_status = 'delivered' THEN 1 END)::INTEGER AS delivered,
    COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END)::INTEGER AS clicked,
    COUNT(CASE WHEN feedback_submitted = TRUE THEN 1 END)::INTEGER AS feedback_count
  FROM guests
  WHERE hotel_id = p_hotel_id
    AND DATE_TRUNC('month', checkout_date) = DATE_TRUNC('month', p_month);
END;
$$;
