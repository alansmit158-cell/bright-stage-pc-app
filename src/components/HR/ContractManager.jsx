import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = `http://${window.location.hostname}:5000/api`;

const ContractManager = () => {
    const [contracts, setContracts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form
    const [userId, setUserId] = useState('');
    const [type, setType] = useState('CDI');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [salary, setSalary] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [cRes, uRes] = await Promise.all([
                axios.get(`${API_URL}/hr/contracts`),
                axios.get(`${API_URL}/users`)
            ]);
            setContracts(cRes.data);
            setUsers(uRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!userId || !startDate || !salary) return alert("Missing fields");
        try {
            await axios.post(`${API_URL}/hr/contracts`, {
                user: userId,
                type,
                startDate,
                endDate: endDate || null,
                salary: parseFloat(salary),
                status: 'Active'
            });
            alert("Contract Created");
            fetchData();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    if (loading) return <div>Loading contracts...</div>;

    return (
        <div className="hr-grid">
            <div className="hr-card">
                <h3 className="card-title">New Contract</h3>
                <div>
                    <label className="label-text">Select Employee</label>
                    <select className="styled-select" value={userId} onChange={e => setUserId(e.target.value)}>
                        <option value="">-- Select --</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                    </select>
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label className="label-text">Type</label>
                    <select className="styled-select" value={type} onChange={e => setType(e.target.value)}>
                        <option>CDI</option>
                        <option>CDD</option>
                        <option>SIVP</option>
                        <option>Freelance</option>
                    </select>
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label className="label-text">Start Date</label>
                    <input type="date" className="styled-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label className="label-text">End Date (Optional)</label>
                    <input type="date" className="styled-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label className="label-text">Monthly Salary (TND)</label>
                    <input type="number" className="styled-input" value={salary} onChange={e => setSalary(e.target.value)} />
                </div>
                <button className="btn-primary" style={{ marginTop: '20px' }} onClick={handleCreate}>Create Contract</button>
            </div>

            <div className="hr-card">
                <h3 className="card-title">Active Contracts</h3>
                <div className="item-list" style={{ maxHeight: '500px' }}>
                    {contracts.map(c => (
                        <div key={c._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <span style={{ fontWeight: 'bold', color: 'white' }}>{c.user?.name}</span>
                                <span className={`status-badge status-${c.status.toLowerCase()}`}>{c.type}</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '5px' }}>
                                Since: {new Date(c.startDate).toLocaleDateString()}
                                {c.endDate && ` • Ends: ${new Date(c.endDate).toLocaleDateString()}`}
                            </div>
                            <div style={{ marginTop: '5px', fontWeight: 'bold' }}>{c.salary} TND</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ContractManager;
