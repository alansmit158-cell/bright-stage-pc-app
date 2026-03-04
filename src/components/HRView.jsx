import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './HRView.css';
import './TransferView.css';

// Sub-components
import ContractManager from './HR/ContractManager';
import AttendancePanel from './HR/AttendancePanel';
import LeaveRequestsPanel from './HR/LeaveRequestsPanel';
import ExpensesPanel from './HR/ExpensesPanel';

import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const HRView = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('attendance');

    // isAdmin controls access to Global features like Loss Overview, Contracts, and Admin views of Leaves/Expenses.
    // Site Manager is NOT an admin in this context.
    const isAdmin = ['Founder', 'Manager'].includes(user?.role);
    const isSiteManager = user?.role === 'Site Manager';

    // Define tabs based on role
    // Common tabs: Attendance, Leaves, Expenses
    const tabs = ['attendance', 'leaves', 'expenses'];

    if (isAdmin) {
        tabs.unshift('overview'); // Loss Reports
        tabs.push('contracts');
    }

    // --- Overview State (Loss Reports) ---
    const [reports, setReports] = useState([]);
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState('');
    const [responsible, setResponsible] = useState('');
    const [lossValue, setLossValue] = useState('');
    const [reason, setReason] = useState('Lost on Site/Tour');

    useEffect(() => {
        if (activeTab === 'overview') fetchOverviewData();
    }, [activeTab]);

    const fetchOverviewData = async () => {
        try {
            const [repRes, itemRes] = await Promise.all([
                axios.get(`${API_URL}/loss-reports`),
                axios.get(`${API_URL}/inventory`)
            ]);
            setReports(repRes.data);
            setItems(itemRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    const handleLossSubmit = async () => {
        if (!selectedItem || !responsible || !lossValue) return alert("Fill all fields");
        try {
            await axios.post(`${API_URL}/loss-reports`, {
                inventoryItem: selectedItem,
                responsiblePerson: responsible,
                lossValuation: parseFloat(lossValue),
                reason
            });
            alert("Report Added");
            setSelectedItem('');
            setResponsible('');
            setLossValue('');
            fetchOverviewData();
        } catch (error) {
            alert("Accident!" + error.message);
        }
    };

    const totalLoss = reports.reduce((acc, curr) => acc + (curr.lossValuation || 0), 0);

    const renderOverview = () => (
        <div className="hr-grid">
            {/* Left: Report Form */}
            <div className="hr-card">
                <h3 className="card-title">Report New Loss</h3>
                <div>
                    <label className="label-text">Select Lost Item</label>
                    <select className="styled-select" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
                        <option value="">-- Choose Item --</option>
                        {items.map(i => (
                            <option key={i._id} value={i._id}>{i.name} ({i.barcode})</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <label className="label-text">Responsible Staff</label>
                    <input type="text" className="styled-input"
                        placeholder="John Doe"
                        value={responsible} onChange={e => setResponsible(e.target.value)} />
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <label className="label-text">Loss Valuation (€)</label>
                    <input type="number" className="styled-input"
                        placeholder="0.00"
                        value={lossValue} onChange={e => setLossValue(e.target.value)} />
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <label className="label-text">Reason</label>
                    <select className="styled-select" value={reason} onChange={e => setReason(e.target.value)}>
                        <option>Lost on Site/Tour</option>
                        <option>Stolen</option>
                        <option>Broken (Unreported)</option>
                        <option>Negligence</option>
                    </select>
                </div>
                <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                    <button className="btn-primary" onClick={handleLossSubmit}>Submit Report</button>
                </div>
            </div>

            {/* Right: Overview */}
            <div>
                <div className="stat-box">
                    <div className="stat-number">€{totalLoss.toFixed(2)}</div>
                    <div className="stat-label">Total Losses (Deductible)</div>
                </div>

                <div className="hr-card">
                    <h3 className="card-title">Loss History</h3>
                    <div className="item-list" style={{ maxHeight: '400px' }}>
                        {reports.map((rep, idx) => (
                            <div key={idx} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <span style={{ fontWeight: 'bold' }}>{rep.inventoryItem?.name}</span>
                                    <span style={{ color: '#ef4444' }}>-€{rep.lossValuation}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <span>Resp: {rep.responsiblePerson}</span>
                                    <span>{new Date(rep.dateReported).toLocaleDateString()}</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#6366f1' }}>{rep.reason}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="hr-container">
            <h1 className="page-title">Human Resources</h1>

            <div className="tabs-container" style={{ marginBottom: '20px', borderBottom: '1px solid #333' }}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '3px solid #3b82f6' : '3px solid transparent',
                            color: activeTab === tab ? 'white' : '#94a3b8',
                            padding: '10px 20px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'attendance' && <AttendancePanel />}
            {activeTab === 'leaves' && <LeaveRequestsPanel />}
            {activeTab === 'contracts' && <ContractManager />}
            {activeTab === 'expenses' && <ExpensesPanel />}
        </div>
    );
};

export default HRView;

