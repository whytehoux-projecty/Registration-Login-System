import { create } from "zustand";
import { persist } from "zustand/middleware";
// Mock admin user - no authentication required
const mockAdminUser = {
    id: 1,
    email: "admin@system.local",
    username: "admin",
    full_name: "System Administrator",
    role: "admin",
    is_active: true,
    created_at: new Date().toISOString(),
};
const mockTokens = {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    tokenType: "Bearer",
};
export const useAuthStore = create()(persist((set, get) => ({
    // Authentication is DISABLED - always authenticated as admin
    isAuthenticated: true,
    user: mockAdminUser,
    tokens: mockTokens,
    loading: false,
    error: null,
    login: async (credentials) => {
        // No-op: Authentication disabled
        set({
            isAuthenticated: true,
            user: mockAdminUser,
            tokens: mockTokens,
            loading: false,
            error: null,
        });
    },
    register: async (data) => {
        // No-op: Authentication disabled
        set({
            isAuthenticated: true,
            user: mockAdminUser,
            tokens: mockTokens,
            loading: false,
            error: null,
        });
        return { userId: String(mockAdminUser.id), user: mockAdminUser };
    },
    logout: async () => {
        // No-op: Authentication disabled - stay logged in
        set({
            isAuthenticated: true,
            user: mockAdminUser,
            tokens: mockTokens,
            loading: false,
            error: null,
        });
    },
    refreshToken: async () => {
        // No-op: Authentication disabled
        set({ tokens: mockTokens });
    },
    setUser: (user) => {
        set({ user });
    },
    setTokens: (tokens) => {
        set({ tokens });
    },
    clearError: () => {
        set({ error: null });
    },
    loadStoredAuth: async () => {
        // Always set as authenticated with mock admin
        set({
            isAuthenticated: true,
            user: mockAdminUser,
            tokens: mockTokens,
            loading: false,
        });
    },
    requestPasswordReset: async (email) => {
        // No-op: Authentication disabled
        set({ loading: false });
    },
    resetPassword: async (token, newPassword) => {
        // No-op: Authentication disabled
        set({ loading: false });
    },
    verifyEmail: async (token) => {
        // No-op: Authentication disabled
        set({ loading: false });
    },
    resendVerification: async (email) => {
        // No-op: Authentication disabled
        set({ loading: false });
    },
}), {
    name: "auth-storage",
    partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
    }),
}));
