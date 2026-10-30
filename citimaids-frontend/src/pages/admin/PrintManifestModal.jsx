import React from 'react';
import { brand, fonts, solidBtn, outlineBtn } from './adminStyles';

/**
 * Redesigned Print Manifest Modal & Printable Sheet
 * Structured according to CitiMaids operations specifications:
 *   Header: CITIMAIDS Logo, Title, Booking Ref (#0010), Status, and Date
 *   1. Client Info: Name, Contact Number, Address
 *   2. Service Details: Service Type, Schedule, Assigned Specialist
 *   3. Work Instructions & Checklist: Special instructions box + 5-point staff checklist
 *   4. Charges Summary: Service Fee, Inspection Guarantee (Free), and Total Due (AED)
 *   5. Verification: Client/Staff signature lines and completion timestamp
 */
export default function PrintManifestModal({ booking, onClose }) {
    if (!booking) return null;

    const bookingIdStr = `#${String(booking.id).padStart(4, '0')}`;
    const refCode = `CM-${String(booking.id).padStart(5, '0')}`;

    const formattedDate = booking.preferred_date
        ? new Date(booking.preferred_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : 'To Be Scheduled';

    const issueDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const statusConfig = {
        pending:   { label: 'PENDING',   color: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
        confirmed: { label: 'CONFIRMED', color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd' },
        completed: { label: 'COMPLETED', color: '#047857', bg: '#d1fae5', border: '#86efac' },
        cancelled: { label: 'CANCELLED', color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
    };
    const currentStatus = statusConfig[booking.status] || statusConfig.pending;

    const basePrice = booking.total_amount
        ? Number(booking.total_amount)
        : (booking.service?.base_price ? Number(booking.service.base_price) : 35);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(6, 20, 41, 0.72)',
                backdropFilter: 'blur(6px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                overflowY: 'auto',
                fontFamily: fonts.body,
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Embedded Print CSS to guarantee clean, borderless A4 layout when printing */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #citimaids-print-manifest, #citimaids-print-manifest * {
                        visibility: visible !important;
                    }
                    #citimaids-print-manifest {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 24px 32px !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: #ffffff !important;
                        color: #0f172a !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 12mm 15mm;
                    }
                }
            `}</style>

            <div
                style={{
                    background: '#f8fafc',
                    borderRadius: 20,
                    width: '100%',
                    maxWidth: 780,
                    maxHeight: '94vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
                    overflow: 'hidden',
                }}
            >
                {/* Modal Toolbar (Screen only - Hidden during print) */}
                <div
                    className="no-print"
                    style={{
                        padding: '16px 24px',
                        background: '#ffffff',
                        borderBottom: `1px solid ${brand.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                background: 'linear-gradient(135deg, #0A2342 0%, #1E3A8A 100%)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: brand.navy, fontFamily: fonts.heading }}>
                                Official Service Dispatch Manifest
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                                Ready for field team printout or customer signature confirmation
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                            type="button"
                            onClick={handlePrint}
                            style={{
                                ...solidBtn,
                                padding: '9px 20px',
                                fontSize: 13,
                                boxShadow: '0 4px 12px rgba(10, 35, 66, 0.25)',
                                cursor: 'pointer',
                                transition: 'all 0.18s ease-in-out',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(10, 35, 66, 0.35)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(10, 35, 66, 0.25)';
                            }}
                        >
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print / Save PDF
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                ...outlineBtn,
                                padding: '9px 16px',
                                fontSize: 13,
                                cursor: 'pointer',
                                transition: 'all 0.18s ease-in-out',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.background = '#f1f5f9';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = '#fff';
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Printable Manifest Document Container */}
                <div style={{ padding: '24px', overflowY: 'auto', background: '#f1f5f9' }}>
                    <div
                        id="citimaids-print-manifest"
                        style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            padding: '36px 40px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 6px 24px rgba(15, 23, 42, 0.08)',
                            color: '#1e293b',
                            fontSize: 13,
                            lineHeight: 1.5,
                        }}
                    >
                        {/* ── HEADER ── */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                paddingBottom: 22,
                                borderBottom: '2.5px solid #0A2342',
                                marginBottom: 24,
                            }}
                        >
                            {/* Company Logo & Subtitle */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                    <span
                                        style={{
                                            fontFamily: fonts.heading,
                                            fontSize: 26,
                                            fontWeight: 900,
                                            letterSpacing: 1.2,
                                            color: '#0A2342',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        CITIMAIDS
                                    </span>
                                    <span
                                        style={{
                                            background: '#0A2342',
                                            color: '#ffffff',
                                            fontSize: 10,
                                            fontWeight: 800,
                                            padding: '2px 7px',
                                            borderRadius: 5,
                                            letterSpacing: 0.8,
                                        }}
                                    >
                                        UAE
                                    </span>
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 4, letterSpacing: 0.3 }}>
                                    Professional Cleaning & Hospitality Services · Abu Dhabi, UAE
                                </div>
                                <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                                    Licensed by Abu Dhabi DED · 24/7 Operations Support
                                </div>
                            </div>

                            {/* Manifest Title, Ref, Status & Date */}
                            <div style={{ textAlign: 'right' }}>
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 800,
                                        color: '#0A2342',
                                        fontFamily: fonts.heading,
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.6,
                                    }}
                                >
                                    Service Dispatch Manifest
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                                    <span
                                        style={{
                                            fontFamily: 'monospace',
                                            fontSize: 16,
                                            fontWeight: 800,
                                            color: '#0A2342',
                                            background: '#f1f5f9',
                                            padding: '3px 10px',
                                            borderRadius: 7,
                                            border: '1px solid #cbd5e1',
                                        }}
                                    >
                                        {bookingIdStr}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 800,
                                            padding: '4px 10px',
                                            borderRadius: 6,
                                            background: currentStatus.bg,
                                            color: currentStatus.color,
                                            border: `1px solid ${currentStatus.border}`,
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                        {currentStatus.label}
                                    </span>
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                                    Issued: <strong style={{ color: '#1e293b' }}>{issueDate}</strong> · Ref: <span style={{ fontFamily: 'monospace' }}>{refCode}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── 1. CLIENT INFO ── */}
                        <div style={{ marginBottom: 22 }}>
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: '#0A2342',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.8,
                                    paddingBottom: 6,
                                    borderBottom: '1px solid #e2e8f0',
                                    marginBottom: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <span style={{ color: '#2563eb' }}>1.</span> CLIENT INFORMATION
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.2fr 1fr 1.6fr',
                                    gap: 14,
                                    background: '#f8fafc',
                                    padding: '14px 18px',
                                    borderRadius: 10,
                                    border: '1px solid #e2e8f0',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>
                                        Client Name
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0A2342' }}>
                                        {booking.client?.name || 'Walk-in / Valued Client'}
                                    </div>
                                    {booking.client?.email && (
                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                            {booking.client.email}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>
                                        Contact Number
                                    </div>
                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0A2342' }}>
                                        {booking.client?.contact_number || '—'}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>
                                        Verified UAE Mobile
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>
                                        Service Address
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.45 }}>
                                        {booking.address || booking.client?.address || 'Abu Dhabi Residence'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── 2. SERVICE DETAILS ── */}
                        <div style={{ marginBottom: 22 }}>
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: '#0A2342',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.8,
                                    paddingBottom: 6,
                                    borderBottom: '1px solid #e2e8f0',
                                    marginBottom: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <span style={{ color: '#2563eb' }}>2.</span> SERVICE DETAILS & SCHEDULE
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.4fr 1.4fr 1fr',
                                    gap: 14,
                                    background: '#f8fafc',
                                    padding: '14px 18px',
                                    borderRadius: 10,
                                    border: '1px solid #e2e8f0',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>
                                        Service Type
                                    </div>
                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0A2342' }}>
                                        {booking.service?.name || 'Professional Cleaning Service'}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                        Category: {booking.service?.category ? booking.service.category.toUpperCase() : 'RESIDENTIAL'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>
                                        Schedule & Time Slot
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0A2342' }}>
                                        {formattedDate}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>
                                        {booking.notes && booking.notes.includes('Slot:')
                                            ? booking.notes.split('|')[0].replace('Slot:', '').trim()
                                            : 'Morning Slot (08:00 - 12:00)'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>
                                        Assigned Specialist
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0A2342' }}>
                                        {booking.processed_by?.name || 'Dispatch Queue #1'}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                        Lead Field Supervisor
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── 3. WORK INSTRUCTIONS & CHECKLIST ── */}
                        <div style={{ marginBottom: 22 }}>
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: '#0A2342',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.8,
                                    paddingBottom: 6,
                                    borderBottom: '1px solid #e2e8f0',
                                    marginBottom: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <span style={{ color: '#2563eb' }}>3.</span> WORK INSTRUCTIONS & QUALITY CHECKLIST
                            </div>

                            {/* Special Instructions Box */}
                            <div
                                style={{
                                    background: '#fffbeb',
                                    border: '1.5px solid #fde68a',
                                    borderRadius: 9,
                                    padding: '12px 16px',
                                    marginBottom: 14,
                                }}
                            >
                                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                                    Client Special Instructions & Property Notes:
                                </div>
                                <div style={{ fontSize: 12.5, color: '#78350f', lineHeight: 1.5, fontStyle: booking.notes ? 'normal' : 'italic' }}>
                                    {booking.notes || 'Standard comprehensive cleaning protocol. Handle client interior furnishings with utmost care and ensure all doors are securely locked upon completion.'}
                                </div>
                            </div>

                            {/* 5-Point Staff Checklist */}
                            <div
                                style={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 9,
                                    overflow: 'hidden',
                                }}
                            >
                                <div style={{ background: '#f8fafc', padding: '8px 14px', fontSize: 10.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>
                                    Mandatory 5-Point Quality Assurance Checklist (Staff Sign-off)
                                </div>
                                {[
                                    '1. Initial Site Inspection & Scope Assessment Completed',
                                    '2. Professional Equipment & Eco-Friendly Supplies Verified',
                                    '3. High-Touch Surfaces & Designated Living Areas Deep Cleaned',
                                    '4. Client Special Instructions & Priority Focus Areas Satisfied',
                                    '5. Final Quality Handover Walkthrough & Client Verification Completed',
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 14px',
                                            borderBottom: idx < 4 ? '1px solid #f1f5f9' : 'none',
                                            background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                                            fontSize: 12,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    width: 14,
                                                    height: 14,
                                                    border: '1.5px solid #64748b',
                                                    borderRadius: 3,
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <span style={{ fontWeight: 600, color: '#334155' }}>{item}</span>
                                        </div>
                                        <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                                            Initials: [ &nbsp; &nbsp; &nbsp; &nbsp; ]
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── 4. CHARGES SUMMARY ── */}
                        <div style={{ marginBottom: 24 }}>
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: '#0A2342',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.8,
                                    paddingBottom: 6,
                                    borderBottom: '1px solid #e2e8f0',
                                    marginBottom: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <span style={{ color: '#2563eb' }}>4.</span> CHARGES & PAYMENT SUMMARY
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '8px 4px', color: '#64748b' }}>Service Fee ({booking.service?.name || 'Standard Rate'})</td>
                                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700, color: '#0A2342' }}>
                                            AED {basePrice.toFixed(2)}
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '8px 4px', color: '#64748b' }}>100% Quality Inspection Guarantee</td>
                                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                                            FREE
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '8px 4px', color: '#64748b' }}>Payment Mode & Settlement Status</td>
                                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                                            {booking.payment_method || 'Cash on Completion'} · ({booking.payment_status?.toUpperCase() || 'UNPAID'})
                                        </td>
                                    </tr>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <td style={{ padding: '12px 8px', fontSize: 14, fontWeight: 800, color: '#0A2342', fontFamily: fonts.heading }}>
                                            TOTAL DUE (AED)
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: 18, fontWeight: 900, color: '#0A2342', fontFamily: fonts.heading }}>
                                            AED {basePrice.toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* ── 5. VERIFICATION & TIMESTAMPS ── */}
                        <div>
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: '#0A2342',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.8,
                                    paddingBottom: 6,
                                    borderBottom: '1px solid #e2e8f0',
                                    marginBottom: 16,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <span style={{ color: '#2563eb' }}>5.</span> VERIFICATION & SERVICE HANDOVER
                            </div>

                            {/* Timestamp Fields */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 12,
                                    background: '#f8fafc',
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    border: '1px solid #e2e8f0',
                                    fontSize: 11.5,
                                    marginBottom: 20,
                                    textAlign: 'center',
                                }}
                            >
                                <div>
                                    <span style={{ color: '#64748b' }}>Arrival Time: </span>
                                    <strong style={{ color: '#0A2342' }}>[ &nbsp; &nbsp; : &nbsp; &nbsp; &nbsp; AM/PM ]</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b' }}>Departure Time: </span>
                                    <strong style={{ color: '#0A2342' }}>[ &nbsp; &nbsp; : &nbsp; &nbsp; &nbsp; AM/PM ]</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b' }}>Total Duration: </span>
                                    <strong style={{ color: '#0A2342' }}>[ &nbsp; &nbsp; &nbsp; Hours ]</strong>
                                </div>
                            </div>

                            {/* Dual Signature Lines */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 16, paddingTop: 12 }}>
                                <div>
                                    <div style={{ borderBottom: '1.5px solid #64748b', height: 38, marginBottom: 8 }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                        <span style={{ fontWeight: 700, color: '#0A2342' }}>Client Signature:</span>
                                        <span style={{ color: '#64748b' }}>Date: ________________</span>
                                    </div>
                                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                                        Confirms satisfactory completion of scheduled service
                                    </div>
                                </div>

                                <div>
                                    <div style={{ borderBottom: '1.5px solid #64748b', height: 38, marginBottom: 8 }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                        <span style={{ fontWeight: 700, color: '#0A2342' }}>Staff / Specialist Signature:</span>
                                        <span style={{ color: '#64748b' }}>Date: ________________</span>
                                    </div>
                                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                                        Certified CitiMaids Field Supervisor
                                    </div>
                                </div>
                            </div>

                            {/* Footer Legal & Support Notice */}
                            <div
                                style={{
                                    marginTop: 26,
                                    paddingTop: 12,
                                    borderTop: '1px dashed #cbd5e1',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: 10,
                                    color: '#94a3b8',
                                }}
                            >
                                <span>CitiMaids Abu Dhabi · Quality & Reliability Guaranteed</span>
                                <span>Support: +971 2 555 1234 · contact@citimaids.ae · www.citimaids.ae</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
