import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Logistics.css';
import { useParams, useNavigate } from 'react-router-dom';

import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const AuditDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [audit, setAudit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('all'); // all, discrepancy

    useEffect(() => {
        if (id) fetchAudit();
    }, [id]);

    const fetchAudit = async () => {
        try {
            const res = await axios.get(`${API_URL}/audits/${id}`);
            setAudit(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching audit:", err);
            setLoading(false);
        }
    };

    const handleCountChange = (itemId, newVal) => {
        const val = parseInt(newVal) || 0;
        setAudit(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item._id === itemId) {
                    return {
                        ...item,
                        countedQty: val,
                        discrepancy: val - item.systemQty
                    };
                }
                return item;
            })
        }));
    };

    const handleNoteChange = (itemId, note) => {
        setAudit(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item._id === itemId) {
                    return { ...item, notes: note };
                }
                return item;
            })
        }));
    };

    const saveAudit = async (finalize = false) => {
        setSaving(true);
        try {
            const payload = {
                items: audit.items.map(i => ({
                    _id: i._id,
                    countedQty: i.countedQty,
                    notes: i.notes
                })),
                status: finalize ? 'Finalized' : 'Draft'
            };

            await axios.put(`${API_URL}/audits/${id}`, payload);
            if (finalize) {
                navigate('/audits');
            } else {
                fetchAudit(); // Refresh
                setSaving(false);
            }
        } catch (err) {
            console.error("Error saving audit:", err);
            setSaving(false);
        }
    };

    if (loading) return <div className="logistics-container">Loading...</div>;
    if (!audit) return <div className="logistics-container">Audit not found</div>;

    const isFinalized = audit.status === 'Finalized';

    // Filtering items
    const displayedItems = audit.items.filter(item => {
        if (filter === 'discrepancy') return item.discrepancy !== 0;
        return true;
    });

    const totalDiscrepancy = audit.items.reduce((acc, item) => acc + Math.abs(item.discrepancy), 0);

    return (
        <div className="logistics-container">
            <div className="logistics-header">
                <div>
                    <button className="btn-text" onClick={() => navigate('/audits')} style={{ marginBottom: '1rem' }}>
                        ← Back to Audits
                    </button>
                    <h1 className="logistics-title">{audit.name}</h1>
                    <div className="card-subtitle">
                        {new Date(audit.createdAt).toLocaleDateString()} • {audit.type} •
                        <span className={`status-badge ${isFinalized ? 'status-active' : 'event-draft'}`} style={{ marginLeft: '10px' }}>
                            {audit.status}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Total Discrepancy</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: totalDiscrepancy > 0 ? '#f87171' : '#4ade80' }}>
                            {totalDiscrepancy} units
                        </div>
                    </div>
                    {!isFinalized && (
                        <>
                            <button className="btn-cancel" onClick={() => saveAudit(false)} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button className="btn-save" onClick={() => {
                                if (window.confirm('Are you sure you want to finalize? This cannot be undone.')) {
                                    saveAudit(true);
                                }
                            }} disabled={saving}>
                                Finalize Audit
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="calendar-controls">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`btn-nav ${filter === 'all' ? 'active' : ''}`}
                        style={{ background: filter === 'all' ? '#3b82f6' : '#334155' }}
                        onClick={() => setFilter('all')}
                    >
                        All Items
                    </button>
                    <button
                        className={`btn-nav ${filter === 'discrepancy' ? 'active' : ''}`}
                        style={{ background: filter === 'discrepancy' ? '#3b82f6' : '#334155' }}
                        onClick={() => setFilter('discrepancy')}
                    >
                        Discrepancies Only
                    </button>
                </div>
            </div>

            <div className="calendar-container" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #334155' }}>
                            <th style={{ padding: '1rem' }}>Item Name</th>
                            <th style={{ padding: '1rem' }}>Category</th>
                            <th style={{ padding: '1rem' }}>Location</th>
                            <th style={{ padding: '1rem', width: '100px' }}>System Qty</th>
                            <th style={{ padding: '1rem', width: '120px' }}>Counted Qty</th>
                            <th style={{ padding: '1rem', width: '100px' }}>Diff</th>
                            <th style={{ padding: '1rem' }}>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedItems.map(item => (
                            <tr key={item._id} style={{ borderBottom: '1px solid #1e293b' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '600' }}>{item.inventoryItem?.name || 'Unknown Item'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.inventoryItem?.model}</div>
                                </td>
                                <td style={{ padding: '1rem', color: '#94a3b8' }}>{item.inventoryItem?.category}</td>
                                <td style={{ padding: '1rem', color: '#94a3b8' }}>
                                    Zone {item.inventoryItem?.storageLocation?.zone || '-'}
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.systemQty}</td>
                                <td style={{ padding: '1rem' }}>
                                    {isFinalized ? (
                                        item.countedQty
                                    ) : (
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={item.countedQty}
                                            onChange={(e) => handleCountChange(item._id, e.target.value)}
                                            style={{ width: '80px' }}
                                        />
                                    )}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        color: item.discrepancy === 0 ? '#4ade80' :
                                            item.discrepancy < 0 ? '#f87171' : '#fbbf24',
                                        fontWeight: 'bold'
                                    }}>
                                        {item.discrepancy > 0 ? '+' : ''}{item.discrepancy}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {isFinalized ? (
                                        <span style={{ color: '#94a3b8' }}>{item.notes}</span>
                                    ) : (
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Notes..."
                                            value={item.notes || ''}
                                            onChange={(e) => handleNoteChange(item._id, e.target.value)}
                                        />
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

export default AuditDetailView;
