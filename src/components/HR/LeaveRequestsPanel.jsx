import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = `http://${window.location.hostname}:5000/api`;

const LeaveRequestsPanel = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdminMode, setIsAdminMode] = useState(false);

    // Form for new request
    const [type, setType] = useState('Vacation');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    // Admin here strictly means Founder/Manager who approves leaves
    const canManage = ['Founder', 'Manager'].includes(user?.role);

    useEffect(() => {
        // Default to admin mode if they are managery and not specifically looking at their own? 
        // Let's default to My View to be safe, or Admin View if they are HR? 
        // Let's default same as ExpensesPanel: My View, with toggle.
        if (canManage) setIsAdminMode(true);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [isAdminMode]);

    const fetchData = async () => {
        try {
            const endpoint = (isAdminMode && canManage) ? `${API_URL}/hr/leaves` : `${API_URL}/hr/leaves/me`;
            const res = await axios.get(endpoint);
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!startDate || !endDate || !reason) return alert("Fill all fields");
        try {
            await axios.post(`${API_URL}/hr/leaves`, { type, startDate, endDate, reason });
            alert("Request Sent");
            setReason('');
            fetchData();
        } catch (err) {
            alert("Error sending request");
        }
    };

    const handleAction = async (id, status) => {
        try {
            await axios.put(`${API_URL}/hr/leaves/${id}/status`, { status });
            fetchData();
        } catch (err) {
            alert("Error updating status");
        }
    };

    if (loading) return <div>Loading requests...</div>;

    return (
        <div className="hr-grid">
            {/* Request Form (Only in My View or always? Usually useful to have) */}
            {!isAdminMode && (
                <div className="hr-card">
                    <h3 className="card-title">Request Leave</h3>
                    <div>
                        <label className="label-text">Type</label>
                        <select className="styled-select" value={type} onChange={e => setType(e.target.value)}>
                            <option>Vacation</option>
                            <option>Sick Leave</option>
                            <option>Personal</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <label className="label-text">Start Date</label>
                        <input type="date" className="styled-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <label className="label-text">End Date</label>
                        <input type="date" className="styled-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <label className="label-text">Reason</label>
                        <textarea className="styled-input" rows="2" value={reason} onChange={e => setReason(e.target.value)} />
                    </div>
                    <button className="btn-primary" style={{ marginTop: '20px' }} onClick={handleSubmit}>Send Request</button>
                </div>
            )}

            <div className={`hr-card ${isAdminMode ? 'full-width' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 className="card-title">{isAdminMode ? 'All Requests' : 'My Requests'}</h3>
                    {canManage && (
                        <button
                            className="btn-primary"
                            style={{ padding: '5px 15px', fontSize: '0.9rem', backgroundColor: '#6366f1' }}
                            onClick={() => setIsAdminMode(!isAdminMode)}
                        >
                            {isAdminMode ? 'Switch to My View' : 'Switch to Admin View'}
                        </button>
                    )}
                </div>

                <div className="item-list">
                    {requests.map(r => (
                        <div key={r._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                    {isAdminMode ? r.user?.name : r.type}
                                </span>
                                <span className={`status-badge status-${r.status.toLowerCase()}`}>{r.status}</span>
                            </div>
                            <div style={{ margin: '10px 0', color: '#cbd5e1' }}>
                                {isAdminMode && <div><strong>Type:</strong> {r.type}</div>}
                                <div><strong>Dates:</strong> {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</div>
                                <div><strong>Reason:</strong> {r.reason}</div>
                            </div>
                            {isAdminMode && r.status === 'Pending' && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button className="btn-primary" style={{ backgroundColor: '#10b981', flex: 1 }} onClick={() => handleAction(r._id, 'Approved')}>Approve</button>
                                    <button className="btn-primary" style={{ backgroundColor: '#ef4444', flex: 1 }} onClick={() => handleAction(r._id, 'Rejected')}>Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                    {requests.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No requests found.</div>}
                </div>
            </div>
        </div>
    );
};

export default LeaveRequestsPanel;
