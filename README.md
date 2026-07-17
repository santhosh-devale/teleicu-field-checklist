# TeleICU Field Visit Checklist

A mobile-first, one-question-at-a-time digital replacement for the paper
"TeleICU Spoke Hospital – Field Visit Checklist", built with Vite + React
+ TypeScript + Tailwind CSS. Works on desktop browsers, mobile browsers, and
can be installed to a phone's home screen.

## What it does

1. **Visit details** — Hospital, Location, Visit Date, Visited By.
2. **42 check points, one at a time** — same items as the source document,
   grouped into the same sections (A-G: Systems & Infrastructure, H:
   Medical Equipment Status). Each item: Working / Not Working + optional
   Remarks, with a progress bar and section banners.
3. **Auto-calculated Overall Status** — OK / Issues Found / Critical,
   computed live from the answers (see rules below).
4. **Sign-off** — Field Engineer/Manager and AMO/AAO/In-Charge Staff each
   enter name, designation, date, and can draw a signature (touch or mouse).
5. **Generate filled report** — produces a .docx that mirrors the original
   template's layout (same two tables, same header block, overall-status
   checkboxes, signature block) with all responses filled in, and downloads
   it straight to the device.

Progress is autosaved to the browser's local storage, so a half-finished
visit survives an accidental tab close / app switch and can be resumed.

## Overall status rule (assumption -- adjust if needed)

Defined in `src/utils/calculateStatus.ts`:

- Any item flagged `critical` (power, network, server, VPN, CNS, Hamilton
  Ventilator adult mode, ABG analyzer, defibrillator, crash cart) marked
  Not Working -> Critical
- No critical failures but more than 3 other items Not Working -> Critical
- 1-3 non-critical items Not Working -> Issues Found
- Everything Working -> OK

Which check points are `critical` is a judgment call -- edit the `critical:
true` flags in `src/data/checklistData.ts` to match your actual escalation
policy.

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run build      # production build -> dist/
npm run preview    # preview the production build
```

Open the printed local URL on your phone (same Wi-Fi) or deploy `dist/` to
any static host (Netlify, Vercel, GitHub Pages, an internal server, etc.).

## Project structure

```
src/
  data/checklistData.ts   # all 42 check points, taken from the source .docx
  types.ts                # shared TypeScript types
  utils/
    calculateStatus.ts    # overall-status auto-calculation
    generateDocx.ts        # builds & downloads the filled .docx report
    storage.ts              # localStorage autosave/resume
  components/
    IntroScreen.tsx        # visit metadata form
    QuestionFlow.tsx       # one-question-at-a-time flow
    SignaturesScreen.tsx    # sign-off form
    SignaturePad.tsx        # canvas signature capture
    SummaryReport.tsx       # status summary + report download
  App.tsx                  # step orchestration
```

## Notes / things you may want to change

- **Critical-item list & thresholds** -- see above.
- **Storage** -- currently per-device localStorage only (no backend), so
  data does not sync across devices. If you want visits centrally stored
  (e.g. so a coordinator can see all hospitals' results), this needs a small
  backend/API and a submit step -- happy to add that next.
- **Branding** -- colors/logo live in `src/index.css` (`@theme` block) and
  `IntroScreen.tsx`.
