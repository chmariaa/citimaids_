import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { brand, fonts, pageTitle, pageSubtitle, card, solidBtn, outlineBtn, statusBadge, idBadge, avatar } from './adminStyles';
import { getAdminDispatchWALink } from '../../utils/whatsapp';
import PrintManifestModal from './PrintManifestModal';

const statusFlow = ['pending', 'confirmed', 'completed', 'cancelled'];
const avatarColors = ['#2563eb', '#7c3aed', '#ec4899', '#d97706', '#059669', '#0891b2'];

const STATUS_THEMES = {
    pending: {
        label: 'Pending',
        subtitle: 'Awaiting dispatch assignment',
        dot: '#d97706',
        // Chosen: Warm vibrant amber/orange gradient
        activeBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        activeBorder: '#d97706',
        shadow: 'rgba(217, 119, 6, 0.35)',
        shadowHover: 'rgba(217, 119, 6, 0.45)',
        // When hovered (unchosen):
        hoverBg: '#fffbeb',
        hoverBorder: '#f59e0b',
        hoverText: '#92400e',
        hoverSubText: '#b45309',
        hoverDot: '#d97706',
    },
    confirmed: {
        label: 'Confirmed',
        subtitle: 'Cleaning team scheduled',
        dot: '#2563eb',
        // Chosen: Royal blue gradient
        activeBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        activeBorder: '#1d4ed8',
        shadow: 'rgba(37, 99, 235, 0.35)',
        shadowHover: 'rgba(37, 99, 235, 0.45)',
        // When hovered (unchosen):
        hoverBg: '#eff6ff',
        hoverBorder: '#3b82f6',
        hoverText: '#1e40af',
        hoverSubText: '#2563eb',
        hoverDot: '#2563eb',
    },
    completed: {
        label: 'Completed',
        subtitle: 'Service finished & inspected',
        dot: '#059669',
        // Chosen: Emerald green gradient
        activeBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        activeBorder: '#047857',
        shadow: 'rgba(5, 150, 105, 0.35)',
        shadowHover: 'rgba(5, 150, 105, 0.45)',
        // When hovered (unchosen):
        hoverBg: '#ecfdf5',
        hoverBorder: '#10b981',
        hoverText: '#065f46',
        hoverSubText: '#059669',
        hoverDot: '#059669',
    },
    cancelled: {
        label: 'Cancelled',
        subtitle: 'Order voided or aborted',
        dot: '#dc2626',
        // Chosen: Crimson red gradient
        activeBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        activeBorder: '#b91c1c',
        shadow: 'rgba(220, 38, 38, 0.35)',
        shadowHover: 'rgba(220, 38, 38, 0.45)',
        // When hovered (unchosen):
        hoverBg: '#fef2f2',
        hoverBorder: '#ef4444',
        hoverText: '#991b1b',
        hoverSubText: '#dc2626',
        hoverDot: '#dc2626',
    },
};

