import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ReconciliationView = () => {
    const [transactions, setTransactions] = useState([]);
    const [unpaidInvoices, setUnpaidInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [manualMatches, setManualMatches] = useState({}); // { txId: selectedInvoiceId }

    useEffect(() => {
        fetchPending();
        fetchUnpaidInvoices();
    }, []);

    const fetchUnpaidInvoices = async () => {
        try {
            const res = await api.get('/invoices');
            // Filter locally for status: Sent, Partially Paid, Overdue
            const unpaid = res.data.filter(inv =>
                ['Sent', 'Partially Paid', 'Overdue'].includes(inv.status) ||
                (inv.status === 'Sent' && new Date(inv.dueDate) < new Date())
            );
            setUnpaidInvoices(unpaid);
        } catch (err) {
            console.error("Error fetching unpaid invoices:", err);
        }
    };

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await api.get('/banking/pending');
            setTransactions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            await api.post('/banking/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Bank Statement Uploaded!');
            setFile(null);
            fetchPending();
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReconcile = async (txId, invoiceId) => {
        if (!confirm('Link this transaction to invoice? This will mark it as paid.')) return;
        try {
            await api.post(`/banking/${txId}/reconcile`, { invoiceId });
            alert('Reconciled Successfully!');
            fetchPending();
        } catch (err) {
            alert('Reconciliation failed: ' + err.message);
        }
    };

    return (
        <div style={{ padding: 24, color: 'white' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: 24 }}>🏦 Bank Reconciliation</h1>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                <div style={{ background: '#1e1e1e', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
                    <div style={{ color: '#aaa', fontSize: 12, marginBottom: 4 }}>PENDING TRANSACTIONS</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>{transactions.length}</div>
                </div>
                <div style={{ background: '#1e1e1e', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
                    <div style={{ color: '#aaa', fontSize: 12, marginBottom: 4 }}>AUTOMATIC SUGGESTIONS</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>
                        {transactions.filter(t => t.suggestions?.length > 0).length}
                    </div>
                </div>
                <div style={{ background: '#1e1e1e', padding: 20, borderRadius: 12, border: '1px solid #333' }}>
                    <div style={{ color: '#aaa', fontSize: 12, marginBottom: 4 }}>NEED MANUAL ACTION</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>
                        {transactions.filter(t => !t.suggestions || t.suggestions.length === 0).length}
                    </div>
                </div>
            </div>

            {/* Upload Section */}
            <div style={{ background: '#1e1e1e', padding: 20, borderRadius: 12, marginBottom: 32 }}>
                <h3 style={{ marginBottom: 16 }}>Import Bank Statement (CSV/Excel)</h3>
                <form onSubmit={handleUpload} style={{ display: 'flex', gap: 10 }}>
                    <input
                        type="file"
                        accept=".csv, .xlsx, .xls"
                        onChange={e => setFile(e.target.files[0])}
                        style={{ color: 'white' }}
                    />
                    <button
                        type="submit"
                        disabled={!file || loading}
                        style={{
                            background: '#3b82f6', color: 'white', border: 'none',
                            padding: '8px 16px', borderRadius: 6, cursor: 'pointer'
                        }}
                    >
                        {loading ? 'Uploading...' : 'Upload & Process'}
                    </button>
                </form>
            </div>

            {/* Pending Transactions */}
            <h3 style={{ marginBottom: 16 }}>Pending Transactions ({transactions.length})</h3>

            {loading && transactions.length === 0 ? <p>Loading...</p> : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {transactions.map(tx => (
                        <div key={tx._id} style={{
                            background: '#1e1e1e', padding: 16, borderRadius: 12, border: '1px solid #333',
                            display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20
                        }}>
                            {/* Transaction Info */}
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>
                                    {new Date(tx.date).toLocaleDateString()}
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
                                    {tx.description}
                                </div>
                                <div style={{ color: tx.amount > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                                    {tx.amount.toFixed(3)} DT
                                </div>
                            </div>

                            {/* Suggestions / Actions */}
                            <div style={{ flex: 2, minWidth: 300 }}>
                                <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>SUGGESTED MATCHES</div>
                                {tx.suggestions && tx.suggestions.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {tx.suggestions.map(inv => (
                                            <div key={inv._id} style={{
                                                background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 6,
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}>
                                                <div>
                                                    <span style={{ fontWeight: 'bold', marginRight: 8 }}>{inv.number}</span>
                                                    <span style={{ color: '#aaa' }}>{inv.client?.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <span style={{ color: '#fbbf24' }}>
                                                        {(inv.financials.totalInclTax - (inv.totalPaid || 0)).toFixed(3)} DT Due
                                                    </span>
                                                    <button
                                                        onClick={() => handleReconcile(tx._id, inv._id)}
                                                        style={{
                                                            background: '#10b981', border: 'none', borderRadius: 4,
                                                            color: 'white', padding: '4px 8px', cursor: 'pointer', fontSize: 12
                                                        }}
                                                    >
                                                        Match
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ color: '#666', fontStyle: 'italic', fontSize: 12 }}>
                                            No automatic match found. Select manually:
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <select
                                                value={manualMatches[tx._id] || ''}
                                                onChange={(e) => setManualMatches(prev => ({ ...prev, [tx._id]: e.target.value }))}
                                                style={{
                                                    flex: 1,
                                                    background: '#0f172a',
                                                    color: 'white',
                                                    border: '1px solid #334155',
                                                    borderRadius: 6,
                                                    padding: '6px 10px',
                                                    fontSize: 13
                                                }}
                                            >
                                                <option value="">Select Invoice...</option>
                                                {unpaidInvoices.map(inv => (
                                                    <option key={inv._id} value={inv._id}>
                                                        {inv.number} - {inv.client?.name} ({(inv.financials.totalInclTax - (inv.totalPaid || 0)).toFixed(3)} DT)
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => handleReconcile(tx._id, manualMatches[tx._id])}
                                                disabled={!manualMatches[tx._id]}
                                                style={{
                                                    background: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 6,
                                                    padding: '6px 12px',
                                                    cursor: manualMatches[tx._id] ? 'pointer' : 'not-allowed',
                                                    opacity: manualMatches[tx._id] ? 1 : 0.5,
                                                    fontSize: 12,
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Link Manual
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && <p style={{ color: '#666' }}>No pending transactions to reconcile.</p>}
                </div>
            )}
        </div>
    );
};

export default ReconciliationView;
