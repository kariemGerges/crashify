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
    Key,
    Copy,
    Clock,
    Mail,
    MessageSquare,
    X,
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

    // Claims Tokens state
    const [tokenFormData, setTokenFormData] = useState({
        customerEmail: '',
        customerPhone: '',
        customerId: '',
        policyNumber: '',
        customerName: '',
        expiresInHours: 48,
        sendEmail: true,
        sendSMS: false,
    });
    const [generatingToken, setGeneratingToken] = useState(false);
    const [generatedToken, setGeneratedToken] = useState<{
        id: string;
        link: string;
        expiresAt: string;
    } | null>(null);
    const [tokens, setTokens] = useState<
        Array<{
            id: string;
            customerEmail: string;
            customerPhone: string;
            customerId: string;
            policyNumber: string | null;
            expiresAt: string;
            isUsed: boolean;
            usedAt: string | null;
            createdAt: string;
            claimType: string | null;
        }>
    >([]);
    const [loadingTokens, setLoadingTokens] = useState(false);
    const [tokensError, setTokensError] = useState('');

    // Get the color of the role badge
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

    // The menu items for the admin dashboard
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
            id: 'claims-tokens',
            icon: FileText,
            label: 'Claims Tokens',
            roles: ['admin', 'manager'],
        },
        {
            id: 'users',
            icon: Users,
            label: 'Users',
            roles: ['admin', 'manager'],
        },
        { id: 'settings', icon: Settings, label: 'Settings', roles: ['admin'] },
    ];

    // Filter the menu items based on the user's role
    const filteredMenuItems = menuItems.filter(item =>
        item.roles.includes(user.role)
    );

    // Load the users for the admin dashboard
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
        } catch (err: unknown) {
            setUsersError(
                err instanceof Error ? err.message : 'Failed to load users'
            );
        } finally {
            setLoadingUsers(false);
        }
    };

    // Load the stats for the admin dashboard
    const loadStats = async () => {
        setLoadingStats(true);
        try {
            const response = await fetch('/api/assessments/stats');
            const result = await response.json();
            if (result.data) {
                setApiData(result.data);
            }
        } catch (err: unknown) {
            console.error('Failed to load stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    // Handle the delete user action
    const handleDeleteUser = (userId: string, userName: string) => {
        setDeleteConfirm({
            isOpen: true,
            userId,
            userName,
        });
    };

    // Confirm the delete user action
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
        } catch (err: unknown) {
            // If deletion fails, reload the list to restore the user
            toast.showError(
                err instanceof Error ? err.message : 'Failed to delete user'
            );
            loadUsers();
        }
    };

    // Cancel the delete user action
    const cancelDeleteUser = () => {
        setDeleteConfirm({ isOpen: false, userId: null, userName: '' });
    };

    // Handle the logout action
    const handleLogout = async () => {
        try {
            await api.logout();
            onLogout();
        } catch (err) {
            console.error('Logout error:', err);
            onLogout(); // Still logout on frontend even if API fails
        }
    };

    // Load tokens list
    const loadTokens = async () => {
        setLoadingTokens(true);
        setTokensError('');

        try {
            const response = await fetch('/api/admin/tokens/generate/list');
            const result = await response.json();

            if (result.tokens) {
                setTokens(result.tokens);
            } else {
                setTokensError('Failed to load tokens');
            }
        } catch (err: unknown) {
            setTokensError(
                err instanceof Error ? err.message : 'Failed to load tokens'
            );
        } finally {
            setLoadingTokens(false);
        }
    };

    // Generate token
    const handleGenerateToken = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneratingToken(true);
        setGeneratedToken(null);

        try {
            const response = await fetch('/api/admin/tokens/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerEmail: tokenFormData.customerEmail,
                    customerPhone: tokenFormData.customerPhone,
                    customerId: tokenFormData.customerId,
                    policyNumber: tokenFormData.policyNumber || undefined,
                    expiresInHours: tokenFormData.expiresInHours,
                    metadata: {
                        customerName: tokenFormData.customerName || undefined,
                        sendEmail: tokenFormData.sendEmail,
                        sendSMS: tokenFormData.sendSMS,
                    },
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to generate token');
            }

            setGeneratedToken({
                id: result.token.id,
                link: result.link,
                expiresAt: result.token.expiresAt,
            });

            // Reset form
            setTokenFormData({
                customerEmail: '',
                customerPhone: '',
                customerId: '',
                policyNumber: '',
                customerName: '',
                expiresInHours: 48,
                sendEmail: true,
                sendSMS: false,
            });

            toast.showSuccess('Token generated successfully!');
            loadTokens(); // Reload tokens list
        } catch (err: unknown) {
            toast.showError(
                err instanceof Error ? err.message : 'Failed to generate token'
            );
        } finally {
            setGeneratingToken(false);
        }
    };

    // Copy token link to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.showSuccess('Link copied to clipboard!');
    };

    // Use effect to load the users when the users tab is active
    useEffect(() => {
        if (activeTab === 'users' && ['admin', 'manager'].includes(user.role)) {
            loadUsers();
        }
        if (activeTab === 'overview') {
            loadStats();
        }
        if (
            activeTab === 'claims-tokens' &&
            ['admin', 'manager'].includes(user.role)
        ) {
            loadTokens();
        }
    }, [activeTab]);

    // Get the first letter of the user's name and capitalize it
    const getFirstLetterCapital = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // The admin dashboard component
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
                {/* Sidebar navigation tabs */}
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

                {/* Main content */}
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
                        {activeTab === 'overview' &&
                            (loadingStats ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                                </div>
                            ) : (
                                <StatsOverview data={apiData} />
                            ))}

                        {/* Claims Tab */}
                        {activeTab === 'claims' && <ClaimsTab />}

                        {/* Claims Tokens Tab */}
                        {activeTab === 'claims-tokens' &&
                            ['admin', 'manager'].includes(user.role) && (
                                <div className="space-y-6">
                                    {/* Generate Token Form */}
                                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-lg flex items-center justify-center">
                                                <Key className="w-5 h-5 text-white" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">
                                                Generate Claim Token
                                            </h3>
                                        </div>

                                        {generatedToken && (
                                            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                                                <div className="flex items-start gap-3 mb-4">
                                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-green-400 font-medium mb-2">
                                                            Token Generated
                                                            Successfully!
                                                        </p>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-400 text-sm">
                                                                    Link:
                                                                </span>
                                                                <code className="flex-1 bg-black/50 px-3 py-1.5 rounded text-sm text-gray-300 font-mono break-all">
                                                                    {
                                                                        generatedToken.link
                                                                    }
                                                                </code>
                                                                <button
                                                                    onClick={() =>
                                                                        copyToClipboard(
                                                                            generatedToken.link
                                                                        )
                                                                    }
                                                                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                                                                    title="Copy link"
                                                                >
                                                                    <Copy className="w-4 h-4 text-gray-300" />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                                <Clock className="w-4 h-4" />
                                                                <span>
                                                                    Expires:{' '}
                                                                    {new Date(
                                                                        generatedToken.expiresAt
                                                                    ).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            setGeneratedToken(
                                                                null
                                                            )
                                                        }
                                                        className="text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <form
                                            onSubmit={handleGenerateToken}
                                            className="space-y-4"
                                        >
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        Customer Email{' '}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        required
                                                        value={
                                                            tokenFormData.customerEmail
                                                        }
                                                        onChange={e =>
                                                            setTokenFormData(
                                                                prev => ({
                                                                    ...prev,
                                                                    customerEmail:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 transition-colors"
                                                        placeholder="customer@example.com"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        Customer Phone{' '}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        required
                                                        value={
                                                            tokenFormData.customerPhone
                                                        }
                                                        onChange={e =>
                                                            setTokenFormData(
                                                                prev => ({
                                                                    ...prev,
                                                                    customerPhone:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 transition-colors"
                                                        placeholder="04XX XXX XXX"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        Customer ID{' '}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={
                                                            tokenFormData.customerId
                                                        }
                                                        onChange={e =>
                                                            setTokenFormData(
                                                                prev => ({
                                                                    ...prev,
                                                                    customerId:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 transition-colors"
                                                        placeholder="Customer identifier"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        Policy Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            tokenFormData.policyNumber
                                                        }
                                                        onChange={e =>
                                                            setTokenFormData(
                                                                prev => ({
                                                                    ...prev,
                                                                    policyNumber:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 transition-colors"
                                                        placeholder="Optional"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Customer Name (for email)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={
                                                        tokenFormData.customerName
                                                    }
                                                    onChange={e =>
                                                        setTokenFormData(
                                                            prev => ({
                                                                ...prev,
                                                                customerName:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 transition-colors"
                                                    placeholder="Optional - used in email greeting"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Token Expiration:{' '}
                                                    <span className="text-amber-400">
                                                        {
                                                            tokenFormData.expiresInHours
                                                        }{' '}
                                                        hours
                                                    </span>
                                                </label>
                                                <div className="space-y-2">
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="168"
                                                        step="1"
                                                        value={
                                                            tokenFormData.expiresInHours
                                                        }
                                                        onChange={e =>
                                                            setTokenFormData(
                                                                prev => ({
                                                                    ...prev,
                                                                    expiresInHours:
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        ),
                                                                })
                                                            )
                                                        }
                                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                    />
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>1 hour</span>
                                                        <span>24 hours</span>
                                                        <span>48 hours</span>
                                                        <span>7 days</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-gray-800">
                                                    <input
                                                        type="checkbox"
                                                        id="sendEmail"
                                                        checked={
                                                            tokenFormData.sendEmail
                                                        }
                                                        onChange={e =>
                                                            setTokenFormData(
                                                                prev => ({
                                                                    ...prev,
                                                                    sendEmail:
                                                                        e.target
                                                                            .checked,
                                                                })
                                                            )
                                                        }
                                                        className="w-4 h-4 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                                                    />
                                                    <label
                                                        htmlFor="sendEmail"
                                                        className="flex items-center gap-2 text-gray-300 cursor-pointer"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                        <span>Send Email</span>
                                                    </label>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-gray-800">
                                                    <input
                                                        type="checkbox"
                                                        id="sendSMS"
                                                        checked={
                                                            tokenFormData.sendSMS
                                                        }
                                                        onChange={e =>
                                                            setTokenFormData(
                                                                prev => ({
                                                                    ...prev,
                                                                    sendSMS:
                                                                        e.target
                                                                            .checked,
                                                                })
                                                            )
                                                        }
                                                        className="w-4 h-4 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                                                    />
                                                    <label
                                                        htmlFor="sendSMS"
                                                        className="flex items-center gap-2 text-gray-300 cursor-pointer"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                        <span>Send SMS</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={generatingToken}
                                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg hover:from-amber-600 hover:to-red-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {generatingToken ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Key className="w-5 h-5" />
                                                        Generate Token
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Tokens List */}
                                    <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-lg flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-white" />
                                                </div>
                                                <h3 className="text-xl font-bold text-white">
                                                    Active Tokens
                                                </h3>
                                            </div>
                                            <button
                                                onClick={loadTokens}
                                                disabled={loadingTokens}
                                                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <Loader2
                                                    className={`w-4 h-4 ${
                                                        loadingTokens
                                                            ? 'animate-spin'
                                                            : ''
                                                    }`}
                                                />
                                                Refresh
                                            </button>
                                        </div>

                                        {tokensError && (
                                            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-red-400 text-sm">
                                                    {tokensError}
                                                </p>
                                            </div>
                                        )}

                                        {loadingTokens ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {tokens.length === 0 ? (
                                                    <div className="text-center py-12 text-gray-400">
                                                        <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                        <p>
                                                            No active tokens
                                                            found
                                                        </p>
                                                    </div>
                                                ) : (
                                                    tokens.map(token => (
                                                        <div
                                                            key={token.id}
                                                            className="p-4 bg-black/30 rounded-lg border border-gray-800"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                                                                        <div>
                                                                            <p className="text-xs text-gray-400 mb-1">
                                                                                Customer
                                                                                ID
                                                                            </p>
                                                                            <p className="text-white font-medium">
                                                                                {
                                                                                    token.customerId
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                        {token.policyNumber && (
                                                                            <div>
                                                                                <p className="text-xs text-gray-400 mb-1">
                                                                                    Policy
                                                                                    Number
                                                                                </p>
                                                                                <p className="text-white font-medium">
                                                                                    {
                                                                                        token.policyNumber
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                        <div>
                                                                            <p className="text-xs text-gray-400 mb-1">
                                                                                Email
                                                                            </p>
                                                                            <p className="text-gray-300 text-sm">
                                                                                {
                                                                                    token.customerEmail
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-gray-400 mb-1">
                                                                                Phone
                                                                            </p>
                                                                            <p className="text-gray-300 text-sm">
                                                                                {
                                                                                    token.customerPhone
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-sm">
                                                                        <div className="flex items-center gap-2 text-gray-400">
                                                                            <Clock className="w-4 h-4" />
                                                                            <span>
                                                                                Expires:{' '}
                                                                                {new Date(
                                                                                    token.expiresAt
                                                                                ).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <span
                                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                                token.isUsed
                                                                                    ? 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                                                                                    : 'bg-green-500/20 text-green-400 border border-green-500/50'
                                                                            }`}
                                                                        >
                                                                            {token.isUsed
                                                                                ? 'Used'
                                                                                : 'Active'}
                                                                        </span>
                                                                        {token.usedAt && (
                                                                            <span className="text-gray-500 text-xs">
                                                                                Used:{' '}
                                                                                {new Date(
                                                                                    token.usedAt
                                                                                ).toLocaleString()}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

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
