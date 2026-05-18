-- Sprint 126 — Reporte #7 extensión: audio de explicación en preguntas
ALTER TABLE preguntas ADD COLUMN IF NOT EXISTS audio_url TEXT;
