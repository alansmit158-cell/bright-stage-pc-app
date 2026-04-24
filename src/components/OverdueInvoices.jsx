import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const OverdueInvoices = () => {
    const navigate = useNavigate();
    const [overdueInvoices, setOverdueInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOverdueInvoices();
    }, []);

    const fetchOverdueInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/invoices');
            const now = new Date();

            // Filter overdue: status is not Paid and dueDate has passed
            const overdue = res.data.filter(inv => {
                if (['Paid', 'Cancelled', 'Draft'].includes(inv.status)) return false;
                if (!inv.dueDate) return false;
                return new Date(inv.dueDate) < now;
            });

            // Sort by oldest due date first
            overdue.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

            setOverdueInvoices(overdue);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminder = async (invoiceId) => {
        if (!confirm("Send payment reminder email to client?")) return;

        try {
            await api.post(`/invoices/${invoiceId}/reminders`);
            alert("✅ Reminder Sent!");
            fetchOverdueInvoices(); // Refresh to update reminder count
        } catch (err) {
            alert("Failed to send reminder: " + (err.response?.data?.error || err.message));
        }
    };

    const getDaysOverdue = (dueDate) => {
        const diff = new Date() - new Date(dueDate);
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const getTotalOverdue = () => {
        return overdueInvoices.reduce((sum, inv) => {
            return sum + (inv.financials.totalInclTax - (inv.totalPaid || 0));
        }, 0);
    };

    if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading...</div>;

    return (
        <div style={{ padding: 24, color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: 8 }}>⏰ Overdue Invoices</h1>
                    <p style={{ color: '#aaa' }}>Track and follow up on late payments.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#aaa' }}>TOTAL OVERDUE</div>
                    <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ef4444' }}>
                        {getTotalOverdue().toFixed(3)} DT
                    </div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>
                        {overdueInvoices.length} Invoice{overdueInvoices.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {overdueInvoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, background: '#1e1e1e', borderRadius: 12 }}>
                    <div style={{ fontSize: 60, marginBottom: 20 }}>✅</div>
                    <h3 style={{ fontSize: 18, marginBottom: 10 }}>All Clear!</h3>
                    <p style={{ color: '#aaa' }}>No overdue invoices at the moment.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    {overdueInvoices.map(inv => {
                        const daysOverdue = getDaysOverdue(inv.dueDate);
                        const amountDue = inv.financials.totalInclTax - (inv.totalPaid || 0);

                        let severity = '#fbbf24'; // yellow
                        if (daysOverdue > 30) severity = '#f97316'; // orange
                        if (daysOverdue > 60) severity = '#ef4444'; // red

                        return (
                            <div key={inv._id} style={{
                                background: '#1e1e1e',
                                padding: 20,
                                borderRadius: 12,
                                borderLeft: `4px solid ${severity}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 20
                            }}>
                                {/* Invoice Details */}
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
                                        {inv.number}
                                    </div>
                                    <div style={{ color: '#aaa', fontSize: 13 }}>
                                        {inv.client?.name || 'Unknown Client'}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                                        Issued: {new Date(inv.date).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Due Date & Days */}
                                <div style={{ textAlign: 'center', minWidth: 120 }}>
                                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>DUE DATE</div>
                                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                                        {new Date(inv.dueDate).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: 12, color: severity, marginTop: 4, fontWeight: 'bold' }}>
                                        {daysOverdue} days overdue
                                    </div>
                                </div>

                                {/* Amount Due */}
                                <div style={{ textAlign: 'right', minWidth: 120 }}>
                                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>AMOUNT DUE</div>
                                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ef4444' }}>
                                        {amountDue.toFixed(3)} DT
                                    </div>
                                    {inv.totalPaid > 0 && (
                                        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                                            Paid: {inv.totalPaid.toFixed(3)} DT
                                        </div>
                                    )}
                                </div>

                                {/* Reminders */}
                                <div style={{ textAlign: 'center', minWidth: 100 }}>
                                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>REMINDERS</div>
                                    <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                                        {inv.reminders?.length || 0}
                                    </div>
                                    {inv.reminders && inv.reminders.length > 0 && (
                                        <div style={{ fontSize: 10, color: '#666' }}>
                                            Last: {new Date(inv.reminders[inv.reminders.length - 1].date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button
                                        onClick={() => handleSendReminder(inv._id)}
                                        style={{
                                            background: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 6,
                                            padding: '8px 16px',
                                            fontSize: 13,
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5
                                        }}
                                    >
                                        📧 Send Reminder
                                    </button>
                                    <button
                                        onClick={() => navigate('/payments')}
                                        style={{
                                            background: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 6,
                                            padding: '8px 16px',
                                            fontSize: 13,
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        💰 Record Payment
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OverdueInvoices;