export default function BookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [hoveredStatus, setHoveredStatus] = useState(null);
    const [hoverSaveBtn, setHoverSaveBtn] = useState(false);
    const [toast, setToast] = useState(null);
    const [showManifest, setShowManifest] = useState(false);

    useEffect(() => { fetchBooking(); }, [id]);

    const fetchBooking = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/bookings/${id}`);
            const b = res.data.data || res.data;
            setBooking(b);
            setSelectedStatus(b.status);
        } catch (err) {
            console.error('Booking fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedStatus || selectedStatus === booking?.status) return;
        setSaving(true);
        try {
            const res = await api.patch(`/bookings/${id}/status`, { status: selectedStatus });
            const updated = res.data?.booking;
            if (updated) {
                setBooking(prev => ({
                    ...prev,
                    ...updated,
                    status: selectedStatus,
                }));
            } else {
                setBooking(prev => ({ ...prev, status: selectedStatus }));
            }
            showToast('Booking status updated successfully!', 'success');
        } catch (err) {
            console.error('Status update error:', err);
            const msg = err.response?.data?.message || 'Failed to update status.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const showToast = (msg, type) => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div style={{ color: brand.navy, fontSize: 15, fontWeight: 700, fontFamily: fonts.heading }}>
                    Loading Booking Details...
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div style={{ textAlign: 'center', padding: 80 }}>
                <h2 style={{ color: brand.navy, fontFamily: fonts.heading }}>Booking not found</h2>
                <button onClick={() => navigate('/admin/bookings')} style={outlineBtn}>
                    ← Back to Bookings
                </button>
            </div>
        );
    }

    const initials = booking.client?.name
        ? booking.client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'CM';
    const avatarColor = avatarColors[booking.id % avatarColors.length];
    const bookingIdStr = `#${String(booking.id).padStart(4, '0')}`;
    const preferredDate = booking.preferred_date
        ? new Date(booking.preferred_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : '—';
    const createdAt = booking.created_at
        ? new Date(booking.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';

    return (
        <div style={{ fontFamily: fonts.body }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 24, right: 24, zIndex: 9999,
                    padding: '14px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600,
                    background: toast.type === 'success' ? '#059669' : '#dc2626', color: '#fff',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        {toast.type === 'success'
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        }
                    </svg>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <button
                        onClick={() => navigate('/admin/bookings')}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            color: '#64748b', background: 'none', border: 'none',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 8,
                        }}
                    >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Bookings
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h1 style={pageTitle}>Booking {bookingIdStr}</h1>
                        <span style={statusBadge(booking.status)}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                        </span>
                    </div>
                    <p style={pageSubtitle}>Submitted on {createdAt}</p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    {/* Quick WhatsApp Dispatch Action */}
                    <a
                        href={getAdminDispatchWALink(booking, booking.status === 'completed' ? 'completed' : 'confirmed')}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            ...solidBtn,
                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            color: '#fff',
                            textDecoration: 'none',
                            boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)',
                            transition: 'all 0.18s ease-in-out',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 18px rgba(22, 163, 74, 0.35)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(22, 163, 74, 0.25)';
                        }}
                    >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z" />
                        </svg>
                        WhatsApp Customer
                    </a>
                    <button
                        onClick={() => setShowManifest(true)}
                        style={{
                            ...outlineBtn,
                            transition: 'all 0.18s ease-in-out',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(10, 35, 66, 0.08)';
                            e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.background = '#fff';
                        }}
                    >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Manifest
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 24, alignItems: 'start' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Client Information */}
                    <div style={{ ...card, padding: '26px 28px' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: brand.navy, margin: '0 0 20px', fontFamily: fonts.heading }}>
                            Client Information
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 18, borderBottom: `1px solid ${brand.border}` }}>
                            <div style={avatar(avatarColor, 52)}>{initials}</div>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: brand.navy, fontFamily: fonts.heading }}>
                                    {booking.client?.name || 'Client Name'}
                                </div>
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: 500 }}>
                                    Registered Client Account · Abu Dhabi
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <FieldItem
                                icon={
                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                }
                                label="Contact Number"
                                value={booking.client?.contact_number || '—'}
                            />
                            <FieldItem
                                icon={
                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                }
                                label="Email Address"
                                value={booking.client?.email || '—'}
                            />
                            <div style={{ gridColumn: 'span 2' }}>
                                <FieldItem
                                    icon={
                                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><circle cx="12" cy="11" r="3" />
                                        </svg>
                                    }
                                    label="Service Address"
                                    value={booking.client?.address || '—'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div style={{ ...card, padding: '26px 28px' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: brand.navy, margin: '0 0 20px', fontFamily: fonts.heading }}>
                            Service & Schedule
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <FieldItem
                                icon={
                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                }
                                label="Selected Service"
                                value={booking.service?.name || 'Home Cleaning'}
                            />
                            <FieldItem
                                icon={
                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                                    </svg>
                                }
                                label="Preferred Schedule"
                                value={preferredDate}
                            />
                            <FieldItem
                                icon={
                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                }
                                label="Booking Reference"
                                value={bookingIdStr}
                            />
                            <FieldItem
                                icon={
                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                }
                                label="Assigned Specialist"
                                value={booking.processed_by?.name || 'Operations Dispatch Queue'}
                            />
                        </div>

                        {booking.notes && (
                            <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${brand.border}` }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                                    Access & Instructions
                                </div>
                                <div style={{
                                    background: brand.softBg,
                                    border: `1px solid ${brand.border}`,
                                    borderRadius: 12,
                                    padding: '14px 16px',
                                    fontSize: 13.5,
                                    color: brand.navy,
                                    lineHeight: 1.6,
                                }}>
                                    {booking.notes}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Status Management Card */}
                    <div style={{ ...card, padding: '26px' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: brand.navy, margin: '0 0 12px', fontFamily: fonts.heading }}>
                            Workflow & Status
                        </h3>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px', lineHeight: 1.5 }}>
                            Update the dispatch stage to notify customer and field team.
                        </p>

                        {/* Status flow tracker */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            {statusFlow.map((s) => {
                                const isSelected = selectedStatus === s;
                                const isHovered = hoveredStatus === s;
                                const theme = STATUS_THEMES[s] || STATUS_THEMES.pending;

                                // Fully declarative styling based on chosen & hover states:
                                // If chosen: rich vibrant status gradient, white text, glowing white indicator, badge
                                // If unchosen & hovered: soft status tint, status border, status text, glowing status dot
                                // If unchosen & unhovered (including PREVIOUS button): 100% NO COLOR (pure white, neutral border, slate text, gray dot, NO badge)
                                let itemBg = '#ffffff';
                                let itemBorder = '1.5px solid #e2e8f0';
                                let itemColor = '#334155';
                                let itemSubColor = '#94a3b8';
                                let itemDotBg = '#cbd5e1';
                                let itemDotGlow = 'none';
                                let itemShadow = 'none';
                                let itemTransform = 'translateY(0)';

                                if (isSelected) {
                                    itemBg = theme.activeBg;
                                    itemBorder = `2px solid ${theme.activeBorder}`;
                                    itemColor = '#ffffff';
                                    itemSubColor = 'rgba(255, 255, 255, 0.9)';
                                    itemDotBg = '#ffffff';
                                    itemDotGlow = '0 0 10px rgba(255, 255, 255, 0.95)';
                                    itemShadow = isHovered ? `0 8px 24px ${theme.shadowHover}` : `0 4px 16px ${theme.shadow}`;
                                    itemTransform = isHovered ? 'translateY(-2px)' : 'translateY(0)';
                                } else if (isHovered) {
                                    itemBg = theme.hoverBg;
                                    itemBorder = `1.5px solid ${theme.hoverBorder}`;
                                    itemColor = theme.hoverText;
                                    itemSubColor = theme.hoverSubText;
                                    itemDotBg = theme.hoverDot;
                                    itemDotGlow = `0 0 8px ${theme.hoverDot}80`;
                                    itemShadow = '0 4px 14px rgba(0, 0, 0, 0.08)';
                                    itemTransform = 'translateY(-2px)';
                                }

                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSelectedStatus(s)}
                                        onMouseEnter={() => setHoveredStatus(s)}
                                        onMouseLeave={() => setHoveredStatus(null)}
                                        onFocus={() => setHoveredStatus(s)}
                                        onBlur={() => setHoveredStatus(null)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '12px 16px',
                                            borderRadius: 14,
                                            width: '100%',
                                            textAlign: 'left',
                                            background: itemBg,
                                            border: itemBorder,
                                            color: itemColor,
                                            cursor: 'pointer',
                                            transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                                            transform: itemTransform,
                                            boxShadow: itemShadow,
                                            fontFamily: 'inherit',
                                            outline: 'none',
                                        }}
                                    >
                                        {/* Status Dot */}
                                        <div
                                            style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                backgroundColor: itemDotBg,
                                                boxShadow: itemDotGlow,
                                                transition: 'all 0.18s ease-in-out',
                                                flexShrink: 0,
                                            }}
                                        />

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 13,
                                                fontWeight: isSelected ? 800 : 600,
                                                color: itemColor,
                                                textTransform: 'capitalize',
                                                lineHeight: 1.2,
                                            }}>
                                                {theme.label}
                                            </div>
                                            <div style={{
                                                fontSize: 11,
                                                color: itemSubColor,
                                                marginTop: 2,
                                            }}>
                                                {theme.subtitle}
                                            </div>
                                        </div>

                                        {/* ONLY show badge on the currently CHOSEN button. The previous button loses its badge and has NO color */}
                                        {isSelected && (
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 800,
                                                color: '#ffffff',
                                                background: 'rgba(255, 255, 255, 0.24)',
                                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                                padding: '3px 8px',
                                                borderRadius: 6,
                                                letterSpacing: 0.6,
                                                textTransform: 'uppercase',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                flexShrink: 0,
                                                backdropFilter: 'blur(4px)',
                                            }}>
                                                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                                {s === booking?.status ? 'CURRENT' : 'CHOSEN'}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={handleStatusUpdate}
                            disabled={saving || !selectedStatus || selectedStatus === booking?.status}
                            onMouseEnter={() => setHoverSaveBtn(true)}
                            onMouseLeave={() => setHoverSaveBtn(false)}
                            style={{
                                ...solidBtn,
                                width: '100%',
                                justifyContent: 'center',
                                padding: '12px 18px',
                                fontSize: 13,
                                fontWeight: 700,
                                borderRadius: 12,
                                transition: 'all 0.18s ease-in-out',
                                background: selectedStatus && selectedStatus !== booking?.status
                                    ? 'linear-gradient(135deg, #0A2342 0%, #1d4ed8 100%)'
                                    : '#f1f5f9',
                                border: selectedStatus && selectedStatus !== booking?.status ? 'none' : '1.5px solid #e2e8f0',
                                color: selectedStatus && selectedStatus !== booking?.status ? '#ffffff' : '#94a3b8',
                                boxShadow: selectedStatus && selectedStatus !== booking?.status
                                    ? (hoverSaveBtn ? '0 8px 22px rgba(10, 35, 66, 0.35)' : '0 4px 14px rgba(10, 35, 66, 0.25)')
                                    : 'none',
                                transform: selectedStatus && selectedStatus !== booking?.status && hoverSaveBtn ? 'translateY(-2px)' : 'translateY(0)',
                                cursor: selectedStatus && selectedStatus !== booking?.status && !saving ? 'pointer' : 'not-allowed',
                                opacity: saving ? 0.75 : 1,
                            }}
                        >
                            {saving ? (
                                <>
                                    <svg style={{ animation: 'spin 1s linear infinite' }} width="14" height="14" fill="none" viewBox="0 0 24 24">
                                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Updating Status...
                                </>
                            ) : selectedStatus && selectedStatus !== booking?.status ? (
                                <>
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Status as {STATUS_THEMES[selectedStatus]?.label || selectedStatus}
                                </>
                            ) : (
                                'Status Unchanged'
                            )}
                        </button>
                    </div>

                    {/* Financial Summary */}
                    <div style={{ ...card, padding: '24px' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: brand.navy, margin: '0 0 16px', fontFamily: fonts.heading }}>
                            Estimated Charges
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                <span>Service Rate</span>
                                <span style={{ fontWeight: 700, color: brand.navy }}>
                                    AED {booking.service?.base_price ? Number(booking.service.base_price).toLocaleString() : '35'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                <span>Inspection Guarantee</span>
                                <span style={{ fontWeight: 700, color: '#059669' }}>Free</span>
                            </div>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderTop: `1px solid ${brand.border}`, paddingTop: 12, marginTop: 4,
                            }}>
                                <span style={{ fontWeight: 700, color: brand.navy }}>Total Due Upon Completion</span>
                                <span style={{ fontSize: 18, fontWeight: 800, color: brand.navy, fontFamily: fonts.heading }}>
                                    AED {booking.service?.base_price ? Number(booking.service.base_price).toLocaleString() : '35'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Tracking & WhatsApp Dispatch Card */}
                    <div style={{ ...card, padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8,
                                background: '#f0fdf4', color: '#16a34a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z" />
                                </svg>
                            </div>
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: brand.navy, margin: 0, fontFamily: fonts.heading }}>
                                Client Tracking & Dispatch
                            </h3>
                        </div>

                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                            Clients can track their status live on our portal with their reference code:
                        </div>

                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 12px', background: '#f8fafc',
                            border: `1px solid ${brand.border}`, borderRadius: 10,
                            marginBottom: 16,
                        }}>
                            <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: brand.navy, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {`${window.location.origin}/track-booking?ref=CM-${String(booking.id).padStart(5, '0')}`}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/track-booking?ref=CM-${String(booking.id).padStart(5, '0')}`);
                                    showToast('Tracking link copied to clipboard!', 'success');
                                }}
                                title="Copy tracking link"
                                style={{
                                    border: 'none', background: '#e2e8f0', color: brand.navy,
                                    padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                Copy
                            </button>
                            <a
                                href={`/track-booking?ref=CM-${String(booking.id).padStart(5, '0')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open tracking portal"
                                style={{
                                    border: 'none', background: '#dbeafe', color: '#1d4ed8',
                                    padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                    cursor: 'pointer', textDecoration: 'none',
                                }}
                            >
                                Open
                            </a>
                        </div>

                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                            Quick WhatsApp Message Templates
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <a
                                href={getAdminDispatchWALink(booking, 'confirmed')}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 14px', borderRadius: 10,
                                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                                    color: '#15803d', fontSize: 12, fontWeight: 700,
                                    textDecoration: 'none', transition: 'all 0.15s',
                                }}
                            >
                                <span>Send "Confirmed & Scheduled"</span>
                                <span>➔</span>
                            </a>
                            <a
                                href={getAdminDispatchWALink(booking, 'en_route')}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 14px', borderRadius: 10,
                                    background: '#fffbeb', border: '1px solid #fef3c7',
                                    color: '#b45309', fontSize: 12, fontWeight: 700,
                                    textDecoration: 'none', transition: 'all 0.15s',
                                }}
                            >
                                <span>Send "Crew En Route" Alert</span>
                                <span>➔</span>
                            </a>
                            <a
                                href={getAdminDispatchWALink(booking, 'completed')}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 14px', borderRadius: 10,
                                    background: '#f5f3ff', border: '1px solid #ede9fe',
                                    color: '#6d28d9', fontSize: 12, fontWeight: 700,
                                    textDecoration: 'none', transition: 'all 0.15s',
                                }}
                            >
                                <span>Send "Service Completed & Review"</span>
                                <span>➔</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Redesigned Print Manifest Modal */}
            {showManifest && (
                <PrintManifestModal
                    booking={booking}
                    onClose={() => setShowManifest(false)}
                />
            )}
        </div>
    );
}

function FieldItem({ icon, label, value }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                <span style={{ color: brand.royal }}>{icon}</span>
                {label}
            </div>
            <div style={{ fontSize: 14, color: brand.navy, fontWeight: 600 }}>
                {value}
            </div>
        </div>
    );
}
