import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
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
    const { showSuccess, showError } = useNotification();

    const isReadOnly = false; 

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
            showSuccess("Worker settings updated", "Staff Management");
            fetchWorkers();
            setShowSettingsModal(false);
        } catch (err) {
            showError("Update failed", "Error");
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
            showSuccess(`${pointsToAdd > 0 ? '+' : ''}${pointsToAdd} points registered`, "Performance");
            fetchWorkers();
            const res = await api.get('/users');
            const updated = res.data.find(w => w._id === selectedWorker._id);
            setSelectedWorker(updated);
        } catch (err) {
            showError("Point adjustment failed", "Error");
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
        <div style={{ padding: '40px 60px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', margin: 0, color: '#fff' }}>{t('workers')}</h1>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Internal staff, roles, and performance balance</p>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#6366f1' }}>Loading Team...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                    {workers.map(worker => (
                        <div key={worker._id} className="worker-premium-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '18px',
                                    background: `linear-gradient(135deg, ${getRoleColor(worker.role)}22, ${getRoleColor(worker.role)}44)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    color: getRoleColor(worker.role),
                                    border: `1px solid ${getRoleColor(worker.role)}33`
                                }}>
                                    {worker.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>{worker.name}</h3>
                                    <span style={{ fontSize: '10px', fontWeight: '800', color: getRoleColor(worker.role), background: `${getRoleColor(worker.role)}15`, padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase' }}>
                                        {worker.role}
                                    </span>
                                </div>
                                <div style={{ color: worker.isActive ? '#10b981' : '#ef4444', fontSize: '10px', fontWeight: '900' }}>
                                    {worker.isActive ? '● ACTIVE' : '○ INACTIVE'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Email</span> <span style={{ color: '#fff' }}>{worker.email}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Phone</span> <span style={{ color: '#fff' }}>{worker.phone || '-'}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>PERFORMANCE</span>
                                    <span style={{ color: '#818cf8', fontWeight: '900' }}>{worker.points || 0} pts</span>
                                </div>
                                <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '8px', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min((worker.points || 0), 100)}%`, height: '100%', background: 'linear-gradient(to right, #6366f1, #a78bfa)' }}></div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button
                                    onClick={() => { setSelectedWorker(worker); setShowDetailsModal(true); }}
                                    className="worker-card-btn primary">
                                    History & Score
                                </button>
                                {!isReadOnly && (
                                    <button
                                        onClick={() => { setSelectedWorker(worker); setShowSettingsModal(true); }}
                                        className="worker-card-btn icon">
                                        ⚙️
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Settings Modal - REDESIGNED */}
            {showSettingsModal && selectedWorker && (
                <div className="modal-overlay-blur">
                    <div className="premium-modal-card" style={{ width: '600px' }}>
                        <div className="modal-header-vibrant">
                            <div>
                                <h2 style={{ margin: 0, fontSize: '20px' }}>Worker Configuration</h2>
                                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Managing account of {selectedWorker.name}</p>
                            </div>
                            <button onClick={() => setShowSettingsModal(false)} className="close-x-btn">&times;</button>
                        </div>

                        <div className="premium-form-grid" style={{ gridTemplateColumns: '1fr', padding: '30px 40px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                                <div>
                                    <label className="premium-label">Access Role</label>
                                    <select
                                        className="premium-field-input"
                                        value={selectedWorker.role}
                                        onChange={(e) => handleUpdateWorker(selectedWorker._id, { role: e.target.value })}
                                    >
                                        <option value="Founder">Founder</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Storekeeper">Storekeeper</option>
                                        <option value="Site Manager">Site Manager</option>
                                        <option value="Worker">Worker</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => { setShowSettingsModal(false); setShowProfileEditor(true); }}
                                        className="premium-save-btn"
                                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', padding: '12px' }}
                                    >
                                        📝 Edit HR Profile
                                    </button>
                                </div>
                            </div>

                            <div className="location-section-box" style={{ marginTop: '10px' }}>
                                <label className="premium-label" style={{ color: '#818cf8' }}>Basic Identity</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <input id="worker-phone" placeholder="Phone Number" className="premium-field-input" defaultValue={selectedWorker.phone || ''} />
                                    <input id="worker-cin" placeholder="CIN / ID" className="premium-field-input" defaultValue={selectedWorker.cin || ''} />
                                </div>
                                <button className="premium-save-btn" style={{ width: '100%', marginTop: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.05)' }} onClick={() => {
                                    const phone = document.getElementById('worker-phone').value;
                                    const cin = document.getElementById('worker-cin').value;
                                    handleUpdateWorker(selectedWorker._id, { phone, cin });
                                }}>Save Identity Info</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginTop: '10px' }}>
                                <div>
                                    <label className="premium-label">Account Status</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleUpdateWorker(selectedWorker._id, { isActive: true })}
                                            className={`status-chip ${selectedWorker.isActive ? 'active-green' : ''}`}>Active</button>
                                        <button
                                            onClick={() => handleUpdateWorker(selectedWorker._id, { isActive: false })}
                                            className={`status-chip ${!selectedWorker.isActive ? 'active-red' : ''}`}>Inactive</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="premium-label">Points Adjustment</label>
                                    <form onSubmit={handleAddPoints} style={{ display: 'flex', gap: '10px' }}>
                                        <input type="number" placeholder="+/-" className="premium-field-input" style={{ width: '70px' }} value={pointsToAdd} onChange={e => setPointsToAdd(e.target.value)} required />
                                        <button type="submit" className="premium-save-btn" style={{ padding: '0 15px', fontSize: '12px' }}>Apply</button>
                                    </form>
                                </div>
                            </div>

                            <div className="location-section-box" style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px dashed rgba(239, 68, 68, 0.2)' }}>
                                <label className="premium-label" style={{ color: '#ef4444' }}>Security / Password Reset</label>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 15px', borderRadius: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>Current Key:</span>
                                    <span style={{ fontSize: '13px', color: '#fff', fontFamily: 'monospace' }}>{selectedWorker.plainPassword || '••••••'}</span>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const pwd = e.target.newPassword.value;
                                    if (pwd.length < 6) return showError("Minimum 6 characters", "Password");
                                    try {
                                        await api.put(`/users/${selectedWorker._id}`, { password: pwd });
                                        showSuccess("Password reset successfully", "Security");
                                        e.target.reset();
                                    } catch (err) { showError("Failed to reset", "Security"); }
                                }} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                                    <input type="password" name="newPassword" placeholder="Set new password..." className="premium-field-input" minLength="6" required />
                                    <button type="submit" className="premium-save-btn" style={{ background: '#ef4444' }}>RESET</button>
                                </form>
                            </div>
                        </div>

                        <div className="modal-footer-actions">
                            <button onClick={() => setShowSettingsModal(false)} className="premium-cancel-btn">Close Panel</button>
                        </div>
                    </div>
                </div>
            )}

            {showDetailsModal && selectedWorker && (
                <div className="modal-overlay-blur" onClick={() => setShowDetailsModal(false)}>
                    <div className="premium-modal-card" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header-vibrant">
                            <h2>Worker History</h2>
                            <button onClick={() => setShowDetailsModal(false)} className="close-x-btn">&times;</button>
                        </div>
                        <div style={{ padding: '30px' }}>
                            <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '20px', borderRadius: '20px', textAlign: 'center', marginBottom: '25px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: '800', letterSpacing: '1px', marginBottom: '5px' }}>LIFETIME SCORE</div>
                                <div style={{ fontSize: '36px', fontWeight: '900', color: '#fff' }}>{selectedWorker.points || 0}</div>
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(selectedWorker.pointsHistory || []).map((entry, i) => (
                                    <div key={i} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div>
                                            <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>{entry.reason}</div>
                                            <div style={{ color: '#64748b', fontSize: '11px' }}>{new Date(entry.date).toLocaleDateString()}</div>
                                        </div>
                                        <div style={{ color: entry.points >= 0 ? '#10b981' : '#ef4444', fontWeight: '900' }}>
                                            {entry.points >= 0 ? '+' : ''}{entry.points}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showProfileEditor && selectedWorker && (
                <ProfileEditor user={selectedWorker} onClose={() => setShowProfileEditor(false)} onUpdate={fetchWorkers} />
            )}

            <style>{`
                .worker-premium-card { background: #1a1b26; border-radius: 24px; padding: 25px; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s; }
                .worker-premium-card:hover { transform: translateY(-5px); border-color: #6366f1; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
                .worker-card-btn { border: none; padding: 10px 15px; borderRadius: 12px; font-weight: 700; font-size: 12px; cursor: pointer; transition: 0.2s; }
                .worker-card-btn.primary { flex: 1; background: rgba(99, 102, 241, 0.1); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.2); }
                .worker-card-btn.primary:hover { background: #6366f1; color: white; }
                .worker-card-btn.icon { background: rgba(255,255,255,0.05); color: white; }
                
                .status-chip { flex: 1; padding: 10px; border-radius: 12px; border: none; background: rgba(255,255,255,0.03); color: #64748b; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .status-chip.active-green { background: #10b981; color: white; }
                .status-chip.active-red { background: #ef4444; color: white; }

                /* Reuse Global Modal Styles */
                .modal-overlay-blur { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; justify-content: center; alignItems: center; z-index: 2000; padding: 20px; }
                .premium-modal-card { background: #1a1b26; border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 100px rgba(0,0,0,0.6); position: relative; overflow: hidden; }
                .modal-header-vibrant { padding: 30px 40px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to right, rgba(99,102,241,0.05), transparent); }
                .close-x-btn { background: none; border: none; color: #475569; font-size: 28px; cursor: pointer; }
                .premium-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: block; }
                .premium-field-input { width: 100%; padding: 12px 18px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; color: white; outline: none; transition: 0.2s; box-sizing: border-box; }
                .location-section-box { background: rgba(255,255,255,0.02); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
                .premium-save-btn { background: #6366f1; color: white; border: none; padding: 12px 25px; border-radius: 14px; font-weight: 700; cursor: pointer; }
                .premium-cancel-btn { background: rgba(255,255,255,0.05); color: #94a3b8; border: none; padding: 12px 25px; border-radius: 14px; cursor: pointer; margin-right: 40px; }
                .modal-footer-actions { padding: 0 40px 30px; display: flex; justify-content: flex-end; }
            `}</style>
        </div>
    );
};

export default WorkersView;
