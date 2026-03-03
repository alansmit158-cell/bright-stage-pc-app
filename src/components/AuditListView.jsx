import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Logistics.css';
import { useNavigate } from 'react-router-dom';

const API_URL = `http://${window.location.hostname}:5000/api`;

const AuditListView = () => {
    const navigate = useNavigate();
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAuditName, setNewAuditName] = useState('');
    const [newAuditType, setNewAuditType] = useState('Spot Check');

    useEffect(() => {
        fetchAudits();
    }, []);

    const fetchAudits = async () => {
        try {
            const res = await axios.get(`${API_URL}/audits`);
            setAudits(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching audits:", err);
            setLoading(false);
        }
    };

    const handleCreateAudit = async () => {
        try {
            const res = await axios.post(`${API_URL}/audits`, {
                name: newAuditName,
                type: newAuditType
            });
            setShowCreateModal(false);
            // Navigate to new audit
            navigate(`/audits/${res.data._id}`);
        } catch (err) {
            console.error("Error creating audit:", err);
            alert("Failed to create audit");
        }
    };

    return (
        <div className="logistics-container">
            <div className="logistics-header">
                <h1 className="logistics-title">Inventory Audits</h1>
                <button className="btn-add" onClick={() => {
                    setNewAuditName(`Audit ${new Date().toLocaleDateString()}`);
                    setShowCreateModal(true);
                }}>
                    + Start New Audit
                </button>
            </div>

            <div className="logistics-grid">
                {audits.map(audit => (
                    <div key={audit._id} className="logistics-card" onClick={() => navigate(`/audits/${audit._id}`)} style={{ cursor: 'pointer' }}>
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">{audit.name}</h3>
                                <div className="card-subtitle">{audit.type}</div>
                            </div>
                            <span className={`status-badge ${audit.status === 'Finalized' ? 'status-active' : 'event-draft'}`}>
                                {audit.status}
                            </span>
                        </div>
                        <div className="card-subtitle">
                            Created: {new Date(audit.createdAt).toLocaleDateString()}
                        </div>
                        {audit.finalizedAt && (
                            <div className="card-subtitle">
                                Finalized: {new Date(audit.finalizedAt).toLocaleDateString()}
                            </div>
                        )}
                        <div className="card-actions">
                            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                {audit.items?.length || 0} Items Checked
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {audits.length === 0 && !loading && (
                <div style={{ textAlign: 'center', marginTop: '4rem', color: '#94a3b8' }}>
                    <p>No inventory audits found.</p>
                    <p>Start a new audit to track your physical stock.</p>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">New Inventory Audit</h3>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Audit Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newAuditName}
                                onChange={(e) => setNewAuditName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <select
                                className="form-select"
                                value={newAuditType}
                                onChange={(e) => setNewAuditType(e.target.value)}
                            >
                                <option value="Spot Check">Spot Check</option>
                                <option value="6-Month">6-Month Audit</option>
                                <option value="Annual">Annual Audit</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="btn-save" onClick={handleCreateAudit}>Create & Start</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditListView;
