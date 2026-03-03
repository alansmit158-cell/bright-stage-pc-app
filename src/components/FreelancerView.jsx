import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Logistics.css'; // Reusing premium styling

import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const FreelancerView = () => {
    const [freelancers, setFreelancers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', specialty: '', dailyRate: '', phone: '', email: '', cin: '', status: 'Active' });
    const [editingId, setEditingId] = useState(null);
    const { user } = useAuth();
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
            } else {
                await axios.post(`${API_URL}/freelancers`, formData, config);
            }
            setShowModal(false);
            resetForm();
            fetchFreelancers();
        } catch (err) {
            alert("Error saving freelancer");
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
        if (!window.confirm("Delete this freelancer?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/freelancers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchFreelancers();
        } catch (err) {
            alert("Error deleting freelancer");
        }
    };

    return (
        <div className="logistics-container">
            <div className="logistics-header">
                <h1 className="logistics-title">
                    Freelancer Management
                </h1>
                {!isReadOnly && (
                    <button
                        onClick={() => { setShowModal(true); resetForm(); }}
                        className="btn-add"
                    >
                        + Add New Freelancer
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>Loading freelancers...</div>
            ) : (
                <div className="logistics-grid">
                    {freelancers.map(f => (
                        <div key={f._id} className="logistics-card">
                            <div className="card-header">
                                <div>
                                    <h3 className="card-title">{f.name}</h3>
                                    <p className="card-subtitle">Specialty: <span style={{ color: '#93c5fd' }}>{f.specialty}</span></p>
                                    <p className="card-subtitle">Rate: {f.dailyRate} TND/Day</p>
                                    <p className="card-subtitle">Phone: {f.phone}</p>
                                </div>
                                <span className={`status-badge ${f.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                                    {f.status}
                                </span>
                            </div>
                            <div className="card-actions">
                                {!isReadOnly && (
                                    <>
                                        <button onClick={() => handleEdit(f)} className="btn-text btn-edit">Edit</button>
                                        <button onClick={() => handleDelete(f._id)} className="btn-text btn-delete">Delete</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'white' }}>{editingId ? 'Edit Freelancer' : 'Add Freelancer'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Specialty</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="e.g. Sound Engineer"
                                    value={formData.specialty}
                                    onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Daily Rate (TND)</label>
                                <input
                                    type="number"
                                    required
                                    className="form-input"
                                    value={formData.dailyRate}
                                    onChange={e => setFormData({ ...formData, dailyRate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">CIN</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.cin}
                                    onChange={e => setFormData({ ...formData, cin: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Cancel</button>
                                <button type="submit" className="btn-save">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FreelancerView;
