// Admin Dashboard Component
import React, { useState, useEffect } from 'react';
import { User, Role } from '@/server/lib/types/auth';
import {
    Shield,
    UserLock,
    AlertCircle,
    CheckCircle,
    LogOut,
    Users,
    FileText,
    Settings,
    BarChart3,
    Loader2,
    Plus,
    Trash2,
} from 'lucide-react';
import { AddUserModal } from '@/app/components/Admin/AddUserModal';
import { api } from '@/app/actions/getUser';
import Logo from '../logo';
import Image from 'next/image';
import Fady from '../../../../public/f.png';
import { StatsOverview } from '../Admin/StatsOverview';
import { ClaimsTab } from '../Admin/ClaimsTab';
import { useToast } from '../Toast';
import { ConfirmModal } from '../Admin/ConfirmModal';

export const AdminDashboard: React.FC<{ user: User; onLogout: () => void }> = ({
    user,
    onLogout,
}) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('overview');
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        userId: string | null;
        userName: string;
    }>({
        isOpen: false,
        userId: null,
        userName: '',
    });
    const [apiData, setApiData] = useState({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        desktop: 0,
        onsite: 0,
        recentSubmissions: 0,
    });
    const [loadingStats, setLoadingStats] = useState(false);

    const getRoleBadgeColor = (role: Role) => {
        switch (role) {
            case 'admin':
                return 'bg-red-500/20 text-red-400 border-red-500/50';
            case 'manager':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
            case 'reviewer':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
        }
    };

    const menuItems = [
        {
            id: 'overview',
            icon: BarChart3,
            label: 'Overview',
            roles: ['admin', 'manager', 'reviewer'],
        },
        {
            id: 'claims',
            icon: FileText,
            label: 'Claims',
            roles: ['admin', 'manager', 'reviewer'],
        },
        {
            id: 'users',
            icon: Users,
            label: 'Users',
            roles: ['admin', 'manager'],
        },
        { id: 'settings', icon: Settings, label: 'Settings', roles: ['admin'] },
    ];

    const filteredMenuItems = menuItems.filter(item =>
        item.roles.includes(user.role)
    );

    const loadUsers = async () => {
        setLoadingUsers(true);
        setUsersError('');

        try {
            const result = await api.listUsers({ limit: 20 });
            // Filter to only show active users
            const activeUsers = (result.users || []).filter(
                (u: User) => u.isActive !== false
            );
            setUsers(activeUsers);
        } catch (err: any) {
            setUsersError(err.message || 'Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadStats = async () => {
        setLoadingStats(true);
        try {
            const response = await fetch('/api/assessments/stats');
            const result = await response.json();
            if (result.data) {
                setApiData(result.data);
            }
        } catch (err: any) {
            console.error('Failed to load stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleDeleteUser = (userId: string, userName: string) => {
        setDeleteConfirm({
            isOpen: true,
            userId,
            userName,
        });
    };

    const confirmDeleteUser = async () => {
        if (!deleteConfirm.userId) return;

        const userId = deleteConfirm.userId;

        // Optimistically remove user from list immediately
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));

        // Close modal
        setDeleteConfirm({ isOpen: false, userId: null, userName: '' });

        try {
            await api.deleteUser(userId);
            toast.showSuccess('User deleted successfully');
            // Optionally reload to ensure sync, but user is already removed from UI
            // loadUsers();
        } catch (err: any) {
            // If deletion fails, reload the list to restore the user
            toast.showError(err.message || 'Failed to delete user');
            loadUsers();
        }
    };

    const cancelDeleteUser = () => {
        setDeleteConfirm({ isOpen: false, userId: null, userName: '' });
    };

    const handleLogout = async () => {
        try {
            await api.logout();
            onLogout();
        } catch (err) {
            console.error('Logout error:', err);
            onLogout(); // Still logout on frontend even if API fails
        }
    };

    useEffect(() => {
        if (activeTab === 'users' && ['admin', 'manager'].includes(user.role)) {
            loadUsers();
        }
        if (activeTab === 'overview') {
            loadStats();
        }
    }, [activeTab]);

    const getFirstLetterCapital = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
            {/* Header */}
            <header className="bg-gray-900/50 border-b border-amber-500/20 backdrop-blur-sm sticky top-0 z-50">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-full flex items-center justify-center">
                                    <Image
                                        src={Fady}
                                        alt="Crashify Logo"
                                        width={40}
                                        height={40}
                                    />
                                </div>
                                <div>
                                    <Logo size={120} />
                                    <p className="text-xs text-gray-400 pt-2">
                                        Admin Portal
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getRoleBadgeColor(
                                            user.role
                                        )}`}
                                    >
                                        {user.role.toUpperCase()}
                                    </span>
                                    {user.twoFactorEnabled && (
                                        <Shield
                                            className="w-3 h-3 text-green-400"
                                            // title="2FA Enabled"
                                        />
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-900/30 border-r border-amber-500/20 min-h-[calc(100vh-73px)] p-4">
                    <nav className="space-y-2">
                        {filteredMenuItems.map(item => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                        isActive
                                            ? 'bg-gradient-to-r from-amber-500/20 to-red-600/20 text-amber-400 border border-amber-500/50'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    <div className="max-w-6xl">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">
                                {
                                    filteredMenuItems.find(
                                        item => item.id === activeTab
                                    )?.label
                                }
                            </h2>
                            <p className="text-gray-400">
                                Welcome back,{' '}
                                {getFirstLetterCapital(user.name.split(' ')[0])}
                            </p>
                        </div>

                        {/* Stats Grid */}
                        {activeTab === 'overview' && (
                            <StatsOverview data={apiData} />
                        )}

                        {/* Claims Tab */}
                        {activeTab === 'claims' && <ClaimsTab />}

                        {/* Users Tab */}
                        {activeTab === 'users' &&
                            ['admin', 'manager'].includes(user.role) && (
                                <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-white">
                                            User Management
                                        </h3>
                                        {user.role === 'admin' && (
                                            <button
                                                onClick={() =>
                                                    setShowAddUserModal(true)
                                                }
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg hover:from-amber-600 hover:to-red-700 transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add User
                                            </button>
                                        )}
                                    </div>

                                    {usersError && (
                                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-red-400 text-sm">
                                                {usersError}
                                            </p>
                                        </div>
                                    )}

                                    {loadingUsers ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {users.length === 0 ? (
                                                <div className="text-center py-12 text-gray-400">
                                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                    <p>No users found</p>
                                                </div>
                                            ) : (
                                                users.map(u => (
                                                    <div
                                                        key={u.id}
                                                        className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-gray-800"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-lg flex items-center justify-center">
                                                                <UserLock className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-medium">
                                                                    {u.name}
                                                                </p>
                                                                <p className="text-gray-400 text-sm">
                                                                    {u.email}
                                                                </p>
                                                                {u.lastLogin && (
                                                                    <p className="text-gray-500 text-xs">
                                                                        Last
                                                                        login:{' '}
                                                                        {new Date(
                                                                            u.lastLogin
                                                                        ).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {u.twoFactorEnabled && (
                                                                <Shield
                                                                    className="w-4 h-4 text-green-400"
                                                                    // title="2FA Enabled"
                                                                />
                                                            )}
                                                            <span
                                                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                                                                    u.role
                                                                )}`}
                                                            >
                                                                {u.role.toUpperCase()}
                                                            </span>
                                                            <span
                                                                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                                                    u.isActive !==
                                                                    false
                                                                        ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                                                        : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                                                                }`}
                                                            >
                                                                {u.isActive !==
                                                                false
                                                                    ? 'Active'
                                                                    : 'Inactive'}
                                                            </span>
                                                            {user.role ===
                                                                'admin' &&
                                                                u.id !==
                                                                    user.id && (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleDeleteUser(
                                                                                u.id,
                                                                                u.name
                                                                            )
                                                                        }
                                                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                                        title="Delete User"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                        {/* Settings Tab */}
                        {activeTab === 'settings' && user.role === 'admin' && (
                            <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                                <h3 className="text-xl font-bold text-white mb-4">
                                    System Settings
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-black/30 rounded-lg border border-gray-800">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">
                                                    Two-Factor Authentication
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    Require 2FA for all users
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    defaultChecked
                                                />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-red-600"></div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-black/30 rounded-lg border border-gray-800">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">
                                                    Session Timeout
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    Auto logout after inactivity
                                                </p>
                                            </div>
                                            <select className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500">
                                                <option>30 minutes</option>
                                                <option>1 hour</option>
                                                <option selected>
                                                    8 hours
                                                </option>
                                                <option>24 hours</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-black/30 rounded-lg border border-gray-800">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">
                                                    Audit Logging
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    Track all admin actions
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    defaultChecked
                                                />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-red-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {showAddUserModal && (
                <AddUserModal
                    onClose={() => setShowAddUserModal(false)}
                    onSuccess={() => {
                        setShowAddUserModal(false);
                        if (activeTab === 'users') {
                            loadUsers();
                        }
                    }}
                />
            )}

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete User"
                message={`Are you sure you want to delete "${deleteConfirm.userName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDeleteUser}
                onCancel={cancelDeleteUser}
                variant="danger"
            />
        </div>
    );
};
