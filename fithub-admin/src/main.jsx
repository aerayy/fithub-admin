import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import "./index.css";

// Sentry — sadece production'da aktif. Dev'de noise olmasın.
const SENSITIVE_KEYS = new Set([
  'password', 'old_password', 'new_password', 'hashed_password',
  'token', 'access_token', 'refresh_token', 'jwt', 'authorization',
  'otp', 'otp_code', 'verification_code',
  'secret', 'api_key', 'admin_key',
]);

function scrub(obj) {
  if (Array.isArray(obj)) return obj.map(scrub);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : scrub(v);
    }
    return out;
  }
  return obj;
}

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'https://c4c893944e48769c000532d60c8ebc04@o4511424106987520.ingest.de.sentry.io/4511424120815696',
    environment: 'production',
    release: import.meta.env.VITE_COMMIT_SHA || 'unknown',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.data) event.request.data = scrub(event.request.data);
      if (event.extra) event.extra = scrub(event.extra);
      return event;
    },
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<div style={{padding: 32, color: '#fff'}}>Bir hata oluştu, ekip bilgilendirildi.</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
