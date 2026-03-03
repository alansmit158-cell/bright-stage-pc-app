import React, { useState, useEffect } from 'react';
import { inventoryService } from '../services/inventoryService';

const InventoryForm = ({ itemToEdit, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        quantity: 0,
        brand: '',
        model: '',
        serialNumbers: '', // specific handling for array
        'storageLocation.zone': '',
        'storageLocation.shelving': '',
        'storageLocation.shelf': '',
        category: 'Sonorisation',
        state: 'Fonctionnel',
        rentalPricePerDay: 0,
        barcode: '',
        notes: ''
    });

    const categories = [
        'Accessoires image', 'Accessoires lumière', 'Accessoires son', 'Accessoires structure',
        'Câblage DMX', 'Câblage XLR', 'Câblage réseau', 'Câblage source',
        'Câblage électrique P17', 'Câblage électrique PCE', 'Distribution électrique',
        'Lumière rechargable', 'Lumière standard', 'Lumière théâtrale', 'Machines de scène',
        'Équipement bureautique', 'Microphonie', 'Multiprises', 'Outillage de maintenance',
        'Outillage de sécurité du site', 'Outillage du personnel', 'Outillage partagé',
        'Régie image', 'Régie lumière', 'Régie son', 'Scène', 'Sonorisation',
        'Structure métallique', 'Tissus & bâches', 'Téléviseurs', 'Écran LED'
    ];

    const states = ['Fonctionnel', 'Pièces manquantes', 'Cassé', 'à vérifier', 'à réparer'];

    useEffect(() => {
        if (itemToEdit) {
            setFormData({
                ...itemToEdit,
                serialNumbers: itemToEdit.serialNumbers ? itemToEdit.serialNumbers.join(', ') : '',
                'storageLocation.zone': itemToEdit.storageLocation?.zone || '',
                'storageLocation.shelving': itemToEdit.storageLocation?.shelving || '',
                'storageLocation.shelf': itemToEdit.storageLocation?.shelf || ''
            });
        }
    }, [itemToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                quantity: parseInt(formData.quantity) || 0,
                rentalPricePerDay: parseFloat(formData.rentalPricePerDay) || 0,
                serialNumbers: formData.serialNumbers.split(',').map(s => s.trim()).filter(s => s),
                storageLocation: {
                    zone: formData['storageLocation.zone'],
                    shelving: formData['storageLocation.shelving'],
                    shelf: formData['storageLocation.shelf']
                }
            };

            // Fix: unique sparse index fails on multiple nulls. Remove key if empty.
            if (!formData.barcode) {
                delete payload.barcode;
            } else {
                payload.barcode = formData.barcode;
            }

            // Cleanup flat fields
            delete payload['storageLocation.zone'];
            delete payload['storageLocation.shelving'];
            delete payload['storageLocation.shelf'];

            if (itemToEdit) {
                await inventoryService.update(itemToEdit._id, payload);
            } else {
                await inventoryService.create(payload);
            }
            onSuccess();
        } catch (err) {
            alert('Error saving item: ' + err.message);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="glass-panel" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', background: '#1a1b26' }}>
                <h2 style={{ marginTop: 0 }}>{itemToEdit ? 'Edit Item' : 'Add New Equipment'}</h2>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label>Name *</label>
                        <input required name="name" className="input-field" value={formData.name} onChange={handleChange} />
                    </div>

                    <div>
                        <label>Brand</label>
                        <input name="brand" className="input-field" value={formData.brand} onChange={handleChange} />
                    </div>

                    <div>
                        <label>Model</label>
                        <input name="model" className="input-field" value={formData.model} onChange={handleChange} />
                    </div>

                    <div>
                        <label>Category</label>
                        <select name="category" className="input-field" value={formData.category} onChange={handleChange}>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label>State</label>
                        <select name="state" className="input-field" value={formData.state} onChange={handleChange}>
                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label>Quantity</label>
                        <input type="number" name="quantity" className="input-field" value={formData.quantity} onChange={handleChange} />
                    </div>

                    <div>
                        <label>Price / Day</label>
                        <input type="number" name="rentalPricePerDay" className="input-field" value={formData.rentalPricePerDay} onChange={handleChange} />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label>Serial Numbers (comma separated)</label>
                        <input name="serialNumbers" className="input-field" value={formData.serialNumbers} onChange={handleChange} placeholder="SN001, SN002..." />
                    </div>

                    {/* Storage Location Group */}
                    <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ gridColumn: 'span 3', fontSize: '12px', color: '#94a3b8' }}>Storage Location</div>
                        <input placeholder="Zone" name="storageLocation.zone" className="input-field" value={formData['storageLocation.zone']} onChange={handleChange} />
                        <input placeholder="Shelving" name="storageLocation.shelving" className="input-field" value={formData['storageLocation.shelving']} onChange={handleChange} />
                        <input placeholder="Shelf" name="storageLocation.shelf" className="input-field" value={formData['storageLocation.shelf']} onChange={handleChange} />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label>Barcode</label>
                        <input name="barcode" className="input-field" value={formData.barcode} onChange={handleChange} />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label>Notes</label>
                        <textarea name="notes" className="input-field" style={{ height: '60px' }} value={formData.notes} onChange={handleChange} />
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn">Save Item</button>
                    </div>

                </form>
            </div>

            <style>{`
        .input-field {
            width: 100%;
            padding: 10px;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px;
            color: white;
            margin-top: 5px;
        }
        .input-field:focus {
            border-color: #6366f1;
            outline: none;
        }
        label {
            font-size: 13px;
            color: #94a3b8;
        }
      `}</style>
        </div>
    );
};

export default InventoryForm;
