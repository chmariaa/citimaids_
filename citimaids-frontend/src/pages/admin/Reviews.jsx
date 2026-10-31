import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../api/axios';
import {
    brand, fonts, pageTitle, pageSubtitle, card, solidBtn as solidBtnToken,
    outlineBtn as outlineBtnToken, inputStyle as inputStyleToken,
    tabBtn, searchBar as searchBarToken, searchInput as searchInputToken,
    statusBadge,
} from './adminStyles';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_TABS = [
    { key: 'all',      label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
];

const STATUS_COLOR = {
    pending:  { color: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
    approved: { color: '#047857', bg: '#d1fae5', border: '#86efac' },
    rejected: { color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
};

function ReviewStatusBadge({ status }) {
    const s = STATUS_COLOR[status] || STATUS_COLOR.pending;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 8,
            border: `1px solid ${s.border}`,
            fontSize: 12, fontWeight: 700,
            color: s.color, background: s.bg,
        }}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function StarRow({ stars }) {
    return (
        <span style={{ color: '#f59e0b', fontSize: 14, letterSpacing: 2 }}>
            {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
        </span>
    );
}

function initials(name = '') {
    return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

// ── Status Moderation Modal (Client feedback is read-only) ────────────────────
function ReviewStatusModal({ review, onClose, onSaved }) {
    const [status, setStatus] = useState(review.status);
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState(null);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await api.patch(`/reviews/${review.id}/status`, { status });
            onSaved();
            onClose();
        } catch {
            setError('Failed to update status. Please try again.');
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
        maxWidth: 520, width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        position: 'relative',
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

                <h3 style={{ ...pageTitle, fontSize: 20, marginBottom: 4 }}>Moderate Review</h3>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
                    Client feedback is immutable to protect testimonial authenticity. Only publication status can be adjusted.
                </p>

                {/* Read-only client details card */}
                <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '16px',
                    marginBottom: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Client Name</span>
                            <div style={{ fontSize: 14, fontWeight: 700, color: brand.navy, marginTop: 2 }}>{review.name}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Rating</span>
                            <div style={{ marginTop: 2 }}>
                                <StarRow stars={review.stars} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                        {review.location && (
                            <div>
                                <span style={{ fontWeight: 600 }}>📍 Location: </span>{review.location}
                            </div>
                        )}
                        {review.whatsapp && (
                            <div>
                                <span style={{ fontWeight: 600 }}>💬 WhatsApp: </span>{review.whatsapp}
                            </div>
                        )}
                    </div>

                    <div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Client Review Text</span>
                        <div style={{
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 10,
                            padding: '12px 14px',
                            marginTop: 4,
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: '#334155',
                            whiteSpace: 'pre-wrap',
                            maxHeight: 140,
                            overflowY: 'auto',
                            fontStyle: 'italic',
                        }}>
                            "{review.body}"
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Status Select */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                            Publication Status
                        </label>
                        <select
                            style={{ ...inputStyleToken, cursor: 'pointer', fontWeight: 600 }}
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="pending">Pending (Awaiting moderation / Not published)</option>
                            <option value="approved">Approved (Live on website)</option>
                            <option value="rejected">Rejected (Hidden from website)</option>
                        </select>
                    </div>

                    {error && <p style={{ color: '#dc2626', fontSize: 13, textAlign: 'center' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
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
                            {saving ? 'Updating…' : 'Update Status'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Actions Dropdown ──────────────────────────────────────────────────────────
function ActionsDropdown({ review, onApprove, onReject, onMarkPending, onChangeStatus, onDelete, onToggleExpand, isExpanded, loading }) {
    const [open, setOpen] = useStateWithClose();
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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
                onClick={() => setOpen((v) => !v)}
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
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    <path d="M2 4l4 4 4-4" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                    background: '#fff', borderRadius: 12, minWidth: 175,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.13)', border: '1px solid #e2e8f0',
                    zIndex: 100, overflow: 'hidden',
                }}>
                    {menuItem(isExpanded ? '▲ Hide Full Review' : '👁 Read Full Review', '#2563eb', onToggleExpand, false)}
                    <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
                    {review.status !== 'approved' && menuItem('✓ Approve', '#047857', onApprove, loading)}
                    {review.status !== 'rejected' && menuItem('✕ Reject', '#b91c1c', onReject, loading)}
                    {review.status !== 'pending' && menuItem('⏳ Mark Pending', '#b45309', onMarkPending, loading)}
                    <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
                    {menuItem('⇄ Set Status', '#1e40af', onChangeStatus, false)}
                    {review.whatsapp && menuItem('💬 WhatsApp Client', '#16a34a', () => window.open(`https://wa.me/${review.whatsapp.replace(/\D/g, '')}`), false)}
                    <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
                    {menuItem('🗑 Delete', '#dc2626', onDelete, loading)}
                </div>
            )}
        </div>
    );
}

function useStateWithClose() {
    const [val, setVal] = useState(false);
    return [val, setVal];
}


export default function Reviews() {
    const [reviews, setReviews]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [tab, setTab]               = useState('all');
    const [search, setSearch]         = useState('');
    const [statusTarget, setStatusTarget] = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [expandedIds, setExpandedIds] = useState(new Set());

    const toggleExpand = (id) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const fetchReviews = () => {
        setLoading(true);
        api.get('/admin/reviews')
            .then(({ data }) => setReviews(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchReviews(); }, []);

    // ── Counts per tab ───────────────────────────────────────────────────────
    const counts = useMemo(() => {
        const c = { all: reviews.length, pending: 0, approved: 0, rejected: 0 };
        reviews.forEach((r) => { if (c[r.status] !== undefined) c[r.status]++; });
        return c;
    }, [reviews]);

    // ── Filtered list ────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = tab === 'all' ? reviews : reviews.filter((r) => r.status === tab);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (r) =>
                    r.name.toLowerCase().includes(q) ||
                    (r.location ?? '').toLowerCase().includes(q) ||
                    r.body.toLowerCase().includes(q)
            );
        }
        return list;
    }, [reviews, tab, search]);

    // ── Quick status action ──────────────────────────────────────────────────
    const quickStatus = async (id, status) => {
        setActionLoading((prev) => ({ ...prev, [id]: true }));
        try {
            await api.patch(`/reviews/${id}/status`, { status });
            fetchReviews();
        } catch {
            alert('Action failed. Please try again.');
        } finally {
            setActionLoading((prev) => ({ ...prev, [id]: false }));
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete review from "${name}"? This cannot be undone.`)) return;
        setActionLoading((prev) => ({ ...prev, [id]: true }));
        try {
            await api.delete(`/reviews/${id}`);
            setReviews((prev) => prev.filter((r) => r.id !== id));
        } catch {
            alert('Delete failed. Please try again.');
        } finally {
            setActionLoading((prev) => ({ ...prev, [id]: false }));
        }
    };

    // ── Styles ───────────────────────────────────────────────────────────────
    const page = { padding: '32px 40px', fontFamily: fonts.body };

    return (
        <div style={page}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div>
                    <h1 style={pageTitle}>Client Reviews</h1>
                    <p style={pageSubtitle}>Moderate, approve, or reject customer-submitted testimonials.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                        padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                        background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d',
                    }}>
                        {counts.pending} Pending
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
                {/* Tab pills */}
                <div style={{ display: 'flex', gap: 6 }}>
                    {STATUS_TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={tabBtn(tab === t.key)}
                        >
                            {t.label}
                            {counts[t.key] > 0 && (
                                <span style={{
                                    marginLeft: 4, fontSize: 10, fontWeight: 800,
                                    background: tab === t.key ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                                    color: tab === t.key ? '#fff' : '#64748b',
                                    padding: '1px 6px', borderRadius: 20,
                                }}>{counts[t.key]}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div style={{ ...searchBarToken, marginLeft: 'auto', minWidth: 240 }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        style={searchInputToken}
                        placeholder="Search by name, location…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div style={{ ...card, overflow: 'visible' }}>
                {/* Column headers */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2.5fr 1.5fr 70px 120px 220px',
                    padding: '14px 24px',
                    background: brand.softBg,
                    borderBottom: `1px solid ${brand.border}`,
                    fontSize: 10, fontWeight: 700, color: '#64748b',
                    textTransform: 'uppercase', letterSpacing: 0.8,
                }}>
                    <span>Reviewer & Review (Click to expand)</span>
                    <span>Location</span>
                    <span>Stars</span>
                    <span>Status</span>
                    <span style={{ textAlign: 'right' }}>Actions</span>
                </div>

                {loading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading reviews…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                        {search ? 'No reviews match your search.' : 'No reviews in this category yet.'}
                    </div>
                ) : (
                    filtered.map((r) => {
                        const isExpanded = expandedIds.has(r.id);
                        return (
                            <div key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                {/* Row Header / Summary */}
                                <div
                                    onClick={() => toggleExpand(r.id)}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2.5fr 1.5fr 70px 120px 220px',
                                        padding: '16px 24px',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        background: isExpanded ? '#f8fafc' : '',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = '#f8fafc'; }}
                                    onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = ''; }}
                                >
                                    {/* Reviewer */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        {/* Expand Chevron Icon */}
                                        <div
                                            title={isExpanded ? 'Collapse review' : 'Click to read full review'}
                                            style={{
                                                marginTop: 10,
                                                color: isExpanded ? brand.navy : '#94a3b8',
                                                transition: 'transform 0.2s',
                                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                <path d="M4 2.5l3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>

                                        <div style={{
                                            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                            background: 'linear-gradient(135deg, #0A2342 0%, #1E3A8A 100%)',
                                            color: '#fff', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontWeight: 800, fontSize: 13,
                                            fontFamily: fonts.heading,
                                        }}>
                                            {initials(r.name)}
                                        </div>

                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 700, fontSize: 14, color: brand.navy }}>{r.name}</span>
                                                {r.whatsapp && (
                                                    <a
                                                        href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            fontSize: 11, color: '#16a34a', background: '#dcfce7',
                                                            padding: '1px 8px', borderRadius: 6, display: 'inline-flex',
                                                            alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600,
                                                        }}
                                                        title="Open WhatsApp chat"
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#16a34a"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.552 4.1 1.516 5.824L0 24l6.335-1.493A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.722.877.936-3.613-.235-.372A9.818 9.818 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/></svg>
                                                        {r.whatsapp}
                                                    </a>
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 12, color: '#64748b', marginTop: 4,
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    fontStyle: 'italic', maxWidth: '90%',
                                                }}
                                                title="Click row to read full review"
                                            >
                                                "{r.body}"
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div style={{ fontSize: 13, color: '#64748b' }}>{r.location || '—'}</div>

                                    {/* Stars */}
                                    <StarRow stars={r.stars} />

                                    {/* Status */}
                                    <ReviewStatusBadge status={r.status} />

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                                        {r.whatsapp && (
                                            <a
                                                href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                title={`Message ${r.name} on WhatsApp`}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                                    padding: '6px 12px', borderRadius: 8,
                                                    background: '#dcfce7', color: '#15803d',
                                                    fontSize: 12, fontWeight: 700,
                                                    textDecoration: 'none', border: '1px solid #bbf7d0',
                                                    cursor: 'pointer', transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#bbf7d0'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = '#dcfce7'}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#15803d"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.552 4.1 1.516 5.824L0 24l6.335-1.493A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.722.877.936-3.613-.235-.372A9.818 9.818 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/></svg>
                                                Message
                                            </a>
                                        )}
                                        <ActionsDropdown
                                            review={r}
                                            loading={!!actionLoading[r.id]}
                                            isExpanded={isExpanded}
                                            onToggleExpand={() => toggleExpand(r.id)}
                                            onApprove={() => quickStatus(r.id, 'approved')}
                                            onReject={() => quickStatus(r.id, 'rejected')}
                                            onMarkPending={() => quickStatus(r.id, 'pending')}
                                            onChangeStatus={() => setStatusTarget(r)}
                                            onDelete={() => handleDelete(r.id, r.name)}
                                        />
                                    </div>
                                </div>

                                {/* Expanded Full Review Detail Panel */}
                                {isExpanded && (
                                    <div
                                        style={{
                                            background: '#f8fafc',
                                            padding: '20px 28px 24px 62px',
                                            borderLeft: `4px solid ${brand.navy}`,
                                            borderTop: '1px solid #f1f5f9',
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                                                    Full Review from {r.name}
                                                </span>
                                                <span style={{ fontSize: 12, color: '#cbd5e1' }}>•</span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                                                    <StarRow stars={r.stars} />
                                                    <strong style={{ color: '#0f172a' }}>{r.stars} / 5 Stars</strong>
                                                </span>
                                                {r.created_at && (
                                                    <>
                                                        <span style={{ fontSize: 12, color: '#cbd5e1' }}>•</span>
                                                        <span style={{ fontSize: 12, color: '#64748b' }}>
                                                            Submitted on {new Date(r.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(r.id)}
                                                style={{
                                                    background: 'none', border: 'none', color: '#64748b',
                                                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                    padding: '4px 8px', borderRadius: 6,
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = brand.navy}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                                            >
                                                Collapse ▲
                                            </button>
                                        </div>

                                        {/* Full Review Text Box */}
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
                                            "{r.body}"
                                        </div>

                                        {/* Footer Meta Details & Quick Actions */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 12 }}>
                                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
                                                {r.location && (
                                                    <span>📍 <strong>Location:</strong> {r.location}</span>
                                                )}
                                                {r.whatsapp && (
                                                    <span>
                                                        💬 <strong>WhatsApp:</strong>{' '}
                                                        <a
                                                            href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 700 }}
                                                        >
                                                            {r.whatsapp}
                                                        </a>
                                                    </span>
                                                )}
                                                <span><strong>Status:</strong> <ReviewStatusBadge status={r.status} /></span>
                                            </div>

                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                {r.whatsapp && (
                                                    <a
                                                        href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                                            padding: '6px 14px', borderRadius: 8,
                                                            background: '#dcfce7', color: '#15803d',
                                                            fontSize: 12, fontWeight: 700,
                                                            textDecoration: 'none', border: '1px solid #bbf7d0',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        💬 Message on WhatsApp
                                                    </a>
                                                )}
                                                {r.status !== 'approved' && (
                                                    <button
                                                        onClick={() => quickStatus(r.id, 'approved')}
                                                        disabled={actionLoading[r.id]}
                                                        style={{
                                                            padding: '6px 14px', borderRadius: 8,
                                                            border: '1px solid #86efac', background: '#d1fae5', color: '#047857',
                                                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                        }}
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                )}
                                                {r.status !== 'rejected' && (
                                                    <button
                                                        onClick={() => quickStatus(r.id, 'rejected')}
                                                        disabled={actionLoading[r.id]}
                                                        style={{
                                                            padding: '6px 14px', borderRadius: 8,
                                                            border: '1px solid #fca5a5', background: '#fee2e2', color: '#b91c1c',
                                                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                        }}
                                                    >
                                                        ✕ Reject
                                                    </button>
                                                )}
                                                {r.status !== 'pending' && (
                                                    <button
                                                        onClick={() => quickStatus(r.id, 'pending')}
                                                        disabled={actionLoading[r.id]}
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
                                                    onClick={() => setStatusTarget(r)}
                                                    style={{
                                                        padding: '6px 14px', borderRadius: 8,
                                                        border: '1px solid #bfdbfe', background: '#dbeafe', color: '#1e40af',
                                                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                    }}
                                                >
                                                    ⇄ Set Status
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

            {/* Status Modal */}
            {statusTarget && (
                <ReviewStatusModal
                    review={statusTarget}
                    onClose={() => setStatusTarget(null)}
                    onSaved={fetchReviews}
                />
            )}
        </div>
    );
}
