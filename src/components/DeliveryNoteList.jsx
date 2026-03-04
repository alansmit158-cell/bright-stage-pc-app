import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Logistics.css';

import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const DeliveryNoteList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Permission check: Founder/Manager OR Site Manager
    const canAccess = ['Founder', 'Manager', 'Site Manager'].includes(user?.role);
    const canCreate = ['Founder', 'Manager', 'Site Manager'].includes(user?.role);

    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await axios.get(`${API_URL}/delivery-notes`);
            setNotes(res.data);
        } catch (err) {
            console.error("Error fetching notes:", err);
            if (err.response?.status === 403) {
                alert("Unauthorized access");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this Delivery Note?")) return;
        try {
            await axios.delete(`${API_URL}/delivery-notes/${id}`);
            fetchNotes();
        } catch (err) {
            alert("Error deleting note: " + (err.response?.data?.error || err.message));
        }
    };

    const handleDownloadPdf = async (id, number) => {
        try {
            const res = await axios.get(`${API_URL}/delivery-notes/${id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            alert("Error downloading PDF");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    if (!canAccess) return <div className="text-white text-center mt-10">Unauthorized</div>;

    return (
        <div className="logistics-container">
            <div className="logistics-header">
                <h1 className="logistics-title">
                    Bons de Livraison
                </h1>
                {canCreate && (
                    <button
                        onClick={() => navigate('/delivery-notes/new')}
                        className="btn-add"
                    >
                        + Créer Nouveau BL
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>Chargement...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" style={{ color: '#cbd5e1' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                <th className="p-4">BL N°</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Projet</th>
                                <th className="p-4">Transporteur</th>
                                <th className="p-4">Véhicule</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notes.map(note => (
                                <tr key={note._id} style={{ borderBottom: '1px solid #1e293b' }} className="hover:bg-slate-800/50">
                                    <td className="p-4 font-bold text-white">{note.number}</td>
                                    <td className="p-4">{formatDate(note.date)}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-white">{note.project?.eventName || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">{note.project?.siteName}</div>
                                    </td>
                                    <td className="p-4">
                                        {note.carrier ? `${note.carrier.firstName} ${note.carrier.lastName}` : (note.driverName || '-')}
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs bg-slate-700 px-2 py-1 rounded">
                                            {note.vehiclePlate || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                            backgroundColor: note.status === 'Validated' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                                            color: note.status === 'Validated' ? '#4ade80' : '#cbd5e1'
                                        }}>
                                            {note.status === 'Validated' ? 'Validé' : note.status === 'Draft' ? 'Brouillon' : note.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDownloadPdf(note._id, note.number)}
                                            className="text-emerald-400 hover:text-emerald-300 mr-3 text-sm"
                                        >
                                            PDF
                                        </button>
                                        <button
                                            onClick={() => navigate(`/delivery-notes/edit/${note._id}`)}
                                            className="text-blue-400 hover:text-blue-300 mr-3 text-sm"
                                        >
                                            Éditer
                                        </button>
                                        <button
                                            onClick={() => handleDelete(note._id)}
                                            className="text-red-400 hover:text-red-300 text-sm"
                                        >
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {notes.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">
                                        Aucun bon de livraison trouvé.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DeliveryNoteList;
