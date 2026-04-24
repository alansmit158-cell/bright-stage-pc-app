import React, { useState } from 'react';
import axios from 'axios';
import { useNotification } from '../../context/NotificationContext';
import { CONFIG } from '../../config';

const API_URL = CONFIG.API_URL;

const ProfileEditor = ({ user, onClose, onUpdate }) => {
    const { showSuccess, showError } = useNotification();
    const [formData, setFormData] = useState({
        drivingLicenses: user.drivingLicenses || [],
        technicalSkills: user.technicalSkills || [],
        emergencyContact: user.emergencyContact || { name: '', phone: '', relation: '' },
        baseRate: user.baseRate || 0,
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
        hireDate: user.hireDate ? new Date(user.hireDate).toISOString().split('T')[0] : ''
    });

    const [newSkill, setNewSkill] = useState('');

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleEmailUpdate = async () => {
        const newEmail = prompt("Enter new email address:", user.email);
        if (!newEmail || newEmail === user.email) return;
        try {
            await axios.put(`${API_URL}/users/${user._id}`, { email: newEmail });
            showSuccess("Email updated successfully", "HR");
            onUpdate();
        } catch (err) {
            showError("Failed to update email", "System");
        }
    };

    const handleContactChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            emergencyContact: { ...prev.emergencyContact, [field]: value }
        }));
    };

    const toggleLicense = (lic) => {
        setFormData(prev => {
            const current = prev.drivingLicenses;
            if (current.includes(lic)) {
                return { ...prev, drivingLicenses: current.filter(l => l !== lic) };
            } else {
                return { ...prev, drivingLicenses: [...current, lic] };
            }
        });
    };

    const addSkill = () => {
        if (newSkill && !formData.technicalSkills.includes(newSkill)) {
            setFormData(prev => ({ ...prev, technicalSkills: [...prev.technicalSkills, newSkill] }));
            setNewSkill('');
        }
    };

    const removeSkill = (skill) => {
        setFormData(prev => ({ ...prev, technicalSkills: prev.technicalSkills.filter(s => s !== skill) }));
    };

    const handleSubmit = async () => {
        try {
            await axios.put(`${API_URL}/users/${user._id}`, formData);
            showSuccess("Expert profile synchronized successfully", "HR Management");
            onUpdate();
            onClose();
        } catch (err) {
            showError("Sync failed: " + err.message, "Internal Error");
        }
    };

    return (
        <div className="modal-overlay-blur">
            <div className="premium-modal-card" style={{ width: '700px' }}>
                <div className="modal-header-vibrant">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>HR Expert Profile</h2>
                            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Managing {user.name} • {user.role}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-x-btn">&times;</button>
                </div>

                <div className="premium-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    {/* Left Column: Licenses & Skills */}
                    <div className="form-column">
                        <div className="section-block">
                            <label className="premium-label">🪪 Driving Licenses</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                                {['A', 'B', 'BE', 'C', 'CE', 'D', 'DE'].map(lic => (
                                    <button
                                        key={lic}
                                        type="button"
                                        onClick={() => toggleLicense(lic)}
                                        className={`license-btn ${formData.drivingLicenses.includes(lic) ? 'active' : ''}`}
                                    >
                                        {lic}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="section-block" style={{ marginTop: '25px' }}>
                            <label className="premium-label">🛠️ Technical Expertise</label>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <input
                                    type="text"
                                    className="premium-field-input"
                                    style={{ height: '42px' }}
                                    placeholder="Add specialty..."
                                    value={newSkill}
                                    onChange={e => setNewSkill(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                />
                                <button type="button" className="add-btn-vibrant" onClick={addSkill}>Add</button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                {formData.technicalSkills.map(skill => (
                                    <span key={skill} className="skill-tag">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(skill)}>&times;</button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="section-block" style={{ marginTop: '25px' }}>
                            <label className="premium-label">📧 Account Communication</label>
                            <button type="button" onClick={handleEmailUpdate} className="email-status-btn">
                                <span>{user.email}</span>
                                <span className="edit-hint">Change Email</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Emergency & Rates */}
                    <div className="form-column">
                        <div className="location-section-box" style={{ padding: '15px' }}>
                            <label className="premium-label" style={{ color: '#8b5cf6', marginBottom: '12px', display: 'block' }}>🚨 Emergency Contact</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input
                                    placeholder="Contact Name"
                                    className="premium-field-input"
                                    value={formData.emergencyContact.name}
                                    onChange={e => handleContactChange('name', e.target.value)}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input
                                        placeholder="Relation"
                                        className="premium-field-input"
                                        value={formData.emergencyContact.relation}
                                        onChange={e => handleContactChange('relation', e.target.value)}
                                    />
                                    <input
                                        placeholder="Direct Phone"
                                        className="premium-field-input"
                                        value={formData.emergencyContact.phone}
                                        onChange={e => handleContactChange('phone', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <label className="premium-label">💶 Base Hourly Rate (TND)</label>
                            <input
                                type="number"
                                className="premium-field-input"
                                value={formData.baseRate}
                                onChange={e => handleChange('baseRate', parseFloat(e.target.value))}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                            <div>
                                <label className="premium-label">📅 Hire Date</label>
                                <input
                                    type="date"
                                    className="premium-field-input"
                                    value={formData.hireDate}
                                    onChange={e => handleChange('hireDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="premium-label">🎂 Birth Date</label>
                                <input
                                    type="date"
                                    className="premium-field-input"
                                    value={formData.birthDate}
                                    onChange={e => handleChange('birthDate', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer-actions" style={{ gridColumn: 'span 2' }}>
                        <button type="button" className="premium-cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="button" className="premium-save-btn" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} onClick={handleSubmit}>Save HR Expert Data</button>
                    </div>
                </div>

                <style>{`
                    .license-btn { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #64748b; padding: 6px 12px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 12px; }
                    .license-btn.active { background: #6366f1; color: white; border-color: #6366f1; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3); }
                    .license-btn:hover:not(.active) { background: rgba(255,255,255,0.1); color: white; }
                    
                    .add-btn-vibrant { background: #6366f1; color: white; border: none; padding: 0 15px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 13px; }
                    
                    .skill-tag { background: rgba(255,255,255,0.05); color: #e2e8f0; padding: 4px 10px; border-radius: 8px; font-size: 11px; display: flex; align-items: center; gap: 6px; border: 1px solid rgba(255,255,255,0.08); }
                    .skill-tag button { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; padding: 0; line-height: 1; }
                    
                    .email-status-btn { width: 100%; text-align: left; padding: 12px 18px; background: rgba(0,0,0,0.2); border: 1px dashed rgba(255,255,255,0.1); border-radius: 14px; color: #94a3b8; display: flex; flex-direction: column; cursor: pointer; transition: 0.2s; }
                    .email-status-btn:hover { border-color: #6366f1; background: rgba(99,102,241,0.05); }
                    .email-status-btn .edit-hint { font-size: 10px; color: #6366f1; font-weight: 800; text-transform: uppercase; margin-top: 2px; }
                `}</style>
            </div>
        </div>
    );
};

export default ProfileEditor;
