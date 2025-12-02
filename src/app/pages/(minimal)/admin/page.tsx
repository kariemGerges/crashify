'use client';
import React, { useState, useEffect } from 'react';
import { AuthState, User } from '@/server/lib/types/auth';
import { api } from '@/app/actions/getUser';
import { Loader2 } from 'lucide-react';
import { AdminDashboard } from '@/app/components/Admin/AdminDashboard';
import { TwoFactorAuth } from '@/app/components/Auth/TwoFactorAuth';
import { LoginFormWithSecurity } from '@/app/components/Auth/LoginFormWithSecurity';
import { ToastProvider } from '@/app/components/Toast';

// const Admin: React.FC = () => {
export default function Admin() {
    const [authState, setAuthState] = useState<AuthState>({
        user: undefined,
        isAuthenticated: false,
        requiresTwoFactor: false,
    });
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const result = await api.getSession();
                if (result?.user) {
                    setAuthState({
                        user: result.user,
                        isAuthenticated: true,
                        requiresTwoFactor: false,
                    });
                }
            } catch (err) {
                console.log('No active session', err);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const handleLoginSuccess = (newState: Partial<AuthState>) => {
        setAuthState(prev => ({ ...prev, ...newState }));
    };

    const handleTwoFactorSuccess = (user: User) => {
        setAuthState({
            user,
            isAuthenticated: true,
            requiresTwoFactor: false,
        });
    };

    const handleLogout = () => {
        setAuthState({
            user: undefined,
            isAuthenticated: false,
            requiresTwoFactor: false,
        });
    };

    const handleBackToLogin = () => {
        setAuthState({
            user: undefined,
            isAuthenticated: false,
            requiresTwoFactor: false,
        });
    };

    return (
        <ToastProvider>
            {loading ? (
                <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Loading...</p>
                    </div>
                </div>
            ) : authState.isAuthenticated && authState.user ? (
                <AdminDashboard user={authState.user} onLogout={handleLogout} />
            ) : authState.requiresTwoFactor && authState.tempToken ? (
                <TwoFactorAuth
                    tempToken={authState.tempToken}
                    onVerifySuccess={handleTwoFactorSuccess}
                    onBack={handleBackToLogin}
                />
            ) : (
                <LoginFormWithSecurity onLoginSuccess={handleLoginSuccess} />
            )}
        </ToastProvider>
    );
}
