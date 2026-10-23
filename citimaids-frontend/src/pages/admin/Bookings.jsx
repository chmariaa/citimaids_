import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import {
    brand,
    fonts,
    pageTitle,
    pageSubtitle,
    card,
    solidBtn as solidBtnBase,
    outlineBtn as outlineBtnBase,
    searchBar,
    searchInput,
    idBadge,
    statusBadge,
    avatar,
    inputStyle as inputStyleBase,
    selectStyle as selectStyleBase,
} from './adminStyles';
import { getAdminDispatchWALink } from '../../utils/whatsapp';

/**
 * ── Status Tab Filter Box Configurations ──
 * Provides distinct visual color themes (background, border, text, badge, and indicator dot)
 * for each status box (All, Pending, Confirmed, Completed, Cancelled).
 * Both inactive and active states are clearly styled so users can immediately distinguish them.
 */
const STATUS_TABS_CONFIG = {
    all: {
        label: 'All',
        dotColor: '#0A2342',
        // Inactive: Crisp slate-tinted box so it is visible and defined
        inactive: {
            bg: '#f8fafc',
            border: '#cbd5e1',
            text: '#1e293b',
            badgeBg: '#e2e8f0',
            badgeText: '#0f172a',
        },
        // Active: Citimaids signature navy brand gradient
        active: {
            bg: 'linear-gradient(135deg, #0A2342 0%, #1E3A8A 100%)',
            border: '#0A2342',
            text: '#ffffff',
            badgeBg: 'rgba(255, 255, 255, 0.22)',
            badgeText: '#ffffff',
            shadow: '0 4px 14px rgba(10, 35, 66, 0.25)',
        },
    },
    pending: {
        label: 'Pending',
        dotColor: '#d97706',
        // Inactive: Warm soft amber/yellow box so the user can easily see it
        inactive: {
            bg: '#fffbeb',
            border: '#fcd34d',
            text: '#b45309',
            badgeBg: '#fef3c7',
            badgeText: '#92400e',
        },
        // Active: Vibrant amber gradient with glow
        active: {
            bg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            border: '#d97706',
            text: '#ffffff',
            badgeBg: 'rgba(255, 255, 255, 0.28)',
            badgeText: '#ffffff',
            shadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
        },
    },
    confirmed: {
        label: 'Confirmed',
        dotColor: '#2563eb',
        // Inactive: Soft royal blue box
        inactive: {
            bg: '#eff6ff',
            border: '#93c5fd',
            text: '#1d4ed8',
            badgeBg: '#dbeafe',
            badgeText: '#1e40af',
        },
        // Active: Royal blue gradient with glow
        active: {
            bg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            border: '#2563eb',
            text: '#ffffff',
            badgeBg: 'rgba(255, 255, 255, 0.28)',
            badgeText: '#ffffff',
            shadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
        },
    },
    completed: {
        label: 'Completed',
        dotColor: '#059669',
        // Inactive: Soft emerald green box
        inactive: {
            bg: '#ecfdf5',
            border: '#86efac',
            text: '#047857',
            badgeBg: '#d1fae5',
            badgeText: '#065f46',
        },
        // Active: Emerald green gradient with glow
        active: {
            bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            border: '#059669',
            text: '#ffffff',
            badgeBg: 'rgba(255, 255, 255, 0.28)',
            badgeText: '#ffffff',
            shadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
        },
    },
    cancelled: {
        label: 'Cancelled',
        dotColor: '#dc2626',
        // Inactive: Soft rose-red box
        inactive: {
            bg: '#fef2f2',
            border: '#fca5a5',
            text: '#b91c1c',
            badgeBg: '#fee2e2',
            badgeText: '#991b1b',
        },
        // Active: Crimson red gradient with glow
        active: {
            bg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            border: '#dc2626',
            text: '#ffffff',
            badgeBg: 'rgba(255, 255, 255, 0.28)',
            badgeText: '#ffffff',
            shadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
        },
    },
};

const serviceColors = {
    'Home Cleaning': '#059669',
    'Office Cleaning': '#2563eb',
    'Villa Cleaning': '#7c3aed',
    'Deep Cleaning': '#d97706',
    'Carpet & Sofa Cleaning': '#ec4899',
    'Window & Glass Cleaning': '#0891b2',
    'Move-in / Move-out Cleaning': '#dc2626',
};

