import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Logistics.css'; // Reusing the same premium styling

const API_URL = `http://${window.location.hostname}:5000/api`;

const DriverView = () => {
    const { user } = useAuth();
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
            } else {
                await axios.post(`${API_URL}/drivers`, formData);
            }
            setShowModal(false);
            setFormData({ name: '', licenseNumber: '', phone: '', status: 'Active' });
            setEditingId(null);
            fetchDrivers();
        } catch (err) {
            alert("Error saving driver");
        }
    };

    const handleEdit = (driver) => {
        setFormData(driver);
        setEditingId(driver._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this driver?")) return;
        try {
            await axios.delete(`${API_URL}/drivers/${id}`);
            fetchDrivers();
        } catch (err) {
            alert("Error deleting driver");
        }
    };

    return (
        <div className="logistics-container">
            <div className="logistics-header">
                <h1 className="logistics-title">
                    Driver Management
                </h1>
                {canEdit && (
                    <button
                        onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', licenseNumber: '', phone: '', status: 'Active' }); }}
                        className="btn-add"
                    >
                        + Add New Driver
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>Loading drivers...</div>
            ) : (
                <div className="logistics-grid">
                    {drivers.map(driver => (
                        <div key={driver._id} className="logistics-card">
                            <div className="card-header">
                                <div>
                                    <h3 className="card-title">{driver.name}</h3>
                                    <p className="card-subtitle">License: <span style={{ color: '#93c5fd' }}>{driver.licenseNumber}</span></p>
                                    <p className="card-subtitle">Phone: {driver.phone}</p>
                                </div>
                                <span className={`status-badge ${driver.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                                    {driver.status}
                                </span>
                            </div>
                            {canEdit && (
                                <div className="card-actions">
                                    <button onClick={() => handleEdit(driver)} className="btn-text btn-edit">Edit</button>
                                    <button onClick={() => handleDelete(driver._id)} className="btn-text btn-delete">Delete</button>
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
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'white' }}>{editingId ? 'Edit Driver' : 'Add Driver'}</h2>
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
                                <label className="form-label">License Number</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={formData.licenseNumber}
                                    onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
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

export default DriverView;
