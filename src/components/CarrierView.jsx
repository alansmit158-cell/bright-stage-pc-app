import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Logistics.css';

import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const CarrierView = () => {
    const { user } = useAuth();
    const canEdit = ['Founder', 'Manager', 'Storekeeper'].includes(user?.role);

    const [carriers, setCarriers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        cin: '',
        phone: '',
        vehiclePlate: '',
        vehicleModel: '',
        status: 'Active'
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
            } else {
                await axios.post(`${API_URL}/carriers`, formData);
            }
            setShowModal(false);
            resetForm();
            fetchCarriers();
        } catch (err) {
            alert("Error saving carrier");
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            cin: '',
            phone: '',
            vehiclePlate: '',
            vehicleModel: '',
            status: 'Active'
        });
        setEditingId(null);
    };

    const handleEdit = (carrier) => {
        setFormData(carrier);
        setEditingId(carrier._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this carrier?")) return;
        try {
            await axios.delete(`${API_URL}/carriers/${id}`);
            fetchCarriers();
        } catch (err) {
            alert("Error deleting carrier");
        }
    };

    return (
        <div className="logistics-container">
            <div className="logistics-header">
                <h1 className="logistics-title">
                    Carrier Management
                </h1>
                {canEdit && (
                    <button
                        onClick={() => { setShowModal(true); resetForm(); }}
                        className="btn-add"
                    >
                        + Add New Carrier
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>Loading carriers...</div>
            ) : (
                <div className="logistics-grid">
                    {carriers.map(carrier => (
                        <div key={carrier._id} className="logistics-card">
                            <div className="card-header">
                                <div>
                                    <h3 className="card-title">{carrier.firstName} {carrier.lastName}</h3>
                                    <p className="card-subtitle">Vehicle: <span style={{ color: '#93c5fd' }}>{carrier.vehicleModel}</span> • {carrier.vehiclePlate}</p>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                        <p>Phone: {carrier.phone || 'N/A'}</p>
                                        <p>CIN: {carrier.cin}</p>
                                    </div>
                                </div>
                                <span className={`status-badge ${carrier.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                                    {carrier.status}
                                </span>
                            </div>
                            {canEdit && (
                                <div className="card-actions">
                                    <button onClick={() => handleEdit(carrier)} className="btn-text btn-edit">Edit</button>
                                    <button onClick={() => handleDelete(carrier._id)} className="btn-text btn-delete">Delete</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'white' }}>{editingId ? 'Edit Carrier' : 'Add Carrier'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">CIN (ID)</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={formData.cin}
                                    onChange={e => setFormData({ ...formData, cin: e.target.value })}
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
                                <label className="form-label">Vehicle Plate</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={formData.vehiclePlate}
                                    onChange={e => setFormData({ ...formData, vehiclePlate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Vehicle Model</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.vehicleModel}
                                    onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
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
                            <div className="form-actions" style={{ gridColumn: 'span 2' }}>
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

export default CarrierView;
