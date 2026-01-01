import axios from 'axios';
class ApiService {
    constructor(config) {
        this.tokens = null;
        this.user = null;
        // Auth methods
        this.auth = {
            login: async (credentials) => {
                const response = await this.post('/api/admin/login', credentials);
                if (!response.access_token) {
                    throw new Error(response.detail || 'Login failed');
                }
                const tokens = {
                    accessToken: response.access_token,
                    refreshToken: response.refresh_token || '',
                    tokenType: response.token_type || 'bearer'
                };
                const user = response.user || {
                    id: 0,
                    username: credentials.username,
                    email: '',
                    full_name: '',
                    role: 'admin'
                };
                await this.setTokens(tokens);
                await this.setUser(user);
                return { tokens, user };
            },
            register: async (data) => {
                const response = await this.post('/api/register/', data);
                if (response.detail)
                    throw new Error(response.detail);
                return response;
            },
            logout: async () => {
                await this.clearAuth();
            },
            loadStoredAuth: async () => {
                return await this.loadStoredAuth();
            },
            requestPasswordReset: async (email) => {
                await this.post('/api/auth/password-reset/request', { email });
            },
            resetPassword: async (token, password) => {
                await this.post('/api/auth/password-reset/confirm', { token, password });
            },
            verifyEmail: async (token) => {
                await this.post('/api/auth/verify-email', { token });
            },
            resendVerification: async (email) => {
                await this.post('/api/auth/verify-email/resend', { email });
            },
        };
        // Admin User Management
        this.admin = {
            getPendingUsers: async (skip = 0, limit = 100) => {
                return await this.get(`/api/admin/pending?skip=${skip}&limit=${limit}`);
            },
            approveUser: async (userId, notes) => {
                return await this.post(`/api/admin/approve/${userId}`, {
                    admin_notes: notes || 'Approved'
                });
            },
            rejectUser: async (userId, reason) => {
                return await this.post(`/api/admin/reject/${userId}`, { reason });
            },
            getAllUsers: async (skip = 0, limit = 100) => {
                return await this.get(`/api/admin/users?skip=${skip}&limit=${limit}`);
            },
            getLoginHistory: async (params) => {
                const queryParams = new URLSearchParams();
                if (params?.user_id)
                    queryParams.append('user_id', params.user_id.toString());
                if (params?.service_id)
                    queryParams.append('service_id', params.service_id.toString());
                if (params?.skip)
                    queryParams.append('skip', params.skip.toString());
                if (params?.limit)
                    queryParams.append('limit', params.limit.toString());
                return await this.get(`/api/admin/login-history?${queryParams}`);
            },
            getUserStats: async (userId) => {
                return await this.get(`/api/admin/user-stats/${userId}`);
            },
        };
        // Invitation Management
        this.invitations = {
            create: async (data) => {
                return await this.post('/api/invitation/create', data);
            },
            list: async (includeUsed = false, skip = 0, limit = 50) => {
                return await this.get(`/api/invitation/list?include_used=${includeUsed}&skip=${skip}&limit=${limit}`);
            },
            delete: async (invitationId) => {
                return await this.apiDelete(`/api/invitation/${invitationId}`);
            },
            verify: async (code, pin) => {
                return await this.post('/api/invitation/verify', {
                    invitation_code: code,
                    pin: pin
                });
            },
        };
        // Service Management
        this.services = {
            register: async (data) => {
                return await this.post('/api/services/register', data);
            },
            list: async (includeInactive = false) => {
                return await this.get(`/api/services/list?include_inactive=${includeInactive}`);
            },
            deactivate: async (serviceId) => {
                return await this.post(`/api/services/deactivate/${serviceId}`);
            },
        };
        // System Status
        this.system = {
            getStatus: async () => {
                return await this.get('/api/system/status');
            },
            getOperatingHours: async () => {
                return await this.get('/api/system/operating-hours');
            },
            healthCheck: async () => {
                return await this.get('/health');
            },
        };
        this.config = config;
        this.instance = axios.create({
            baseURL: config.baseURL,
            timeout: config.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        this.instance.interceptors.request.use(async (config) => {
            if (this.tokens?.accessToken) {
                config.headers.Authorization = `Bearer ${this.tokens.accessToken}`;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        this.instance.interceptors.response.use((response) => {
            return response;
        }, async (error) => {
            if (error.response?.status === 401) {
                await this.clearAuth();
            }
            return Promise.reject(error);
        });
    }
    async setTokens(tokens) {
        this.tokens = tokens;
        localStorage.setItem('auth_tokens', JSON.stringify(tokens));
    }
    async setUser(user) {
        this.user = user;
        localStorage.setItem('auth_user', JSON.stringify(user));
    }
    async loadStoredAuth() {
        try {
            const tokensStr = localStorage.getItem('auth_tokens');
            const userStr = localStorage.getItem('auth_user');
            const tokens = tokensStr ? JSON.parse(tokensStr) : null;
            const user = userStr ? JSON.parse(userStr) : null;
            this.tokens = tokens;
            this.user = user;
            return { tokens, user };
        }
        catch (error) {
            console.error('Error loading stored auth:', error);
            return { tokens: null, user: null };
        }
    }
    async clearAuth() {
        this.tokens = null;
        this.user = null;
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
    }
    async get(url, config) {
        const response = await this.instance.get(url, config);
        return response.data;
    }
    async post(url, data, config) {
        const response = await this.instance.post(url, data, config);
        return response.data;
    }
    async put(url, data, config) {
        const response = await this.instance.put(url, data, config);
        return response.data;
    }
    async apiDelete(url, config) {
        const response = await this.instance.delete(url, config);
        return response.data;
    }
    // Getters
    get isAuthenticated() {
        return !!this.tokens?.accessToken;
    }
    get currentUser() {
        return this.user;
    }
    get currentTokens() {
        return this.tokens;
    }
}
// Create default API service instance
export const apiService = new ApiService({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: 30000,
});
