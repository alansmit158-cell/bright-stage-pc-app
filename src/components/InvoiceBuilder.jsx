import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './QuoteBuilder.css';

const InvoiceBuilder = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]); // For importing
    const [loading, setLoading] = useState(true);
    const [taxRule, setTaxRule] = useState('Standard'); // Standard, Reduced, Suspended

    // Form State
    const [formData, setFormData] = useState({
        relatedProject: new URLSearchParams(window.location.search).get('projectId') || '', // [NEW]
        clientId: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        items: [] // { name, description, quantity, unitPrice, total }
    });

    const [financials, setFinancials] = useState({
        totalExclTax: 0,
        totalTax: 0,
        stampDuty: 1.000,
        totalInclTax: 0
    });

    useEffect(() => {
        fetchResources();
    }, []);

    useEffect(() => {
        calculateFinancials();
    }, [formData.items, taxRule]);

    const fetchResources = async () => {
        try {
            const [clientRes, projectRes] = await Promise.all([
                api.get('/clients'),
                api.get('/projects') // To allow importing confirmed projects
            ]);
            setClients(clientRes.data);
            const activeProjects = projectRes.data.filter(p => p.status === 'Confirmed' || p.status === 'Done');
            setProjects(activeProjects);

            // Auto-load if projectId in URL
            const urlPid = new URLSearchParams(window.location.search).get('projectId');
            if (urlPid) {
                const proj = activeProjects.find(p => p._id === urlPid);
                if (proj) handleImportProject(proj._id, activeProjects);
            }

            setLoading(false);
        } catch (err) {
            console.error("Error loading resources:", err);
            alert("Failed to load resources: " + (err.response?.data?.error || err.message));
        }
    };

    const handleClientChange = (e) => {
        setFormData({ ...formData, clientId: e.target.value });
    };

    const handleImportProject = (projectId, freshProjects = null) => {
        const list = freshProjects || projects;
        const project = list.find(p => p._id === projectId);
        if (!project) return;

        // Map project items to invoice items
        const newItems = project.items.map(item => {
            const days = item.days || 1;
            const discount = (item.discount || 0) / 100;
            const unitPrice = item.price * days * (1 - discount);

            return {
                id: Date.now() + Math.random(),
                name: item.name,
                description: `${item.name} (${item.brand || ''} ${item.model || ''}) - ${days} Days`,
                quantity: item.quantity,
                unitPrice: unitPrice,
                total: unitPrice * item.quantity
            };
        });

        setFormData({
            ...formData,
            relatedProject: project._id,
            clientId: project.clientId?._id || project.clientId || '', // Try to match client
            items: newItems
        });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                id: Date.now(),
                name: '',
                description: '',
                quantity: 1,
                unitPrice: 0,
                total: 0
            }]
        });
    };

    const updateItem = (id, field, value) => {
        const updatedItems = formData.items.map(item => {
            if (item.id === id) {
                const updates = { [field]: value };
                // Auto-calc line total if qty or price changes
                if (field === 'quantity' || field === 'unitPrice') {
                    const qty = field === 'quantity' ? parseFloat(value) : item.quantity;
                    const price = field === 'unitPrice' ? parseFloat(value) : item.unitPrice;
                    updates.total = qty * price;
                }
                return { ...item, ...updates };
            }
            return item;
        });
        setFormData({ ...formData, items: updatedItems });
    };

    const removeItem = (id) => {
        setFormData({ ...formData, items: formData.items.filter(i => i.id !== id) });
    };

    const calculateFinancials = () => {
        const totalExclTax = formData.items.reduce((sum, item) => sum + item.total, 0);

        let rate = 0.19;
        if (taxRule === 'Reduced') rate = 0.07;
        if (taxRule === 'Suspended') rate = 0;

        const totalTax = totalExclTax * rate;
        const stampDuty = 1.000;
        const totalInclTax = totalExclTax + totalTax + stampDuty;

        setFinancials({ totalExclTax, totalTax, stampDuty, totalInclTax });
    };

    const handleSave = async (status = 'Draft') => {
        if (!formData.clientId) {
            alert("Please select a client");
            return;
        }

        const selectedClient = clients.find(c => c._id === formData.clientId);

        const payload = {
            client: {
                id: selectedClient._id,
                name: selectedClient.name,
                address: selectedClient.address,
                taxId: selectedClient.taxId,
                contactPerson: selectedClient.contactPerson
            },
            date: formData.date,
            dueDate: formData.dueDate,
            items: formData.items.map(({ id, ...rest }) => rest), // Remove temp IDs
            financials,
            status: status,
            relatedProject: formData.relatedProject // [NEW]
        };

        try {
            await api.post('/invoices', payload);
            alert(`✅ Invoice Created (${status})!`);
            navigate('/invoices');
        } catch (err) {
            alert("Error saving invoice: " + err.message);
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="quote-builder-container">
            <div className="qb-header">
                <h1>💶 Invoice Builder</h1>
            </div>

            <div className="qb-content">
                <div className="step-panel fade-in">

                    {/* Action Bar: Import */}
                    <div className="form-group" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                        <label style={{ color: '#aaa', fontSize: '12px' }}>⚡ Quick Import from Project</label>
                        <select
                            value={formData.relatedProject}
                            onChange={(e) => handleImportProject(e.target.value)}
                            className="qb-input"
                            style={{ marginTop: '5px' }}
                        >
                            <option value="">-- Import from Confirmed Project --</option>
                            {projects.map(p => <option key={p._id} value={p._id}>{p.eventName} ({p.client?.name})</option>)}
                        </select>
                    </div>

                    <div className="row">
                        <div className="col">
                            <label>Client</label>
                            <select value={formData.clientId} onChange={handleClientChange} className="qb-input">
                                <option value="">Select Client...</option>
                                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="col">
                            <label>Invoice Date</label>
                            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="qb-input" />
                        </div>
                        <div className="col">
                            <label>Due Date</label>
                            <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="qb-input" />
                        </div>
                        <div className="col">
                            <label>Tax Mode</label>
                            <select value={taxRule} onChange={e => setTaxRule(e.target.value)} className="qb-input" style={{ borderColor: '#8b5cf6' }}>
                                <option value="Standard">Standard (19%)</option>
                                <option value="Reduced">Reduced (7%)</option>
                                <option value="Suspended">Suspended (0%)</option>
                            </select>
                        </div>
                    </div>

                    <div className="items-table-wrapper" style={{ marginTop: '20px' }}>
                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th>Item / Description</th>
                                    <th>Qty</th>
                                    <th>Unit Price (HT)</th>
                                    <th>Total (HT)</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <input type="text" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Item Name" className="qb-table-input" style={{ marginBottom: '5px' }} />
                                            <input type="text" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Description" className="qb-table-input" style={{ fontSize: '11px', color: '#aaa' }} />
                                        </td>
                                        <td><input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="qb-table-input small" /></td>
                                        <td><input type="number" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', e.target.value)} className="qb-table-input medium" /></td>
                                        <td>{item.total.toFixed(3)}</td>
                                        <td><button onClick={() => removeItem(item.id)} className="qb-btn-icon">×</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="qb-btn outline" onClick={addItem} style={{ marginTop: '10px' }}>+ Add Line Item</button>
                    </div>

                    <div className="financials-bar" style={{ marginTop: '20px' }}>
                        <div className="fin-metric">
                            <span>Total HT</span>
                            <strong>{financials.totalExclTax.toFixed(3)} DT</strong>
                        </div>
                        <div className="fin-metric">
                            <span>VAT ({taxRule === 'Standard' ? '19%' : taxRule === 'Reduced' ? '7%' : '0%'})</span>
                            <strong>{financials.totalTax.toFixed(3)} DT</strong>
                        </div>
                        <div className="fin-metric">
                            <span>Timbre</span>
                            <strong>{financials.stampDuty.toFixed(3)} DT</strong>
                        </div>
                        <div className="fin-metric positive">
                            <span>Total TTC</span>
                            <strong>{financials.totalInclTax.toFixed(3)} DT</strong>
                        </div>
                    </div>

                    <div className="actions-row">
                        <button className="qb-btn secondary" onClick={() => navigate('/invoices')}>Cancel</button>
                        <button className="qb-btn" onClick={() => handleSave('Draft')} style={{ background: '#64748b' }}>💾 Save Draft</button>
                        <button className="qb-btn success" onClick={() => {
                            if (confirm("Validate Invoice? This will perform final posting and it cannot be edited later.")) {
                                handleSave('Validated');
                            }
                        }}>🚀 Validate & Post</button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default InvoiceBuilder;
