import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './Logistics.css';
import ProfileEditor from './HR/ProfileEditor';

const WorkersView = () => {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showProfileEditor, setShowProfileEditor] = useState(false);
    const [pointsToAdd, setPointsToAdd] = useState('');
    const [pointsReason, setPointsReason] = useState('');
    const { t } = useLanguage();
    const { user } = useAuth();

    // Read-only mode for Storekeeper and Site Manager
    const isReadOnly = ['Storekeeper', 'Site Manager'].includes(user?.role);

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        try {
            const res = await api.get('/users');
            setWorkers(res.data);
        } catch (err) {
            console.error("Error fetching workers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateWorker = async (id, data) => {
        try {
            await api.put(`/users/${id}`, data);
            fetchWorkers();
            setShowSettingsModal(false);
        } catch (err) {
            alert("Error updating worker");
        }
    };

    const handleAddPoints = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/users/${selectedWorker._id}/points`, {
                points: pointsToAdd,
                reason: pointsReason
            });
            setPointsToAdd('');
            setPointsReason('');
            fetchWorkers();
            // Update selected worker in modal if open
            const res = await api.get('/users');
            const updated = res.data.find(w => w._id === selectedWorker._id);
            setSelectedWorker(updated);
            alert("Points added successfully!");
        } catch (err) {
            alert("Error adding points");
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Founder': return '#ef4444';
            case 'Manager': return '#f59e0b';
            case 'Storekeeper': return '#10b981';
            case 'Site Manager': return '#3b82f6';
            default: return '#94a3b8';
        }
    };

    return (
        <div className="logistics-container" style={{ padding: '30px', animation: 'fadeIn 0.5s ease' }}>
            <div className="logistics-header" style={{ marginBottom: '40px' }}>
                <div>
                    <h1 className="logistics-title" style={{ fontSize: '32px', fontWeight: '800', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        {t('workers')}
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '5px' }}>Manage internal staff and work performance</p>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#6366f1', padding: '40px' }}>
                    <div className="spinner"></div>
                    <p>Loading Team...</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {workers.map(worker => (
                        <div key={worker._id} className="logistics-card" style={{
                            background: '#1a1b26',
                            borderRadius: '20px',
                            padding: '24px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            cursor: 'default'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '18px',
                                    background: `linear-gradient(135deg, ${getRoleColor(worker.role)}22 0%, ${getRoleColor(worker.role)}44 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: getRoleColor(worker.role),
                                    border: `1px solid ${getRoleColor(worker.role)}33`
                                }}>
                                    {worker.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white' }}>{worker.name}</h3>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        color: getRoleColor(worker.role),
                                        background: `${getRoleColor(worker.role)}11`,
                                        padding: '2px 8px',
                                        borderRadius: '100px',
                                        marginTop: '4px',
                                        display: 'inline-block'
                                    }}>
                                        {worker.role}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span style={{ color: '#64748b' }}>Email</span>
                                    <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{worker.email}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span style={{ color: '#64748b' }}>Phone</span>
                                    <span style={{ color: '#e2e8f0' }}>{worker.phone || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span style={{ color: '#64748b' }}>CIN</span>
                                    <span style={{ color: '#e2e8f0' }}>
                                        {(() => {
                                            const canView = ['Founder', 'Manager'].includes(user?.role) || user?._id === worker._id;
                                            return canView ? (worker.cin || '-') : '••••••••';
                                        })()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span style={{ color: '#64748b' }}>Status</span>
                                    <span style={{ color: worker.isActive ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                        {worker.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {/* Expert Profile Badges */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
                                    {worker.drivingLicenses?.map(lic => (
                                        <span key={lic} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#3b82f6', color: 'white' }}>{lic}</span>
                                    ))}
                                    {worker.technicalSkills?.slice(0, 3).map(skill => (
                                        <span key={skill} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#4b5563', color: '#e5e7eb' }}>{skill}</span>
                                    ))}
                                    {(worker.technicalSkills?.length > 3) && <span style={{ fontSize: '10px', color: '#9ca3af' }}>+{worker.technicalSkills.length - 3} more</span>}
                                </div>

                                <div style={{
                                    marginTop: '10px',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>PERFORMANCE POINTS</span>
                                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#818cf8' }}>{worker.points || 0}</span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min((worker.points || 0), 100)}%`, height: '100%', background: '#6366f1', borderRadius: '2px' }}></div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button
                                    onClick={() => { setSelectedWorker(worker); setShowDetailsModal(true); }}
                                    style={{ flex: 1, padding: '10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    View Details
                                </button>
                                {!isReadOnly && (
                                    <button
                                        onClick={() => { setSelectedWorker(worker); setShowSettingsModal(true); }}
                                        style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}>
                                        ⚙️
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )
            }

            {/* Details Modal */}
            {
                showDetailsModal && selectedWorker && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }} onClick={() => setShowDetailsModal(false)}>
                        <div className="modal-content" style={{ background: '#111827', width: '90%', maxWidth: '600px', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ color: 'white', margin: 0 }}>Worker Lifecycle & Points</h2>
                                <button onClick={() => setShowDetailsModal(false)} style={{ background: 'none', border: 'none', color: '#666', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94a3b8' }}>Overall Score</span>
                                    <span style={{ fontSize: '32px', fontWeight: '900', color: '#818cf8' }}>{selectedWorker.points || 0}</span>
                                </div>
                            </div>

                            <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '16px' }}>Points History</h3>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(selectedWorker.pointsHistory || []).length === 0 ? (
                                    <p style={{ color: '#4b5563', textAlign: 'center' }}>No points history yet.</p>
                                ) : (
                                    selectedWorker.pointsHistory.map((entry, i) => (
                                        <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{entry.reason}</div>
                                                <div style={{ color: '#4b5563', fontSize: '11px' }}>{new Date(entry.date).toLocaleDateString()}</div>
                                            </div>
                                            <div style={{ color: entry.points >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                                {entry.points >= 0 ? '+' : ''}{entry.points}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div style={{ marginTop: '32px' }}>
                                <button onClick={() => setShowDetailsModal(false)} style={{ width: '100%', padding: '12px', background: '#374151', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Settings Modal */}
            {
                showSettingsModal && selectedWorker && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }} onClick={() => setShowSettingsModal(false)}>
                        <div className="modal-content" style={{ background: '#111827', width: '90%', maxWidth: '500px', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                            <h2 style={{ color: 'white', marginBottom: '24px' }}>Worker Settings</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '13px' }}>Role</label>
                                    <select
                                        className="input-field"
                                        value={selectedWorker.role}
                                        onChange={(e) => handleUpdateWorker(selectedWorker._id, { role: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: '#1a1b26', border: '1px solid #333', color: 'white', borderRadius: '12px', marginTop: '8px' }}
                                    >
                                        <option value="Founder">Founder</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Storekeeper">Storekeeper</option>
                                        <option value="Site Manager">Site Manager</option>
                                        <option value="Worker">Worker</option>
                                    </select>

                                </div>

                                <button
                                    onClick={() => { setShowSettingsModal(false); setShowProfileEditor(true); }}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        backgroundColor: '#8b5cf6',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    📝 Edit Expert Profile (HR)
                                </button>

                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                    <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'bold' }}>Personal Info</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                                        <input
                                            id="worker-phone"
                                            type="text"
                                            placeholder="Phone Number"
                                            defaultValue={selectedWorker.phone || ''}
                                            style={{ width: '100%', padding: '12px', background: '#1a1b26', border: '1px solid #333', color: 'white', borderRadius: '12px' }}
                                        />
                                        <input
                                            id="worker-cin"
                                            type="text"
                                            placeholder="CIN / ID"
                                            defaultValue={selectedWorker.cin || ''}
                                            style={{ width: '100%', padding: '12px', background: '#1a1b26', border: '1px solid #333', color: 'white', borderRadius: '12px' }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            const phone = document.getElementById('worker-phone').value;
                                            const cin = document.getElementById('worker-cin').value;
                                            handleUpdateWorker(selectedWorker._id, { phone, cin });
                                        }}
                                        style={{ width: '100%', padding: '10px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                                        Save Info
                                    </button>
                                </div>

                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '13px' }}>Account Status</label>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                        <button
                                            onClick={() => handleUpdateWorker(selectedWorker._id, { isActive: true })}
                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: selectedWorker.isActive ? '#10b981' : '#1a1b26', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                                            Active
                                        </button>
                                        <button
                                            onClick={() => handleUpdateWorker(selectedWorker._id, { isActive: false })}
                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: !selectedWorker.isActive ? '#ef4444' : '#1a1b26', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                                            Inactive
                                        </button>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                    <h3 style={{ color: 'white', fontSize: '14px', marginBottom: '16px' }}>Adjust Performance Points</h3>
                                    <form onSubmit={handleAddPoints} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input
                                            type="number"
                                            placeholder="Points (e.g. 5 or -5)"
                                            required
                                            value={pointsToAdd}
                                            onChange={(e) => setPointsToAdd(e.target.value)}
                                            style={{ width: '100%', padding: '12px', background: '#1a1b26', border: '1px solid #333', color: 'white', borderRadius: '12px' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Reason for adjustment"
                                            required
                                            value={pointsReason}
                                            onChange={(e) => setPointsReason(e.target.value)}
                                            style={{ width: '100%', padding: '12px', background: '#1a1b26', border: '1px solid #333', color: 'white', borderRadius: '12px' }}
                                        />
                                        <button type="submit" style={{ width: '100%', padding: '12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
                                            Update Points Balance
                                        </button>
                                    </form>
                                </div>

                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', marginTop: '20px' }}>
                                    <h3 style={{ color: 'white', fontSize: '14px', marginBottom: '16px' }}>Password Management</h3>

                                    {/* Current Password Display */}
                                    <div style={{
                                        padding: '12px',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                        borderRadius: '12px',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>CURRENT PASSWORD</span>
                                            <span style={{
                                                color: '#818cf8',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                fontFamily: 'monospace',
                                                letterSpacing: '1px'
                                            }}>
                                                {selectedWorker.plainPassword || 'Not available'}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 style={{ color: 'white', fontSize: '14px', marginBottom: '16px' }}>Change Password</h3>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        const newPassword = e.target.newPassword.value;
                                        const confirmPassword = e.target.confirmPassword.value;

                                        if (newPassword !== confirmPassword) {
                                            alert('Passwords do not match!');
                                            return;
                                        }

                                        if (newPassword.length < 6) {
                                            alert('Password must be at least 6 characters');
                                            return;
                                        }

                                        try {
                                            await api.put(`/users/${selectedWorker._id}`, { password: newPassword });
                                            alert('Password changed successfully!');
                                            e.target.reset();
                                        } catch (err) {
                                            alert('Error changing password');
                                        }
                                    }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            placeholder="New password (min 6 characters)"
                                            required
                                            minLength="6"
                                            style={{ width: '100%', padding: '12px', background: '#1a1b26', border: '1px solid #333', color: 'white', borderRadius: '12px' }}
                                        />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            placeholder="Confirm new password"
                                            required
                                            minLength="6"
                                            style={{ width: '100%', padding: '12px', background: '#1a1b26', border: '1px solid #333', color: 'white', borderRadius: '12px' }}
                                        />
                                        <button type="submit" style={{ width: '100%', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
                                            Reset Password
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <div style={{ marginTop: '32px' }}>
                                <button onClick={() => setShowSettingsModal(false)} style={{ width: '100%', padding: '12px', background: '#374151', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Close Settings</button>
                            </div>
                        </div>
                    </div >
                )
            }

            {
                showProfileEditor && selectedWorker && (
                    <ProfileEditor
                        user={selectedWorker}
                        onClose={() => setShowProfileEditor(false)}
                        onUpdate={fetchWorkers}
                    />
                )
            }

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(99, 102, 241, 0.1);
                    border-left-color: #6366f1;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div >
    );
};

export default WorkersView;
