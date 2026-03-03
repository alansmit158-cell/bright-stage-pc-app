import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import './Logistics.css';

const LogisticsManifestView = ({ project, onClose, onValidated }) => {
    const { user } = useAuth();
    const [checkedItems, setCheckedItems] = useState({});
    const [loading, setLoading] = useState(false);
    const [viewingQR, setViewingQR] = useState(null); // 'EXIT' or 'RETURN'
    const [qrToken, setQrToken] = useState(null);
    const [fetchingQR, setFetchingQR] = useState(false);

    useEffect(() => {
        // Initialize checked items
        const initial = {};
        project.items.forEach((item, index) => {
            initial[index] = false;
        });
        setCheckedItems(initial);
    }, [project]);

    const handleCheck = (index) => {
        setCheckedItems(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const allChecked = project.items.every((_, index) => checkedItems[index]);

    const handleFinalize = async () => {
        if (!allChecked) {
            alert("Please verify and check all equipment items before finalizing.");
            return;
        }

        setLoading(true);
        try {
            await projectService.validateManifest(project._id);
            alert("Manifest Validated! Project is now Ready for Exit.");
            if (onValidated) onValidated();
            onClose();
        } catch (err) {
            alert("Failed to validate manifest: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCancelValidation = async () => {
        if (!window.confirm("Are you sure you want to cancel validation and revert to Draft? Any generated QR codes will be invalidated.")) {
            return;
        }

        setLoading(true);
        try {
            await projectService.cancelValidation(project._id);
            alert("Validation Cancelled. Project reverted to Prep.");
            if (onValidated) onValidated();
            onClose();
        } catch (err) {
            alert("Failed to cancel validation: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleShowQR = async (type) => {
        setViewingQR(type);
        setQrToken(null);
        setFetchingQR(true);
        try {
            const apiType = type === 'EXIT' ? 'exit' : 'return';
            // We use the same service or direct axios, but projectService.validateManifest exists.
            // Let's assume we can fetch the QR token from the backend.
            const res = await projectService.getQRToken(project._id, apiType);
            setQrToken(res.qrCode);
        } catch (err) {
            console.error("QR Fetch Error:", err);
            setQrToken(`brightstage://project/${project._id}`);
        } finally {
            setFetchingQR(false);
        }
    };


    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '800px', width: '90%', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Logistics Manifest: {project.eventName}</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Project ID: {project._id} | Status: {project.status}</p>
                    </div>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                    {viewingQR ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
                            {fetchingQR ? (
                                <div style={{ color: '#94a3b8' }}>Generating secure QR code...</div>
                            ) : (
                                <>
                                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
                                        <QRCode value={qrToken} size={256} />
                                    </div>
                                    <h3 style={{ color: viewingQR === 'EXIT' ? '#3b82f6' : '#f43f5e' }}>{viewingQR} SCANNER QR</h3>
                                    <p style={{ color: '#94a3b8', textAlign: 'center', maxWidth: '400px' }}>
                                        Ask the Storekeeper or Admin to scan this QR code with their Bright Stage app to confirm {viewingQR === 'EXIT' ? 'pickup' : 'return'}.
                                    </p>
                                </>
                            )}
                            <button className="btn-secondary" onClick={() => setViewingQR(null)}>Back to Manifest</button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', height: '100%' }}>
                            {/* Left: Item Checklist */}
                            <div style={{ overflowY: 'auto', paddingRight: '10px' }}>
                                <h3 style={{ marginBottom: '15px', color: '#818cf8', display: 'flex', justifyContent: 'space-between' }}>
                                    Equipment Checklist
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{Object.values(checkedItems).filter(Boolean).length} / {project.items.length} Checked</span>
                                </h3>
                                {project.items.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleCheck(index)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '12px',
                                            background: checkedItems[index] ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${checkedItems[index] ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                                            borderRadius: '8px',
                                            marginBottom: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            border: '2px solid',
                                            borderColor: checkedItems[index] ? '#34d399' : '#475569',
                                            background: checkedItems[index] ? '#34d399' : 'transparent',
                                            marginRight: '15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {checkedItems[index] && <span style={{ color: 'white', fontWeight: 'bold' }}>✓</span>}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: checkedItems[index] ? '#34d399' : 'white' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Qty: {item.quantity} | {item.category}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Right: Actions & Info */}
                            <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <h4 style={{ color: '#94a3b8', margin: '0 0 10px 0' }}>Transport Info</h4>
                                    <div className="card-subtitle">Driver: {project.transport?.driverName || 'N/A'}</div>
                                    <div className="card-subtitle">Vehicle: {project.transport?.vehicleModel || 'N/A'}</div>
                                    <div className="card-subtitle">Plate: {project.transport?.vehiclePlate || 'N/A'}</div>
                                </div>

                                <div style={{ borderTop: '1px solid #334155', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <h4 style={{ color: '#94a3b8', margin: '0 0 5px 0' }}>Phase Actions</h4>

                                    {(project.status === 'Confirmed' || project.status === 'Pickup') && (
                                        <>
                                            {project.validationStatus !== 'Validated' ? (
                                                <button
                                                    className="btn-save"
                                                    style={{ width: '100%', opacity: allChecked ? 1 : 0.5 }}
                                                    onClick={handleFinalize}
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Validating...' : 'Finalize & Unlock BL'}
                                                </button>
                                            ) : (
                                                /* Show QR only for creator after validation */
                                                (project.createdBy === user?._id || project.createdBy?._id === user?._id) && (
                                                    <button
                                                        className="btn-secondary"
                                                        style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '8px' }}
                                                        onClick={() => handleShowQR('EXIT')}
                                                    >
                                                        Show EXIT QR
                                                    </button>
                                                )
                                            )}

                                            {/* Cancel Validation for Admins/Storekeepers */}
                                            {project.validationStatus === 'Validated' && ['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && (
                                                <button
                                                    className="btn-text"
                                                    style={{ width: '100%', color: '#f87171', marginTop: '5px', fontSize: '0.8rem' }}
                                                    onClick={handleCancelValidation}
                                                    disabled={loading}
                                                >
                                                    Cancel Validation
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {project.status === 'Return' && (
                                        /* Show RETURN QR only for creator/leader */
                                        (project.createdBy === user?._id || project.createdBy?._id === user?._id) && (
                                            <button
                                                className="btn-secondary"
                                                style={{ width: '100%', background: '#f43f5e', color: 'white', border: 'none', padding: '10px', borderRadius: '8px' }}
                                                onClick={() => handleShowQR('RETURN')}
                                            >
                                                Show RETURN QR
                                            </button>
                                        )
                                    )}

                                    {project.status === 'Return' && (
                                        <p style={{ color: '#fbbf24', fontSize: '0.8rem', textAlign: 'center' }}>
                                            Project is currently in Return Check phase. Use the mobile app for item-level return scanning.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogisticsManifestView;
