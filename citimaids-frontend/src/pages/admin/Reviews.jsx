import { useState, useEffect, useMemo } from 'react';
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

// ── Edit / View Modal ─────────────────────────────────────────────────────────
function ReviewModal({ review, onClose, onSaved }) {
    const [form, setForm]     = useState({ ...review });
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState(null);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await api.put(`/reviews/${review.id}`, {
                name:     form.name,
                location: form.location,
                stars:    form.stars,
                body:     form.body,
                status:   form.status,
            });
            onSaved();
            onClose();
        } catch {
            setError('Failed to save. Please try again.');
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
        maxWidth: 560, width: '100%',
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

                <h3 style={{ ...pageTitle, fontSize: 20, marginBottom: 24 }}>Edit Review</h3>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Name */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                            Full Name
                        </label>
                        <input
                            required
                            style={inputStyleToken}
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                            Location
                        </label>
                        <input
                            style={inputStyleToken}
                            value={form.location ?? ''}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                            placeholder="e.g. Al Reem Island, Abu Dhabi"
                        />
                    </div>

                    {/* Stars */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
                            Rating
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setForm({ ...form, stars: s })}
                                    style={{
                                        fontSize: 24, background: 'none', border: 'none', cursor: 'pointer',
                                        color: s <= form.stars ? '#f59e0b' : '#e2e8f0',
                                        transition: 'color 0.15s',
                                    }}
                                >★</button>
                            ))}
                        </div>
                    </div>

                    {/* Body */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                            Review Text
                        </label>
                        <textarea
                            required
                            rows={5}
                            style={{ ...inputStyleToken, resize: 'vertical' }}
                            value={form.body}
                            onChange={(e) => setForm({ ...form, body: e.target.value })}
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                            Status
                        </label>
                        <select
                            style={{ ...inputStyleToken, cursor: 'pointer' }}
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
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
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Reviews() {
    const [reviews, setReviews]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [tab, setTab]               = useState('all');
    const [search, setSearch]         = useState('');
    const [editTarget, setEditTarget] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

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
    const actionBtn = (color, bg) => ({
        padding: '6px 14px', borderRadius: 8,
        border: 'none', background: bg, color,
        fontSize: 12, fontWeight: 700, cursor: 'pointer',
        transition: 'opacity 0.15s',
    });

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
            <div style={{ ...card, overflow: 'hidden' }}>
                {/* Column headers */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2.5fr 1.5fr 70px 120px 180px',
                    padding: '14px 24px',
                    background: brand.softBg,
                    borderBottom: `1px solid ${brand.border}`,
                    fontSize: 10, fontWeight: 700, color: '#64748b',
                    textTransform: 'uppercase', letterSpacing: 0.8,
                }}>
                    <span>Reviewer</span>
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
                    filtered.map((r) => (
                        <div key={r.id}>
                            {/* Row */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '2.5fr 1.5fr 70px 120px 180px',
                                padding: '18px 24px',
                                borderBottom: `1px solid #f1f5f9`,
                                alignItems: 'center',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = ''}
                            >
                                {/* Reviewer */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                        background: 'linear-gradient(135deg, #0A2342 0%, #1E3A8A 100%)',
                                        color: '#fff', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontWeight: 800, fontSize: 13,
                                        fontFamily: fonts.heading,
                                    }}>
                                        {initials(r.name)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: brand.navy }}>{r.name}</div>
                                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.body}
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
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    {r.status !== 'approved' && (
                                        <button
                                            onClick={() => quickStatus(r.id, 'approved')}
                                            disabled={actionLoading[r.id]}
                                            style={actionBtn('#047857', '#d1fae5')}
                                        >✓ Approve</button>
                                    )}
                                    {r.status !== 'rejected' && (
                                        <button
                                            onClick={() => quickStatus(r.id, 'rejected')}
                                            disabled={actionLoading[r.id]}
                                            style={actionBtn('#b91c1c', '#fee2e2')}
                                        >✕ Reject</button>
                                    )}
                                    <button
                                        onClick={() => setEditTarget(r)}
                                        style={actionBtn('#1e40af', '#dbeafe')}
                                    >Edit</button>
                                    <button
                                        onClick={() => handleDelete(r.id, r.name)}
                                        disabled={actionLoading[r.id]}
                                        style={actionBtn('#64748b', '#f1f5f9')}
                                    >Delete</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {editTarget && (
                <ReviewModal
                    review={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSaved={fetchReviews}
                />
            )}
        </div>
    );
}
