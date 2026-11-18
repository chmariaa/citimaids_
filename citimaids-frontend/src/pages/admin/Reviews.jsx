import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import InquiriesPanel from './InquiriesPanel';
import ActionMenu from './ActionMenu';
import {
  brand,
  fonts,
  pageTitle,
  pageSubtitle,
  card,
  solidBtn as solidBtnToken,
  outlineBtn as outlineBtnToken,
  inputStyle as inputStyleToken,
  tabBtn,
  searchBar as searchBarToken,
  searchInput as searchInputToken,
  statusBadge,
} from './adminStyles';

// ── Sub-navigation tabs (matching Reports layout) ─────────────────────────────
const SUB_TABS = [
  { id: 'reviews', label: 'Client Reviews', desc: 'Ratings & testimonials' },
  { id: 'inquiries', label: 'Customer Inquiries', desc: 'Visitor & client queries' },
];

// ── Status config for reviews ────────────────────────────────────────────────
const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_COLOR = {
  pending: { color: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
  approved: { color: '#047857', bg: '#d1fae5', border: '#86efac' },
  rejected: { color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
};

function ReviewStatusBadge({ status }) {
  const s = STATUS_COLOR[status] || STATUS_COLOR.pending;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 8,
        border: `1px solid ${s.border}`,
        fontSize: 12,
        fontWeight: 700,
        color: s.color,
        background: s.bg,
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StarRow({ stars }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: 14, letterSpacing: 2 }}>
      {'★'.repeat(stars)}
      {'☆'.repeat(5 - stars)}
    </span>
  );
}

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ── Add New Review Modal ──────────────────────────────────────────────────────
function AddReviewModal({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Abu Dhabi, UAE');
  const [whatsapp, setWhatsapp] = useState('');
  const [stars, setStars] = useState(5);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('approved');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide reviewer client name.');
      return;
    }
    if (!body.trim() || body.trim().length < 5) {
      setError('Review body must be at least 5 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post('/admin/reviews', {
        name: name.trim(),
        location: location.trim() || null,
        whatsapp: whatsapp.trim() || null,
        stars: Number(stars),
        body: body.trim(),
        status,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create review. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const overlay = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10,35,66,0.55)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  };
  const modal = {
    background: '#fff',
    borderRadius: 20,
    padding: 32,
    maxWidth: 540,
    width: '100%',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: '#f1f5f9',
            color: '#64748b',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0A2342 0%, #1E3A8A 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            ★
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: brand.navy, margin: 0 }}>
              Add Client Review
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0 0' }}>
              Add a verified testimonial directly into the system.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Client Name & Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Client Name *
              </label>
              <input
                style={inputStyleToken}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fatima Al Mansoori"
                required
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                District / Location
              </label>
              <input
                style={inputStyleToken}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Al Khalidiyah, Abu Dhabi"
              />
            </div>
          </div>

          {/* WhatsApp & Rating */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                WhatsApp Number (Optional)
              </label>
              <input
                style={inputStyleToken}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+971 50 123 4567"
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Rating (1–5 Stars)
              </label>
              <select
                style={{ ...inputStyleToken, cursor: 'pointer', fontWeight: 700, color: '#b45309' }}
                value={stars}
                onChange={(e) => setStars(Number(e.target.value))}
              >
                <option value={5}>★★★★★ (5 Stars - Excellent)</option>
                <option value={4}>★★★★☆ (4 Stars - Very Good)</option>
                <option value={3}>★★★☆☆ (3 Stars - Good)</option>
                <option value={2}>★★☆☆☆ (2 Stars - Fair)</option>
                <option value={1}>★☆☆☆☆ (1 Star - Poor)</option>
              </select>
            </div>
          </div>

          {/* Review Body */}
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Client Testimonial Text *
            </label>
            <textarea
              style={{ ...inputStyleToken, minHeight: 90, resize: 'vertical', lineHeight: 1.5 }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write or paste client feedback..."
              required
            />
          </div>

          {/* Publication Status */}
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Initial Publication Status
            </label>
            <select
              style={{ ...inputStyleToken, cursor: 'pointer', fontWeight: 600 }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="approved">Approved (Publish live immediately to website)</option>
              <option value="pending">Pending (Save as draft awaiting moderation)</option>
              <option value="rejected">Rejected (Keep hidden)</option>
            </select>
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: 13, margin: '2px 0' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
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
              style={{
                ...solidBtnToken,
                flex: 1,
                justifyContent: 'center',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving Review…' : 'Save & Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Status Moderation & Edit Modal ───────────────────────────────────────────
function ReviewStatusModal({ review, onClose, onSaved }) {
  const [status, setStatus] = useState(review.status);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(review.name || '');
  const [location, setLocation] = useState(review.location || '');
  const [whatsapp, setWhatsapp] = useState(review.whatsapp || '');
  const [stars, setStars] = useState(review.stars || 5);
  const [body, setBody] = useState(review.body || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await api.put(`/reviews/${review.id}`, {
          name: name.trim(),
          location: location.trim() || null,
          whatsapp: whatsapp.trim() || null,
          stars: Number(stars),
          body: body.trim(),
          status,
        });
      } else {
        await api.patch(`/reviews/${review.id}/status`, { status });
      }
      onSaved();
      onClose();
    } catch {
      setError('Failed to update review. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const overlay = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10,35,66,0.55)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  };
  const modal = {
    background: '#fff',
    borderRadius: 20,
    padding: 32,
    maxWidth: 540,
    width: '100%',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: '#f1f5f9',
            color: '#64748b',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0A2342 0%, #1E3A8A 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            {initials(name || review.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: brand.navy, margin: 0 }}>
                {isEditing ? 'Edit Review' : 'Review Moderation'}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {isEditing ? 'View Summary' : '✏️ Edit Content'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <StarRow stars={isEditing ? stars : review.stars} />
              <span style={{ fontSize: 12, color: '#64748b' }}>• {name || review.name}</span>
            </div>
          </div>
        </div>

        {/* Content Section: Read-Only or Form Fields */}
        {!isEditing ? (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '16px',
              marginBottom: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Client Name
                </span>
                <div style={{ fontSize: 13, fontWeight: 700, color: brand.navy, marginTop: 2 }}>
                  {name || review.name}
                </div>
              </div>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Location / District
                </span>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginTop: 2 }}>
                  {location || review.location || '—'}
                </div>
              </div>
              {whatsapp && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    WhatsApp Number
                  </span>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#16a34a',
                      marginTop: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    💬 {whatsapp}
                  </div>
                </div>
              )}
            </div>

            <div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Client Review Text
              </span>
              <div
                style={{
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
                }}
              >
                "{body || review.body}"
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Client Name
                </label>
                <input
                  style={inputStyleToken}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Client name"
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Location / District
                </label>
                <input
                  style={inputStyleToken}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="District, City"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  WhatsApp Number
                </label>
                <input
                  style={inputStyleToken}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+971 50 ..."
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Stars Rating
                </label>
                <select
                  style={{ ...inputStyleToken, fontWeight: 700, color: '#b45309' }}
                  value={stars}
                  onChange={(e) => setStars(Number(e.target.value))}
                >
                  <option value={5}>★★★★★ (5 Stars)</option>
                  <option value={4}>★★★★☆ (4 Stars)</option>
                  <option value={3}>★★★☆☆ (3 Stars)</option>
                  <option value={2}>★★☆☆☆ (2 Stars)</option>
                  <option value={1}>★☆☆☆☆ (1 Star)</option>
                </select>
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Review Text
              </label>
              <textarea
                style={{ ...inputStyleToken, minHeight: 80, resize: 'vertical' }}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Review text..."
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status Select */}
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                display: 'block',
                marginBottom: 6,
              }}
            >
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
              style={{
                ...solidBtnToken,
                flex: 1,
                justifyContent: 'center',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Actions Dropdown ──────────────────────────────────────────────────────────
function ActionsDropdown({
  review,
  onApprove,
  onReject,
  onMarkPending,
  onChangeStatus,
  onDelete,
  onToggleExpand,
  isExpanded,
  loading,
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, bottom: 0, right: 0, openUpward: false });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < 280 && rect.top > 280;
    setCoords({
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      right: Math.max(12, window.innerWidth - rect.right),
      openUpward,
    });
  };

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (!open) {
      updatePosition();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    const handleOutside = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const handleScroll = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const menuItem = (label, color, onClick, disabled) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
        setOpen(false);
      }}
      disabled={disabled}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '9px 16px',
        fontSize: 13,
        fontWeight: 600,
        color,
        background: 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = '#f8fafc';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'none';
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        disabled={loading}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: '1.5px solid #e2e8f0',
          background: '#fff',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          color: '#334155',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          opacity: loading ? 0.6 : 1,
        }}
      >
        Actions
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              right: `${coords.right}px`,
              ...(coords.openUpward
                ? { bottom: `${coords.bottom}px` }
                : { top: `${coords.top}px` }),
              background: '#fff',
              borderRadius: 12,
              minWidth: 195,
              boxShadow: '0 16px 40px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
              zIndex: 999999,
              overflow: 'hidden',
            }}
          >
            {menuItem(
              isExpanded ? '▲ Hide Full Review' : '👁 Read Full Review',
              '#2563eb',
              onToggleExpand,
              false
            )}
            <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
            {review.status !== 'approved' && menuItem('✓ Approve', '#047857', onApprove, loading)}
            {review.status !== 'rejected' && menuItem('✕ Reject', '#b91c1c', onReject, loading)}
            {review.status !== 'pending' &&
              menuItem('⏳ Mark Pending', '#b45309', onMarkPending, loading)}
            <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
            {menuItem('⇄ Set Status', '#1e40af', onChangeStatus, false)}
            {review.whatsapp &&
              menuItem(
                '💬 WhatsApp Client',
                '#16a34a',
                () => window.open(`https://wa.me/${review.whatsapp.replace(/\D/g, '')}`),
                false
              )}
            <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
            {menuItem('🗑 Delete', '#dc2626', onDelete, loading)}
          </div>,
          document.body
        )}
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function Reviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSubTab = searchParams.get('tab') === 'inquiries' ? 'inquiries' : 'reviews';
  const setSubTab = (id) => setSearchParams(id === 'reviews' ? {} : { tab: id });

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusTarget, setStatusTarget] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [inquiriesPendingCount, setInquiriesPendingCount] = useState(0);

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
    api
      .get('/admin/reviews')
      .then(({ data }) => setReviews(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchInquiriesCount = () => {
    api
      .get('/admin/inquiries')
      .then(({ data }) => {
        const count = (data || []).filter((inq) => inq.status === 'pending').length;
        setInquiriesPendingCount(count);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchReviews();
    fetchInquiriesCount();
  }, []);

  // ── Counts per tab for Reviews ────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { all: reviews.length, pending: 0, approved: 0, rejected: 0 };
    reviews.forEach((r) => {
      if (c[r.status] !== undefined) c[r.status]++;
    });
    return c;
  }, [reviews]);

  const avgApprovedRating = useMemo(() => {
    const approvedReviews = reviews.filter((r) => r.status === 'approved');
    if (!approvedReviews.length) return '—';
    const sum = approvedReviews.reduce((acc, r) => acc + (Number(r.stars) || 5), 0);
    return (sum / approvedReviews.length).toFixed(1);
  }, [reviews]);

  // ── Filtered reviews list ─────────────────────────────────────────────────
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

  // ── Delete review ────────────────────────────────────────────────────────
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
  const page = { fontFamily: fonts.body, width: '100%', boxSizing: 'border-box' };

  return (
    <div style={page}>
      <style>{`
                .reviews-layout-grid {
                    display: grid;
                    grid-template-columns: 210px minmax(0, 1fr);
                    gap: 20px;
                    align-items: start;
                }
                @media (max-width: 1180px) {
                    .reviews-layout-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                    .reviews-subnav-sidebar {
                        display: flex !important;
                        flex-direction: row !important;
                        gap: 10px !important;
                        overflow-x: auto !important;
                    }
                    .reviews-subnav-sidebar button {
                        flex: 1 1 0 !important;
                        min-width: 180px !important;
                        margin-bottom: 0 !important;
                    }
                }
            `}</style>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={pageTitle}>
            {activeSubTab === 'reviews' ? 'Client Reviews' : 'Customer Inquiries'}
          </h1>
          <p style={pageSubtitle}>
            {activeSubTab === 'reviews'
              ? 'Moderate, approve, or reject customer-submitted testimonials.'
              : 'Review, manage, and reply to client inquiries and quote requests.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {activeSubTab === 'reviews' && counts.approved > 0 && (
            <span
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ color: '#f59e0b' }}>★</span>
              <span>{avgApprovedRating} / 5.0 Rating</span>
              <span style={{ color: '#6ee7b7' }}>•</span>
              <span style={{ color: '#065f46', fontWeight: 600 }}>{counts.approved} Approved</span>
            </span>
          )}
          <span
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fcd34d',
            }}
          >
            {activeSubTab === 'reviews'
              ? `${counts.pending} Pending Reviews`
              : `${inquiriesPendingCount} Pending Inquiries`}
          </span>
          {activeSubTab === 'reviews' && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                ...solidBtnToken,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1 }}>+</span>
              <span>Add Review</span>
            </button>
          )}
        </div>
      </div>

      {/* Nested Sidebar Grid (Matching Reports Layout) */}
      <div className="reviews-layout-grid">
        {/* Secondary Sidebar */}
        <div className="reviews-subnav-sidebar" style={{ ...card, padding: 10 }}>
          {SUB_TABS.map((t) => {
            const act = t.id === activeSubTab;
            const badgeCount = t.id === 'reviews' ? counts.pending : inquiriesPendingCount;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 14px',
                  border: 'none',
                  borderRadius: 12,
                  marginBottom: 4,
                  cursor: 'pointer',
                  transition: 'all .15s',
                  background: act ? 'linear-gradient(135deg,#0A2342,#1E3A8A)' : 'transparent',
                  color: act ? '#fff' : brand.navy,
                  boxShadow: act ? '0 4px 12px rgba(10,35,66,.2)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: act ? '#bfdbfe' : '#94a3b8', marginTop: 1 }}>
                    {t.desc}
                  </div>
                </div>
                {badgeCount > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: act ? 'rgba(255,255,255,0.25)' : '#fef3c7',
                      color: act ? '#fff' : '#b45309',
                      border: act ? 'none' : '1px solid #fcd34d',
                      flexShrink: 0,
                    }}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Panel */}
        <div style={{ minWidth: 0, width: '100%' }}>
          {activeSubTab === 'inquiries' ? (
            <InquiriesPanel onPendingCountChange={setInquiriesPendingCount} />
          ) : (
            <>
              {/* Reviews Filters */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                {/* Tab pills */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {STATUS_TABS.map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={tabBtn(tab === t.key)}>
                      {t.label}
                      {counts[t.key] > 0 && (
                        <span
                          style={{
                            marginLeft: 4,
                            fontSize: 10,
                            fontWeight: 800,
                            background: tab === t.key ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                            color: tab === t.key ? '#fff' : '#64748b',
                            padding: '1px 6px',
                            borderRadius: 20,
                          }}
                        >
                          {counts[t.key]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div
                  style={{
                    ...searchBarToken,
                    marginLeft: 'auto',
                    minWidth: 220,
                    maxWidth: 300,
                    flex: '1 1 220px',
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="#94a3b8"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    style={searchInputToken}
                    placeholder="Search by name, location…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Reviews Table */}
              <div
                data-card-container="true"
                style={{ ...card, overflow: 'hidden', width: '100%' }}
              >
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <div style={{ minWidth: 720 }}>
                    {/* Column headers */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 2.8fr) minmax(0, 1.4fr) 90px 95px 60px',
                        gap: 12,
                        padding: '12px 20px',
                        background: brand.softBg,
                        borderBottom: `1px solid ${brand.border}`,
                        borderTopLeftRadius: 18,
                        borderTopRightRadius: 18,
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Reviewer & Review
                      </span>
                      <span
                        style={{
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Location
                      </span>
                      <span
                        style={{
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Stars
                      </span>
                      <span
                        style={{
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Status
                      </span>
                      <span style={{ minWidth: 0, textAlign: 'right' }}>Actions</span>
                    </div>

                    {loading ? (
                      <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                        Loading reviews…
                      </div>
                    ) : filtered.length === 0 ? (
                      <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                        {search
                          ? 'No reviews match your search.'
                          : 'No reviews in this category yet.'}
                      </div>
                    ) : (
                      filtered.map((r, index) => {
                        const isExpanded = expandedIds.has(r.id);
                        const isLast = index === filtered.length - 1;
                        return (
                          <div
                            key={r.id}
                            style={{
                              borderBottom: isLast && !isExpanded ? 'none' : '1px solid #f1f5f9',
                              borderBottomLeftRadius: isLast && !isExpanded ? 18 : 0,
                              borderBottomRightRadius: isLast && !isExpanded ? 18 : 0,
                            }}
                          >
                            {/* Row Header / Summary */}
                            <div
                              onClick={() => toggleExpand(r.id)}
                              style={{
                                display: 'grid',
                                gridTemplateColumns:
                                  'minmax(0, 2.8fr) minmax(0, 1.4fr) 90px 95px 60px',
                                gap: 12,
                                padding: '15px 20px',
                                alignItems: 'center',
                                background: isExpanded ? '#f8fafc' : '#fff',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                              }}
                            >
                              {/* Reviewer Name, WhatsApp & Body Preview */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 10,
                                  minWidth: 0,
                                }}
                              >
                                <span
                                  style={{
                                    color: '#94a3b8',
                                    fontSize: 11,
                                    marginTop: 7,
                                    userSelect: 'none',
                                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                                    transition: 'transform 0.15s',
                                    display: 'inline-block',
                                    flexShrink: 0,
                                  }}
                                >
                                  ▶
                                </span>
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: brand.navy,
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: 13,
                                    flexShrink: 0,
                                  }}
                                >
                                  {initials(r.name)}
                                </div>
                                <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: 700,
                                        color: brand.navy,
                                        fontSize: 13.5,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '100%',
                                      }}
                                    >
                                      {r.name}
                                    </span>
                                    {r.whatsapp && (
                                      <a
                                        href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Chat with reviewer on WhatsApp"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 3,
                                          fontSize: 10.5,
                                          fontWeight: 700,
                                          color: '#16a34a',
                                          background: '#dcfce7',
                                          padding: '1px 6px',
                                          borderRadius: 6,
                                          textDecoration: 'none',
                                          maxWidth: '100%',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        💬 {r.whatsapp}
                                      </a>
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: '#64748b',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      marginTop: 2,
                                      fontStyle: 'italic',
                                    }}
                                  >
                                    "{r.body}"
                                  </div>
                                </div>
                              </div>

                              {/* Location */}
                              <div
                                style={{
                                  fontSize: 13,
                                  color: '#475569',
                                  minWidth: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {r.location || <span style={{ color: '#cbd5e1' }}>—</span>}
                              </div>

                              {/* Stars */}
                              <div style={{ minWidth: 0, flexShrink: 0 }}>
                                <StarRow stars={r.stars} />
                              </div>

                              {/* Status */}
                              <div style={{ minWidth: 0, flexShrink: 0 }}>
                                <ReviewStatusBadge status={r.status} />
                              </div>

                              {/* Actions */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  minWidth: 0,
                                  flexShrink: 0,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ActionMenu
                                  title="Review Options"
                                  disabled={!!actionLoading[r.id]}
                                  items={[
                                    {
                                      label: isExpanded ? 'Hide Full Review' : 'Read Full Review',
                                      icon: (
                                        <svg
                                          width="15"
                                          height="15"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                          <circle cx="12" cy="12" r="3" />
                                        </svg>
                                      ),
                                      color: '#2563eb',
                                      onClick: () => toggleExpand(r.id),
                                    },
                                    ...(r.status !== 'approved'
                                      ? [
                                          {
                                            label: 'Approve Testimonial',
                                            icon: (
                                              <svg
                                                width="15"
                                                height="15"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                              >
                                                <polyline points="20 6 9 17 4 12" />
                                              </svg>
                                            ),
                                            color: '#059669',
                                            hoverBg: '#ecfdf5',
                                            hoverColor: '#047857',
                                            dividerBefore: true,
                                            onClick: () => quickStatus(r.id, 'approved'),
                                          },
                                        ]
                                      : []),
                                    ...(r.status !== 'rejected'
                                      ? [
                                          {
                                            label: 'Reject Testimonial',
                                            icon: (
                                              <svg
                                                width="15"
                                                height="15"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                              >
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                              </svg>
                                            ),
                                            color: '#b91c1c',
                                            hoverBg: '#fef2f2',
                                            hoverColor: '#991b1b',
                                            onClick: () => quickStatus(r.id, 'rejected'),
                                          },
                                        ]
                                      : []),
                                    ...(r.status !== 'pending'
                                      ? [
                                          {
                                            label: 'Mark Pending',
                                            icon: (
                                              <svg
                                                width="15"
                                                height="15"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                              >
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                              </svg>
                                            ),
                                            color: '#b45309',
                                            hoverBg: '#fffbeb',
                                            hoverColor: '#92400e',
                                            onClick: () => quickStatus(r.id, 'pending'),
                                          },
                                        ]
                                      : []),
                                    {
                                      label: 'Edit & Moderate',
                                      icon: (
                                        <svg
                                          width="15"
                                          height="15"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <polyline points="16 3 21 3 21 8" />
                                          <line x1="4" y1="20" x2="21" y2="3" />
                                          <polyline points="21 16 21 21 16 21" />
                                          <line x1="15" y1="15" x2="21" y2="21" />
                                          <line x1="4" y1="4" x2="9" y2="9" />
                                        </svg>
                                      ),
                                      color: '#1e40af',
                                      dividerBefore: r.status === 'approved',
                                      onClick: () => setStatusTarget(r),
                                    },
                                    ...(r.whatsapp
                                      ? [
                                          {
                                            label: 'WhatsApp Client',
                                            icon: (
                                              <svg
                                                width="15"
                                                height="15"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z" />
                                              </svg>
                                            ),
                                            color: '#16a34a',
                                            hoverBg: '#f0fdf4',
                                            hoverColor: '#15803d',
                                            dividerBefore: true,
                                            onClick: () =>
                                              window.open(
                                                `https://wa.me/${r.whatsapp.replace(/\D/g, '')}`,
                                                '_blank'
                                              ),
                                          },
                                        ]
                                      : []),
                                    {
                                      label: 'Delete Testimonial',
                                      icon: (
                                        <svg
                                          width="15"
                                          height="15"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <polyline points="3 6 5 6 21 6" />
                                          <path d="M19 6l-1 14H6L5 6" />
                                          <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                                        </svg>
                                      ),
                                      danger: true,
                                      dividerBefore: true,
                                      onClick: () => handleDelete(r.id, r.name),
                                    },
                                  ]}
                                />
                              </div>
                            </div>

                            {/* Expanded Full Review Text Drawer */}
                            {isExpanded && (
                              <div
                                style={{
                                  padding: '0 20px 20px 48px',
                                  background: '#f8fafc',
                                  borderTop: '1px dashed #e2e8f0',
                                  borderBottomLeftRadius: isLast ? 18 : 0,
                                  borderBottomRightRadius: isLast ? 18 : 0,
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 0 8px',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: '#64748b',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.8,
                                      }}
                                    >
                                      Complete Verified Testimonial
                                    </span>
                                    {r.created_at && (
                                      <>
                                        <span style={{ color: '#cbd5e1' }}>•</span>
                                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                          Submitted on{' '}
                                          {new Date(r.created_at).toLocaleDateString('en-AE', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(r.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#64748b',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '4px 8px',
                                      borderRadius: 6,
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = brand.navy)}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                                  >
                                    Collapse ▲
                                  </button>
                                </div>

                                {/* Full Review Text Box */}
                                <div
                                  style={{
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 12,
                                    padding: '16px 20px',
                                    fontSize: 14,
                                    lineHeight: 1.7,
                                    color: '#1e293b',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                    fontFamily: fonts.body,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                  }}
                                >
                                  "{r.body}"
                                </div>

                                {/* Footer Meta Details & Quick Actions */}
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: 14,
                                    flexWrap: 'wrap',
                                    gap: 12,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: 16,
                                      alignItems: 'center',
                                      flexWrap: 'wrap',
                                      fontSize: 12,
                                      color: '#64748b',
                                    }}
                                  >
                                    {r.location && (
                                      <span>
                                        📍 <strong>Location:</strong> {r.location}
                                      </span>
                                    )}
                                    {r.whatsapp && (
                                      <span>
                                        💬 <strong>WhatsApp:</strong>{' '}
                                        <a
                                          href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            color: '#16a34a',
                                            textDecoration: 'none',
                                            fontWeight: 700,
                                          }}
                                        >
                                          {r.whatsapp}
                                        </a>
                                      </span>
                                    )}
                                    <span>
                                      <strong>Status:</strong>{' '}
                                      <ReviewStatusBadge status={r.status} />
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: 8,
                                      alignItems: 'center',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    {r.whatsapp && (
                                      <a
                                        href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 5,
                                          padding: '6px 14px',
                                          borderRadius: 8,
                                          background: '#dcfce7',
                                          color: '#15803d',
                                          fontSize: 12,
                                          fontWeight: 700,
                                          textDecoration: 'none',
                                          border: '1px solid #bbf7d0',
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
                                          padding: '6px 14px',
                                          borderRadius: 8,
                                          border: '1px solid #86efac',
                                          background: '#d1fae5',
                                          color: '#047857',
                                          fontSize: 12,
                                          fontWeight: 700,
                                          cursor: 'pointer',
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
                                          padding: '6px 14px',
                                          borderRadius: 8,
                                          border: '1px solid #fca5a5',
                                          background: '#fee2e2',
                                          color: '#b91c1c',
                                          fontSize: 12,
                                          fontWeight: 700,
                                          cursor: 'pointer',
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
                                          padding: '6px 14px',
                                          borderRadius: 8,
                                          border: '1px solid #fcd34d',
                                          background: '#fef3c7',
                                          color: '#b45309',
                                          fontSize: 12,
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        ⏳ Mark Pending
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setStatusTarget(r)}
                                      style={{
                                        padding: '6px 14px',
                                        borderRadius: 8,
                                        border: '1px solid #bfdbfe',
                                        background: '#dbeafe',
                                        color: '#1e40af',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        cursor: 'pointer',
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
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <AddReviewModal onClose={() => setShowAddModal(false)} onSaved={fetchReviews} />
      )}

      {/* Status & Edit Modal for Reviews */}
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
