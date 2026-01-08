// =============================================
// FILE: components/Admin/EmailProcessingLoader.tsx
// Real-time email processing loader with status stages
// =============================================

import React, { useState, useEffect } from 'react';
import { Loader2, Mail, CheckCircle, AlertCircle, Sparkles, FileText, Database } from 'lucide-react';

export interface ProcessingStage {
    id: string;
    label: string;
    status: 'pending' | 'active' | 'completed' | 'error';
    icon?: React.ReactNode;
    description?: string;
}

interface EmailProcessingLoaderProps {
    isOpen: boolean;
    onClose?: () => void;
    stages?: ProcessingStage[];
    currentStage?: string;
    progress?: number;
    message?: string;
    error?: string;
}

const defaultStages: ProcessingStage[] = [
    {
        id: 'connecting',
        label: 'Connecting to Email Server',
        status: 'pending',
        icon: <Mail className="w-5 h-5" />,
        description: 'Establishing connection to email server...',
    },
    {
        id: 'fetching',
        label: 'Fetching Unread Emails',
        status: 'pending',
        icon: <Mail className="w-5 h-5" />,
        description: 'Retrieving unread emails from inbox...',
    },
    {
        id: 'ai-processing',
        label: 'AI Processing',
        status: 'pending',
        icon: <Sparkles className="w-5 h-5" />,
        description: 'Claude AI is extracting claim information from emails and PDFs...',
    },
    {
        id: 'creating',
        label: 'Creating Assessments',
        status: 'pending',
        icon: <FileText className="w-5 h-5" />,
        description: 'Creating assessment records in database...',
    },
    {
        id: 'finalizing',
        label: 'Finalizing',
        status: 'pending',
        icon: <Database className="w-5 h-5" />,
        description: 'Saving attachments and completing processing...',
    },
];

export const EmailProcessingLoader: React.FC<EmailProcessingLoaderProps> = ({
    isOpen,
    onClose,
    stages = defaultStages,
    currentStage,
    progress,
    message,
    error,
}) => {
    const [localStages, setLocalStages] = useState<ProcessingStage[]>(stages);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Update stages based on currentStage prop
    useEffect(() => {
        if (currentStage) {
            setLocalStages(prev =>
                prev.map(stage => {
                    const stageIndex = prev.findIndex(s => s.id === stage.id);
                    const currentIndex = prev.findIndex(s => s.id === currentStage);

                    if (stageIndex < currentIndex) {
                        return { ...stage, status: 'completed' as const };
                    } else if (stageIndex === currentIndex) {
                        return { ...stage, status: 'active' as const };
                    } else {
                        return { ...stage, status: 'pending' as const };
                    }
                })
            );
        }
    }, [currentStage, stages]);

    // Timer for elapsed time
    useEffect(() => {
        if (!isOpen) {
            setElapsedTime(0);
            return;
        }

        const interval = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen]);

    // Reset stages when closed
    useEffect(() => {
        if (!isOpen) {
            setLocalStages(stages.map(s => ({ ...s, status: 'pending' as const })));
            setElapsedTime(0);
        }
    }, [isOpen, stages]);

    if (!isOpen) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStageIcon = (stage: ProcessingStage) => {
        if (stage.status === 'completed') {
            return <CheckCircle className="w-5 h-5 text-green-400" />;
        }
        if (stage.status === 'error') {
            return <AlertCircle className="w-5 h-5 text-red-400" />;
        }
        if (stage.status === 'active') {
            return <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />;
        }
        return stage.icon || <Mail className="w-5 h-5 text-gray-500" />;
    };

    const getStageColor = (stage: ProcessingStage) => {
        if (stage.status === 'completed') {
            return 'border-green-500/50 bg-green-500/10';
        }
        if (stage.status === 'error') {
            return 'border-red-500/50 bg-red-500/10';
        }
        if (stage.status === 'active') {
            return 'border-amber-500/50 bg-amber-500/10';
        }
        return 'border-gray-700 bg-gray-800/30';
    };

    const getStageTextColor = (stage: ProcessingStage) => {
        if (stage.status === 'completed') {
            return 'text-green-400';
        }
        if (stage.status === 'error') {
            return 'text-red-400';
        }
        if (stage.status === 'active') {
            return 'text-amber-400';
        }
        return 'text-gray-400';
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-6 max-w-2xl w-full shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-red-600 rounded-lg flex items-center justify-center">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                Processing Emails
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {formatTime(elapsedTime)} elapsed
                            </p>
                        </div>
                    </div>
                    {onClose && !error && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <AlertCircle className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Progress Bar */}
                {progress !== undefined && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Overall Progress</span>
                            <span className="text-sm text-gray-400">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-red-600 transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <h4 className="text-red-400 font-semibold">Error</h4>
                        </div>
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                {/* Status Message */}
                {message && !error && (
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg">
                        <p className="text-amber-300 text-sm">{message}</p>
                    </div>
                )}

                {/* Stages */}
                <div className="space-y-3">
                    {localStages.map((stage, index) => (
                        <div
                            key={stage.id}
                            className={`p-4 rounded-lg border transition-all duration-300 ${getStageColor(
                                stage
                            )}`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 mt-0.5">
                                    {getStageIcon(stage)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4
                                            className={`font-semibold ${getStageTextColor(
                                                stage
                                            )}`}
                                        >
                                            {stage.label}
                                        </h4>
                                        {stage.status === 'active' && (
                                            <span className="text-xs text-amber-400 animate-pulse">
                                                In Progress...
                                            </span>
                                        )}
                                        {stage.status === 'completed' && (
                                            <span className="text-xs text-green-400">
                                                Completed
                                            </span>
                                        )}
                                    </div>
                                    {stage.description && (
                                        <p className="text-sm text-gray-400">
                                            {stage.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Progress indicator for active stage */}
                            {stage.status === 'active' && (
                                <div className="mt-3 ml-9">
                                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-amber-500 to-red-600 animate-pulse" style={{ width: '60%' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-gray-800">
                    <p className="text-xs text-gray-500 text-center">
                        Please do not close this window while processing is in progress
                    </p>
                </div>
            </div>
        </div>
    );
};

