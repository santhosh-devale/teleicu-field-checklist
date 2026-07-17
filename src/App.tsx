import { useEffect, useState } from 'react';
import IntroScreen from './components/IntroScreen';
import QuestionFlow from './components/QuestionFlow';
import SignaturesScreen from './components/SignaturesScreen';
import SummaryReport from './components/SummaryReport';
import { clearDraft, loadDraft, saveDraft } from './utils/storage';
import type { ResponsesMap, SignaturesState, VisitMeta } from './types';

type Step = 'intro' | 'questions' | 'signatures' | 'summary';

const emptyMeta: VisitMeta = { hospital: '', location: '', visitDate: new Date().toISOString().slice(0, 10), visitedBy: '' };
const emptySignatures: SignaturesState = {
  fieldEngineer: { name: '', designation: '', date: '', signatureDataUrl: null },
  inCharge: { name: '', designation: '', date: '', signatureDataUrl: null },
};

export default function App() {
  const draft = loadDraft();
  const [hasDraftPrompt, setHasDraftPrompt] = useState(!!draft);

  const [step, setStep] = useState<Step>('intro');
  const [meta, setMeta] = useState<VisitMeta>(draft?.meta ?? emptyMeta);
  const [responses, setResponses] = useState<ResponsesMap>(draft?.responses ?? {});
  const [signatures, setSignatures] = useState<SignaturesState>(draft?.signatures ?? emptySignatures);

  useEffect(() => {
    if (step === 'intro') return; // don't persist until a visit has actually started
    saveDraft({ meta, responses, signatures, currentStep: 0 });
  }, [meta, responses, signatures, step]);

  function handleStart(newMeta: VisitMeta) {
    setMeta(newMeta);
    setStep('questions');
  }

  function handleResumeDraft() {
    setHasDraftPrompt(false);
    setStep('questions');
  }

  function handleDiscardDraft() {
    clearDraft();
    setMeta(emptyMeta);
    setResponses({});
    setSignatures(emptySignatures);
    setHasDraftPrompt(false);
  }

  function handleAnswer(itemId: string, status: 'working' | 'not_working', remarks: string) {
    setResponses((r) => ({ ...r, [itemId]: { status, remarks } }));
  }

  function handleStartNew() {
    clearDraft();
    setMeta(emptyMeta);
    setResponses({});
    setSignatures(emptySignatures);
    setStep('intro');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {step === 'intro' && (
        <IntroScreen
          initial={meta}
          onStart={handleStart}
          hasDraft={hasDraftPrompt}
          onResumeDraft={handleResumeDraft}
          onDiscardDraft={handleDiscardDraft}
        />
      )}

      {step === 'questions' && (
        <QuestionFlow
          responses={responses}
          onAnswer={handleAnswer}
          onFinish={() => setStep('signatures')}
          onExitToIntro={() => setStep('intro')}
        />
      )}

      {step === 'signatures' && (
        <SignaturesScreen
          initial={signatures}
          onBack={() => setStep('questions')}
          onContinue={(sig) => {
            setSignatures(sig);
            setStep('summary');
          }}
        />
      )}

      {step === 'summary' && (
        <SummaryReport
          meta={meta}
          responses={responses}
          signatures={signatures}
          onBack={() => setStep('signatures')}
          onStartNew={handleStartNew}
        />
      )}
    </div>
  );
}
