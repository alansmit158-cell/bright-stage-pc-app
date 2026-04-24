import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const notificationId = useRef(0);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const showNotification = useCallback((message, type = 'info', title = 'Notification') => {
        const id = ++notificationId.current;
        const newNotification = { id, message, type, title };
        
        setNotifications((prev) => [...prev, newNotification]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    }, [removeNotification]);

    return (
        <NotificationContext.Provider value={{
            showSuccess: (msg, title) => showNotification(msg, 'success', title || 'Success'),
            showError: (msg, title) => showNotification(msg, 'error', title || 'Error'),
            showInfo: (msg, title) => showNotification(msg, 'info', title || 'Information'),
            showWarning: (msg, title) => showNotification(msg, 'warning', title || 'Warning'),
            removeNotification
        }}>
            {children}
            <NotificationContainer notifications={notifications} onRemove={removeNotification} />
        </NotificationContext.Provider>
    );
};

const NotificationContainer = ({ notifications, onRemove }) => {
    return (
        <div className="notification-container">
            {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRemove={() => onRemove(n.id)} />
            ))}
        </div>
    );
};

const NotificationItem = ({ notification, onRemove }) => {
    const { title, message, type } = notification;

    const getIcon = () => {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '⚠';
            case 'warning': return '⚡';
            default: return 'ℹ';
        }
    };

    return (
        <div className={`notification-toast ${type}`}>
            <div className="notification-icon">
                {getIcon()}
            </div>
            <div className="notification-content">
                <div className="notification-title">{title}</div>
                <div className="notification-message">{message}</div>
            </div>
            <button className="notification-close" onClick={onRemove}>×</button>
        </div>
    );
};

export default NotificationProvider;
