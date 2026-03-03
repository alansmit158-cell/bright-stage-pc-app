import api from './api';

export const inventoryService = {
    getAll: async () => {
        try {
            const response = await api.get('/inventory');
            return response.data;
        } catch (error) {
            console.error("Error fetching inventory", error);
            throw error;
        }
    },

    create: async (item) => {
        try {
            const response = await api.post('/inventory', item);
            return response.data;
        } catch (error) {
            console.error("Error creating item", error);
            throw error;
        }
    },

    update: async (id, item) => {
        try {
            const response = await api.put(`/inventory/${id}`, item);
            return response.data;
        } catch (error) {
            console.error("Error updating item", error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const response = await api.delete(`/inventory/${id}`);
            return response.data;
        } catch (error) {
            console.error("Error deleting item", error);
            throw error;
        }
    },

    reportIssue: async (id, data) => {
        try {
            const response = await api.post(`/inventory/${id}/report-issue`, data);
            return response.data;
        } catch (error) {
            console.error("Error reporting issue", error);
            throw error;
        }
    },

    getHistory: async (id) => {
        try {
            const response = await api.get(`/inventory/${id}/history`);
            return response.data;
        } catch (error) {
            console.error("Error fetching item history", error);
            throw error;
        }
    }
};
