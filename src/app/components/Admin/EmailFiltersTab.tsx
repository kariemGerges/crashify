'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Check, AlertCircle } from 'lucide-react';
import { useToast } from '../Toast';

interface EmailFilter {
    id: string;
    type: 'whitelist' | 'blacklist';
    email_domain: string | null;
    email_address: string | null;
    reason: string | null;
    is_active: boolean;
    created_at: string;
}

export const EmailFiltersTab: React.FC = () => {
    const [filters, setFilters] = useState<EmailFilter[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingFilter, setEditingFilter] = useState<EmailFilter | null>(null);
    const [formData, setFormData] = useState({
        type: 'whitelist' as 'whitelist' | 'blacklist',
        email_domain: '',
        email_address: '',
        reason: '',
        is_active: true,
    });
    const { showError, showSuccess } = useToast();

    useEffect(() => {
        loadFilters();
    }, []);

    const loadFilters = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/email-filters');
            const result = await response.json();
            if (result.success) {
                setFilters(result.data || []);
            } else {
                showError('Failed to load email filters');
            }
        } catch (error) {
            showError('Failed to load email filters');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const csrfResponse = await fetch('/api/csrf-token', {
            credentials: 'include',
        });
        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.token;

        try {
            const url = editingFilter
                ? `/api/admin/email-filters/${editingFilter.id}`
                : '/api/admin/email-filters';
            const method = editingFilter ? 'PATCH' : 'POST';

            const body: Record<string, unknown> = {
                ...formData,
                email_domain: formData.email_domain || null,
                email_address: formData.email_address || null,
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken,
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();
            if (result.success) {
                showSuccess(editingFilter ? 'Filter updated' : 'Filter created');
                setShowAddModal(false);
                setEditingFilter(null);
                resetForm();
                loadFilters();
            } else {
                showError(result.error || 'Failed to save filter');
            }
        } catch (error) {
            showError('Failed to save filter');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this filter?')) return;

        const csrfResponse = await fetch('/api/csrf-token', {
            credentials: 'include',
        });
        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.token;
        try {
            const response = await fetch(`/api/admin/email-filters/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-csrf-token': csrfToken,
                },
            });

            const result = await response.json();
            if (result.success) {
                showSuccess('Filter deleted');
                loadFilters();
            } else {
                showError(result.error || 'Failed to delete filter');
            }
        } catch (error) {
            showError('Failed to delete filter');
        }
    };

    const handleEdit = (filter: EmailFilter) => {
        setEditingFilter(filter);
        setFormData({
            type: filter.type,
            email_domain: filter.email_domain || '',
            email_address: filter.email_address || '',
            reason: filter.reason || '',
            is_active: filter.is_active,
        });
        setShowAddModal(true);
    };

    const resetForm = () => {
        setFormData({
            type: 'whitelist',
            email_domain: '',
            email_address: '',
            reason: '',
            is_active: true,
        });
    };

    const whitelistFilters = filters.filter(f => f.type === 'whitelist');
    const blacklistFilters = filters.filter(f => f.type === 'blacklist');

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-400">Loading email filters...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Email Filters</h2>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingFilter(null);
                        setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Filter
                </button>
            </div>

            {/* Whitelist Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    Whitelist ({whitelistFilters.length})
                </h3>
                <div className="space-y-2">
                    {whitelistFilters.length === 0 ? (
                        <p className="text-gray-400 text-sm">No whitelist filters</p>
                    ) : (
                        whitelistFilters.map(filter => (
                            <FilterRow
                                key={filter.id}
                                filter={filter}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Blacklist Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Blacklist ({blacklistFilters.length})
                </h3>
                <div className="space-y-2">
                    {blacklistFilters.length === 0 ? (
                        <p className="text-gray-400 text-sm">No blacklist filters</p>
                    ) : (
                        blacklistFilters.map(filter => (
                            <FilterRow
                                key={filter.id}
                                filter={filter}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">
                                {editingFilter ? 'Edit Filter' : 'Add Filter'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingFilter(null);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'whitelist' | 'blacklist' })}
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
                                    required
                                >
                                    <option value="whitelist">Whitelist</option>
                                    <option value="blacklist">Blacklist</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Domain (e.g., example.com)
                                </label>
                                <input
                                    type="text"
                                    value={formData.email_domain}
                                    onChange={(e) => setFormData({ ...formData, email_domain: e.target.value, email_address: '' })}
                                    placeholder="example.com"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
                                    disabled={!!formData.email_address}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    OR Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email_address}
                                    onChange={(e) => setFormData({ ...formData, email_address: e.target.value, email_domain: '' })}
                                    placeholder="user@example.com"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
                                    disabled={!!formData.email_domain}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Reason (optional)
                                </label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Reason for adding to filter list"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-300">
                                    Active
                                </label>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                                >
                                    {editingFilter ? 'Update' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingFilter(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const FilterRow: React.FC<{
    filter: EmailFilter;
    onEdit: (filter: EmailFilter) => void;
    onDelete: (id: string) => void;
}> = ({ filter, onEdit, onDelete }) => {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-white font-medium">
                        {filter.email_address || filter.email_domain}
                    </span>
                    {!filter.is_active && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">
                            Inactive
                        </span>
                    )}
                </div>
                {filter.reason && (
                    <p className="text-gray-400 text-sm mt-1">{filter.reason}</p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onEdit(filter)}
                    className="p-2 text-gray-400 hover:text-amber-500 transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(filter.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

