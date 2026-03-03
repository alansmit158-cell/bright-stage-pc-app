import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Logistics.css';
import { CONFIG } from '../config';

const ClientView = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [formData, setFormData] = useState({
        name: '', customId: '', type: 'Société', matriculeFiscal: '', email: '', phone: '', address: '', contactPerson: '', notes: ''
    });
    const API_URL = CONFIG.API_URL;

    const [searchTerm, setSearchTerm] = useState('');

    const { user } = useAuth();
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
            console.error("Error fetching clients", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.customId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isReadOnly || !canEdit) return;
        try {
            if (formData._id) {
                await axios.put(`${API_URL}/clients/${formData._id}`, formData);
            } else {
                await axios.post(`${API_URL}/clients`, formData);
            }
            setShowModal(false);
            fetchClients();
            setFormData({ name: '', customId: '', type: 'Société', matriculeFiscal: '', email: '', phone: '', address: '', contactPerson: '', notes: '' });
        } catch (err) {
            console.error("Save Error:", err);
            alert(`Failed to save client: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleView = (client) => {
        setFormData(client);
        setIsReadOnly(true); // Always open as ReadOnly first
        setShowModal(true);
    };

    const handleEdit = (client) => {
        setFormData(client);
        // If user cannot edit, force read only
        setIsReadOnly(!canEdit);
        setShowModal(true);
    };

    const switchToEdit = () => {
        if (canEdit) setIsReadOnly(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this client?")) return;
        try {
            await axios.delete(`${API_URL}/clients/${id}`);
            fetchClients();
        } catch (err) { alert('Failed to delete'); }
    };

    return (
        <div className="logistics-container">
            <div className="logistics-header">
                <div>
                    <h1 className="logistics-title">
                        Client Management
                        <span style={{ fontSize: '1rem', color: '#94a3b8', marginLeft: '10px', fontWeight: 'normal' }}>
                            ({filteredClients.length} / {clients.length})
                        </span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            outline: 'none',
                            fontSize: '0.9rem'
                        }}
                    />
                    {canEdit && (
                        <button
                            onClick={() => { setFormData({ type: 'Société' }); setIsReadOnly(false); setShowModal(true); }}
                            className="btn-add"
                        >
                            + Add New Client
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>Loading clients...</div>
            ) : (
                <div className="logistics-grid">
                    {filteredClients.map(client => (
                        <div
                            key={client._id}
                            className="logistics-card"
                            onClick={() => handleView(client)}
                            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div className="card-header">
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <h3 className="card-title">{client.name}</h3>
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>{client.customId}</span>
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                            color: '#818cf8',
                                            border: '1px solid rgba(99, 102, 241, 0.2)'
                                        }}>
                                            {client.type}
                                        </span>
                                    </div>
                                    <p className="card-subtitle" style={{ marginTop: '5px' }}>
                                        Contact: <span style={{ color: '#e2e8f0' }}>{client.contactPerson || '-'}</span>
                                    </p>
                                    <p className="card-subtitle">
                                        Phone: <span style={{ color: '#93c5fd' }}>{client.phone || '-'}</span>
                                    </p>
                                    <p className="card-subtitle" style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {client.email || '-'}
                                    </p>
                                </div>
                            </div>
                            <div className="card-actions" style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                                <button onClick={(e) => { e.stopPropagation(); handleView(client); }} className="btn-text">View Details</button>
                                {canEdit && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(client); }} className="btn-text btn-edit">Edit</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(client._id); }} className="btn-text btn-delete">Delete</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'white' }}>
                            {isReadOnly ? 'Client Details' : (formData._id ? 'Edit Client' : 'Add New Client')}
                        </h2>

                        {isReadOnly ? (
                            <div className="readonly-view" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Client Name</label>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formData.name} {formData.customId && <span style={{ color: '#3b82f6', fontSize: '0.9rem', marginLeft: '10px' }}>({formData.customId})</span>}</div>
                                </div>

                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Type</label>
                                    <div>{formData.type}</div>
                                </div>

                                {formData.contactPerson && (
                                    <div>
                                        <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Contact Person</label>
                                        <div>{formData.contactPerson}</div>
                                    </div>
                                )}

                                {formData.phone && (
                                    <div>
                                        <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Phone</label>
                                        <div style={{ color: '#93c5fd' }}>{formData.phone}</div>
                                    </div>
                                )}

                                {formData.email && (
                                    <div>
                                        <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Email</label>
                                        <div>{formData.email}</div>
                                    </div>
                                )}

                                {formData.address && (
                                    <div>
                                        <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Address</label>
                                        <div style={{ whiteSpace: 'pre-wrap' }}>{formData.address}</div>
                                    </div>
                                )}

                                {formData.matriculeFiscal && (
                                    <div>
                                        <label style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Matricule Fiscal</label>
                                        <div>{formData.matriculeFiscal}</div>
                                    </div>
                                )}

                                {formData.contacts && formData.contacts.length > 0 && (
                                    <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                                        <label style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>Additional Contacts</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {formData.contacts.map((contact, idx) => (
                                                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{contact.name}</div>
                                                    <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{contact.role}</div>
                                                    {(contact.phone || contact.email) && (
                                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                                                            {contact.phone} {contact.phone && contact.email ? '•' : ''} {contact.email}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="form-actions" style={{ marginTop: '20px' }}>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Close</button>
                                    {canEdit && (
                                        <button
                                            type="button"
                                            onClick={switchToEdit}
                                            className="btn-save"
                                            style={{ backgroundColor: '#3b82f6' }}
                                        >
                                            Edit Client
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Client Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="form-input"
                                            value={formData.name || ''}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Client Number (ID)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. CUS-93"
                                            className="form-input"
                                            value={formData.customId || ''}
                                            onChange={e => setFormData({ ...formData, customId: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        value={formData.type || 'Société'}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option>Société</option>
                                        <option>Particulier</option>
                                        <option>Association</option>
                                        <option>Public</option>
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Contact Person</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.contactPerson || ''}
                                            onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.phone || ''}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email || ''}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        className="form-input"
                                        style={{ resize: 'vertical', minHeight: '60px' }}
                                        value={formData.address || ''}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Matricule Fiscal (Tax ID)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.matriculeFiscal || ''}
                                        onChange={e => setFormData({ ...formData, matriculeFiscal: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                                        Additional Contacts (Site Managers, Accountants, etc.)
                                    </label>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                                        {(formData.contacts || []).map((contact, index) => (
                                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
                                                <input
                                                    className="form-input"
                                                    placeholder="Name"
                                                    value={contact.name || ''}
                                                    onChange={e => {
                                                        const newContacts = [...(formData.contacts || [])];
                                                        newContacts[index].name = e.target.value;
                                                        setFormData({ ...formData, contacts: newContacts });
                                                    }}
                                                />
                                                <input
                                                    className="form-input"
                                                    placeholder="Role (e.g. Site Mgr)"
                                                    value={contact.role || ''}
                                                    onChange={e => {
                                                        const newContacts = [...(formData.contacts || [])];
                                                        newContacts[index].role = e.target.value;
                                                        setFormData({ ...formData, contacts: newContacts });
                                                    }}
                                                />
                                                <input
                                                    className="form-input"
                                                    placeholder="Phone"
                                                    value={contact.phone || ''}
                                                    onChange={e => {
                                                        const newContacts = [...(formData.contacts || [])];
                                                        newContacts[index].phone = e.target.value;
                                                        setFormData({ ...formData, contacts: newContacts });
                                                    }}
                                                />
                                                <input
                                                    className="form-input"
                                                    placeholder="Email"
                                                    value={contact.email || ''}
                                                    onChange={e => {
                                                        const newContacts = [...(formData.contacts || [])];
                                                        newContacts[index].email = e.target.value;
                                                        setFormData({ ...formData, contacts: newContacts });
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newContacts = [...(formData.contacts || [])];
                                                        newContacts.splice(index, 1);
                                                        setFormData({ ...formData, contacts: newContacts });
                                                    }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }}
                                                    title="Remove Contact"
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newContacts = [...(formData.contacts || [])];
                                                newContacts.push({ name: '', role: '', phone: '', email: '' });
                                                setFormData({ ...formData, contacts: newContacts });
                                            }}
                                            style={{
                                                alignSelf: 'flex-start',
                                                padding: '10px 20px',
                                                fontSize: '0.9rem',
                                                backgroundColor: '#6366f1', // Indigo-500
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                transition: 'all 0.2s',
                                                marginTop: '10px'
                                            }}
                                            onMouseOver={e => {
                                                e.currentTarget.style.backgroundColor = '#4f46e5'; // Indigo-600
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseOut={e => {
                                                e.currentTarget.style.backgroundColor = '#6366f1';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <span style={{ fontSize: '1.2em', lineHeight: '1' }}>+</span> Add Contact Person
                                        </button>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Cancel</button>
                                    <button type="submit" className="btn-save">Save Client</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientView;
