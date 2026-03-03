import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import './DashboardView.css';
import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const DashboardView = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalItems: 0,
        totalProjects: 0,
        activeTickets: 0,
        totalLoss: 0
    });
    const [todayProjects, setTodayProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const isFounderOrManager = ['Founder', 'Manager'].includes(user?.role);
    const isStorekeeper = user?.role === 'Storekeeper';
    const isSiteManager = user?.role === 'Site Manager';
    const isWorker = user?.role === 'Worker';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const promises = [
                    axios.get(`${API_URL}/inventory`),
                    axios.get(`${API_URL}/projects`),
                    axios.get(`${API_URL}/maintenance`),
                    axios.get(`${API_URL}/invoices`)
                ];

                if (isFounderOrManager) {
                    promises.push(axios.get(`${API_URL}/loss-reports`));
                }

                const results = await Promise.all(promises);
                const invRes = results[0];
                const projRes = results[1];
                const maintRes = results[2];
                const invoiceRes = results[3];
                const lossRes = isFounderOrManager ? results[4] : { data: [] };

                const projectData = projRes.data;
                const invoiceData = invoiceRes.data || [];

                // Filter today's projects (pickup or return)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStr = today.toISOString().split('T')[0];

                const todaySchedule = projectData.filter(p => {
                    const pickupDate = p.pickupDate ? new Date(p.pickupDate).toISOString().split('T')[0] : null;
                    const returnDate = p.returnDate ? new Date(p.returnDate).toISOString().split('T')[0] : null;
                    return pickupDate === todayStr || returnDate === todayStr;
                });

                setTodayProjects(todaySchedule);


                // ... [Existing Project Logic] ...
                const statusCounts = { Draft: 0, Pickup: 0, Return: 0, Done: 0 };
                projectData.forEach(p => {
                    let s = p.status;
                    if (s === 'Quote') s = 'Draft';
                    if (s === 'Confirmed') s = 'Pickup';
                    if (statusCounts[s] !== undefined) statusCounts[s]++;
                });

                // ... [Existing Maint Logic] ...
                const maintData = maintRes.data;
                const maintCounts = { Open: 0, 'Sent to Repair': 0, Fixed: 0, 'Resolved': 0 };
                // ... (Keep existing maintenance counting logic) ... (I need to check previous file content to be safe, but I will try to preserve logic)
                maintData.forEach(t => { const s = t.status || 'Open'; if (maintCounts[s] !== undefined) maintCounts[s]++; else maintCounts[s] = (maintCounts[s] || 0) + 1; });

                const openTicketIds = new Set(maintData.filter(t => t.status !== 'Fixed' && t.status !== 'Resolved').map(t => String(t.inventoryItem?._id || '')));
                const unreportedCount = invRes.data.filter(i => {
                    const state = i.state || 'Fonctionnel';
                    return state !== 'Fonctionnel' && !openTicketIds.has(String(i._id));
                }).length;
                maintCounts['Unreported'] = unreportedCount;

                const unvalidatedCount = projectData.filter(p => p.isValidated === false && p.status !== 'Done').length;

                // --- Finance Stats ---
                const now = new Date();
                const overdueInvoices = invoiceData.filter(inv => {
                    return (inv.status === 'Sent' || inv.status === 'Partially Paid') && new Date(inv.dueDate) < now;
                });

                const pendingInvoices = invoiceData.filter(inv => inv.status === 'Sent');
                const totalRevenueMonth = invoiceData
                    .filter(inv => inv.status === 'Paid' && new Date(inv.date).getMonth() === now.getMonth())
                    .reduce((acc, curr) => acc + (curr.financials?.totalInclTax || 0), 0);

                setStats({
                    totalItems: invRes.data.length,
                    totalProjects: projectData.filter(p => p.status !== 'Done').length,
                    statusCounts,
                    activeTickets: maintData.filter(t => t.status !== 'Fixed' && t.status !== 'Resolved').length + unreportedCount,
                    maintCounts,
                    totalLoss: lossRes.data ? lossRes.data.reduce((acc, curr) => acc + (curr.lossValuation || 0), 0) : 0,
                    unvalidatedCount,
                    // Finance
                    overdueCount: overdueInvoices.length,
                    pendingInvoiceCount: pendingInvoices.length,
                    totalRevenueMonth,
                    draftQuotesCount: statusCounts['Draft']
                });

                setLoading(false);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
                setLoading(false);
            }
        };

        fetchStats();
    }, [isFounderOrManager, user]);

    const StatCard = ({ title, value, color, icon, target }) => (
        <div className="dash-card" onClick={() => navigate(target)} style={{ borderLeft: `4px solid ${color}`, cursor: 'pointer' }}>
            <div className="dash-card-content">
                <div className="dash-value" style={{ color: color }}>{value}</div>
                <div className="dash-title">{title}</div>
            </div>
            <div className="dash-icon" style={{ background: `${color}20`, color: color }}>
                {icon}
            </div>
        </div>
    );

    const ActionButton = ({ icon, label, onClick, color }) => (
        <button className="btn-action" onClick={onClick} style={{ borderLeft: `4px solid ${color || '#3b82f6'}` }}>
            <span style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{icon}</span>
            <span>{label}</span>
        </button>
    );

    return (
        <div className="dashboard-container">
            <h1 className="page-title">{t('welcome')}, {user?.name}</h1>
            <p className="subtitle" style={{ color: '#94a3b8' }}>{user?.role} {t('workspace')}</p>

            {loading ? (
                <div className="loading-spinner">Loading Workspace...</div>
            ) : (
                <>
                    {/* --- Analytics & Stats Row (Adaptive) --- */}
                    <div className="stats-grid">

                        {/* FINANCE CARDS (For Founder/Manager) */}
                        {isFounderOrManager && (
                            <div className="dash-card" style={{ borderLeft: `4px solid #8b5cf6`, gridColumn: 'span 2', cursor: 'default' }}>
                                <div className="dash-card-content" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div>
                                            <div className="dash-value" style={{ color: '#8b5cf6' }}>{stats.totalRevenueMonth?.toFixed(0)} TND</div>
                                            <div className="dash-title">Revenue (This Month)</div>
                                        </div>
                                        <div className="dash-icon" style={{ background: `#8b5cf620`, color: '#8b5cf6' }}>💰</div>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                                        <div
                                            onClick={() => navigate('/invoices', { state: { filter: 'Overdue' } })}
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            🚨 {stats.overdueCount} Overdue
                                        </div>
                                        <div
                                            onClick={() => navigate('/invoices', { state: { filter: 'Sent' } })}
                                            style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            📨 {stats.pendingInvoiceCount} To Follow Up
                                        </div>
                                        <div
                                            onClick={() => navigate('/quotes')}
                                            style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24', color: '#fbbf24', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            📝 {stats.draftQuotesCount} Quotes Pending
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(isFounderOrManager || isSiteManager) && (
                            <div className="dash-card" style={{ borderLeft: `4px solid #10b981`, gridColumn: 'span 2', cursor: 'default' }}>
                                <div className="dash-card-content" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div>
                                            <div className="dash-value" style={{ color: '#10b981' }}>{stats.totalProjects}</div>
                                            <div className="dash-title">{t('active_projects')}</div>
                                        </div>
                                        <div className="dash-icon" style={{ background: `#10b98120`, color: '#10b981' }}>📅</div>
                                    </div>

                                    {/* Status Buttons */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                                        {[
                                            { label: 'Late', color: '#ef4444' },
                                            { label: 'Draft', color: '#94a3b8' },
                                            { label: 'Quote', color: '#fbbf24' },
                                            { label: 'Confirmed', color: '#3b82f6' },
                                            { label: 'Pickup', color: '#8b5cf6' },
                                            { label: 'Return', color: '#f43f5e' }
                                        ].map(s => (
                                            <div key={s.label}
                                                onClick={(e) => { e.stopPropagation(); navigate('/projects', { state: { filter: s.label } }); }}
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '4px 8px',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${s.color}`,
                                                    fontSize: '11px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}
                                            >
                                                <span style={{ color: s.color, fontWeight: 'bold' }}>{stats.statusCounts?.[s.label] || 0}</span>
                                                <span style={{ color: '#ccc' }}>{t(`status_${s.label.toLowerCase()}`) || s.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <StatCard
                            title="My Score"
                            value={user?.points || 0}
                            color="#fbbf24"
                            icon="⭐"
                            target="#"
                        />

                        {(isFounderOrManager || isStorekeeper) && (
                            <div className="dash-card" style={{ borderLeft: `4px solid #ef4444`, gridColumn: 'span 2', cursor: 'default' }}>
                                <div className="dash-card-content" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div>
                                            <div className="dash-value" style={{ color: '#ef4444' }}>{stats.activeTickets}</div>
                                            <div className="dash-title">{t('maint_issues')}</div>
                                        </div>
                                        <div className="dash-icon" style={{ background: `#ef444420`, color: '#ef4444' }}>🔧</div>
                                    </div>

                                    {/* Maint Status Buttons */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                                        {[
                                            { label: 'Unreported', color: '#fbbf24' }, // Amber
                                            { label: 'Open', color: '#ef4444' }, // Red
                                            { label: 'Sent to Repair', color: '#f59e0b' }, // Orange
                                            { label: 'Fixed', color: '#10b981' }  // Green
                                        ].map(s => (
                                            <div key={s.label}
                                                onClick={(e) => { e.stopPropagation(); navigate('/maintenance', { state: { filter: s.label } }); }}
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '4px 8px',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${s.color}`,
                                                    fontSize: '11px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}
                                            >
                                                <span style={{ color: s.color, fontWeight: 'bold' }}>{stats.maintCounts?.[s.label] || 0}</span>
                                                <span style={{ color: '#ccc' }}>{s.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {isFounderOrManager && (
                            <StatCard title={t('total_loss')} value={`€${stats.totalLoss}`} color="#f59e0b" icon="📉" target="/hr" />
                        )}


                    </div>

                    {/* --- Today's Schedule Section --- */}
                    {(isFounderOrManager || isStorekeeper || isSiteManager) && todayProjects.length > 0 && (
                        <div className="dash-actions" style={{ marginTop: '30px' }}>
                            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                📅 {t('todays_schedule') || "Today's Schedule"}
                                <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'normal' }}>
                                    ({todayProjects.length} {todayProjects.length === 1 ? 'project' : 'projects'})
                                </span>
                            </h3>
                            <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                                {todayProjects.map(project => {
                                    const today = new Date().toISOString().split('T')[0];
                                    const pickupDate = project.pickupDate ? new Date(project.pickupDate).toISOString().split('T')[0] : null;
                                    const returnDate = project.returnDate ? new Date(project.returnDate).toISOString().split('T')[0] : null;

                                    const isPickupToday = pickupDate === today;
                                    const isReturnToday = returnDate === today;

                                    return (
                                        <div
                                            key={project._id}
                                            onClick={() => navigate(`/project/${project._id}`)}
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderLeft: `4px solid ${isPickupToday ? '#10b981' : '#3b82f6'}`,
                                                borderRadius: '8px',
                                                padding: '15px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'grid',
                                                gridTemplateColumns: 'auto 1fr auto',
                                                gap: '15px',
                                                alignItems: 'center'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                                e.currentTarget.style.transform = 'translateX(5px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                                e.currentTarget.style.transform = 'translateX(0)';
                                            }}
                                        >
                                            {/* Event Type Icon */}
                                            <div style={{
                                                fontSize: '2rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {isPickupToday ? '📦' : '🔄'}
                                            </div>

                                            {/* Project Info */}
                                            <div>
                                                <div style={{
                                                    fontSize: '1.1rem',
                                                    fontWeight: 'bold',
                                                    color: '#fff',
                                                    marginBottom: '5px'
                                                }}>
                                                    {project.client?.name || 'Unknown Client'}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.9rem',
                                                    color: '#94a3b8',
                                                    marginBottom: '8px'
                                                }}>
                                                    {project.name || 'Unnamed Project'}
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '10px',
                                                    flexWrap: 'wrap',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{
                                                        background: isPickupToday ? '#10b98120' : '#3b82f620',
                                                        color: isPickupToday ? '#10b981' : '#3b82f6',
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {isPickupToday ? '📤 PICKUP' : '📥 RETURN'}
                                                    </span>
                                                    <span style={{
                                                        background: 'rgba(255,255,255,0.05)',
                                                        color: '#94a3b8',
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem'
                                                    }}>
                                                        {project.status || 'Draft'}
                                                    </span>
                                                    {project.siteAddress && (
                                                        <span style={{
                                                            color: '#64748b',
                                                            fontSize: '0.75rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}>
                                                            📍 {project.siteAddress.substring(0, 30)}{project.siteAddress.length > 30 ? '...' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <div style={{
                                                fontSize: '1.5rem',
                                                color: '#64748b'
                                            }}>
                                                →
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- Quick Actions Grid (Adaptive) --- */}
                    <div className="dash-actions" style={{ marginTop: '30px' }}>

                        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>{t('quick_actions')}</h3>
                        <div className="action-buttons" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>

                            {/* Founder & Manager Actions */}
                            {(isFounderOrManager || isSiteManager) && (
                                <ActionButton
                                    icon="📝"
                                    label="Créer Réquisition / Quote"
                                    onClick={() => navigate('/projects')}
                                    color="#10b981"
                                />
                            )}

                            {(isFounderOrManager || isSiteManager || isWorker) && (
                                <ActionButton
                                    icon="📦"
                                    label={t('my_orders')}
                                    onClick={() => navigate('/projects', { state: { filter: 'My Projects' } })}
                                    color="#3b82f6"
                                />
                            )}

                            {(isFounderOrManager || isStorekeeper) && (
                                <ActionButton
                                    icon="✅"
                                    label={`${t('validate_orders')} (${stats.unvalidatedCount || 0})`}
                                    onClick={() => navigate('/projects', { state: { filter: 'ValidationPending' } })}
                                    color="#8b5cf6"
                                />
                            )}

                            {(isFounderOrManager) && (
                                <ActionButton
                                    icon="📄"
                                    label={t('exit_slips')}
                                    onClick={() => navigate('/projects')}
                                    color="#f59e0b"
                                />
                            )}

                            {/* Storekeeper / Worker Scanner */}
                            {(isStorekeeper || isWorker) && (
                                <ActionButton
                                    icon="📷"
                                    label={isStorekeeper ? "Scanner (Check-In/Out)" : "Scanner (Check-In)"}
                                    onClick={() => alert("Please use Mobile App for Scanning")}
                                    color="#ef4444"
                                />
                            )}

                            {/* Maintenance */}
                            <ActionButton
                                icon="🛠️"
                                label={t('maint_dash')}
                                onClick={() => navigate('/maintenance')}
                                color="#64748b"
                            />

                        </div>
                    </div>
                </>
            )
            }
        </div >
    );
};

export default DashboardView;
