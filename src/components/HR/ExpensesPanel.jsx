import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { CONFIG } from '../../config';

const API_URL = CONFIG.API_URL;

const ExpensesPanel = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdminMode, setIsAdminMode] = useState(false); // Toggle for admins

    // Form
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Food');

    const canManage = ['Founder', 'Manager'].includes(user?.role);

    useEffect(() => {
        fetchData();
    }, [isAdminMode]);

    const fetchData = async () => {
        try {
            const endpoint = (isAdminMode && canManage) ? `${API_URL}/hr/expenses` : `${API_URL}/hr/expenses/me`;
            const res = await axios.get(endpoint);
            setExpenses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!amount || !description) return alert("Fill all fields");
        try {
            await axios.post(`${API_URL}/hr/expenses`, {
                amount: parseFloat(amount),
                description,
                category
            });
            alert("Expense Submitted");
            setAmount('');
            setDescription('');
            fetchData();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.put(`${API_URL}/hr/expenses/${id}/status`, { status });
            fetchData();
        } catch (err) {
            alert("Error updating status");
        }
    };

    return (
        <div className="hr-grid">
            {/* Submit Expense Form */}
            {!isAdminMode && (
                <div className="hr-card">
                    <h3 className="card-title">New Expense</h3>
                    <div>
                        <label className="label-text">Amount (TND)</label>
                        <input type="number" className="styled-input" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <label className="label-text">Category</label>
                        <select className="styled-select" value={category} onChange={e => setCategory(e.target.value)}>
                            <option>Food</option>
                            <option>Transport</option>
                            <option>Accommodation</option>
                            <option>Equipment</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <label className="label-text">Description</label>
                        <textarea className="styled-input" rows="3" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <button className="btn-primary" style={{ marginTop: '20px' }} onClick={handleSubmit}>Submit Expense</button>
                </div>
            )}

            {/* Expenses List */}
            <div className={`hr-card ${isAdminMode ? 'full-width' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 className="card-title">{isAdminMode ? 'All Expenses (Admin)' : 'My History'}</h3>
                    {canManage && (
                        <button
                            className="btn-primary"
                            style={{ padding: '5px 15px', fontSize: '0.9rem', backgroundColor: '#6366f1' }}
                            onClick={() => setIsAdminMode(!isAdminMode)}
                        >
                            {isAdminMode ? 'Switch to My View' : 'Switch to Admin View'}
                        </button>
                    )}
                </div>

                <div className="item-list" style={{ maxHeight: '500px' }}>
                    {expenses.map(e => (
                        <div key={e._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <span style={{ fontWeight: 'bold', color: 'white' }}>
                                    {e.amount} TND <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'normal' }}>({e.category})</span>
                                </span>
                                <span className={`status-badge status-${e.status.toLowerCase()}`}>{e.status}</span>
                            </div>
                            {isAdminMode && <div style={{ fontSize: '0.8rem', color: '#60a5fa' }}>User: {e.user?.name}</div>}
                            <div style={{ color: '#cbd5e1', margin: '5px 0' }}>{e.description}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(e.date).toLocaleDateString()}</div>

                            {/* Admin Actions */}
                            {isAdminMode && e.status === 'Pending' && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', width: '100%' }}>
                                    <button
                                        onClick={() => handleStatusUpdate(e._id, 'Approved')}
                                        style={{ flex: 1, padding: '5px', backgroundColor: '#10b981', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                                    >Approve</button>
                                    <button
                                        onClick={() => handleStatusUpdate(e._id, 'Rejected')}
                                        style={{ flex: 1, padding: '5px', backgroundColor: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                                    >Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                    {expenses.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No expenses found.</div>}
                </div>
            </div>
        </div>
    );
};

export default ExpensesPanel;
