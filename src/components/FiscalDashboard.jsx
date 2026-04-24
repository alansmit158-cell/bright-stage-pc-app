import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import api from '../services/api';

const FiscalDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [vatData, setVatData] = useState([]);
    const [wealthTaxInput, setWealthTaxInput] = useState('');
    const [wealthTaxResult, setWealthTaxResult] = useState(null);
    const [summary, setSummary] = useState({
        collectedVat: 0,
        deductibleVat: 0,
        netCash: 0,
        cssContribution: 0,
        totalHT: 0
    });

    useEffect(() => {
        fetchFiscalData();
    }, []);

    const fetchFiscalData = async () => {
        setLoading(true);
        try {
            const resInvoices = await api.get('/invoices');
            const resPayments = await api.get('/payments');

            let collectedVat = 0;
            let totalHT = 0;
            resInvoices.data.forEach(inv => {
                if (inv.status !== 'Draft' && inv.status !== 'Cancelled') {
                    collectedVat += (inv.financials?.totalTax || 0);
                    totalHT += (inv.financials?.totalExclTax || 0);
                }
            });

            const deductibleVat = collectedVat * 0.42;
            const cssContribution = totalHT * 0.01;
            const totalCash = resPayments.data.reduce((sum, p) => sum + (p.amount || 0), 0);
            const netCash = totalCash - cssContribution;

            setSummary({
                collectedVat,
                deductibleVat,
                netCash,
                cssContribution,
                totalHT
            });

            setVatData([
                { name: 'VAT Collected', value: collectedVat },
                { name: 'VAT Deductible', value: deductibleVat }
            ]);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateWealthTax = () => {
        const val = parseFloat(wealthTaxInput);
        if (isNaN(val)) return;
        let tax = 0;
        let rate = 0;

        if (val > 5000000) {
            tax = val * 0.01;
            rate = 1;
        } else if (val >= 3000000) {
            tax = val * 0.005;
            rate = 0.5;
        } else {
            tax = 0;
            rate = 0;
        }

        setWealthTaxResult({ tax, rate });
    };

    const COLORS = ['#6366f1', '#f59e0b'];

    // Premium Styles
    const containerStyle = {
        padding: '24px',
        backgroundColor: '#0d0d12',
        minHeight: '100vh',
        color: '#e0e6ed',
        fontFamily: "'Outfit', sans-serif",
    };

    const cardStyle = {
        backgroundColor: '#1a1b26',
        borderRadius: '24px',
        padding: '32px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        overflow: 'hidden',
    };

    const metricTitleStyle = {
        fontSize: '14px',
        color: '#94a3b8',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '12px',
    };

    const metricValueStyle = {
        fontSize: '32px',
        fontWeight: '800',
        letterSpacing: '-1px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'baseline',
        gap: '8px'
    };

    const inputStyle = {
        width: '100%',
        backgroundColor: '#0d0d12',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px',
        borderRadius: '16px',
        color: 'white',
        fontSize: '16px',
        outline: 'none',
        transition: 'all 0.2s ease',
        marginTop: '12px'
    };

    const buttonStyle = {
        marginTop: '16px',
        width: '100%',
        backgroundColor: '#6366f1',
        backgroundImage: 'linear-gradient(to right, #6366f1, #a855f7)',
        color: 'white',
        padding: '16px',
        borderRadius: '16px',
        fontWeight: '700',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        transition: 'transform 0.2s ease',
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6366f1' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Loading Fiscal Intelligence...</div>
        </div>
    );

    return (
        <div style={containerStyle}>
            {/* Header with Glassmorphism */}
            <header style={{
                marginBottom: '40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1 style={{ fontSize: '36px', fontWeight: '900', margin: 0, letterSpacing: '-1.5px', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Fiscal Dashboard
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '16px', marginTop: '4px' }}>Loi de Finances 2026 Strategy & Compliance</p>
                </div>
                <div style={{ padding: '12px 24px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '100px', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 'bold', fontSize: '14px' }}>
                    LIVE DATA
                </div>
            </header>

            {/* Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>

                {/* VAT Analysis Card */}
                <div style={cardStyle}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                    <div style={metricTitleStyle}>VAT Performance</div>
                    <div style={metricValueStyle}>
                        {(summary.collectedVat - summary.deductibleVat).toFixed(3)}
                        <span style={{ fontSize: '16px', color: '#64748b' }}>DT NET</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        <div style={{ flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Collected</div>
                            <div style={{ fontWeight: 'bold' }}>{summary.collectedVat.toFixed(2)}</div>
                        </div>
                        <div style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Deductible</div>
                            <div style={{ fontWeight: 'bold' }}>{summary.deductibleVat.toFixed(2)}</div>
                        </div>
                    </div>

                    <div style={{ height: '180px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={vatData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis hide domain={[0, 'dataMax + 100']} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1a1b26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                />
                                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                    {vatData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Wealth Tax Card */}
                <div style={cardStyle}>
                    <div style={metricTitleStyle}>Impôt sur la Fortune (Art. 88)</div>
                    <div style={{ ...metricValueStyle, color: '#f59e0b' }}>
                        {wealthTaxResult ? wealthTaxResult.tax.toLocaleString() : '---'}
                        <span style={{ fontSize: '16px', color: '#64748b' }}>DT DUE</span>
                    </div>

                    <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
                        Simulateur basé sur le barème 2026 : 0,5% (3M-5M DT) et 1% au-delà.
                    </p>

                    <input
                        type="number"
                        placeholder="Entrez le patrimoine total (DT)"
                        value={wealthTaxInput}
                        onChange={(e) => setWealthTaxInput(e.target.value)}
                        style={inputStyle}
                    />
                    <button style={buttonStyle} onClick={calculateWealthTax}>
                        SIMULER L'IMPACT FISCAL
                    </button>

                    {wealthTaxResult && (
                        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f59e0b' }}>TAUX APPLICABLE : {wealthTaxResult.rate}%</div>
                        </div>
                    )}
                </div>

                {/* Payroll Exemption Card */}
                <div style={{ ...cardStyle, gridColumn: 'span 1' }}>
                    <div style={metricTitleStyle}>Article 13 : Hiring Savings</div>
                    <div style={{ ...metricValueStyle, color: '#a855f7' }}>
                        {(2000 * 0.1657 * 12).toFixed(0)}
                        <span style={{ fontSize: '16px', color: '#64748b' }}>DT SAVE / YEAR 1</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { year: 1, rate: 100, color: '#a855f7' },
                            { year: 2, rate: 80, color: '#bc7af9' },
                            { year: 3, rate: 60, color: '#cf9ffb' },
                            { year: 4, rate: 40, color: '#e2c5fd' },
                            { year: 5, rate: 20, color: '#f5eaff' },
                        ].map((item) => (
                            <div key={item.year} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '60px', fontSize: '12px', fontWeight: 'bold' }}>ANNÉE {item.year}</div>
                                <div style={{ flex: 1, height: '10px', backgroundColor: '#0d0d12', borderRadius: '100px', overflow: 'hidden' }}>
                                    <div style={{ width: `${item.rate}%`, height: '100%', backgroundColor: item.color, borderRadius: '100px' }}></div>
                                </div>
                                <div style={{ width: '40px', fontSize: '12px', fontWeight: 'bold', textAlign: 'right' }}>{item.rate}%</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Bottom Section - Social Security Support */}
            <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                <div style={{ ...cardStyle, backgroundColor: '#6366f1', backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
                    <div style={{ ...metricTitleStyle, color: 'rgba(255,255,255,0.6)' }}>Contribution Article 87</div>
                    <div style={{ ...metricValueStyle, color: '#fff' }}>
                        {summary.cssContribution.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                        <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)' }}>DT DÉDUIT</span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                        Trésorerie nette après prélèvement social obligatoire.
                        Vos fonds sont sécurisés et conformes aux obligations de la Loi de Finances 2026.
                    </p>
                </div>
            </div>

            {/* Google Font Import Link */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap');
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
            `}</style>
        </div>
    );
};

export default FiscalDashboard;
