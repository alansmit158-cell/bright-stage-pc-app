import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { inventoryService } from '../services/inventoryService';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';

const QRCodeScreen = () => {
    const { user } = useAuth();
    const isSiteManager = user?.role === 'Site Manager';
    const [activeTab, setActiveTab] = useState(isSiteManager ? 'projects' : 'inventory'); // 'inventory' | 'projects'
    const [inventory, setInventory] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchData();
        if (isSiteManager) setActiveTab('projects');
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // If Site Manager, no need to fetch inventory (save bandwidth/errors)
            // But if generic fetch, fine. Let's just fetch all for simplicity, or optimize if needed.
            // optimization:
            const promises = [projectService.getAll()];
            if (!isSiteManager) promises.push(inventoryService.getAll());

            const results = await Promise.all(promises);
            setProjects(results[0]);
            if (!isSiteManager) setInventory(results[1]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print QR</title></head><body style="text-align: center;">');
            printWindow.document.write(document.getElementById('printable-qr').innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };

    const getFilteredList = () => {
        const list = activeTab === 'inventory' ? inventory : projects;
        return list.filter(i => {
            const name = activeTab === 'inventory' ? i.name : i.eventName;
            const sub = activeTab === 'inventory' ? (i.barcode || '') : (i.clientName || '');
            return name.toLowerCase().includes(search.toLowerCase()) ||
                sub.toLowerCase().includes(search.toLowerCase());
        });
    };

    const getQRValue = (item) => {
        if (!item) return '';
        if (activeTab === 'inventory') {
            return `brightstage://inventory/${item.barcode || item._id}`;
        } else {
            return `brightstage://project/${item._id}`;
        }
    };

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <h1 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>QR Code Management</h1>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {!isSiteManager && (
                    <button
                        onClick={() => { setActiveTab('inventory'); setSelectedItem(null); }}
                        style={activeTab === 'inventory' ? styles.activeTab : styles.tab}
                    >
                        📦 Inventory
                    </button>
                )}
                <button
                    onClick={() => { setActiveTab('projects'); setSelectedItem(null); }}
                    style={activeTab === 'projects' ? styles.activeTab : styles.tab}
                >
                    📅 Projects
                </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 200px)' }}>
                {/* Left: Item List */}
                <div style={{ flex: 1, overflowY: 'auto', background: '#1e293b', padding: '20px', borderRadius: '8px' }}>
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '4px', border: 'none' }}
                    />

                    {loading ? <p>Loading...</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {getFilteredList().map(item => (
                                <div
                                    key={item._id}
                                    onClick={() => setSelectedItem(item)}
                                    style={{
                                        padding: '10px',
                                        background: selectedItem?._id === item._id ? '#3b82f6' : '#334155',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <span>{activeTab === 'inventory' ? item.name : item.eventName}</span>
                                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>
                                        {activeTab === 'inventory' ? (item.barcode || 'N/A') : (item.status || 'Draft')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Preview & Print */}
                <div style={{ flex: 1, background: '#0f172a', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedItem ? (
                        <>
                            <div id="printable-qr" style={{ padding: '20px', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                                <QRCode value={getQRValue(selectedItem)} size={256} />
                                <p style={{ color: 'black', marginTop: '10px', fontWeight: 'bold' }}>
                                    {activeTab === 'inventory' ? selectedItem.name : selectedItem.eventName}
                                </p>
                                <p style={{ color: 'gray', fontSize: '12px' }}>
                                    {activeTab === 'inventory' ? (selectedItem.barcode || selectedItem._id) : `Project: ${selectedItem.status}`}
                                </p>
                            </div>
                            <button
                                onClick={handlePrint}
                                style={{ marginTop: '20px', padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                🖨️ Print Label
                            </button>
                        </>
                    ) : (
                        <p style={{ color: '#64748b' }}>Select {activeTab === 'inventory' ? 'an item' : 'a project'} to generate QR code</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    tab: { padding: '10px 20px', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    activeTab: { padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};

export default QRCodeScreen;
