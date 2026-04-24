const isProd = window.location.hostname !== 'localhost';

export const CONFIG = {
    // Backend API URL
    API_URL: isProd
        ? 'https://bright-stage-backend.vercel.app/api'
        : `http://${window.location.hostname}:5000/api`,

    // Socket.IO URL
    SOCKET_URL: isProd
        ? 'https://bright-stage-backend.vercel.app'
        : `http://${window.location.hostname}:5000`
};

export default CONFIG;
