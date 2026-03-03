import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Logistics.css'; // Reusing premium styling

import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const VehicleView = () => {
    const { user } = useAuth();
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
            } else {
                await axios.post(`${API_URL}/vehicles`, formData);
            }
            setShowModal(false);
            setFormData({ plateNumber: '', model: '', type: 'Truck', capacityWeight: '', status: 'Active' });
            setEditingId(null);
            fetchVehicles();
        } catch (err) {
            alert("Error saving vehicle");
        }
    };

    const handleEdit = (vehicle) => {
        setFormData(vehicle);
        setEditingId(vehicle._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this vehicle?")) return;
        try {
            await axios.delete(`${API_URL}/vehicles/${id}`);
            fetchVehicles();
        } catch (err) {
            alert("Error deleting vehicle");
        }
    };

    return (
        <div className="logistics-container">
            <div className="logistics-header">
                <h1 className="logistics-title">
                    Vehicle Fleet
                </h1>
                {canEdit && (
                    <button
                        onClick={() => { setShowModal(true); setEditingId(null); setFormData({ plateNumber: '', model: '', type: 'Truck', capacityWeight: '', status: 'Active' }); }}
                        className="btn-add"
                    >
                        + Add New Vehicle
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>Loading fleet...</div>
            ) : (
                <div className="logistics-grid">
                    {vehicles.map(v => (
                        <div key={v._id} className="logistics-card">
                            <div className="card-header">
                                <div>
                                    <h3 className="card-title">{v.plateNumber}</h3>
                                    <p className="card-subtitle">{v.model}</p>
                                    <p className="card-subtitle">{v.type} • {v.capacityWeight}kg</p>
                                </div>
                                <span className={`status-badge ${v.status === 'Active' ? 'status-active' : 'status-maintenance'}`}>
                                    {v.status}
                                </span>
                            </div>
                            {canEdit && (
                                <div className="card-actions">
                                    <button onClick={() => handleEdit(v)} className="btn-text btn-edit">Edit</button>
                                    <button onClick={() => handleDelete(v._id)} className="btn-text btn-delete">Delete</button>
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
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'white' }}>{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Plate Number</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={formData.plateNumber}
                                    onChange={e => setFormData({ ...formData, plateNumber: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Model / Make</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.model}
                                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="Truck">Truck</option>
                                        <option value="Van">Van</option>
                                        <option value="Car">Car</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Capacity (kg)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.capacityWeight}
                                        onChange={e => setFormData({ ...formData, capacityWeight: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Maintenance">Maintenance</option>
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

export default VehicleView;
