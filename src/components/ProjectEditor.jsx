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
            siteLeader: { name: '', phone: '' },
            chefChantier: ''
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
                const fullProjectRes = await api.get(`/projects/${project._id}`);
                const fullProject = fullProjectRes.data;

                setFormData({
                    ...fullProject,
                    client: fullProject.client || { name: '', contactPerson: '', address: '', taxId: '', phone: '' },
                    clientId: fullProject.client?._id || project.clientId || '',
                    team: fullProject.team || { siteLeader: { name: '', phone: '' }, chefChantier: '' },
                    transport: fullProject.transport || { driverName: '', driverLicense: '', vehicleModel: '', vehiclePlate: '' },
                    items: fullProject.items || []
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
            
            // Sanitization: Remove empty strings for ObjectId fields to prevent Mongoose CastError
            if (!payload.clientId || payload.clientId === "") delete payload.clientId;
            
            if (payload.team && (payload.team.chefChantier === "" || !payload.team.chefChantier)) {
                const newTeam = { ...payload.team };
                delete newTeam.chefChantier;
                payload.team = newTeam;
            }

            if (payload.dates) {
                if (!payload.dates.start || payload.dates.start === "") delete payload.dates.start;
                if (!payload.dates.end || payload.dates.end === "") delete payload.dates.end;
            }

            if (payload.assignedUsers) {
                payload.assignedUsers = payload.assignedUsers.filter(uid => uid && uid !== "");
            }

            if (payload.items) {
                payload.items = payload.items.map(item => {
                    const newItem = { ...item };
                    const invId = typeof newItem.inventoryItem === 'object' ? newItem.inventoryItem?._id : newItem.inventoryItem;
                    const subId = typeof newItem.subcontractedItem === 'object' ? newItem.subcontractedItem?._id : newItem.subcontractedItem;
                    
                    if (!invId || invId === "") delete newItem.inventoryItem;
                    if (!subId || subId === "") delete newItem.subcontractedItem;
                    
                    return newItem;
                });
            }

            if (project) {
                await projectService.update(project._id, payload);
            } else {
                await projectService.create(payload);
            }
            if (!silent) {
                onSave();
                onClose();
            }
            setLastSaved(new Date());
        } catch (err) {
            if (!silent) {
                const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown error';
                alert(`Error saving project: ${errMsg}`);
            }
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveProject(false);
    };

    const WORKFLOW_STEPS = ['Draft', 'Pickup', 'Return', 'Done'];
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
                <div style={{ 
                    padding: '30px 40px', 
                    background: 'linear-gradient(to right, #1a1b26, #16161e)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '25px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', margin: 0, color: '#f8fafc' }}>
                                {project ? 'Modify Project' : 'Create New Project'}
                                {saving && <span style={{ fontSize: '12px', marginLeft: '15px', color: '#fbbf24', fontWeight: '400' }}>● Syncing...</span>}
                                {!saving && lastSaved && <span style={{ fontSize: '11px', marginLeft: '15px', color: '#34d399', fontWeight: '400', opacity: 0.8 }}>Last saved at {lastSaved.toLocaleTimeString()}</span>}
                            </h2>
                        </div>
                        <button 
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#94a3b8',
                                padding: '8px 20px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                        >
                            Close
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', width: '100%', maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
                        <div style={{ position: 'absolute', top: '15px', left: '40px', right: '40px', height: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }}></div>

                        {WORKFLOW_STEPS.map((step, idx) => {
                            const isCompleted = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;
                            return (
                                <div key={step} style={{ position: 'relative', zIndex: 1, textAlign: 'center', transition: 'all 0.4s' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '10px',
                                        background: isCompleted ? '#6366f1' : '#1e293b',
                                        color: isCompleted ? 'white' : '#64748b',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 8px', 
                                        border: isCurrent ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                                        fontWeight: '800',
                                        fontSize: '14px',
                                        boxShadow: isCurrent ? '0 0 15px rgba(99, 102, 241, 0.5)' : 'none'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div style={{ 
                                        fontSize: '11px', 
                                        fontWeight: isCurrent ? '700' : '500', 
                                        color: isCurrent ? '#fff' : (isCompleted ? '#818cf8' : '#475569'),
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}>
                                        {step}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Left: Form Details */}
                    <div style={{ flex: 2, padding: '40px', overflowY: 'auto', background: '#1a1b26' }}>
                        <form id="projectForm" onSubmit={handleSubmit} style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>

                                {/* Section: General */}
                                <div className="editor-section">
                                    <label className="section-label">General Information</label>
                                    <div style={{ marginTop: '15px' }}>
                                        <label className="input-label">Event Project Name *</label>
                                        <input required name="eventName" className="premium-input-field" placeholder="Ex: Gala Annual 2024" value={formData.eventName} onChange={handleChange} disabled={isLocked || formData.status === 'Done'} />
                                    </div>
                                </div>

                                {/* Section: Client */}
                                <div className="editor-section">
                                    <label className="section-label">Client Details</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '15px' }}>
                                        <div>
                                            <label className="input-label">Search Existing Client</label>
                                            <select className="premium-input-field" value={formData.clientId || ''} onChange={handleClientSelect} disabled={formData.status !== 'Draft' && formData.status !== 'Quote'}>
                                                <option value="">-- Select from database --</option>
                                                {clients.map(c => <option key={c._id} value={c._id}>{c.customId} - {c.name}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label className="input-label">Legal Name / Client Name</label>
                                                <input name="client.name" className="premium-input-field" value={formData.client?.name || ''} onChange={handleChange} disabled={formData.status !== 'Draft'} />
                                            </div>
                                            <input placeholder="Contact Person" name="client.contactPerson" className="premium-input-field" value={formData.client?.contactPerson || ''} onChange={handleChange} />
                                            <input placeholder="Phone Number" name="client.phone" className="premium-input-field" value={formData.client?.phone || ''} onChange={handleChange} />
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <input placeholder="Headquarters Address" name="client.address" className="premium-input-field" value={formData.client?.address || ''} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Logistics */}
                                <div className="editor-section">
                                    <label className="section-label">Logistics & Schedule</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                                        <input type="date" name="dates.start" className="premium-input-field" value={formData.dates?.start || ''} onChange={handleChange} />
                                        <input type="date" name="dates.end" className="premium-input-field" value={formData.dates?.end || ''} onChange={handleChange} />
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <input placeholder="Setup Location / Site Name" name="siteName" className="premium-input-field" value={formData.siteName} onChange={handleChange} />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <input placeholder="Full Logistics Address" name="siteAddress" className="premium-input-field" value={formData.siteAddress} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Team */}
                                {['Founder', 'Manager', 'Storekeeper'].includes(user?.role) && (
                                    <div className="editor-section">
                                        <label className="section-label">Assign Team</label>
                                        <div style={{ marginTop: '15px' }}>
                                            <div style={{ marginBottom: '20px' }}>
                                                <label className="input-label" style={{ color: '#6366f1', fontWeight: 'bold' }}>Chef Chantier (Supervisor)</label>
                                                <select 
                                                    className="premium-input-field" 
                                                    name="team.chefChantier" 
                                                    value={formData.team?.chefChantier || ''} 
                                                    onChange={handleChange}
                                                    style={{ border: '1px solid rgba(99, 102, 241, 0.4)', background: 'rgba(99, 102, 241, 0.05)' }}
                                                >
                                                    <option value="">-- Select Supervisor --</option>
                                                    {users.map(u => (
                                                        <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                                                <select className="premium-input-field" style={{ flex: 1 }} value={filterSkill} onChange={e => setFilterSkill(e.target.value)}>
                                                    <option value="">-- All Skills --</option>
                                                    {[...new Set(users.flatMap(u => u.technicalSkills || []))].sort().map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                    <input type="checkbox" checked={showOnlyAvailable} onChange={e => setShowOnlyAvailable(e.target.checked)} />
                                                    Only Available
                                                </label>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {users.filter(u => {
                                                    const isBusy = availability.unavailableUsers?.includes(u._id) || availability.restWarnings?.find(w => w.userId === u._id);
                                                    if (showOnlyAvailable && isBusy) return false;
                                                    if (filterSkill && (!u.technicalSkills || !u.technicalSkills.includes(filterSkill))) return false;
                                                    return true;
                                                }).map(u => {
                                                    const isSelected = formData.assignedUsers?.includes(u._id);
                                                    const isBusy = availability.unavailableUsers?.includes(u._id);
                                                    return (
                                                        <div key={u._id} onClick={() => {
                                                            if (isBusy && !isSelected && !confirm(`${u.name} is busy. Assign anyway?`)) return;
                                                            setFormData(p => ({
                                                                ...p,
                                                                assignedUsers: isSelected ? p.assignedUsers.filter(id => id !== u._id) : [...(p.assignedUsers || []), u._id]
                                                            }));
                                                        }} style={{
                                                            padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px',
                                                            background: isSelected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                                                            border: `1px solid ${isSelected ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                                                            color: isBusy ? '#ef4444' : (isSelected ? '#fff' : '#94a3b8')
                                                        }}>
                                                            {u.name} {isBusy && '(Busy)'}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Section: Transport */}
                                <div className="editor-section">
                                    <label className="section-label">Transport</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                                        <select className="premium-input-field" value={formData['transport.driverName']} onChange={e => {
                                            const d = drivers.find(d => d.name === e.target.value);
                                            setFormData(p => ({ ...p, 'transport.driverName': e.target.value, 'transport.driverLicense': d ? (d.cin || d.licenseNumber) : '' }));
                                        }}>
                                            <option value="">-- Driver --</option>
                                            {drivers.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                                        </select>
                                        <select className="premium-input-field" value={formData['transport.vehicleModel']} onChange={e => {
                                            const v = vehicles.find(v => v.model === e.target.value);
                                            setFormData(p => ({ ...p, 'transport.vehicleModel': e.target.value, 'transport.vehiclePlate': v ? v.plateNumber : '' }));
                                        }}>
                                            <option value="">-- Vehicle --</option>
                                            {vehicles.map(v => <option key={v._id} value={v.model}>{v.model} ({v.plateNumber})</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Section: Equipment Search */}
                                <div className="editor-section">
                                    <label className="section-label">Equipment Database</label>
                                    <div style={{ marginTop: '15px' }}>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                            <input placeholder="Search stock..." className="premium-input-field" style={{ flex: 1 }} value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
                                            <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <button type="button" onClick={() => setItemSource('internal')} style={{ padding: '0 15px', background: itemSource === 'internal' ? '#3b82f6' : 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>Bright</button>
                                                <button type="button" onClick={() => setItemSource('subcontracted')} style={{ padding: '0 15px', background: itemSource === 'subcontracted' ? '#f59e0b' : 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>Extra</button>
                                            </div>
                                        </div>
                                        <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {(() => {
                                                const list = itemSource === 'internal' ? availableItems : subcontractedItems;
                                                const filtered = list.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()));
                                                return filtered.map(item => (
                                                    <div key={item._id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.name}</div>
                                                            <div style={{ fontSize: '12px', color: '#64748b' }}>Stock: {availability.itemAvailability[item._id]?.available ?? item.quantity}</div>
                                                        </div>
                                                        <button type="button" onClick={() => handleAddItem(item)} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '8px', cursor: 'pointer' }}>Add</button>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </form>
                    </div>

                    {/* Right: Selected Items & Status */}
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
                            <h3 style={{ margin: '0 0 20px 0' }}>Selection ({formData.items.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {formData.items.map((item, idx) => (
                                    <div key={idx} style={{ background: '#1e293b', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span style={{ fontWeight: '700', fontSize: '14px' }}>{item.name}</span>
                                            <button type="button" onClick={() => handleRemoveItem(idx)} style={{ color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '2px' }}>
                                                <button type="button" onClick={() => handleQuantityChange(idx, -1)} style={{ width: '28px', height: '28px', border: 'none', background: 'none', color: '#fff', cursor: 'pointer' }}>-</button>
                                                <span style={{ width: '30px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                                                <button type="button" onClick={() => handleQuantityChange(idx, 1)} style={{ width: '28px', height: '28px', border: 'none', background: 'none', color: '#fff', cursor: 'pointer' }}>+</button>
                                            </div>
                                            {item.source === 'subcontracted' && <span style={{ fontSize: '10px', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px' }}>Subcontracted</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions Panel */}
                        <div style={{ padding: '30px', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            {canAdvanceStatus && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                                    {formData.status === 'Draft' && (
                                        <button type="button" style={{ background: 'linear-gradient(45deg, #10b981, #3b82f6)', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }} onClick={() => advanceStatus('Pickup')}>🚀 Confirm & Release →</button>
                                    )}
                                    {formData.status === 'Pickup' && <button type="button" style={{ background: '#f43f5e', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }} onClick={() => advanceStatus('Return')}>🔄 Mark Returned</button>}
                                    {formData.status === 'Return' && <button type="button" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }} onClick={() => advanceStatus('Done')}>🏁 Complete</button>}
                                </div>
                            )}
                            <button type="submit" form="projectForm" className="btn" style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#6366f1', border: 'none' }}>Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .premium-input-field {
                    width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: white; font-size: 14px; transition: all 0.2s; outline: none; box-sizing: border-box;
                }
                .premium-input-field:focus { border-color: #6366f1; background: rgba(99,102,241,0.05); }
                .editor-section { background: rgba(255,255,255,0.02); padding: 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.03); }
                .section-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #475569; display: block; margin-bottom: 5px; }
                .input-label { display: block; font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; margin-left: 4px; }
                .action-card-btn { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px; color: #e2e8f0; cursor: pointer; transition: all 0.2s; font-size: 13px; font-weight: 600; }
                .action-card-btn:hover { background: rgba(255,255,255,0.08); border-color: #6366f1; }
                h3 { color: #818cf8; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; }
            `}</style>
        </div>
    );
};

export default ProjectEditor;
