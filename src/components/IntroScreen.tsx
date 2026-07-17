import { useState } from 'react';
import type { VisitMeta } from '../types';
import { totalItemCount } from '../data/checklistData';

interface Props {
  initial: VisitMeta;
  onStart: (meta: VisitMeta) => void;
  hasDraft: boolean;
  onResumeDraft: () => void;
  onDiscardDraft: () => void;
}

export default function IntroScreen({ initial, onStart, hasDraft, onResumeDraft, onDiscardDraft }: Props) {
  const [meta, setMeta] = useState<VisitMeta>(initial);
  const canStart = meta.hospital.trim().length > 0 && meta.visitedBy.trim().length > 0;

  function update<K extends keyof VisitMeta>(key: K, value: VisitMeta[K]) {
    setMeta((m) => ({ ...m, [key]: value }));
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-7 w-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">TeleICU Field Visit Checklist</h1>
        <p className="mt-2 text-sm text-slate-500">
          Spoke hospital inspection — {totalItemCount} check points across infrastructure &amp; medical equipment
        </p>
      </div>

      {hasDraft && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">You have an unfinished visit saved on this device.</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onResumeDraft}
              className="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white active:scale-[0.98]"
            >
              Resume
            </button>
            <button
              onClick={onDiscardDraft}
              className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-700 active:scale-[0.98]"
            >
              Discard &amp; start new
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <Field label="Hospital" required>
          <input
            className="input"
            placeholder="e.g. Taluk Hospital, T.Narasipura"
            value={meta.hospital}
            onChange={(e) => update('hospital', e.target.value)}
          />
        </Field>
        <Field label="Location">
          <input
            className="input"
            placeholder="District / Taluk"
            value={meta.location}
            onChange={(e) => update('location', e.target.value)}
          />
        </Field>
        <Field label="Visit Date">
          <input type="date" className="input" value={meta.visitDate} onChange={(e) => update('visitDate', e.target.value)} />
        </Field>
        <Field label="Visited By" required>
          <input
            className="input"
            placeholder="Your name"
            value={meta.visitedBy}
            onChange={(e) => update('visitedBy', e.target.value)}
          />
        </Field>
      </div>

      <button
        disabled={!canStart}
        onClick={() => onStart(meta)}
        className="mt-6 w-full rounded-xl bg-brand-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      >
        Start Checklist
      </button>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-bad-500">*</span>}
      </span>
      {children}
    </label>
  );
}
