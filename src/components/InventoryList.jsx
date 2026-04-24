import React, { useEffect, useState } from 'react';
import { inventoryService } from '../services/inventoryService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import InventoryForm from './InventoryForm';
import QRCode from 'react-qr-code';
import api from '../services/api';
import { 
    Search, Plus, Upload, QrCode, History, Edit, 
    AlertCircle, Trash2, Box, MapPin, Layers, ChevronRight,
    Printer, Download
} from 'lucide-react';

const InventoryList = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [qrItem, setQrItem] = useState(null);
    const [historyItem, setHistoryItem] = useState(null);
    const [historyData, setHistoryData] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

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
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const changePage = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            alert(`Import Complete!\nAdded: ${res.data.added}\nUpdated: ${res.data.updated}`);
            loadInventory();
        } catch (err) {
            alert(`Import Failed: ${err.message}`);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleMarkBroken = async (item) => {
        const qtyStr = window.prompt(`How many ${item.name} are broken?`, "1");
        if (!qtyStr) return;
        const qty = parseInt(qtyStr, 10);
        if (isNaN(qty) || qty <= 0 || qty > item.quantity) {
            alert("Invalid quantity.");
            return;
        }
        const description = window.prompt("Description of the issue:", "Reported from app");
        try {
            setLoading(true);
            await inventoryService.reportIssue(item._id, {
                quantity: qty,
                issueDescription: description || "Broken",
                severity: "Critical",
                reportedBy: user?.name || "Admin"
            });
            loadInventory();
        } catch (err) {
            alert("Failed to report broken item");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will permanently remove this asset.")) return;
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

    const handleDeleteAll = async () => {
        const confirm1 = window.confirm("🚨 DANGEROUS ACTION: Are you sure you want to delete EVERY item in the inventory?");
        if (!confirm1) return;
        
        const confirm2 = window.prompt("Type 'DELETE ALL' to confirm this action:");
        if (confirm2 !== 'DELETE ALL') {
            alert("Action cancelled. Confirmation text did not match.");
            return;
        }

        try {
            setLoading(true);
            await inventoryService.deleteAll();
            alert("Inventory cleared successfully.");
            loadInventory();
        } catch (err) {
            alert("Failed to clear inventory: " + (err.response?.data?.error || err.message));
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

    const handleDownloadQRs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/inventory/qr-export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Global_QR_Codes.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert("Failed to download QR codes.");
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category) => {
        const cat = (category || '').toLowerCase();
        if (cat.includes('son')) return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' };
        if (cat.includes('lumière')) return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' };
        if (cat.includes('led') || cat.includes('vidéo')) return { bg: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: 'rgba(139, 92, 246, 0.2)' };
        if (cat.includes('câblage')) return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.2)' };
        if (cat.includes('structure')) return { bg: 'rgba(100, 116, 139, 0.1)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.2)' };
        return { bg: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.2)' };
    };

    const uniqueCategories = [...new Set(items.map(item => item.category || 'Uncategorized'))].sort();
    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(filter.toLowerCase()) || 
                             item.brand?.toLowerCase().includes(filter.toLowerCase());
        const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div style={{ padding: '60px 80px', maxWidth: '1800px', margin: '0 auto', color: '#fff' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', color: '#6366f1' }}>
                            <Box size={28} />
                        </div>
                        <h1 style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '-1.5px', margin: 0 }}>{t('inventory')}</h1>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '15px', fontWeight: '500', marginLeft: '50px' }}>Manage and track your audio-visual infrastructure</p>
                </div>
                <div style={{ display: 'flex', gap: '14px' }}>
                    {['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && (
                        <>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx, .xls" onChange={handleFileUpload} />
                            <button className="premium-btn secondary" onClick={() => fileInputRef.current.click()}>
                                <Download size={16} /> {t('import_excel')}
                            </button>
                            <button className="premium-btn secondary" onClick={handleDownloadQRs}>
                                <Printer size={16} /> Global QR
                            </button>
                            {user?.role === 'Founder' && (
                                <button className="premium-btn danger-outline" onClick={handleDeleteAll}>
                                    <Trash2 size={16} /> Clear All
                                </button>
                            )}
                            <button className="premium-btn primary" onClick={() => { setEditingItem(null); setShowForm(true); }}>
                                <Plus size={18} /> {t('add_equip')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Filters Bar */}
            <div style={{ 
                display: 'flex', gap: '20px', marginBottom: '45px', padding: '15px', 
                background: 'rgba(30, 32, 47, 0.6)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1', opacity: 0.8 }} size={20} />
                    <input 
                        type="text" 
                        placeholder={t('search_equip')} 
                        value={filter} 
                        onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                        className="premium-search-input"
                        style={{ paddingLeft: '55px' }}
                    />
                </div>
                <div style={{ width: '280px' }}>
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                        className="premium-select"
                    >
                        <option value="">{t('all_cats')}</option>
                        {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            {/* Assets Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '30px' }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '120px', color: '#6366f1' }}>
                        <div className="spinner"></div>
                        <p style={{ marginTop: '20px', fontWeight: '700' }}>Syncing global inventory records...</p>
                    </div>
                ) : currentItems.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.01)', borderRadius: '30px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                        <p style={{ color: '#475569', fontSize: '16px' }}>No items found matching your criteria.</p>
                    </div>
                ) : (
                    currentItems.map(item => {
                        const colors = getCategoryColor(item.category);
                        return (
                            <div key={item._id} className="asset-premium-card">
                                <div className="card-top">
                                    <span className="category-tag" style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                                        <Layers size={12} /> {item.category}
                                    </span>
                                    <div className="status-indicator">
                                        <span style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6, marginRight: '8px' }}>{item.state.toUpperCase()}</span>
                                        <span className={`state-dot ${item.state === 'Fonctionnel' ? 'active' : 'broken'}`}></span>
                                    </div>
                                </div>

                                <div className="card-main">
                                    <h3 className="asset-title">{item.name}</h3>
                                    <p className="asset-subtitle">{item.brand || 'Generic'} • {item.model || 'Standard'}</p>
                                    
                                    <div className="stats-container">
                                        <div className="stat-pill">
                                            <div className="stat-icon"><Box size={14} /></div>
                                            <div className="stat-content">
                                                <span className="s-label">Qty</span>
                                                <span className="s-value">{item.quantity}</span>
                                            </div>
                                        </div>
                                        <div className="stat-pill">
                                            <div className="stat-icon"><MapPin size={14} /></div>
                                            <div className="stat-content">
                                                <span className="s-label">Map</span>
                                                <span className="s-value">{item.storageLocation?.zone || '-'}/{item.storageLocation?.shelving || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-actions-row">
                                    <div className="left-actions">
                                        <button className="action-btn" onClick={() => setQrItem(item)} title="Generate QR"><QrCode size={20} /></button>
                                        <button className="action-btn" onClick={() => handleViewHistory(item)} title="View Logs"><History size={20} /></button>
                                    </div>
                                    <div className="right-actions">
                                        {['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && (
                                            <>
                                                <button className="action-btn" onClick={() => {setEditingItem(item); setShowForm(true);}} title="Edit Entry"><Edit size={20} /></button>
                                                <button className="action-btn warning" onClick={() => handleMarkBroken(item)} disabled={item.state === 'Cassé'} title="Report Damage"><AlertCircle size={20} /></button>
                                                {['Founder', 'Manager'].includes(user?.role) && (
                                                    <button className="action-btn danger" onClick={() => handleDelete(item._id)} title="Purge Record"><Trash2 size={20} /></button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '60px', gap: '10px' }}>
                    <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} className="page-pagination-btn">Previous</button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button 
                            key={i+1} 
                            onClick={() => changePage(i+1)} 
                            className={`page-pagination-btn ${currentPage === i+1 ? 'current' : ''}`}
                        >
                            {i+1}
                        </button>
                    ))}
                    <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} className="page-pagination-btn">Next Page <ChevronRight size={14} /></button>
                </div>
            )}

            {/* Modals */}
            {showForm && <InventoryForm itemToEdit={editingItem} onClose={() => setShowForm(false)} onSuccess={() => {setShowForm(false); loadInventory();}} />}
            
            {qrItem && (
                <div className="premium-modal-overlay" onClick={() => setQrItem(null)}>
                    <div className="premium-modal-card qr-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Asset Identity QR</h2>
                            <button className="close-btn" onClick={() => setQrItem(null)}>&times;</button>
                        </div>
                        <div className="qr-container-box">
                            <QRCode value={`brightstage://inventory/${qrItem.barcode || qrItem._id}`} size={200} />
                        </div>
                        <div className="qr-meta">
                            <code>{qrItem.barcode || qrItem._id}</code>
                        </div>
                        <button className="premium-btn primary" onClick={() => window.print()} style={{ width: '100%', marginTop: '30px', justifyContent: 'center' }}>
                            <Printer size={18} /> Print Label
                        </button>
                    </div>
                </div>
            )}

            {historyItem && (
                <div className="premium-modal-overlay" onClick={() => {setHistoryItem(null); setHistoryData(null);}}>
                    <div className="premium-modal-card history-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 style={{ margin: 0 }}>Equipment Logs</h2>
                                <p style={{ margin: 0, fontSize: '13px', opacity: 0.6 }}>Lifecycle tracking for {historyItem.name}</p>
                            </div>
                            <button className="close-btn" onClick={() => setHistoryItem(null)}>&times;</button>
                        </div>
                        <div className="timeline-view">
                            {historyLoading ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}>Syncing history nodes...</div>
                            ) : (
                                <>
                                    <div className="t-section">
                                        <h4 className="t-label">🛠️ Maintenance Logs</h4>
                                        {historyData?.maintenance.length > 0 ? historyData.maintenance.map((t, i) => (
                                            <div key={i} className="t-event">
                                                <div className="t-date">{new Date(t.dateReported).toLocaleDateString()}</div>
                                                <div className="t-content">{t.issueDescription} <span className={`t-status ${t.status.toLowerCase()}`}>{t.status}</span></div>
                                            </div>
                                        )) : <p className="t-empty">No maintenance records found.</p>}
                                    </div>
                                    <div className="t-section">
                                        <h4 className="t-label">🚛 Rental Movements</h4>
                                        {historyData?.rentals.length > 0 ? historyData.rentals.map((r, i) => (
                                            <div key={i} className="t-event">
                                                <div className="t-date">{new Date(r.startDate).toLocaleDateString()}</div>
                                                <div className="t-content">{r.eventName} <span className="t-qty">{r.quantity} qty</span></div>
                                            </div>
                                        )) : <p className="t-empty">No rental history registered.</p>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .premium-btn { padding: 12px 24px; border-radius: 16px; font-weight: 800; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none; font-size: 13px; display: flex; align-items: center; gap: 10px; }
                .premium-btn.primary { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3); }
                .premium-btn.secondary { background: rgba(255,255,255,0.03); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(10px); }
                .premium-btn.danger-outline { background: rgba(244, 63, 94, 0.05); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.2); }
                .premium-btn:hover { transform: translateY(-3px); filter: brightness(1.15); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
                .premium-btn:active { transform: translateY(-1px); }

                .premium-search-input { width: 100%; padding: 16px 20px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 18px; color: white; font-weight: 500; outline: none; transition: all 0.3s; }
                .premium-search-input:focus { border-color: #6366f1; background: rgba(99,102,241,0.05); box-shadow: 0 0 20px rgba(99,102,241,0.1); }
                
                .premium-select { padding: 0 25px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 18px; color: #fff; outline: none; cursor: pointer; font-weight: 600; width: 100%; height: 50px; appearance: none; }

                .asset-premium-card { background: #1a1b26; border: 1px solid rgba(255,255,255,0.03); border-radius: 28px; padding: 28px; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; position: relative; overflow: hidden; }
                .asset-premium-card:hover { transform: translateY(-8px); border-color: rgba(99, 102, 241, 0.25); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4); }
                .asset-premium-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: #6366f1; opacity: 0; transition: 0.3s; }
                .asset-premium-card:hover::before { opacity: 0.6; }
                
                .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .category-tag { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 12px; border-radius: 10px; display: flex; align-items: center; gap: 6px; }
                .status-indicator { display: flex; align-items: center; }
                .state-dot { width: 10px; height: 10px; border-radius: 50%; }
                .state-dot.active { background: #10b981; box-shadow: 0 0 15px rgba(16, 185, 129, 0.6); }
                .state-dot.broken { background: #f43f5e; box-shadow: 0 0 15px rgba(244, 63, 94, 0.6); }

                .asset-title { font-size: 20px; font-weight: 800; color: white; margin: 0; letter-spacing: -0.5px; }
                .asset-subtitle { font-size: 13px; color: #64748b; margin: 6px 0 25px 0; font-weight: 500; }
                
                .stats-container { display: flex; gap: 12px; margin-bottom: 30px; }
                .stat-pill { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.02); padding: 10px 14px; border-radius: 16px; display: flex; align-items: center; gap: 10px; flex: 1; }
                .stat-icon { color: #6366f1; opacity: 0.7; }
                .stat-content { display: flex; flex-direction: column; }
                .s-label { font-size: 9px; color: #475569; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px; }
                .s-value { font-weight: 800; color: #fff; font-size: 14px; }

                .card-actions-row { display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.04); }
                .left-actions, .right-actions { display: flex; gap: 8px; }
                
                .action-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); color: #e2e8f0; width: 44px; height: 44px; border-radius: 14px; cursor: pointer; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; justify-content: center; }
                .action-btn:hover { background: rgba(99,102,241,0.2); color: #fff; border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
                .action-btn.warning:hover { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border-color: #f59e0b; }
                .action-btn.danger:hover { background: rgba(244, 63, 94, 0.2); color: #f43f5e; border-color: #f43f5e; }
                .action-btn:active { transform: translateY(0); }
                .action-btn:disabled { opacity: 0.1; cursor: not-allowed; }

                .page-pagination-btn { padding: 10px 20px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); color: #94a3b8; border-radius: 14px; cursor: pointer; transition: 0.3s; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 8px; }
                .page-pagination-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); color: #fff; }
                .page-pagination-btn.current { background: #6366f1; color: white; border-color: #6366f1; box-shadow: 0 5px 15px rgba(99,102,241,0.2); }
                .page-pagination-btn:disabled { opacity: 0.2; cursor: not-allowed; }

                .premium-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(12px); display: flex; justify-content: center; align-items: center; z-index: 2000; animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                
                .premium-modal-card { background: #161722; padding: 40px; border-radius: 32px; border: 1px solid rgba(255,255,255,0.08); width: 90%; max-width: 600px; position: relative; box-shadow: 0 50px 100px rgba(0,0,0,0.5); }
                .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
                .modal-header h2 { font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
                .close-btn { background: none; border: none; color: #475569; fontSize: 32px; cursor: pointer; transition: 0.2s; }
                .close-btn:hover { color: #f43f5e; }

                .qr-container-box { background: white; padding: 25px; border-radius: 24px; margin: 30px auto; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                .qr-meta { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #a78bfa; background: rgba(99,102,241,0.1); padding: 10px 15px; border-radius: 12px; }

                .timeline-view { max-height: 500px; overflow-y: auto; padding-right: 15px; }
                .t-section { margin-bottom: 30px; }
                .t-label { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #6366f1; letter-spacing: 1px; margin-bottom: 15px; display: block; }
                .t-event { background: rgba(255,255,255,0.02); padding: 15px; border-radius: 18px; margin-bottom: 10px; border-left: 3px solid #6366f1; transition: 0.2s; }
                .t-event:hover { background: rgba(255,255,255,0.04); transform: translateX(5px); }
                .t-date { font-size: 11px; color: #64748b; font-weight: 700; margin-bottom: 4px; }
                .t-content { font-size: 14px; font-weight: 600; color: #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
                .t-status { font-size: 10px; padding: 2px 8px; border-radius: 6px; font-weight: 800; }
                .t-status.completed { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .t-status.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .t-empty { color: #475569; font-size: 13px; font-style: italic; }
            `}</style>
        </div>
    );
};

export default InventoryList;
