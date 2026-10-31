import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { formatWhatsAppPhone } from '../../utils/whatsapp';
import {
    brand,
    fonts,
    pageTitle,
    pageSubtitle,
    card,
    solidBtn,
    outlineBtn,
    searchBar,
    searchInput,
    selectStyle,
    inputStyle,
} from './adminStyles';

const PAYMENT_STATUSES = [
    { value: 'all', label: 'All Statuses' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'refunded', label: 'Refunded' },
];

const TX_TYPES = [
    { value: 'all', label: 'All Types' },
    { value: 'charge', label: 'Charge' },
    { value: 'refund', label: 'Refund' },
    { value: 'void', label: 'Void' },
];

const avatarColors = ['#1E3A8A', '#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

/**
 * Visual keyword highlighter component.
 * Case-insensitively wraps matching substrings in an amber highlight mark.
 */
function HighlightText({ text, query }) {
    if (!query || !query.trim() || text === null || text === undefined) {
        return text ?? null;
    }
    const str = String(text);
    const trimmed = query.trim();
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = str.split(regex);

    if (parts.length === 1) return str;

    return (
        <>
            {parts.map((part, index) =>
                part.toLowerCase() === trimmed.toLowerCase() ? (
                    <mark
                        key={index}
                        style={{
                            backgroundColor: '#e2e8f0',
                            color: '#1e293b',
                            borderRadius: '3px',
                            padding: '1px 3px',
                            fontWeight: 600,
                        }}
                    >
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
}

/**
 * Relevance scoring helper to prioritize matching items to top.
 */
function getMatchScore(item, query, fields) {
    if (!query || !query.trim() || !item) return 0;
    const q = query.trim().toLowerCase();
    let score = 0;

    for (const { getVal, priority } of fields) {
        const val = getVal(item);
        if (val === null || val === undefined) continue;
        const str = String(val).toLowerCase();
        if (str === q) {
            score = Math.max(score, priority * 3);
        } else if (str.startsWith(q)) {
            score = Math.max(score, priority * 2);
        } else if (str.includes(q)) {
            score = Math.max(score, priority);
        }
    }
    return score;
}

const invoiceSearchFields = [
    { getVal: p => p.reference_number, priority: 10 },
    { getVal: p => p.client?.name, priority: 8 },
    { getVal: p => p.client?.contact_number, priority: 8 },
    { getVal: p => p.client?.phone, priority: 8 },
    { getVal: p => p.client?.email, priority: 8 },
    { getVal: p => p.external_reference, priority: 7 },
    { getVal: p => `Booking #${p.booking_id}`, priority: 6 },
    { getVal: p => `CM-${String(p.booking_id).padStart(5, '0')}`, priority: 6 },
    { getVal: p => p.booking_id, priority: 6 },
    { getVal: p => p.booking?.reference, priority: 6 },
    { getVal: p => p.booking?.service?.name, priority: 5 },
    { getVal: p => p.amount, priority: 4 },
    { getVal: p => p.status, priority: 3 },
    { getVal: p => p.notes, priority: 2 },
];

const transactionSearchFields = [
    { getVal: tx => `#${tx.id}`, priority: 10 },
    { getVal: tx => tx.id, priority: 10 },
    { getVal: tx => tx.payment?.reference_number, priority: 9 },
    { getVal: tx => tx.payment?.client?.name, priority: 8 },
    { getVal: tx => tx.payment?.client?.contact_number, priority: 8 },
    { getVal: tx => tx.payment?.client?.phone, priority: 8 },
    { getVal: tx => tx.payment?.client?.email, priority: 8 },
    { getVal: tx => tx.payment?.booking?.service?.name, priority: 6 },
    { getVal: tx => tx.description, priority: 6 },
    { getVal: tx => tx.amount, priority: 5 },
    { getVal: tx => tx.status, priority: 4 },
    { getVal: tx => tx.type, priority: 4 },
    { getVal: tx => tx.processed_by?.name, priority: 3 },
];


const formatPaymentMethod = (method) => {
    if (!method) return null;
    const m = String(method).toLowerCase();
    if (m === 'cash') return 'Cash';
    if (m === 'card' || m === 'credit_card') return 'Credit Card';
    if (m === 'bank_transfer' || m === 'bank') return 'Bank Transfer';
    if (m === 'online' || m === 'adcb_pace_pay' || m === 'gateway') return 'Online Gateway';
    return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const normalizePaymentMethodFormValue = (method) => {
    if (!method) return 'card';
    const m = String(method).toLowerCase();
    if (m === 'cash') return 'cash';
    if (m === 'card' || m === 'credit_card') return 'card';
    if (m === 'bank_transfer' || m === 'bank') return 'bank_transfer';
    if (m === 'online' || m === 'adcb_pace_pay' || m === 'gateway') return 'online';
    return m;
};


function GatewayPayloadViewer({ payload, onClose }) {
    if (!payload) return null;

    const formatKeyLabel = (key) => {
        const labels = {
            notes: 'Administrative Notes',
            amount: 'Transaction Amount',
            status: 'Gateway Status',
            invoice_ref: 'Invoice Reference',
            method_code: 'Gateway Method Code',
            payment_method: 'Payment Method',
            updated_in_place_at: 'Last Updated Timestamp',
            recorded_at: 'Recorded Timestamp',
            logged_at: 'Logged Timestamp',
            source: 'Execution Source',
            reference: 'Gateway Reference ID',
            external_reference: 'External Reference',
            card_brand: 'Card Brand',
            card_last4: 'Card Last 4 Digits',
            auth_code: 'Authorization Code',
            response_code: 'Response Code',
            response_message: 'Gateway Message',
            type: 'Transaction Type',
        };
        return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatValue = (key, val) => {
        if (val === null || val === undefined) return '—';
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        if (key === 'amount' && (typeof val === 'number' || !isNaN(parseFloat(val)))) {
            return `AED ${parseFloat(val).toFixed(2)}`;
        }
        if (key === 'status') {
            const s = String(val).toLowerCase();
            const isSuccess = s === 'success' || s === 'paid';
            const isFailed = s === 'failed' || s === 'unpaid';
            return (
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    background: isSuccess ? '#ecfdf5' : isFailed ? '#fef2f2' : '#eff6ff',
                    color: isSuccess ? '#059669' : isFailed ? '#dc2626' : '#2563eb',
                    border: `1px solid ${isSuccess ? '#a7f3d0' : isFailed ? '#fecaca' : '#bfdbfe'}`,
                    textTransform: 'capitalize',
                }}>
                    {val}
                </span>
            );
        }
        if (key.includes('_at') && typeof val === 'string') {
            try {
                const d = new Date(val);
                if (!isNaN(d.getTime())) {
                    return d.toLocaleString('en-AE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                }
            } catch (_) {}
        }
        if (typeof val === 'object') {
            return Object.entries(val).map(([subK, subV]) => `${subK}: ${subV}`).join(', ');
        }
        return String(val);
    };

    const entries = Object.entries(payload);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 35, 66, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: 18,
                width: '100%',
                maxWidth: 560,
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(10,35,66,0.25)',
                border: '1px solid #e2e8f0',
            }}>
                {/* Header */}
                <div style={{
                    padding: '18px 24px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc',
                }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                            Payment Gateway Activity
                        </div>
                        <h3 style={{ margin: '2px 0 0 0', fontSize: 16, fontWeight: 800, color: brand.navy }}>
                            Execution Response Details
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: '#f1f5f9',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            fontSize: 14,
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                    >
                        ✕
                    </button>
                </div>

                {/* Formatted Content */}
                <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {entries.map(([k, v]) => (
                        <div
                            key={k}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                background: '#f8fafc',
                                borderRadius: 10,
                                border: '1px solid #f1f5f9',
                            }}
                        >
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                                {formatKeyLabel(k)}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: brand.navy, textAlign: 'right' }}>
                                {formatValue(k, v)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '14px 24px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    background: '#fff',
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            ...outlineBtn,
                            padding: '8px 20px',
                            fontSize: 12.5,
                            fontWeight: 700,
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Payments({ defaultTab = 'payments' }) {
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') || defaultTab;

    const [activeTab, setActiveTab] = useState(initialTab);

    // ── Payments State ──
    const [payments, setPayments] = useState([]);
    const [paymentsMeta, setPaymentsMeta] = useState({});
    const [paymentsLoading, setPaymentsLoading] = useState(true);
    const [paymentSearch, setPaymentSearch] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
    const [paymentsPage, setPaymentsPage] = useState(1);
    const [services, setServices] = useState([]);
    const [serviceFilter, setServiceFilter] = useState('all');

    // Load services for Service Type filter dropdown
    useEffect(() => {
        api.get('/services').then(res => {
            const svcData = res.data?.data || res.data || [];
            if (Array.isArray(svcData)) setServices(svcData);
        }).catch(() => {});
    }, []);
    const [invoiceSortOrder, setInvoiceSortOrder] = useState('desc');

    // ── Transactions State ──
    const [transactions, setTransactions] = useState([]);
    const [transactionsMeta, setTransactionsMeta] = useState({});
    const [transactionsLoading, setTransactionsLoading] = useState(true);
    const [txSearch, setTxSearch] = useState('');
    const [txTypeFilter, setTxTypeFilter] = useState('all');
    const [txStatusFilter, setTxStatusFilter] = useState('all');
    const [transactionsPage, setTransactionsPage] = useState(1);
    const [txSortOrder, setTxSortOrder] = useState('desc');

    // ── Sort & Filters Modal State ──
    // ── Navigate directly to Parent Invoice (Contextual Redirection with Visual Row Highlight) ──
    const navigateToParentInvoice = (tx, openEdit = false) => {
        const parentId = tx.payment_id || tx.payment?.id;
        setActiveTab('payments');
        setPaymentsPage(1);

        if (parentId) {
            setHighlightedInvoiceId(parentId);
            setTimeout(() => {
                setHighlightedInvoiceId(prev => (prev === parentId ? null : prev));
            }, 15000);

            setTimeout(() => {
                const el = document.getElementById(`invoice-row-${parentId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 150);
        }

        if (tx.payment) {
            if (openEdit && (tx.status === 'pending' || tx.status === 'failed')) {
                setInvoiceEditModal(tx.payment);
                setInvoiceEditStatus(tx.payment.status === 'failed' ? 'unpaid' : (tx.payment.status || 'pending'));
                setInvoiceEditNotes(tx.payment.notes || '');
                setInvoiceEditPaymentMethod(normalizePaymentMethodFormValue(tx.payment.payment_method));
            } else {
                setSelectedPayment(tx.payment);
            }
        } else if (parentId) {
            api.get(`/payments/${parentId}`).then(res => {
                const p = res.data?.data || res.data;
                if (openEdit && (tx.status === 'pending' || tx.status === 'failed')) {
                    setInvoiceEditModal(p);
                    setInvoiceEditStatus(p.status === 'failed' ? 'unpaid' : (p.status || 'pending'));
                    setInvoiceEditNotes(p.notes || '');
                    setInvoiceEditPaymentMethod(normalizePaymentMethodFormValue(p.payment_method));
                } else {
                    setSelectedPayment(p);
                }
            }).catch(() => {});
        }
    };

    // ── Unified Filter Box State ──
    const [filterBoxOpen, setFilterBoxOpen] = useState(false);
    const filterBoxRef = useRef(null);
    const [draftSortOrder, setDraftSortOrder] = useState('desc');
    const [draftStatus, setDraftStatus] = useState('all');
    const [draftService, setDraftService] = useState('all');

    // Close unified filter box on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterBoxRef.current && !filterBoxRef.current.contains(e.target)) {
                setFilterBoxOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const paymentSearchTimerRef = useRef(null);
    const txSearchTimerRef = useRef(null);
    const [debouncedPaymentSearch, setDebouncedPaymentSearch] = useState('');
    const [debouncedTxSearch, setDebouncedTxSearch] = useState('');

    // ── Modals & Actions ──
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [selectedTxPayload, setSelectedTxPayload] = useState(null);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [statusMenuTarget, setStatusMenuTarget] = useState(null);
    const [statusMenuPos, setStatusMenuPos] = useState({ top: 0, right: 0 });
    const [detailEditItem, setDetailEditItem] = useState(null);
    const [detailEditLoading, setDetailEditLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);
    const [refreshHovered, setRefreshHovered] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'payment'|'transaction', item }
    const [deleteLoading, setDeleteLoading] = useState(false);
    // New: invoice-specific edit modal (status + notes only)
    const [invoiceEditModal, setInvoiceEditModal] = useState(null); // payment object
    const [invoiceEditStatus, setInvoiceEditStatus] = useState('');
    const [invoiceEditNotes, setInvoiceEditNotes] = useState('');
    const [invoiceEditPaymentMethod, setInvoiceEditPaymentMethod] = useState('card');
    const [invoiceEditSaving, setInvoiceEditSaving] = useState(false);
    const [highlightedInvoiceId, setHighlightedInvoiceId] = useState(null);

    // Debounce payment search
    useEffect(() => {
        clearTimeout(paymentSearchTimerRef.current);
        paymentSearchTimerRef.current = setTimeout(() => {
            setDebouncedPaymentSearch(paymentSearch.trim());
        }, 350);
        return () => clearTimeout(paymentSearchTimerRef.current);
    }, [paymentSearch]);

    // Debounce tx search
    useEffect(() => {
        clearTimeout(txSearchTimerRef.current);
        txSearchTimerRef.current = setTimeout(() => {
            setDebouncedTxSearch(txSearch.trim());
        }, 350);
        return () => clearTimeout(txSearchTimerRef.current);
    }, [txSearch]);

    // Fetch Payments
    useEffect(() => {
        if (activeTab === 'payments') {
            fetchPayments();
        }
    }, [activeTab, paymentsPage, paymentStatusFilter, debouncedPaymentSearch, invoiceSortOrder, serviceFilter]);

    // Fetch Transactions
    useEffect(() => {
        if (activeTab === 'transactions') {
            fetchTransactions();
        }
    }, [activeTab, transactionsPage, txTypeFilter, txStatusFilter, debouncedTxSearch, txSortOrder, serviceFilter]);

    const fetchPayments = async () => {
        setPaymentsLoading(true);
        try {
            const params = { page: paymentsPage, per_page: 12 };
            if (paymentStatusFilter !== 'all') params.status = paymentStatusFilter;
            if (debouncedPaymentSearch) params.search = debouncedPaymentSearch;
            if (invoiceSortOrder) params.sort_dir = invoiceSortOrder;
            if (serviceFilter !== 'all') params.service_id = serviceFilter;

            const res = await api.get('/payments', { params });
            setPayments(res.data.data || []);
            setPaymentsMeta(res.data);
        } catch (err) {
            console.error('Error fetching payments:', err);
            setPayments([]);
            setPaymentsMeta({});
        } finally {
            setPaymentsLoading(false);
        }
    };

    const fetchTransactions = async () => {
        setTransactionsLoading(true);
        try {
            const params = { page: transactionsPage, per_page: 15 };
            if (txTypeFilter !== 'all') params.type = txTypeFilter;
            if (txStatusFilter !== 'all') params.status = txStatusFilter;
            if (debouncedTxSearch) params.search = debouncedTxSearch;
            if (txSortOrder) params.sort_dir = txSortOrder;
            if (serviceFilter !== 'all') params.service_id = serviceFilter;

            const res = await api.get('/transactions', { params });
            setTransactions(res.data.data || []);
            setTransactionsMeta(res.data);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setTransactions([]);
            setTransactionsMeta({});
        } finally {
            setTransactionsLoading(false);
        }
    };

    // ── Prioritize Matching Items & Sort by Timestamp ──
    const prioritizedPayments = useMemo(() => {
        const q = paymentSearch.trim();
        let items = payments;
        if (q) {
            items = payments.filter(p => getMatchScore(p, q, invoiceSearchFields) > 0);
        }
        return [...items].sort((a, b) => {
            if (q) {
                const scoreA = getMatchScore(a, q, invoiceSearchFields);
                const scoreB = getMatchScore(b, q, invoiceSearchFields);
                if (scoreB !== scoreA) {
                    return scoreB - scoreA; // Matching items moved to top
                }
            }
            const timeA = new Date(a.created_at || 0).getTime();
            const timeB = new Date(b.created_at || 0).getTime();
            return invoiceSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        });
    }, [payments, paymentSearch, invoiceSortOrder]);

    const prioritizedTransactions = useMemo(() => {
        const q = txSearch.trim();
        let items = transactions;
        if (q) {
            items = transactions.filter(tx => getMatchScore(tx, q, transactionSearchFields) > 0);
        }
        return [...items].sort((a, b) => {
            if (q) {
                const scoreA = getMatchScore(a, q, transactionSearchFields);
                const scoreB = getMatchScore(b, q, transactionSearchFields);
                if (scoreB !== scoreA) {
                    return scoreB - scoreA; // Matching items moved to top
                }
            }
            const timeA = new Date(a.created_at || 0).getTime();
            const timeB = new Date(b.created_at || 0).getTime();
            return txSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        });
    }, [transactions, txSearch, txSortOrder]);

    const handleUpdateStatus = async (paymentId, newStatus) => {
        setActionLoading(true);
        try {
            const res = await api.patch(`/payments/${paymentId}/status`, { status: newStatus });
            setActionMessage({ type: 'success', text: `Invoice marked as ${newStatus}` });
            fetchPayments();
            if (selectedPayment && selectedPayment.id === paymentId) {
                setSelectedPayment(res.data.payment);
            }
        } catch (err) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Status update failed' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setActionMessage(null), 3500);
        }
    };

    const handleEditClick = (item, type = 'payment', e) => {
        if (e) e.stopPropagation();
        const status = (item.status || '').toLowerCase();
        if (status === 'paid' || status === 'success') {
            handleOpenDetailEdit(item, type);
        } else {
            if (statusMenuTarget && statusMenuTarget.item?.id === item.id && statusMenuTarget.type === type) {
                setStatusMenuTarget(null);
                return;
            }
            const rect = e.currentTarget.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const top = spaceBelow < 150 ? Math.max(10, rect.top - 120) : rect.bottom + 6;
            const right = Math.max(16, window.innerWidth - rect.right);

            setStatusMenuPos({ top, right });
            setStatusMenuTarget({ type, item });
        }
    };

    // Update transaction status (success, failed, pending)
    const handleUpdateTransactionStatus = async (txId, newStatus) => {
        setActionLoading(true);
        try {
            const res = await api.patch(`/transactions/${txId}/status`, { status: newStatus });
            setActionMessage({ type: 'success', text: `Transaction #${txId} status updated to ${newStatus}` });
            fetchTransactions();
            fetchPayments();
            if (selectedTransaction && selectedTransaction.id === txId) {
                setSelectedTransaction(res.data.transaction);
            }
        } catch (err) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update transaction status' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setActionMessage(null), 3500);
        }
    };

    // Retry a failed payment
    const handleRetryPayment = async (payment) => {
        setActionLoading(true);
        try {
            const failedTx = payment.transactions?.find(t => t.type === 'charge' && t.status === 'failed');
            if (failedTx) {
                const res = await api.post(`/transactions/${failedTx.id}/retry`);
                setActionMessage({ type: 'success', text: res.data?.message || `Payment ${payment.reference_number} retry initiated` });
            } else {
                const res = await api.patch(`/payments/${payment.id}/status`, { status: 'pending' });
                setActionMessage({ type: 'success', text: `Payment ${payment.reference_number} status reset to pending` });
            }
            fetchPayments();
            fetchTransactions();
        } catch (err) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to retry payment' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setActionMessage(null), 3500);
        }
    };

    // Open detail editing form for paid/success items
    const handleOpenDetailEdit = (item, type = 'payment') => {
        setStatusMenuTarget(null);
        if (type === 'payment') {
            const chargeTx = item.transactions?.find(t => t.type === 'charge');
            setDetailEditItem({
                type: 'payment',
                id: item.id,
                reference_number: item.reference_number || '',
                external_reference: item.external_reference || '',
                description: chargeTx?.description || item.booking?.service?.name || '',
                notes: item.notes || '',
                amount: item.amount,
                clientName: item.client?.name || '',
            });
        } else {
            setDetailEditItem({
                type: 'transaction',
                id: item.id,
                reference_number: item.payment?.reference_number || '',
                external_reference: item.gateway_response?.reference || '',
                description: item.description || '',
                notes: item.payment?.notes || '',
                amount: item.amount,
                clientName: item.payment?.client?.name || '',
            });
        }
    };

    // Save edited details
    const handleSaveDetailEdit = async (e) => {
        e.preventDefault();
        if (!detailEditItem) return;
        setDetailEditLoading(true);
        try {
            if (detailEditItem.type === 'payment') {
                const res = await api.put(`/payments/${detailEditItem.id}`, {
                    reference_number: detailEditItem.reference_number,
                    external_reference: detailEditItem.external_reference,
                    description: detailEditItem.description,
                    notes: detailEditItem.notes,
                });
                setActionMessage({ type: 'success', text: 'Invoice details updated successfully' });
                fetchPayments();
                fetchTransactions();
                if (selectedPayment && selectedPayment.id === detailEditItem.id) {
                    setSelectedPayment(res.data.payment);
                }
            } else {
                const res = await api.put(`/transactions/${detailEditItem.id}`, {
                    reference_number: detailEditItem.reference_number,
                    description: detailEditItem.description,
                    notes: detailEditItem.notes,
                });
                setActionMessage({ type: 'success', text: 'Transaction details updated successfully' });
                fetchTransactions();
                fetchPayments();
                if (selectedTransaction && selectedTransaction.id === detailEditItem.id) {
                    setSelectedTransaction(res.data.transaction);
                }
            }
            setDetailEditItem(null);
        } catch (err) {
            setActionMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to update details',
            });
        } finally {
            setDetailEditLoading(false);
            setTimeout(() => setActionMessage(null), 3500);
        }
    };

    // Retry a failed transaction
    const handleRetryTransaction = async (txId) => {
        setActionLoadingId(txId);
        try {
            const res = await api.post(`/transactions/${txId}/retry`);
            setActionMessage({ type: 'success', text: res.data?.message || `Transaction #${txId} retry initiated` });
            fetchTransactions();
            fetchPayments();
            if (selectedTransaction && selectedTransaction.id === txId) {
                setSelectedTransaction(res.data.transaction);
            }
        } catch (err) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to retry transaction' });
        } finally {
            setActionLoadingId(null);
            setTimeout(() => setActionMessage(null), 3500);
        }
    };

    // Dismiss / Remove a failed transaction
    const handleDismissTransaction = async (txId) => {
        if (!window.confirm(`Are you sure you want to dismiss and remove failed transaction #${txId}?`)) {
            return;
        }
        setActionLoadingId(txId);
        try {
            const res = await api.delete(`/transactions/${txId}`);
            setActionMessage({ type: 'success', text: res.data?.message || `Transaction #${txId} dismissed and removed` });
            fetchTransactions();
            fetchPayments();
            if (selectedTransaction && selectedTransaction.id === txId) {
                setSelectedTransaction(null);
            }
        } catch (err) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to dismiss transaction' });
        } finally {
            setActionLoadingId(null);
            setTimeout(() => setActionMessage(null), 3500);
        }
    };

    // Dismiss a failed payment invoice
    const handleDismissPayment = async (paymentId) => {
        if (!window.confirm('Are you sure you want to dismiss and remove this failed invoice?')) {
            return;
        }
        setActionLoading(true);
        try {
            const res = await api.delete(`/payments/${paymentId}`);
            setActionMessage({ type: 'success', text: res.data?.message || 'Failed invoice dismissed and removed' });
            fetchPayments();
            fetchTransactions();
            if (selectedPayment && selectedPayment.id === paymentId) {
                setSelectedPayment(null);
            }
        } catch (err) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to dismiss payment' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setActionMessage(null), 3500);
        }
    };

    // Delete with confirmation
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            if (deleteTarget.type === 'payment') {
                const res = await api.delete(`/payments/${deleteTarget.item.id}`);
                setActionMessage({ type: 'success', text: res.data?.message || 'Invoice deleted successfully' });
                fetchPayments();
                if (selectedPayment?.id === deleteTarget.item.id) setSelectedPayment(null);
            } else {
                const res = await api.delete(`/transactions/${deleteTarget.item.id}`);
                setActionMessage({ type: 'success', text: res.data?.message || 'Transaction deleted successfully' });
                fetchTransactions();
                if (selectedTransaction?.id === deleteTarget.item.id) setSelectedTransaction(null);
            }
            setDeleteTarget(null);
        } catch (err) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed' });
        } finally {
            setDeleteLoading(false);
            setTimeout(() => setActionMessage(null), 3500);
        }
    };

    // Save invoice status + payment method + notes strictly from the Edit modal
    const handleSaveInvoiceEdit = async () => {
        if (!invoiceEditModal) return;
        if (!invoiceEditPaymentMethod) {
            setActionMessage({ type: 'error', text: 'Please select a Payment Method.' });
            return;
        }
        setInvoiceEditSaving(true);
        try {
            const res = await api.put(`/payments/${invoiceEditModal.id}`, {
                status: invoiceEditStatus === 'failed' ? 'unpaid' : invoiceEditStatus,
                payment_method: invoiceEditPaymentMethod,
                notes: invoiceEditNotes,
                            });
            setActionMessage({ type: 'success', text: 'Invoice and linked transaction updated successfully' });
            fetchPayments();
            fetchTransactions();
            if (selectedPayment?.id === invoiceEditModal.id) {
                setSelectedPayment(res.data.payment);
            }
            setInvoiceEditModal(null);
        } catch (err) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update invoice' });
        } finally {
            setInvoiceEditSaving(false);
            setTimeout(() => setActionMessage(null), 3500);
        }
    };

    const handleRefundSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPayment) return;
        setActionLoading(true);
        try {
            const payload = {};
            if (refundAmount) payload.amount = parseFloat(refundAmount);
            if (refundReason) payload.reason = refundReason;

            const res = await api.post(`/payments/${selectedPayment.id}/refund`, payload);
            setActionMessage({ type: 'success', text: res.data?.message || 'Refund successfully processed' });
            setShowRefundModal(false);
            setRefundAmount('');
            setRefundReason('');
            fetchPayments();
            if (selectedPayment) {
                const refreshed = await api.get(`/payments/${selectedPayment.id}`);
                setSelectedPayment(refreshed.data);
            }
        } catch (err) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Refund failed' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setActionMessage(null), 4000);
        }
    };

    // Derived Statistics
    const paidTotal = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const pendingTotal = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const pendingCount = payments.filter(p => p.status === 'pending').length;
    const refundedTotal = payments
        .filter(p => p.status === 'refunded')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // Payment status tab counts
    const paymentTabCounts = {
        all: paymentsMeta.total ?? payments.length,
        paid: payments.filter(p => p.status === 'paid').length,
        pending: payments.filter(p => p.status === 'pending').length,
        failed: payments.filter(p => p.status === 'failed' || p.status === 'unpaid').length,
        unpaid: payments.filter(p => p.status === 'failed' || p.status === 'unpaid').length,
        refunded: payments.filter(p => p.status === 'refunded').length,
    };

    // Transaction status tab counts
    const txStatusTabCounts = {
        all: transactionsMeta.total ?? transactions.length,
        success: transactions.filter(t => t.status === 'success').length,
        pending: transactions.filter(t => t.status === 'pending').length,
        failed: transactions.filter(t => t.status === 'failed').length,
    };

    // Check if invoice filters are non-default
    const hasActiveInvoiceFilters = invoiceSortOrder !== 'desc';
    const hasActiveTxFilters = txSortOrder !== 'desc';

    return (
        <div style={{ fontFamily: fonts.body, maxWidth: 1440, margin: '0 auto' }}>
            {/* Action Feedback Banner */}
            {actionMessage && (
                <div style={{
                    position: 'fixed',
                    top: 24,
                    right: 28,
                    zIndex: 9999,
                    background: actionMessage.type === 'success' ? '#059669' : '#dc2626',
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: 12,
                    fontSize: 13.5,
                    fontWeight: 600,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    animation: 'fadeIn 0.2s ease-out',
                }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        {actionMessage.type === 'success' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        )}
                    </svg>
                    <span>{actionMessage.text}</span>
                </div>
            )}

            {/* Top Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 24,
            }}>
                <div>
                    <h1 style={pageTitle}>Billing & Transactions</h1>
                    <p style={pageSubtitle}>Overview of payment gateways, customer invoices, and real-time ledger entries</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={() => { if (activeTab === 'payments') fetchPayments(); else fetchTransactions(); }}
                        onMouseEnter={() => setRefreshHovered(true)}
                        onMouseLeave={() => setRefreshHovered(false)}
                        disabled={activeTab === 'payments' ? paymentsLoading : transactionsLoading}
                        style={{
                            ...outlineBtn,
                            background: refreshHovered ? '#eff6ff' : '#fff',
                            borderColor: refreshHovered ? '#93c5fd' : '#e2e8f0',
                            color: refreshHovered ? '#1d4ed8' : '#334155',
                            boxShadow: refreshHovered ? '0 4px 12px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                            transform: refreshHovered ? 'translateY(-1px)' : 'translateY(0)',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: (activeTab === 'payments' ? paymentsLoading : transactionsLoading) ? 'not-allowed' : 'pointer',
                            opacity: (activeTab === 'payments' ? paymentsLoading : transactionsLoading) ? 0.7 : 1,
                        }}
                    >
                        <svg
                            width="14"
                            height="14"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{
                                transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: (activeTab === 'payments' ? paymentsLoading : transactionsLoading)
                                    ? 'rotate(360deg)'
                                    : refreshHovered
                                        ? 'rotate(180deg)'
                                        : 'rotate(0deg)',
                                animation: (activeTab === 'payments' ? paymentsLoading : transactionsLoading)
                                    ? 'spin 0.8s linear infinite'
                                    : 'none',
                            }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {(activeTab === 'payments' ? paymentsLoading : transactionsLoading) ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* ── Search Bar & Single Unified Filter Dropdown Box ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                flexWrap: 'wrap',
            }}>
                {/* Search Bar */}
                <div style={{
                    ...searchBar,
                    flex: '1 1 300px',
                    maxWidth: 420,
                    position: 'relative',
                    borderColor: (activeTab === 'payments' ? paymentSearch : txSearch) ? brand.royal : brand.border,
                    boxShadow: (activeTab === 'payments' ? paymentSearch : txSearch) ? '0 0 0 3px rgba(37,99,235,0.1)' : '0 2px 6px rgba(10,35,66,0.02)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={(activeTab === 'payments' ? paymentSearch : txSearch) ? brand.royal : '#94a3b8'} strokeWidth="2.2">
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder={activeTab === 'payments' ? "Search by reference, client, service, or status..." : "Search by Tx ID, payment ref, client, or description..."}
                        value={activeTab === 'payments' ? paymentSearch : txSearch}
                        onChange={(e) => {
                            if (activeTab === 'payments') {
                                setPaymentSearch(e.target.value);
                                setPaymentsPage(1);
                            } else {
                                setTxSearch(e.target.value);
                                setTransactionsPage(1);
                            }
                        }}
                        style={searchInput}
                    />
                    {(activeTab === 'payments' ? paymentSearch : txSearch) && (
                        <button
                            type="button"
                            onClick={() => {
                                if (activeTab === 'payments') {
                                    setPaymentSearch('');
                                    setDebouncedPaymentSearch('');
                                    setPaymentsPage(1);
                                } else {
                                    setTxSearch('');
                                    setDebouncedTxSearch('');
                                    setTransactionsPage(1);
                                }
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

                {/* ── Single Unified Filter Dropdown Box ── */}
                <div ref={filterBoxRef} style={{ position: 'relative' }}>
                    <button
                        type="button"
                        onClick={() => {
                            if (!filterBoxOpen) {
                                setDraftSortOrder(activeTab === 'payments' ? invoiceSortOrder : txSortOrder);
                                setDraftStatus(activeTab === 'payments' ? paymentStatusFilter : txStatusFilter);
                                setDraftService(serviceFilter);
                            }
                            setFilterBoxOpen(!filterBoxOpen);
                        }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 18px',
                            borderRadius: 12,
                            border: (paymentStatusFilter !== 'all' || serviceFilter !== 'all' || (activeTab === 'payments' ? invoiceSortOrder !== 'desc' : txSortOrder !== 'desc')) ? `1.5px solid ${brand.royal}` : `1.5px solid ${brand.border}`,
                            background: filterBoxOpen ? '#f1f5f9' : '#fff',
                            color: (paymentStatusFilter !== 'all' || serviceFilter !== 'all' || (activeTab === 'payments' ? invoiceSortOrder !== 'desc' : txSortOrder !== 'desc')) ? brand.royal : '#334155',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            boxShadow: filterBoxOpen ? '0 4px 12px rgba(10,35,66,0.1)' : '0 2px 6px rgba(10,35,66,0.02)',
                        }}
                    >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M3 4h18M7 8h10M10 12h4" />
                        </svg>
                        Sort & Filters
                        <svg
                            width="12"
                            height="12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            style={{
                                transform: filterBoxOpen ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s ease',
                            }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        {(paymentStatusFilter !== 'all' || serviceFilter !== 'all' || (activeTab === 'payments' ? invoiceSortOrder !== 'desc' : txSortOrder !== 'desc')) && (
                            <span style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: brand.royal,
                            }} />
                        )}
                    </button>

                    {/* Unified Filter Dropdown Box Popup */}
                    {filterBoxOpen && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            zIndex: 1050,
                            background: '#fff',
                            borderRadius: 18,
                            padding: '22px 24px',
                            width: 350,
                            maxWidth: '92vw',
                            boxShadow: '0 20px 50px rgba(10,35,66,0.22)',
                            border: `1.5px solid ${brand.border}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            animation: 'fadeIn 0.15s ease-out',
                        }}>
                            {/* Filter Box Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #f1f5f9',
                                paddingBottom: 12,
                            }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Filters & Sorting
                                    </div>
                                    <h4 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: brand.navy, fontFamily: fonts.heading }}>
                                        Filter Options
                                    </h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFilterBoxOpen(false)}
                                    title="Close"
                                    style={{
                                        border: 'none',
                                        background: '#f1f5f9',
                                        borderRadius: '50%',
                                        width: 28,
                                        height: 28,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#64748b',
                                        fontSize: 13,
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* 1. Sort by Order */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                                    Sort by Order
                                </label>
                                <select
                                    value={draftSortOrder}
                                    onChange={e => setDraftSortOrder(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: `1.5px solid ${brand.border}`,
                                        background: '#f8fafc',
                                        color: brand.navy,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        outline: 'none',
                                        cursor: 'pointer',
                                        fontFamily: fonts.body,
                                    }}
                                >
                                    <option value="desc">Newest First</option>
                                    <option value="asc">Oldest First</option>
                                </select>
                            </div>

                            {/* 2. Filter by Transaction Status */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                                    Filter by Transaction Status
                                </label>
                                <select
                                    value={draftStatus}
                                    onChange={e => setDraftStatus(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: `1.5px solid ${brand.border}`,
                                        background: '#f8fafc',
                                        color: brand.navy,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        outline: 'none',
                                        cursor: 'pointer',
                                        fontFamily: fonts.body,
                                    }}
                                >
                                    <option value="all">All Statuses</option>
                                    {activeTab === 'payments' ? (
                                        <>
                                            <option value="paid">Paid</option>
                                            <option value="pending">Pending</option>
                                            <option value="unpaid">Unpaid</option>
                                            <option value="refunded">Refunded</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="success">Success</option>
                                            <option value="pending">Pending</option>
                                            <option value="failed">Failed</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* 3. Filter by Service Type */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                                    Filter by Service Type
                                </label>
                                <select
                                    value={draftService}
                                    onChange={e => setDraftService(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: `1.5px solid ${brand.border}`,
                                        background: '#f8fafc',
                                        color: brand.navy,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        outline: 'none',
                                        cursor: 'pointer',
                                        fontFamily: fonts.body,
                                    }}
                                >
                                    <option value="all">All Services</option>
                                    {services.map(svc => (
                                        <option key={svc.id} value={svc.id}>{svc.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Buttons: Reset All and Apply Filters */}
                            <div style={{
                                display: 'flex',
                                gap: 10,
                                marginTop: 4,
                                paddingTop: 14,
                                borderTop: '1px solid #f1f5f9',
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDraftSortOrder('desc');
                                        setDraftStatus('all');
                                        setDraftService('all');
                                        if (activeTab === 'payments') {
                                            setInvoiceSortOrder('desc');
                                            setPaymentStatusFilter('all');
                                            setPaymentsPage(1);
                                        } else {
                                            setTxSortOrder('desc');
                                            setTxStatusFilter('all');
                                            setTxTypeFilter('all');
                                            setTransactionsPage(1);
                                        }
                                        setServiceFilter('all');
                                        setFilterBoxOpen(false);
                                    }}
                                    style={{
                                        ...outlineBtn,
                                        flex: 1,
                                        justifyContent: 'center',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        padding: '10px 14px',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = brand.border; }}
                                >
                                    Reset All
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (activeTab === 'payments') {
                                            setInvoiceSortOrder(draftSortOrder);
                                            setPaymentStatusFilter(draftStatus);
                                            setPaymentsPage(1);
                                        } else {
                                            setTxSortOrder(draftSortOrder);
                                            setTxStatusFilter(draftStatus);
                                            setTransactionsPage(1);
                                        }
                                        setServiceFilter(draftService);
                                        setFilterBoxOpen(false);
                                    }}
                                    style={{
                                        ...solidBtn,
                                        flex: 1,
                                        justifyContent: 'center',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        padding: '10px 14px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Active Filter Indicators Badge Pill */}
                {(paymentStatusFilter !== 'all' || serviceFilter !== 'all' || (activeTab === 'payments' ? invoiceSortOrder !== 'desc' : txSortOrder !== 'desc')) && (
                    <div style={{
                        display: 'inline-flex',
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
                        <span>
                            Filters Active: {[
                                (activeTab === 'payments' ? invoiceSortOrder !== 'desc' : txSortOrder !== 'desc') ? 'Sorted' : null,
                                paymentStatusFilter !== 'all' ? (activeTab === 'payments' ? paymentStatusFilter.toUpperCase() : txStatusFilter.toUpperCase()) : null,
                                serviceFilter !== 'all' ? 'Service Filtered' : null,
                            ].filter(Boolean).join(' • ')}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setDraftSortOrder('desc');
                                setDraftStatus('all');
                                setDraftService('all');
                                if (activeTab === 'payments') {
                                    setInvoiceSortOrder('desc');
                                    setPaymentStatusFilter('all');
                                    setPaymentsPage(1);
                                } else {
                                    setTxSortOrder('desc');
                                    setTxStatusFilter('all');
                                    setTxTypeFilter('all');
                                    setTransactionsPage(1);
                                }
                                setServiceFilter('all');
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
                            title="Reset all filters"
                        >
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* ── Summary Metric Cards ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
                marginBottom: 24,
            }}>
                {/* 1. Collected Revenue */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                        if (activeTab === 'payments') {
                            setPaymentStatusFilter(paymentStatusFilter === 'paid' ? 'all' : 'paid');
                            setPaymentsPage(1);
                        } else {
                            setTxStatusFilter(txStatusFilter === 'success' ? 'all' : 'success');
                            setTransactionsPage(1);
                        }
                    }}
                    style={{
                        ...card,
                        padding: '20px 22px',
                        borderLeft: '4px solid #059669',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease-in-out',
                        userSelect: 'none',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(10,35,66,0.08)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(10,35,66,0.03)';
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Collected Revenue
                        </span>
                        <span style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: '#d1fae5',
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: brand.navy, fontFamily: fonts.heading }}>
                        AED {paidTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginTop: 4 }}>
                        From settled invoices
                    </div>
                </div>

                {/* 2. Pending Invoices */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                        if (activeTab === 'payments') {
                            setPaymentStatusFilter(paymentStatusFilter === 'pending' ? 'all' : 'pending');
                            setPaymentsPage(1);
                        } else {
                            setTxStatusFilter(txStatusFilter === 'pending' ? 'all' : 'pending');
                            setTransactionsPage(1);
                        }
                    }}
                    style={{
                        ...card,
                        padding: '20px 22px',
                        borderLeft: '4px solid #d97706',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease-in-out',
                        userSelect: 'none',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(10,35,66,0.08)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(10,35,66,0.03)';
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Pending Invoices
                        </span>
                        <span style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: '#fef3c7',
                            color: '#d97706',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: brand.navy, fontFamily: fonts.heading }}>
                        {pendingCount} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>({`AED ${pendingTotal.toFixed(2)}`})</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#d97706', fontWeight: 600, marginTop: 4 }}>
                        Awaiting customer checkout / cash
                    </div>
                </div>

                {/* 3. Total Records */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                        if (activeTab === 'payments') {
                            setPaymentStatusFilter('all');
                            setPaymentsPage(1);
                        } else {
                            setTxStatusFilter('all');
                            setTxTypeFilter('all');
                            setTransactionsPage(1);
                        }
                    }}
                    style={{
                        ...card,
                        padding: '20px 22px',
                        borderLeft: '4px solid #2563eb',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease-in-out',
                        userSelect: 'none',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(10,35,66,0.08)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(10,35,66,0.03)';
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Total Records
                        </span>
                        <span style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: '#dbeafe',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: brand.navy, fontFamily: fonts.heading }}>
                        {activeTab === 'payments' ? (paymentsMeta.total ?? payments.length) : (transactionsMeta.total ?? transactions.length)} {activeTab === 'payments' ? 'Invoices' : 'Records'}
                    </div>
                    <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, marginTop: 4 }}>
                        All tracked bookings
                    </div>
                </div>

                {/* 4. Refunds & Reversals */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                        if (activeTab === 'payments') {
                            setPaymentStatusFilter(paymentStatusFilter === 'refunded' ? 'all' : 'refunded');
                            setPaymentsPage(1);
                        } else {
                            setTxTypeFilter(txTypeFilter === 'refund' ? 'all' : 'refund');
                            setTransactionsPage(1);
                        }
                    }}
                    style={{
                        ...card,
                        padding: '20px 22px',
                        borderLeft: '4px solid #7c3aed',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease-in-out',
                        userSelect: 'none',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(10,35,66,0.08)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(10,35,66,0.03)';
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Refunds & Reversals
                        </span>
                        <span style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: '#ede9fe',
                            color: '#7c3aed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: brand.navy, fontFamily: fonts.heading }}>
                        AED {refundedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, marginTop: 4 }}>
                        Reversed transactions
                    </div>
                </div>
            </div>

            {/* Navigation Tabs Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderBottom: `2px solid ${brand.border}`,
                marginBottom: 20,
            }}>
                <button
                    onClick={() => { setActiveTab('payments'); setPaymentsPage(1); }}
                    style={{
                        padding: '12px 18px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'payments' ? `3px solid ${brand.royal}` : '3px solid transparent',
                        color: activeTab === 'payments' ? brand.navy : '#64748b',
                        fontSize: 14,
                        fontWeight: activeTab === 'payments' ? 800 : 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: -2,
                        transition: 'all 0.15s',
                    }}
                >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Invoices & Payments
                    <span style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 11,
                        background: activeTab === 'payments' ? '#dbeafe' : '#f1f5f9',
                        color: activeTab === 'payments' ? '#1e40af' : '#64748b',
                        fontWeight: 700,
                    }}>
                        {paymentsMeta.total ?? payments.length}
                    </span>
                </button>

                <button
                    onClick={() => { setActiveTab('transactions'); setTransactionsPage(1); }}
                    style={{
                        padding: '12px 18px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'transactions' ? `3px solid ${brand.royal}` : '3px solid transparent',
                        color: activeTab === 'transactions' ? brand.navy : '#64748b',
                        fontSize: 14,
                        fontWeight: activeTab === 'transactions' ? 800 : 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: -2,
                        transition: 'all 0.15s',
                    }}
                >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Transactions Ledger
                    <span style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 11,
                        background: activeTab === 'transactions' ? '#dbeafe' : '#f1f5f9',
                        color: activeTab === 'transactions' ? '#1e40af' : '#64748b',
                        fontWeight: 700,
                    }}>
                        {transactionsMeta.total ?? transactions.length}
                    </span>
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                TAB 1: INVOICES & PAYMENTS (Neat, clean, fitted table)
               ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'payments' && (
                <div>
                    {/* Table Card Container with Horizontal Scroll Barrier */}
                    <div style={{ ...card, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%',
                                minWidth: 980,
                                borderCollapse: 'collapse',
                                textAlign: 'left',
                            }}>
                                <thead>
                                    <tr style={{
                                        background: brand.softBg,
                                        borderBottom: `1px solid ${brand.border}`,
                                    }}>
                                        <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, width: '24%' }}>
                                            Invoice / Reference
                                        </th>
                                        <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, width: '32%' }}>
                                            Client & Booking
                                        </th>
                                        <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, width: '16%' }}>
                                            Amount
                                        </th>
                                        <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, width: '14%' }}>
                                            Status
                                        </th>
                                        <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, width: '14%', textAlign: 'right' }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentsLoading ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                                                Loading invoices...
                                            </td>
                                        </tr>
                                    ) : prioritizedPayments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '64px 20px', textAlign: 'center' }}>
                                                <div style={{
                                                    width: 52,
                                                    height: 52,
                                                    borderRadius: '50%',
                                                    background: '#f1f5f9',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    margin: '0 auto 16px',
                                                    color: '#64748b',
                                                }}>
                                                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                                                    </svg>
                                                </div>
                                                <div style={{ fontWeight: 800, color: brand.navy, fontSize: 16, marginBottom: 6 }}>
                                                    {paymentSearch.trim() ? 'No match search' : 'No invoices found'}
                                                </div>
                                                <div style={{ color: '#64748b', fontSize: 13, maxWidth: 420, margin: '0 auto 16px', lineHeight: 1.5 }}>
                                                    {paymentSearch.trim()
                                                        ? `No invoices matched "${paymentSearch}". Try adjusting your keywords or clearing the search.`
                                                        : 'No invoices found matching the current filters. Try adjusting your filter settings.'}
                                                </div>
                                                {paymentSearch.trim() ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPaymentSearch('');
                                                            setDebouncedPaymentSearch('');
                                                            setPaymentsPage(1);
                                                        }}
                                                        style={{
                                                            ...outlineBtn,
                                                            fontSize: 12.5,
                                                            padding: '8px 18px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            margin: '0 auto',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Clear Search
                                                    </button>
                                                ) : (paymentStatusFilter !== 'all' || serviceFilter !== 'all') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPaymentStatusFilter('all');
                                                            setServiceFilter('all');
                                                            setPaymentsPage(1);
                                                        }}
                                                        style={{
                                                            ...outlineBtn,
                                                            fontSize: 12.5,
                                                            padding: '8px 18px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            margin: '0 auto',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                        Reset Filters
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        prioritizedPayments.map((p, idx) => {
                                            const clientName = p.client?.name || 'Customer';
                                            const initials = clientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                                            const color = avatarColors[idx % avatarColors.length];
                                            const isSelected = selectedPayment?.id === p.id;
                                            const isHighlighted = highlightedInvoiceId === p.id;

                                            return (
                                                <tr
                                                    id={`invoice-row-${p.id}`}
                                                    key={p.id}
                                                    onClick={() => setSelectedPayment(p)}
                                                    style={{
                                                        borderBottom: isHighlighted ? '2px solid #2563eb' : '1px solid #f1f5f9',
                                                        cursor: 'pointer',
                                                        background: isHighlighted ? '#eff6ff' : (isSelected ? '#f8fafc' : '#fff'),
                                                        boxShadow: isHighlighted ? '0 0 0 3px #2563eb, 0 4px 18px rgba(37,99,235,0.25)' : 'none',
                                                        position: isHighlighted ? 'relative' : 'static',
                                                        zIndex: isHighlighted ? 2 : 1,
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        transform: isHighlighted ? 'scale(1.002)' : 'none',
                                                    }}
                                                    onMouseEnter={(e) => { if (!isSelected && !isHighlighted) e.currentTarget.style.background = '#fcfdfe'; }}
                                                    onMouseLeave={(e) => { if (!isSelected && !isHighlighted) e.currentTarget.style.background = '#fff'; }}
                                                >
                                                    {/* Reference & Date */}
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div style={{ fontWeight: 700, color: brand.navy, fontSize: 13.5 }}>
                                                            <HighlightText text={p.reference_number} query={paymentSearch} />
                                                        </div>
                                                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                                            {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            {p.external_reference && (
                                                                <> • <HighlightText text={p.external_reference} query={paymentSearch} /></>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Client & Booking */}
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 8,
                                                                background: color,
                                                                color: '#fff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                flexShrink: 0,
                                                            }}>
                                                                {initials}
                                                            </div>
                                                            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                                <div style={{ fontWeight: 600, color: brand.navy, fontSize: 13, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                                    <HighlightText text={clientName} query={paymentSearch} />
                                                                </div>
                                                                <div style={{ fontSize: 11.5, color: brand.royal, fontWeight: 600 }}>
                                                                    Booking #<HighlightText text={p.booking_id} query={paymentSearch} />
                                                                    {p.booking?.service?.name && (
                                                                        <> • <HighlightText text={p.booking.service.name} query={paymentSearch} /></>
                                                                    )}
                                                                </div>
                                                                {(p.client?.contact_number || p.client?.email) && (
                                                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                                        <HighlightText text={p.client?.contact_number || p.client?.email} query={paymentSearch} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Amount */}
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div style={{ fontWeight: 800, color: brand.navy, fontSize: 14, fontFamily: fonts.heading }}>
                                                            AED <HighlightText text={parseFloat(p.amount).toFixed(2)} query={paymentSearch} />
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <PaymentStatusBadge status={p.status} />
                                                    </td>

                                                    {/* Actions: WhatsApp | View | Edit | Delete */}
                                                    <td style={{ padding: '14px 18px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                                                            {/* 1. WhatsApp Button */}
                                                            <ActionBtn
                                                                title="WhatsApp Client"
                                                                variant="whatsapp"
                                                                onClick={() => {
                                                                    const ph = formatWhatsAppPhone(p.client?.contact_number || p.client?.phone);
                                                                    const clientName = p.client?.name || 'Valued Client';
                                                                    const invoiceId = p.reference_number || `INV-${p.id}`;
                                                                    const serviceName = p.booking?.service?.name || 'Cleaning Service';
                                                                    const bookingDate = p.booking?.preferred_date
                                                                        ? new Date(p.booking.preferred_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })
                                                                        : 'your scheduled date';
                                                                    const msg = `Hello ${clientName}, this is regarding your invoice ${invoiceId} for ${serviceName} scheduled on ${bookingDate}. Please let us know if you have any questions or require assistance!`;
                                                                    window.open(`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`, '_blank');
                                                                }}
                                                                icon={
                                                                    <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z" />
                                                                    </svg>
                                                                }
                                                            />
                                                            {/* 2. View Button */}
                                                            <ActionBtn
                                                                title="View Details"
                                                                variant="view"
                                                                onClick={() => setSelectedPayment(p)}
                                                                icon={
                                                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                                    </svg>
                                                                }
                                                            />
                                                            {/* 3. Edit Button */}
                                                            <ActionBtn
                                                                title="Edit Invoice"
                                                                variant="edit"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setInvoiceEditModal(p);
                                                                    setInvoiceEditStatus(p.status === 'failed' ? 'unpaid' : (p.status || 'pending'));
                                                                    setInvoiceEditNotes(p.notes || '');
                                                                    setInvoiceEditPaymentMethod(normalizePaymentMethodFormValue(p.payment_method));
                                                                }}
                                                                icon={
                                                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                }
                                                            />
                                                            {/* 4. Delete Button */}
                                                            <ActionBtn
                                                                title="Delete Invoice"
                                                                variant="delete"
                                                                onClick={() => setDeleteTarget({ type: 'payment', item: p })}
                                                                icon={
                                                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <polyline points="3 6 5 6 21 6" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6" /><path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6M9 6V4h6v2" />
                                                                    </svg>
                                                                }
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {paymentsMeta.last_page > 1 && (
                            <div style={{
                                padding: '14px 20px',
                                background: brand.softBg,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderTop: `1px solid ${brand.border}`,
                                fontSize: 12.5,
                                color: '#64748b',
                            }}>
                                <div>
                                    Showing <strong>{paymentsMeta.from || 1}</strong> to <strong>{paymentsMeta.to || payments.length}</strong> of <strong>{paymentsMeta.total}</strong> invoices
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        disabled={paymentsPage <= 1}
                                        onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                                        style={{ ...outlineBtn, padding: '6px 14px', fontSize: 12, opacity: paymentsPage <= 1 ? 0.5 : 1 }}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        disabled={paymentsPage >= paymentsMeta.last_page}
                                        onClick={() => setPaymentsPage(p => p + 1)}
                                        style={{ ...outlineBtn, padding: '6px 14px', fontSize: 12, opacity: paymentsPage >= paymentsMeta.last_page ? 0.5 : 1 }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 2: TRANSACTIONS LEDGER (Neat, clean audit log)
               ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'transactions' && (
                <div>
                    {/* Table Card Container */}
                    <div style={{ ...card, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%',
                                minWidth: 1080,
                                borderCollapse: 'collapse',
                                textAlign: 'left',
                            }}>
                                <thead>
                                    <tr style={{
                                        background: brand.softBg,
                                        borderBottom: `1px solid ${brand.border}`,
                                    }}>
                                        <th style={{ padding: '13px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, width: '12%' }}>
                                            TX ID & Date
                                        </th>
                                        <th style={{ padding: '13px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, width: '24%' }}>
                                            Parent Invoice & Booking
                                        </th>
                                        <th style={{ padding: '13px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, width: '22%' }}>
                                            Client & Contact
                                        </th>

                                        <th style={{ padding: '13px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, width: '16%' }}>
                                            Type & Gateway
                                        </th>
                                        <th style={{ padding: '13px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, width: '12%' }}>
                                            Amount
                                        </th>
                                        <th style={{ padding: '13px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, width: '8%' }}>
                                            Status
                                        </th>
                                        <th style={{ padding: '13px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, width: '8%', textAlign: 'right' }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactionsLoading ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                                                Loading transaction ledger...
                                            </td>
                                        </tr>
                                    ) : prioritizedTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '64px 20px', textAlign: 'center' }}>
                                                <div style={{
                                                    width: 52,
                                                    height: 52,
                                                    borderRadius: '50%',
                                                    background: '#f1f5f9',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    margin: '0 auto 16px',
                                                    color: '#64748b',
                                                }}>
                                                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                                                    </svg>
                                                </div>
                                                <div style={{ fontWeight: 800, color: brand.navy, fontSize: 16, marginBottom: 6 }}>
                                                    {txSearch.trim() ? 'No match search' : 'No transactions found'}
                                                </div>
                                                <div style={{ color: '#64748b', fontSize: 13, maxWidth: 420, margin: '0 auto 16px', lineHeight: 1.5 }}>
                                                    {txSearch.trim()
                                                        ? `No transactions matched "${txSearch}". Try adjusting your keywords or clearing the search.`
                                                        : 'Try modifying your keyword query or resetting status and type filters.'}
                                                </div>
                                                {txSearch.trim() && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setTxSearch('');
                                                            setDebouncedTxSearch('');
                                                            setTransactionsPage(1);
                                                        }}
                                                        style={{
                                                            ...outlineBtn,
                                                            fontSize: 12.5,
                                                            padding: '8px 18px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            margin: '0 auto',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Clear Search
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        prioritizedTransactions.map((tx, idx) => {
                                            const clientName = tx.payment?.client?.name || 'Customer';
                                            const initials = clientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                                            const color = avatarColors[idx % avatarColors.length];
                                            const isSelected = selectedTransaction?.id === tx.id;
                                            const isPendingOrFailed = tx.status === 'pending' || tx.status === 'failed';

                                            const bookingDate = tx.payment?.booking?.preferred_date
                                                ? new Date(tx.payment.booking.preferred_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : 'Schedule pending';
                                            const timeSlot = tx.payment?.booking?.preferred_time || tx.payment?.booking?.time_slot;
                                            const serviceName = tx.payment?.booking?.service?.name || 'Cleaning Service';
                                            const parentInvoiceRef = tx.payment?.reference_number || (tx.payment_id ? `INV-${tx.payment_id}` : `TX-${tx.id}`);
                                            const clientPhone = tx.payment?.client?.contact_number || tx.payment?.client?.phone;

                                            return (
                                                <tr
                                                    key={tx.id}
                                                    onClick={() => setSelectedTransaction(tx)}
                                                    style={{
                                                        borderBottom: '1px solid #f1f5f9',
                                                        fontSize: 13,
                                                        cursor: 'pointer',
                                                        background: isSelected ? '#f8fafc' : '#fff',
                                                        transition: 'background 0.12s ease',
                                                    }}
                                                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#fcfdfe'; }}
                                                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = '#fff'; }}
                                                >
                                                    {/* 1. TX ID & Date */}
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div style={{ fontWeight: 800, color: brand.navy, fontSize: 13.5 }}>
                                                            #<HighlightText text={tx.id} query={txSearch} />
                                                        </div>
                                                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                                            {new Date(tx.created_at).toLocaleDateString('en-AE', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                        <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                                                            {new Date(tx.created_at).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>

                                                    {/* 2. Parent Invoice & Booking */}
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigateToParentInvoice(tx, isPendingOrFailed);
                                                            }}
                                                            title="View linked parent invoice in Billing"
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 4,
                                                                fontWeight: 700,
                                                                color: brand.royal,
                                                                fontSize: 13,
                                                                cursor: 'pointer',
                                                                textDecoration: 'underline',
                                                                textUnderlineOffset: 3,
                                                            }}
                                                        >
                                                            <HighlightText text={parentInvoiceRef} query={txSearch} />
                                                            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </div>
                                                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                                                            Booking #{tx.payment?.booking_id || 'N/A'}
                                                            {tx.payment?.booking?.reference && (
                                                                <> • <HighlightText text={tx.payment.booking.reference} query={txSearch} /></>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                                                            <HighlightText text={serviceName} query={txSearch} />
                                                        </div>
                                                    </td>

                                                    {/* 3. Client & Contact */}
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 8,
                                                                background: color,
                                                                color: '#fff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                flexShrink: 0,
                                                            }}>
                                                                {initials}
                                                            </div>
                                                            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                                <div style={{ fontWeight: 600, color: brand.navy, fontSize: 13, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                                    <HighlightText text={clientName} query={txSearch} />
                                                                </div>
                                                                {clientPhone && (
                                                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                                                                        <HighlightText text={clientPhone} query={txSearch} />
                                                                    </div>
                                                                )}
                                                                {tx.payment?.client?.email && (
                                                                    <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                                        <HighlightText text={tx.payment.client.email} query={txSearch} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>



                                                    {/* 5. Type & Gateway */}
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                                                            <TxTypeBadge type={tx.type} />
                                                        </div>
                                                        <div style={{ fontSize: 11.5, color: '#334155', fontWeight: 500 }}>
                                                            {formatPaymentMethod(tx.gateway_response?.payment_method || tx.payment?.payment_method) ? (
                                                                <span style={{ fontWeight: 600 }}>
                                                                    {formatPaymentMethod(tx.gateway_response?.payment_method || tx.payment?.payment_method)}
                                                                </span>
                                                            ) : (
                                                                <HighlightText text={tx.description || 'Gateway transaction'} query={txSearch} />
                                                            )}
                                                        </div>
                                                        {tx.processed_by?.name && (
                                                            <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                                                                by {tx.processed_by.name}
                                                            </div>
                                                        )}
                                                        
                                                    </td>

                                                    {/* 6. Amount */}
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <span style={{
                                                            fontWeight: 800,
                                                            fontFamily: fonts.heading,
                                                            color: tx.type === 'refund' ? '#dc2626' : '#059669',
                                                            fontSize: 13.5,
                                                        }}>
                                                            {tx.type === 'refund' ? '-' : '+'}AED <HighlightText text={parseFloat(tx.amount).toFixed(2)} query={txSearch} />
                                                        </span>
                                                    </td>

                                                    {/* 7. Status (Interactive click for pending/failed to redirect to parent invoice) */}
                                                    <td style={{ padding: '14px 18px' }} onClick={e => e.stopPropagation()}>
                                                        <TxStatusBadge
                                                            status={tx.status}
                                                            onClick={isPendingOrFailed ? () => navigateToParentInvoice(tx, true) : undefined}
                                                        />
                                                    </td>

                                                    {/* 8. Strict 3 Actions: WhatsApp | View | Delete */}
                                                    <td style={{ padding: '14px 18px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                                                            {/* 1. WhatsApp Button */}
                                                            <ActionBtn
                                                                title="WhatsApp Client"
                                                                variant="whatsapp"
                                                                onClick={() => {
                                                                    const ph = formatWhatsAppPhone(clientPhone);
                                                                    const msg = `Hi ${clientName}, reaching out regarding your transaction for Invoice #${parentInvoiceRef} (${serviceName}) scheduled on ${bookingDate}.`;
                                                                    window.open(`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`, '_blank');
                                                                }}
                                                                icon={
                                                                    <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z" />
                                                                    </svg>
                                                                }
                                                            />

                                                            {/* 2. View Details Button */}
                                                            <ActionBtn
                                                                title="View Transaction Details"
                                                                variant="view"
                                                                onClick={() => setSelectedTransaction(tx)}
                                                                icon={
                                                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                                    </svg>
                                                                }
                                                            />

                                                            {/* 3. Delete Button */}
                                                            <ActionBtn
                                                                title="Delete Transaction Record"
                                                                variant="delete"
                                                                onClick={() => setDeleteTarget({ type: 'transaction', item: tx })}
                                                                icon={
                                                                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <polyline points="3 6 5 6 21 6" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6" /><path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6M9 6V4h6v2" />
                                                                    </svg>
                                                                }
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {transactionsMeta.last_page > 1 && (
                            <div style={{
                                padding: '14px 20px',
                                background: brand.softBg,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderTop: `1px solid ${brand.border}`,
                                fontSize: 12.5,
                                color: '#64748b',
                            }}>
                                <div>
                                    Showing <strong>{transactionsMeta.from || 1}</strong> to <strong>{transactionsMeta.to || transactions.length}</strong> of <strong>{transactionsMeta.total}</strong> transactions
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        disabled={transactionsPage <= 1}
                                        onClick={() => setTransactionsPage(p => Math.max(1, p - 1))}
                                        style={{ ...outlineBtn, padding: '6px 14px', fontSize: 12, opacity: transactionsPage <= 1 ? 0.5 : 1 }}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        disabled={transactionsPage >= transactionsMeta.last_page}
                                        onClick={() => setTransactionsPage(p => p + 1)}
                                        style={{ ...outlineBtn, padding: '6px 14px', fontSize: 12, opacity: transactionsPage >= transactionsMeta.last_page ? 0.5 : 1 }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

                        {/* ══════════════════════════════════════════════════════════════
                MODAL: INVOICE & PAYMENT DETAILS (Read-Only)
               ══════════════════════════════════════════════════════════════ */}
            {selectedPayment && (() => {
                const p = selectedPayment;
                const clientName = p.client?.name || 'Valued Client';
                const clientPhone = p.client?.contact_number || p.client?.phone || '—';
                const clientEmail = p.client?.email || '—';
                const serviceAddress = p.booking?.address || p.client?.address || '—';

                const serviceName = p.booking?.service?.name || 'Cleaning Service';
                const bookingRef = p.booking?.reference || (p.booking_id ? `CM-${String(p.booking_id).padStart(5, '0')}` : '—');
                const frequency = p.booking?.frequency || p.booking?.service_frequency || 'One-Time Service';
                const specialInstructions = p.booking?.notes || p.booking?.special_instructions || 'None provided';
                const assignedStaff = p.booking?.cleaners?.length
                    ? p.booking.cleaners.map(c => c.name || c.full_name).join(', ')
                    : (p.booking?.assigned_cleaner?.name || p.booking?.processed_by?.name || 'Operations Dispatch Queue');

                const scheduledDate = p.booking?.preferred_date
                    ? new Date(p.booking.preferred_date).toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
                    : '—';
                const timeSlot = p.booking?.preferred_time || p.booking?.time_slot || '09:00 AM - 12:00 PM';

                const totalAmount = parseFloat(p.amount || 0);
                const subtotal = (totalAmount / 1.05).toFixed(2);
                const vatAmount = (totalAmount - totalAmount / 1.05).toFixed(2);
                const amountPaid = p.status === 'paid' ? totalAmount.toFixed(2) : (p.status === 'refunded' ? '0.00 (Refunded)' : '0.00');
                const balanceDue = p.status === 'paid' ? '0.00' : totalAmount.toFixed(2);

                const lineItems = (p.booking?.details && p.booking.details.length > 0)
                    ? p.booking.details
                    : [{ id: 1, service: { name: serviceName }, quantity: 1, total_price: totalAmount }];

                return (
                    <div
                        onClick={() => setSelectedPayment(null)}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(10, 35, 66, 0.55)', backdropFilter: 'blur(4px)',
                            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
                        }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: '#fff', borderRadius: 20, width: '100%', maxWidth: 720,
                                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(10,35,66,0.28)',
                                display: 'flex', flexDirection: 'column'
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: '20px 26px', borderBottom: '1px solid #f1f5f9',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
                            }}>
                                <div>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                        Invoice & Booking Summary
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                                        <h2 style={{ fontSize: 19, fontWeight: 800, color: brand.navy, margin: 0, fontFamily: fonts.heading }}>
                                            {p.reference_number || `INV-${p.id}`}
                                        </h2>
                                        <PaymentStatusBadge status={p.status} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const pw = window.open('', '_blank', 'width=720,height=900');
                                            const refNum = p.reference_number || `INV-${p.id}`;
                                            const dateStr = new Date(p.created_at).toLocaleDateString('en-AE', { month: 'long', day: 'numeric', year: 'numeric' });
                                            pw.document.write(`<!DOCTYPE html><html><head><title>Invoice ${refNum}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px;color:#0A2342}.card{max-width:640px;margin:0 auto;background:#fff;border-radius:16px;padding:36px;box-shadow:0 10px 30px rgba(0,0,0,.08);border:1px solid #e2e8f0}.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0A2342;padding-bottom:20px;margin-bottom:24px}.logo{font-size:22px;font-weight:800;color:#0A2342}.sub{font-size:11px;color:#64748b;margin-top:4px}.inv-title{font-size:13px;font-weight:700;color:#2563eb;text-transform:uppercase;text-align:right}.inv-num{font-size:18px;font-weight:800;color:#0A2342;text-align:right;margin-top:2px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;font-size:13px}.label{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-bottom:24px}th{background:#f8fafc;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;border-bottom:1px solid #e2e8f0}td{padding:14px;border-bottom:1px solid #f1f5f9;font-size:13px}.total{background:#f8fafc;border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.footer{text-align:center;font-size:11.5px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:20px}</style></head><body><div class="card"><div class="hdr"><div><div class="logo">CITIMAIDS</div><div class="sub">CitiMaids Cleaning Services LLC &bull; Dubai, UAE</div><div class="sub">TRN: 100482910300003 &bull; support@citimaids.ae</div></div><div><div class="inv-title">Official Invoice</div><div class="inv-num">${refNum}</div><div class="sub" style="text-align:right;margin-top:4px">${dateStr}</div></div></div><div class="grid"><div><div class="label">Billed To</div><div style="font-weight:700">${clientName}</div><div style="color:#64748b;font-size:12px">${clientEmail}</div><div style="color:#64748b;font-size:12px">${clientPhone}</div></div><div><div class="label">Booking</div><div style="font-weight:600;color:#0A2342">${bookingRef}</div><div style="color:#64748b;font-size:12px">${serviceName} &bull; ${scheduledDate}</div></div></div><table><thead><tr><th>Description</th><th style="text-align:right">Amount (AED)</th></tr></thead><tbody><tr><td><div style="font-weight:600">${serviceName}</div><div style="font-size:11px;color:#64748b;margin-top:2px">${p.notes || p.external_reference || 'Professional Cleaning Service'}</div></td><td style="text-align:right;font-weight:700">AED ${totalAmount.toFixed(2)}</td></tr></tbody></table><div class="total"><span style="font-size:14px;font-weight:700;color:#0A2342">Total Amount</span><span style="font-size:22px;font-weight:800;color:#0A2342">AED ${totalAmount.toFixed(2)}</span></div><div class="footer">Thank you for choosing CitiMaids!<br>Computer-generated invoice. No signature required.</div></div></body></html>`);
                                            pw.document.close();
                                            pw.focus();
                                            setTimeout(() => pw.print(), 400);
                                        }}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            padding: '8px 16px', borderRadius: 10, border: '1.5px solid #bfdbfe',
                                            background: '#eff6ff', color: '#1d4ed8', fontSize: 12.5, fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Print Invoice
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPayment(null)}
                                        style={{
                                            border: 'none', background: '#f1f5f9', borderRadius: '50%',
                                            width: 32, height: 32, cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {/* 1. Client Information */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Client Information
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                                        <ViewField label="Client Name" value={clientName} highlight />
                                        <ViewField label="Phone / WhatsApp" value={clientPhone} />
                                        <ViewField label="Email Address" value={clientEmail} />
                                        <ViewField label="Delivery / Service Address" value={serviceAddress} />
                                    </div>
                                </div>

                                {/* 2. Booking & Service Details */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        Booking & Service Details
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
                                        <ViewField label="Booking Ref ID" value={bookingRef} highlight />
                                        <ViewField label="Service Category" value={serviceName} />
                                        <ViewField label="Assigned Staff / Cleaners" value={assignedStaff} />
                                        <ViewField label="Service Frequency" value={frequency} />
                                        <ViewField label="Special Instructions" value={specialInstructions} span={2} />
                                    </div>

                                    {/* Line Items */}
                                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 4 }}>
                                        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                                            Line Items & Add-ons
                                        </div>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                                            <thead>
                                                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 10.5, textTransform: 'uppercase' }}>
                                                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Item / Description</th>
                                                    <th style={{ padding: '6px 10px', textAlign: 'center', width: 60 }}>Qty</th>
                                                    <th style={{ padding: '6px 10px', textAlign: 'right', width: 100 }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lineItems.map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '8px 10px', color: brand.navy, fontWeight: 600 }}>
                                                            {item.service?.name || serviceName}
                                                        </td>
                                                        <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>
                                                            {item.quantity || 1}
                                                        </td>
                                                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: brand.navy }}>
                                                            AED {parseFloat(item.total_price || totalAmount).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* 3. Schedule Information */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                                        Schedule Information
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                                        <ViewField label="Scheduled Date" value={scheduledDate} highlight />
                                        <ViewField label="Time Slot" value={timeSlot} />
                                        <ViewField label="Frequency" value={frequency} />
                                    </div>
                                </div>

                                {/* 4. Payment Breakdown */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Payment Breakdown
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
                                        <ViewField label="Subtotal (Net)" value={`AED ${subtotal}`} />
                                        <ViewField label="Tax / VAT (5%)" value={`AED ${vatAmount}`} />
                                        <ViewField label="Discounts" value="AED 0.00" />
                                        <ViewField label="Total Invoice" value={`AED ${totalAmount.toFixed(2)}`} highlight />
                                        <ViewField label="Amount Paid" value={`AED ${amountPaid}`} highlight />
                                        <ViewField label="Balance Due" value={`AED ${balanceDue}`} highlight />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Payment Status</div>
                                            <PaymentStatusBadge status={p.status} />
                                        </div>
                                        <ViewField label="Payment Method" value={formatPaymentMethod(p.payment_method) || 'Online Gateway'} />
                                        <ViewField label="External Gateway Ref" value={p.external_reference || '—'} />
                                        {p.notes && <ViewField label="Internal Administrative Notes" value={p.notes} span={2} />}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: '16px 26px', borderTop: '1px solid #f1f5f9', display: 'flex',
                                justifyContent: 'flex-end', flexShrink: 0, background: '#fafbfc', borderRadius: '0 0 20px 20px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPayment(null)}
                                    style={{ ...outlineBtn, padding: '9px 24px', fontSize: 13, fontWeight: 700 }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

{showRefundModal && selectedPayment && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(10, 35, 66, 0.65)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 18,
                        width: '100%',
                        maxWidth: 460,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                        padding: 24,
                    }}>
                        <h3 style={{ fontSize: 17, fontWeight: 800, color: brand.navy, margin: '0 0 4px', fontFamily: fonts.heading }}>
                            Issue Customer Refund
                        </h3>
                        <p style={{ color: '#64748b', fontSize: 12.5, margin: '0 0 16px' }}>
                            Refunding invoice <strong>{selectedPayment.reference_number}</strong> (Max: AED {parseFloat(selectedPayment.amount).toFixed(2)})
                        </p>

                        <form onSubmit={handleRefundSubmit}>
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: brand.navy, marginBottom: 5 }}>
                                    Refund Amount (AED)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={selectedPayment.amount}
                                    placeholder={parseFloat(selectedPayment.amount).toFixed(2)}
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    style={inputStyle}
                                />
                                <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 3 }}>
                                    Leave blank to refund full amount (AED {parseFloat(selectedPayment.amount).toFixed(2)})
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: brand.navy, marginBottom: 5 }}>
                                    Reason for Refund
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="Customer cancellation, reschedule, service dissatisfaction..."
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowRefundModal(false)}
                                    style={{ ...outlineBtn, padding: '8px 16px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    style={{ ...solidBtn, background: '#dc2626', padding: '8px 18px' }}
                                >
                                    {actionLoading ? 'Processing...' : 'Confirm Refund'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                FLOATING STATUS ACTION MENU (Triggered by Edit button)
                Supports both payment and transaction items via statusMenuTarget
               ══════════════════════════════════════════════════════════════ */}
            {statusMenuTarget && (() => {
                const menuItem = statusMenuTarget.item;
                const menuType = statusMenuTarget.type;
                const menuStatus = (menuItem.status || '').toLowerCase();
                const menuLabel = menuType === 'payment'
                    ? (menuItem.reference_number || `INV-${menuItem.id}`)
                    : `TX #${menuItem.id}`;
                return (
                    <>
                        {/* Transparent Click-away Backdrop */}
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                setStatusMenuTarget(null);
                            }}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                zIndex: 1100,
                                background: 'transparent',
                            }}
                        />

                        {/* Floating Status Action Popover */}
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: 'fixed',
                                top: statusMenuPos.top,
                                right: statusMenuPos.right,
                                zIndex: 1150,
                                minWidth: 180,
                                background: '#ffffff',
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 25px -4px rgba(10, 35, 66, 0.16), 0 4px 10px -2px rgba(10, 35, 66, 0.08)',
                                padding: '6px',
                                animation: 'menuPop 0.15s ease',
                            }}
                        >
                            <div style={{
                                padding: '6px 10px 8px',
                                borderBottom: '1px solid #f1f5f9',
                                marginBottom: 4,
                            }}>
                                <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                                    Status Action
                                </div>
                                <div style={{ fontSize: 11.5, fontWeight: 700, color: brand.navy, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                    <span>{menuLabel}</span>
                                    {menuType === 'payment'
                                        ? <PaymentStatusBadge status={menuItem.status} />
                                        : <TxStatusBadge status={menuItem.status} />}
                                </div>
                            </div>

                            {/* Conditional choices:
                                - Pending: Show Success and Failed
                                - Failed: Show Retry and Dismiss
                            */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {menuStatus === 'pending' && (
                                    <>
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={async () => {
                                                const id = menuItem.id;
                                                setStatusMenuTarget(null);
                                                if (menuType === 'payment') {
                                                    await handleUpdateStatus(id, 'paid');
                                                } else {
                                                    await handleUpdateTransactionStatus(id, 'success');
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '7px 10px',
                                                borderRadius: 8,
                                                border: '1px solid #bbf7d0',
                                                background: '#f0fdf4',
                                                color: '#15803d',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Success</span>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={async () => {
                                                const id = menuItem.id;
                                                setStatusMenuTarget(null);
                                                if (menuType === 'payment') {
                                                    await handleUpdateStatus(id, 'failed');
                                                } else {
                                                    await handleUpdateTransactionStatus(id, 'failed');
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '7px 10px',
                                                borderRadius: 8,
                                                border: '1px solid #fecaca',
                                                background: '#fef2f2',
                                                color: '#dc2626',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            <span>Failed</span>
                                        </button>
                                    </>
                                )}

                                {menuStatus === 'failed' && (
                                    <>
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={async () => {
                                                setStatusMenuTarget(null);
                                                if (menuType === 'payment') {
                                                    await handleRetryPayment(menuItem);
                                                } else {
                                                    await handleRetryTransaction(menuItem.id);
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '7px 10px',
                                                borderRadius: 8,
                                                border: '1px solid #bfdbfe',
                                                background: '#eff6ff',
                                                color: '#1d4ed8',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span>Retry</span>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={async () => {
                                                const id = menuItem.id;
                                                setStatusMenuTarget(null);
                                                if (menuType === 'payment') {
                                                    await handleDismissPayment(id);
                                                } else {
                                                    await handleDismissTransaction(id);
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '7px 10px',
                                                borderRadius: 8,
                                                border: '1px solid #fecaca',
                                                background: '#fef2f2',
                                                color: '#dc2626',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" />
                                            </svg>
                                            <span>Dismiss</span>
                                        </button>
                                    </>
                                )}

                                {menuStatus === 'refunded' && (
                                    <div style={{ padding: '8px 10px', fontSize: 11.5, color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                                        Already Refunded
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                );
            })()}

            {/* ══════════════════════════════════════════════════════════════
                MODAL: DETAIL EDITING FORM (Paid/Success items)
               ══════════════════════════════════════════════════════════════ */}
            {detailEditItem && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(10, 35, 66, 0.65)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                }}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#fff',
                            borderRadius: 18,
                            width: '100%',
                            maxWidth: 480,
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '18px 22px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: brand.navy }}>
                                    Edit {detailEditItem.type === 'payment' ? 'Invoice' : 'Transaction'} Details
                                </div>
                                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                                    {detailEditItem.clientName && `${detailEditItem.clientName} • `}AED {parseFloat(detailEditItem.amount || 0).toFixed(2)}
                                </div>
                            </div>
                            <button
                                onClick={() => setDetailEditItem(null)}
                                style={{
                                    border: 'none',
                                    background: '#f1f5f9',
                                    borderRadius: '50%',
                                    width: 28,
                                    height: 28,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#64748b',
                                    fontSize: 14,
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveDetailEdit} style={{ padding: '20px 22px' }}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: brand.navy, marginBottom: 5 }}>
                                    Reference Number
                                </label>
                                <input
                                    type="text"
                                    value={detailEditItem.reference_number}
                                    onChange={(e) => setDetailEditItem(prev => ({ ...prev, reference_number: e.target.value }))}
                                    placeholder="e.g. INV-000123"
                                    style={inputStyle}
                                />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: brand.navy, marginBottom: 5 }}>
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={detailEditItem.description}
                                    onChange={(e) => setDetailEditItem(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Service description"
                                    style={inputStyle}
                                />
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: brand.navy, marginBottom: 5 }}>
                                    Notes
                                </label>
                                <textarea
                                    rows="3"
                                    value={detailEditItem.notes}
                                    onChange={(e) => setDetailEditItem(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Additional notes, payment remarks..."
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setDetailEditItem(null)}
                                    style={{ ...outlineBtn, padding: '8px 16px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={detailEditLoading}
                                    style={{ ...solidBtn, padding: '8px 20px', opacity: detailEditLoading ? 0.6 : 1 }}
                                >
                                    {detailEditLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                MODAL: GATEWAY EXECUTION DETAILS
               ══════════════════════════════════════════════════════════════ */}
            {selectedTxPayload && (
                <GatewayPayloadViewer
                    payload={selectedTxPayload}
                    onClose={() => setSelectedTxPayload(null)}
                />
            )}

            {/* ══════════════════════════════════════════════════════════════
                MODAL: TRANSACTION DETAILS (ITEM VIEW)
               ══════════════════════════════════════════════════════════════ */}
            {selectedTransaction && (() => {
                const tx = selectedTransaction;
                const isPendingOrFailed = tx.status === 'pending' || tx.status === 'failed';
                const parentInvoice = tx.payment;
                const parentInvoiceRef = parentInvoice?.reference_number || (tx.payment_id ? `INV-${tx.payment_id}` : `TX-${tx.id}`);
                const clientName = parentInvoice?.client?.name || 'Valued Client';
                const clientPhone = parentInvoice?.client?.contact_number || parentInvoice?.client?.phone || '—';
                const clientEmail = parentInvoice?.client?.email || '—';
                const serviceAddress = parentInvoice?.booking?.address || parentInvoice?.client?.address || '—';

                const serviceName = parentInvoice?.booking?.service?.name || 'Cleaning Service';
                const bookingRef = parentInvoice?.booking?.reference || (parentInvoice?.booking_id ? `CM-${String(parentInvoice.booking_id).padStart(5, '0')}` : '—');
                const frequency = parentInvoice?.booking?.frequency || parentInvoice?.booking?.service_frequency || 'One-Time Service';
                const specialInstructions = parentInvoice?.booking?.notes || parentInvoice?.booking?.special_instructions || 'None provided';
                const assignedStaff = parentInvoice?.booking?.cleaners?.length
                    ? parentInvoice.booking.cleaners.map(c => c.name || c.full_name).join(', ')
                    : (parentInvoice?.booking?.assigned_cleaner?.name || parentInvoice?.booking?.processed_by?.name || 'Operations Dispatch Queue');

                const scheduledDate = parentInvoice?.booking?.preferred_date
                    ? new Date(parentInvoice.booking.preferred_date).toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
                    : '—';
                const timeSlot = parentInvoice?.booking?.preferred_time || parentInvoice?.booking?.time_slot || '09:00 AM - 12:00 PM';

                const txAmount = parseFloat(tx.amount || 0).toFixed(2);
                const dateFormatted = new Date(tx.created_at).toLocaleString('en-AE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                });

                return (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(10, 35, 66, 0.65)', backdropFilter: 'blur(4px)',
                        zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                    }}>
                        <div style={{
                            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 740,
                            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(10,35,66,0.3)',
                            display: 'flex', flexDirection: 'column',
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '22px 28px', borderBottom: '1px solid #e2e8f0',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: '#fff', position: 'sticky', top: 0, zIndex: 10,
                            }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                        Immutable Audit Log • Transaction Details
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                                        <h2 style={{ fontSize: 20, fontWeight: 800, color: brand.navy, margin: 0, fontFamily: fonts.heading }}>
                                            Transaction #{tx.id}
                                        </h2>
                                        <TxTypeBadge type={tx.type} />
                                        <TxStatusBadge status={tx.status} />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedTransaction(null)}
                                    style={{
                                        border: 'none', background: '#f1f5f9', borderRadius: '50%',
                                        width: 32, height: 32, cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', color: '#64748b',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Body Content */}
                            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {/* Contextual Banner for Pending / Failed (Entry point 2) */}
                                {isPendingOrFailed && (
                                    <div style={{
                                        background: tx.status === 'failed' ? '#fef2f2' : '#fffbeb',
                                        border: `1.5px solid ${tx.status === 'failed' ? '#fecaca' : '#fde68a'}`,
                                        borderRadius: 14,
                                        padding: '14px 18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 16,
                                        flexWrap: 'wrap',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: '50%',
                                                background: tx.status === 'failed' ? '#fee2e2' : '#fef3c7',
                                                color: tx.status === 'failed' ? '#dc2626' : '#d97706',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 800, fontSize: 16, flexShrink: 0,
                                            }}>
                                                !
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: tx.status === 'failed' ? '#991b1b' : '#92400e' }}>
                                                    {tx.status === 'failed' ? 'Transaction Failed' : 'Transaction Pending Checkout'}
                                                </div>
                                                <div style={{ fontSize: 12, color: tx.status === 'failed' ? '#b91c1c' : '#b45309', marginTop: 1 }}>
                                                    This audit record is linked to Parent Invoice <strong>{parentInvoiceRef}</strong>. Inspect or resolve invoice details in Billing.
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTransaction(null);
                                                navigateToParentInvoice(tx, true);
                                            }}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 7,
                                                padding: '8px 16px',
                                                borderRadius: 10,
                                                border: 'none',
                                                background: tx.status === 'failed' ? '#dc2626' : '#d97706',
                                                color: '#fff',
                                                fontSize: 12.5,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                            }}
                                        >
                                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            View Parent Invoice →
                                        </button>
                                    </div>
                                )}

                                {/* Section 1: Financial & Parent Invoice Activity */}
                                <div style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 14,
                                    padding: '18px 20px',
                                }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
                                        Financial Activity & Parent Invoice Link
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                                        <div>
                                            <span style={{ fontSize: 11, color: '#64748b' }}>Parent Invoice Reference</span>
                                            <div
                                                onClick={() => {
                                                    setSelectedTransaction(null);
                                                    navigateToParentInvoice(tx, isPendingOrFailed);
                                                }}
                                                style={{
                                                    fontWeight: 800, color: brand.royal, fontSize: 14, marginTop: 2,
                                                    cursor: 'pointer', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 4
                                                }}
                                                title="Open parent invoice in Billing"
                                            >
                                                {parentInvoiceRef}
                                                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 11, color: '#64748b' }}>Transaction Amount</span>
                                            <div style={{
                                                fontWeight: 800,
                                                fontSize: 16,
                                                color: tx.type === 'refund' ? '#dc2626' : '#059669',
                                                fontFamily: fonts.heading,
                                                marginTop: 2,
                                            }}>
                                                {tx.type === 'refund' ? '-' : '+'}AED {txAmount}
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 11, color: '#64748b' }}>Payment Method</span>
                                            <div style={{ fontWeight: 600, color: brand.navy, fontSize: 13, marginTop: 2 }}>
                                                {formatPaymentMethod(tx.gateway_response?.payment_method || parentInvoice?.payment_method) || 'Online Gateway'}
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 11, color: '#64748b' }}>Executed Timestamp</span>
                                            <div style={{ fontWeight: 600, color: '#334155', fontSize: 13, marginTop: 2 }}>
                                                {dateFormatted}
                                            </div>
                                        </div>
                                        {tx.processed_by?.name && (
                                            <div>
                                                <span style={{ fontSize: 11, color: '#64748b' }}>Processed By</span>
                                                <div style={{ fontWeight: 600, color: '#334155', fontSize: 13, marginTop: 2 }}>
                                                    {tx.processed_by.name}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section 2: Client Details */}
                                <div style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 14,
                                    padding: '18px 20px',
                                }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
                                        Client Information
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                                        <div>
                                            <span style={{ fontSize: 11, color: '#64748b' }}>Full Name</span>
                                            <div style={{ fontWeight: 700, color: brand.navy, fontSize: 13.5, marginTop: 2 }}>
                                                {clientName}
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 11, color: '#64748b' }}>Contact Phone</span>
                                            <div style={{ fontWeight: 600, color: '#334155', fontSize: 13, marginTop: 2 }}>
                                                {clientPhone}
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 11, color: '#64748b' }}>Email Address</span>
                                            <div style={{ fontWeight: 600, color: '#334155', fontSize: 13, marginTop: 2 }}>
                                                {clientEmail}
                                            </div>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <span style={{ fontSize: 11, color: '#64748b' }}>Service Location / Address</span>
                                            <div style={{ fontWeight: 500, color: '#334155', fontSize: 13, marginTop: 2 }}>
                                                {serviceAddress}
                                            </div>
                                        </div>
                                    </div>
                                </div>



                                {/* Section 4: Payment Gateway Execution Activity */}
                                <div style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 14,
                                    padding: '18px 20px',
                                }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
                                        Payment Gateway Activity & Execution Details
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                                        <div>
                                            <span style={{ fontSize: 11, color: '#64748b' }}>Gateway Reference</span>
                                            <div style={{ fontWeight: 600, color: brand.navy, fontSize: 13, marginTop: 2 }}>
                                                {parentInvoice?.external_reference || `GTW-${tx.id}`}
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 11, color: '#64748b' }}>Audit Log Description</span>
                                            <div style={{ fontWeight: 500, color: '#334155', fontSize: 13, marginTop: 2 }}>
                                                {tx.description || 'System processed audit entry'}
                                            </div>
                                        </div>
                                        {tx.gateway_response && (
                                            <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTxPayload(tx.gateway_response)}
                                                    style={{
                                                        ...outlineBtn,
                                                        padding: '8px 16px',
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        color: brand.royal,
                                                        borderColor: '#bfdbfe',
                                                        background: '#eff6ff',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                                                    </svg>
                                                    View Gateway Activity Details
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer (Strict Read-Only: Standard Close + Contextual Parent Invoice Navigation, NO receipt printing or downloading) */}
                            <div style={{
                                padding: '18px 28px', borderTop: '1px solid #e2e8f0',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: '#f8fafc', position: 'sticky', bottom: 0, zIndex: 10,
                            }}>
                                <div>
                                    {isPendingOrFailed && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTransaction(null);
                                                navigateToParentInvoice(tx, true);
                                            }}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 7,
                                                padding: '9px 18px',
                                                borderRadius: 10,
                                                border: '1.5px solid #bfdbfe',
                                                background: '#eff6ff',
                                                color: '#1d4ed8',
                                                fontSize: 13,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            View Parent Invoice
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedTransaction(null)}
                                    style={{
                                        ...outlineBtn,
                                        padding: '9px 22px',
                                        fontSize: 13,
                                        fontWeight: 700,
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Receipt modal removed — receipt actions no longer exist in Transaction Ledger */}

            {/* ══ INVOICE EDIT MODAL (Status + Notes only) ══ */}
            {invoiceEditModal && (() => {
                const p = invoiceEditModal;
                const clientName = p.client?.name || 'Valued Client';
                const clientPhone = p.client?.contact_number || p.client?.phone || '—';
                const clientEmail = p.client?.email || '—';
                const serviceAddress = p.booking?.address || p.client?.address || '—';

                const serviceName = p.booking?.service?.name || 'Cleaning Service';
                const bookingRef = p.booking?.reference || (p.booking_id ? `CM-${String(p.booking_id).padStart(5, '0')}` : '—');
                const frequency = p.booking?.frequency || p.booking?.service_frequency || 'One-Time Service';
                const specialInstructions = p.booking?.notes || p.booking?.special_instructions || 'None provided';
                const assignedStaff = p.booking?.cleaners?.length
                    ? p.booking.cleaners.map(c => c.name || c.full_name).join(', ')
                    : (p.booking?.assigned_cleaner?.name || p.booking?.processed_by?.name || 'Operations Dispatch Queue');

                const scheduledDate = p.booking?.preferred_date
                    ? new Date(p.booking.preferred_date).toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
                    : '—';
                const timeSlot = p.booking?.preferred_time || p.booking?.time_slot || '09:00 AM - 12:00 PM';

                const totalAmount = parseFloat(p.amount || 0);
                const subtotal = (totalAmount / 1.05).toFixed(2);
                const vatAmount = (totalAmount - totalAmount / 1.05).toFixed(2);
                const amountPaid = p.status === 'paid' ? totalAmount.toFixed(2) : (p.status === 'refunded' ? '0.00 (Refunded)' : '0.00');
                const balanceDue = p.status === 'paid' ? '0.00' : totalAmount.toFixed(2);

                return (
                    <div
                        onClick={() => setInvoiceEditModal(null)}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(10, 35, 66, 0.65)', backdropFilter: 'blur(4px)',
                            zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
                        }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: '#fff', borderRadius: 20, width: '100%', maxWidth: 720,
                                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(10,35,66,0.3)',
                                display: 'flex', flexDirection: 'column'
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: '20px 26px', borderBottom: '1px solid #f1f5f9',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
                            }}>
                                <div>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                        Edit Invoice Details
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                                        <h2 style={{ fontSize: 19, fontWeight: 800, color: brand.navy, margin: 0, fontFamily: fonts.heading }}>
                                            {p.reference_number || `INV-${p.id}`}
                                        </h2>
                                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                            AED {totalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setInvoiceEditModal(null)}
                                    style={{
                                        border: 'none', background: '#f1f5f9', borderRadius: '50%',
                                        width: 32, height: 32, cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                                {/* ── RESTRICTED EDITABLE FIELDS HIGHLIGHT BOX ── */}
                                <div style={{
                                    background: '#f0fdf4', border: '1.5px solid #86efac',
                                    borderRadius: 16, padding: '18px 22px', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.08)'
                                }}>
                                    <div style={{
                                        fontSize: 11, fontWeight: 800, color: '#16a34a',
                                        textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14,
                                        display: 'flex', alignItems: 'center', gap: 6
                                    }}>
                                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Editable Fields
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                                            {/* 1. Status */}
                                            <div>
                                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: brand.navy, marginBottom: 6 }}>
                                                    Status <span style={{ color: '#dc2626' }}>*</span>
                                                </label>
                                                <select
                                                    value={invoiceEditStatus}
                                                    onChange={e => setInvoiceEditStatus(e.target.value)}
                                                    style={{
                                                        width: '100%', padding: '10px 14px', borderRadius: 10,
                                                        border: '1.5px solid #bbf7d0', background: '#fff',
                                                        color: brand.navy, fontSize: 13.5, fontWeight: 700,
                                                        outline: 'none', cursor: 'pointer', fontFamily: fonts.body
                                                    }}
                                                >
                                                    <option value="paid">Paid</option>
                                                    <option value="unpaid">Unpaid</option>
                                                    <option value="pending">Pending</option>
                                                    <option value="refunded">Refunded</option>
                                                </select>
                                            </div>

                                            {/* 2. Payment Method */}
                                            <div>
                                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: brand.navy, marginBottom: 6 }}>
                                                    Payment Method <span style={{ color: '#dc2626' }}>*</span>
                                                </label>
                                                <select
                                                    value={invoiceEditPaymentMethod}
                                                    onChange={e => setInvoiceEditPaymentMethod(e.target.value)}
                                                    required
                                                    style={{
                                                        width: '100%', padding: '10px 14px', borderRadius: 10,
                                                        border: '1.5px solid #bbf7d0', background: '#fff',
                                                        color: brand.navy, fontSize: 13.5, fontWeight: 700,
                                                        outline: 'none', cursor: 'pointer', fontFamily: fonts.body
                                                    }}
                                                >
                                                    <option value="cash">Cash</option>
                                                    <option value="card">Credit Card</option>
                                                    <option value="bank_transfer">Bank Transfer</option>
                                                    <option value="online">Online Gateway</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* 3. Internal Notes */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: brand.navy, marginBottom: 6 }}>
                                                Internal Notes
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={invoiceEditNotes}
                                                onChange={e => setInvoiceEditNotes(e.target.value)}
                                                placeholder="Enter internal administrative remarks, audit notes, or payment records..."
                                                style={{
                                                    ...inputStyle,
                                                    background: '#fff',
                                                    border: '1.5px solid #bbf7d0',
                                                    borderRadius: 10,
                                                    padding: '10px 14px',
                                                    resize: 'vertical',
                                                    minHeight: 76,
                                                    fontSize: 13
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Read-Only Context: Client Information */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', opacity: 0.92 }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>
                                        Client Information
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                                        <ViewField label="Client Name" value={clientName} />
                                        <ViewField label="Phone / WhatsApp" value={clientPhone} />
                                        <ViewField label="Email Address" value={clientEmail} />
                                        <ViewField label="Delivery / Service Address" value={serviceAddress} />
                                    </div>
                                </div>

                                {/* Read-Only Context: Booking & Service */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', opacity: 0.92 }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>
                                        Booking & Service Details
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                                        <ViewField label="Booking Ref ID" value={bookingRef} />
                                        <ViewField label="Service Category" value={serviceName} />
                                        <ViewField label="Assigned Staff" value={assignedStaff} />
                                        <ViewField label="Service Frequency" value={frequency} />
                                        <ViewField label="Special Instructions" value={specialInstructions} span={2} />
                                    </div>
                                </div>

                                {/* Read-Only Context: Schedule */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', opacity: 0.92 }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>
                                        Schedule Information
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                                        <ViewField label="Scheduled Date" value={scheduledDate} />
                                        <ViewField label="Time Slot" value={timeSlot} />
                                        <ViewField label="Frequency" value={frequency} />
                                    </div>
                                </div>

                                {/* Read-Only Context: Payment Breakdown */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', opacity: 0.92 }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>
                                        Payment Breakdown
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                                        <ViewField label="Subtotal (Net)" value={`AED ${subtotal}`} />
                                        <ViewField label="Tax / VAT (5%)" value={`AED ${vatAmount}`} />
                                        <ViewField label="Total Invoice" value={`AED ${totalAmount.toFixed(2)}`} highlight />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: '16px 26px', borderTop: '1px solid #f1f5f9', display: 'flex',
                                justifyContent: 'flex-end', gap: 10, flexShrink: 0, background: '#fafbfc', borderRadius: '0 0 20px 20px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setInvoiceEditModal(null)}
                                    style={{ ...outlineBtn, padding: '9px 20px', fontSize: 13, fontWeight: 700 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveInvoiceEdit}
                                    disabled={invoiceEditSaving}
                                    style={{
                                        ...solidBtn, padding: '9px 24px', fontSize: 13, fontWeight: 700,
                                        opacity: invoiceEditSaving ? 0.7 : 1, cursor: invoiceEditSaving ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {invoiceEditSaving ? 'Saving Changes...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ══ DELETE CONFIRMATION MODAL ══ */}
            {deleteTarget && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(10, 35, 66, 0.65)', backdropFilter: 'blur(4px)',
                    zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 420,
                        boxShadow: '0 25px 60px rgba(0,0,0,0.25)', padding: 28,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#0A2342' }}>Confirm Delete</div>
                                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>This action cannot be undone.</div>
                            </div>
                        </div>
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#991b1b' }}>
                            You are about to permanently delete{' '}
                            <strong>
                                {deleteTarget.type === 'payment'
                                    ? (deleteTarget.item.reference_number || `Invoice #${deleteTarget.item.id}`)
                                    : `Transaction #${deleteTarget.item.id}`}
                            </strong>.
                            {deleteTarget.type === 'payment' && deleteTarget.item.client?.name && (
                                <> &nbsp;Client: <strong>{deleteTarget.item.client.name}</strong> &mdash; AED <strong>{parseFloat(deleteTarget.item.amount || 0).toFixed(2)}</strong></>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}
                                style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button type="button" onClick={handleDeleteConfirm} disabled={deleteLoading}
                                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteLoading ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" /></svg>
                                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── ViewField: Read-only label+value block ── */
function ViewField({ label, value, highlight, span }) {
    return (
        <div style={span === 2 ? { gridColumn: '1 / -1' } : {}}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: highlight ? 800 : 600, color: highlight ? brand.navy : '#334155', fontFamily: highlight ? fonts.heading : fonts.body }}>{value || '—'}</div>
        </div>
    );
}

/* ── Sort & Filters Button Component ────────────────────── */

function PaymentSortFilterBtn({ onClick, hasActiveFilters }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 18px',
                borderRadius: 12,
                border: hasActiveFilters ? `1.5px solid ${brand.royal}` : `1.5px solid ${brand.border}`,
                background: hovered ? '#f8fafc' : '#fff',
                color: hasActiveFilters ? brand.royal : '#334155',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: hovered ? '0 4px 12px rgba(10,35,66,0.08)' : 'none',
                transform: hovered ? 'translateY(-1px)' : 'none',
                position: 'relative',
            }}
        >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h18M7 8h10M10 12h4" />
            </svg>
            Sort & Filters
            {hasActiveFilters && (
                <span style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 10, height: 10, borderRadius: '50%',
                    background: brand.royal, border: '2px solid #fff',
                }} />
            )}
        </button>
    );
}

/* ── Badges ─────────────────────────────────────────────── */

function PaymentStatusBadge({ status }) {
    const map = {
        paid: { bg: '#d1fae5', color: '#059669', label: 'Paid', border: '#86efac' },
        pending: { bg: '#fef3c7', color: '#d97706', label: 'Pending', border: '#fde68a' },
        unpaid: { bg: '#fee2e2', color: '#dc2626', label: 'Unpaid', border: '#fca5a5' },
        failed: { bg: '#fee2e2', color: '#dc2626', label: 'Unpaid', border: '#fca5a5' },
        refunded: { bg: '#ede9fe', color: '#7c3aed', label: 'Refunded', border: '#ddd6fe' },
        expired: { bg: '#f1f5f9', color: '#64748b', label: 'Expired', border: '#e2e8f0' },
    };
    const s = map[status] || map.pending;
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 700,
            background: s.bg,
            color: s.color,
            whiteSpace: 'nowrap',
        }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
            {s.label}
        </span>
    );
}


function TxTypeBadge({ type }) {
    const isRefund = type === 'refund';
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 10.5,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            background: isRefund ? '#fee2e2' : '#dbeafe',
            color: isRefund ? '#dc2626' : '#1e40af',
            whiteSpace: 'nowrap',
        }}>
            {type}
        </span>
    );
}

