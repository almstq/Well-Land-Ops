/**
 * AI API helpers — thin wrappers around the Anthropic-powered backend endpoints.
 * All calls go through the shared Axios instance (which attaches the JWT token).
 */
import api from './api';

/**
 * Analyze an issue report: returns diagnosis, procedure, recommended parts.
 * @param {string} issueId  e.g. "IR-0001"
 */
export const analyzeIssue = (issueId) =>
  api.post('/ai/analyze-issue', { issueId });

/**
 * Generate a daily operations brief for the dashboard.
 */
export const getDailyBrief = () =>
  api.post('/ai/daily-brief', {});

/**
 * Get a health score and maintenance outlook for a specific machine.
 * @param {string} assetId  e.g. "WL-001"
 */
export const getAssetHealth = (assetId) =>
  api.post('/ai/asset-health', { assetId });

/**
 * Get the active AI provider info. Cached for the lifetime of the page session
 * so we only hit the backend once no matter how many components call this.
 */
let _statusPromise = null;
export const getAiProviderStatus = () => {
  if (!_statusPromise) {
    _statusPromise = api.get('/ai/status')
      .then(r => r.data)
      .catch(() => ({ enabled: false, provider: null, label: 'AI' }));
  }
  return _statusPromise;
};
