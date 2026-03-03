import React, { useEffect, useState } from 'react';
import { inventoryService } from '../services/inventoryService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import InventoryForm from './InventoryForm';
import QRCode from 'react-qr-code';
import api from '../services/api';

const InventoryList = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [qrItem, setQrItem] = useState(null); // Item to show QR for
    const [historyItem, setHistoryItem] = useState(null);
    const [historyData, setHistoryData] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    // File Import Reference
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const data = await inventoryService.getAll();
            setItems(data);
        } catch (err) {
            alert('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const res = await api.post('/inventory/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const result = res.data;

            alert(`Import Complete!\nAdded: ${result.added}\nUpdated: ${result.updated}`);
            loadInventory();
        } catch (err) {
            alert(`Import Failed: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowForm(true);
    };

    const handleMarkBroken = async (item) => {
        const qtyStr = window.prompt(`How many ${item.name} are broken?`, "1");
        if (!qtyStr) return; // Cancelled
        const qty = parseInt(qtyStr, 10);
        if (isNaN(qty) || qty <= 0 || qty > item.quantity) {
            alert("Invalid quantity. Must be between 1 and " + item.quantity);
            return;
        }

        const description = window.prompt("Brief description of the issue (optional):", "Reported as broken from PC app");
        if (description === null) return; // Cancelled

        try {
            setLoading(true);
            await inventoryService.reportIssue(item._id, {
                quantity: qty,
                issueDescription: description || "No description provided",
                severity: "Critical",
                reportedBy: user?.username || "Admin"
            });
            alert(`Reported ${qty}x ${item.name} as broken.`);
            loadInventory();
        } catch (err) {
            alert("Failed to report broken item: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            setLoading(true);
            await inventoryService.delete(id);
            loadInventory();
        } catch (err) {
            alert("Failed to delete item");
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = async (item) => {
        setHistoryItem(item);
        setHistoryLoading(true);
        try {
            const data = await inventoryService.getHistory(item._id);
            setHistoryData(data);
        } catch (err) {
            alert("Failed to load history");
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingItem(null);
        loadInventory();
    };

    // Derived Data
    const uniqueCategories = [...new Set(items.map(item => item.category || 'Uncategorized'))].sort();

    const filteredItems = items.filter(item => {
        const matchesName = item.name.toLowerCase().includes(filter.toLowerCase()) ||
            item.brand?.toLowerCase().includes(filter.toLowerCase()) ||
            item.category?.toLowerCase().includes(filter.toLowerCase());
        const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
        return matchesName && matchesCategory;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const changePage = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleDownloadQRs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/inventory/qr-export', { responseType: 'blob' });

            // Create Blob URL
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Global_QR_Codes.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download Error", err);
            alert("Failed to download QR codes.");
        } finally {
            setLoading(false);
        }
    };

    const { user } = useAuth(); // Get user from context
    const { t } = useLanguage();

    const getCategoryColor = (category) => {
        const cat = (category || '').toLowerCase();

        // Son
        if (cat.includes('son') || cat.includes('xlr') || cat.includes('micro')) {
            return { background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
        }
        // Lumière
        if (cat.includes('lumière') || cat.includes('dmx')) {
            return { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
        }
        // Vidéo / LED
        if (cat.includes('led') || cat.includes('image') || cat.includes('télé') || cat.includes('cinéma')) {
            return { background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' };
        }
        // Câblage
        if (cat.includes('câblage') || cat.includes('électrique') || cat.includes('distribution')) {
            return { background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
        }
        // Structure / Scène
        if (cat.includes('structure') || cat.includes('scène') || cat.includes('tissus')) {
            return { background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8' };
        }
        // Informatique
        if (cat.includes('informatique') || cat.includes('bureautique')) {
            return { background: 'rgba(79, 70, 229, 0.2)', color: '#6366f1' };
        }

        return { background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }; // Default indigo
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', margin: 0 }}>{t('inventory')}</h1>
                <div style={{ display: 'flex', gap: '10px' }}>

                    {/* Only Founder, Manager, Storekeeper can Import/Add */}
                    {['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                title="import_excel_hidden"
                            />
                            <button
                                className="btn"
                                style={{ background: '#059669' }}
                                onClick={() => fileInputRef.current.click()}
                            >
                                📊 {t('import_excel')}
                            </button>
                            <button
                                className="btn"
                                style={{ background: '#4f46e5' }}
                                onClick={handleDownloadQRs}
                                title="Download All Item & Flycase QR Codes"
                            >
                                🖨️ Global QR
                            </button>
                            <button className="btn" onClick={() => { setEditingItem(null); setShowForm(true); }}>
                                + {t('add_equip')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder={t('search_equip')}
                    value={filter}
                    onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid #333',
                        color: 'white',
                        borderRadius: '8px',
                        outline: 'none'
                    }}
                />
                <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                    style={{
                        padding: '12px',
                        background: '#1e293b',
                        border: '1px solid #475569',
                        color: 'white',
                        borderRadius: '8px',
                        outline: 'none',
                        minWidth: '200px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="" style={{ background: '#1e293b', color: 'white' }}>{t('all_cats')}</option>
                    {uniqueCategories.map(cat => (
                        <option key={cat} value={cat} style={{ background: '#1e293b', color: 'white' }}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                            <th style={{ padding: '16px' }}>{t('name')}</th>
                            <th style={{ padding: '16px' }}>{t('brand')}</th>
                            <th style={{ padding: '16px' }}>{t('model')}</th>
                            <th style={{ padding: '16px' }}>{t('category')}</th>
                            <th style={{ padding: '16px' }}>{t('qty')}</th>
                            <th style={{ padding: '16px' }}>{t('state')}</th>
                            <th style={{ padding: '16px' }}>{t('location')}</th>
                            <th style={{ padding: '16px' }}>{t('action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
                        ) : currentItems.length === 0 ? (
                            <tr><td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No items found</td></tr>
                        ) : (
                            currentItems.map(item => (
                                <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: '0.2s' }}>
                                    <td style={{ padding: '16px', fontWeight: '500' }}>{item.name}</td>
                                    <td style={{ padding: '16px', color: '#94a3b8' }}>{item.brand}</td>
                                    <td style={{ padding: '16px', color: '#94a3b8' }}>{item.model}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            ...getCategoryColor(item.category),
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            {item.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>{item.quantity}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            color: item.state === 'Fonctionnel' ? '#10b981' : '#ef4444'
                                        }}>
                                            {item.state}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '13px', color: '#94a3b8' }}>
                                        {item.storageLocation?.zone || '-'} / {item.storageLocation?.shelving || '-'}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {/* View QR Code Button */}
                                            <button
                                                onClick={() => setQrItem(item)}
                                                className="btn"
                                                title="QR Code"
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    color: '#fff',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    padding: '6px',
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '6px'
                                                }}
                                            >
                                                📶
                                            </button>

                                            {/* View History Button */}
                                            <button
                                                onClick={() => handleViewHistory(item)}
                                                className="btn"
                                                title="View History"
                                                style={{
                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                    color: '#60a5fa',
                                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                                    padding: '6px',
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '6px'
                                                }}
                                            >
                                                📜
                                            </button>

                                            {['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && (
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="btn"
                                                    title="Edit"
                                                    style={{
                                                        background: 'rgba(99, 102, 241, 0.1)',
                                                        color: '#818cf8',
                                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                                        padding: '6px',
                                                        fontSize: '14px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '6px'
                                                    }}
                                                >
                                                    ✏️
                                                </button>
                                            )}
                                            {['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && item.state !== 'Cassé' && (
                                                <button
                                                    onClick={() => handleMarkBroken(item)}
                                                    className="btn"
                                                    title="Mark as Broken"
                                                    style={{
                                                        background: 'rgba(245, 158, 11, 0.1)',
                                                        color: '#fbbf24',
                                                        border: '1px solid rgba(245, 158, 11, 0.2)',
                                                        padding: '6px',
                                                        fontSize: '14px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '6px'
                                                    }}
                                                >
                                                    ⚠️
                                                </button>
                                            )}
                                            {['Founder', 'Manager'].includes(user?.role) && (
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="btn"
                                                    title="Delete"
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#fca5a5',
                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                        padding: '6px',
                                                        fontSize: '14px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '6px'
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '15px' }}>
                    <button
                        onClick={() => changePage(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                            padding: '8px 16px',
                            background: currentPage === 1 ? 'rgba(255,255,255,0.1)' : '#6366f1',
                            color: currentPage === 1 ? '#666' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Previous
                    </button>
                    <span style={{ color: '#aaa' }}>Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => changePage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                            padding: '8px 16px',
                            background: currentPage === totalPages ? 'rgba(255,255,255,0.1)' : '#6366f1',
                            color: currentPage === totalPages ? '#666' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* History Modal */}
            {historyItem && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(5px)'
                }} onClick={() => { setHistoryItem(null); setHistoryData(null); }}>
                    <div style={{
                        backgroundColor: '#111827',
                        padding: '30px',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        maxWidth: '800px',
                        width: '95%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }} onClick={e => e.stopPropagation()}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>📜 Item Lifecycle History</h2>
                                <p style={{ color: '#94a3b8', margin: '5px 0 0 0' }}>{historyItem.name} ({historyItem.brand} {historyItem.model})</p>
                            </div>
                            <button onClick={() => { setHistoryItem(null); setHistoryData(null); }} style={{ background: 'none', border: 'none', color: '#666', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                        </div>

                        {historyLoading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#6366f1' }}>Loading full history...</div>
                        ) : historyData ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                                {/* Maintenance History */}
                                <div>
                                    <h3 style={{ color: '#ef4444', fontSize: '16px', marginBottom: '15px', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '8px' }}>
                                        🔧 Maintenance & Repair History
                                    </h3>
                                    {historyData.maintenance.length === 0 ? (
                                        <p style={{ color: '#444', fontStyle: 'italic', fontSize: '14px' }}>No maintenance records found.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {historyData.maintenance.map((ticket, i) => (
                                                <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: '3px solid #ef4444' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                        <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>{ticket.issueDescription}</span>
                                                        <span style={{ fontSize: '11px', color: '#666' }}>{new Date(ticket.dateReported).toLocaleDateString()}</span>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                        Status: <span style={{ color: ticket.status === 'Fixed' ? '#10b981' : '#f59e0b' }}>{ticket.status}</span> |
                                                        Reported by: {ticket.reportedBy}
                                                    </div>
                                                    {ticket.repairNotes && <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>Note: {ticket.repairNotes}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Rental History */}
                                <div>
                                    <h3 style={{ color: '#3b82f6', fontSize: '16px', marginBottom: '15px', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '8px' }}>
                                        📦 Rental & Outings History (Sorties)
                                    </h3>
                                    {historyData.rentals.length === 0 ? (
                                        <p style={{ color: '#444', fontStyle: 'italic', fontSize: '14px' }}>No rental records found.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {historyData.rentals.map((rental, i) => (
                                                <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: '3px solid #3b82f6' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                        <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>{rental.eventName}</span>
                                                        <span style={{ fontSize: '11px', color: '#666' }}>
                                                            {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                        Client: {rental.clientName} |
                                                        Qty Out: <span style={{ color: '#fff', fontWeight: 'bold' }}>{rental.quantity}</span> |
                                                        Status: <span style={{ color: '#60a5fa' }}>{rental.status}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        ) : (
                            <div style={{ color: '#666' }}>No data available.</div>
                        )}

                        <div style={{ marginTop: '30px', textAlign: 'right' }}>
                            <button
                                className="btn"
                                onClick={() => { setHistoryItem(null); setHistoryData(null); }}
                                style={{ background: '#374151', borderRadius: '10px', padding: '10px 25px' }}
                            >
                                Close History
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <InventoryForm
                    itemToEdit={editingItem}
                    onClose={() => setShowForm(false)}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* QR Code Modal */}
            {qrItem && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }} onClick={() => setQrItem(null)}>
                    <div style={{
                        backgroundColor: '#1e293b',
                        padding: '30px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        maxWidth: '400px',
                        width: '90%'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ color: 'white', marginTop: 0 }}>QR Code</h2>
                        <p style={{ color: '#94a3b8' }}>{qrItem.name}</p>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', display: 'inline-block' }}>
                            <QRCode value={`brightstage://inventory/${qrItem.barcode || qrItem._id}`} size={200} />
                        </div>
                        <p style={{ color: '#6366f1', fontSize: '12px', margin: '15px 0' }}>
                            {qrItem.barcode || qrItem._id}
                        </p>
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                className="btn"
                                onClick={() => window.print()}
                                style={{ background: '#059669' }}
                            >
                                🖨️ Print
                            </button>
                            <button
                                className="btn"
                                onClick={() => setQrItem(null)}
                                style={{ background: '#475569' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryList;
