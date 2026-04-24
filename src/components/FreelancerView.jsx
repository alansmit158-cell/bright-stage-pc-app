import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './Logistics.css'; 
import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const FreelancerView = () => {
    const [freelancers, setFreelancers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', specialty: '', dailyRate: '', phone: '', email: '', cin: '', status: 'Active' });
    const [editingId, setEditingId] = useState(null);
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    
    const isReadOnly = ['Site Manager'].includes(user?.role);

    useEffect(() => {
        fetchFreelancers();
    }, []);

    const fetchFreelancers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/freelancers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFreelancers(res.data);
        } catch (err) {
            console.error("Error fetching freelancers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (editingId) {
                await axios.put(`${API_URL}/freelancers/${editingId}`, formData, config);
                showSuccess("Freelancer profile updated", "Talent Management");
            } else {
                await axios.post(`${API_URL}/freelancers`, formData, config);
                showSuccess("New talent added to roster", "Success");
            }
            setShowModal(false);
            resetForm();
            fetchFreelancers();
        } catch (err) {
            showError("Operation failed", "Error");
        }
    };

    const resetForm = () => {
        setFormData({ name: '', specialty: '', dailyRate: '', phone: '', email: '', cin: '', status: 'Active' });
        setEditingId(null);
    }

    const handleEdit = (freelancer) => {
        setFormData(freelancer);
        setEditingId(freelancer._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this talent from the list?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/freelancers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showSuccess("Freelancer removed", "System");
            fetchFreelancers();
        } catch (err) {
            showError("Deletion failed", "Error");
        }
    };

    return (
        <div style={{ padding: '40px 60px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: '#fff', letterSpacing: '-1px' }}>
                        Freelancer Network
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>External specialists and temporary technical staff</p>
                </div>
                {!isReadOnly && (
                    <button
                        onClick={() => { setShowModal(true); resetForm(); }}
                        style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' }}
                    >
                        + Onboard Freelancer
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#6366f1', padding: '100px' }}>Syncing Network...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                    {freelancers.map(f => (
                        <div key={f._id} className="talent-premium-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ width: '50px', height: '50px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    {f.name.charAt(0)}
                                </div>
                                <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', background: f.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: f.status === 'Active' ? '#10b981' : '#ef4444' }}>
                                    {f.status.toUpperCase()}
                                </span>
                            </div>
                            
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '700', color: '#fff' }}>{f.name}</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>{f.specialty}</p>

                            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Daily Rate</span>
                                    <span style={{ color: '#fff', fontWeight: '700' }}>{f.dailyRate} TND</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Phone</span>
                                    <span style={{ color: '#fff' }}>{f.phone || '-'}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '25px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                {!isReadOnly && (
                                    <>
                                        <button onClick={() => handleEdit(f)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Edit</button>
                                        <button onClick={() => handleDelete(f._id)} style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '10px', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>&times;</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Redesigned Modal */}
            {showModal && (
                <div className="modal-overlay-blur">
                    <div className="premium-modal-card" style={{ width: '650px' }}>
                        <div className="modal-header-vibrant">
                            <div>
                                <h2 style={{ margin: 0, fontSize: '20px' }}>{editingId ? 'Edit Specialty' : 'Onboard New Specialist'}</h2>
                                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>{editingId ? `Updating profile: ${formData.name}` : 'Register a new external freelancer to the roster'}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="close-x-btn">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '30px 40px' }}>
                            <div className="premium-form-grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
                                <div>
                                    <label className="premium-label">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="premium-field-input"
                                        placeholder="Enter name..."
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="premium-label">Specialty / Role</label>
                                    <input
                                        type="text"
                                        required
                                        className="premium-field-input"
                                        placeholder="e.g. L-Acoustics Engineer"
                                        value={formData.specialty}
                                        onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
                                <div>
                                    <label className="premium-label">Daily Rate (TND)</label>
                                    <input
                                        type="number"
                                        required
                                        className="premium-field-input"
                                        value={formData.dailyRate}
                                        onChange={e => setFormData({ ...formData, dailyRate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="premium-label">Phone</label>
                                    <input
                                        type="text"
                                        className="premium-field-input"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="premium-label">Status</label>
                                    <select
                                        className="premium-field-input"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginTop: '20px' }}>
                                <div>
                                    <label className="premium-label">Email Context</label>
                                    <input
                                        type="email"
                                        className="premium-field-input"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="premium-label">CIN / ID Number</label>
                                    <input
                                        type="text"
                                        className="premium-field-input"
                                        value={formData.cin}
                                        onChange={e => setFormData({ ...formData, cin: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer-actions" style={{ marginTop: '40px', padding: 0 }}>
                                <button type="button" onClick={() => setShowModal(false)} className="premium-cancel-btn">Discard Changes</button>
                                <button type="submit" className="premium-save-btn" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                    {editingId ? 'Update Freelancer' : 'Register Specialist'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .talent-premium-card { background: #1a1b26; padding: 25px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s; }
                .talent-premium-card:hover { transform: translateY(-5px); border-color: #3b82f6; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }

                /* Reuse Global Premium Styles */
                .modal-overlay-blur { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; justify-content: center; alignItems: center; z-index: 2000; padding: 20px; }
                .premium-modal-card { background: #1a1b26; border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 100px rgba(0,0,0,0.6); position: relative; overflow: hidden; }
                .modal-header-vibrant { padding: 30px 40px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to right, rgba(99,102,241,0.05), transparent); }
                .close-x-btn { background: none; border: none; color: #475569; font-size: 28px; cursor: pointer; }
                .premium-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: block; }
                .premium-field-input { width: 100%; padding: 12px 18px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; color: white; outline: none; transition: 0.2s; box-sizing: border-box; }
                .premium-field-input:focus { border-color: #6366f1; background: rgba(99,102,241,0.05); }
                .premium-save-btn { background: #6366f1; color: white; border: none; padding: 12px 25px; border-radius: 14px; font-weight: 700; cursor: pointer; }
                .premium-cancel-btn { background: rgba(255,255,255,0.05); color: #94a3b8; border: none; padding: 12px 25px; border-radius: 14px; cursor: pointer; margin-right: 20px; }
                .modal-footer-actions { display: flex; justify-content: flex-end; }
            `}</style>
        </div>
    );
};

export default FreelancerView;
