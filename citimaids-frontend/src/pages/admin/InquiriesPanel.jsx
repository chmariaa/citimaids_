import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../api/axios';
import {
    brand, fonts, card, solidBtn as solidBtnToken,
    outlineBtn as outlineBtnToken, inputStyle as inputStyleToken,
    tabBtn, searchBar as searchBarToken, searchInput as searchInputToken,
} from './adminStyles';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_TABS = [
    { key: 'all',     label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'replied', label: 'Replied' },
    { key: 'closed',  label: 'Closed' },
];

const STATUS_COLOR = {
    pending: { color: '#b45309', bg: '#fef3c7', border: '#fcd34d', label: 'Pending' },
    replied: { color: '#047857', bg: '#d1fae5', border: '#86efac', label: 'Replied' },
    closed:  { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1', label: 'Closed' },
};

function InquiryStatusBadge({ status }) {
    const s = STATUS_COLOR[status] || STATUS_COLOR.pending;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 8,
            border: `1px solid ${s.border}`,
            fontSize: 11.5, fontWeight: 700,
            color: s.color, background: s.bg,
            whiteSpace: 'nowrap',
        }}>
            {s.label}
        </span>
    );
}

function initials(name = '') {
    return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

// ── Inquiry Details & Admin Response Modal ─────────────────────────────────────
function InquiryModal({ inquiry, onClose, onSaved }) {
    const [status, setStatus] = useState(inquiry.status);
    const [adminNotes, setAdminNotes] = useState(inquiry.admin_notes || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const cleanPhone = (inquiry.phone || '').replace(/\D/g, '');
    const hasPhone = cleanPhone.length >= 7;

    const waText = encodeURIComponent(
        `Hi ${inquiry.name}! Thank you for reaching out to CitiMaids regarding your inquiry: "${inquiry.message.slice(0, 60)}..."`
    );
    const waUrl = hasPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : null;

    const emailSubject = encodeURIComponent(`CitiMaids Inquiries - Response for ${inquiry.name}`);
    const emailBody = encodeURIComponent(
        `Dear ${inquiry.name},\n\nThank you for reaching out to CitiMaids Cleaning Services.\n\nRegarding your inquiry:\n"${inquiry.message}"\n\n`
    );
    const mailtoUrl = `mailto:${inquiry.email}?subject=${emailSubject}&body=${emailBody}`;

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await api.put(`/inquiries/${inquiry.id}`, {
                status,
                admin_notes: adminNotes,
            });
            onSaved();
            onClose();
        } catch {
            setError('Failed to update inquiry. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const overlay = {
        position: 'fixed', inset: 0,
        background: 'rgba(10,35,66,0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
    };
    const modal = {
        background: '#fff', borderRadius: 20, padding: 32,
        maxWidth: 580, width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        position: 'relative',
        maxHeight: '90vh', overflowY: 'auto',
    };

    return (
        <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={modal}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: 16, right: 16,
                        width: 32, height: 32, borderRadius: '50%',
                        border: 'none', background: '#f1f5f9',
                        color: '#64748b', fontSize: 18, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >✕</button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: 'linear-gradient(135deg, #0A2342 0%, #1E3A8A 100%)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 18,
                    }}>
                        {initials(inquiry.name)}
                    </div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: brand.navy, margin: 0 }}>
                            {inquiry.name}
                        </h2>
                        <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                            <InquiryStatusBadge status={inquiry.status} />
                            <span style={{ fontSize: 12, color: '#64748b' }}>
                                Received {new Date(inquiry.created_at).toLocaleDateString('en-AE', {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Direct Channel Buttons */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                    {hasPhone && (
                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px', borderRadius: 10,
                                background: '#dcfce7', color: '#15803d',
                                border: '1px solid #86efac', textDecoration: 'none',
                                fontSize: 12.5, fontWeight: 700,
                            }}
                        >
                            💬 Answer via WhatsApp ({inquiry.phone})
                        </a>
                    )}
                    <a
                        href={mailtoUrl}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 10,
                            background: '#eff6ff', color: '#1d4ed8',
                            border: '1px solid #bfdbfe', textDecoration: 'none',
                            fontSize: 12.5, fontWeight: 700,
                        }}
                    >
                        ✉️ Answer via Email ({inquiry.email})
                    </a>
                </div>

                {/* Visitor Message Box */}
                <div style={{ marginBottom: 20 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Visitor Inquiry Message
                    </span>
                    <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: '16px',
                        marginTop: 6,
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        color: '#1e293b',
                        whiteSpace: 'pre-wrap',
                    }}>
                        {inquiry.message}
                    </div>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Status Select */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                            Response Status
                        </label>
                        <select
                            style={{ ...inputStyleToken, cursor: 'pointer', fontWeight: 600 }}
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="pending">Pending Response (Requires action)</option>
                            <option value="replied">Replied (Answered via WhatsApp/Email)</option>
                            <option value="closed">Closed / Archived</option>
                        </select>
                    </div>

                    {/* Admin Internal Notes */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                            Internal Admin Notes (Optional)
                        </label>
                        <textarea
                            style={{ ...inputStyleToken, minHeight: 70, resize: 'vertical' }}
                            placeholder="e.g. Sent AED 350 quote for villa cleaning via WhatsApp, awaiting customer confirmation..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                        />
                    </div>

                    {error && <p style={{ color: '#dc2626', fontSize: 13, textAlign: 'center' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ ...outlineBtnToken, flex: 1, justifyContent: 'center' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{ ...solidBtnToken, flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}
                        >
                            {saving ? 'Saving…' : 'Save & Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Inquiries Actions Dropdown ────────────────────────────────────────────────
function InquiriesDropdown({ inquiry, onOpenModal, onMarkReplied, onMarkPending, onMarkClosed, onDelete, onToggleExpand, isExpanded, loading }) {
    const [open, setOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleOpen = () => {
        if (!open && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // If space below button is less than 280px, open upwards so it's never cut off
            setOpenUpward(spaceBelow < 280);
        }
        setOpen((v) => !v);
    };

    const cleanPhone = (inquiry.phone || '').replace(/\D/g, '');
    const hasPhone = cleanPhone.length >= 7;

    const menuItem = (label, color, onClick, disabled) => (
        <button
            onClick={() => { onClick(); setOpen(false); }}
            disabled={disabled}
            style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 16px', fontSize: 13, fontWeight: 600,
                color, background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
        >
            {label}
        </button>
    );

    return (
        <div ref={ref} onClick={(e) => e.stopPropagation()} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={toggleOpen}
                disabled={loading}
                style={{
                    padding: '6px 14px', borderRadius: 8,
                    border: '1.5px solid #e2e8f0', background: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    color: '#334155', display: 'flex', alignItems: 'center', gap: 6,
                    opacity: loading ? 0.6 : 1,
                }}
            >
                Actions
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: (open && !openUpward) || (!open && openUpward) ? 'rotate(180deg)' : open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    <path d="M2 4l4 4 4-4" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <div style={{
                    position: 'absolute',
                    right: 0,
                    ...(openUpward
                        ? { bottom: 'calc(100% + 6px)' }
                        : { top: 'calc(100% + 6px)' }),
                    background: '#fff',
                    borderRadius: 12,
                    minWidth: 195,
                    boxShadow: '0 12px 36px rgba(0,0,0,0.16)',
                    border: '1px solid #e2e8f0',
                    zIndex: 9999,
                    overflow: 'hidden',
                }}>
                    {menuItem(isExpanded ? '▲ Hide Full Message' : '👁 View Details & Reply', '#2563eb', onOpenModal, false)}
                    <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
                    {hasPhone && menuItem('💬 WhatsApp Visitor', '#16a34a', () => window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hi ' + inquiry.name + '! Thank you for reaching out to CitiMaids.')}`), false)}
                    {menuItem('✉️ Email Visitor', '#1d4ed8', () => window.location.href = `mailto:${inquiry.email}?subject=CitiMaids Inquiry Response`, false)}
                    <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
                    {inquiry.status !== 'replied' && menuItem('✓ Mark as Replied', '#047857', onMarkReplied, loading)}
                    {inquiry.status !== 'pending' && menuItem('⏳ Mark as Pending', '#b45309', onMarkPending, loading)}
                    {inquiry.status !== 'closed' && menuItem('✕ Mark as Closed', '#475569', onMarkClosed, loading)}
                    <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
                    {menuItem('🗑 Delete Inquiry', '#dc2626', onDelete, loading)}
                </div>
            )}
        </div>
    );
}

// ── Inquiries Panel Component ────────────────────────────────────────────────
export default function InquiriesPanel({ onPendingCountChange }) {
    const [inquiries, setInquiries]       = useState([]);
    const [loading, setLoading]           = useState(true);
    const [tab, setTab]                   = useState('all');
    const [search, setSearch]             = useState('');
    const [modalTarget, setModalTarget]   = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [expandedIds, setExpandedIds]   = useState(new Set());

    const toggleExpand = (id) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const fetchInquiries = () => {
        setLoading(true);
        api.get('/admin/inquiries')
            .then(({ data }) => {
                setInquiries(data);
                const pendingCount = (data || []).filter((inq) => inq.status === 'pending').length;
                if (onPendingCountChange) onPendingCountChange(pendingCount);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchInquiries(); }, []);

    // ── Counts per tab ───────────────────────────────────────────────────────
    const counts = useMemo(() => {
        const c = { all: inquiries.length, pending: 0, replied: 0, closed: 0 };
        inquiries.forEach((inq) => { if (c[inq.status] !== undefined) c[inq.status]++; });
        return c;
    }, [inquiries]);

    // ── Filtered list ────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = tab === 'all' ? inquiries : inquiries.filter((inq) => inq.status === tab);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (inq) =>
                    inq.name.toLowerCase().includes(q) ||
                    (inq.email ?? '').toLowerCase().includes(q) ||
                    (inq.phone ?? '').toLowerCase().includes(q) ||
                    inq.message.toLowerCase().includes(q) ||
                    (inq.admin_notes ?? '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [inquiries, tab, search]);

    // ── Quick status action ──────────────────────────────────────────────────
    const quickStatus = async (id, status) => {
        setActionLoading((prev) => ({ ...prev, [id]: true }));
        try {
            await api.patch(`/inquiries/${id}/status`, { status });
            fetchInquiries();
        } catch {
            alert('Action failed. Please try again.');
        } finally {
            setActionLoading((prev) => ({ ...prev, [id]: false }));
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete inquiry from "${name}"? This cannot be undone.`)) return;
        setActionLoading((prev) => ({ ...prev, [id]: true }));
        try {
            await api.delete(`/inquiries/${id}`);
            setInquiries((prev) => prev.filter((inq) => inq.id !== id));
        } catch {
            alert('Delete failed. Please try again.');
        } finally {
            setActionLoading((prev) => ({ ...prev, [id]: false }));
        }
    };

    return (
        <div>
            {/* Filter Tabs & Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                {/* Status tabs */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {STATUS_TABS.map((t) => (
                        <button
                            key={t.key}
                            style={tabBtn(tab === t.key)}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label}
                            <span style={{
                                marginLeft: 4, fontSize: 10, fontWeight: 800, padding: '1px 6px',
                                borderRadius: 10, background: tab === t.key ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                                color: tab === t.key ? '#fff' : '#64748b',
                            }}>
                                {counts[t.key] ?? 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div style={{ ...searchBarToken, marginLeft: 'auto', minWidth: 220, maxWidth: 300, flex: '1 1 220px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        style={searchInputToken}
                        placeholder="Search by name, email, phone…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}
                        >✕</button>
                    )}
                </div>
            </div>

            {/* Inquiries Table Card */}
            <div style={{ ...card, overflow: 'hidden', width: '100%' }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <div style={{ minWidth: 780 }}>
                        {/* Header row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(180px, 1.3fr) 100px 105px 170px',
                            gap: 12,
                            padding: '12px 18px',
                            background: '#f8fafc',
                            borderBottom: '1px solid #e2e8f0',
                            borderTopLeftRadius: 18,
                            borderTopRightRadius: 18,
                            fontSize: 10, fontWeight: 700, color: '#64748b',
                            letterSpacing: 0.8, textTransform: 'uppercase',
                            alignItems: 'center',
                        }}>
                            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>VISITOR & INQUIRY</span>
                            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>CONTACT DETAILS</span>
                            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>RECEIVED</span>
                            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>STATUS</span>
                            <span style={{ minWidth: 0, textAlign: 'right' }}>ACTIONS</span>
                        </div>

                        {/* Content */}
                        {loading ? (
                            <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
                                Loading customer inquiries…
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
                                {search ? 'No inquiries matching your search.' : 'No customer inquiries in this tab.'}
                            </div>
                        ) : (
                            filtered.map((inq, index) => {
                                const isExpanded = expandedIds.has(inq.id);
                                const cleanPhone = (inq.phone || '').replace(/\D/g, '');
                                const hasPhone = cleanPhone.length >= 7;

                                const waText = encodeURIComponent(
                                    `Hi ${inq.name}! Thank you for reaching out to CitiMaids. Regarding your inquiry: "${inq.message.slice(0, 50)}..."`
                                );
                                const waUrl = hasPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : null;
                                const mailtoUrl = `mailto:${inq.email}?subject=${encodeURIComponent(`CitiMaids Inquiry - ${inq.name}`)}`;
                                const isLast = index === filtered.length - 1;

                                return (
                                    <div
                                        key={inq.id}
                                        style={{
                                            borderBottom: isLast && !isExpanded ? 'none' : '1px solid #f1f5f9',
                                            background: isExpanded ? '#f8fafc' : '#fff',
                                            borderBottomLeftRadius: isLast && !isExpanded ? 18 : 0,
                                            borderBottomRightRadius: isLast && !isExpanded ? 18 : 0,
                                            transition: 'background 0.15s',
                                            position: 'relative',
                                        }}
                                    >
                                        {/* Main Clickable Row */}
                                        <div
                                            onClick={() => toggleExpand(inq.id)}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(180px, 1.3fr) 100px 105px 170px',
                                                gap: 12,
                                                padding: '15px 18px',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                            }}
                                        >
                                    {/* Visitor & Snippet */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                                        <span style={{
                                            color: '#94a3b8', fontSize: 11, marginTop: 7, userSelect: 'none',
                                            transform: isExpanded ? 'rotate(90deg)' : 'none',
                                            transition: 'transform 0.15s', display: 'inline-block', flexShrink: 0,
                                        }}>
                                            ▶
                                        </span>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10,
                                            background: '#0A2342', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, fontSize: 13, flexShrink: 0,
                                        }}>
                                            {initials(inq.name)}
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 700, color: brand.navy, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {inq.name}
                                            </div>
                                            <div style={{
                                                fontSize: 12, color: '#64748b',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                marginTop: 2, fontStyle: 'italic',
                                            }}>
                                                "{inq.message}"
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Details */}
                                    <div style={{ fontSize: 12.5, color: '#334155', minWidth: 0, overflow: 'hidden' }}>
                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <a
                                                href={mailtoUrl}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                                            >
                                                {inq.email}
                                            </a>
                                        </div>
                                        {inq.phone ? (
                                            <div style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {hasPhone ? (
                                                    <a
                                                        href={waUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5 }}
                                                    >
                                                        💬 {inq.phone}
                                                    </a>
                                                ) : (
                                                    <span style={{ color: '#64748b', fontSize: 11.5 }}>{inq.phone}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: 11 }}>No phone provided</span>
                                        )}
                                    </div>

                                    {/* Date */}
                                    <div style={{ fontSize: 12, color: '#64748b', minWidth: 0, flexShrink: 0, whiteSpace: 'nowrap' }}>
                                        {new Date(inq.created_at).toLocaleDateString('en-AE', {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </div>

                                    {/* Status Badge */}
                                    <div style={{ minWidth: 0, flexShrink: 0 }}>
                                        <InquiryStatusBadge status={inq.status} />
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, minWidth: 0, flexShrink: 0 }}>
                                        {hasPhone && (
                                            <a
                                                href={waUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                title={`Message ${inq.name} on WhatsApp`}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    padding: '5px 10px', borderRadius: 8,
                                                    background: '#dcfce7', color: '#15803d',
                                                    fontSize: 11.5, fontWeight: 700,
                                                    textDecoration: 'none', border: '1px solid #bbf7d0',
                                                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                                                }}
                                            >
                                                💬 WhatsApp
                                            </a>
                                        )}
                                        <InquiriesDropdown
                                            inquiry={inq}
                                            onOpenModal={() => setModalTarget(inq)}
                                            onMarkReplied={() => quickStatus(inq.id, 'replied')}
                                            onMarkPending={() => quickStatus(inq.id, 'pending')}
                                            onMarkClosed={() => quickStatus(inq.id, 'closed')}
                                            onDelete={() => handleDelete(inq.id, inq.name)}
                                            onToggleExpand={() => toggleExpand(inq.id)}
                                            isExpanded={isExpanded}
                                            loading={!!actionLoading[inq.id]}
                                        />
                                    </div>
                                </div>

                                {/* Expanded View Box */}
                                {isExpanded && (
                                    <div style={{
                                        padding: '0 20px 20px 48px',
                                        background: '#f8fafc',
                                        borderTop: '1px dashed #e2e8f0',
                                        borderBottomLeftRadius: isLast ? 18 : 0,
                                        borderBottomRightRadius: isLast ? 18 : 0,
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 0 8px',
                                        }}>
                                            <span style={{
                                                fontSize: 11, fontWeight: 700,
                                                color: '#64748b', textTransform: 'uppercase',
                                                letterSpacing: 0.8,
                                            }}>
                                                Complete Inquiry Requirements
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(inq.id)}
                                                style={{
                                                    background: 'none', border: 'none', color: '#64748b',
                                                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                }}
                                            >
                                                Collapse ▲
                                            </button>
                                        </div>

                                        {/* Full Text Box */}
                                        <div style={{
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 12,
                                            padding: '16px 20px',
                                            fontSize: 14,
                                            lineHeight: 1.7,
                                            color: '#1e293b',
                                            whiteSpace: 'pre-wrap',
                                            fontFamily: fonts.body,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                        }}>
                                            "{inq.message}"
                                        </div>

                                        {/* Internal Admin Notes (if any) */}
                                        {inq.admin_notes && (
                                            <div style={{
                                                marginTop: 10,
                                                padding: '10px 14px',
                                                background: '#eff6ff',
                                                border: '1px solid #bfdbfe',
                                                borderRadius: 10,
                                                fontSize: 12.5,
                                                color: '#1e40af',
                                            }}>
                                                <strong>Admin Note:</strong> {inq.admin_notes}
                                            </div>
                                        )}

                                        {/* Action Bar */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 12 }}>
                                            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
                                                <span>✉️ <strong>Email:</strong> {inq.email}</span>
                                                {inq.phone && <span>📞 <strong>Phone:</strong> {inq.phone}</span>}
                                                {inq.replied_at && (
                                                    <span>✓ <strong>Replied At:</strong> {new Date(inq.replied_at).toLocaleDateString()}</span>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                {hasPhone && (
                                                    <a
                                                        href={waUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                                            padding: '6px 14px', borderRadius: 8,
                                                            background: '#dcfce7', color: '#15803d',
                                                            fontSize: 12, fontWeight: 700,
                                                            textDecoration: 'none', border: '1px solid #bbf7d0',
                                                        }}
                                                    >
                                                        💬 Answer on WhatsApp
                                                    </a>
                                                )}
                                                <a
                                                    href={mailtoUrl}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                                        padding: '6px 14px', borderRadius: 8,
                                                        background: '#eff6ff', color: '#1d4ed8',
                                                        fontSize: 12, fontWeight: 700,
                                                        textDecoration: 'none', border: '1px solid #bfdbfe',
                                                    }}
                                                >
                                                    ✉️ Send Email
                                                </a>
                                                {inq.status !== 'replied' && (
                                                    <button
                                                        onClick={() => quickStatus(inq.id, 'replied')}
                                                        disabled={actionLoading[inq.id]}
                                                        style={{
                                                            padding: '6px 14px', borderRadius: 8,
                                                            border: '1px solid #86efac', background: '#d1fae5', color: '#047857',
                                                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                        }}
                                                    >
                                                        ✓ Mark Replied
                                                    </button>
                                                )}
                                                {inq.status !== 'pending' && (
                                                    <button
                                                        onClick={() => quickStatus(inq.id, 'pending')}
                                                        disabled={actionLoading[inq.id]}
                                                        style={{
                                                            padding: '6px 14px', borderRadius: 8,
                                                            border: '1px solid #fcd34d', background: '#fef3c7', color: '#b45309',
                                                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                        }}
                                                    >
                                                        ⏳ Mark Pending
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setModalTarget(inq)}
                                                    style={{
                                                        padding: '6px 14px', borderRadius: 8,
                                                        border: '1.5px solid #cbd5e1', background: '#fff', color: brand.navy,
                                                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                    }}
                                                >
                                                    📝 Edit Status & Notes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {modalTarget && (
                <InquiryModal
                    inquiry={modalTarget}
                    onClose={() => setModalTarget(null)}
                    onSaved={fetchInquiries}
                />
            )}
        </div>
    );
}
