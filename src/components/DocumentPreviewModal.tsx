import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => {
                resolve(reader.result as string);
            };

            reader.onerror = reject;

            reader.readAsDataURL(blob);
        });

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
        setDownloading(true);

        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const teleicuLogo = await loadLogoImage('/teleicu-logo.png');
            const egovLogo = await loadLogoImage('/egov-logo.png');

            if (teleicuLogo) {
                doc.addImage(
                    teleicuLogo,
                    'PNG',
                    10,
                    7,
                    16,
                    10
                );
            }

            if (egovLogo) {
                doc.addImage(
                    egovLogo,
                    'PNG',
                    175,
                    7,
                    20,
                    8
                );
            }

            // Header
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(
                'TeleICU SPOKE HOSPITAL - FIELD VISIT CHECKLIST',
                105,
                17,
                { align: 'center' }
            );

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('TeleICU Systems & Infrastructure', 105, 23, {
                align: 'center',
            });

            // Metadata
            autoTable(doc, {
                startY: 35,
                body: [
                    [
                        'Hospital',
                        meta.hospital || '-',
                        'Visit Date',
                        meta.visitDate || '-',
                    ],
                    [
                        'Location',
                        meta.location || '-',
                        'Visited By',
                        meta.visitedBy || '-',
                    ],
                ],
                styles: {
                    fontSize: 9,
                    cellPadding: 2,
                },
                columnStyles: {
                    0: { fontStyle: 'bold' },
                    2: { fontStyle: 'bold' },
                },
            });

            const rows: any[] = [];

            checklistSections.forEach((section) => {
                rows.push([
                    {
                        content: `${section.code}. ${section.title.toUpperCase()}`,
                        colSpan: 4,
                        styles: {
                            fillColor: [180, 200, 230],
                            fontStyle: 'bold',
                        },
                    },
                ]);

                section.items.forEach((item) => {
                    const response = responses[item.id];

                    const status =
                        response?.status === 'working'
                            ? 'Yes'
                            : response?.status === 'not_working'
                                ? 'No'
                                : '';

                    rows.push([
                        item.no,
                        item.label,
                        status,
                        response?.remarks || '',
                    ]);
                });
            });

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 8,
                head: [['#', 'Check Point', 'Y / N', 'Remarks']],
                body: rows,

                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak',
                },

                headStyles: {
                    fillColor: [30, 64, 175],
                    textColor: 255,
                    fontStyle: 'bold',
                },

                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 110 },
                    2: { cellWidth: 20, halign: 'center' },
                    3: { cellWidth: 45 },
                },
            });

            let y = (doc as any).lastAutoTable.finalY + 10;

            doc.setFont('helvetica', 'bold');
            doc.text(`Overall Status: ${breakdown.overall}`, 14, y);

            y += 7;

            doc.setFont('helvetica', 'normal');
            doc.text(
                `Summary: ${breakdown.workingCount} Yes / ${breakdown.notWorkingCount} No out of ${breakdown.totalItems} checkpoints`,
                14,
                y
            );

            y += 10;

            if (breakdown.criticalFailures.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('Critical Failures:', 14, y);

                y += 5;

                doc.setFont('helvetica', 'normal');

                breakdown.criticalFailures.forEach((failure) => {
                    doc.text(`• ${failure.label}`, 18, y);
                    y += 5;
                });
            }

            y += 10;

            // Signatures
            doc.setFont('helvetica', 'bold');
            doc.text('Field Engineer / Manager', 14, y);
            doc.text('AMO / AAO / In-Charge Staff', 110, y);

            y += 8;

            doc.setFont('helvetica', 'normal');

            doc.text(
                `Name: ${signatures.fieldEngineer.name || '-'}`,
                14,
                y
            );

            doc.text(
                `Designation: ${signatures.fieldEngineer.designation || '-'}`,
                14,
                y + 5
            );

            doc.text(
                `Date: ${signatures.fieldEngineer.date || '-'}`,
                14,
                y + 10
            );

            doc.text(
                `Name: ${signatures.inCharge.name || '-'}`,
                110,
                y
            );

            doc.text(
                `Designation: ${signatures.inCharge.designation || '-'}`,
                110,
                y + 5
            );

            doc.text(
                `Date: ${signatures.inCharge.date || '-'}`,
                110,
                y + 10
            );

            doc.save(filename.replace('.docx', '.pdf'));

        } catch (error) {
            console.error(error);
            alert('Failed to generate PDF');
        } finally {
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
