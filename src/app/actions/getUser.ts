// API Service with real endpoints
import { Role } from '@/server/lib/types/auth';
const API_BASE = '/api';

export const api = {
    login: async (email: string, password: string, csrfToken?: string | null, recaptchaToken?: string | null) => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (csrfToken) {
            headers['x-csrf-token'] = csrfToken;
        }

        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ email, password, recaptchaToken }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        return response.json();
    },

    verifyTwoFactor: async (code: string, tempToken: string) => {
        const response = await fetch(`${API_BASE}/auth/verify-2fa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ code, tempToken }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '2FA verification failed');
        }

        return response.json();
    },

    logout: async () => {
        const response = await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Logout failed');
        }

        return response.json();
    },

    getSession: async () => {
        const response = await fetch(`${API_BASE}/auth/session`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            return null;
        }

        return response.json();
    },

    createUser: async (userData: {
        email: string;
        name: string;
        password: string;
        role: Role;
        twoFactorEnabled: boolean;
    }) => {
        const response = await fetch(`${API_BASE}/auth/users/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create user');
        }

        return response.json();
    },

    getTwoFactorQR: async (userId: string) => {
        const response = await fetch(`${API_BASE}/auth/users/${userId}/2fa-qr`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get QR code');
        }

        return response.json();
    },

    listUsers: async (params?: {
        page?: number;
        limit?: number;
        role?: string;
        search?: string;
    }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.role) queryParams.append('role', params.role);
        if (params?.search) queryParams.append('search', params.search);

        const response = await fetch(`${API_BASE}/auth/users/list?${queryParams}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch users');
        }

        return response.json();
    },

    deleteUser: async (userId: string) => {
        const response = await fetch(`${API_BASE}/auth/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete user');
        }

        return response.json();
    },
};
