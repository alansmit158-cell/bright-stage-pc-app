import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PaymentEntry = () => {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [unpaidInvoices, setUnpaidInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    // Payment Form
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState('Bank Transfer');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');

    // Allocations State: { invoiceId: amountToAlloc }
    const [allocations, setAllocations] = useState({});

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (selectedClient) {
            fetchUnpaidInvoices(selectedClient);
        } else {
            setUnpaidInvoices([]);
            setAllocations({});
        }
    }, [selectedClient]);

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUnpaidInvoices = async (clientId) => {
        setLoading(true);
        try {
            const res = await api.get('/invoices'); // ideally get /invoices?client=xyz&status=unpaid
            // Filter client side for now as API is generic
            const filtered = res.data.filter(inv =>
                (inv.client?.id === clientId || inv.client?._id === clientId) &&
                ['Sent', 'Partially Paid', 'Overdue', 'Validated'].includes(inv.status)
            );
            setUnpaidInvoices(filtered);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoAllocate = () => {
        let remaining = parseFloat(amount);
        if (remaining <= 0) return;

        const newAllocations = {};

        // Sort by date ascending (pay oldest first)
        const sorted = [...unpaidInvoices].sort((a, b) => new Date(a.date) - new Date(b.date));

        for (const inv of sorted) {
            if (remaining <= 0) break;

            const due = inv.financials.totalInclTax - (inv.totalPaid || 0);
            const alloc = Math.min(remaining, due);

            newAllocations[inv._id] = alloc;
            remaining -= alloc;
        }

        setAllocations(newAllocations);
    };

    const handleAllocationChange = (invId, value) => {
        setAllocations({
            ...allocations,
            [invId]: parseFloat(value) || 0
        });
    };

    const handleSubmit = async () => {
        if (!selectedClient || amount <= 0) {
            alert("Please select a client and enter a valid amount.");
            return;
        }

        const allocList = Object.entries(allocations).map(([id, amt]) => ({
            invoiceId: id,
            amount: amt
        })).filter(a => a.amount > 0);

        const totalAlloc = allocList.reduce((sum, a) => sum + a.amount, 0);

        if (totalAlloc > amount) {
            alert(`Allocated amount (${totalAlloc}) exceeds payment amount (${amount})!`);
            return;
        }

        const payload = {
            client: selectedClient,
            amount,
            date,
            method,
            reference,
            notes,
            allocations: allocList
        };

        try {
            await api.post('/payments', payload);
            alert("✅ Payment Recorded & Allocated!");
            // Reset
            setAmount(0);
            setReference('');
            setNotes('');
            setAllocations({});
            fetchUnpaidInvoices(selectedClient); // Refresh
        } catch (err) {
            alert("Error: " + err.response?.data?.error || err.message);
        }
    };

    const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
    const unallocated = Math.max(0, amount - totalAllocated);

    return (
        <div style={{ padding: 24, color: 'white' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: 24 }}>💰 Payment Entry & Reconciliation</h1>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

                {/* Left: Payment Details */}
                <div style={{ flex: 1, minWidth: 300, background: '#1e1e1e', padding: 20, borderRadius: 12 }}>
                    <h3 style={{ marginBottom: 20 }}>1. Payment Details</h3>

                    <div className="form-group" style={{ marginBottom: 15 }}>
                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5 }}>Client</label>
                        <select
                            value={selectedClient}
                            onChange={e => setSelectedClient(e.target.value)}
                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #444', borderRadius: 4 }}
                        >
                            <option value="">-- Select Client --</option>
                            {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 15 }}>
                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5 }}>Amount (DT)</label>
                        <input
                            type="number"
                            step="0.001"
                            value={amount}
                            onChange={e => setAmount(parseFloat(e.target.value))}
                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #444', borderRadius: 4, fontSize: 18, fontWeight: 'bold' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1, marginBottom: 15 }}>
                            <label style={{ display: 'block', color: '#aaa', marginBottom: 5 }}>Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #444', borderRadius: 4 }}
                            />
                        </div>
                        <div style={{ flex: 1, marginBottom: 15 }}>
                            <label style={{ display: 'block', color: '#aaa', marginBottom: 5 }}>Method</label>
                            <select
                                value={method}
                                onChange={e => setMethod(e.target.value)}
                                style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #444', borderRadius: 4 }}
                            >
                                <option>Bank Transfer</option>
                                <option>Check</option>
                                <option>Cash</option>
                                <option>Card</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 15 }}>
                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5 }}>Reference / Notes</label>
                        <input
                            type="text"
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            placeholder="Check # or Trans ID"
                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #444', borderRadius: 4, marginBottom: 10 }}
                        />
                        <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Internal Notes"
                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #444', borderRadius: 4 }}
                        />
                    </div>

                    <div style={{ marginTop: 20, padding: 15, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span>Total Allocated:</span>
                            <span style={{ fontWeight: 'bold', color: totalAllocated === amount ? '#4ade80' : '#fbbf24' }}>{totalAllocated.toFixed(3)} DT</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Unallocated (Credit):</span>
                            <span style={{ fontWeight: 'bold' }}>{unallocated.toFixed(3)} DT</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={amount <= 0 || loading}
                        style={{
                            width: '100%', marginTop: 20, padding: 12, borderRadius: 8,
                            background: '#10b981', color: 'white', border: 'none',
                            fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                            opacity: (amount <= 0 || loading) ? 0.5 : 1
                        }}
                    >
                        {loading ? 'Processing...' : '💾 Verify & Post Payment'}
                    </button>
                </div>

                {/* Right: Allocation (Lettrage) */}
                <div style={{ flex: 2, minWidth: 400, background: '#1e1e1e', padding: 20, borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ margin: 0 }}>2. Reconcile Invoices (Lettrage)</h3>
                        <button
                            onClick={handleAutoAllocate}
                            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                        >
                            ⚡ Auto-Allocate (Oldest First)
                        </button>
                    </div>

                    {unpaidInvoices.length === 0 ? (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>No unpaid invoices found for this client.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 500, overflowY: 'auto' }}>
                            {unpaidInvoices.map(inv => {
                                const due = inv.financials.totalInclTax - (inv.totalPaid || 0);
                                const isFullyPaidInForm = (allocations[inv._id] || 0) >= due;

                                return (
                                    <div key={inv._id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: 10, borderRadius: 8,
                                        background: isFullyPaidInForm ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                                        border: isFullyPaidInForm ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 'bold', fontSize: 14 }}>{inv.number}</div>
                                            <div style={{ fontSize: 12, color: '#aaa' }}>{new Date(inv.date).toLocaleDateString()}</div>
                                        </div>
                                        <div style={{ width: 100, textAlign: 'right', marginRight: 20 }}>
                                            <div style={{ fontSize: 10, color: '#aaa' }}>DUE</div>
                                            <div style={{ fontWeight: 'bold', color: '#f87171' }}>{due.toFixed(3)}</div>
                                        </div>
                                        <div style={{ width: 140 }}>
                                            <label style={{ fontSize: 10, color: '#aaa', display: 'block' }}>ALLOCATE</label>
                                            <input
                                                type="number"
                                                value={allocations[inv._id] || ''}
                                                onChange={e => handleAllocationChange(inv._id, e.target.value)}
                                                placeholder="0.000"
                                                style={{
                                                    width: '100%', background: '#333', border: '1px solid #555',
                                                    color: 'white', padding: 5, borderRadius: 4, textAlign: 'right'
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentEntry;
