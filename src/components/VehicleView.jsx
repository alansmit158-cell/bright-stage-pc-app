import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './Logistics.css';
import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const VehicleView = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const canEdit = ['Founder', 'Manager', 'Storekeeper'].includes(user?.role);

    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ plateNumber: '', model: '', type: 'Truck', capacityWeight: '', status: 'Active' });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const res = await axios.get(`${API_URL}/vehicles`);
            setVehicles(res.data);
        } catch (err) {
            console.error("Error fetching vehicles:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        try {
            if (editingId) {
                await axios.put(`${API_URL}/vehicles/${editingId}`, formData);
                showSuccess("Vehicle specifications updated", "Fleet Management");
            } else {
                await axios.post(`${API_URL}/vehicles`, formData);
                showSuccess("New vehicle commissioned to fleet", "Success");
            }
            setShowModal(false);
            setFormData({ plateNumber: '', model: '', type: 'Truck', capacityWeight: '', status: 'Active' });
            setEditingId(null);
            fetchVehicles();
        } catch (err) {
            showError("Failed to save vehicle data", "Error");
        }
    };

    const handleEdit = (vehicle) => {
        setFormData(vehicle);
        setEditingId(vehicle._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Commence decommissioning of this vehicle? This action is permanent.")) return;
        try {
            await axios.delete(`${API_URL}/vehicles/${id}`);
            showSuccess("Vehicle removed from fleet", "Logistics");
            fetchVehicles();
        } catch (err) {
            showError("Operation failed", "Error");
        }
    };

    const getTypeIcon = (type) => {
        switch(type) {
            case 'Truck': return '🚛';
            case 'Van': return '🚐';
            case 'Car': return '🚗';
            default: return '📦';
        }
    };

    return (
        <div style={{ padding: '40px 60px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: '#fff', letterSpacing: '-1px' }}>
                        Asset Fleet Control
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Maintenance monitoring and logistics capacity tracking</p>
                </div>
                {canEdit && (
                    <button onClick={() => { setShowModal(true); setEditingId(null); setFormData({ plateNumber: '', model: '', type: 'Truck', capacityWeight: '', status: 'Active' }); }} className="premium-btn-fleet">
                        + Commission Vehicle
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#8b5cf6', padding: '100px' }}>Analyzing Fleet Assets...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                    {vehicles.map(v => (
                        <div key={v._id} className="vehicle-premium-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="vehicle-type-badge">{getTypeIcon(v.type)}</div>
                                <span className={`fleet-status-chip ${v.status.toLowerCase()}`}>{v.status}</span>
                            </div>
                            
                            <h3 style={{ margin: '15px 0 5px 0', fontSize: '20px', fontWeight: '800', color: '#fff' }}>{v.plateNumber}</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#8b5cf6', fontWeight: '700' }}>{v.model}</p>

                            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="vehicle-stat-item">
                                    <span className="stat-label">Payload</span>
                                    <span className="stat-value">{v.capacityWeight} KG</span>
                                </div>
                                <div className="vehicle-stat-item">
                                    <span className="stat-label">Chassis</span>
                                    <span className="stat-value">{v.type}</span>
                                </div>
                            </div>

                            {canEdit && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '25px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <button onClick={() => handleEdit(v)} className="fleet-action-btn edit">Update Specs</button>
                                    <button onClick={() => handleDelete(v._id)} className="fleet-action-btn delete">&times;</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay-blur">
                    <div className="premium-modal-card" style={{ width: '550px' }}>
                        <div className="modal-header-vibrant" style={{ background: 'linear-gradient(to right, rgba(139,92,246,0.05), transparent)' }}>
                            <div>
                                <h2 style={{ margin: 0 }}>{editingId ? 'Modify Specifications' : 'Commission New Asset'}</h2>
                                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Update fleet record and operational status</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="close-x-btn">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="premium-form-grid">
                                <div>
                                    <label className="premium-label">Registration Plate</label>
                                    <input type="text" required className="premium-field-input" placeholder="e.g. 123 TUNIS 456" value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value })} />
                                </div>
                                <div>
                                    <label className="premium-label">Engine / Model Details</label>
                                    <input type="text" className="premium-field-input" placeholder="e.g. Mercedes Sprinter 2023" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label className="premium-label">Platform Type</label>
                                        <select className="premium-field-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                            <option value="Truck">Heavy Truck</option>
                                            <option value="Van">Cargo Van</option>
                                            <option value="Car">Support Car</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="premium-label">Max Payload (KG)</label>
                                        <input type="number" className="premium-field-input" value={formData.capacityWeight} onChange={e => setFormData({ ...formData, capacityWeight: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="premium-label">Operational Status</label>
                                    <select className="premium-field-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Active">Operational</option>
                                        <option value="Maintenance">Under Maintenance</option>
                                        <option value="Inactive">Decommissioned</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer-actions">
                                <button type="button" onClick={() => setShowModal(false)} className="premium-cancel-btn">Abort</button>
                                <button type="submit" className="premium-save-btn" style={{ background: '#8b5cf6' }}>Apply Specs</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .premium-btn-fleet { padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; border-radius: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.2); }
                .vehicle-premium-card { background: #1a1b26; padding: 25px; border-radius: 24px; border: 1px solid var(--border-subtle); transition: 0.3s; }
                .vehicle-premium-card:hover { transform: translateY(-5px); border-color: #8b5cf6; }
                .vehicle-type-badge { width: 45px; height: 45px; background: rgba(139, 92, 246, 0.1); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
                .fleet-status-chip { font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 100px; text-transform: uppercase; }
                .fleet-status-chip.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .fleet-status-chip.maintenance { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .fleet-status-chip.inactive { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .vehicle-stat-item { background: rgba(0,0,0,0.2); padding: 12px; border-radius: 14px; display: flex; flex-direction: column; }
                .stat-label { font-size: 10px; color: #475569; text-transform: uppercase; font-weight: 700; }
                .stat-value { font-weight: 700; color: #fff; font-size: 14px; }
                .fleet-action-btn { flex: 1; padding: 10px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 12px; transition: 0.2s; }
                .fleet-action-btn.edit { background: rgba(255,255,255,0.05); color: #fff; }
                .fleet-action-btn.edit:hover { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
                .fleet-action-btn.delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; max-width: 40px; font-size: 16px; }
            `}</style>
        </div>
    );
};

export default VehicleView;
