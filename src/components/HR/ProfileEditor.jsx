import React, { useState } from 'react';
import axios from 'axios';

const API_URL = `http://${window.location.hostname}:5000/api`;

const ProfileEditor = ({ user, onClose, onUpdate }) => {
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
            await axios.put(`${API_URL}/users/${user._id}`, formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert("Profile Updated Successfully");
            onUpdate();
            onClose();
        } catch (err) {
            alert("Error updating profile: " + err.message);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Edit Expert Profile: {user.name}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

                {/* Driving Licenses */}
                <div className="form-group">
                    <label className="label-text">Driving Licenses</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {['A', 'B', 'BE', 'C', 'CE', 'D', 'DE'].map(lic => (
                            <button
                                key={lic}
                                onClick={() => toggleLicense(lic)}
                                style={{
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    border: '1px solid #3b82f6',
                                    backgroundColor: formData.drivingLicenses.includes(lic) ? '#3b82f6' : 'transparent',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                {lic}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Technical Skills */}
                <div className="form-group">
                    <label className="label-text">Technical Skills</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <input
                            type="text"
                            className="styled-input"
                            placeholder="Add skill (e.g. Sound Engineer)"
                            value={newSkill}
                            onChange={e => setNewSkill(e.target.value)}
                        />
                        <button className="btn-primary" onClick={addSkill}>Add</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {formData.technicalSkills.map(skill => (
                            <span key={skill} style={{ backgroundColor: '#4b5563', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {skill}
                                <span onClick={() => removeSkill(skill)} style={{ cursor: 'pointer', color: '#fca5a5' }}>&times;</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="form-group" style={{ border: '1px solid #333', padding: '10px', borderRadius: '8px' }}>
                    <label className="label-text" style={{ marginBottom: '10px', display: 'block' }}>Emergency Contact</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input
                            placeholder="Name"
                            className="styled-input"
                            value={formData.emergencyContact.name}
                            onChange={e => handleContactChange('name', e.target.value)}
                        />
                        <input
                            placeholder="Relation"
                            className="styled-input"
                            value={formData.emergencyContact.relation}
                            onChange={e => handleContactChange('relation', e.target.value)}
                        />
                        <input
                            placeholder="Phone"
                            className="styled-input"
                            style={{ gridColumn: 'span 2' }}
                            value={formData.emergencyContact.phone}
                            onChange={e => handleContactChange('phone', e.target.value)}
                        />
                    </div>
                </div>

                {/* HR Data */}
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label className="label-text">Hourly Base Rate (€)</label>
                        <input
                            type="number"
                            className="styled-input"
                            value={formData.baseRate}
                            onChange={e => handleChange('baseRate', parseFloat(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="label-text">Hire Date</label>
                        <input
                            type="date"
                            className="styled-input"
                            value={formData.hireDate}
                            onChange={e => handleChange('hireDate', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label-text">Birth Date</label>
                        <input
                            type="date"
                            className="styled-input"
                            value={formData.birthDate}
                            onChange={e => handleChange('birthDate', e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button className="btn-primary" onClick={handleSubmit}>Save Profile</button>
                </div>
            </div>
        </div>
    );
};

export default ProfileEditor;
