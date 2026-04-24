import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { CONFIG } from '../config';
import { 
    Package, 
    Layers, 
    ExternalLink, 
    Hash, 
    DollarSign, 
    Save, 
    X, 
    Plus, 
    AlertCircle, 
    ShoppingCart,
    Trash2,
    Briefcase
} from 'lucide-react';

const SubcontractedManagement = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '', brand: '', model: '', category: '', quantity: 0, costPerDay: 0, provider: '', notes: ''
    });

    const API_URL = `${CONFIG.API_URL}/subcontracted`;

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
            showError("Failed to synchronize subcontracting data", "Network Error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editItem) {
                await axios.put(`${API_URL}/${editItem._id}`, formData);
                showSuccess("Subcontracted resource updated", "Success");
            } else {
                await axios.post(API_URL, formData);
                showSuccess("External resource registered", "Success");
            }
            setShowModal(false);
            setEditItem(null);
            loadItems();
        } catch (err) {
            showError("Transaction failed: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this subcontracted asset?')) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            showSuccess("Resource removed from database", "Logistics");
            loadItems();
        } catch (err) {
            showError("Deletetion failed");
        }
    };

    const handleConvertToInventory = async (id) => {
        if (!window.confirm('Transfer this item to internal inventory? It will be removed from subcontracting.')) return;
        try {
            await axios.post(`${API_URL}/${id}/convert`);
            showSuccess("Resource integrated into internal inventory", "Fleet Expansion");
            loadItems();
        } catch (err) {
            showError("Transfer failed: " + (err.response?.data?.message || err.message));
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
        <div style={{ padding: '40px 60px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: '#fff', letterSpacing: '-1px' }}>
                        Subcontracting Ops
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>External resource management & third-party logistics</p>
                </div>
                <button onClick={openCreate} className="premium-btn-subcontract">
                    <Plus size={18} /> {t('add_equip')}
                </button>
            </div>

            <div className="dispatch-table-container">
                <table className="premium-logistics-table">
                    <thead>
                        <tr>
                            <th>Resource Matrix</th>
                            <th>Taxonomy</th>
                            <th>Volume</th>
                            <th>Daily Rate</th>
                            <th>Provider Registry</th>
                            <th style={{ textAlign: 'right' }}>Management</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '100px', textAlign: 'center', color: '#6366f1' }}>Syncing external datastream...</td></tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '100px', textAlign: 'center' }}>
                                    <div style={{ color: '#1e293b', marginBottom: '15px' }}><Package size={48} /></div>
                                    <p style={{ color: '#475569', margin: 0, fontWeight: '700' }}>No subcontracted items found matching your current filters</p>
                                </td>
                            </tr>
                        ) : (
                            items.map(item => (
                                <tr key={item._id}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div className="agent-avatar"><Layers size={14} /></div>
                                            <div>
                                                <div style={{ fontWeight: '800', color: '#fff' }}>{item.name}</div>
                                                <div style={{ fontSize: '11px', color: '#475569' }}>{item.brand} • {item.model}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span className="status-pill validated">{item.category}</span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ color: '#fff', fontWeight: '700' }}>{item.quantity} units</div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ color: '#fbbf24', fontWeight: '800', fontSize: '13px' }}>{item.costPerDay} <span style={{ fontSize: '10px' }}>TND/Day</span></div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px' }}>
                                            <Briefcase size={12} /> {item.provider || '-'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button className="row-action-btn edit" title="Move to Stock" onClick={() => handleConvertToInventory(item._id)} style={{ color: '#10b981' }}><ShoppingCart size={16} /></button>
                                            <button className="row-action-btn edit" title="Edit Metadata" onClick={() => openEdit(item)}><Plus size={16} style={{ transform: 'rotate(45deg)' }} /></button>
                                            <button className="row-action-btn delete" title="Decommission" onClick={() => handleDelete(item._id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay-blur">
                    <div className="premium-modal-card" style={{ maxWidth: '750px' }}>
                        <div className="modal-header-vibrant">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#6366f1' }}>
                                    {editItem ? <Plus size={24} style={{ transform: 'rotate(45deg)' }} /> : <Plus size={24} />}
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '20px' }}>
                                        {editItem ? 'Configure External Asset' : 'Register Subcontracted Item'}
                                    </h2>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Third-party resource profiling & cost tracking</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="close-x-btn">&times;</button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="premium-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="premium-label">Designation / Resource Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <Package style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={16} />
                                        <input 
                                            required 
                                            className="premium-field-input" 
                                            style={{ paddingLeft: '45px' }}
                                            placeholder="Ex: Écran LED P3.9"
                                            value={formData.name} 
                                            onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="premium-label">Brand / Manufacturer</label>
                                    <input className="premium-field-input" placeholder="Brand" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                                </div>
                                <div>
                                    <label className="premium-label">Model Signature</label>
                                    <input className="premium-field-input" placeholder="Model" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                                </div>

                                <div>
                                    <label className="premium-label">Cluster Category</label>
                                    <select required className="premium-field-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        <option value="">-- Choose Segment --</option>
                                        <option value="Vidéo">Vidéo</option>
                                        <option value="Sonorisation">Sonorisation</option>
                                        <option value="Lumière">Lumière</option>
                                        <option value="Énergie">Énergie</option>
                                        <option value="Structure">Structure</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="premium-label">Logistics Provider</label>
                                    <div style={{ position: 'relative' }}>
                                        <ExternalLink style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={14} />
                                        <input className="premium-field-input" style={{ paddingLeft: '45px' }} placeholder="Supplier Name" value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="premium-label">Current Volume</label>
                                    <div style={{ position: 'relative' }}>
                                        <Hash style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={14} />
                                        <input type="number" className="premium-field-input" style={{ paddingLeft: '45px' }} placeholder="0" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="premium-label">Daily Retention Cost (TND)</label>
                                    <div style={{ position: 'relative' }}>
                                        <DollarSign style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={14} />
                                        <input type="number" className="premium-field-input" style={{ paddingLeft: '45px', color: '#fbbf24' }} placeholder="0.00" value={formData.costPerDay} onChange={e => setFormData({ ...formData, costPerDay: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="premium-label">Operational Notes</label>
                                    <textarea className="premium-field-input" rows="2" style={{ resize: 'none' }} placeholder="..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                                </div>
                            </div>

                            <div className="modal-footer-actions" style={{ marginTop: '10px' }}>
                                <button type="button" className="premium-cancel-btn" onClick={() => setShowModal(false)}>Abort Change</button>
                                <button type="submit" className="premium-save-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Save size={18} /> {editItem ? 'Update Registry' : 'Confirm Registration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .premium-btn-subcontract { 
                    background: linear-gradient(135deg, #6366f1, #4f46e5); 
                    color: white; border: none; padding: 12px 24px; 
                    border-radius: 14px; font-weight: 800; cursor: pointer; 
                    display: flex; align-items: center; gap: 10px; 
                    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2); 
                    transition: 0.3s;
                }
                .premium-btn-subcontract:hover { transform: translateY(-2px); filter: brightness(1.1); }
            `}</style>
        </div>
    );
};

export default SubcontractedManagement;
