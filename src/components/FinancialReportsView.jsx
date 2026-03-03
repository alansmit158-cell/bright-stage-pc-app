import React, { useState, useEffect } from 'react';
import api from '../services/api';

const FinancialReportsView = () => {
    const [pnl, setPnl] = useState(null);
    const [balanceSheet, setBalanceSheet] = useState(null);
    const [cashFlow, setCashFlow] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [agedBalance, setAgedBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, analytics, export

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const [resPnl, resBal, resCash, resRev, resAged] = await Promise.all([
                api.get('/accounting/pnl'),
                api.get('/accounting/balance-sheet'),
                api.get('/accounting/cash-flow'),
                api.get('/accounting/revenue-over-time'),
                api.get('/accounting/aged-balance')
            ]);
            setPnl(resPnl.data);
            setBalanceSheet(resBal.data);
            setCashFlow(resCash.data);
            setRevenueData(resRev.data);
            setAgedBalance(resAged.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type) => {
        try {
            const response = await api.get(`/accounting/export/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_export.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            alert("Export failed");
        }
    };

    if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading Reports...</div>;

    const Card = ({ title, value, color }) => (
        <div style={{ background: '#1e1e1e', padding: 20, borderRadius: 12, flex: 1, minWidth: 200, borderLeft: `4px solid ${color}` }}>
            <div style={{ color: '#aaa', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>{value}</div>
        </div>
    );

    return (
        <div style={{ padding: 24, color: 'white', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>📈 Financial Reports</h1>
                <div>
                    <button onClick={() => setActiveTab('overview')} style={{ marginRight: 10, padding: '8px 16px', borderRadius: 20, border: 'none', background: activeTab === 'overview' ? '#3b82f6' : '#333', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Overview</button>
                    <button onClick={() => setActiveTab('analytics')} style={{ marginRight: 10, padding: '8px 16px', borderRadius: 20, border: 'none', background: activeTab === 'analytics' ? '#8b5cf6' : '#333', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Analytics</button>
                    <button onClick={() => setActiveTab('export')} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: activeTab === 'export' ? '#10b981' : '#333', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Data Export</button>
                </div>
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="fade-in">
                    {/* Section 1: P&L (Compte de Résultat) */}
                    <div style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: 18, borderBottom: '1px solid #333', paddingBottom: 10, marginBottom: 20 }}>
                            🧾 Compte de Résultat (P&L) <span style={{ fontSize: 12, color: '#666' }}>{pnl?.period}</span>
                        </h2>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                            <Card title="Revenue (Produits)" value={`${pnl?.revenue.toFixed(3)} DT`} color="#4ade80" />
                            <Card title="Expenses (Charges)" value={`${pnl?.expenses.toFixed(3)} DT`} color="#f87171" />
                            <Card title="Net Result (Résultat)" value={`${pnl?.netResult.toFixed(3)} DT`} color={pnl?.netResult >= 0 ? "#10b981" : "#ef4444"} />
                        </div>
                    </div>

                    {/* Section 2: Balance Sheet (Bilan) */}
                    <div style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: 18, borderBottom: '1px solid #333', paddingBottom: 10, marginBottom: 20 }}>
                            ⚖️ Bilan (Balance Sheet)
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                            {/* Assets */}
                            <div style={{ background: '#1e1e1e', padding: 20, borderRadius: 12 }}>
                                <h3 style={{ color: '#4ade80', marginBottom: 15 }}>Actif (Assets)</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span>Bank & Cash</span>
                                    <span>{balanceSheet?.assets.bank.toFixed(3)} DT</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span>Receivables (Clients)</span>
                                    <span>{balanceSheet?.assets.receivables.toFixed(3)} DT</span>
                                </div>
                                <div style={{ borderTop: '1px solid #333', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                    <span>Total Actif</span>
                                    <span>{balanceSheet?.assets.total.toFixed(3)} DT</span>
                                </div>
                            </div>

                            {/* Liabilities + Equity */}
                            <div style={{ background: '#1e1e1e', padding: 20, borderRadius: 12 }}>
                                <h3 style={{ color: '#f87171', marginBottom: 15 }}>Passif (Liab. & Equity)</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span>Liabilities (Dettes)</span>
                                    <span>{balanceSheet?.liabilities.total.toFixed(3)} DT</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span>Equity (Capitaux Propres)</span>
                                    <span>{balanceSheet?.equity.toFixed(3)} DT</span>
                                </div>
                                <div style={{ borderTop: '1px solid #333', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                    <span>Total Passif</span>
                                    <span>{(balanceSheet?.liabilities.total + balanceSheet?.equity).toFixed(3)} DT</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Treasury (Trésorerie) */}
                    <div>
                        <h2 style={{ fontSize: 18, borderBottom: '1px solid #333', paddingBottom: 10, marginBottom: 20 }}>
                            💵 Trésorerie (Cash Flow)
                        </h2>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                            <Card title="Current Balance" value={`${cashFlow?.currentBalance.toFixed(3)} DT`} color="#3b82f6" />
                            <Card title="Incoming Forecast" value={`+ ${cashFlow?.incomingForecast.toFixed(3)} DT`} color="#fbbf24" />
                            <Card title="Projected Balance" value={`${cashFlow?.projectedBalance.toFixed(3)} DT`} color="#8b5cf6" />
                        </div>
                    </div>
                </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
                <div className="fade-in">
                    {/* Revenue Chart */}
                    <div style={{ background: '#1e1e1e', padding: 20, borderRadius: 12, marginBottom: 32 }}>
                        <h3 style={{ marginBottom: 20 }}>📊 Revenue Over Time (This Year)</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 10 }}>
                            {revenueData.map((d, i) => {
                                const maxRev = Math.max(...revenueData.map(r => r.revenue)) || 1;
                                const height = (d.revenue / maxRev) * 100;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                                        <div style={{
                                            width: '100%',
                                            height: `${Math.max(height, 1)}%`,
                                            background: d.revenue > 0 ? '#4ade80' : '#333',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 0.3s ease'
                                        }}></div>
                                        <span style={{ fontSize: 10, color: '#aaa' }}>{d.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Aged Balance */}
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <div style={{ flex: 2, background: '#1e1e1e', padding: 20, borderRadius: 12, minWidth: 300 }}>
                            <h3 style={{ marginBottom: 15 }}>⏳ Aged Balance</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: `8px`, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                                    <span>Not Due</span>
                                    <span style={{ fontWeight: 'bold', color: '#4ade80' }}>{agedBalance?.buckets.notDue.toFixed(3)} DT</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: `8px`, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                                    <span>1-30 Days Overdue</span>
                                    <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>{agedBalance?.buckets.days30.toFixed(3)} DT</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: `8px`, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                                    <span>31-60 Days Overdue</span>
                                    <span style={{ fontWeight: 'bold', color: '#f97316' }}>{agedBalance?.buckets.days60.toFixed(3)} DT</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: `8px`, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                                    <span>60+ Days Overdue</span>
                                    <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{(agedBalance?.buckets.days90 + agedBalance?.buckets.days90plus).toFixed(3)} DT</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1, background: '#1e1e1e', padding: 20, borderRadius: 12, minWidth: 250 }}>
                            <h3 style={{ marginBottom: 15 }}>🏆 Top Debtors</h3>
                            {agedBalance?.topDebtors.map((d, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ color: '#aaa' }}>{d.name}</span>
                                    <span style={{ fontWeight: 'bold' }}>{d.amount.toFixed(3)} DT</span>
                                </div>
                            ))}
                            {agedBalance?.topDebtors.length === 0 && <span style={{ color: '#666' }}>No debtors.</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* EXPORT TAB */}
            {activeTab === 'export' && (
                <div className="fade-in" style={{ textAlign: 'center', marginTop: 40 }}>
                    <div style={{ fontSize: 60, marginBottom: 20 }}>💾</div>
                    <h2>Export Data</h2>
                    <p style={{ color: '#aaa', marginBottom: 30 }}>Download your financial data for external accounting.</p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                        <button
                            onClick={() => handleExport('invoices')}
                            style={{
                                padding: '16px 32px', borderRadius: 12, border: 'none',
                                background: '#3b82f6', color: 'white', fontSize: 16, cursor: 'pointer', fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', gap: 10
                            }}
                        >
                            📄 Export Invoices (CSV)
                        </button>

                        {/* Placeholder for future exports */}
                        <button
                            disabled
                            style={{
                                padding: '16px 32px', borderRadius: 12, border: 'none',
                                background: '#333', color: '#666', fontSize: 16, cursor: 'not-allowed', fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', gap: 10
                            }}
                        >
                            🧾 Export Expenses (Coming Soon)
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default FinancialReportsView;
