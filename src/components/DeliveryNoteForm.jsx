import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import './Logistics.css';

const API_URL = `http://${window.location.hostname}:5000/api`;

const DeliveryNoteForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // If ID exists, we are editing
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
        carrier: '',
        vehiclePlate: '',
        vehicleModel: '',
        driverName: '',
        driverPhone: '',
        driverCin: '',
        status: 'Draft',
        notes: '',
        items: []
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch Projects (The API should filter based on permissions ideally, or we filter here)
                // For Site Manager, we ideally want only assigned projects. 
                // The /api/projects endpoint likely returns all for Manager/Founder, and assigned for Site Manager if implemented correctly.
                // Assuming /api/projects does RBAC.
                const projRes = await axios.get(`${API_URL}/projects`);
                setProjects(projRes.data);

                // Fetch Carriers (Public or restricted)
                const carrRes = await axios.get(`${API_URL}/carriers`);
                setCarriers(carrRes.data);

                // Fetch Drivers
                const driverRes = await axios.get(`${API_URL}/drivers`);
                setDrivers(driverRes.data);

                // Fetch Vehicles
                const vehicleRes = await axios.get(`${API_URL}/vehicles`);
                setVehicles(vehicleRes.data);

                // Fetch Inventory for item selection
                const invRes = await axios.get(`${API_URL}/inventory`);
                setInventory(invRes.data);

                if (isEditMode) {
                    const noteRes = await axios.get(`${API_URL}/delivery-notes/${id}`);
                    const note = noteRes.data;
                    setFormData({
                        ...note,
                        date: note.date ? new Date(note.date).toISOString().split('T')[0] : '',
                        project: note.project?._id || note.project,
                        items: note.items || []
                    });
                }
            } catch (err) {
                console.error("Error loading data:", err);
                // Alert if specific error
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
                vehiclePlate: selectedCarrier.vehiclePlate,
                vehicleModel: selectedCarrier.vehicleModel,
                driverName: `${selectedCarrier.firstName} ${selectedCarrier.lastName}`,
                driverCin: selectedCarrier.cin,
                driverPhone: selectedCarrier.phone
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
            if (isEditMode) {
                await axios.put(`${API_URL}/delivery-notes/${id}`, formData);
            } else {
                await axios.post(`${API_URL}/delivery-notes`, formData);
            }
            navigate('/delivery-notes');
        } catch (err) {
            alert("Error saving: " + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div className="text-white text-center mt-10">Chargement...</div>;

    return (
        <div className="logistics-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-6">
                    {isEditMode ? 'Éditer Bon de Livraison' : 'Nouveau Bon de Livraison'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Row 1: Project & Date */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="form-group">
                            <label className="block text-sm font-medium text-slate-400 mb-1">Projet *</label>
                            <select
                                required
                                value={formData.project}
                                onChange={e => setFormData({ ...formData, project: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                            >
                                <option value="">Sélectionner un projet...</option>
                                {projects.map(p => (
                                    <option key={p._id} value={p._id}>{p.eventName} ({p.siteName})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="block text-sm font-medium text-slate-400 mb-1">Date *</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-700 my-4"></div>
                    <h3 className="text-lg font-semibold text-blue-400">Transport & Véhicule</h3>

                    {/* Row 2: Carrier Select */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Transporteur (Auto-remplissage)</label>
                        <select
                            value={formData.carrier || ''}
                            onChange={handleCarrierChange}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                        >
                            <option value="">-- Sélectionner ou saisir manuellement ci-dessous --</option>
                            {carriers.map(c => (
                                <option key={c._id} value={c._id}>{c.firstName} {c.lastName} - {c.vehicleModel}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Chauffeur (Base de données)</label>
                            <select
                                onChange={handleDriverChange}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none"
                            >
                                <option value="">-- Choisir un chauffeur --</option>
                                {drivers.map(d => (
                                    <option key={d._id} value={d._id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Véhicule (Base de données)</label>
                            <select
                                onChange={handleVehicleChange}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none"
                            >
                                <option value="">-- Choisir un véhicule --</option>
                                {vehicles.map(v => (
                                    <option key={v._id} value={v._id}>{v.plateNumber} - {v.model}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Driver Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Nom Chauffeur (Saisie directe)</label>
                            <input
                                type="text"
                                value={formData.driverName}
                                onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Téléphone</label>
                            <input
                                type="text"
                                value={formData.driverPhone}
                                onChange={e => setFormData({ ...formData, driverPhone: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* Row 4: Vehicle Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Modèle Véhicule</label>
                            <input
                                type="text"
                                value={formData.vehicleModel}
                                onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Matricule</label>
                            <input
                                type="text"
                                value={formData.vehiclePlate}
                                onChange={e => setFormData({ ...formData, vehiclePlate: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none"
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-700 my-4"></div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-blue-400">Articles / Matériel</h3>
                        <button type="button" onClick={addItem} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500">
                            + Ajouter un article
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.items.map((item, index) => (
                            <div key={index} className="flex gap-4 items-end bg-slate-900/50 p-3 rounded border border-slate-700">
                                <div className="flex-1">
                                    <label className="block text-xs text-slate-500 mb-1">Article (Base de données)</label>
                                    <select
                                        value={item.inventoryItem}
                                        onChange={e => updateItem(index, 'inventoryItem', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm outline-none"
                                    >
                                        <option value="">-- Sélectionner --</option>
                                        {inventory.map(inv => (
                                            <option key={inv._id} value={inv._id}>{inv.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-slate-500 mb-1">Désignation (Si différent)</label>
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={e => updateItem(index, 'name', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm outline-none"
                                    />
                                </div>
                                <div style={{ width: '80px' }}>
                                    <label className="block text-xs text-slate-500 mb-1">Quantité</label>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm outline-none"
                                    />
                                </div>
                                <button type="button" onClick={() => removeItem(index)} className="text-red-500 p-1 hover:text-red-400">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-slate-700 my-4"></div>

                    {/* Row 5: Notes & Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                        <textarea
                            rows="3"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none"
                        >
                            <option value="Draft">Brouillon</option>
                            <option value="Validated">Validé</option>
                            <option value="Cancelled">Annulé</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-4 mt-8">
                        <button
                            type="button"
                            onClick={() => navigate('/delivery-notes')}
                            className="px-6 py-2 rounded bg-slate-700 text-white hover:bg-slate-600"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 font-bold"
                        >
                            Sauvegarder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeliveryNoteForm;
