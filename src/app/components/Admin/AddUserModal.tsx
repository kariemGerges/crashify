// Add User Modal Component
import React, { useState } from 'react';
import { Role } from '@/server/lib/types/auth';
import { Loader2, AlertCircle, EyeOff, Eye, X } from 'lucide-react';
import { api } from '@/app/actions/getUser';
import {
    TwoFactorSetupModal,
    TwoFactorSetupData,
} from '@/app/components/Auth/TwoFactorSetupModal';



export const AddUserModal: React.FC<{
    onClose: () => void;
    onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        role: 'reviewer' as Role,
        twoFactorEnabled: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrData, setQrData] = useState<TwoFactorSetupData | null>(null);

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            if (!formData.email || !formData.name || !formData.password) {
                setError('All fields are required');
                setLoading(false);
                return;
            }

            if (formData.password.length < 8) {
                setError('Password must be at least 8 characters');
                setLoading(false);
                return;
            }

            const result = await api.createUser(formData);

            // If 2FA is enabled, fetch and show QR code
            if (formData.twoFactorEnabled && result.user?.id) {
                try {
                    const qrResult = await api.getTwoFactorQR(result.user.id);
                    setQrData({
                        qrCode: qrResult.qrCode,
                        secret: qrResult.secret,
                        email: qrResult.email,
                        otpauthUrl: qrResult.otpauthUrl,
                    });
                    setShowQRModal(true);
                } catch (qrError: unknown) {
                    console.error('Failed to get QR code:', qrError);
                    // Still show success, but without QR code
                    onSuccess();
                    onClose();
                }
            } else {
                onSuccess();
                onClose();
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleQRModalClose = () => {
        setShowQRModal(false);
        setQrData(null);
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-amber-500/20 rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">
                        Add New User
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        disabled={loading}
                    >
                        <X className="w-6 h-6 text-red-600" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            placeholder="John Doe"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    email: e.target.value,
                                })
                            }
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            placeholder="john@carinsure.com"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        password: e.target.value,
                                    })
                                }
                                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-500 transition-colors"
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Role
                        </label>
                        <select
                            value={formData.role}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    role: e.target.value as Role,
                                })
                            }
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            disabled={loading}
                        >
                            <option value="reviewer">Reviewer</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-gray-800">
                        <input
                            type="checkbox"
                            id="twoFactor"
                            checked={formData.twoFactorEnabled}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    twoFactorEnabled: e.target.checked,
                                })
                            }
                            className="w-4 h-4 accent-amber-500"
                            disabled={loading}
                        />
                        <label
                            htmlFor="twoFactor"
                            className="text-sm text-gray-300 cursor-pointer"
                        >
                            Enable Two-Factor Authentication
                        </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg hover:from-amber-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create User'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {showQRModal && qrData && (
                <TwoFactorSetupModal
                    data={qrData}
                    userName={formData.name}
                    onClose={handleQRModalClose}
                    onEmailSent={() => {
                        // Optional: Show success message
                    }}
                />
            )}
        </div>
    );
};
