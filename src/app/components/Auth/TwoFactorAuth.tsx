// Two-Factor Authentication Component
import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Key } from 'lucide-react';
import { User } from '@/server/lib/types/auth';
import { api } from '@/app/actions/getUser'



export const TwoFactorAuth: React.FC<{
    tempToken: string;
    onVerifySuccess: (user: User) => void;
    onBack: () => void;
}> = ({ tempToken, onVerifySuccess, onBack }) => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return;
        if (value && !/^\d+$/.test(value)) return; // Only allow digits

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, 6);
        const newCode = pastedData
            .split('')
            .concat(Array(6).fill(''))
            .slice(0, 6);
        setCode(newCode);

        if (pastedData.length === 6) {
            document.getElementById('code-5')?.focus();
        }
    };

    const handleSubmit = async () => {
        const fullCode = code.join('');

        if (fullCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await api.verifyTwoFactor(fullCode, tempToken);

            if (result.user) {
                onVerifySuccess(result.user);
            }
        } catch (err: any) {
            setError(err.message || 'Invalid 2FA code. Please try again.');
            setCode(['', '', '', '', '', '']);
            document.getElementById('code-0')?.focus();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.getElementById('code-0')?.focus();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-gray-900 border border-amber-500/20 rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-red-600 rounded-full mb-4">
                            <Key className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Two-Factor Authentication
                        </h2>
                        <p className="text-gray-400">
                            Enter the 6-digit code from your authenticator app
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div
                            className="flex gap-2 justify-center"
                            onPaste={handlePaste}
                        >
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`code-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e =>
                                        handleChange(index, e.target.value)
                                    }
                                    onKeyDown={e => handleKeyDown(index, e)}
                                    disabled={loading}
                                    className="w-12 h-14 bg-black/50 border border-gray-700 rounded-lg text-center text-2xl font-bold text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-50"
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || code.join('').length !== 6}
                            className="w-full bg-gradient-to-r from-amber-500 to-red-600 text-white font-semibold py-3 rounded-lg hover:from-amber-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Code'
                            )}
                        </button>

                        <button
                            onClick={onBack}
                            disabled={loading}
                            className="w-full text-gray-400 hover:text-white transition-colors text-sm disabled:opacity-50"
                        >
                            Back to login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
