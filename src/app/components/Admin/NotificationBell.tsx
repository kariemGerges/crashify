'use client';

// =============================================
// FILE: components/Admin/NotificationBell.tsx
// In-app Notification Bell Icon Component (REQ-121)
// =============================================

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useToast } from '../Toast';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    resource_type: string | null;
    resource_id: string | null;
    priority: 'low' | 'medium' | 'high' | 'critical';
    is_read: boolean;
    created_at: string;
}

export const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { showError, showSuccess } = useToast();

    // Fetch notifications
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/notifications?unread_only=false&limit=20');
            const result = await response.json();
            
            if (result.success) {
                setNotifications(result.data || []);
                setUnreadCount(result.unreadCount || 0);
            } else {
                showError('Failed to load notifications');
            }
        } catch (error) {
            console.error('[NotificationBell] Error:', error);
            showError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId: string) => {
        try {
            const csrfResponse = await fetch('/api/csrf-token', {
                credentials: 'include',
            });
            const csrfData = await csrfResponse.json();
            const csrfToken = csrfData.token;

            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken,
                },
                credentials: 'include',
            });

            const result = await response.json();
            if (result.success) {
                // Update local state
                setNotifications(prev => 
                    prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('[NotificationBell] Error marking as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const csrfResponse = await fetch('/api/csrf-token', {
                credentials: 'include',
            });
            const csrfData = await csrfResponse.json();
            const csrfToken = csrfData.token;

            const response = await fetch('/api/notifications/read-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken,
                },
                credentials: 'include',
            });

            const result = await response.json();
            if (result.success) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
                showSuccess(`Marked ${result.count || 0} notification(s) as read`);
            }
        } catch (error) {
            console.error('[NotificationBell] Error marking all as read:', error);
            showError('Failed to mark all as read');
        }
    };

    // Fetch on mount and when dropdown opens
    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isOpen) {
                fetchNotifications();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [isOpen]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical':
                return 'border-red-500 bg-red-500/10';
            case 'high':
                return 'border-orange-500 bg-orange-500/10';
            case 'medium':
                return 'border-amber-500 bg-amber-500/10';
            case 'low':
                return 'border-gray-500 bg-gray-500/10';
            default:
                return 'border-gray-500 bg-gray-500/10';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <h3 className="text-lg font-semibold text-white">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                No notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                                            !notification.is_read ? 'bg-gray-800/30' : ''
                                        }`}
                                        onClick={() => {
                                            if (!notification.is_read) {
                                                markAsRead(notification.id);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-1 h-full rounded ${getPriorityColor(notification.priority)}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className={`text-sm font-medium ${
                                                        notification.is_read ? 'text-gray-400' : 'text-white'
                                                    }`}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.is_read && (
                                                        <span className="w-2 h-2 bg-amber-500 rounded-full" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">
                                                        {formatTime(notification.created_at)}
                                                    </span>
                                                    {notification.resource_id && (
                                                        <a
                                                            href={`/admin/${notification.resource_type}/${notification.resource_id}`}
                                                            className="text-xs text-amber-500 hover:text-amber-400"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            View →
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