function TxStatusBadge({ status, onClick }) {
    const isActionable = Boolean(onClick && (status === 'pending' || status === 'failed'));
    const map = {
        success: { color: '#059669', label: 'Success', bg: '#d1fae5', border: '#86efac' },
        failed: { color: '#dc2626', label: 'Failed', bg: '#fee2e2', border: '#fca5a5' },
        pending: { color: '#d97706', label: 'Pending', bg: '#fef3c7', border: '#fde68a' },
    };
    const s = map[status] || map.pending;
    return (
        <span
            onClick={onClick}
            title={isActionable ? 'Click to view & edit parent Invoice in Billing section' : undefined}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                color: s.color,
                background: s.bg,
                border: `1px solid ${s.border}`,
                whiteSpace: 'nowrap',
                cursor: isActionable ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
                if (isActionable) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                }
            }}
            onMouseLeave={e => {
                if (isActionable) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }
            }}
        >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
            {s.label}
            {isActionable && (
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 2, opacity: 0.85 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            )}
        </span>
    );
}

/* ── Reusable Action Button (Exact Match to Booking Section Design) ─── */
function ActionBtn({ icon, onClick, title, variant = 'view', danger, isView, disabled }) {
    const [hovered, setHovered] = useState(false);

    // Resolve variant
    let effectiveVariant = variant;
    if (danger) effectiveVariant = 'delete';
    else if (isView) effectiveVariant = 'view';
    else if (variant === 'green' || variant === 'whatsapp') effectiveVariant = 'whatsapp';
    else if (variant === 'amber' || variant === 'edit') effectiveVariant = 'edit';
    else if (variant === 'blue' || variant === 'view') effectiveVariant = 'view';

    const THEMES = {
        whatsapp: {
            bg: '#f0fdf4',
            border: '#bbf7d0',
            color: '#16a34a',
            bgHover: '#dcfce7',
            borderHover: '#86efac',
            colorHover: '#15803d',
            shadow: '0 4px 10px rgba(22, 163, 74, 0.2)',
        },
        view: {
            bg: '#eff6ff',
            border: '#bfdbfe',
            color: '#1d4ed8',
            bgHover: '#dbeafe',
            borderHover: '#93c5fd',
            colorHover: '#1e40af',
            shadow: '0 4px 10px rgba(29, 78, 216, 0.2)',
        },
        edit: {
            bg: '#fffbeb',
            border: '#fde68a',
            color: '#b45309',
            bgHover: '#fef3c7',
            borderHover: '#fcd34d',
            colorHover: '#92400e',
            shadow: '0 4px 10px rgba(180, 83, 9, 0.2)',
        },
        delete: {
            bg: '#fef2f2',
            border: '#fecaca',
            color: '#dc2626',
            bgHover: '#fee2e2',
            borderHover: '#fca5a5',
            colorHover: '#b91c1c',
            shadow: '0 4px 10px rgba(220, 38, 38, 0.2)',
        },
    };

    const theme = THEMES[effectiveVariant] || THEMES.view;

    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(e);
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                border: `1.5px solid ${hovered && !disabled ? theme.borderHover : theme.border}`,
                background: hovered && !disabled ? theme.bgHover : theme.bg,
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: hovered && !disabled ? theme.colorHover : theme.color,
                opacity: disabled ? 0.45 : 1,
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hovered && !disabled ? theme.shadow : 'none',
                padding: 0,
                flexShrink: 0,
            }}
        >
            {icon}
        </button>
    );
}
