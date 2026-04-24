import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './Logistics.css'; 
import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const DriverView = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const canEdit = ['Founder', 'Manager', 'Storekeeper'].includes(user?.role);

    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', licenseNumber: '', phone: '', status: 'Active' });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            const res = await axios.get(`${API_URL}/drivers`);
            setDrivers(res.data);
        } catch (err) {
            console.error("Error fetching drivers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        try {
            if (editingId) {
                await axios.put(`${API_URL}/drivers/${editingId}`, formData);
                showSuccess("Driver record updated", "Logistics");
            } else {
                await axios.post(`${API_URL}/drivers`, formData);
                showSuccess("New driver added to fleet", "Success");
            }
            setShowModal(false);
            setFormData({ name: '', licenseNumber: '', phone: '', status: 'Active' });
            setEditingId(null);
            fetchDrivers();
        } catch (err) {
            showError("System error saving driver", "Error");
        }
    };

    const handleEdit = (driver) => {
        setFormData(driver);
        setEditingId(driver._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this driver from the database?")) return;
        try {
            await axios.delete(`${API_URL}/drivers/${id}`);
            showSuccess("Driver removed", "Logistics");
            fetchDrivers();
        } catch (err) {
            showError("Could not delete driver", "Error");
        }
    };

    return (
        <div style={{ padding: '40px 60px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: '#fff', letterSpacing: '-1px' }}>
                        Fleet Drivers
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Managing logistics personnel and authorization</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', licenseNumber: '', phone: '', status: 'Active' }); }}
                        style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}
                    >
                        + Register New Driver
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#10b981', padding: '100px' }}>Accessing Fleet Data...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                    {drivers.map(driver => (
                        <div key={driver._id} className="driver-premium-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ width: '50px', height: '50px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    {driver.name.charAt(0)}
                                </div>
                                <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', background: driver.status === 'Active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: driver.status === 'Active' ? '#22c55e' : '#ef4444' }}>
                                    {driver.status.toUpperCase()}
                                </span>
                            </div>
                            
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '700', color: '#fff' }}>{driver.name}</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Fleet Specialist</p>

                            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>License</span>
                                    <span style={{ color: '#10b981', fontWeight: '700' }}>{driver.licenseNumber}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Phone</span>
                                    <span style={{ color: '#fff' }}>{driver.phone || '-'}</span>
                                </div>
                            </div>

                            {canEdit && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '25px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <button onClick={() => handleEdit(driver)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Edit</button>
                                    <button onClick={() => handleDelete(driver._id)} style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.05)', border: 'none', borderRadius: '10px', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>&times;</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Redesigned Modal */}
            {showModal && (
                <div className="modal-overlay-blur">
                    <div className="premium-modal-card" style={{ width: '550px' }}>
                        <div className="modal-header-vibrant" style={{ background: 'linear-gradient(to right, rgba(16,185,129,0.05), transparent)' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '20px' }}>{editingId ? 'Modify Driver Record' : 'Register Force Driver'}</h2>
                                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Full registry and licensing status</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="close-x-btn">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '30px 40px' }}>
                            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label className="premium-label">Full Operator Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="premium-field-input"
                                        placeholder="Enter driver name..."
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label className="premium-label">License Key / ID</label>
                                        <input
                                            type="text"
                                            required
                                            className="premium-field-input"
                                            placeholder="N° License"
                                            value={formData.licenseNumber}
                                            onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="premium-label">Fleet Status</label>
                                        <select
                                            className="premium-field-input"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="Active">Operational</option>
                                            <option value="Inactive">On Leave / Restricted</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="premium-label">Emergency / Primary Contact</label>
                                    <input
                                        type="text"
                                        className="premium-field-input"
                                        placeholder="+216 -- --- ---"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer-actions" style={{ marginTop: '40px', padding: 0 }}>
                                <button type="button" onClick={() => setShowModal(false)} className="premium-cancel-btn">Discard</button>
                                <button type="submit" className="premium-save-btn" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                    {editingId ? 'Sync Updates' : 'Authorize Driver'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .driver-premium-card { background: #1a1b26; padding: 25px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s; }
                .driver-premium-card:hover { transform: translateY(-5px); border-color: #10b981; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }

                /* Reuse Global Premium Styles */
                .modal-overlay-blur { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; justify-content: center; alignItems: center; z-index: 2000; padding: 20px; }
                .premium-modal-card { background: #1a1b26; border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 100px rgba(0,0,0,0.6); position: relative; overflow: hidden; }
                .modal-header-vibrant { padding: 30px 40px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
                .close-x-btn { background: none; border: none; color: #475569; font-size: 28px; cursor: pointer; }
                .premium-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: block; }
                .premium-field-input { width: 100%; padding: 12px 18px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; color: white; outline: none; transition: 0.2s; box-sizing: border-box; }
                .premium-field-input:focus { border-color: #10b981; background: rgba(16,185,129,0.05); }
                .premium-save-btn { background: #10b981; color: white; border: none; padding: 12px 25px; border-radius: 14px; font-weight: 700; cursor: pointer; }
                .premium-cancel-btn { background: rgba(255,255,255,0.05); color: #94a3b8; border: none; padding: 12px 25px; border-radius: 14px; cursor: pointer; margin-right: 20px; }
                .modal-footer-actions { display: flex; justify-content: flex-end; }
            `}</style>
        </div>
    );
};

export default DriverView;
