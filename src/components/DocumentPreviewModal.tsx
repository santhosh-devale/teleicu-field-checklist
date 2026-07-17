import { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { calculateOverallStatus } from '../utils/calculateStatus';
import { checklistSections } from '../data/checklistData';
import type { ResponsesMap, SignaturesState, VisitMeta } from '../types';

interface Props {
    filename: string;
    meta: VisitMeta;
    responses: ResponsesMap;
    signatures: SignaturesState;
    onClose: () => void;
}

async function loadLogoImage(logoPath: string): Promise<string | null> {
    try {
        const response = await fetch(logoPath);
        if (!response.ok) return null;
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.warn(`Could not load logo from ${logoPath}:`, error);
        return null;
    }
}

export default function DocumentPreviewModal({ filename, meta, responses, signatures, onClose }: Props) {
    const [downloading, setDownloading] = useState(false);
    const [teleicuLogoUrl, setTeleicuLogoUrl] = useState<string | null>(null);
    const [egovLogoUrl, setEgovLogoUrl] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const breakdown = calculateOverallStatus(responses);

    useEffect(() => {
        const loadLogos = async () => {
            const teleicu = await loadLogoImage('/teleicu-logo.png');
            const egov = await loadLogoImage('/egov-logo.png');
            setTeleicuLogoUrl(teleicu);
            setEgovLogoUrl(egov);
        };
        loadLogos();
    }, []);

    const handleDownloadPDF = async () => {
        if (!contentRef.current) return;

        setDownloading(true);
        try {
            console.log('Starting PDF generation with html2pdf...');

            // Clone the element to avoid modifying the original
            const element = contentRef.current.cloneNode(true) as HTMLElement;

            // Function to convert any color to hex or rgb
            const convertColorToRgb = (color: string): string => {
                // If it already looks like rgb or hex, keep it
                if (color.startsWith('#') || color.startsWith('rgb') || color === 'transparent') {
                    return color;
                }

                // For oklch or other colors, use a temporary element
                const tmp = document.createElement('div');
                tmp.style.color = color;
                document.body.appendChild(tmp);
                const computed = window.getComputedStyle(tmp).color;
                document.body.removeChild(tmp);
                return computed || color;
            };

            // Strip problematic styles and apply safe inline styles
            const cleanStyles = (el: HTMLElement) => {
                el.querySelectorAll('*').forEach((node) => {
                    const element = node as HTMLElement;
                    const computed = window.getComputedStyle(element);

                    // Apply safe colors as inline styles
                    const color = computed.color;
                    const bgColor = computed.backgroundColor;
                    const borderColor = computed.borderColor;

                    if (color && color !== 'rgba(0, 0, 0, 0)') {
                        element.style.color = convertColorToRgb(color);
                    }
                    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
                        element.style.backgroundColor = convertColorToRgb(bgColor);
                    }
                    if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
                        element.style.borderColor = convertColorToRgb(borderColor);
                    }

                    // Remove Tailwind classes to prevent recomputation
                    element.className = '';
                });
            };

            cleanStyles(element);

            const options = {
                margin: 5,
                filename: filename.replace('.docx', '.pdf'),
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowHeight: element.scrollHeight,
                    windowWidth: element.scrollWidth,
                    ignoreElements: () => false
                },
                jsPDF: {
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                },
                pagebreak: { mode: ['css', 'legacy'] }
            };

            console.log('Converting to PDF...');
            html2pdf()
                .set(options)
                .from(element)
                .save()
                .then(() => {
                    console.log('PDF generated and saved successfully');
                    setDownloading(false);
                })
                .catch((err: Error) => {
                    console.error('PDF save error:', err);
                    alert(`Error saving PDF: ${err.message}`);
                    setDownloading(false);
                });

        } catch (error) {
            console.error('PDF generation error:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            alert(`Error generating PDF: ${errorMsg}`);
            setDownloading(false);
        }
    };

    const table1Sections = checklistSections.filter((s) => s.table === 1);
    const table2Sections = checklistSections.filter((s) => s.table === 2);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50">
            <div className="flex h-full w-full flex-col rounded-2xl bg-white shadow-xl sm:m-4 sm:h-auto sm:max-h-[95vh] sm:max-w-5xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Document Preview</h3>
                        <p className="text-xs text-slate-500">{filename}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 active:scale-[0.98]"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
                    <div ref={contentRef} className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                        {/* Header with logos */}
                        <div className="mb-4 flex items-center justify-between gap-4 pb-4 text-center">
                            <div style={{ flex: '0 0 80px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {teleicuLogoUrl && <img src={teleicuLogoUrl} alt="TeleICU" style={{ maxWidth: '100%', maxHeight: '100%' }} />}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-slate-900">TeleICU SPOKE HOSPITAL – FIELD VISIT CHECKLIST</div>
                                <div className="text-xs text-slate-700">TeleICU Systems & Infrastructure</div>
                            </div>
                            <div style={{ flex: '0 0 80px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {egovLogoUrl && <img src={egovLogoUrl} alt="eGOV Foundation" style={{ maxWidth: '100%', maxHeight: '100%' }} />}
                            </div>
                        </div>

                        {/* Metadata Table */}
                        <table className="mb-4 w-full border-collapse border border-slate-400 text-xs">
                            <tbody>
                                <tr>
                                    <td className="border border-slate-400 bg-blue-100 px-2 py-1 font-bold text-blue-900">Hospital:</td>
                                    <td className="border border-slate-400 px-2 py-1">{meta.hospital || '—'}</td>
                                    <td className="border border-slate-400 bg-blue-100 px-2 py-1 font-bold text-blue-900">Visit Date:</td>
                                    <td className="border border-slate-400 px-2 py-1">{meta.visitDate || '—'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-400 bg-blue-100 px-2 py-1 font-bold text-blue-900">Location:</td>
                                    <td className="border border-slate-400 px-2 py-1">{meta.location || '—'}</td>
                                    <td className="border border-slate-400 bg-blue-100 px-2 py-1 font-bold text-blue-900">Visited By:</td>
                                    <td className="border border-slate-400 px-2 py-1">{meta.visitedBy || '—'}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Table 1 */}
                        <table className="mb-4 w-full border-collapse border border-slate-400 text-xs">
                            <thead>
                                <tr className="bg-blue-900 text-white">
                                    <th className="border border-slate-400 px-2 py-1 text-center w-8">#</th>
                                    <th className="border border-slate-400 px-2 py-1 text-left">Check Point</th>
                                    <th className="border border-slate-400 px-2 py-1 text-center w-12">Y / N</th>
                                    <th className="border border-slate-400 px-2 py-1 text-left">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {table1Sections.flatMap((section) => [
                                    <tr key={`${section.id}-header`}>
                                        <td colSpan={4} className="border border-slate-400 bg-blue-200 px-2 py-1 font-bold text-blue-900">
                                            {section.code}. {section.title.toUpperCase()}
                                        </td>
                                    </tr>,
                                    ...section.items.map((item) => {
                                        const r = responses[item.id];
                                        const status = r?.status === 'working' ? 'Yes' : r?.status === 'not_working' ? 'No' : '';
                                        return (
                                            <tr key={item.id}>
                                                <td className="border border-slate-400 px-2 py-1 text-center">{item.no}</td>
                                                <td className="border border-slate-400 px-2 py-1">{item.label}</td>
                                                <td className={`border border-slate-400 px-2 py-1 text-center font-bold ${status === 'Yes' ? 'text-green-600' : status === 'No' ? 'text-red-600' : ''}`}>
                                                    {status}
                                                </td>
                                                <td className="border border-slate-400 px-2 py-1">{r?.remarks || ''}</td>
                                            </tr>
                                        );
                                    }),
                                ])}
                            </tbody>
                        </table>

                        {/* Table 2 */}
                        <table className="mb-4 w-full border-collapse border border-slate-400 text-xs">
                            <thead>
                                <tr className="bg-blue-900 text-white">
                                    <th className="border border-slate-400 px-2 py-1 text-center w-8">#</th>
                                    <th className="border border-slate-400 px-2 py-1 text-left">Check Point</th>
                                    <th className="border border-slate-400 px-2 py-1 text-center w-12">Y / N</th>
                                    <th className="border border-slate-400 px-2 py-1 text-left">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {table2Sections.flatMap((section) => [
                                    <tr key={`${section.id}-header`}>
                                        <td colSpan={4} className="border border-slate-400 bg-blue-200 px-2 py-1 font-bold text-blue-900">
                                            {section.code}. {section.title.toUpperCase()}
                                        </td>
                                    </tr>,
                                    ...section.items.map((item) => {
                                        const r = responses[item.id];
                                        const status = r?.status === 'working' ? 'Yes' : r?.status === 'not_working' ? 'No' : '';
                                        return (
                                            <tr key={item.id}>
                                                <td className="border border-slate-400 px-2 py-1 text-center">{item.no}</td>
                                                <td className="border border-slate-400 px-2 py-1">{item.label}</td>
                                                <td className={`border border-slate-400 px-2 py-1 text-center font-bold ${status === 'Yes' ? 'text-green-600' : status === 'No' ? 'text-red-600' : ''}`}>
                                                    {status}
                                                </td>
                                                <td className="border border-slate-400 px-2 py-1">{r?.remarks || ''}</td>
                                            </tr>
                                        );
                                    }),
                                ])}
                            </tbody>
                        </table>

                        {/* Overall Status */}
                        <div className="mb-4 border-t-2 border-b-2 border-slate-400 py-2 text-xs font-bold">
                            Overall Status:
                            {breakdown.overall === 'OK' && <span className="ml-2 text-green-600">[X] OK</span>}
                            {breakdown.overall === 'Issues Found' && <span className="ml-2 text-yellow-600">[X] Issues Found</span>}
                            {breakdown.overall === 'Critical' && <span className="ml-2 text-red-600">[X] Critical</span>}
                            {breakdown.overall !== 'OK' && <span className="ml-2 text-slate-500">[ ] OK</span>}
                            {breakdown.overall !== 'Issues Found' && <span className="ml-2 text-slate-500">[ ] Issues Found</span>}
                            {breakdown.overall !== 'Critical' && <span className="ml-2 text-slate-500">[ ] Critical</span>}
                        </div>

                        {/* Summary */}
                        <div className="mb-4 text-xs text-slate-600 italic">
                            Summary: {breakdown.workingCount} Yes / {breakdown.notWorkingCount} No out of {breakdown.totalItems} checkpoints ({breakdown.answered} answered)
                        </div>

                        {/* Critical Failures */}
                        {breakdown.criticalFailures.length > 0 && (
                            <div className="mb-4 border-l-4 border-red-600 bg-red-50 px-3 py-2">
                                <div className="text-xs font-bold text-red-600">Critical Failures:</div>
                                <div className="text-xs text-red-600">{breakdown.criticalFailures.map((f) => f.label).join('; ')}</div>
                            </div>
                        )}

                        {/* Signatures */}
                        <div className="mt-6 flex gap-4 text-xs">
                            <div className="flex-1">
                                <div className="mb-2 font-bold">Field Engineer / Manager</div>
                                <div className="mb-3 h-12 border-t-2 border-slate-400" />
                                <div>Name: {signatures.fieldEngineer.name || '—'}</div>
                                <div>Designation: {signatures.fieldEngineer.designation || '—'}</div>
                                <div>Date: {signatures.fieldEngineer.date || '—'}</div>
                            </div>
                            <div className="flex-1">
                                <div className="mb-2 font-bold">AMO / AAO / In-Charge Staff</div>
                                <div className="mb-3 h-12 border-t-2 border-slate-400" />
                                <div>Name: {signatures.inCharge.name || '—'}</div>
                                <div>Designation: {signatures.inCharge.designation || '—'}</div>
                                <div>Date: {signatures.inCharge.date || '—'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t border-slate-200 bg-white px-6 py-4">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-600 active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="flex-1 rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-lg shadow-brand-600/25 transition active:scale-[0.98] disabled:opacity-60"
                    >
                        {downloading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                <span>Generating PDF...</span>
                            </div>
                        ) : (
                            'Download as PDF'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
