import type { ChecklistSection } from '../types';

// Extracted 1:1 from "Master_Field_Visit_Checklist.docx"
// Table 1: TeleICU Systems & Infrastructure (sections A-G, items 1-22)
// Table 2: Medical Equipment Status (section H, items 1-20)
//
// `critical: true` marks check points whose failure alone should push the
// overall status to "Critical" regardless of how many other items fail.
// This is a working assumption (core power/network/server links, and
// life-critical emergency equipment) — adjust freely in this file.

export const checklistSections: ChecklistSection[] = [
  {
    id: 'A',
    code: 'A',
    title: 'Power & Electrical',
    table: 1,
    items: [
      { id: 'A1', no: 1, label: 'Mains power available at ICU (no tripping / fluctuation)', critical: true },
      { id: 'A2', no: 2, label: 'UPS connected & battery backup functional (min 30 min)', critical: true },
      { id: 'A3', no: 3, label: 'Generator / DG set available; last-test date noted' },
      { id: 'A4', no: 4, label: 'All ICU equipment sockets live & earthing OK' },
    ],
  },
  {
    id: 'B',
    code: 'B',
    title: 'Internet & Network',
    table: 1,
    items: [
      { id: 'B5', no: 5, label: 'Internet link UP & speed >= 10 Mbps (speed test done)', critical: true },
      { id: 'B6', no: 6, label: 'Backup ISP / SIM failover present & active' },
      { id: 'B7', no: 7, label: 'VPN to hub established & stable (latency < 150 ms)', critical: true },
      { id: 'B8', no: 8, label: 'LAN switch / router ON; no port errors' },
    ],
  },
  {
    id: 'C',
    code: 'C',
    title: 'Server',
    table: 1,
    items: [
      { id: 'C9', no: 9, label: 'Server powered ON; no error LEDs / alerts', critical: true },
      { id: 'C10', no: 10, label: 'TeleICU application running & reachable from hub', critical: true },
      { id: 'C11', no: 11, label: 'Server UPS connected; last backup completed' },
    ],
  },
  {
    id: 'D',
    code: 'D',
    title: 'Desktop / Workstation',
    table: 1,
    items: [
      { id: 'D12', no: 12, label: 'Workstation(s) ON; TeleICU client app running' },
      { id: 'D13', no: 13, label: 'Display, keyboard & mouse functional' },
    ],
  },
  {
    id: 'E',
    code: 'E',
    title: '5-Para Patient Monitor',
    table: 1,
    items: [
      { id: 'E14', no: 14, label: 'Monitor ON; ECG, SpO2, NIBP, Temp, RR displaying' },
      { id: 'E15', no: 15, label: 'Alarms set per protocol; data streaming to hub confirmed' },
    ],
  },
  {
    id: 'F',
    code: 'F',
    title: 'Camera System (PTZ)',
    table: 1,
    items: [
      { id: 'F16', no: 16, label: 'Camera ON; live feed visible on hub console' },
      { id: 'F17', no: 17, label: 'Pan / Tilt / Zoom responsive; full range tested' },
      { id: 'F18', no: 18, label: 'Resolution 1080p, frame rate >= 25 fps (no freeze / lag)' },
      { id: 'F19', no: 19, label: 'Night vision / IR mode functional; audio (mic + speaker) clear' },
      { id: 'F20', no: 20, label: 'Camera covers full bed, ventilator & pump area' },
    ],
  },
  {
    id: 'G',
    code: 'G',
    title: 'CNS & Devices',
    table: 1,
    items: [
      { id: 'G21', no: 21, label: 'CNS workstation displaying all patient feeds; alerts received', critical: true },
      { id: 'G22', no: 22, label: 'Two-way AV call to hub tested & clear' },
    ],
  },
  {
    id: 'H',
    code: 'H',
    title: 'Medical Equipment Status',
    table: 2,
    items: [
      { id: 'H1', no: 1, label: 'Hamilton Ventilator - Adult mode working', critical: true },
      { id: 'H2', no: 2, label: 'Hamilton Ventilator - Pediatric mode working' },
      { id: 'H3', no: 3, label: 'Hamilton Ventilator - Neonatal mode working' },
      { id: 'H4', no: 4, label: 'Ventilator consumables stocked (circuits, filters, HME)' },
      { id: 'H5', no: 5, label: 'Disposable Ventilator Circuits - available & sealed' },
      { id: 'H6', no: 6, label: 'HME / HMV Filters - adequate stock present' },
      { id: 'H7', no: 7, label: 'Bacterial Filters - adequate stock present' },
      { id: 'H8', no: 8, label: 'ABG Auto Analyzer working (ABG, RFT, LFT, Haemogram, Electrolytes, Lactate, Ketone Bodies)', critical: true },
      { id: 'H9', no: 9, label: '100 mA Portable X-Ray - powered ON & functional' },
      { id: 'H10', no: 10, label: 'ECG Machine (3-channel) - working & paper loaded' },
      { id: 'H11', no: 11, label: 'Defibrillator - charged, self-test passed', critical: true },
      { id: 'H12', no: 12, label: '5-Para Monitor with stand (BP, SpO2, ECG, HR, Temp) - working' },
      { id: 'H13', no: 13, label: 'ICU Cots (Adult) - all functional, side rails OK' },
      { id: 'H14', no: 14, label: 'Infusion Pumps - all units powered & calibrated' },
      { id: 'H15', no: 15, label: 'Syringe Pumps - all units powered & calibrated' },
      { id: 'H16', no: 16, label: 'Radiant Warmer - powered ON, temperature control working' },
      { id: 'H17', no: 17, label: 'Crash Cart - stocked, tamper seal intact, defibrillator charged', critical: true },
      { id: 'H18', no: 18, label: 'Paediatric Resuscitation Bags (250 / 500 / 750 ml) - all sizes present' },
      { id: 'H19', no: 19, label: 'Paediatric Masks (sizes 00, 0, 1, 2) - all sizes present' },
      { id: 'H20', no: 20, label: 'Laryngoscope - curved & straight blades (all sizes) functional' },
    ],
  },
];

export const allItems = checklistSections.flatMap((s) =>
  s.items.map((i) => ({ ...i, sectionId: s.id, sectionCode: s.code, sectionTitle: s.title, table: s.table }))
);

export const totalItemCount = allItems.length;
