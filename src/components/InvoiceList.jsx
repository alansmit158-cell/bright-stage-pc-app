import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const InvoiceList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState(location.state?.filter || null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    // Update filter if navigation state changes
    useEffect(() => {
        if (location.state?.filter) {
            setActiveFilter(location.state.filter);
        }
    }, [location.state]);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/invoices');
            setInvoices(res.data);
            setLoading(false);
        } catch (err) {
            console.log("Invoice API error", err);
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredInvoices = invoices.filter(inv => {
        if (!activeFilter) return true;
        if (activeFilter === 'Overdue') {
            return (inv.status === 'Sent' || inv.status === 'Partially Paid') && new Date(inv.dueDate) < new Date();
        }
        if (activeFilter === 'Sent') return inv.status === 'Sent';
        if (activeFilter === 'Paid') return inv.status === 'Paid';
        return true;
    });

    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const handleDownload = async (id, number) => {
        try {
            const resPdf = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([resPdf.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${number}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            alert("Failed to download PDF");
        }
    };

    const PaymentModal = ({ invoice, onClose, onSuccess }) => {
        const [amount, setAmount] = useState(((invoice.financials?.totalInclTax || 0) - (invoice.totalPaid || 0)).toFixed(3));
        const [method, setMethod] = useState('Bank Transfer');
        const [note, setNote] = useState('');
        const [loading, setLoading] = useState(false);

        const handleSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
                await api.post(`/invoices/${invoice._id}/payments`, { amount, method, note });
                alert('Payment Recorded!');
                onSuccess();
                onClose();
            } catch (err) {
                alert('Error recording payment: ' + (err.response?.data?.error || err.message));
            } finally {
                setLoading(false);
            }
        };

        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                backdropFilter: 'blur(5px)'
            }}>
                <div style={{
                    background: '#1a1b26', padding: '32px', borderRadius: '24px', width: '400px',
                    border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    <h2 style={{ color: 'white', marginBottom: '8px', fontSize: '20px', fontWeight: 'bold' }}>💰 Record Payment</h2>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Update payment status for {invoice.number}</p>

                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Total Amount</span>
                            <span style={{ color: 'white', fontWeight: '600' }}>{invoice.financials?.totalInclTax?.toFixed(3)} DT</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Already Paid</span>
                            <span style={{ color: '#10b981', fontWeight: '600' }}>{(invoice.totalPaid || 0).toFixed(3)} DT</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Amount to Pay (DT)</label>
                            <input type="number" step="0.001" value={amount} onChange={e => setAmount(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #334155', background: '#0f1016', color: 'white', outline: 'none', fontSize: '16px', boxSizing: 'border-box' }} required />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Payment Method</label>
                            <select value={method} onChange={e => setMethod(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #334155', background: '#0f1016', color: 'white', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}>
                                <option>Bank Transfer</option>
                                <option>Cash</option>
                                <option>Check</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Reference / Note</label>
                            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Check #1234"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #334155', background: '#0f1016', color: 'white', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #334155', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                            <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: '600' }}>
                                {loading ? 'Saving...' : 'Confirm'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    if (loading) return <div className="text-white p-8 text-center text-lg animate-pulse">Loading Invoices...</div>;

    return (
        <div style={{ padding: '24px', color: 'white', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                        💶 Invoices {activeFilter && <span style={{ fontSize: '0.6em', opacity: 0.7 }}>({activeFilter})</span>}
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Manage and track your client billing history.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {activeFilter && (
                        <button
                            onClick={() => { setActiveFilter(null); navigate('/invoices', { replace: true, state: {} }); }}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Clear Filter
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/invoice-builder')}
                        style={{
                            background: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            transition: 'transform 0.2s',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <span>✨</span> New Invoice
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div style={{
                background: 'rgba(30, 30, 30, 0.6)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Invoice #</th>
                            <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Client</th>
                            <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Date</th>
                            <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Amount (TTC)</th>
                            <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.map((inv, index) => (
                            <tr key={inv._id} style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                                transition: 'background 0.2s'
                            }}>
                                <td style={{ padding: '20px 24px', fontWeight: '600', color: '#fff' }}>{inv.number}</td>
                                <td style={{ padding: '20px 24px', color: '#e2e8f0' }}>{inv.client?.name || 'Unknown'}</td>
                                <td style={{ padding: '20px 24px', color: '#94a3b8' }}>{new Date(inv.date).toLocaleDateString()}</td>
                                <td style={{ padding: '20px 24px', fontFamily: '"JetBrains Mono", monospace', color: '#fbbf24', fontWeight: '600' }}>
                                    {inv.financials?.totalInclTax?.toFixed(3)} DT
                                    {inv.status === 'Partially Paid' && (
                                        <div style={{ fontSize: '10px', color: '#f87171', marginTop: '4px' }}>
                                            Remain: {(inv.financials.totalInclTax - (inv.totalPaid || 0)).toFixed(3)}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        background: inv.status === 'Paid' ? 'rgba(34, 197, 94, 0.1)' :
                                            inv.status === 'Overdue' ? 'rgba(239, 68, 68, 0.1)' : // Explicit Overdue status
                                                (inv.status === 'Sent' && new Date(inv.dueDate) < new Date()) ? 'rgba(239, 68, 68, 0.1)' : // Computed Overdue
                                                    inv.status === 'Sent' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                        color: inv.status === 'Paid' ? '#4ade80' :
                                            inv.status === 'Overdue' || (inv.status === 'Sent' && new Date(inv.dueDate) < new Date()) ? '#f87171' :
                                                inv.status === 'Sent' ? '#60a5fa' : '#94a3b8',
                                        border: `1px solid ${inv.status === 'Paid' ? 'rgba(34, 197, 94, 0.2)' :
                                            inv.status === 'Overdue' || (inv.status === 'Sent' && new Date(inv.dueDate) < new Date()) ? 'rgba(239, 68, 68, 0.2)' :
                                                inv.status === 'Sent' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.2)'}`
                                    }}>
                                        {(() => {
                                            if (inv.status === 'Sent' && new Date(inv.dueDate) < new Date()) {
                                                const now = new Date();
                                                const due = new Date(inv.dueDate);
                                                // Reset times to compare pure dates
                                                now.setHours(0, 0, 0, 0);
                                                due.setHours(0, 0, 0, 0);

                                                const diffTime = now - due;
                                                const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                return `OVERDUE (+${days}d)`;
                                            }
                                            return inv.status?.toUpperCase() || 'DRAFT';
                                        })()}
                                    </span>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    {inv.status !== 'Paid' && (
                                        <button
                                            onClick={() => setSelectedInvoice(inv)}
                                            style={{
                                                background: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            title="Record Payment"
                                        >
                                            💰 Pay
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDownload(inv._id, inv.number)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                                        title="Download PDF"
                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        📄
                                    </button>

                                    {(inv.status === 'Sent' || inv.status === 'Partially Paid') && new Date(inv.dueDate) < new Date() && (
                                        <button
                                            onClick={async () => {
                                                if (confirm(`Send email reminder to client for ${inv.number}?`)) {
                                                    try {
                                                        await api.post(`/invoices/${inv._id}/reminders`);
                                                        alert('Reminder Sent!');
                                                        // Maybe update local state to show it was sent?
                                                    } catch (e) {
                                                        alert('Error sending reminder: ' + (e.response?.data?.error || e.message));
                                                    }
                                                }
                                            }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                                            title="Send Reminder Email"
                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            🔔
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredInvoices.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>💶</div>
                                    <h3 style={{ fontSize: '18px', color: '#e2e8f0', marginBottom: '8px' }}>No invoices yet</h3>
                                    <p>Create your first invoice to get started.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedInvoice && (
                <PaymentModal
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    onSuccess={fetchInvoices}
                />
            )}
        </div>
    );
};

export default InvoiceList;
