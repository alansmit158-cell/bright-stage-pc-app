import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import projectService from '../services/projectService';
import { useAuth } from '../context/AuthContext';

const ProjectEditor = ({ project, onClose, onSave }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        eventName: '',
        status: 'Draft',
        client: { name: '', contactPerson: '', address: '', taxId: '', phone: '' },
        clientId: '',
        dates: { start: '', end: '' },
        siteName: '',
        siteAddress: '',
        notes: '',
        items: [],
        assignedUsers: [],
        team: {
            siteLeader: { name: '', phone: '' }
        },
        transport: {
            driverName: '',
            driverLicense: '',
            vehicleModel: '',
            vehiclePlate: ''
        }
    });

    const [clients, setClients] = useState([]);
    const [availableItems, setAvailableItems] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [itemSearch, setItemSearch] = useState('');
    const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
    const [filterSkill, setFilterSkill] = useState('');
    const [issuerCompany, setIssuerCompany] = useState('bright');
    const [availability, setAvailability] = useState({
        unavailableUsers: [],
        unavailableVehicles: [],
        unavailableDrivers: [],
        restWarnings: [],
        itemAvailability: {} // { itemId: { available: 5, reserved: 2 } }
    });
    const [itemSource, setItemSource] = useState('internal'); // 'internal' or 'subcontracted'
    const [subcontractedItems, setSubcontractedItems] = useState([]);
    const [batchSelection, setBatchSelection] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState({});

    // Lock if confirmed
    const isLocked = project?.permissions?.locked === true;
    const canAdvanceStatus = ['Founder', 'Manager', 'Storekeeper'].includes(user?.role);

    useEffect(() => {
        fetchData();
    }, []);

    // Auto-save effect
    useEffect(() => {
        if (!project) return; // Don't auto-save new projects until created
        const timer = setTimeout(() => {
            if (JSON.stringify(formData) !== JSON.stringify(project)) {
                saveProject(true);
            }
        }, 30000); // 30 seconds
        return () => clearTimeout(timer);
    }, [formData]);

    // Availability Check Effect
    useEffect(() => {
        if (formData.dates.start && formData.dates.end) {
            checkAvailability();
        }
    }, [formData.dates.start, formData.dates.end]);

    const fetchData = async () => {
        try {
            const [clientsRes, itemsRes, vehiclesRes, driversRes, usersRes] = await Promise.all([
                api.get('/clients'),
                api.get('/inventory'),
                api.get('/vehicles'),
                api.get('/drivers'),
                api.get('/users')
            ]);

            setClients(clientsRes.data);
            setAvailableItems(itemsRes.data.filter(i => i.category !== 'Subcontracted'));
            setSubcontractedItems(itemsRes.data.filter(i => i.category === 'Subcontracted'));
            setVehicles(vehiclesRes.data);
            setDrivers(driversRes.data);
            setUsers(usersRes.data);

            if (project) {
                // RELOAD Project to ensure we have full details (Items, Team, etc.)
                // The prop passed from the list might be partial or stale.
                const fullProjectRes = await api.get(`/projects/${project._id}`);
                const fullProject = fullProjectRes.data;

                setFormData({
                    ...fullProject,
                    client: fullProject.client || { name: '', contactPerson: '', address: '', taxId: '', phone: '' },
                    clientId: fullProject.client?._id || project.clientId || '', // Handle populated vs unpopulated
                    team: fullProject.team || { siteLeader: { name: '', phone: '' } },
                    transport: fullProject.transport || { driverName: '', driverLicense: '', vehicleModel: '', vehiclePlate: '' },
                    items: fullProject.items || [] // Critical: Ensure items are loaded
                });
            } else {
                // Pre-fill from existing client if query param
                const clientIdParam = searchParams.get('clientId');
                if (clientIdParam) {
                    const client = clientsRes.data.find(c => c._id === clientIdParam);
                    if (client) {
                        setFormData(prev => ({
                            ...prev,
                            clientId: client._id,
                            client: client
                        }));
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkAvailability = async () => {
        try {
            const res = await api.post('/availability', {
                startDate: formData.dates.start,
                endDate: formData.dates.end,
                excludeProjectId: project?._id,
                siteAddress: formData.siteAddress
            });
            setAvailability(res.data);
        } catch (err) {
            console.error('Availability check failed:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleClientSelect = (e) => {
        const clientId = e.target.value;
        const client = clients.find(c => c._id === clientId);
        if (client) {
            setFormData(prev => ({
                ...prev,
                clientId: client._id,
                client: {
                    name: client.name,
                    contactPerson: client.contactPerson,
                    address: client.address,
                    taxId: client.taxId,
                    phone: client.phone
                }
            }));
        }
    };

    const handleAddItem = (item, source = itemSource) => {
        setFormData(prev => {
            const existingItem = prev.items.find(i => (i.inventoryItem?._id || i.inventoryItem) === item._id);

            // Check availability if internal
            if (source === 'internal') {
                const availData = availability.itemAvailability[item._id] || {};
                const available = availData.available !== undefined ? availData.available : item.quantity;
                const currentQty = existingItem ? existingItem.quantity : 0;

                if (currentQty + 1 > available) {
                    alert(`Cannot add more than ${available} items from stock.`);
                    return prev;
                }
            }

            let newItems;
            if (existingItem) {
                newItems = prev.items.map(i =>
                    (i.inventoryItem?._id || i.inventoryItem) === item._id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            } else {
                newItems = [...prev.items, { inventoryItem: item._id, name: item.name, quantity: 1, source: source }];
            }
            return { ...prev, items: newItems };
        });
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleQuantityChange = (index, delta) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => {
                if (i === index) {
                    const newQty = Math.max(1, item.quantity + delta);

                    // Check availability if internal and increasing
                    if (item.source === 'internal' && delta > 0) {
                        const availID = typeof item.inventoryItem === 'object' ? item.inventoryItem._id : item.inventoryItem;
                        const availData = availability.itemAvailability[availID] || {};
                        const available = availData.available !== undefined ? availData.available : 9999;

                        if (newQty > available) {
                            alert(`Cannot exceed ${available} items from stock.`);
                            return item;
                        }
                    }

                    return { ...item, quantity: newQty };
                }
                return item;
            })
        }));
    };

    const saveProject = async (silent = false) => {
        if (!silent) setSaving(true);
        try {
            const payload = { ...formData };
            if (project) {
                await projectService.updateProject(project._id, payload);
            } else {
                await projectService.createProject(payload);
            }
            if (!silent) {
                onSave();
                onClose();
            }
            setLastSaved(new Date());
        } catch (err) {
            if (!silent) alert('Error saving project');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveProject(false);
    };

    // --- Workflow Logic ---
    const WORKFLOW_STEPS = ['Draft', 'Pickup', 'Return', 'Done'];
    // Map legacy statuses for display consistency
    let effectiveStatus = formData.status;
    if (effectiveStatus === 'Quote') effectiveStatus = 'Draft';
    if (effectiveStatus === 'Confirmed') effectiveStatus = 'Pickup';
    const currentStepIndex = WORKFLOW_STEPS.indexOf(effectiveStatus);

    const advanceStatus = (newStatus) => {
        setFormData(prev => ({ ...prev, status: newStatus }));
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="glass-panel" style={{ width: '90%', height: '90vh', display: 'flex', flexDirection: 'column', background: '#1a1b26' }}>

                {/* Header with Stepper */}
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h2>
                            {project ? 'Edit Project' : 'New Project'}
                            {saving && <span style={{ fontSize: '0.6em', marginLeft: '10px', color: '#fbbf24' }}>Saving...</span>}
                            {!saving && lastSaved && <span style={{ fontSize: '0.4em', marginLeft: '10px', color: '#34d399' }}>Saved {lastSaved.toLocaleTimeString()}</span>}
                        </h2>
                        <button className="btn btn-secondary" onClick={onClose}>Close</button>
                    </div>

                    {/* Stepper UI */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
                        {/* Line background */}
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: '#334155', zIndex: 0 }}></div>

                        {WORKFLOW_STEPS.map((step, idx) => {
                            const isCompleted = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;
                            return (
                                <div key={step} style={{ position: 'relative', zIndex: 1, textAlign: 'center', background: '#1a1b26', padding: '0 10px' }}>
                                    <div style={{
                                        width: '30px', height: '30px', borderRadius: '50%',
                                        background: isCompleted ? '#3b82f6' : '#1e293b',
                                        color: isCompleted ? 'white' : '#94a3b8',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 5px', border: isCurrent ? '2px solid white' : 'none',
                                        fontWeight: 'bold'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div style={{ fontSize: '12px', color: isCompleted ? 'white' : '#64748b' }}>{step}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Left: Form Details */}
                    <div style={{ flex: 2, padding: '20px', overflowY: 'auto' }}>
                        <form id="projectForm" onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label>Event Name *</label>
                                    <input required name="eventName" className="input-field" value={formData.eventName} onChange={handleChange} disabled={isLocked || formData.status === 'Done'} />
                                </div>

                                <h3>Client Info</h3>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '12px', color: '#818cf8', display: 'block', marginBottom: '5px' }}>Select Existing Client:</label>
                                    <select
                                        className="input-field"
                                        style={{ backgroundColor: '#13141f', border: '1px solid #6366f1' }}
                                        value={formData.clientId || ''}
                                        onChange={handleClientSelect}
                                        disabled={formData.status !== 'Draft' && formData.status !== 'Quote'}
                                    >
                                        <option value="">-- Choose from Database --</option>
                                        {clients.map(c => (
                                            <option key={c._id} value={c._id}>{c.customId} - {c.name} ({c.type})</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input placeholder="Client Name" name="client.name" className="input-field" value={formData['client.name']} onChange={handleChange} disabled={formData.status !== 'Draft'} />
                                    <input placeholder="Contact Person" name="client.contactPerson" className="input-field" value={formData['client.contactPerson']} onChange={handleChange} />
                                    <input placeholder="Address" name="client.address" className="input-field" value={formData['client.address']} onChange={handleChange} />
                                    <input placeholder="Tax ID" name="client.taxId" className="input-field" value={formData['client.taxId']} onChange={handleChange} />
                                    <input placeholder="Phone" name="client.phone" className="input-field" value={formData['client.phone']} onChange={handleChange} />
                                </div>

                                <h3>Logistics & Dates</h3>
                                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input type="date" name="dates.start" className="input-field" value={formData['dates.start']} onChange={handleChange} />
                                    <input type="date" name="dates.end" className="input-field" value={formData['dates.end']} onChange={handleChange} />
                                    <input placeholder="Site Name" name="siteName" className="input-field" value={formData.siteName} onChange={handleChange} />
                                    <input placeholder="Site Address" name="siteAddress" className="input-field" value={formData.siteAddress} onChange={handleChange} />
                                    <input placeholder="Site Leader Name" name="team.siteLeader.name" className="input-field" value={formData['team.siteLeader.name']} onChange={handleChange} />
                                </div>

                                <h3>Notes / Instructions</h3>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <textarea
                                        name="notes"
                                        className="input-field"
                                        style={{ height: '80px', resize: 'vertical' }}
                                        value={formData.notes}
                                        onChange={handleChange}
                                        placeholder="Add any specific notes for this project..."
                                    />
                                </div>

                                {['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && (
                                    <>
                                        <h3>Assign Team (Access)</h3>
                                        {/* Smart Filter Controls */}
                                        <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                                            <select
                                                className="input-field"
                                                style={{ width: '150px', fontSize: '12px' }}
                                                value={filterSkill}
                                                onChange={e => setFilterSkill(e.target.value)}
                                            >
                                                <option value="">-- All Skills --</option>
                                                {[...new Set(users.flatMap(u => u.technicalSkills || []))].sort().map(skill => (
                                                    <option key={skill} value={skill}>{skill}</option>
                                                ))}
                                            </select>

                                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer', color: showOnlyAvailable ? '#34d399' : '#cbd5e1' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={showOnlyAvailable}
                                                    onChange={e => setShowOnlyAvailable(e.target.checked)}
                                                />
                                                Show Only Available
                                            </label>

                                            <div style={{ flex: 1 }}></div>
                                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                                                {users.filter(u => {
                                                    const isBusy = availability.unavailableUsers?.includes(u._id) || availability.restWarnings?.find(w => w.userId === u._id);
                                                    if (showOnlyAvailable && isBusy) return false;
                                                    if (filterSkill && (!u.technicalSkills || !u.technicalSkills.includes(filterSkill))) return false;
                                                    return true;
                                                }).length} / {users.length} Users
                                            </span>
                                        </div>

                                        <div style={{ gridColumn: 'span 2', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {users.filter(u => {
                                                const isBusy = availability.unavailableUsers?.includes(u._id) || availability.restWarnings?.find(w => w.userId === u._id);
                                                if (showOnlyAvailable && isBusy) return false;
                                                if (filterSkill && (!u.technicalSkills || !u.technicalSkills.includes(filterSkill))) return false;
                                                return true;
                                            }).map(u => {
                                                const isBusy = availability.unavailableUsers && availability.unavailableUsers.includes(u._id);
                                                return (
                                                    <div key={u._id}
                                                        onClick={() => {
                                                            const current = formData.assignedUsers || [];
                                                            const exists = current.includes(u._id);

                                                            if (isBusy && !exists) {
                                                                if (!confirm(`${u.name} est déjà assigné à un autre projet sur ces dates. Voulez-vous quand même l'assigner ?`)) {
                                                                    return;
                                                                }
                                                            }

                                                            setFormData(prev => ({
                                                                ...prev,
                                                                assignedUsers: exists
                                                                    ? prev.assignedUsers.filter(id => id !== u._id)
                                                                    : [...(prev.assignedUsers || []), u._id]
                                                            }));
                                                        }}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '20px',
                                                            border: `1px solid ${formData.assignedUsers?.includes(u._id) ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                                                            background: formData.assignedUsers?.includes(u._id) ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                                                            color: isBusy ? '#ef4444' : (formData.assignedUsers?.includes(u._id) ? 'white' : '#94a3b8'),
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            opacity: (isBusy && !formData.assignedUsers?.includes(u._id)) ? 0.6 : 1,
                                                            display: 'flex', flexDirection: 'column', gap: '2px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: 'bold' }}>{u.name}</span>
                                                            {isBusy && <span style={{ fontSize: '10px' }}>BUSY</span>}
                                                            {!isBusy && availability.restWarnings?.find(w => w.userId === u._id) && (
                                                                <span title={availability.restWarnings.find(w => w.userId === u._id).reason} style={{ fontSize: '10px', color: '#fbbf24' }}>⚠️ REST</span>
                                                            )}
                                                        </div>
                                                        {/* Skill Badges */}
                                                        {u.technicalSkills && u.technicalSkills.length > 0 && (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                                                                {u.technicalSkills.slice(0, 2).map(skill => (
                                                                    <span key={skill} style={{ fontSize: '9px', padding: '1px 4px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', color: '#cbd5e1' }}>
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                                {u.technicalSkills.length > 2 && <span style={{ fontSize: '9px', color: '#94a3b8' }}>+{u.technicalSkills.length - 2}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                <h3>Transport (For Slip)</h3>
                                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <select
                                            name="transport.driverName"
                                            className="input-field"
                                            value={formData['transport.driverName']}
                                            onChange={(e) => {
                                                const selectedDriver = drivers.find(d => d.name === e.target.value);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    'transport.driverName': e.target.value,
                                                    'transport.driverLicense': selectedDriver ? (selectedDriver.cin || selectedDriver.licenseNumber) : ''
                                                }));
                                            }}
                                            style={{ backgroundColor: '#13141f', border: '1px solid #6366f1' }}
                                        >
                                            <option value="">-- Select Driver --</option>
                                            {drivers.map(d => {
                                                const dName = d.name.trim();
                                                const isBusy = availability.unavailableDrivers.some(ud => ud.toLowerCase() === dName.toLowerCase());
                                                return (
                                                    <option
                                                        key={d._id}
                                                        value={d.name}
                                                        style={isBusy ? { color: '#ef4444' } : {}}
                                                        disabled={isBusy}
                                                    >
                                                        {d.name} {isBusy ? '(Busy)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <select
                                            name="transport.vehicleModel"
                                            className="input-field"
                                            value={formData['transport.vehicleModel']}
                                            onChange={(e) => {
                                                const selectedVehicle = vehicles.find(v => v.model === e.target.value);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    'transport.vehicleModel': e.target.value,
                                                    'transport.vehiclePlate': selectedVehicle ? selectedVehicle.plateNumber : ''
                                                }));
                                            }}
                                            style={{ backgroundColor: '#13141f', border: '1px solid #6366f1' }}
                                        >
                                            <option value="">-- Select Vehicle --</option>
                                            {vehicles.map(v => {
                                                const vKey = v.plateNumber || v.model;
                                                const isBusy = availability.unavailableVehicles.some(uv =>
                                                    uv.toLowerCase() === (v.plateNumber || '').toLowerCase() ||
                                                    uv.toLowerCase() === v.model.toLowerCase()
                                                );

                                                return (
                                                    <option
                                                        key={v._id}
                                                        value={v.model}
                                                        style={isBusy ? { color: '#ef4444' } : {}}
                                                        disabled={isBusy}
                                                    >
                                                        {v.model} {v.plateNumber ? `(${v.plateNumber})` : ''} {isBusy ? '(Busy)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <input placeholder="License Number" name="transport.driverLicense" className="input-field" value={formData['transport.driverLicense']} onChange={handleChange} />
                                    <input placeholder="Plate Number" name="transport.vehiclePlate" className="input-field" value={formData['transport.vehiclePlate']} onChange={handleChange} />
                                </div>

                                <h3>Equipment Selection</h3>
                                <div style={{ gridColumn: 'span 2', background: '#13141f', padding: '15px', borderRadius: '12px', border: '1px solid #334155' }}>

                                    {/* Search Bar */}
                                    <div style={{ marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                                        <div style={{ position: 'relative', flex: '1 1 200px' }}>
                                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>🔍</span>
                                            <input
                                                type="text"
                                                placeholder="Search equipment..."
                                                value={itemSearch}
                                                onChange={(e) => setItemSearch(e.target.value)}
                                                style={{
                                                    width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px',
                                                    background: '#1e293b', border: '1px solid #475569', color: 'white',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                                            <button
                                                type="button"
                                                onClick={() => setItemSource('internal')}
                                                style={{
                                                    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                                                    background: itemSource === 'internal' ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)',
                                                    color: itemSource === 'internal' ? 'white' : '#60a5fa',
                                                    border: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap'
                                                }}
                                            >
                                                Bright Stock
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setItemSource('subcontracted')}
                                                style={{
                                                    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                                                    background: itemSource === 'subcontracted' ? '#f59e0b' : 'rgba(245, 158, 11, 0.1)',
                                                    color: itemSource === 'subcontracted' ? 'white' : '#fbbf24',
                                                    border: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap'
                                                }}
                                            >
                                                Sous-traitance
                                            </button>
                                        </div>
                                    </div>

                                    {/* Categories Accordion */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', minHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                                        {(() => {
                                            const sourceItems = itemSource === 'internal' ? availableItems : subcontractedItems;
                                            const filtered = sourceItems.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()));

                                            // Group by Category
                                            const grouped = filtered.reduce((acc, item) => {
                                                let cat = item.category;
                                                if (!cat || typeof cat !== 'string' || cat.trim() === '') {
                                                    cat = 'Other';
                                                } else {
                                                    cat = cat.trim();
                                                }

                                                // Capitalize first letter for consistency
                                                cat = cat.charAt(0).toUpperCase() + cat.slice(1);

                                                if (!acc[cat]) acc[cat] = [];
                                                acc[cat].push(item);
                                                return acc;
                                            }, {});

                                            const categories = Object.keys(grouped).sort();

                                            if (categories.length === 0) {
                                                return <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No items found.</div>;
                                            }

                                            return categories.map(category => {
                                                const isExpanded = expandedCategories[category] || itemSearch.length > 0; // Auto-expand on search
                                                const itemCount = grouped[category].length;

                                                return (
                                                    <div key={category} style={{ border: '1px solid #475569', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                                                        {/* Category Header */}
                                                        <div
                                                            onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                                                            style={{
                                                                padding: '16px 20px',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                cursor: 'pointer',
                                                                background: isExpanded ? '#475569' : '#334155',
                                                                transition: 'background-color 0.2s',
                                                                borderBottom: isExpanded ? '1px solid #475569' : 'none'
                                                            }}
                                                            onMouseOver={(e) => { if (!isExpanded) e.currentTarget.style.background = '#475569' }}
                                                            onMouseOut={(e) => { if (!isExpanded) e.currentTarget.style.background = '#334155' }}
                                                        >
                                                            <div style={{ fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px' }}>
                                                                <span style={{ fontSize: '14px', color: '#ffffff', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                                                                {category}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#ffffff', background: '#0f172a', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                                                                {itemCount}
                                                            </div>
                                                        </div>

                                                        {/* Items Grid */}
                                                        {isExpanded && (
                                                            <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', background: '#0f172a' }}>
                                                                {grouped[category].map(item => {
                                                                    const stockCount = item.quantity;

                                                                    const inCart = formData.items.find(i => (i.inventoryItem === item._id || i.inventoryItem?._id === item._id))?.quantity || 0;

                                                                    return (
                                                                        <div key={item._id} style={{
                                                                            background: '#1e293b', padding: '10px', borderRadius: '6px', border: '1px solid #334155',
                                                                            display: 'flex', flexDirection: 'column', gap: '5px', position: 'relative'
                                                                        }}>
                                                                            <div style={{ fontWeight: '600', color: '#f8fafc', fontSize: '13px', lineHeight: '1.2' }}>{item.name}</div>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8' }}>
                                                                                <span>{item.brand} {item.model}</span>
                                                                                {itemSource === 'internal' && (
                                                                                    (() => {
                                                                                        const availData = availability.itemAvailability[item._id] || {};
                                                                                        const avail = availData.available !== undefined ? availData.available : item.quantity;
                                                                                        const total = item.quantity;
                                                                                        const isLow = avail === 0;
                                                                                        const isWarning = avail < total;

                                                                                        return (
                                                                                            <span style={{
                                                                                                color: isLow ? '#ef4444' : (isWarning ? '#fbbf24' : '#34d399'),
                                                                                                fontWeight: 'bold'
                                                                                            }}>
                                                                                                Avl: {avail}/{total}
                                                                                            </span>
                                                                                        );
                                                                                    })()
                                                                                )}
                                                                            </div>

                                                                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '5px', paddingTop: '5px' }}>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleAddItem(item)}
                                                                                    style={{
                                                                                        flex: 1, background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px',
                                                                                        fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                                                                                    }}>
                                                                                    + Add
                                                                                </button>
                                                                                {inCart > 0 && (
                                                                                    (() => {
                                                                                        const availData = availability.itemAvailability[item._id] || {};
                                                                                        const available = availData.available !== undefined ? availData.available : item.quantity;
                                                                                        const isOver = itemSource === 'internal' && inCart > available;

                                                                                        return (
                                                                                            <span style={{
                                                                                                background: isOver ? '#ef4444' : '#10b981',
                                                                                                color: 'white', fontSize: '10px', fontWeight: 'bold',
                                                                                                padding: '2px 6px', borderRadius: '10px'
                                                                                            }}>
                                                                                                {inCart} in cart
                                                                                            </span>
                                                                                        );
                                                                                    })()
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>

                            </div>

                            <button type="submit" style={{ display: 'none' }}>Submit</button>
                        </form>
                    </div>

                    {/* Right: Selected Items & Status */}
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>

                        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                            <h3>Selected Equipment ({formData.items.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {formData.items.map((item, index) => (
                                    <div key={index} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</div>
                                            {item.source === 'subcontracted' && <div style={{ fontSize: '0.7em', color: '#fbbf24' }}>Subcontracted</div>}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button type="button" onClick={() => handleQuantityChange(index, -1)} className="btn-secondary" style={{ padding: '2px 8px' }}>-</button>
                                            <span>{item.quantity}</span>
                                            <button type="button" onClick={() => handleQuantityChange(index, 1)} className="btn-secondary" style={{ padding: '2px 8px' }}>+</button>
                                            <button type="button" onClick={() => handleRemoveItem(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                                        </div>
                                    </div>
                                ))}
                                {formData.items.length === 0 && <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No items selected</div>}
                            </div>
                        </div>

                        {/* Workflow Actions Section */}
                        <div style={{ padding: '20px', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                                {canAdvanceStatus ? (
                                    <>
                                        {formData.status === 'Draft' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {/* Restricted Financial Area */}
                                                {['Founder', 'Manager'].includes(user?.role) && (
                                                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '10px' }}>
                                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>Document Issuer:</div>
                                                        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setIssuerCompany('bright')}
                                                                style={{
                                                                    flex: 1, padding: '6px', fontSize: '11px', borderRadius: '4px',
                                                                    border: issuerCompany === 'bright' ? '1px solid #3b82f6' : '1px solid #334155',
                                                                    background: issuerCompany === 'bright' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                                                    color: issuerCompany === 'bright' ? '#60a5fa' : '#64748b',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                Bright Stage
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setIssuerCompany('square')}
                                                                style={{
                                                                    flex: 1, padding: '6px', fontSize: '11px', borderRadius: '4px',
                                                                    border: issuerCompany === 'square' ? '1px solid #f59e0b' : '1px solid #334155',
                                                                    background: issuerCompany === 'square' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                                                                    color: issuerCompany === 'square' ? '#fbbf24' : '#64748b',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                Square Event
                                                            </button>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                            <button type="button" className="btn-secondary" style={{ fontSize: '11px' }} onClick={() => project && projectService.downloadQuote(project._id, issuerCompany)}>
                                                                📄 Devis (Quote)
                                                            </button>
                                                            <button type="button" className="btn-secondary" style={{ fontSize: '11px' }} onClick={() => project && projectService.downloadInvoice(project._id, issuerCompany)}>
                                                                📄 Invoice
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {['Founder', 'Manager'].includes(user?.role) && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                        <button type="button" className="btn-secondary" style={{ fontSize: '11px', borderColor: '#3b82f6', color: '#3b82f6' }} onClick={() => navigate(`/quotes/new?projectId=${project._id}`)}>
                                                            ✨ Create Quote
                                                        </button>
                                                        <button type="button" className="btn-secondary" style={{ fontSize: '11px', borderColor: '#8b5cf6', color: '#8b5cf6' }} onClick={() => navigate(`/invoices/new?projectId=${project._id}`)}>
                                                            💶 Create Invoice
                                                        </button>
                                                    </div>
                                                )}

                                                <button className="btn" style={{ background: 'linear-gradient(45deg, #10b981, #3b82f6)', color: 'white', fontWeight: 'bold' }} onClick={async () => {
                                                    // Quick stock check
                                                    if (confirm("Confirm items and release for logistics (Pickup)?")) {
                                                        advanceStatus('Pickup');
                                                    }
                                                }}>
                                                    🚀 Confirm & Ready for Pickup →
                                                </button>
                                            </div>
                                        )}

                                        {formData.status === 'Pickup' && (
                                            <>
                                                {['Founder', 'Manager'].includes(user?.role) && (
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <button type="button" className="btn-secondary" style={{ width: '100%', fontSize: '11px', borderColor: '#8b5cf6', color: '#8b5cf6', marginBottom: '10px' }} onClick={() => navigate(`/invoices/new?projectId=${project._id}`)}>
                                                            💶 Create Invoice
                                                        </button>
                                                    </div>
                                                )}
                                                <button className="btn-secondary" onClick={() => project && projectService.downloadTransport(project._id, issuerCompany)}>
                                                    📄 Transport Slip
                                                </button>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '5px 0' }}>
                                                    Ensure signature is collected on pickup.
                                                </div>
                                                <button className="btn" style={{ background: '#f43f5e' }} onClick={() => advanceStatus('Return')}>
                                                    🔄 Mark as Returned
                                                </button>
                                            </>
                                        )}

                                        {formData.status === 'Return' && (
                                            <>
                                                <button className="btn-secondary">
                                                    📄 Return Checklist
                                                </button>
                                                <button className="btn" style={{ background: '#10b981' }} onClick={() => advanceStatus('Done')}>
                                                    🏁 Complete Project
                                                </button>
                                            </>
                                        )}

                                        {formData.status === 'Done' && (
                                            <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>
                                                Project Completed
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: '#94a3b8', textAlign: 'center', fontSize: '0.9rem' }}>
                                        Running as Site Manager<br />
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Workflow actions and PDF downloads are disabled.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '20px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', background: '#13141f' }}>
                            {batchSelection.length > 0 && (
                                <button
                                    onClick={() => {
                                        batchSelection.forEach(s => handleAddItem(s.item, s.source));
                                        setBatchSelection([]);
                                    }}
                                    className="btn"
                                    style={{ width: '100%', marginBottom: '10px', background: '#6366f1', border: 'none', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
                                >
                                    Add Selected ({batchSelection.length})
                                </button>
                            )}
                            <button type="submit" form="projectForm" className="btn" style={{ width: '100%' }}>Save Project</button>
                        </div>
                    </div>

                </div>
            </div>
            <style>{`
        .input-field {
            width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: white;
        } 
        h3 { color: #818cf8; margin-top: 20px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
        
        .action-card-btn {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #e2e8f0;
            cursor: pointer;
            transition: all 0.2s;
        }
        .action-card-btn:hover {
            background: rgba(255,255,255,0.08);
            border-color: rgba(255,255,255,0.2);
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .toggle-btn {
            padding: 6px 12px;
            border-radius: 20px;
            border: 1px solid #475569;
            background: transparent;
            color: #94a3b8;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.2s;
        }
        .toggle-btn:hover {
            border-color: #94a3b8;
            color: white;
        }
        .toggle-btn.active {
            background: rgba(16, 185, 129, 0.2);
            border-color: #10b981;
            color: #34d399;
        }
        .toggle-btn.active:hover {
            background: rgba(16, 185, 129, 0.3);
        }
      `}</style>
        </div >
    );
};

export default ProjectEditor;
