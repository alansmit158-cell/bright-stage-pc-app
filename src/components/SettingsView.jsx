import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AddressAutocomplete from './AddressAutocomplete';

const SettingsView = () => {
    const [activeTab, setActiveTab] = useState('company'); // company, currencies, accounting
    const [selectedCompany, setSelectedCompany] = useState('bright'); // 'bright' or 'square'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Company Settings
    const [companySettings, setCompanySettings] = useState(null);

    // Currencies
    const [currencies, setCurrencies] = useState([]);

    // Chart of Accounts
    const [chartOfAccounts, setChartOfAccounts] = useState({});

    useEffect(() => {
        setCompanySettings(null); // Clear previous settings to prevent race conditions
        setError(null);
        fetchData();
    }, [activeTab, selectedCompany]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'company') {
                const res = await api.get(`/settings/company?key=${selectedCompany}`);
                setCompanySettings(res.data);
            } else if (activeTab === 'currencies') {
                const res = await api.get('/settings/currencies');
                setCurrencies(res.data);
            } else if (activeTab === 'accounting') {
                const res = await api.get('/settings/chart-of-accounts');
                setChartOfAccounts(res.data);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCompany = async () => {
        try {
            await api.put(`/settings/company?key=${selectedCompany}`, companySettings);
            alert(`✅ ${selectedCompany === 'bright' ? 'Bright Stage' : 'Square Event'} Settings Saved!`);
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleUpdateField = (path, value) => {
        const keys = path.split('.');
        const updated = { ...companySettings };
        let current = updated;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        setCompanySettings(updated);
    };

    const handleSeedCurrencies = async () => {
        if (!confirm('Seed default currencies (DT, EUR, USD)?')) return;
        try {
            await api.post('/settings/currencies/seed');
            alert('✅ Currencies Seeded!');
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleSeedAccounts = async () => {
        if (!confirm('Seed standard Chart of Accounts?')) return;
        try {
            await api.post('/accounting/seed');
            alert('✅ Chart of Accounts Seeded!');
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading && !companySettings) return <div style={{ color: 'white', padding: 20 }}>Loading...</div>;

    return (
        <div style={{ padding: 24, color: 'white' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: 24 }}>⚙️ System Settings</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 30, borderBottom: '1px solid #333' }}>
                <button
                    onClick={() => setActiveTab('company')}
                    style={{
                        padding: '10px 20px', background: activeTab === 'company' ? '#3b82f6' : 'transparent',
                        color: 'white', border: 'none', borderBottom: activeTab === 'company' ? '3px solid #3b82f6' : 'none',
                        cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    🏢 Company Info
                </button>
                <button
                    onClick={() => setActiveTab('currencies')}
                    style={{
                        padding: '10px 20px', background: activeTab === 'currencies' ? '#8b5cf6' : 'transparent',
                        color: 'white', border: 'none', borderBottom: activeTab === 'currencies' ? '3px solid #8b5cf6' : 'none',
                        cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    💱 Currencies
                </button>
                <button
                    onClick={() => setActiveTab('accounting')}
                    style={{
                        padding: '10px 20px', background: activeTab === 'accounting' ? '#10b981' : 'transparent',
                        color: 'white', border: 'none', borderBottom: activeTab === 'accounting' ? '3px solid #10b981' : 'none',
                        cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    📊 Chart of Accounts
                </button>
            </div>

            {/* Company Settings Tab */}
            {activeTab === 'company' && (
                <div style={{ maxWidth: 800 }}>
                    {/* Company Selector - Always visible when in company tab */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                        <button
                            onClick={() => setSelectedCompany('bright')}
                            style={{
                                flex: 1, padding: '12px', borderRadius: 8,
                                background: selectedCompany === 'bright' ? '#3b82f6' : '#2a2a2a',
                                border: '1px solid ' + (selectedCompany === 'bright' ? '#3b82f6' : '#444'),
                                color: 'white', cursor: 'pointer', fontWeight: 'bold'
                            }}
                        >
                            Bright Stage
                        </button>
                        <button
                            onClick={() => setSelectedCompany('square')}
                            style={{
                                flex: 1, padding: '12px', borderRadius: 8,
                                background: selectedCompany === 'square' ? '#3b82f6' : '#2a2a2a',
                                border: '1px solid ' + (selectedCompany === 'square' ? '#3b82f6' : '#444'),
                                color: 'white', cursor: 'pointer', fontWeight: 'bold'
                            }}
                        >
                            Square Event
                        </button>
                    </div>

                    {loading && <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Loading {selectedCompany === 'bright' ? 'Bright Stage' : 'Square Event'} settings...</div>}

                    {error && (
                        <div style={{ background: '#ef444422', border: '1px solid #ef4444', color: '#ef4444', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                            <strong>Error:</strong> {error}
                            <button onClick={fetchData} style={{ marginLeft: 15, background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>Retry</button>
                        </div>
                    )}

                    {companySettings && (
                        <>
                            <div style={{ background: '#1e1e1e', padding: 24, borderRadius: 12, marginBottom: 20 }}>
                                <h3 style={{ marginBottom: 20 }}>General Information</h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5, fontSize: 12 }}>Company Name</label>
                                        <input
                                            type="text"
                                            value={companySettings.companyName || ''}
                                            onChange={e => handleUpdateField('companyName', e.target.value)}
                                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5, fontSize: 12 }}>Legal Name</label>
                                        <input
                                            type="text"
                                            value={companySettings.legalName || ''}
                                            onChange={e => handleUpdateField('legalName', e.target.value)}
                                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4 }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5, fontSize: 12 }}>Tax ID (NIF/TVA)</label>
                                        <input
                                            type="text"
                                            value={companySettings.taxId || ''}
                                            onChange={e => handleUpdateField('taxId', e.target.value)}
                                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5, fontSize: 12 }}>Email</label>
                                        <input
                                            type="email"
                                            value={companySettings.email || ''}
                                            onChange={e => handleUpdateField('email', e.target.value)}
                                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4 }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5, fontSize: 12 }}>Phone</label>
                                        <input
                                            type="text"
                                            value={companySettings.phone || ''}
                                            onChange={e => handleUpdateField('phone', e.target.value)}
                                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5, fontSize: 12 }}>Website</label>
                                        <input
                                            type="text"
                                            value={companySettings.website || ''}
                                            onChange={e => handleUpdateField('website', e.target.value)}
                                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#1e1e1e', padding: 24, borderRadius: 12, marginBottom: 20 }}>
                                <h3 style={{ marginBottom: 20 }}>Address 📍</h3>
                                <div style={{ marginBottom: 15 }}>
                                    <label style={{ display: 'block', color: '#aaa', marginBottom: 5, fontSize: 12 }}>
                                        Street Address (Start typing to search with Google Maps)
                                    </label>
                                    <AddressAutocomplete
                                        value={companySettings.address?.street || ''}
                                        onChange={(addressData) => {
                                            // Update all address fields at once
                                            const updated = { ...companySettings };
                                            if (!updated.address) updated.address = {};

                                            if (addressData.street) updated.address.street = addressData.street;
                                            if (addressData.city) updated.address.city = addressData.city;
                                            if (addressData.postalCode) updated.address.postalCode = addressData.postalCode;
                                            if (addressData.country) updated.address.country = addressData.country;

                                            setCompanySettings(updated);
                                        }}
                                        placeholder="Start typing your address..."
                                        style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4 }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15 }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5, fontSize: 12 }}>City</label>
                                        <input
                                            type="text"
                                            value={companySettings.address?.city || ''}
                                            onChange={e => handleUpdateField('address.city', e.target.value)}
                                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5, fontSize: 12 }}>Postal Code</label>
                                        <input
                                            type="text"
                                            value={companySettings.address?.postalCode || ''}
                                            onChange={e => handleUpdateField('address.postalCode', e.target.value)}
                                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5, fontSize: 12 }}>Country</label>
                                        <input
                                            type="text"
                                            value={companySettings.address?.country || ''}
                                            onChange={e => handleUpdateField('address.country', e.target.value)}
                                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#1e1e1e', padding: 24, borderRadius: 12, marginBottom: 20 }}>
                                <h3 style={{ marginBottom: 20 }}>Banking Information</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5, fontSize: 12 }}>Bank Name</label>
                                        <input
                                            type="text"
                                            value={companySettings.bankDetails?.bankName || ''}
                                            onChange={e => handleUpdateField('bankDetails.bankName', e.target.value)}
                                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#aaa', marginBottom: 5, fontSize: 12 }}>IBAN</label>
                                        <input
                                            type="text"
                                            value={companySettings.bankDetails?.iban || ''}
                                            onChange={e => handleUpdateField('bankDetails.iban', e.target.value)}
                                            style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#1e1e1e', padding: 24, borderRadius: 12, marginBottom: 20 }}>
                                <h3 style={{ marginBottom: 20 }}>Invoice Settings & Legal</h3>
                                <div style={{ marginBottom: 15 }}>
                                    <label style={{ display: 'block', color: '#aaa', marginBottom: 5, fontSize: 12 }}>Legal Mentions (Footer)</label>
                                    <textarea
                                        value={companySettings.legalMentions || ''}
                                        onChange={e => handleUpdateField('legalMentions', e.target.value)}
                                        rows={3}
                                        placeholder="e.g., SARL au capital de 10,000 DT - RCS Tunis..."
                                        style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555', borderRadius: 4, fontFamily: 'inherit' }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveCompany}
                                style={{
                                    width: '100%', padding: 16, background: '#10b981', color: 'white',
                                    border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer'
                                }}
                            >
                                💾 Save Company Settings
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Currencies Tab */}
            {activeTab === 'currencies' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3>Manage Currencies & Exchange Rates</h3>
                        <button
                            onClick={handleSeedCurrencies}
                            style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            🌍 Seed Default Currencies
                        </button>
                    </div>

                    {currencies.length === 0 ? (
                        <p style={{ color: '#666' }}>No currencies configured. Click "Seed Default Currencies" to get started.</p>
                    ) : (
                        <div style={{ background: '#1e1e1e', padding: 20, borderRadius: 12 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #333' }}>
                                        <th style={{ padding: 10, textAlign: 'left', color: '#aaa' }}>Code</th>
                                        <th style={{ padding: 10, textAlign: 'left', color: '#aaa' }}>Name</th>
                                        <th style={{ padding: 10, textAlign: 'left', color: '#aaa' }}>Symbol</th>
                                        <th style={{ padding: 10, textAlign: 'left', color: '#aaa' }}>Exchange Rate</th>
                                        <th style={{ padding: 10, textAlign: 'left', color: '#aaa' }}>Base</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currencies.map(curr => (
                                        <tr key={curr._id} style={{ borderBottom: '1px solid #333' }}>
                                            <td style={{ padding: 10, fontWeight: 'bold' }}>{curr.code}</td>
                                            <td style={{ padding: 10 }}>{curr.name}</td>
                                            <td style={{ padding: 10 }}>{curr.symbol}</td>
                                            <td style={{ padding: 10 }}>{curr.exchangeRate}</td>
                                            <td style={{ padding: 10 }}>{curr.isBaseCurrency ? '✅' : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Chart of Accounts Tab */}
            {activeTab === 'accounting' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3>Chart of Accounts (Plan Comptable)</h3>
                        <button
                            onClick={handleSeedAccounts}
                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            📑 Seed Standard Plan
                        </button>
                    </div>

                    {Object.keys(chartOfAccounts).length === 0 ? (
                        <p style={{ color: '#666' }}>No accounts configured. Click "Seed Standard Plan" to initialize.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {Object.entries(chartOfAccounts).map(([className, accounts]) => (
                                <div key={className} style={{ background: '#1e1e1e', padding: 20, borderRadius: 12 }}>
                                    <h4 style={{ marginBottom: 15, color: '#3b82f6' }}>{className}</h4>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #333' }}>
                                                <th style={{ padding: 8, textAlign: 'left', color: '#aaa', fontSize: 12 }}>Code</th>
                                                <th style={{ padding: 8, textAlign: 'left', color: '#aaa', fontSize: 12 }}>Name</th>
                                                <th style={{ padding: 8, textAlign: 'left', color: '#aaa', fontSize: 12 }}>Category</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {accounts.map(acc => (
                                                <tr key={acc._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: 8, fontWeight: 'bold', fontFamily: 'monospace' }}>{acc.code}</td>
                                                    <td style={{ padding: 8 }}>{acc.name}</td>
                                                    <td style={{ padding: 8, color: '#aaa', fontSize: 12 }}>{acc.category}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default SettingsView;
