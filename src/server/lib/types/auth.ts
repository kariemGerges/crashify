export type Role = 'admin' | 'reviewer' | 'manager';

export interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    twoFactorEnabled: boolean;
    lastLogin?: string;
}

export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface TwoFactorVerification {
    code: string;
    tempToken: string;
}
