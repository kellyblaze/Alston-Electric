BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS estimate_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'New request',
  customer_name text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT estimate_requests_status_check CHECK (
    status IN (
      'New request',
      'AI draft ready',
      'Needs more information',
      'Site visit needed',
      'Quote approved',
      'Quote sent',
      'Customer accepted',
      'Customer question',
      'Appointment requested',
      'Appointment confirmed',
      'More photos needed',
      'More photos received',
      'Scheduled',
      'Booked',
      'Completed',
      'Lost',
      'Declined'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_estimate_requests_created_at
  ON estimate_requests(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_estimate_requests_status_created_at
  ON estimate_requests(status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_estimate_requests_payload_gin
  ON estimate_requests USING gin(payload jsonb_path_ops);

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_public_id text REFERENCES estimate_requests(public_id) ON DELETE CASCADE,
  channel text NOT NULL,
  event_type text NOT NULL,
  recipient text,
  message text NOT NULL,
  provider_status text NOT NULL DEFAULT 'queued',
  provider_response jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_events_channel_check CHECK (channel IN ('sms', 'email')),
  CONSTRAINT notification_events_status_check CHECK (provider_status IN ('queued', 'sent', 'simulated', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_notification_events_request_created_at
  ON notification_events(request_public_id, created_at DESC);

COMMIT;
