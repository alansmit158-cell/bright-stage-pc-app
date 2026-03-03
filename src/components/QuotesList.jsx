import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const QuotesList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        try {
            const res = await api.get('/projects');
            // Filter: Only show "Draft" and "Quote"
            const onlyQuotes = res.data.filter(p =>
                p.status === 'Draft' || p.status === 'Quote'
            );
            setQuotes(onlyQuotes);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching quotes:", err);
            setLoading(false);
        }
    };

    const handleDownload = async (id, eventName) => {
        try {
            const response = await api.get(`/projects/${id}/quote`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `quote-${eventName}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            alert("Failed to download PDF");
        }
    };

    if (loading) return <div className="text-white p-4">Loading Quotes...</div>;

    return (
        <div style={{ padding: '24px', color: 'white', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '8px' }}>📝 Quotes Management</h1>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Review drafts and convert them to invoices if needed.</p>
                </div>
                <button
                    onClick={() => navigate('/quote-builder')}
                    style={{
                        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
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
                    <span>✨</span> New Quote
                </button>
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
                            <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Event / Quote Name</th>
                            <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Client</th>
                            <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Dates</th>
                            <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Total (TTC)</th>
                            <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotes.map((q, index) => (
                            <tr key={q._id} style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                                transition: 'background 0.2s'
                            }}>
                                <td style={{ padding: '20px 24px', fontWeight: '600', color: '#fff' }}>{q.eventName}</td>
                                <td style={{ padding: '20px 24px', color: '#e2e8f0' }}>{q.client?.name || '-'}</td>
                                <td style={{ padding: '20px 24px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                    {q.dates?.start ? new Date(q.dates.start).toLocaleDateString() : 'TBD'}
                                </td>
                                <td style={{ padding: '20px 24px', fontFamily: 'monospace', color: '#fbbf24', fontWeight: '600' }}>
                                    {(q.financials?.totalInclTax || 0).toFixed(3)} DT
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        background: q.status === 'Quote' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                        color: q.status === 'Quote' ? '#60a5fa' : '#94a3b8',
                                        border: `1px solid ${q.status === 'Quote' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.2)'}`
                                    }}>
                                        {q.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => handleDownload(q._id, q.eventName)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                                        title="Download PDF"
                                    >
                                        📄
                                    </button>

                                    {['Founder', 'Manager'].includes(user?.role) && (
                                        <button
                                            onClick={async () => {
                                                if (window.confirm(`Convert '${q.eventName}' to Draft Invoice?`)) {
                                                    try {
                                                        await api.post(`/invoices/from-project/${q._id}`);
                                                        alert('Invoice Draft Created!');
                                                        navigate('/invoices');
                                                    } catch (e) {
                                                        alert('Error: ' + e.message);
                                                    }
                                                }
                                            }}
                                            style={{
                                                background: '#ca8a04',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                marginLeft: '8px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            title="Create Invoice from Quote"
                                        >
                                            💶 Invoice
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QuotesList;