const avatarColors = ['#2563eb', '#7c3aed', '#ec4899', '#d97706', '#059669', '#0891b2'];

const TIME_SLOTS = [
    'Morning (08:00 - 12:00)',
    'Afternoon (13:00 - 17:00)',
    'Evening (17:00 - 21:00)',
    'Custom Time',
];

export default function Bookings() {
    const navigate = useNavigate();
    const location = useLocation();

    // Table state
    const [bookings, setBookings] = useState([]);
    const [meta, setMeta] = useState({});
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const searchTimerRef = useRef(null);

    // Toast notification
    const [toast, setToast] = useState(null);

    // New Booking Modal state
    const [showNewModal, setShowNewModal] = useState(false);
    const [services, setServices] = useState([]);
    const [loadingModalData, setLoadingModalData] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const defaultForm = {
        name: '',
        contactNumber: '',
        email: '',
        serviceId: '',
        preferredDate: new Date().toISOString().split('T')[0],
        timeSlot: 'Morning (08:00 - 12:00)',
        customTime: '',
        address: '',
        status: 'pending',
        totalAmount: '',
        paymentStatus: 'unpaid',
        paymentMethod: 'Cash on Completion',
        notes: '',
    };

    const [form, setForm] = useState(defaultForm);

    /**
     * Debounce search input changes by 350ms so user typing doesn't trigger
     * rapid, redundant requests to the backend server.
     */
    useEffect(() => {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 350);
        return () => clearTimeout(searchTimerRef.current);
    }, [search]);

    /**
     * Fetch bookings whenever:
     * - Status filter tab changes ('all', 'pending', 'confirmed', 'completed', 'cancelled')
     * - Debounced search keyword changes (matches client name, service name, or booking ID)
     * - Current pagination page changes
     */
    useEffect(() => {
        fetchBookings();
    }, [activeTab, debouncedSearch, page]);

    // Handle incoming navigation with openNewBooking flag (e.g. from Dashboard)
    useEffect(() => {
        if (location.state?.openNewBooking) {
            setShowNewModal(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state]);

    // Load services whenever the modal is opened
    useEffect(() => {
        if (showNewModal) {
            loadModalData();
        }
    }, [showNewModal]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    /**
     * Fetch bookings from API with pagination, status filtering, and multi-field search parameters.
     * The backend queries across:
     * - Client name, email, and contact number
     * - Service name (e.g., Home Cleaning, Deep Cleaning)
     * - Booking ID (e.g., #0001, 1, 0001)
     */
    const fetchBookings = async () => {
        setLoading(true);
        try {
            const params = { page };
            if (activeTab !== 'all') params.status = activeTab;
            if (debouncedSearch) params.search = debouncedSearch;
            const res = await api.get('/bookings', { params });
            setBookings(res.data.data || []);
            setMeta(res.data);
        } catch (err) {
            console.error('Bookings fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadModalData = async () => {
        setLoadingModalData(true);
        setFormError('');
        try {
            const svcRes = await api.get('/services').catch(() => ({ data: [] }));
            const svcData = Array.isArray(svcRes.data) ? svcRes.data : (svcRes.data.data || []);
            setServices(svcData);

            // Pre-select first service if none selected
            if (svcData.length > 0 && !form.serviceId) {
                setForm(prev => ({
                    ...prev,
                    serviceId: svcData[0].id,
                    totalAmount: svcData[0].base_price ? String(svcData[0].base_price) : prev.totalAmount,
                }));
            }
        } catch (err) {
            console.error('Failed to load services:', err);
        } finally {
            setLoadingModalData(false);
        }
    };

    const handleServiceChange = (svcId) => {
        const found = services.find(s => String(s.id) === String(svcId));
        setForm(prev => ({
            ...prev,
            serviceId: svcId,
            totalAmount: found?.base_price ? String(found.base_price) : prev.totalAmount,
        }));
    };

    const handleCreateBooking = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!form.name.trim()) {
            setFormError('Client name is required.');
            return;
        }

        if (!form.contactNumber.trim()) {
            setFormError('Contact phone number is required.');
            return;
        }

        if (!form.serviceId) {
            setFormError('Please choose a service.');
            return;
        }

        if (!form.preferredDate) {
            setFormError('Preferred booking date is required.');
            return;
        }

        if (!form.address.trim()) {
            setFormError('Service address is required.');
            return;
        }

        setFormSubmitting(true);
        try {
            const timeDesc = form.timeSlot === 'Custom Time'
                ? (form.customTime.trim() ? `Time: ${form.customTime.trim()}` : '')
                : (form.timeSlot ? `Slot: ${form.timeSlot}` : '');

            const fullNotes = [timeDesc, form.notes.trim()].filter(Boolean).join(' | ') || null;

            const payload = {
                name: form.name.trim(),
                contact_number: form.contactNumber.trim(),
                service_id: Number(form.serviceId),
                preferred_date: form.preferredDate,
                address: form.address.trim(),
                status: form.status,
                total_amount: form.totalAmount ? Number(form.totalAmount) : undefined,
                payment_status: form.paymentStatus,
                payment_method: form.paymentMethod,
                notes: fullNotes,
            };

            if (form.email.trim()) {
                payload.email = form.email.trim();
            }

            const res = await api.post('/bookings', payload);
            const refStr = res.data?.reference || (res.data?.booking_id ? `#${String(res.data.booking_id).padStart(4, '0')}` : 'New');

            showToast(`Booking ${refStr} created successfully!`, 'success');
            setShowNewModal(false);
            setForm(defaultForm);
            fetchBookings();
        } catch (err) {
            console.error('Error creating booking:', err);
            const errData = err.response?.data;
            let errMsg = 'Failed to create booking. Please check the inputs and try again.';
            if (errData?.errors) {
                errMsg = Object.values(errData.errors).flat().join(' ');
            } else if (errData?.message) {
                errMsg = errData.message;
            }
            setFormError(errMsg);
        } finally {
            setFormSubmitting(false);
        }
    };

    /**
     * Tab badge counts:
     * Uses backend status_counts calculated by the API to ensure accurate counts
     * even when a specific status filter is active. Falls back to client-filtered list or meta.total.
     */
    const tabCounts = {
        all: meta.status_counts?.all ?? meta.total ?? bookings.length,
        pending: meta.status_counts?.pending ?? bookings.filter(b => b.status === 'pending').length,
        confirmed: meta.status_counts?.confirmed ?? bookings.filter(b => b.status === 'confirmed').length,
        completed: meta.status_counts?.completed ?? bookings.filter(b => b.status === 'completed').length,
        cancelled: meta.status_counts?.cancelled ?? bookings.filter(b => b.status === 'cancelled').length,
    };

    return (
        <div style={{ fontFamily: fonts.body }}>
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: 24,
                    right: 24,
                    zIndex: 9999,
                    padding: '14px 22px',
                    borderRadius: 14,
                    fontSize: 14,
                    fontWeight: 600,
                    background: toast.type === 'success' ? '#059669' : '#dc2626',
                    color: '#fff',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    animation: 'fadeIn 0.2s ease-out',
                }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        {toast.type === 'success'
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        }
                    </svg>
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <h1 style={pageTitle}>Bookings</h1>
                    <p style={pageSubtitle}>Manage all customer booking requests</p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    style={{
                        ...solidBtnBase,
                        padding: '11px 24px',
                        cursor: 'pointer',
                        transform: 'translateY(0)',
                        transition: 'all 0.15s ease-in-out',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New Booking
                </button>
            </div>

            {/* ── Search Toolbar ──
              * Search box functional for:
              * 1. Client Name (e.g., "Sarah")
              * 2. Service Name (e.g., "Deep Cleaning", "Home Cleaning")
              * 3. Booking ID (e.g., "#0001", "0001", or "1")
              */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{
                    ...searchBar,
                    maxWidth: 500,
                    position: 'relative',
                    borderColor: search ? brand.royal : brand.border,
                    boxShadow: search ? '0 0 0 3px rgba(37,99,235,0.1)' : '0 2px 6px rgba(10,35,66,0.02)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={search ? brand.royal : '#94a3b8'} strokeWidth="2.2">
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name, service, or booking ID (e.g. Sarah, Deep Cleaning, #0001)..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1); // Reset page to 1 on each search stroke
                        }}
                        style={searchInput}
                    />
                    {/* Clear button when search text is active */}
                    {search && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setDebouncedSearch('');
                                setPage(1);
                            }}
                            title="Clear search"
                            style={{
                                background: '#f1f5f9',
                                border: 'none',
                                borderRadius: '50%',
                                width: 22,
                                height: 22,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#64748b',
                                transition: 'all 0.15s',
                                padding: 0,
                                flexShrink: 0,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                        >
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Search query active badge pill */}
                {debouncedSearch && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#1d4ed8',
                    }}>
                        <span>Searching: <strong>"{debouncedSearch}"</strong></span>
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setDebouncedSearch('');
                                setPage(1);
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#1d4ed8',
                                display: 'flex',
                                alignItems: 'center',
                                padding: 0,
                            }}
                            title="Clear search filter"
                        >
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* ── Status Tab Filter Buttons with Distinct Box Colors ──
              * Color-coded boxes so users can clearly see each category:
              * - "All": Slate / Navy
              * - "Pending": Amber / Yellow
              * - "Confirmed": Royal Blue
              * - "Completed": Emerald Green
              * - "Cancelled": Rose Red
              * Each button has a colored box background, colored border, status dot, label, and counter badge.
              */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
                {Object.keys(STATUS_TABS_CONFIG).map(tabKey => {
                    const cfg = STATUS_TABS_CONFIG[tabKey];
                    const isActive = activeTab === tabKey;
                    const styleTheme = isActive ? cfg.active : cfg.inactive;
                    const count = tabCounts[tabKey] ?? 0;

                    return (
                        <button
                            key={tabKey}
                            type="button"
                            onClick={() => {
                                setActiveTab(tabKey);
                                setPage(1); // Reset page to 1 when switching status tab
                            }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '9px 18px',
                                borderRadius: 12,
                                border: `1.5px solid ${styleTheme.border}`,
                                background: styleTheme.bg,
                                color: styleTheme.text,
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.18s ease-in-out',
                                boxShadow: isActive ? styleTheme.shadow : '0 1px 3px rgba(0,0,0,0.04)',
                                transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                            }}
                            onMouseEnter={e => {
                                if (!isActive) {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.08)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isActive) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                                }
                            }}
                        >
                            {/* Color-coded status indicator dot */}
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: isActive ? '#ffffff' : cfg.dotColor,
                                    boxShadow: isActive ? '0 0 6px rgba(255,255,255,0.8)' : 'none',
                                    flexShrink: 0,
                                }}
                            />

                            {/* Status label */}
                            <span>{cfg.label}</span>

                            {/* Count pill badge showing total items in this status */}
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    background: styleTheme.badgeBg,
                                    color: styleTheme.badgeText,
                                    minWidth: 18,
                                    textAlign: 'center',
                                    lineHeight: '14px',
                                }}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Bookings Table */}
            <div style={{ ...card, overflow: 'hidden' }}>
                {/* Table Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 1fr 1fr 130px 90px',
                    padding: '14px 24px',
                    borderBottom: `1px solid ${brand.border}`,
                    background: brand.softBg,
                }}>
                    {['BOOKING ID', 'CLIENT', 'SERVICE', 'PREFERRED DATE', 'STATUS', 'ACTIONS'].map(h => (
                        <span key={h} style={{
                            fontSize: 10, fontWeight: 700, color: '#64748b',
                            letterSpacing: 0.8, textTransform: 'uppercase',
                        }}>{h}</span>
                    ))}
                </div>

                {/* Table Body */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 14 }}>Loading bookings...</div>
                ) : bookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%', background: '#eff6ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 12px', color: '#2563eb',
                        }}>
                            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                        </div>
                        <div style={{ fontWeight: 700, color: brand.navy, fontSize: 15, marginBottom: 4 }}>
                            {debouncedSearch ? `No bookings matching "${debouncedSearch}"` : 'No bookings found'}
                        </div>
                        <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                            {debouncedSearch
                                ? 'Try searching with another client name, service title, or booking ID.'
                                : 'Click "New Booking" to create your first booking dispatch.'}
                        </div>
                        {debouncedSearch ? (
                            <button
                                onClick={() => { setSearch(''); setDebouncedSearch(''); setPage(1); }}
                                style={{ ...outlineBtnBase, fontSize: 12, padding: '8px 18px', gap: 6 }}
                            >
                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear Search Filter
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowNewModal(true)}
                                style={{ ...solidBtnBase, fontSize: 12, padding: '8px 18px' }}
                            >
                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Create Booking Now
                            </button>
                        )}
                    </div>
                ) : (
                    bookings.map((booking) => {
                        const initials = booking.client?.name
                            ? booking.client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                            : 'CM';
                        const avatarColor = avatarColors[booking.id % avatarColors.length];
                        const svcColor = serviceColors[booking.service?.name] || '#6366f1';
                        const bookingIdStr = `#${String(booking.id).padStart(4, '0')}`;

                        return (
                            <div key={booking.id} style={{
                                display: 'grid',
                                gridTemplateColumns: '100px 1fr 1fr 1fr 130px 90px',
                                padding: '16px 24px',
                                borderBottom: '1px solid #f1f5f9',
                                alignItems: 'center',
                                transition: 'background 0.15s',
                                cursor: 'pointer',
                            }}
                                onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            >
                                {/* Booking ID */}
                                <span style={idBadge}>{bookingIdStr}</span>

                                {/* Client */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={avatar(avatarColor, 36)}>{initials}</div>
                                    <div>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: brand.navy, display: 'block' }}>
                                            {booking.client?.name || '—'}
                                        </span>
                                        {booking.client?.contact_number && (
                                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                                {booking.client.contact_number}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Service */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: svcColor, flexShrink: 0 }} />
                                    <span style={{
                                        fontSize: 13, fontWeight: 600, color: svcColor,
                                    }}>{booking.service?.name || '—'}</span>
                                </div>

                                {/* Date */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                                    </svg>
                                    {booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                </div>

                                {/* Status */}
                                <div>
                                    <span style={statusBadge(booking.status)}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                                    <a
                                        href={getAdminDispatchWALink(booking, booking.status === 'completed' ? 'completed' : 'confirmed')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="WhatsApp Client (Status & Tracking Link)"
                                        style={{
                                            ...actionBtn,
                                            color: '#16a34a',
                                            borderColor: '#bbf7d0',
                                            background: '#f0fdf4',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z" />
                                        </svg>
                                    </a>
                                    <button
                                        title="View Details"
                                        onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                                        style={actionBtn}
                                    >
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 24px',
                        borderTop: `1px solid ${brand.border}`,
                    }}>
                        <span style={{ fontSize: 13, color: '#64748b' }}>
                            Showing {meta.from}–{meta.to} of {meta.total} entries
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <PaginationBtn label="‹" active={false} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} />
                            {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => i + 1).map(p => (
                                <PaginationBtn key={p} label={p} active={p === page} onClick={() => setPage(p)} />
                            ))}
                            {meta.last_page > 5 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>}
                            {meta.last_page > 5 && (
                                <PaginationBtn label={meta.last_page} active={page === meta.last_page} onClick={() => setPage(meta.last_page)} />
                            )}
                            <PaginationBtn label="›" active={false} disabled={page >= meta.last_page} onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} />
                        </div>
                    </div>
                )}
            </div>

            {/* ── CREATE NEW BOOKING MODAL ───────────────────────── */}
            {showNewModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(6, 20, 41, 0.65)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        animation: 'fadeIn 0.2s ease-out',
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !formSubmitting) {
                            setShowNewModal(false);
                        }
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: 22,
                            width: '100%',
                            maxWidth: 680,
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 25px 60px rgba(10, 35, 66, 0.25)',
                            border: `1px solid ${brand.border}`,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '22px 28px',
                            borderBottom: `1px solid ${brand.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#fff',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 12,
                                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                    color: brand.royal,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: brand.navy, fontFamily: fonts.heading }}>
                                        Create New Booking
                                    </h2>
                                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                                        Schedule cleaning service & assign customer dispatch details
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => !formSubmitting && setShowNewModal(false)}
                                disabled={formSubmitting}
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    border: `1px solid ${brand.border}`,
                                    background: '#f8fafc',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#64748b',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleCreateBooking} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
                                {formError && (
                                    <div style={{
                                        padding: '12px 16px',
                                        borderRadius: 12,
                                        background: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        color: '#b91c1c',
                                        fontSize: 13,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                    }}>
                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                                        </svg>
                                        <span>{formError}</span>
                                    </div>
                                )}

                                {/* SECTION 1: Client Information */}
                                <div style={{ background: '#f8fafc', border: `1px solid ${brand.border}`, borderRadius: 16, padding: '18px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={brand.navy} strokeWidth="2.2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: brand.navy, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Client Information
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12 }}>
                                        <div>
                                            <FormLabel required>Full Name</FormLabel>
                                            <input
                                                type="text"
                                                placeholder="e.g. Sarah Jenkins"
                                                value={form.name}
                                                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                                required
                                                style={{ ...inputStyleBase, background: '#fff' }}
                                            />
                                        </div>
                                        <div>
                                            <FormLabel required>Contact Number</FormLabel>
                                            <input
                                                type="text"
                                                placeholder="+971 50 000 0000"
                                                value={form.contactNumber}
                                                onChange={e => setForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                                                required
                                                style={{ ...inputStyleBase, background: '#fff' }}
                                            />
                                        </div>
                                        <div>
                                            <FormLabel>Email (Optional)</FormLabel>
                                            <input
                                                type="email"
                                                placeholder="client@mail.com"
                                                value={form.email}
                                                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                                style={{ ...inputStyleBase, background: '#fff' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: Service & Schedule */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                                    <div>
                                        <FormLabel required>Service Type</FormLabel>
                                        <select
                                            value={form.serviceId}
                                            onChange={e => handleServiceChange(e.target.value)}
                                            required
                                            style={selectStyleBase}
                                        >
                                            <option value="">-- Choose Service --</option>
                                            {services.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} {s.base_price ? `(AED ${s.base_price})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <FormLabel required>Preferred Date</FormLabel>
                                        <input
                                            type="date"
                                            value={form.preferredDate}
                                            onChange={e => setForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                                            required
                                            style={inputStyleBase}
                                        />
                                    </div>
                                </div>

                                {/* SECTION 3: Time Slot */}
                                <div>
                                    <FormLabel>Time Slot</FormLabel>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                        {TIME_SLOTS.map(slot => {
                                            const active = form.timeSlot === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setForm(prev => ({ ...prev, timeSlot: slot }))}
                                                    style={{
                                                        padding: '9px 8px',
                                                        borderRadius: 10,
                                                        border: `1.5px solid ${active ? brand.royal : brand.border}`,
                                                        background: active ? '#eff6ff' : '#fff',
                                                        color: active ? brand.royal : '#475569',
                                                        fontSize: 11.5,
                                                        fontWeight: active ? 700 : 500,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {form.timeSlot === 'Custom Time' && (
                                        <div style={{ marginTop: 10 }}>
                                            <input
                                                type="text"
                                                placeholder="e.g. 10:30 AM or Specific window"
                                                value={form.customTime}
                                                onChange={e => setForm(prev => ({ ...prev, customTime: e.target.value }))}
                                                style={inputStyleBase}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* SECTION 4: Service Address */}
                                <div>
                                    <FormLabel required>Service Address</FormLabel>
                                    <textarea
                                        rows={2}
                                        placeholder="Apartment/Villa #, Street, District/Area, Abu Dhabi/Dubai"
                                        value={form.address}
                                        onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                                        required
                                        style={{ ...inputStyleBase, resize: 'vertical' }}
                                    />
                                </div>

                                {/* SECTION 5: Status, Total Amount & Payment */}
                                <div style={{
                                    background: '#f8fafc',
                                    border: `1px solid ${brand.border}`,
                                    borderRadius: 16,
                                    padding: '16px 20px',
                                    display: 'grid',
                                    gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
                                    gap: 12,
                                    alignItems: 'end',
                                }}>
                                    <div>
                                        <FormLabel>Initial Status</FormLabel>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {['pending', 'confirmed'].map(st => {
                                                const active = form.status === st;
                                                return (
                                                    <button
                                                        key={st}
                                                        type="button"
                                                        onClick={() => setForm(prev => ({ ...prev, status: st }))}
                                                        style={{
                                                            flex: 1,
                                                            padding: '9px 10px',
                                                            borderRadius: 10,
                                                            border: `1.5px solid ${active ? (st === 'confirmed' ? '#2563eb' : '#d97706') : brand.border}`,
                                                            background: active ? (st === 'confirmed' ? '#dbeafe' : '#fef3c7') : '#fff',
                                                            color: active ? (st === 'confirmed' ? '#1d4ed8' : '#b45309') : '#64748b',
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                            textTransform: 'capitalize',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {st}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <FormLabel>Total Rate (AED)</FormLabel>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="35.00"
                                            value={form.totalAmount}
                                            onChange={e => setForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                                            style={{ ...inputStyleBase, background: '#fff' }}
                                        />
                                    </div>

                                    <div>
                                        <FormLabel>Payment Status</FormLabel>
                                        <select
                                            value={form.paymentStatus}
                                            onChange={e => setForm(prev => ({ ...prev, paymentStatus: e.target.value }))}
                                            style={{ ...selectStyleBase, background: '#fff' }}
                                        >
                                            <option value="unpaid">Unpaid</option>
                                            <option value="paid">Paid</option>
                                            <option value="partial">Partial</option>
                                        </select>
                                    </div>

                                    <div>
                                        <FormLabel>Payment Method</FormLabel>
                                        <select
                                            value={form.paymentMethod}
                                            onChange={e => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                            style={{ ...selectStyleBase, background: '#fff' }}
                                        >
                                            <option value="Cash on Completion">Cash on Completion</option>
                                            <option value="Credit/Debit Card">Credit/Debit Card</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="ADCB Pace Pay Link">ADCB Pace Pay Link</option>
                                        </select>
                                    </div>
                                </div>

                                {/* SECTION 6: Special Instructions / Notes */}
                                <div>
                                    <FormLabel>Special Notes & Dispatch Instructions</FormLabel>
                                    <textarea
                                        rows={2}
                                        placeholder="E.g., Gate entry code, key with reception, focus on master bathroom & balcony..."
                                        value={form.notes}
                                        onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                        style={{ ...inputStyleBase, resize: 'vertical' }}
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                padding: '16px 28px',
                                borderTop: `1px solid ${brand.border}`,
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 12,
                                background: '#fff',
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setShowNewModal(false)}
                                    disabled={formSubmitting}
                                    style={{
                                        ...outlineBtnBase,
                                        padding: '11px 22px',
                                        fontSize: 13,
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formSubmitting || loadingModalData}
                                    style={{
                                        ...solidBtnBase,
                                        padding: '11px 26px',
                                        fontSize: 13,
                                        opacity: formSubmitting ? 0.7 : 1,
                                        cursor: formSubmitting ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {formSubmitting ? (
                                        <>
                                            <svg style={{ animation: 'spin 1s linear infinite' }} width="14" height="14" fill="none" viewBox="0 0 24 24">
                                                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                            Creating Booking...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Create Booking
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function FormLabel({ children, required }) {
    return (
        <label style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginBottom: 6,
        }}>
            {children}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
        </label>
    );
}

const actionBtn = {
    width: 32, height: 32, borderRadius: 10,
    border: `1.5px solid ${brand.border}`, background: '#fff',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#64748b', transition: 'all 0.15s',
};

function PaginationBtn({ label, active, disabled, onClick }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                minWidth: 34, height: 34, borderRadius: 10,
                border: active ? 'none' : `1.5px solid ${brand.border}`,
                background: active ? `linear-gradient(135deg, ${brand.navy} 0%, ${brand.midBlue} 100%)` : '#fff',
                color: active ? '#fff' : disabled ? '#cbd5e1' : '#374151',
                fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: disabled ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? '0 2px 8px rgba(10,35,66,0.2)' : 'none',
            }}
        >{label}</button>
    );
}
