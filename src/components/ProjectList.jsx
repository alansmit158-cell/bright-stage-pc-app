import React, { useEffect, useState } from 'react';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import ProjectEditor from './ProjectEditor';
import LogisticsManifestView from './LogisticsManifestView';

const ProjectList = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [showLogistics, setShowLogistics] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [filterStatus, setFilterStatus] = useState(location.state?.filter || 'All');

    useEffect(() => {
        if (location.state?.filter) {
            setFilterStatus(location.state.filter);
        }
        loadProjects();
    }, [location.state]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const data = await projectService.getAll();
            console.log("DEBUG: All Projects Fetched:", data.length);
            console.log("DEBUG: Unvalidated Projects:", data.filter(d => d.isValidated === false));
            setProjects(data);
        } catch (err) {
            alert('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (project) => {
        setSelectedProject(project);
        setShowEditor(true);
    };

    const handleEditorClose = () => {
        setShowEditor(false);
        setSelectedProject(null);
        loadProjects();
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredProjects = projects.filter(p => {
        if (filterStatus === 'All') {
            return p.status !== 'Done'; // Show all active projects (including Drafts/Quotes for visibility)
        }
        if (filterStatus === 'My Projects') {
            const creatorId = p.createdBy?._id || p.createdBy;
            return (creatorId === user?._id || p.createdByName === user?.username) && p.status !== 'Done';
        }
        if (filterStatus === 'ValidationPending') {
            return p.isValidated === false && p.status !== 'Done' && p.status !== 'Draft' && p.status !== 'Quote';
        }
        if (filterStatus === 'Late') {
            if (p.status !== 'Pickup') return false;
            if (!p.dates?.end) return false;
            return new Date() > new Date(p.dates.end);
        }
        return p.status === filterStatus;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    const displayedProjects = filteredProjects.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div style={{ padding: '0 5%', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'baseline', 
                marginBottom: '40px',
                marginTop: '20px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '32px',
                        margin: 0,
                        fontWeight: '800',
                        color: '#f8fafc',
                        letterSpacing: '-0.5px'
                    }}>
                        Projects & Orders
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '5px', fontSize: '14px' }}>
                        Manage your events, logistics and quotes in one place.
                    </p>
                </div>
                {['Founder', 'Manager', 'Site Manager'].includes(user?.role) && (
                    <div style={{ display: 'flex', gap: '15px' }}>
                        {['Founder', 'Manager'].includes(user?.role) && (
                            <button 
                                className="premium-action-btn" 
                                onClick={() => window.location.href = '/quote-builder'}
                                style={{ 
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', 
                                    color: '#000',
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    border: 'none',
                                    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)'
                                }}
                            >
                                ✨ Smart Quote
                            </button>
                        )}
                        <button 
                            className="premium-action-btn" 
                            onClick={() => { setSelectedProject(null); setShowEditor(true); }}
                            style={{ 
                                background: 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        >
                            + Project (Classic)
                        </button>
                    </div>
                )}
            </div>

            {/* Status Filter Bar - More Creative */}
            <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: '30px', 
                overflowX: 'auto', 
                padding: '10px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                {['All', 'My Projects', 'Pending', 'Late', 'Pickup', 'Return', 'Done'].map(status => (
                    <button
                        key={status}
                        onClick={() => { setFilterStatus(status === 'Pending' ? 'ValidationPending' : status); setCurrentPage(1); }}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: (filterStatus === status || (status === 'Pending' && filterStatus === 'ValidationPending')) ? 'rgba(99, 102, 241, 0.5)' : 'transparent',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            backgroundColor: (filterStatus === status || (status === 'Pending' && filterStatus === 'ValidationPending')) ? '#6366f1' : 'transparent',
                            color: (filterStatus === status || (status === 'Pending' && filterStatus === 'ValidationPending')) ? '#fff' : '#94a3b8',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            outline: 'none',
                            whiteSpace: 'nowrap',
                            boxShadow: (filterStatus === status || (status === 'Pending' && filterStatus === 'ValidationPending')) ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                        }}
                    >
                        {status}
                    </button>
                ))}
            </div>            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {loading ? (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>Loading Projects...</div>
                ) : filteredProjects.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>📁</div>
                        No projects found for this filter
                    </div>
                ) : (
                    displayedProjects.map(p => {
                        const getStatusColor = (s) => {
                            switch (s) {
                                case 'Draft': return '#94a3b8';
                                case 'Quote': return '#a78bfa';
                                case 'Pickup': return '#3b82f6';
                                case 'Return': return '#f43f5e';
                                case 'Done': return '#10b981';
                                case 'Confirmed': return '#f97316';
                                default: return '#cbd5e1';
                            }
                        }
                        return (
                            <div 
                                key={p._id} 
                                className="glass-panel project-item-card"
                                style={{ 
                                    padding: '20px', 
                                    display: 'grid', 
                                    gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                                    alignItems: 'center',
                                    gap: '20px',
                                    borderLeft: `4px solid ${getStatusColor(p.status)}`,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#fff' }}>{p.eventName}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                        by {p.createdByName || p.createdBy?.username || 'Unknown'}
                                    </div>
                                    {p.isValidated === false && (
                                        <span style={{
                                            fontSize: '10px',
                                            color: '#fbbf24',
                                            border: '1px solid rgba(251, 191, 36, 0.3)',
                                            background: 'rgba(251, 191, 36, 0.05)',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            marginTop: '6px',
                                            display: 'inline-block'
                                        }}>
                                            ⚠️ Pending Validation
                                        </span>
                                    )}
                                </div>

                                <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Client</div>
                                    <strong>{p.client?.name || '-'}</strong>
                                </div>

                                <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Event Dates</div>
                                    {p.dates?.start ? new Date(p.dates.start).toLocaleDateString() : '-'}
                                    <span style={{ margin: '0 5px' }}>→</span>
                                    {p.dates?.end ? new Date(p.dates.end).toLocaleDateString() : '-'}
                                </div>

                                <div>
                                    <span style={{
                                        padding: '5px 12px',
                                        borderRadius: '20px',
                                        background: `${getStatusColor(p.status)}15`,
                                        border: `1px solid ${getStatusColor(p.status)}40`,
                                        color: getStatusColor(p.status),
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        textTransform: 'uppercase'
                                    }}>
                                        {p.status}
                                    </span>
                                    {p.status === 'Confirmed' && (!p.paymentStatus || p.paymentStatus === 'Unpaid') && (
                                        <div style={{ fontSize: '10px', color: '#f97316', marginTop: '8px', fontWeight: 'bold' }}>
                                            🔸 Deposit Pending
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedProject(p); setShowLogistics(true); }}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: '8px',
                                                background: p.status === 'Confirmed' ? 'linear-gradient(45deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            🚚 {['Draft', 'Quote'].includes(p.status) ? 'Prep' : 'Logistics'}
                                        </button>
                                    )}

                                    <button 
                                        className="premium-action-btn"
                                        style={{ padding: '8px 14px', fontSize: '12px', background: 'rgba(255,255,255,0.03)' }} 
                                        onClick={() => handleEdit(p)}
                                    >
                                        ⚙️ Manage
                                    </button>
                                    
                                    {(p.status === 'Draft' || p.status === 'Quote') && (
                                        <button className="premium-action-btn" style={{ padding: '8px 14px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); projectService.downloadQuote(p._id); }}>
                                            📄
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && filteredProjects.length > 0 && (
                <div style={{
                    padding: '25px 0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '15px',
                    marginTop: '10px'
                }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProjects.length)} to {Math.min(currentPage * itemsPerPage, filteredProjects.length)} of {filteredProjects.length}
                    </span>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                color: currentPage === 1 ? '#475569' : 'white',
                                cursor: currentPage === 1 ? 'default' : 'pointer',
                                fontSize: '13px',
                                transition: 'all 0.2s'
                            }}
                        >
                            &lt; Prev
                        </button>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#6366f1',
                            color: 'white',
                            padding: '0 15px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: '700',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                        }}>
                            {currentPage} / {totalPages}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                color: currentPage === totalPages ? '#475569' : 'white',
                                cursor: currentPage === totalPages ? 'default' : 'pointer',
                                fontSize: '13px',
                                transition: 'all 0.2s'
                            }}
                        >
                            Next &gt;
                        </button>
                    </div>
                </div>
            )}

            {showEditor && (
                <ProjectEditor
                    project={selectedProject}
                    onClose={handleEditorClose}
                />
            )}

            {showLogistics && (
                <LogisticsManifestView
                    project={selectedProject}
                    onClose={() => { setShowLogistics(false); setSelectedProject(null); }}
                    onValidated={loadProjects}
                />
            )}
        </div>
    );
};

export default ProjectList;
