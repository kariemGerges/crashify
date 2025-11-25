// Two-Factor Authentication Setup Modal Component
import React, { useState } from 'react';
import { X, Copy, Check, Download, Mail } from 'lucide-react';
import Image from 'next/image';


export interface TwoFactorSetupData {
    qrCode: string;
    secret: string;
    email: string;
    otpauthUrl: string;
}

export const TwoFactorSetupModal: React.FC<{
    data: TwoFactorSetupData;
    userName: string;
    onClose: () => void;
    onEmailSent?: () => void;
}> = ({ data, userName, onClose, onEmailSent }) => {
    const [copied, setCopied] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleCopySecret = async () => {
        try {
            await navigator.clipboard.writeText(data.secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDownloadQR = () => {
        const link = document.createElement('a');
        link.href = data.qrCode;
        link.download = `2FA-QR-${data.email}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSendEmail = async () => {
        setSendingEmail(true);
        try {
            const response = await fetch('/api/auth/users/send-2fa-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: data.email,
                    userName,
                    qrCode: data.qrCode,
                    secret: data.secret,
                    otpauthUrl: data.otpauthUrl,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send email');
            }

            setEmailSent(true);
            onEmailSent?.();
        } catch (err) {
            console.error('Error sending email:', err);
            alert('Failed to send email. Please try again.');
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-amber-500/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            Two-Factor Authentication Setup
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Share this QR code with {userName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Instructions */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                        <h3 className="text-amber-400 font-semibold mb-2">
                            Setup Instructions:
                        </h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                            <li>
                                Download an authenticator app (Google
                                Authenticator, Microsoft Authenticator, or
                                Authy)
                            </li>
                            <li>
                                Open the app and tap &quot;Add account&quot; or
                                the &quot;+&quot; button
                            </li>
                            <li>
                                Scan the QR code below with your phone&apos;s
                                camera
                            </li>
                            <li>
                                Alternatively, manually enter the secret key
                                shown below
                            </li>
                            <li>
                                The app will generate 6-digit codes for login
                            </li>
                        </ol>
                    </div>

                    {/* QR Code */}
                    <div className="bg-black/50 border border-gray-700 rounded-lg p-6 flex flex-col items-center">
                        <h3 className="text-white font-semibold mb-4">
                            Scan this QR code:
                        </h3>
                        <div className="bg-white p-4 rounded-lg">
                            <Image
                                src={data.qrCode}
                                alt="2FA QR Code"
                                width={256}
                                height={256}
                            />
                        </div>
                        <button
                            onClick={handleDownloadQR}
                            className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Download QR Code
                        </button>
                    </div>

                    {/* Secret Key */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Manual Entry Secret Key:
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-4 py-3 font-mono text-sm text-gray-300 break-all">
                                {data.secret}
                            </div>
                            <button
                                onClick={handleCopySecret}
                                className="px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Email Actions */}
                    <div className="border-t border-gray-800 pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-semibold mb-1">
                                    Send Setup Email
                                </h3>
                                <p className="text-sm text-gray-400">
                                    Email the QR code and instructions to{' '}
                                    {data.email}
                                </p>
                            </div>
                            <button
                                onClick={handleSendEmail}
                                disabled={sendingEmail || emailSent}
                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg hover:from-amber-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {emailSent ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Email Sent!
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4" />
                                        {sendingEmail
                                            ? 'Sending...'
                                            : 'Send Email'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Security Warning */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <h3 className="text-red-400 font-semibold mb-2">
                            ⚠️ Security Reminders:
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                            <li>Keep the QR code and secret key secure</li>
                            <li>Don&apos;t share screenshots of the QR code</li>
                            <li>
                                If the user loses access, contact an
                                administrator
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
