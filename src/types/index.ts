export interface Hotel {
  id: string;
  created_at: string;
  owner_id: string;
  name: string;
  address: string | null;
  city: string | null;
  google_place_id: string | null;
  google_review_url: string | null;
  logo_url: string | null;
  sms_template: string;
  sms_delay_hours: number;
  sms_send_hour_start: number;
  sms_send_hour_end: number;
  rating_threshold: number;
  plan: 'starter' | 'pro' | 'enterprise';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  is_active: boolean;
}

export type SMSStatus = 'pending' | 'scheduled' | 'sent' | 'delivered' | 'failed' | 'opted_out';

export interface Guest {
  id: string;
  created_at: string;
  hotel_id: string;
  first_name: string;
  phone: string;
  email: string | null;
  checkout_date: string;
  room_number: string | null;
  language: string;
  nights: number | null;
  import_batch_id: string | null;
  sms_status: SMSStatus;
  sms_sent_at: string | null;
  sms_delivered_at: string | null;
  clicked_at: string | null;
  rating_given: number | null;
  went_to_google: boolean;
  feedback_submitted: boolean;
}

export interface SMSLog {
  id: string;
  created_at: string;
  hotel_id: string;
  guest_id: string;
  twilio_sid: string | null;
  message_body: string;
  status: string;
  error_code: string | null;
  cost_eur: number | null;
  direction: string;
}

export type FeedbackCategory = 'propreté' | 'service' | 'literie' | 'bruit' | 'technique' | 'autre';

export interface Feedback {
  id: string;
  created_at: string;
  hotel_id: string;
  guest_id: string | null;
  category: FeedbackCategory | null;
  message: string;
  rating: number | null;
  guest_phone: string | null;
  is_read: boolean;
  is_resolved: boolean;
  resolved_at: string | null;
  notes: string | null;
}

export interface ImportBatch {
  id: string;
  created_at: string;
  hotel_id: string;
  file_name: string | null;
  total_rows: number | null;
  valid_rows: number | null;
  invalid_rows: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface OptOut {
  id: string;
  created_at: string;
  hotel_id: string;
  phone: string;
  reason: string | null;
}

export interface ColumnMapping {
  first_name: string | null;
  phone: string | null;
  checkout_date: string | null;
  email: string | null;
  room_number: string | null;
  nights: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: Partial<Guest>;
}

export interface CSVRow {
  [key: string]: string;
}

export interface SMSStats {
  totalSent: number;
  totalDelivered: number;
  totalClicked: number;
  totalFeedback: number;
  deliveryRate: number;
  clickRate: number;
}
