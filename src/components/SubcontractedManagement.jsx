import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const SubcontractedManagement = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '', brand: '', model: '', category: '', quantity: 0, costPerDay: 0, provider: '', notes: ''
    });

    const API_URL = `http://${window.location.hostname}:5000/api/subcontracted`;

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_URL);
            setItems(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editItem) {
                await axios.put(`${API_URL}/${editItem._id}`, formData);
            } else {
                await axios.post(API_URL, formData);
            }
            setShowModal(false);
            setEditItem(null);
            loadItems();
        } catch (err) {
            alert('Save failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            loadItems();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleConvertToInventory = async (id) => {
        if (!window.confirm('Transfer this item to internal inventory? It will be removed from subcontracting.')) return;
        try {
            await axios.post(`${API_URL}/${id}/convert`);
            loadItems();
            alert('Moved successfully!');
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            alert('Transfer failed: ' + msg);
        }
    };

    const openEdit = (item) => {
        setEditItem(item);
        setFormData({ ...item });
        setShowModal(true);
    };

    const openCreate = () => {
        setEditItem(null);
        setFormData({ name: '', brand: '', model: '', category: '', quantity: 0, costPerDay: 0, provider: '', notes: '' });
        setShowModal(true);
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ color: 'white', margin: 0 }}>{t('subcontracting')}</h1>
                <button className="btn" onClick={openCreate} style={{ background: '#6366f1' }}>+ {t('add_equip')}</button>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                            <th style={{ padding: '16px' }}>{t('name')}</th>
                            <th style={{ padding: '16px' }}>{t('category')}</th>
                            <th style={{ padding: '16px' }}>{t('qty')}</th>
                            <th style={{ padding: '16px' }}>Cost/Day</th>
                            <th style={{ padding: '16px' }}>Provider</th>
                            <th style={{ padding: '16px' }}>{t('action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No subcontracted items found</td></tr>
                        ) : (
                            items.map(item => (
                                <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: '600' }}>{item.name}</div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.brand} {item.model}</div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc',
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold'
                                        }}>{item.category}</span>
                                    </td>
                                    <td style={{ padding: '16px' }}>{item.quantity}</td>
                                    <td style={{ padding: '16px', color: '#fbbf24', fontWeight: 'bold' }}>{item.costPerDay} TND</td>
                                    <td style={{ padding: '16px' }}>{item.provider || '-'}</td>
                                    <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                                        <button className="btn" style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }} onClick={() => openEdit(item)}>Edit</button>
                                        <button className="btn" style={{ padding: '4px 8px', fontSize: '11px', background: '#10b981', flex: 2 }} onClick={() => handleConvertToInventory(item._id)}>Buy / Stock</button>
                                        <button className="btn" style={{ padding: '4px 8px', fontSize: '11px', background: '#ef4444', flex: 1 }} onClick={() => handleDelete(item._id)}>Del</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                    <div className="glass-panel" style={{ width: '500px', padding: '24px', background: '#1e293b' }}>
                        <h2 style={{ marginTop: 0 }}>{editItem ? 'Edit Item' : 'New Subcontracted Item'}</h2>
                        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label>Name</label>
                                <input required className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label>Brand</label>
                                <input className="input-field" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                            </div>
                            <div>
                                <label>Model</label>
                                <input className="input-field" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                            </div>
                            <div>
                                <label>Category</label>
                                <select required className="input-field" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="">Select Category</option>
                                    <option value="Vidéo">Vidéo</option>
                                    <option value="Sonorisation">Sonorisation</option>
                                    <option value="Lumière">Lumière</option>
                                    <option value="Énergie">Énergie</option>
                                    <option value="Structure">Structure</option>
                                </select>
                            </div>
                            <div>
                                <label>Provider</label>
                                <input className="input-field" value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value })} />
                            </div>
                            <div>
                                <label>Quantity</label>
                                <input type="number" className="input-field" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                            </div>
                            <div>
                                <label>Cost Per Day</label>
                                <input type="number" className="input-field" value={formData.costPerDay} onChange={e => setFormData({ ...formData, costPerDay: e.target.value })} />
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" className="btn" style={{ flex: 1, background: '#6366f1' }}>Save</button>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`
                .input-field {
                    width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: white; margin-top: 5px;
                }
                label { font-size: 12px; color: #94a3b8; }
            `}</style>
        </div>
    );
};

export default SubcontractedManagement;
