-- Migracion 039: registro idempotente de eventos webhook Stripe.
-- No guarda payload completo ni secretos; solo metadatos tecnicos minimos.

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id     TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  object_id    TEXT,
  livemode     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_webhook_events_type_object
  ON stripe_webhook_events(event_type, object_id)
  WHERE object_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at
  ON stripe_webhook_events(processed_at);
