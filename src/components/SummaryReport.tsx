import { useState } from 'react';
import { calculateOverallStatus } from '../utils/calculateStatus';
import DocumentPreviewModal from './DocumentPreviewModal';
import type { ResponsesMap, SignaturesState, VisitMeta } from '../types';

interface Props {
  meta: VisitMeta;
  responses: ResponsesMap;
  signatures: SignaturesState;
  onBack: () => void;
  onStartNew: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  OK: 'bg-ok-500/10 text-ok-600 ring-ok-500/30',
  'Issues Found': 'bg-amber-100 text-amber-700 ring-amber-300',
  Critical: 'bg-bad-500/10 text-bad-600 ring-bad-500/30',
};

export default function SummaryReport({ meta, responses, signatures, onBack, onStartNew }: Props) {
  const breakdown = calculateOverallStatus(responses);
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<{ meta: VisitMeta; responses: ResponsesMap; signatures: SignaturesState } | null>(null);

  async function handleGeneratePreview() {
    setGenerating(true);
    try {
      setPreviewData({ meta, responses, signatures });
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setGenerating(false);
    }
  }

  const notWorkingItems = Object.entries(responses)
    .filter(([, r]) => r.status === 'not_working')
    .map(([id, r]) => ({ id, ...r }));

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-5 py-6">
      <h2 className="mb-1 text-xl font-bold text-slate-900">Visit Summary</h2>
      <p className="mb-6 text-sm text-slate-500">
        {meta.hospital} · {meta.visitDate || 'no date'}
      </p>

      <div className={`mb-6 rounded-2xl p-5 text-center ring-1 ${STATUS_STYLES[breakdown.overall]}`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Overall Status</p>
        <p className="mt-1 text-3xl font-extrabold">{breakdown.overall}</p>
        <p className="mt-2 text-sm opacity-80">
          {breakdown.workingCount} working · {breakdown.notWorkingCount} not working · {breakdown.answered}/
          {breakdown.totalItems} answered
        </p>
      </div>

      {breakdown.criticalFailures.length > 0 && (
        <div className="mb-4 rounded-xl border border-bad-500/30 bg-bad-500/5 p-4">
          <p className="mb-1.5 text-sm font-bold text-bad-600">Critical failures</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-bad-600">
            {breakdown.criticalFailures.map((f) => (
              <li key={f.id}>{f.label}</li>
            ))}
          </ul>
        </div>
      )}

      {notWorkingItems.length > 0 && (
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="mb-2 text-sm font-bold text-slate-800">Items marked Not Working</p>
          <ul className="space-y-2">
            {notWorkingItems.map((it) => (
              <li key={it.id} className="text-sm">
                <span className="font-medium text-slate-700">{it.id}</span>
                {it.remarks && <span className="text-slate-500"> — {it.remarks}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 text-sm text-slate-600">
        <p>
          <span className="font-semibold text-slate-800">Field Engineer / Manager:</span> {signatures.fieldEngineer.name || '—'}
        </p>
        <p className="mt-1">
          <span className="font-semibold text-slate-800">AMO / AAO / In-Charge:</span> {signatures.inCharge.name || '—'}
        </p>
      </div>

      <button
        onClick={handleGeneratePreview}
        disabled={generating}
        className="w-full rounded-xl bg-brand-600 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/25 transition active:scale-[0.98] disabled:opacity-60"
      >
        {generating ? 'Generating preview…' : 'Preview & Download as PDF'}
      </button>

      {previewData && (
        <DocumentPreviewModal
          filename={`TeleICU_Field_Visit_${(meta.hospital || 'report').replace(/\s+/g, '_')}_${meta.visitDate || ''}.pdf`}
          meta={previewData.meta}
          responses={previewData.responses}
          signatures={previewData.signatures}
          onClose={() => setPreviewData(null)}
        />
      )}

      <div className="mt-3 flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-600 active:scale-[0.98]"
        >
          Back to sign-off
        </button>
        <button
          onClick={onStartNew}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-600 active:scale-[0.98]"
        >
          Start new visit
        </button>
      </div>
    </div>
  );
}
