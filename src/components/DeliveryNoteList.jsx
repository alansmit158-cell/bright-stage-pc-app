import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import DeliveryNoteForm from './DeliveryNoteForm';
import './Logistics.css';
import { FileText, Download, Edit3, Trash2, Plus, Search } from 'lucide-react';
import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const DeliveryNoteList = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();

    const canAccess = ['Founder', 'Manager', 'Site Manager'].includes(user?.role);
    const canCreate = ['Founder', 'Manager', 'Site Manager'].includes(user?.role);

    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [showCompanySelect, setShowCompanySelect] = useState(false);
    const [activeNote, setActiveNote] = useState(null);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await axios.get(`${API_URL}/delivery-notes`);
            setNotes(res.data);
        } catch (err) {
            console.error("Error fetching notes:", err);
            if (err.response?.status === 403) showError("Unauthorized access", "Auth Error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this Delivery Note permanently?")) return;
        try {
            await axios.delete(`${API_URL}/delivery-notes/${id}`);
            showSuccess("Registry entry deleted", "Logistics");
            fetchNotes();
        } catch (err) {
            showError("Deletetion failed", "Error");
        }
    };

    const handleDownloadPdf = async (id, number, companyId = 'bright') => {
        try {
            showSuccess("Preparing PDF...", "System");
            const res = await axios.get(`${API_URL}/delivery-notes/${id}/pdf?company=${companyId}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `BL-${number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            showError("PDF generation failed", "Error");
        }
    };

    const openCreateModal = () => {
        setEditingNoteId(null);
        setShowModal(true);
    };

    const openEditModal = (id) => {
        setEditingNoteId(id);
        setShowModal(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const filteredNotes = notes.filter(n => 
        n.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.project?.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!canAccess) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>Access Denied</div>;

    return (
        <div style={{ padding: '40px 60px', maxWidth: '1600px', margin: '0 auto' }}>
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: '#fff', letterSpacing: '-1px' }}>
                        Dispatch Registry
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Technical equipment movement tracking & BL archive</p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="search-box-v2">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by BL#, Project or Driver..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {canCreate && (
                        <button onClick={openCreateModal} className="premium-btn-dispatch">
                            <Plus size={18} /> Generate New Note
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#6366f1', padding: '100px' }}>Retrieving Shipment Logs...</div>
            ) : (
                <div className="dispatch-table-container">
                    <table className="premium-logistics-table">
                        <thead>
                            <tr>
                                <th>Registry ID</th>
                                <th>Date</th>
                                <th>Operational Context</th>
                                <th>Transport Agent</th>
                                <th>Fleet Status</th>
                                <th style={{ textAlign: 'right' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredNotes.map(note => (
                                <tr key={note._id}>
                                    <td className="note-number-cell">
                                        <div className="number-badge">{note.number}</div>
                                    </td>
                                    <td>
                                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>{formatDate(note.date)}</div>
                                    </td>
                                    <td>
                                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}>{note.project?.eventName || 'General BL'}</div>
                                        <div style={{ color: '#475569', fontSize: '11px', fontWeight: '700' }}>{note.project?.siteName || 'Individual Shipment'}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="agent-avatar">{note.driverName?.charAt(0) || 'D'}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '13px' }}>{note.driverName || 'External'}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span className={`status-pill ${note.status?.toLowerCase()}`}>{note.status}</span>
                                            <span style={{ fontSize: '10px', color: '#475569' }}>{note.vehiclePlate || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => {
                                                setActiveNote(note);
                                                setShowCompanySelect(true);
                                            }} className="row-action-btn pdf" title="Export PDF"><Download size={16} /></button>
                                            <button onClick={() => openEditModal(note._id)} className="row-action-btn edit" title="Modify registry"><Edit3 size={16} /></button>
                                            <button onClick={() => handleDelete(note._id)} className="row-action-btn delete" title="Remove entry"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredNotes.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.01)', borderRadius: '0 0 28px 28px' }}>
                            <FileText size={48} style={{ color: '#1e293b', marginBottom: '15px' }} />
                            <p style={{ color: '#475569', margin: 0, fontWeight: '700' }}>No dispatch notes found matching your criteria</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Integration */}
            {showModal && (
                <DeliveryNoteForm 
                    id={editingNoteId} 
                    onClose={() => setShowModal(false)} 
                    onSuccess={() => {
                        fetchNotes();
                        setShowModal(false);
                    }} 
                />
            )}

            {showCompanySelect && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 
                }}>
                    <div style={{ 
                        maxWidth: '450px', width: '90%', padding: '40px', 
                        background: '#1a1b26', border: '1px solid rgba(255, 255, 255, 0.1)', 
                        borderRadius: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '15px' }}>🏢</div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: '0' }}>Select Company</h2>
                            <p style={{ color: '#94a3b8', marginTop: '10px' }}>Choose the company profile for this BL PDF</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <button onClick={() => { handleDownloadPdf(activeNote._id, activeNote.number, 'bright'); setShowCompanySelect(false); }}
                                style={{ padding: '16px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontSize: '16px', fontWeight: '700', borderRadius: '16px', border: 'none', cursor: 'pointer' }}>
                                🚀 Bright Stage
                            </button>
                            <button onClick={() => { handleDownloadPdf(activeNote._id, activeNote.number, 'square'); setShowCompanySelect(false); }}
                                style={{ padding: '16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: '16px', fontWeight: '700', borderRadius: '16px', border: 'none', cursor: 'pointer' }}>
                                🔳 Square Event
                            </button>
                            <button onClick={() => setShowCompanySelect(false)}
                                style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', padding: '12px', borderRadius: '16px', marginTop: '10px', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .premium-btn-dispatch { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2); }
                .search-box-v2 { background: #1a1b26; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 0 15px; display: flex; align-items: center; gap: 10px; color: #475569; width: 300px; }
                .search-box-v2 input { background: transparent; border: none; padding: 12px 0; color: #fff; outline: none; font-size: 13px; width: 100%; }
                
                .dispatch-table-container { background: #1a1b26; border-radius: 28px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; }
                .premium-logistics-table { width: 100%; border-collapse: collapse; }
                .premium-logistics-table th { background: rgba(255,255,255,0.02); padding: 20px; text-align: left; color: #475569; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .premium-logistics-table td { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.02); }
                .premium-logistics-table tr:hover td { background: rgba(255,255,255,0.01); }
                
                .number-badge { display: inline-block; background: rgba(99, 102, 241, 0.1); color: #6366f1; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 12px; font-family: 'JetBrains Mono', monospace; }
                .agent-avatar { width: 32px; height: 32px; background: #2d2e3e; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #6366f1; font-weight: 800; font-size: 12px; }
                
                .status-pill { font-size: 10px; font-weight: 900; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; width: fit-content; }
                .status-pill.validated { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .status-pill.draft { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }
                .status-pill.cancelled { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

                .row-action-btn { background: rgba(255,255,255,0.03); border: none; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; color: #94a3b8; }
                .row-action-btn:hover { background: rgba(255,255,255,0.08); color: #fff; transform: translateY(-2px); }
                .row-action-btn.pdf:hover { color: #10b981; }
                .row-action-btn.edit:hover { color: #6366f1; }
                .row-action-btn.delete:hover { color: #ef4444; }
            `}</style>
        </div>
    );
};

export default DeliveryNoteList;
