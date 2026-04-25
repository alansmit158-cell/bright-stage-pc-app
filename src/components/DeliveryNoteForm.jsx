import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Trash2, Save, ClipboardList, Truck, Package } from 'lucide-react';
import './Logistics.css';
import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

const DeliveryNoteForm = ({ onClose, onSuccess, id: editId }) => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const id = editId; 
    const isEditMode = !!id;

    const [projects, setProjects] = useState([]);
    const [carriers, setCarriers] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        project: '',
        date: new Date().toISOString().split('T')[0],
        returnDate: '',
        carrier: '',
        vehiclePlate: '',
        vehicleModel: '',
        driverName: '',
        driverPhone: '',
        driverCin: '',
        status: 'Draft',
        notes: '',
        items: [],
        isIndividual: false
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [projRes, carrRes, driverRes, vehicleRes, invRes] = await Promise.all([
                    axios.get(`${API_URL}/projects`),
                    axios.get(`${API_URL}/carriers`),
                    axios.get(`${API_URL}/drivers`),
                    axios.get(`${API_URL}/vehicles`),
                    axios.get(`${API_URL}/inventory`)
                ]);

                setProjects(projRes.data);
                setCarriers(carrRes.data);
                setDrivers(driverRes.data);
                setVehicles(vehicleRes.data);
                setInventory(invRes.data);

                if (isEditMode) {
                    const noteRes = await axios.get(`${API_URL}/delivery-notes/${id}`);
                    const note = noteRes.data;
                    setFormData({
                        ...note,
                        date: note.date ? new Date(note.date).toISOString().split('T')[0] : '',
                        returnDate: note.returnDate ? new Date(note.returnDate).toISOString().split('T')[0] : '',
                        project: note.project?._id || note.project || '',
                        items: note.items || [],
                        isIndividual: note.isIndividual || false
                    });
                }
            } catch (err) {
                console.error("Error loading logistics data:", err);
                showError("Could not sync logistics records", "System Error");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, isEditMode]);

    const handleCarrierChange = (e) => {
        const carrierId = e.target.value;
        if (!carrierId) {
            setFormData(prev => ({ ...prev, carrier: '' }));
            return;
        }

        const selectedCarrier = carriers.find(c => c._id === carrierId);
        if (selectedCarrier) {
            setFormData(prev => ({
                ...prev,
                carrier: carrierId,
                vehiclePlate: selectedCarrier.vehiclePlate || '',
                vehicleModel: selectedCarrier.vehicleModel || '',
                driverName: `${selectedCarrier.firstName} ${selectedCarrier.lastName}`,
                driverCin: selectedCarrier.cin || '',
                driverPhone: selectedCarrier.phone || ''
            }));
        }
    };

    const handleDriverChange = (e) => {
        const driverId = e.target.value;
        const selectedDriver = drivers.find(d => d._id === driverId);
        if (selectedDriver) {
            setFormData(prev => ({
                ...prev,
                driverName: selectedDriver.name,
                driverCin: selectedDriver.cin || prev.driverCin,
                driverPhone: selectedDriver.phone || prev.driverPhone
            }));
        }
    };

    const handleVehicleChange = (e) => {
        const vehicleId = e.target.value;
        const selectedVehicle = vehicles.find(v => v._id === vehicleId);
        if (selectedVehicle) {
            setFormData(prev => ({
                ...prev,
                vehiclePlate: selectedVehicle.plateNumber,
                vehicleModel: selectedVehicle.model
            }));
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { inventoryItem: '', name: '', quantity: 1 }]
        }));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        if (field === 'inventoryItem') {
            const inv = inventory.find(i => i._id === value);
            newItems[index] = {
                ...newItems[index],
                inventoryItem: value,
                name: inv ? inv.name : ''
            };
        } else {
            newItems[index][field] = value;
        }
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                isIndividual: !formData.project
            };

            // Clean up empty ObjectIds to prevent Mongoose CastError
            if (!payload.project || payload.project === "") delete payload.project;
            if (!payload.carrier || payload.carrier === "") delete payload.carrier;
            if (!payload.returnDate || payload.returnDate === "") payload.returnDate = null;
            
            if (payload.items) {
                payload.items = payload.items.map(item => {
                    const newItem = { ...item };
                    if (!newItem.inventoryItem || newItem.inventoryItem === "" || newItem.inventoryItem === "null") {
                        delete newItem.inventoryItem;
                    }
                    return newItem;
                });
            }

            if (isEditMode) {
                await axios.put(`${API_URL}/delivery-notes/${id}`, payload);
                showSuccess("Delivery note updated successfully", "Success");
            } else {
                await axios.post(`${API_URL}/delivery-notes`, payload);
                showSuccess("New delivery note generated", "Success");
            }
            if (onSuccess) onSuccess();
            if (onClose) onClose();
        } catch (err) {
            showError("Processing failed: " + (err.response?.data?.error || err.message), "Error");
        }
    };

    if (loading) return (
        <div className="modal-overlay-blur">
             <div style={{ color: '#6366f1', fontWeight: '800' }}>Syncing Logistics Pipeline...</div>
        </div>
    );

    return (
        <div className="modal-overlay-blur">
            <div className="premium-modal-card" style={{ maxWidth: '950px' }}>
                <div className="modal-header-vibrant">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#6366f1' }}>
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>
                                {isEditMode ? 'Modify Dispatch Note' : 'Generate Dispatch Note'}
                            </h2>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Logistic movement registry & hardware tracking</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-x-btn">&times;</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div style={{ padding: '30px 40px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
                        <div className="grid-3-cols" style={{ gap: '25px', marginBottom: '30px' }}>
                            <div>
                                <label className="premium-label">Project / Event Name</label>
                                <select
                                    value={formData.project}
                                    onChange={e => {
                                        const projectId = e.target.value;
                                        const project = projects.find(p => p._id === projectId);
                                        if (project) {
                                            setFormData(prev => ({
                                                ...prev,
                                                project: projectId,
                                                date: project.dates?.start ? new Date(project.dates.start).toISOString().split('T')[0] : prev.date,
                                                returnDate: project.dates?.end ? new Date(project.dates.end).toISOString().split('T')[0] : prev.returnDate,
                                                driverName: project.transport?.driverName || prev.driverName,
                                                vehiclePlate: project.transport?.vehiclePlate || prev.vehiclePlate,
                                                vehicleModel: project.transport?.vehicleModel || prev.vehicleModel
                                            }));
                                        } else {
                                            setFormData(prev => ({ ...prev, project: projectId }));
                                        }
                                    }}
                                    className="premium-field-input"
                                >
                                    <option value="">-- Sans Projet (BL Individuel) --</option>
                                    {projects.map(p => (
                                        <option key={p._id} value={p._id}>{p.eventName} ({p.siteName})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="premium-label">Dispatch Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="premium-field-input"
                                />
                            </div>
                            <div>
                                <label className="premium-label">Return Date</label>
                                <input
                                    type="date"
                                    value={formData.returnDate}
                                    onChange={e => setFormData({ ...formData, returnDate: e.target.value })}
                                    className="premium-field-input"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <Truck size={16} style={{ color: '#6366f1' }} />
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff', textTransform: 'uppercase' }}>Fleet & Transport</span>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '25px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)', marginBottom: '30px' }}>
                            <div className="premium-field-group" style={{ marginBottom: '25px' }}>
                                <label className="premium-label">External Carrier Database</label>
                                <select value={formData.carrier || ''} onChange={handleCarrierChange} className="premium-field-input">
                                    <option value="">-- Choose logistics partner --</option>
                                    {carriers.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName} - {c.vehicleModel}</option>)}
                                </select>
                            </div>

                            <div className="grid-2-cols" style={{ gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label className="premium-label">Internal Driver Registry</label>
                                    <select onChange={handleDriverChange} className="premium-field-input">
                                        <option value="">-- Quick select --</option>
                                        {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="premium-label">Internal Fleet Unit</label>
                                    <select onChange={handleVehicleChange} className="premium-field-input">
                                        <option value="">-- Quick select --</option>
                                        {vehicles.map(v => <option key={v._id} value={v._id}>{v.plateNumber} - {v.model}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '15px' }}>
                                <div><label className="premium-label">Driver Name</label><input type="text" className="premium-field-input" value={formData.driverName} onChange={e => setFormData({ ...formData, driverName: e.target.value })} /></div>
                                <div><label className="premium-label">Phone</label><input type="text" className="premium-field-input" value={formData.driverPhone} onChange={e => setFormData({ ...formData, driverPhone: e.target.value })} /></div>
                                <div><label className="premium-label">Vehicle</label><input type="text" className="premium-field-input" value={formData.vehicleModel} onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })} /></div>
                                <div><label className="premium-label">Plate</label><input type="text" className="premium-field-input" value={formData.vehiclePlate} onChange={e => setFormData({ ...formData, vehiclePlate: e.target.value })} /></div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Package size={16} style={{ color: '#6366f1' }} />
                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff', textTransform: 'uppercase' }}>Assigned Hardware</span>
                            </div>
                            <button type="button" onClick={addItem} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
                                + Add Item
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                            {formData.items.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.08)', color: '#475569', fontSize: '13px' }}>
                                    No items linked to this dispatch registry yet.
                                </div>
                            ) : (
                                formData.items.map((item, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '15px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '14px', alignItems: 'center' }}>
                                        <div style={{ flex: 2 }}>
                                            <select value={item.inventoryItem} onChange={e => updateItem(index, 'inventoryItem', e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', width: '100%', outline: 'none' }}>
                                                <option value="" style={{ background: '#0f172a', color: '#fff' }}>-- Browse Inventory --</option>
                                                {inventory.map(inv => <option key={inv._id} value={inv._id} style={{ background: '#0f172a', color: '#fff' }}>{inv.name}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ flex: 1.5 }}><input type="text" value={item.name} onChange={item => updateItem(index, 'name', item.target.value)} placeholder="Custom designation" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', width: '100%', outline: 'none' }} /></div>
                                        <div style={{ width: '60px' }}><input type="number" value={item.quantity} onChange={item => updateItem(index, 'quantity', Number(item.target.value))} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', width: '100%', outline: 'none', textAlign: 'center' }} /></div>
                                        <button type="button" onClick={() => removeItem(index)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="grid-2-cols" style={{ gap: '25px' }}>
                            <div>
                                <label className="premium-label">Dispatch Status</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="premium-field-input">
                                    <option value="Draft">Draft / Brouillon</option>
                                    <option value="Validated">Validated / Confirmé</option>
                                    <option value="Cancelled">Cancelled / Annulé</option>
                                </select>
                            </div>
                            <div>
                                <label className="premium-label">Internal Logistic Notes</label>
                                <textarea rows="1" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="premium-field-input" placeholder="..." style={{ height: '48px', resize: 'none' }}></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer-actions">
                        <button type="button" onClick={onClose} className="premium-cancel-btn">Abort</button>
                        <button type="submit" className="premium-save-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={18} /> {isEditMode ? 'Update Checklist' : 'Generate Note'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .grid-2-cols { display: grid; grid-template-columns: 1fr 1fr; }
                .grid-3-cols { display: grid; grid-template-columns: 1.5fr 1fr 1fr; }
            `}</style>
        </div>
    );
};

export default DeliveryNoteForm;
