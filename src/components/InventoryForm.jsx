import React, { useState, useEffect } from 'react';
import { inventoryService } from '../services/inventoryService';
import { useNotification } from '../context/NotificationContext';

const InventoryForm = ({ itemToEdit, onClose, onSuccess }) => {
    const { showSuccess, showError } = useNotification();
    const [formData, setFormData] = useState({
        name: '',
        quantity: 0,
        brand: '',
        model: '',
        serialNumbers: '',
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
    ].sort();

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

            if (!formData.barcode) {
                delete payload.barcode;
            }

            delete payload['storageLocation.zone'];
            delete payload['storageLocation.shelving'];
            delete payload['storageLocation.shelf'];

            if (itemToEdit) {
                await inventoryService.update(itemToEdit._id, payload);
                showSuccess("Equipment updated successfully", "Inventory");
            } else {
                await inventoryService.create(payload);
                showSuccess("New equipment added", "Inventory");
            }
            onSuccess();
        } catch (err) {
            showError(err.response?.data?.error || err.message, "Saving Failed");
        }
    };

    return (
        <div className="modal-overlay-blur">
            <div className="premium-modal-card">
                <div className="modal-header-vibrant">
                    <h2>{itemToEdit ? '✏️ Edit Equipment' : '✨ Add New Equipment'}</h2>
                    <button className="close-x-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="premium-form-grid">
                    <div style={{ gridColumn: 'span 2' }}>
                        <label className="premium-label">Asset Name *</label>
                        <input required name="name" className="premium-field-input" placeholder="Ex: Beam 300 Moving Head" value={formData.name} onChange={handleChange} />
                    </div>

                    <div className="form-group-half">
                        <label className="premium-label">Brand</label>
                        <input name="brand" className="premium-field-input" placeholder="Brand Name" value={formData.brand} onChange={handleChange} />
                    </div>

                    <div className="form-group-half">
                        <label className="premium-label">Model</label>
                        <input name="model" className="premium-field-input" placeholder="Model Number" value={formData.model} onChange={handleChange} />
                    </div>

                    <div className="form-group-half">
                        <label className="premium-label">Category</label>
                        <select name="category" className="premium-field-input" value={formData.category} onChange={handleChange}>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="form-group-half">
                        <label className="premium-label">State</label>
                        <select name="state" className="premium-field-input" value={formData.state} onChange={handleChange}>
                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="form-group-half">
                        <label className="premium-label">Quantity</label>
                        <input type="number" name="quantity" className="premium-field-input" value={formData.quantity} onChange={handleChange} />
                    </div>

                    <div className="form-group-half">
                        <label className="premium-label">Price / Day (TND)</label>
                        <input type="number" name="rentalPricePerDay" className="premium-field-input" value={formData.rentalPricePerDay} onChange={handleChange} />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label className="premium-label">Serial Numbers</label>
                        <input name="serialNumbers" className="premium-field-input" value={formData.serialNumbers} onChange={handleChange} placeholder="SN001, SN002, SN003..." />
                    </div>

                    <div style={{ gridColumn: 'span 2' }} className="location-section-box">
                        <label className="premium-label" style={{ marginBottom: '12px', display: 'block' }}>📍 Storage Location</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                            <input placeholder="Zone (Main)" name="storageLocation.zone" className="premium-field-input" value={formData['storageLocation.zone']} onChange={handleChange} />
                            <input placeholder="Shelving" name="storageLocation.shelving" className="premium-field-input" value={formData['storageLocation.shelving']} onChange={handleChange} />
                            <input placeholder="Shelf" name="storageLocation.shelf" className="premium-field-input" value={formData['storageLocation.shelf']} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label className="premium-label">Barcode / QR Identifier</label>
                        <input name="barcode" className="premium-field-input" placeholder="Scan or type barcode" value={formData.barcode} onChange={handleChange} />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label className="premium-label">Additional Notes</label>
                        <textarea name="notes" className="premium-field-input" style={{ height: '80px', paddingTop: '12px' }} value={formData.notes} onChange={handleChange} placeholder="Maintenance info, condition details..." />
                    </div>

                    <div className="modal-footer-actions">
                        <button type="button" onClick={onClose} className="premium-cancel-btn">Cancel</button>
                        <button type="submit" className="premium-save-btn">{itemToEdit ? 'Update Asset' : 'Register Equipment'}</button>
                    </div>
                </form>
            </div>

            <style>{`
                .modal-overlay-blur { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; justify-content: center; alignItems: center; z-index: 2000; padding: 20px; }
                .premium-modal-card { background: #1a1b26; width: 680px; max-height: 95vh; overflow-y: auto; border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 100px rgba(0,0,0,0.6); position: relative; animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                
                @keyframes modalPop { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                
                .modal-header-vibrant { padding: 30px 40px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to right, rgba(99, 102, 241, 0.05), transparent); }
                .modal-header-vibrant h2 { margin: 0; font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
                .close-x-btn { background: rgba(255,255,255,0.05); border: none; color: #94a3b8; font-size: 24px; cursor: pointer; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .close-x-btn:hover { background: #ef4444; color: white; transform: rotate(90deg); }

                .premium-form-grid { padding: 30px 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .premium-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 8px; display: block; padding-left: 4px; }
                .premium-field-input { width: 100%; padding: 13px 18px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; color: white; font-size: 14px; outline: none; transition: 0.2s; box-sizing: border-box; }
                .premium-field-input:focus { border-color: #6366f1; background: rgba(99,102,241,0.05); box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
                
                .location-section-box { background: rgba(255,255,255,0.02); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); margin: 5px 0; }
                
                .modal-footer-actions { grid-column: span 2; display: flex; gap: 15px; margin-top: 25px; justify-content: flex-end; padding-bottom: 10px; }
                
                .premium-save-btn { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 14px 30px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3); }
                .premium-save-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 20px rgba(99, 102, 241, 0.4); filter: brightness(1.1); }
                
                .premium-cancel-btn { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); padding: 14px 30px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .premium-cancel-btn:hover { background: rgba(255,255,255,0.1); color: white; }
                
                /* Custom Scrollbar for Modal */
                .premium-modal-card::-webkit-scrollbar { width: 4px; }
                .premium-modal-card::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default InventoryForm;
