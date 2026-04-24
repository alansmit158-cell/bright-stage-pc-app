import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context.confirm;
};

export const ConfirmProvider = ({ children }) => {
    const [config, setConfig] = useState(null);

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setConfig({
                ...options,
                resolve
            });
        });
    }, []);

    const handleClose = (value) => {
        if (config) {
            config.resolve(value);
            setConfig(null);
        }
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {config && (
                <div className="modal-overlay-blur" style={{ zIndex: 3000 }}>
                    <div className="premium-modal-card" style={{ maxWidth: '450px', padding: '40px', textAlign: 'center' }}>
                        <div style={{ 
                            width: '70px', 
                            height: '70px', 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            borderRadius: '24px', 
                            color: '#6366f1', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 25px'
                        }}>
                            <AlertCircle size={40} />
                        </div>
                        
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>
                            {config.title || 'Are you sure?'}
                        </h2>
                        
                        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '35px' }}>
                            {config.message}
                        </p>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button 
                                onClick={() => handleClose(false)} 
                                className="premium-cancel-btn" 
                                style={{ flex: 1, margin: 0, padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', borderRadius: '16px' }}
                            >
                                {config.cancelText || 'Cancel'}
                            </button>
                            <button 
                                onClick={() => handleClose(true)} 
                                className="premium-save-btn" 
                                style={{ flex: 1, padding: '14px', borderRadius: '16px' }}
                            >
                                {config.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};
