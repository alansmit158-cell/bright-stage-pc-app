import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './TransferView.css';

const API_URL = `http://${window.location.hostname}:5000/api`;

const TransferView = () => {
    const [projects, setProjects] = useState([]);
    const [sourceProject, setSourceProject] = useState('');
    const [destProject, setDestProject] = useState('');
    const [itemsToTransfer, setItemsToTransfer] = useState([]);
    const [driverName, setDriverName] = useState('');
    const [vehiclePlate, setVehiclePlate] = useState('');

    const [transfers, setTransfers] = useState([]); // History

    useEffect(() => {
        fetchProjects();
        fetchDrivers();
        fetchVehicles();
        fetchTransfers();
    }, []);

    const fetchTransfers = async () => {
        try {
            const res = await axios.get(`${API_URL}/transfers`);
            setTransfers(res.data);
        } catch (error) {
            console.error("Error fetching transfer history", error);
        }
    };

    const fetchVehicles = async () => {
        try {
            const res = await axios.get(`${API_URL}/vehicles`);
            setVehicles(res.data);
        } catch (error) {
            console.error("Error fetching vehicles", error);
        }
    };

    const fetchDrivers = async () => {
        try {
            const res = await axios.get(`${API_URL}/drivers`);
            setDrivers(res.data);
        } catch (error) {
            console.error("Error fetching drivers", error);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await axios.get(`${API_URL}/projects`);
            setProjects(res.data);
        } catch (error) {
            console.error("Error fetching projects", error);
        }
    };

    // ... (keep fetchProjects, handleSourceChange, addToTransfer, updateQty)

    // Helper to get items of source project (Moved down or accessible in scope)


    const handleSourceChange = (e) => {
        const pid = e.target.value;
        setSourceProject(pid);
        // Reset items
        setItemsToTransfer([]);
        if (pid === destProject) setDestProject('');
    };

    const addToTransfer = (inventoryItemId, name, maxQty) => {
        const existing = itemsToTransfer.find(i => i.inventoryItem === inventoryItemId);
        if (existing) return;

        setItemsToTransfer([...itemsToTransfer, {
            inventoryItem: inventoryItemId,
            name: name,
            quantity: 1,
            maxQty: maxQty
        }]);
    };

    const updateQty = (id, qty) => {
        setItemsToTransfer(itemsToTransfer.map(i => {
            if (i.inventoryItem === id) {
                const val = Math.max(1, Math.min(parseInt(qty) || 0, i.maxQty));
                return { ...i, quantity: val };
            }
            return i;
        }));
    };

    // --- PDF Download ---
    const handleDownloadPdf = async () => {
        if (!sourceProject || !destProject) return alert("Select projects first");
        if (itemsToTransfer.length === 0) return alert("Add items first");

        // Validation: Warn if driver/plate missing but proceed with defaults to avoid crash
        const dName = driverName || '____________________';
        const vPlate = vehiclePlate || '____________________';

        const sourceName = projects.find(p => p._id === sourceProject)?.eventName;
        const destName = projects.find(p => p._id === destProject)?.eventName;

        try {
            const response = await axios.post(`${API_URL}/transfers/pdf`, {
                sourceProjectName: sourceName,
                destProjectName: destName,
                items: itemsToTransfer,
                driverName: dName,
                vehiclePlate: vPlate
            }, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Transfer_${sourceName}_to_${destName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.error || err.message || "Unknown Error";
            alert("Failed to download PDF: " + errMsg);
        }
    };

    const handleSubmit = async () => {
        if (!sourceProject || !destProject) return alert("Select projects");
        if (itemsToTransfer.length === 0) return alert("No items to transfer");

        try {
            await axios.post(`${API_URL}/transfers`, {
                sourceProjectId: sourceProject,
                destProjectId: destProject,
                items: itemsToTransfer.map(i => ({
                    inventoryItem: i.inventoryItem,
                    name: i.name,
                    quantity: i.quantity
                })),
                driverName,
                vehiclePlate,
                senderSig: 'MANUAL_SIGNATURE', // No digital sig needed
                receiverSig: 'MANUAL_SIGNATURE'
            });
            alert("Transfer Authorized! (Don't forget to sign the printed slip)");
            // Reset
            setItemsToTransfer([]);
            setSourceProject('');
            setDestProject('');
            setDriverName('');
            setVehiclePlate('');
            fetchProjects();
        } catch (err) {
            alert("Transfer Failed: " + (err.response?.data?.error || err.message));
        }
    };

    // Helper to get items of source project
    const sourceProjectData = projects.find(p => p._id === sourceProject);

    return (
        <div className="transfer-container">
            <h1 className="page-title">Inter-Site Transfer</h1>

            <div className="transfer-grid">
                {/* Source Selection */}
                <div className="transfer-card">
                    <h3 className="card-title">1. Source (Origin)</h3>
                    <select
                        className="styled-select"
                        value={sourceProject}
                        onChange={handleSourceChange}
                    >
                        <option value="">Select Origin Project...</option>
                        {projects.map(p => (
                            <option key={p._id} value={p._id}>{p.eventName}</option>
                        ))}
                    </select>

                    {sourceProjectData && (
                        <div className="mt-4">
                            <h4 className="label-text">Available Items:</h4>
                            <div className="item-list">
                                {sourceProjectData.items.map(item => (
                                    <div key={item.inventoryItem?._id || Math.random()} className="list-item">
                                        <span>{item.name} (Qty: {item.quantity})</span>
                                        <button
                                            onClick={() => addToTransfer(item.inventoryItem._id, item.name, item.quantity)}
                                            className="btn-add"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Destination Selection */}
                <div className="transfer-card">
                    <h3 className="card-title">2. Destination (Target)</h3>
                    <select
                        className="styled-select"
                        value={destProject}
                        onChange={(e) => setDestProject(e.target.value)}
                        disabled={!sourceProject}
                    >
                        <option value="">Select Target Project...</option>
                        {projects.filter(p => p._id !== sourceProject).map(p => (
                            <option key={p._id} value={p._id}>{p.eventName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Transfer List */}
            {itemsToTransfer.length > 0 && (
                <div className="transfer-card" style={{ marginBottom: '2rem' }}>
                    <h3 className="card-title">3. Items to Transfer</h3>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Max Qty</th>
                                <th>Transfer Qty</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsToTransfer.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.name}</td>
                                    <td>{item.maxQty}</td>
                                    <td>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateQty(item.inventoryItem, e.target.value)}
                                            className="qty-input"
                                        />
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => setItemsToTransfer(itemsToTransfer.filter(i => i !== item))}
                                            className="btn-remove"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Transport & PDF Download */}
            {itemsToTransfer.length > 0 && (
                <div className="transfer-grid">
                    <div className="transfer-card">
                        <h3 className="card-title">4. Transport Info</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="label-text">Driver Name</label>
                                <select
                                    className="styled-select"
                                    value={driverName}
                                    onChange={e => setDriverName(e.target.value)}
                                >
                                    <option value="">Select Driver...</option>
                                    {drivers.map(d => (
                                        <option key={d._id} value={d.name}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label-text">Vehicle</label>
                                <select
                                    className="styled-select"
                                    value={vehiclePlate}
                                    onChange={e => setVehiclePlate(e.target.value)}
                                >
                                    <option value="">Select Vehicle...</option>
                                    {vehicles.map(v => (
                                        <option key={v._id} value={v.plateNumber}>
                                            {v.model ? `${v.model} - ` : ''}{v.plateNumber}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="transfer-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <h3 className="card-title">5. Paperwork</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '1rem', textAlign: 'center' }}>
                            Please download the transfer slip and sign it manually.
                        </p>
                        <button
                            onClick={handleDownloadPdf}
                            className="btn-primary"
                            style={{ background: '#0f172a', border: '1px solid #334155' }}
                        >
                            📄 Download Transfer Slip (PDF)
                        </button>
                    </div>
                </div>
            )}

            {/* Submit */}
            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button
                    onClick={handleSubmit}
                    disabled={itemsToTransfer.length === 0}
                    className="btn-primary"
                >
                    Authorize Transfer (No Digital Sig)
                </button>
            </div>

            {/* --- Transfer History Section --- */}
            <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <h2 className="section-title">Transfer History</h2>
                <div className="glass-panel">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '10px' }}>Date</th>
                                <th style={{ padding: '10px' }}>Source</th>
                                <th style={{ padding: '10px' }}>Destination</th>
                                <th style={{ padding: '10px' }}>Driver</th>
                                <th style={{ padding: '10px' }}>Items</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No transfers recorded yet.</td></tr>
                            ) : (
                                transfers.map(t => (
                                    <tr key={t._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '10px' }}>{new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td style={{ padding: '10px' }}>{t.sourceProject?.eventName || 'Unknown'}</td>
                                        <td style={{ padding: '10px' }}>{t.destinationProject?.eventName || 'Unknown'}</td>
                                        <td style={{ padding: '10px' }}>
                                            <div>{t.driverName}</div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>{t.vehiclePlate}</div>
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            {t.items.map((i, idx) => (
                                                <div key={idx} style={{ fontSize: '12px' }}>
                                                    {i.quantity}x {i.name}
                                                </div>
                                            ))}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TransferView;
