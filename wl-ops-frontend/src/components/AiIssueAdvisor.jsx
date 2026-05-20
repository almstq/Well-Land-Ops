/**
 * AiIssueAdvisor — AI-powered diagnosis and parts recommendation for an issue.
 *
 * Usage:
 *   <AiIssueAdvisor
 *     issue={issue}
 *     onAddPart={(aiPart) => ...}
 *     onAddAllParts={(aiParts) => ...}
 *   />
 *
 * Flow:
 *   1. User clicks "Get AI Analysis"
 *   2. Backend calls Claude with full issue + asset + inventory context
 *   3. Claude returns structured JSON: diagnosis, procedure, parts list
 *   4. User reviews — can add individual parts or all at once to the issue
 *   5. Added parts still require engineer verification before becoming PRs
 */
import { useState, useEffect } from 'react';
import {
  Sparkles, AlertTriangle, Clock, ChevronDown, ChevronUp,
  Plus, CheckCircle, Shield, Lightbulb, Star, Loader2, RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { analyzeIssue, getAiProviderStatus } from '../services/aiApi';
import { cn } from '../lib/utils';

const URGENCY_BADGE = {
  CRITICAL: 'badge badge-critical',
  HIGH:     'badge badge-high',
  MEDIUM:   'badge badge-medium',
  LOW:      'badge badge-low',
};

export default function AiIssueAdvisor({ issue, onAddPart, onAddAllParts }) {
  const [status,        setStatus]        = useState('idle'); // idle | loading | done | error
  const [analysis,      setAnalysis]      = useState(null);
  const [error,         setError]         = useState(null);
  const [open,          setOpen]          = useState(true);
  const [addedSet,      setAddedSet]      = useState(new Set());
  const [providerLabel, setProviderLabel] = useState('');

  // Fetch the actual provider name once on mount
  useEffect(() => {
    getAiProviderStatus().then(s => setProviderLabel(s.label || 'AI'));
  }, []);

  const handleAnalyze = async () => {
    setStatus('loading');
    setError(null);
    try {
      const res = await analyzeIssue(issue.id);
      setAnalysis(res.data.analysis);
      setStatus('done');
      setAddedSet(new Set());
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'AI analysis failed';
      setError(msg);
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setAnalysis(null);
    setError(null);
    setAddedSet(new Set());
  };

  const handleAddPart = (part, idx) => {
    onAddPart(part);
    setAddedSet(prev => new Set([...prev, idx]));
    toast.success(`"${part.name}" added to issue — verify before creating PR`);
  };

  const handleAddAll = () => {
    const parts = analysis?.parts || [];
    const unadded = parts.filter((_, i) => !addedSet.has(i));
    if (!unadded.length) return;
    onAddAllParts(unadded);
    setAddedSet(new Set(parts.map((_, i) => i)));
    toast.success(
      `${unadded.length} AI-recommended part${unadded.length > 1 ? 's' : ''} added — verify each before creating PRs`
    );
  };

  const allAdded = analysis?.parts?.length > 0 && addedSet.size === analysis.parts.length;

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-blue-50/60 to-transparent overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-textMain">AI Issue Advisor</div>
            <div className={cn('text-[11px]',
              status === 'done'    ? 'text-success' :
              status === 'loading' ? 'text-primary'  :
              status === 'error'   ? 'text-danger'   :
              'text-textMuted'
            )}>
              {status === 'done'    ? `Analysis complete · ${providerLabel}` :
               status === 'loading' ? `Analyzing with ${providerLabel}…` :
               status === 'error'   ? 'Analysis failed' :
               providerLabel || 'Loading provider…'}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {(status === 'idle' || status === 'error') && (
            <button
              type="button"
              onClick={handleAnalyze}
              className="btn btn-primary text-xs py-1.5 px-3"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {status === 'error' ? 'Retry' : 'Get AI Analysis'}
            </button>
          )}
          {status === 'done' && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-textMuted hover:text-primary px-2 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <RefreshCcw className="w-3 h-3" /> Re-analyze
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

      {/* ── Body ───────────────────────────────────────────────── */}
      {open && (
        <div className="border-t border-primary/10">

          {/* Idle prompt */}
          {status === 'idle' && (
            <div className="px-4 py-6 text-center">
              <div className="text-sm text-textMuted mb-1">
                Click <span className="font-semibold text-primary">Get AI Analysis</span> for a Claude-powered diagnosis,
                step-by-step repair procedure, and recommended parts list.
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-textMuted/70 mt-2">
                <Shield className="w-3 h-3" />
                All AI recommendations require engineer verification before generating PRs.
              </div>
            </div>
          )}

          {/* Loading */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="text-sm text-center">
                <div className="font-semibold text-textMain">Claude is diagnosing the issue…</div>
                <div className="text-xs text-textMuted mt-1">
                  Analyzing symptoms, asset history, and available parts
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="m-4 flex items-start gap-2 p-3 bg-dangerBg border border-danger/20 rounded-lg text-sm text-danger">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Analysis failed</div>
                <div className="text-xs mt-0.5">{error}</div>
                {(error || '').includes('AI key') && (
                  <div className="mt-2 text-xs text-textMuted leading-relaxed space-y-1">
                    <div className="font-semibold text-textMain">FREE options — pick one:</div>
                    <div>
                      <span className="font-semibold text-success">Google Gemini</span> — go to{' '}
                      <span className="font-mono text-primary">aistudio.google.com</span> → Get API Key → copy → add{' '}
                      <span className="font-mono">GOOGLE_AI_KEY=...</span> to <span className="font-mono">.env</span>
                    </div>
                    <div>
                      <span className="font-semibold text-success">Groq</span> — go to{' '}
                      <span className="font-mono text-primary">console.groq.com</span> → API Keys → copy → add{' '}
                      <span className="font-mono">GROQ_API_KEY=...</span> to <span className="font-mono">.env</span>
                    </div>
                    <div>Then restart: re-run <span className="font-mono">START.cmd</span></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Results ──────────────────────────────────────── */}
          {status === 'done' && analysis && (
            <div className="px-4 pb-5 pt-3 space-y-4">

              {/* Diagnosis */}
              <div className="p-3 bg-primary/[0.07] border border-primary/20 rounded-lg">
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">AI Diagnosis</div>
                <div className="text-sm text-textMain leading-relaxed">{analysis.diagnosis}</div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {analysis.urgencyAssessment && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-textMuted uppercase tracking-wide">Urgency</span>
                    <span className={URGENCY_BADGE[analysis.urgencyAssessment] || 'badge badge-default'}>
                      {analysis.urgencyAssessment}
                    </span>
                  </div>
                )}
                {analysis.estimatedHours > 0 && (
                  <div className="flex items-center gap-1 text-xs text-textMuted">
                    <Clock className="w-3.5 h-3.5" />
                    Est. {analysis.estimatedHours}h repair time
                  </div>
                )}
                {analysis.safetyWarning && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-warning bg-warningBg px-2 py-1 rounded-md">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {analysis.safetyWarning}
                  </div>
                )}
              </div>

              {/* Procedure */}
              {analysis.procedure?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">Repair Procedure</div>
                  <ol className="space-y-2">
                    {analysis.procedure.map((step, i) => (
                      <li key={i} className="flex gap-2.5 text-sm">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-textMain leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Recommended Parts */}
              {analysis.parts?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-bold text-textMuted uppercase tracking-wider">
                      Recommended Parts ({analysis.parts.length})
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAll}
                      disabled={allAdded}
                      className="flex items-center gap-1 btn btn-primary text-xs py-1 px-3 disabled:opacity-50 disabled:cursor-default"
                    >
                      {allAdded
                        ? <><CheckCircle className="w-3 h-3" /> All Added</>
                        : <><Plus className="w-3 h-3" /> Add All to Issue</>
                      }
                    </button>
                  </div>

                  <div className="space-y-2">
                    {analysis.parts.map((part, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-surfaceContainer rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-sm font-semibold text-textMain">{part.name}</span>
                            {part.isOEM && (
                              <span className="badge badge-oem text-[10px] py-0.5">
                                <Star className="w-2.5 h-2.5 mr-0.5" />OEM
                              </span>
                            )}
                            {part.inInventory && (
                              <span className="badge badge-success text-[10px] py-0.5">In Stock</span>
                            )}
                          </div>
                          {part.partNumber && (
                            <div className="font-mono text-[11px] text-textMuted">{part.partNumber}</div>
                          )}
                          <div className="text-xs text-textMuted mt-1 leading-relaxed">{part.reason}</div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-textMuted">
                            <span>Qty: {part.qty} {part.unit || 'pcs'}</span>
                            {part.estimatedCost > 0 && (
                              <span>{part.currency || 'MVR'} {Number(part.estimatedCost).toLocaleString()}</span>
                            )}
                            {part.inventoryNote && <span className="italic">{part.inventoryNote}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddPart(part, i)}
                          disabled={addedSet.has(i)}
                          className={cn(
                            'shrink-0 flex items-center gap-1 text-xs py-1.5 px-3 rounded-lg font-semibold transition-colors',
                            addedSet.has(i)
                              ? 'bg-successBg text-success cursor-default'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          )}
                        >
                          {addedSet.has(i)
                            ? <><CheckCircle className="w-3 h-3" /> Added</>
                            : <><Plus className="w-3 h-3" /> Add</>
                          }
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-textMuted">
                    <Shield className="w-3 h-3 shrink-0" />
                    Added parts must be verified by your engineer before converting to Purchase Requests.
                  </div>
                </div>
              )}

              {/* Preventive note */}
              {analysis.preventiveNote && (
                <div className="flex items-start gap-2 p-3 bg-surfaceContainer border border-border/60 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-0.5">
                      Preventive Recommendation
                    </div>
                    <div className="text-sm text-textMain leading-relaxed">{analysis.preventiveNote}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
