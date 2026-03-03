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
            return p.status !== 'Done'; // Show all active projects
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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{
                    fontSize: '28px',
                    margin: 0,
                    fontWeight: '700',
                    color: '#f8fafc',
                    textShadow: 'none', // Force remove any glitch effect
                    letterSpacing: '0.5px'
                }}>
                    Projects & Orders
                </h1>
                {['Founder', 'Manager', 'Site Manager'].includes(user?.role) && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {['Founder', 'Manager'].includes(user?.role) && (
                            <button className="btn" onClick={() => window.location.href = '/quote-builder'} style={{ background: '#FFD700', color: 'black' }}>
                                ✨ Smart Quote
                            </button>
                        )}
                        <button className="btn" onClick={() => { setSelectedProject(null); setShowEditor(true); }}>
                            + Project (Classic)
                        </button>
                    </div>
                )}
            </div>

            {/* Status Filter Bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
                {['All', 'My Projects', 'Pending', 'Late', 'Draft', 'Pickup', 'Return', 'Done'].map(status => (
                    <button
                        key={status}
                        onClick={() => { setFilterStatus(status === 'Pending' ? 'ValidationPending' : status); setCurrentPage(1); }}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: (filterStatus === status || (status === 'Pending' && filterStatus === 'ValidationPending')) ? '#6366f1' : 'rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            backgroundColor: (filterStatus === status || (status === 'Pending' && filterStatus === 'ValidationPending')) ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                            color: (filterStatus === status || (status === 'Pending' && filterStatus === 'ValidationPending')) ? '#818cf8' : '#94a3b8',
                            transition: 'all 0.2s',
                            outline: 'none',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                            <th style={{ padding: '16px' }}>Event Name</th>
                            <th style={{ padding: '16px' }}>Client</th>
                            <th style={{ padding: '16px' }}>Dates</th>
                            <th style={{ padding: '16px' }}>Status</th>
                            <th style={{ padding: '16px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
                        ) : filteredProjects.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No projects found for this filter</td></tr>
                        ) : (
                            displayedProjects.map(p => {
                                const getStatusColor = (s) => {
                                    switch (s) {
                                        case 'Draft': return '#94a3b8';
                                        case 'Quote': return '#a78bfa'; // Purple for Quotes
                                        case 'Pickup': return '#3b82f6'; // Focus color
                                        case 'Return': return '#f43f5e';
                                        case 'Done': return '#10b981';
                                        case 'Confirmed': return '#f97316'; // Orange-500
                                        default: return '#cbd5e1';
                                    }
                                }
                                return (
                                    <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px', fontWeight: '500' }}>
                                            {p.eventName}
                                            {p.isValidated === false && (
                                                <div style={{
                                                    fontSize: '10px',
                                                    color: '#fbbf24',
                                                    border: '1px solid #fbbf24',
                                                    display: 'inline-block',
                                                    padding: '2px 4px',
                                                    borderRadius: '4px',
                                                    marginLeft: '8px',
                                                    marginTop: '4px',
                                                    verticalAlign: 'middle'
                                                }}>
                                                    ⚠️ Pending Val
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px', color: '#94a3b8' }}>{p.client?.name || '-'}</td>
                                        <td style={{ padding: '16px', fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                            {p.dates?.start ? new Date(p.dates.start).toLocaleDateString() : '-'}
                                            {' -> '}
                                            {p.dates?.end ? new Date(p.dates.end).toLocaleDateString() : '-'}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                background: `rgba(255,255,255,0.1)`,
                                                border: `1px solid ${getStatusColor(p.status)}`,
                                                color: getStatusColor(p.status),
                                                fontSize: '12px'
                                            }}>
                                                {p.status}
                                            </span>
                                            {/* Payment Warning for Confirmed Projects */}
                                            {p.status === 'Confirmed' && (!p.paymentStatus || p.paymentStatus === 'Unpaid') && (
                                                <div title="Deposit Pending" style={{
                                                    fontSize: '10px',
                                                    color: '#f97316', // Orange-500
                                                    border: '1px solid #f97316',
                                                    display: 'inline-block',
                                                    padding: '2px 4px',
                                                    borderRadius: '4px',
                                                    marginLeft: '8px',
                                                    verticalAlign: 'middle',
                                                    cursor: 'help'
                                                }}>
                                                    ⚠️ Deposit
                                                </div>
                                            )}
                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '5px' }}>
                                                by {p.createdByName || p.createdBy?.username || 'Unknown'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {/* Manifest Validation / Logistics Button */}
                                            {['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedProject(p);
                                                        setShowLogistics(true);
                                                    }}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #8b5cf6',
                                                        background: p.status === 'Confirmed' ? 'linear-gradient(45deg, #8b5cf6, #6366f1)' : 'rgba(139, 92, 246, 0.1)',
                                                        color: p.status === 'Confirmed' ? 'white' : '#a78bfa',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    {['Draft', 'Quote'].includes(p.status) ? '📋 Prep' : '🚚 Logistics'}
                                                </button>
                                            )}

                                            {/* Worker can only view list, not manage details? For now allow Founder/Manager/SiteMgr/Storekeeper */}
                                            {['Founder', 'Manager', 'Site Manager', 'Storekeeper'].includes(user?.role) && (
                                                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleEdit(p)}>
                                                    Manage
                                                </button>
                                            )}
                                            {/* Quick Actions based on status */}
                                            {(p.status === 'Draft' || p.status === 'Quote') && (
                                                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); projectService.downloadQuote(p._id); }}>
                                                    📄 Quote
                                                </button>
                                            )}
                                            {['Pickup', 'Return', 'Done'].includes(p.status) && (
                                                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); projectService.downloadManifest(p._id); }}>
                                                    📄 Manifest (BL)
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {!loading && filteredProjects.length > 0 && (
                    <div style={{
                        padding: '15px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '15px'
                    }}>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProjects.length)} to {Math.min(currentPage * itemsPerPage, filteredProjects.length)} of {filteredProjects.length}
                        </span>

                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    color: currentPage === 1 ? '#666' : 'white',
                                    cursor: currentPage === 1 ? 'default' : 'pointer'
                                }}
                            >
                                &lt; Prev
                            </button>

                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#6366f1',
                                color: 'white',
                                width: '25px',
                                height: '25px',
                                borderRadius: '5px',
                                fontSize: '12px'
                            }}>
                                {currentPage}
                            </span>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    color: currentPage === totalPages ? '#666' : 'white',
                                    cursor: currentPage === totalPages ? 'default' : 'pointer'
                                }}
                            >
                                Next &gt;
                            </button>
                        </div>
                    </div>
                )}
            </div>

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
