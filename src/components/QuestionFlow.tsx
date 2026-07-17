import { useMemo, useState } from 'react';
import { allItems } from '../data/checklistData';
import type { ResponsesMap } from '../types';
import ProgressBar from './ProgressBar';

interface Props {
  responses: ResponsesMap;
  onAnswer: (itemId: string, status: 'working' | 'not_working', remarks: string) => void;
  onFinish: () => void;
  onExitToIntro: () => void;
}

export default function QuestionFlow({ responses, onAnswer, onFinish, onExitToIntro }: Props) {
  // Resume at the last answered item
  const startIndex = useMemo(() => {
    let lastAnsweredIndex = -1;
    for (let i = 0; i < allItems.length; i++) {
      if (responses[allItems[i].id]?.status !== null && responses[allItems[i].id]?.status !== undefined) {
        lastAnsweredIndex = i;
      }
    }
    // Start from the next unanswered item after the last answered, or from the last answered if it's the only one
    return lastAnsweredIndex === -1 ? 0 : Math.min(lastAnsweredIndex + 1, allItems.length - 1);
  }, [responses]);

  const [index, setIndex] = useState(startIndex);
  const item = allItems[index];
  const existing = responses[item.id];
  const [remarks, setRemarks] = useState(existing?.remarks ?? '');
  const [status, setStatus] = useState<'working' | 'not_working' | null>(existing?.status ?? null);

  const isFirst = index === 0;
  const isLast = index === allItems.length - 1;
  const prevSectionCode = index > 0 ? allItems[index - 1].sectionCode : null;
  const showSectionBanner = prevSectionCode !== item.sectionCode;

  function loadItem(newIndex: number) {
    const it = allItems[newIndex];
    const ex = responses[it.id];
    setStatus(ex?.status ?? null);
    setRemarks(ex?.remarks ?? '');
    setIndex(newIndex);
  }

  function commitAndGo(direction: 1 | -1) {
    if (status) {
      onAnswer(item.id, status, remarks);
    }
    const next = index + direction;
    if (next < 0) return;
    if (next >= allItems.length) {
      onFinish();
      return;
    }
    loadItem(next);
  }

  function selectStatus(s: 'working' | 'not_working') {
    setStatus(s);
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-5 py-5">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onExitToIntro} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Exit">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1">
          <ProgressBar current={index + 1} total={allItems.length} />
        </div>
      </div>

      {showSectionBanner && (
        <div className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Section {item.sectionCode} — {item.sectionTitle}
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <div className="mb-1 text-xs font-medium text-slate-400">
          Check point #{item.no} · {item.table === 1 ? 'Systems & Infrastructure' : 'Medical Equipment'}
          {item.critical && <span className="ml-2 rounded bg-bad-500/10 px-1.5 py-0.5 text-[10px] font-bold text-bad-600">CRITICAL</span>}
        </div>
        <h2 className="mb-6 text-xl font-semibold leading-snug text-slate-900">{item.label}</h2>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => selectStatus('working')}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-6 transition ${status === 'working'
                ? 'border-ok-500 bg-ok-500/10 text-ok-600'
                : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={2.5} stroke="currentColor" className="h-9 w-9">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span className="text-sm font-semibold">Working</span>
          </button>
          <button
            onClick={() => selectStatus('not_working')}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-6 transition ${status === 'not_working'
                ? 'border-bad-500 bg-bad-500/10 text-bad-600'
                : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={2.5} stroke="currentColor" className="h-9 w-9">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            <span className="text-sm font-semibold">Not Working</span>
          </button>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Remarks {status === 'not_working' && <span className="text-bad-500">(recommended)</span>}
          </span>
          <textarea
            className="input min-h-[90px] resize-none"
            placeholder="Optional notes, readings, or observations..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </label>
      </div>

      <div className="sticky bottom-0 mt-6 flex gap-3 bg-slate-50 pb-1 pt-2">
        {!isFirst && (
          <button
            onClick={() => commitAndGo(-1)}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-semibold text-slate-600 active:scale-[0.98]"
          >
            Back
          </button>
        )}
        <button
          disabled={!status}
          onClick={() => commitAndGo(1)}
          className="flex-1 rounded-xl bg-brand-600 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/25 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {isLast ? 'Review & Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
