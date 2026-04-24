import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './Logistics.css';
import { CONFIG } from '../config';

const ClientView = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [formData, setFormData] = useState({
        name: '', customId: '', type: 'Société', matriculeFiscal: '', email: '', phone: '', address: '', contactPerson: '', notes: '', contacts: []
    });
    const API_URL = CONFIG.API_URL;
    const [searchTerm, setSearchTerm] = useState('');

    const canEdit = ['Founder', 'Manager'].includes(user?.role);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/clients`);
            setClients(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isReadOnly || !canEdit) return;
        try {
            if (formData._id) {
                await axios.put(`${API_URL}/clients/${formData._id}`, formData);
                showSuccess("Client information updated", "CRM");
            } else {
                await axios.post(`${API_URL}/clients`, formData);
                showSuccess("New client registered", "CRM");
            }
            setShowModal(false);
            fetchClients();
        } catch (err) {
            showError(err.response?.data?.error || err.message, "System Error");
        }
    };

    const handleView = (client) => {
        setFormData({ ...client, contacts: client.contacts || [] });
        setIsReadOnly(true);
        setShowModal(true);
    };

    const handleEdit = (client) => {
        setFormData({ ...client, contacts: client.contacts || [] });
        setIsReadOnly(!canEdit);
        setShowModal(true);
    };

    const switchToEdit = () => { if (canEdit) setIsReadOnly(false); };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this client?")) return;
        try {
            await axios.delete(`${API_URL}/clients/${id}`);
            showSuccess("Client deleted", "CRM");
            fetchClients();
        } catch (err) { showError("Failed to delete", "Error"); }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '40px 60px', maxWidth: '1600px', margin: '0 auto' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', margin: 0, color: '#fff' }}>Client Directory</h1>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage customer relationships and tax details</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                        <input
                            className="premium-field-input"
                            style={{ width: '300px', paddingLeft: '45px' }}
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {canEdit && (
                        <button className="premium-save-btn" onClick={() => { setFormData({ type: 'Société', contacts: [] }); setIsReadOnly(false); setShowModal(true); }}>
                            + New Client
                        </button>
                    )}
                </div>
            </div>

            {/* Client Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#6366f1' }}>Loading directory...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                    {filteredClients.map(client => (
                        <div key={client._id} className="client-premium-card" onClick={() => handleView(client)}>
                            <div className="client-card-type">{client.type}</div>
                            <h3 className="client-card-name">{client.name}</h3>
                            <p className="client-card-id">{client.customId || 'NO-ID'}</p>
                            
                            <div className="client-card-info">
                                <div className="info-row"><span>👤</span> {client.contactPerson || '-'}</div>
                                <div className="info-row"><span>📞</span> {client.phone || '-'}</div>
                                <div className="info-row" style={{ fontSize: '11px', opacity: 0.6 }}>{client.email || '-'}</div>
                            </div>

                            <div className="client-card-actions">
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(client); }}>Edit</button>
                                {canEdit && <button className="del" onClick={(e) => { e.stopPropagation(); handleDelete(client._id); }}>Delete</button>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Premium Modal */}
            {showModal && (
                <div className="modal-overlay-blur">
                    <div className="premium-modal-card" style={{ width: '750px' }}>
                        <div className="modal-header-vibrant">
                            <h2>{isReadOnly ? '👤 Client Profile' : (formData._id ? '✏️ Edit Client' : '✨ Register New Client')}</h2>
                            <button className="close-x-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="premium-form-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
                            <div className="form-column">
                                <label className="premium-label">Official Client Name *</label>
                                <input readOnly={isReadOnly} required className="premium-field-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '15px', marginTop: '20px' }}>
                                    <div>
                                        <label className="premium-label">Client Type</label>
                                        <select disabled={isReadOnly} className="premium-field-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                            <option>Société</option>
                                            <option>Particulier</option>
                                            <option>Association</option>
                                            <option>Public</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="premium-label">Client Number (ID)</label>
                                        <input readOnly={isReadOnly} className="premium-field-input" placeholder="e.g. CUS-93" value={formData.customId} onChange={e => setFormData({...formData, customId: e.target.value})} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '15px', marginTop: '20px' }}>
                                    <div>
                                        <label className="premium-label">Contact Person</label>
                                        <input readOnly={isReadOnly} className="premium-field-input" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="premium-label">Phone</label>
                                        <input readOnly={isReadOnly} className="premium-field-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px' }}>
                                    <label className="premium-label">Email Address</label>
                                    <input readOnly={isReadOnly} type="email" className="premium-field-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>

                                <div style={{ marginTop: '20px' }}>
                                    <label className="premium-label">Physical Address</label>
                                    <textarea readOnly={isReadOnly} className="premium-field-input" style={{ height: '80px' }} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                </div>

                                <div style={{ marginTop: '20px' }}>
                                    <label className="premium-label">Matricule Fiscal (Tax ID)</label>
                                    <input readOnly={isReadOnly} className="premium-field-input" value={formData.matriculeFiscal} onChange={e => setFormData({...formData, matriculeFiscal: e.target.value})} />
                                </div>
                            </div>

                            <div className="form-column" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label className="premium-label" style={{ color: '#6366f1', marginBottom: '15px', display: 'block' }}>👥 Additional Contacts</label>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                                    {formData.contacts.map((contact, idx) => (
                                        <div key={idx} className="sub-contact-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <input readOnly={isReadOnly} className="minimal-input bold" placeholder="Name" value={contact.name} onChange={e => {
                                                    const cc = [...formData.contacts]; cc[idx].name = e.target.value; setFormData({...formData, contacts: cc});
                                                }} />
                                                {!isReadOnly && <button type="button" onClick={() => {
                                                    const cc = [...formData.contacts]; cc.splice(idx, 1); setFormData({...formData, contacts: cc});
                                                }} className="del-mini">×</button>}
                                            </div>
                                            <input readOnly={isReadOnly} className="minimal-input" placeholder="Role (Accountant, etc)" value={contact.role} onChange={e => {
                                                const cc = [...formData.contacts]; cc[idx].role = e.target.value; setFormData({...formData, contacts: cc});
                                            }} />
                                            <input readOnly={isReadOnly} className="minimal-input small" placeholder="Phone/Email" value={contact.phone || contact.email} onChange={e => {
                                                const cc = [...formData.contacts]; cc[idx].phone = e.target.value; setFormData({...formData, contacts: cc});
                                            }} />
                                        </div>
                                    ))}
                                    
                                    {!isReadOnly && (
                                        <button type="button" className="add-contact-btn" onClick={() => setFormData({...formData, contacts: [...formData.contacts, {name: '', role: '', phone: ''}]})}>
                                            + Add Contact Person
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer-actions" style={{ gridColumn: 'span 2' }}>
                                <button type="button" className="premium-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                {!isReadOnly ? <button type="submit" className="premium-save-btn">Save Client</button> : (
                                    canEdit && <button type="button" className="premium-save-btn" onClick={switchToEdit}>Edit Details</button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .client-premium-card { background: #1a1b26; border-radius: 24px; padding: 25px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: 0.3s; position: relative; overflow: hidden; }
                .client-premium-card:hover { transform: translateY(-5px); border-color: #6366f1; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
                .client-card-type { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #6366f1; background: rgba(99,102,241,0.1); padding: 4px 10px; border-radius: 8px; display: inline-block; margin-bottom: 15px; }
                .client-card-name { font-size: 18px; font-weight: 700; color: #fff; margin: 0; }
                .client-card-id { font-size: 12px; color: #475569; margin: 4px 0 15px 0; }
                .client-card-info { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
                .info-row { font-size: 13px; color: #94a3b8; display: flex; gap: 8px; }
                .client-card-actions { display: flex; gap: 10px; border-top: 1px solid rgba(255,255,255,0.03); pt: 15px; }
                .client-card-actions button { background: rgba(255,255,255,0.03); border: none; color: #94a3b8; padding: 6px 15px; border-radius: 8px; font-size: 12px; cursor: pointer; }
                .client-card-actions button:hover { background: rgba(255,255,255,0.1); color: #fff; }
                .client-card-actions button.del:hover { color: #ef4444; }

                .sub-contact-card { background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.03); }
                .minimal-input { background: transparent; border: none; color: #fff; width: 100%; outline: none; margin-bottom: 4px; font-size: 13px; }
                .minimal-input.bold { font-weight: 700; font-size: 14px; }
                .minimal-input.small { font-size: 11px; color: #64748b; }
                .del-mini { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 18px; }
                .add-contact-btn { background: rgba(99,102,241,0.1); color: #6366f1; border: 1px dashed #6366f1; padding: 10px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 12px; margin-top: 10px; }
                .add-contact-btn:hover { background: rgba(99,102,241,0.2); }

                /* Reuse Global Modal Styles or define them if missing */
                .modal-overlay-blur { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; justify-content: center; alignItems: center; z-index: 2000; padding: 20px; }
                .premium-modal-card { background: #1a1b26; border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 100px rgba(0,0,0,0.6); position: relative; animation: modalPop 0.3s; overflow: hidden; }
                @keyframes modalPop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .modal-header-vibrant { padding: 30px 40px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to right, rgba(99,102,241,0.05), transparent); }
                .modal-header-vibrant h2 { margin: 0; font-size: 22px; color: #fff; }
                .close-x-btn { background: none; border: none; color: #475569; font-size: 28px; cursor: pointer; }
                .close-x-btn:hover { color: #fff; }
                .premium-form-grid { padding: 30px 40px; display: grid; gap: 30px; }
                .premium-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                .premium-field-input { width: 100%; padding: 13px 18px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; color: white; outline: none; transition: 0.2s; box-sizing: border-box; }
                .premium-field-input:focus { border-color: #6366f1; background: rgba(99,102,241,0.05); }
                .modal-footer-actions { display: flex; gap: 15px; margin-top: 10px; justify-content: flex-end; }
                .premium-save-btn { background: #6366f1; color: white; border: none; padding: 14px 28px; border-radius: 14px; font-weight: 700; cursor: pointer; }
                .premium-cancel-btn { background: rgba(255,255,255,0.05); color: #94a3b8; border: none; padding: 14px 28px; border-radius: 14px; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default ClientView;
