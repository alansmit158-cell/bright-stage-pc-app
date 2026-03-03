import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './MaintenanceView.css';

const API_URL = `http://${window.location.hostname}:5000/api`;

const MaintenanceView = () => {
    const location = useLocation();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreportedItems, setUnreportedItems] = useState([]);
    const [filterStatus, setFilterStatus] = useState(location.state?.filter || 'All');
    const { user } = useAuth();
    // Site Manager is Read Only for Maintenance
    const isReadOnly = ['Site Manager'].includes(user?.role);

    // DEBUG STATE
    const [debugData, setDebugData] = useState({
        totalInv: 0,
        totalTickets: 0,
        sampleInvItem: null
    });

    useEffect(() => {
        if (location.state?.filter) {
            setFilterStatus(location.state.filter);
        }
    }, [location.state]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ticketRes, itemRes] = await Promise.all([
                axios.get(`${API_URL}/maintenance`),
                axios.get(`${API_URL}/inventory`)
            ]);

            const fetchedTickets = ticketRes.data;
            setTickets(fetchedTickets);

            // DEBUG: Capture raw data
            setDebugData({
                totalInv: itemRes.data?.length || 0,
                totalTickets: fetchedTickets?.length || 0,
                sampleInvItem: itemRes.data?.[0] || 'No items fetched'
            });

            // Find items that are NOT 'Fonctionnel'
            const openTicketItemIds = new Set(fetchedTickets
                .filter(t => t.status !== 'Fixed' && t.status !== 'Resolved')
                .map(t => String(t.inventoryItem?._id || '')));

            const brokenItems = itemRes.data.filter(i => {
                // Robust check for breaking state
                const state = i.state || 'Fonctionnel';
                const isBroken = state !== 'Fonctionnel';
                const hasOpenTicket = openTicketItemIds.has(String(i._id));
                return isBroken && !hasOpenTicket;
            });

            console.log("Debug Maintenance:", {
                totalItems: itemRes.data.length,
                brokenFound: brokenItems.length,
                tickets: fetchedTickets.length,
                openTicketIds: Array.from(openTicketItemIds)
            });

            setUnreportedItems(brokenItems);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await axios.put(`${API_URL}/maintenance/${id}`, { status: newStatus });
            fetchData(); // Refresh ALL
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const createTicketFor = async (item) => {
        const desc = prompt(`Describe issue for ${item.name}:`, "Detected during inventory check");
        if (!desc) return;

        try {
            await axios.post(`${API_URL}/maintenance`, {
                inventoryItem: item._id,
                reportedBy: "PC Admin",
                issueDescription: desc,
                severity: "Critical", // Default for unreported issues
                status: "Open"
            });
            fetchData();
        } catch (err) {
            console.error("Create Ticket Error:", err);
            const errMsg = err.response?.data?.error || err.message;
            alert(`Failed to create ticket: ${errMsg}`);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Open': return 'status-badge status-open';
            case 'Sent to Repair': return 'status-badge status-repair';
            case 'Fixed': return 'status-badge status-fixed';
            default: return 'status-badge';
        }
    };

    return (
        <div className="maint-container">
            <h1 className="page-title">Maintenance & Repair</h1>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '5rem', color: '#94a3b8' }}>Loading...</div>
            ) : (
                <div style={{ display: 'grid', gap: '2rem' }}>


                    {/* Unreported Issues Section */}
                    {unreportedItems.length > 0 && (
                        <div className="ticket-card" style={{ flexDirection: 'column', borderColor: '#eab308' }}>
                            <div className="ticket-header" style={{ width: '100%', justifyContent: 'space-between' }}>
                                <h3 style={{ color: '#eab308', margin: 0 }}>⚠️ Unreported Issues Detected</h3>
                                <span className="status-badge" style={{ background: '#eab308', color: 'black' }}>{unreportedItems.length} Items</span>
                            </div>
                            <p className="reporter-text" style={{ marginBottom: '1rem' }}>
                                The following items are marked as Broken/Missing in inventory but have no active maintenance ticket.
                            </p>

                            <div style={{ display: 'grid', gap: '0.5rem', width: '100%' }}>
                                {unreportedItems.map(item => (
                                    <div key={item._id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '0.5rem'
                                    }}>
                                        <div>
                                            <span style={{ fontWeight: 'bold', color: 'white' }}>{item.name}</span>
                                            <span className="barcode-sub">({item.barcode})</span>
                                            <span className="stock-state" style={{ marginLeft: '1rem', color: '#ef4444', fontSize: '0.8rem' }}>
                                                {item.state}
                                            </span>
                                        </div>
                                        {!isReadOnly && (
                                            <button
                                                onClick={() => createTicketFor(item)}
                                                className="btn-repair"
                                                style={{ width: 'auto', padding: '0.3rem 0.8rem' }}
                                            >
                                                + Create Ticket
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Tickets Section */}
                    <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem', color: '#94a3b8' }}>
                        Active Tickets
                    </h3>

                    {tickets.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', border: '1px dashed #333', borderRadius: '1rem' }}>
                            No active maintenance tickets.
                        </div>
                    )}

                    {/* Filter Bar */}
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                        {['All', 'Unreported', 'Open', 'Sent to Repair', 'Fixed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '15px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    backgroundColor: filterStatus === status ? '#ef4444' : 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    opacity: filterStatus === status ? 1 : 0.7
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {filterStatus !== 'Unreported' && tickets.filter(t => filterStatus === 'All' || t.status === filterStatus).map(ticket => (
                        <div key={ticket._id} className="ticket-card">
                            {/* Left Info */}
                            <div>
                                <div className="ticket-header">
                                    <span className={getStatusClass(ticket.status)}>
                                        {ticket.status}
                                    </span>
                                    <span className="reporter-text">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </span>
                                    {ticket.severity === 'Critical' && (
                                        <span className="critical-badge">CRITICAL</span>
                                    )}
                                </div>

                                <h3 className="item-name">
                                    {ticket.inventoryItem?.name || 'Unknown Item'}
                                    {ticket.inventoryItem?.quantity ? (
                                        <span style={{ color: '#ef4444', marginLeft: '8px', fontSize: '0.9em', fontWeight: 'bold' }}>
                                            [Qty: {ticket.inventoryItem.quantity}]
                                        </span>
                                    ) : null}
                                    <span className="barcode-sub" style={{ marginLeft: '8px' }}>
                                        ({ticket.inventoryItem?.barcode || 'No Barcode'})
                                    </span>
                                </h3>

                                <div className="issue-box">
                                    "{ticket.issueDescription}"
                                </div>
                                <p className="reporter-text">
                                    Reported by: {ticket.reportedBy}
                                </p>
                            </div>

                            {/* Right Actions */}
                            <div className="action-stack">
                                {ticket.status !== 'Fixed' && (
                                    <>
                                        {!isReadOnly && (
                                            <>
                                                {ticket.status === 'Open' && (
                                                    <button
                                                        onClick={() => updateStatus(ticket._id, 'Sent to Repair')}
                                                        className="btn-repair"
                                                    >
                                                        Send to Repair
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => updateStatus(ticket._id, 'Fixed')}
                                                    className="btn-fixed"
                                                >
                                                    Mark as Fixed
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                                {ticket.status === 'Fixed' && (
                                    <div className="resolved-indicator">
                                        <span>✓ Resolved</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )
            }
        </div >
    );
};

export default MaintenanceView;
