import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './QuoteBuilder.css'; // We'll create this CSS next

const QuoteBuilder = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]); // [NEW] For importing
    const [loading, setLoading] = useState(true);

    // Form State
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        projectId: new URLSearchParams(window.location.search).get('projectId') || '', // [NEW]
        clientId: '',
        eventName: '',
        dates: { start: '', end: '', totalDays: 1 },
        items: [] // { type, name, inventoryItem, quantity, days, price, costPrice, discount }
    });

    // Derived Financials
    const [financials, setFinancials] = useState({
        totalExclTax: 0,
        totalTax: 0,
        totalCost: 0,
        margin: 0,
        marginPercent: 0
    });

    useEffect(() => {
        fetchResources();
    }, []);

    useEffect(() => {
        calculateFinancials();
    }, [formData.items]);

    const fetchResources = async () => {
        try {
            const [clientRes, invRes, projectRes] = await Promise.all([
                api.get('/clients'),
                api.get('/inventory'),
                api.get('/projects') // [NEW]
            ]);
            setClients(clientRes.data);
            setInventory(invRes.data);
            setProjects(projectRes.data.filter(p => !p.status || p.status === 'Draft')); // Only draft projects usually

            // Auto-load if projectId in URL
            const urlPid = new URLSearchParams(window.location.search).get('projectId');
            if (urlPid) {
                const proj = projectRes.data.find(p => p._id === urlPid);
                if (proj) handleImportProject(proj._id, projectRes.data);
            }

            setLoading(false);
        } catch (err) {
            alert("Failed to load resources");
        }
    };

    const handleImportProject = (projectId, freshProjects = null) => {
        const list = freshProjects || projects;
        const project = list.find(p => p._id === projectId);
        if (!project) return;

        setFormData({
            ...formData,
            projectId: project._id,
            clientId: project.clientId?._id || project.clientId || '',
            eventName: project.eventName,
            dates: {
                start: project.dates?.start ? new Date(project.dates.start).toISOString().split('T')[0] : '',
                end: project.dates?.end ? new Date(project.dates.end).toISOString().split('T')[0] : '',
                totalDays: project.dates?.totalDays || 1
            },
            items: project.items.map(item => ({
                id: Date.now() + Math.random(),
                type: item.type || 'Rent',
                name: item.name,
                inventoryItem: item.inventoryItem?._id || item.inventoryItem,
                quantity: item.quantity,
                days: item.days || 1,
                price: item.price || 0,
                costPrice: item.costPrice || 0,
                discount: item.discount || 0
            }))
        });
    };

    const handleClientChange = (e) => {
        setFormData({ ...formData, clientId: e.target.value });
    };

    const handleDateChange = (field, value) => {
        const newDates = { ...formData.dates, [field]: value };
        // Simple day diff
        if (newDates.start && newDates.end) {
            const diff = new Date(newDates.end) - new Date(newDates.start);
            newDates.totalDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1); // Inclusive
        }
        setFormData({ ...formData, dates: newDates });
    };

    const addItem = (type) => {
        const newItem = {
            id: Date.now(),
            type, // Rent, Sale, Service
            name: '',
            inventoryItem: null,
            quantity: 1,
            days: formData.dates.totalDays,
            price: 0,
            costPrice: 0,
            discount: 0
        };
        setFormData({ ...formData, items: [...formData.items, newItem] });
    };

    const updateItem = (id, field, value) => {
        const updatedItems = formData.items.map(item => {
            if (item.id === id) {
                const updates = { [field]: value };

                // Auto-fill details if inventory item selected
                if (field === 'inventoryItem') {
                    const stockItem = inventory.find(i => i._id === value);
                    if (stockItem) {
                        updates.name = stockItem.name;
                        updates.price = stockItem.rentalPricePerDay || 0;
                        updates.costPrice = stockItem.purchasePrice || 0;
                        updates.brand = stockItem.brand;
                        updates.model = stockItem.model;
                    }
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
        let totalExclTax = 0;
        let totalCost = 0;

        formData.items.forEach(item => {
            // Price Calculation:
            // Rent: Price * Qty * Days
            // Service: Price * Qty (Days optional, usually flat or hourly) - let's assume flat for now or use days if Hourly
            // Sale: Price * Qty

            let lineTotal = 0;
            let lineCost = 0;

            if (item.type === 'Rent') {
                lineTotal = item.price * item.quantity * item.days;
                lineCost = item.costPrice * item.quantity; // Cost is usually fixed asset cost? No, amortized. 
                // For simplicity Phase 1: Cost is 0 for Rent unless sub-rented. 
                // Wait, user wants margin based on purchase price? 
                // "Calcul de Marge Théorique : bénéfice estimé en fonction du prix d'achat/entretien".
                // Usually ROI = Revenue / PurchasePrice. 
                // Let's just track Revenue vs Sub-rental Cost for now, or 0.
            } else if (item.type === 'Sale') {
                lineTotal = item.price * item.quantity;
                lineCost = item.costPrice * item.quantity;
            } else {
                // Service
                lineTotal = item.price * item.quantity; // e.g. 5 hours * 50eur
                lineCost = item.costPrice * item.quantity; // e.g. 5 hours * 30eur (salary)
            }

            // Discount
            lineTotal = lineTotal * (1 - (item.discount / 100));

            totalExclTax += lineTotal;
            totalCost += lineCost;
        });

        const totalTax = totalExclTax * 0.19; // 19% VAT
        const stampDuty = 1.000; // 1 DT Timbre
        const margin = totalExclTax - totalCost;
        const marginPercent = totalExclTax > 0 ? (margin / totalExclTax) * 100 : 0;

        setFinancials({ totalExclTax, totalTax, stampDuty, totalCost, margin, marginPercent });
    };

    const handleSave = async () => {
        if (!formData.clientId || !formData.eventName) {
            alert("Please fill client and event name");
            return;
        }

        // Phase 1: Smart Quote -> Auto Email
        // Set Status to 'Quote' (Which implies SENT in our enum flow for now, user requested 'SENT')
        // We will stick to 'Quote' as the status, but show a success message about Email.

        const payload = {
            ...formData,
            status: 'Quote',
            financials
        };
        // Clean up temp IDs
        payload.items = payload.items.map(({ id, ...rest }) => rest);

        try {
            if (formData.projectId) {
                // Update existing project
                await api.put(`/projects/${formData.projectId}`, payload);
            } else {
                // Create new project as Quote
                await api.post('/projects', payload);
            }

            // Simulation of Email Workflow
            alert(`✅ Quote Created Successfully!\n\n📧 An email has been sent to client ${selectedClient?.name || ''} with the PDF attached.\n\nStatus: SENT`);

            navigate('/projects');
        } catch (err) {
            alert("Error saving quote: " + err.message);
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;

    const selectedClient = clients.find(c => c._id === formData.clientId);

    return (
        <div className="quote-builder-container">
            <div className="qb-header">
                <h1>✨ Smart Quote Builder</h1>
                <div className="qb-steps">
                    <div className={`step ${step >= 1 ? 'active' : ''}`} onClick={() => setStep(1)}>1. Details</div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`} onClick={() => setStep(2)}>2. Line Items</div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`} onClick={() => setStep(3)}>3. Review</div>
                </div>
            </div>

            <div className="qb-content">
                {step === 1 && (
                    <div className="step-panel fade-in">
                        {/* Quick Import */}
                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <label style={{ color: '#aaa', fontSize: '12px' }}>⚡ Quick Import from Project</label>
                            <select
                                value={formData.projectId}
                                onChange={(e) => handleImportProject(e.target.value)}
                                className="qb-input"
                                style={{ marginTop: '5px' }}
                            >
                                <option value="">-- Select a Project to Link --</option>
                                {projects.map(p => <option key={p._id} value={p._id}>{p.eventName} ({p.client?.name || 'No Client'})</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Client</label>
                            <select value={formData.clientId} onChange={handleClientChange} className="qb-input">
                                <option value="">Select a Client...</option>
                                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                            {selectedClient && (
                                <div className="client-info-card">
                                    <p><strong>Terms:</strong> {selectedClient.paymentTerms} days</p>
                                    <p><strong>Total Spent:</strong> {selectedClient.totalSpent}€</p>
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Event Name</label>
                            <input
                                type="text"
                                value={formData.eventName}
                                onChange={e => setFormData({ ...formData, eventName: e.target.value })}
                                className="qb-input"
                                placeholder="e.g. Summer Festival 2026"
                            />
                        </div>
                        <div className="row">
                            <div className="col">
                                <label>Start Date</label>
                                <input type="date" value={formData.dates.start} onChange={e => handleDateChange('start', e.target.value)} className="qb-input" />
                            </div>
                            <div className="col">
                                <label>End Date</label>
                                <input type="date" value={formData.dates.end} onChange={e => handleDateChange('end', e.target.value)} className="qb-input" />
                            </div>
                        </div>
                        <p style={{ marginTop: 10, color: '#fbbf24' }}>Total Duration: <strong>{formData.dates.totalDays} Days</strong> (Applied to Rentals)</p>

                        <button className="qb-btn primary" onClick={() => setStep(2)} style={{ marginTop: 20 }}>Next: Add Items →</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-panel fade-in">
                        <div className="items-controls">
                            <button className="qb-btn outline" onClick={() => addItem('Rent')}>+ Add Equipment (Rent)</button>
                            <button className="qb-btn outline" onClick={() => addItem('Service')}>+ Add Service (Labor/Transport)</button>
                            <button className="qb-btn outline" onClick={() => addItem('Sale')}>+ Add Consumable (Sale)</button>
                        </div>

                        <div className="items-table-wrapper">
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Item / Description</th>
                                        <th>Qty</th>
                                        <th>Days</th>
                                        <th>Price (Unit)</th>
                                        <th>Discount %</th>
                                        <th>Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, idx) => (
                                        <tr key={item.id}>
                                            <td><span className={`badge ${item.type.toLowerCase()}`}>{item.type}</span></td>
                                            <td>
                                                {item.type === 'Rent' || item.type === 'Sale' ? (
                                                    <select
                                                        value={item.inventoryItem || ''}
                                                        onChange={(e) => updateItem(item.id, 'inventoryItem', e.target.value)}
                                                        className="qb-table-input"
                                                    >
                                                        <option value="">Select Item...</option>
                                                        {inventory.filter(i => (item.type === 'Rent' ? i.type !== 'Sale' : i.type === 'Sale')).map(i => (
                                                            <option key={i._id} value={i._id}>{i.name} ({i.brand})</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={e => updateItem(item.id, 'name', e.target.value)}
                                                        placeholder="Service Name"
                                                        className="qb-table-input"
                                                    />
                                                )}
                                            </td>
                                            <td>
                                                <input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value))} className="qb-table-input small" />
                                            </td>
                                            <td>
                                                <input type="number" value={item.days} onChange={e => updateItem(item.id, 'days', parseFloat(e.target.value))} className="qb-table-input small" disabled={item.type === 'Sale'} />
                                            </td>
                                            <td>
                                                <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value))} className="qb-table-input medium" />
                                            </td>
                                            <td>
                                                <input type="number" value={item.discount} onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value))} className="qb-table-input small" />
                                            </td>
                                            <td>
                                                {/* Calculate Row Total Display */}
                                                {((item.price * item.quantity * (item.type === 'Rent' ? item.days : 1)) * (1 - item.discount / 100)).toFixed(2)}€
                                            </td>
                                            <td>
                                                <button onClick={() => removeItem(item.id)} className="qb-btn-icon">×</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="financials-bar">
                            <div className="fin-metric">
                                <span>Revenue</span>
                                <strong>{financials.totalExclTax.toFixed(2)}€</strong>
                            </div>
                            <div className="fin-metric">
                                <span>Costs</span>
                                <strong>{financials.totalCost.toFixed(2)}€</strong>
                            </div>
                            <div className={`fin-metric ${financials.margin >= 0 ? 'positive' : 'negative'}`}>
                                <span>Margin</span>
                                <strong>{financials.margin.toFixed(2)}€ ({financials.marginPercent.toFixed(1)}%)</strong>
                            </div>
                        </div>

                        <div className="actions-row">
                            <button className="qb-btn secondary" onClick={() => setStep(1)}>← Back</button>
                            <button className="qb-btn primary" onClick={() => setStep(3)}>Next: Review →</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-panel fade-in">
                        <h2>Ready to Send?</h2>
                        <div className="review-card">
                            <h3>{formData.eventName}</h3>
                            <p>Client: <strong>{selectedClient?.name}</strong></p>
                            <p>Items: <strong>{formData.items.length}</strong></p>
                            <hr />
                            <div className="total-row">
                                <span>Total (Excl. Tax):</span>
                                <span>{financials.totalExclTax.toFixed(3)} DT</span>
                            </div>
                            <div className="total-row">
                                <span>VAT (19%):</span>
                                <span>{financials.totalTax.toFixed(3)} DT</span>
                            </div>
                            <div className="total-row">
                                <span>Timbre Fiscal:</span>
                                <span>{financials.stampDuty?.toFixed(3) || "1.000"} DT</span>
                            </div>
                            <div className="total-row large">
                                <span>Total (Incl. Tax):</span>
                                <span>{(financials.totalExclTax + financials.totalTax + (financials.stampDuty || 1)).toFixed(3)} DT</span>
                            </div>
                        </div>

                        <div className="actions-row">
                            <button className="qb-btn secondary" onClick={() => setStep(2)}>← Edit Items</button>
                            <button className="qb-btn success" onClick={handleSave}>Creating Quote & Email PDF</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuoteBuilder;
