import api from './api';

export const projectService = {
    getAll: async () => {
        try {
            const response = await api.get('/projects');
            return response.data;
        } catch (error) {
            console.error("Error fetching projects", error);
            throw error;
        }
    },

    create: async (project) => {
        try {
            const response = await api.post('/projects', project);
            return response.data;
        } catch (error) {
            console.error("Error creating project", error);
            throw error;
        }
    },

    update: async (id, project) => {
        try {
            const response = await api.put(`/projects/${id}`, project);
            return response.data;
        } catch (error) {
            console.error("Error updating project", error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const response = await api.get(`/projects/${id}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching project", error);
            throw error;
        }
    },

    // Document Downloads - Note: These might need token if backend protects them strictly
    // For now keeping window.open but in a real app we'd fetch as blob with auth header
    downloadQuote: (id, company = 'bright') => {
        const token = localStorage.getItem('token');
        window.open(`${CONFIG.API_URL}/projects/${id}/quote?token=${token}&company=${company}`, '_blank');
    },
    downloadManifest: (id, company = 'bright') => {
        const token = localStorage.getItem('token');
        window.open(`${CONFIG.API_URL}/projects/${id}/manifest?token=${token}&company=${company}`, '_blank');
    },
    downloadTransport: (id, company = 'bright') => {
        const token = localStorage.getItem('token');
        window.open(`${CONFIG.API_URL}/projects/${id}/transport?token=${token}&company=${company}`, '_blank');
    },
    downloadTransfer: (id, company = 'bright') => {
        const token = localStorage.getItem('token');
        window.open(`${CONFIG.API_URL}/projects/${id}/transfer?token=${token}&company=${company}`, '_blank');
    },
    downloadInvoice: (id, company = 'bright') => {
        const token = localStorage.getItem('token');
        window.open(`${CONFIG.API_URL}/projects/${id}/invoice?token=${token}&company=${company}`, '_blank');
    },
    downloadPrepList: (id) => {
        const token = localStorage.getItem('token');
        window.open(`${CONFIG.API_URL}/projects/${id}/preplist?token=${token}`, '_blank');
    },
    toggleReady: async (id) => {
        try {
            const response = await api.put(`/projects/${id}/toggle-ready`);
            return response.data;
        } catch (error) {
            console.error("Error toggling ready status", error);
            throw error;
        }
    },

    validateManifest: async (id) => {
        try {
            const response = await api.post(`/projects/${id}/validate-manifest`);
            return response.data;
        } catch (error) {
            console.error("Error validating manifest", error);
            throw error;
        }
    },

    getQRToken: async (id, type) => {
        try {
            const response = await api.post(`/projects/${id}/qr/${type}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching ${type} QR token`, error);
            throw error;
        }
    },
    cancelValidation: async (id) => {
        try {
            const response = await api.post(`/projects/${id}/cancel-validation`);
            return response.data;
        } catch (error) {
            console.error("Error cancelling validation", error);
            throw error;
        }
    }
};

export default projectService;
