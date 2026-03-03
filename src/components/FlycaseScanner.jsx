import React, { useState } from 'react';
import axios from 'axios';
import { QrCode, Box, CheckCircle, XCircle, ArrowRight, Activity, Package } from 'lucide-react';
import './FlycaseScanner.css';

const FlycaseScanner = () => {
    const [scanInput, setScanInput] = useState('');
    const [flycase, setFlycase] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastAction, setLastAction] = useState(null);

    // Handle Manual Scan / Input
    const handleScan = async (e) => {
        e.preventDefault();
        if (!scanInput) return;
        fetchFlycase(scanInput);
    };

    const fetchFlycase = async (qrCode) => {
        setLoading(true);
        setError(null);
        setFlycase(null);
        setLastAction(null);

        try {
            const res = await axios.get(`${API_URL}/flycases/${qrCode}`);
            setFlycase(res.data);
            setScanInput(''); // Clear input for next scan
        } catch (err) {
            setError(err.response?.data?.message || "Scan failed - Flycase not found");
        } finally {
            setLoading(false);
        }
    };

    // Toggle Status
    const updateStatus = async (newStatus) => {
        if (!flycase) return;

        try {
            const res = await axios.put(`${API_URL}/flycases/${flycase.qrCodeID}/status`, {
                status: newStatus
            });
            setFlycase(res.data);
            setLastAction(`Updated to ${newStatus}`);
        } catch (err) {
            alert("Failed to update status");
        }
    };

    return (
        <div className="flycase-scanner-container">

            {/* HEADER */}
            <div className="scanner-header">
                <QrCode className="text-primary" size={32} style={{ color: 'var(--primary-color)' }} />
                <div>
                    <h1>Flycase Scanner</h1>
                    <p>Quick check-in/out for equipment</p>
                </div>
            </div>

            {/* SCAN INPUT */}
            <form onSubmit={handleScan} className="scanner-search-box">
                <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Scan QR Code (e.g., BS-BEAM300-001)..."
                    className="scanner-input"
                    autoFocus
                />
                <QrCode className="search-icon" size={20} />
                <button
                    type="submit"
                    className="lookup-btn"
                >
                    Lookup
                </button>
            </form>

            {/* LOADER */}
            {loading && (
                <div className="scanner-loader">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" style={{ borderColor: 'var(--primary-color)' }}></div>
                    <p>Fetching Details...</p>
                </div>
            )}

            {/* ERROR */}
            {error && (
                <div className="error-banner">
                    <XCircle size={20} />
                    {error}
                </div>
            )}

            {/* RESULT CARD */}
            {flycase && (
                <div className="flycase-card">

                    {/* CARD HEADER */}
                    <div className="card-header">
                        <div>
                            <div className="flycase-id">
                                <Package size={14} />
                                {flycase.qrCodeID}
                            </div>
                            <h2 className="card-title">{flycase.equipment?.name || "Unknown Equipment"}</h2>
                            <p className="card-subtitle">{flycase.equipment?.specs?.description || "Professional Stage Equipment"}</p>
                        </div>

                        {/* STATUS BADGE */}
                        <div className={`status-badge ${flycase.status.toLowerCase().replace(' ', '-')}`}>
                            {flycase.status}
                        </div>
                    </div>

                    <div className="scanner-grid">

                        {/* CONTENTS */}
                        <div>
                            <h3 className="section-title">Contents ({flycase.capacity} Units)</h3>
                            <div className="serial-list">
                                {flycase.serialNumbers.map((sn, idx) => (
                                    <div key={idx} className="serial-item">
                                        <span className="serial-text">{sn}</span>
                                        <CheckCircle size={16} style={{ color: 'var(--success)', opacity: 0.5 }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div>
                            <h3 className="section-title">Quick Actions</h3>
                            <div className="action-group">
                                <button
                                    onClick={() => updateStatus('In Use')}
                                    disabled={flycase.status === 'In Use'}
                                    className="action-btn btn-out group"
                                >
                                    <span className="btn-label">Mark as OUT (In Use)</span>
                                    <ArrowRight size={20} />
                                </button>

                                <button
                                    onClick={() => updateStatus('Available')}
                                    disabled={flycase.status === 'Available'}
                                    className="action-btn btn-return group"
                                >
                                    <span className="btn-label">Mark as RETURN (Available)</span>
                                    <CheckCircle size={20} />
                                </button>

                                <button
                                    onClick={() => updateStatus('Maintenance')}
                                    disabled={flycase.status === 'Maintenance'}
                                    className="action-btn btn-maint group"
                                >
                                    <span className="btn-label">Mark for Maintenance</span>
                                    <Activity size={20} />
                                </button>
                            </div>

                            {lastAction && (
                                <div className="last-action">
                                    {lastAction}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlycaseScanner;
