/**
 * AiDailyBrief — AI-generated daily operations summary for the Dashboard.
 *
 * Caches the brief in sessionStorage for 4 hours to avoid unnecessary API calls.
 * Automatically loads cached brief on mount if available and fresh.
 */
import { useState, useEffect } from 'react';
import {
  Sparkles, AlertTriangle, TrendingUp, Zap,
  Clock, RefreshCw, ChevronDown, ChevronUp, Shield
} from 'lucide-react';
import { getDailyBrief } from '../services/aiApi';
import { cn } from '../lib/utils';

const CACHE_KEY = 'wlops_ai_brief_v1';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

function getCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { brief, generatedAt, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) { sessionStorage.removeItem(CACHE_KEY); return null; }
    return { brief, generatedAt };
  } catch { return null; }
}

function setCache(brief, generatedAt) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      brief, generatedAt, expiresAt: Date.now() + CACHE_TTL
    }));
  } catch { /* storage quota exceeded — ignore */ }
}

export default function AiDailyBrief() {
  const [status,  setStatus]  = useState('idle'); // idle | loading | done | error
  const [data,    setData]    = useState(null);    // { brief, generatedAt }
  const [error,   setError]   = useState(null);
  const [open,    setOpen]    = useState(true);

  // Restore cached brief on mount
  useEffect(() => {
    const cached = getCached();
    if (cached) { setData(cached); setStatus('done'); }
  }, []);

  const handleGenerate = async (force = false) => {
    if (!force && status === 'loading') return;
    setStatus('loading');
    setError(null);
    try {
      const res = await getDailyBrief();
      const { brief, generatedAt } = res.data;
      setData({ brief, generatedAt });
      setCache(brief, generatedAt);
      setStatus('done');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to generate brief';
      setError(msg);
      setStatus('error');
    }
  };

  const genTime = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <section className="ops-card p-0">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div className="ops-icon ops-icon-info w-9 h-9 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-textMain">AI Operations Brief</div>
            <div className="text-xs text-textMuted">
              {status === 'done' && genTime
                ? `Generated at ${genTime} · refreshes every 4 h`
                : 'Daily intelligence powered by Claude AI'}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {status !== 'loading' && (
            <button
              type="button"
              onClick={() => handleGenerate(true)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                status === 'done'
                  ? 'text-textMuted hover:text-primary hover:bg-primary/10'
                  : 'btn btn-primary'
              )}
            >
              {status === 'done'
                ? <><RefreshCw className="w-3 h-3" /> Refresh</>
                : <><Sparkles className="w-3 h-3" /> Generate Brief</>
              }
            </button>
          )}
          <button type="button" onClick={() => setOpen(o => !o)}>
            {open
              ? <ChevronUp   className="w-4 h-4 text-textMuted" />
              : <ChevronDown className="w-4 h-4 text-textMuted" />
            }
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      {open && (
        <div className="p-5">

          {/* Idle */}
          {status === 'idle' && (
            <div className="text-center py-6">
              <Sparkles className="w-8 h-8 text-primary/30 mx-auto mb-3" />
              <div className="text-sm font-semibold text-textMain mb-1">
                Get your AI Operations Brief
              </div>
              <div className="text-xs text-textMuted mb-4 max-w-sm mx-auto">
                Claude will analyse your fleet status, open issues, and procurement pressure
                to generate an actionable daily summary.
              </div>
              <button onClick={() => handleGenerate()} className="btn btn-primary text-sm">
                <Sparkles className="w-4 h-4 mr-2" /> Generate Today's Brief
              </button>
            </div>
          )}

          {/* Loading */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              <div className="text-sm text-textMuted">
                Claude is reviewing your fleet, issues, and procurement…
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-start gap-2 p-3 bg-dangerBg border border-danger/20 rounded-lg text-sm text-danger">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Failed to generate brief</div>
                <div className="text-xs mt-0.5">{error}</div>
                {(error || '').includes('AI key') && (
                  <div className="text-xs text-textMuted mt-2 leading-relaxed space-y-1">
                    <div className="font-semibold text-textMain">FREE options — pick one:</div>
                    <div>
                      <span className="font-semibold text-success">Google Gemini</span> →{' '}
                      <span className="font-mono text-primary">aistudio.google.com</span> — add <span className="font-mono">GOOGLE_AI_KEY=...</span> to <span className="font-mono">.env</span>
                    </div>
                    <div>
                      <span className="font-semibold text-success">Groq</span> →{' '}
                      <span className="font-mono text-primary">console.groq.com</span> — add <span className="font-mono">GROQ_API_KEY=...</span> to <span className="font-mono">.env</span>
                    </div>
                    <div>Restart with <span className="font-mono">START.cmd</span></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {status === 'done' && data?.brief && (() => {
            const { brief } = data;
            return (
              <div className="space-y-4">

                {/* Headline */}
                {brief.headline && (
                  <div className="p-3 bg-primary/[0.07] border border-primary/20 rounded-lg">
                    <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
                      Today's Status
                    </div>
                    <div className="font-bold text-textMain">{brief.headline}</div>
                  </div>
                )}

                {/* Summary */}
                {brief.summary && (
                  <div className="text-sm text-textMain leading-relaxed">{brief.summary}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Risks */}
                  {brief.risks?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                        <div className="text-[10px] font-bold text-textMuted uppercase tracking-wider">
                          Risks
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {brief.risks.map((risk, i) => (
                          <li key={i} className="flex gap-2 text-xs">
                            <span className="text-danger font-bold shrink-0 mt-0.5">•</span>
                            <span className="text-textMain leading-relaxed">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Opportunities */}
                  {brief.opportunities?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <TrendingUp className="w-3.5 h-3.5 text-success" />
                        <div className="text-[10px] font-bold text-textMuted uppercase tracking-wider">
                          Opportunities
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {brief.opportunities.map((opp, i) => (
                          <li key={i} className="flex gap-2 text-xs">
                            <span className="text-success font-bold shrink-0 mt-0.5">•</span>
                            <span className="text-textMain leading-relaxed">{opp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Immediate Actions */}
                {brief.immediateActions?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap className="w-3.5 h-3.5 text-warning" />
                      <div className="text-[10px] font-bold text-textMuted uppercase tracking-wider">
                        Immediate Actions
                      </div>
                    </div>
                    <ol className="space-y-2">
                      {brief.immediateActions.map((action, i) => (
                        <li key={i} className="flex gap-2.5 text-xs">
                          <span className="w-4 h-4 rounded-full bg-warning/20 text-warning text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-textMain leading-relaxed">{action}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Outlook */}
                {brief.outlook && (
                  <div className="flex items-start gap-2 p-3 bg-surfaceContainer rounded-lg border border-border/60">
                    <Clock className="w-3.5 h-3.5 text-textMuted shrink-0 mt-0.5" />
                    <div className="text-xs text-textMuted leading-relaxed">{brief.outlook}</div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <div className="flex items-center gap-1 text-[11px] text-textMuted">
                    <Shield className="w-3 h-3" />
                    AI-generated — verify with your team before acting on recommendations.
                  </div>
                  {data.generatedAt && (
                    <div className="text-[11px] text-textMuted">
                      {new Date(data.generatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
