import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './Logistics.css';
import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const CarrierView = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const canEdit = ['Founder', 'Manager', 'Storekeeper'].includes(user?.role);

    const [carriers, setCarriers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', cin: '', phone: '',
        vehiclePlate: '', vehicleModel: '', status: 'Active'
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchCarriers();
    }, []);

    const fetchCarriers = async () => {
        try {
            const res = await axios.get(`${API_URL}/carriers`);
            setCarriers(res.data);
        } catch (err) {
            console.error("Error fetching carriers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        try {
            if (editingId) {
                await axios.put(`${API_URL}/carriers/${editingId}`, formData);
                showSuccess("Carrier profile updated", "Logistics");
            } else {
                await axios.post(`${API_URL}/carriers`, formData);
                showSuccess("External carrier registered", "Success");
            }
            setShowModal(false);
            resetForm();
            fetchCarriers();
        } catch (err) {
            showError("Failed to save carrier information", "Error");
        }
    };

    const resetForm = () => {
        setFormData({ firstName: '', lastName: '', cin: '', phone: '', vehiclePlate: '', vehicleModel: '', status: 'Active' });
        setEditingId(null);
    };

    const handleEdit = (carrier) => {
        setFormData(carrier);
        setEditingId(carrier._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this carrier permanently?")) return;
        try {
            await axios.delete(`${API_URL}/carriers/${id}`);
            showSuccess("Carrier removed", "Logistics");
            fetchCarriers();
        } catch (err) {
            showError("Deletion failed", "Error");
        }
    };

    return (
        <div style={{ padding: '40px 60px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: '#fff', letterSpacing: '-1px' }}>
                        Carrier Partners
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Managing external transport providers and independent drivers</p>
                </div>
                {canEdit && (
                    <button onClick={() => { setShowModal(true); resetForm(); }} className="premium-btn-primary">
                        + Register Partner
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#3b82f6', padding: '100px' }}>Syncing Logistic Partners...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '25px' }}>
                    {carriers.map(c => (
                        <div key={c._id} className="carrier-premium-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div className="carrier-avatar-box">ID</div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '17px', color: '#fff' }}>{c.firstName} {c.lastName}</h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>{c.vehicleModel || 'External Fleet'}</p>
                                    </div>
                                </div>
                                <span className={`status-chip-v2 ${c.status === 'Active' ? 'active' : 'inactive'}`}>{c.status}</span>
                            </div>

                            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <span style={{ fontSize: '10px', color: '#475569', display: 'block', textTransform: 'uppercase' }}>Phone</span>
                                    <span style={{ fontSize: '13px', color: '#fff' }}>{c.phone || '-'}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: '10px', color: '#475569', display: 'block', textTransform: 'uppercase' }}>Plate Number</span>
                                    <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '700' }}>{c.vehiclePlate}</span>
                                </div>
                            </div>

                            {canEdit && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                    <button onClick={() => handleEdit(c)} className="card-action-btn edit">Update profile</button>
                                    <button onClick={() => handleDelete(c._id)} className="card-action-btn delete">&times;</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay-blur">
                    <div className="premium-modal-card" style={{ width: '700px' }}>
                        <div className="modal-header-vibrant">
                            <div>
                                <h2 style={{ margin: 0 }}>{editingId ? 'Edit Carrier Profile' : 'Onboard New Partner'}</h2>
                                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>External logistics operator details</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="close-x-btn">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="premium-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div>
                                    <label className="premium-label">First Name</label>
                                    <input type="text" required className="premium-field-input" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="premium-label">Last Name</label>
                                    <input type="text" required className="premium-field-input" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="premium-label">CIN / ID Number</label>
                                    <input type="text" required className="premium-field-input" value={formData.cin} onChange={e => setFormData({ ...formData, cin: e.target.value })} />
                                </div>
                                <div>
                                    <label className="premium-label">Phone Contact</label>
                                    <input type="text" className="premium-field-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="premium-label">Vehicle Plate</label>
                                    <input type="text" required className="premium-field-input" value={formData.vehiclePlate} onChange={e => setFormData({ ...formData, vehiclePlate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="premium-label">Vehicle Model</label>
                                    <input type="text" className="premium-field-input" value={formData.vehicleModel} onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="premium-label">Partner Status</label>
                                    <select className="premium-field-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Active">Active / On-duty</option>
                                        <option value="Inactive">Paused / Archived</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer-actions">
                                <button type="button" onClick={() => setShowModal(false)} className="premium-cancel-btn">Discard</button>
                                <button type="submit" className="premium-save-btn">Register Carrier</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .premium-btn-primary { padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; border-radius: 15px; font-weight: 700; cursor: pointer; }
                .carrier-premium-card { background: #1a1b26; padding: 25px; border-radius: 24px; border: 1px solid var(--border-subtle); transition: 0.3s; }
                .carrier-premium-card:hover { transform: translateY(-5px); border-color: #3b82f6; }
                .carrier-avatar-box { width: 45px; height: 45px; background: rgba(59, 130, 246, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #3b82f6; font-size: 12px; }
                .status-chip-v2 { font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 100px; text-transform: uppercase; }
                .status-chip-v2.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .status-chip-v2.inactive { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .card-action-btn { flex: 1; padding: 10px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 12px; }
                .card-action-btn.edit { background: rgba(255,255,255,0.05); color: #fff; }
                .card-action-btn.delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; max-width: 40px; font-size: 16px; }
            `}</style>
        </div>
    );
};

export default CarrierView;
