import { useState } from 'react';
import type { SignatureBlock, SignaturesState } from '../types';
import SignaturePad from './SignaturePad';

interface Props {
  initial: SignaturesState;
  onBack: () => void;
  onContinue: (signatures: SignaturesState) => void;
}

const today = new Date().toISOString().slice(0, 10);

export default function SignaturesScreen({ initial, onBack, onContinue }: Props) {
  const [state, setState] = useState<SignaturesState>({
    fieldEngineer: { ...initial.fieldEngineer, date: initial.fieldEngineer.date || today },
    inCharge: { ...initial.inCharge, date: initial.inCharge.date || today },
  });

  function updateBlock(key: keyof SignaturesState, patch: Partial<SignatureBlock>) {
    setState((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
  }

  const canContinue = state.fieldEngineer.name.trim().length > 0 && state.inCharge.name.trim().length > 0;

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-5 py-6">
      <h2 className="mb-1 text-xl font-bold text-slate-900">Sign-off</h2>
      <p className="mb-6 text-sm text-slate-500">Both signatories confirm the check points recorded above.</p>

      <SignatureBlockForm
        title="Field Engineer / Manager"
        block={state.fieldEngineer}
        onChange={(patch) => updateBlock('fieldEngineer', patch)}
      />

      <div className="my-6 h-px bg-slate-200" />

      <SignatureBlockForm
        title="AMO / AAO / In-Charge Staff"
        block={state.inCharge}
        onChange={(patch) => updateBlock('inCharge', patch)}
      />

      <div className="sticky bottom-0 mt-8 flex gap-3 bg-slate-50 pb-1 pt-2">
        <button
          onClick={onBack}
          className="rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-semibold text-slate-600 active:scale-[0.98]"
        >
          Back
        </button>
        <button
          disabled={!canContinue}
          onClick={() => onContinue(state)}
          className="flex-1 rounded-xl bg-brand-600 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/25 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          Continue to Summary
        </button>
      </div>
    </div>
  );
}

function SignatureBlockForm({
  title,
  block,
  onChange,
}: {
  title: string;
  block: SignatureBlock;
  onChange: (patch: Partial<SignatureBlock>) => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="mb-3 text-sm font-bold text-slate-800">{title}</h3>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <input
          className="input"
          placeholder="Full name"
          value={block.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <input
          className="input"
          placeholder="Designation"
          value={block.designation}
          onChange={(e) => onChange({ designation: e.target.value })}
        />
      </div>
      <input
        type="date"
        className="input mb-3"
        value={block.date}
        onChange={(e) => onChange({ date: e.target.value })}
      />
      <SignaturePad value={block.signatureDataUrl} onChange={(dataUrl) => onChange({ signatureDataUrl: dataUrl })} />
    </div>
  );
}
