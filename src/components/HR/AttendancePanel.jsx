import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = `http://${window.location.hostname}:5000/api`;

import { useAuth } from '../../context/AuthContext';

const AttendancePanel = () => {
    const { user } = useAuth();
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myStatus, setMyStatus] = useState(null); // { isCheckedIn: false, currentSession: null }

    // Admin here means GLOBAL admin (Founder/Manager) who can see everyone's logs.
    // Site Manager should NOT see global logs, only their own.
    const isAdmin = ['Founder', 'Manager'].includes(user?.role);

    useEffect(() => {
        fetchData();
        fetchMyStatus();
    }, []);

    const fetchMyStatus = async () => {
        try {
            const res = await axios.get(`${API_URL}/hr/attendance/status`);
            setMyStatus(res.data);
        } catch (err) {
            console.error("Error fetching my status", err);
        }
    };

    const fetchData = async () => {
        if (!isAdmin) return; // Only admins fetch the full log
        try {
            const res = await axios.get(`${API_URL}/hr/attendance`);
            setAttendances(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async () => {
        try {
            await axios.post(`${API_URL}/hr/attendance/check-in`, {
                location: { address: 'PC Web App' },
                notes: 'PC Check-in'
            });
            alert("Checked In!");
            fetchMyStatus();
            if (isAdmin) fetchData();
        } catch (err) {
            alert("Error: " + (err.response?.data?.error || err.message));
        }
    };

    const handleClockOut = async () => {
        try {
            await axios.post(`${API_URL}/hr/attendance/check-out`, {
                notes: 'PC Check-out'
            });
            alert("Checked Out!");
            fetchMyStatus();
            if (isAdmin) fetchData();
        } catch (err) {
            alert("Error: " + (err.response?.data?.error || err.message));
        }
    };

    if (loading && isAdmin) return <div>Loading attendance...</div>;

    return (
        <div style={{ padding: '20px' }}>
            {/* My Personal Attendance */}
            <div className="hr-card" style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h3 className="card-title">My Attendance</h3>
                <div style={{ padding: '20px' }}>
                    {myStatus?.isCheckedIn ? (
                        <div>
                            <div style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#4ade80' }}>
                                Currently Working (Started: {new Date(myStatus.currentSession.checkIn).toLocaleTimeString()})
                            </div>
                            <button
                                onClick={handleClockOut}
                                style={{
                                    padding: '15px 40px', fontSize: '1.2rem', borderRadius: '50px',
                                    border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                STOP WORK
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#94a3b8' }}>
                                You are currently off-duty.
                            </div>
                            <button
                                onClick={handleClockIn}
                                style={{
                                    padding: '15px 40px', fontSize: '1.2rem', borderRadius: '50px',
                                    border: 'none', background: '#22c55e', color: 'white', cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                START WORK
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Admin Global Log */}
            {isAdmin && (
                <div className="hr-card" style={{ maxWidth: '100%' }}>
                    <h3 className="card-title">Global Attendance Log</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                                <th style={{ padding: '10px' }}>Employee</th>
                                <th>Type</th>
                                <th>Time</th>
                                <th>Location</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendances.map(a => (
                                <tr key={a._id} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: '10px' }}>{a.user?.name}</td>
                                    <td>
                                        <span style={{
                                            color: a.type === 'Overtime' ? '#facc15' : 'white',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            fontSize: '0.8rem'
                                        }}>{a.type}</span>
                                    </td>
                                    <td>
                                        <div>
                                            <span style={{ color: '#4ade80' }}>IN: {new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {a.checkOut && (
                                                <div style={{ color: '#f87171', fontSize: '0.8rem' }}>
                                                    OUT: {new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                {new Date(a.checkIn).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {a.location?.latitude ? (
                                            <a
                                                href={`https://maps.google.com/?q=${a.location.latitude},${a.location.longitude}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ color: '#60a5fa' }}
                                            >
                                                View Map
                                            </a>
                                        ) : (a.location?.address || 'N/A')}
                                    </td>
                                    <td>{a.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AttendancePanel;
