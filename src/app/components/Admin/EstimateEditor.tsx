// =============================================
// FILE: components/Admin/EstimateEditor.tsx
// Interactive Estimate Editor Component
// Allows inline editing of labor, parts, sublet, and misc items
// =============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Calculator,
    MessageSquare,
    Loader2,
} from 'lucide-react';
import type { LaborItem, PartItem, SubletItem, MiscItem } from '@/server/lib/types/pdf-report.types';
import { useToast } from '../Toast';

interface EstimateItem {
    _id: string;
    _type: 'labor' | 'parts' | 'sublet' | 'misc';
    [key: string]: unknown;
}

interface EstimateData {
    labor: EstimateItem[];
    parts: EstimateItem[];
    sublet: EstimateItem[];
    misc: EstimateItem[];
    totals: {
        labor_total_hours?: number | null;
        labor_total_cost?: number | null;
        labor_rate_rr?: number | null;
        labor_rate_ra?: number | null;
        labor_rate_ref?: number | null;
        parts_total_cost?: number | null;
        sublet_total_cost?: number | null;
        misc_total_cost?: number | null;
        total_excluding_gst?: number | null;
        gst_amount?: number | null;
        total_including_gst?: number | null;
    };
}

interface EstimateEditorProps {
    assessmentId: string;
    onUpdate?: () => void;
}

type TabType = 'labor' | 'parts' | 'sublet' | 'misc';

export const EstimateEditor: React.FC<EstimateEditorProps> = ({
    assessmentId,
    onUpdate,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('labor');
    const [data, setData] = useState<EstimateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editedItem, setEditedItem] = useState<EstimateItem | null>(null);
    const { showError, showSuccess } = useToast();

    useEffect(() => {
        loadEstimateData();
    }, [assessmentId]);

    const loadEstimateData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/assessments/${assessmentId}/estimate/items`);
            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            if (result.data) {
                setData(result.data);
            }
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Failed to load estimate data');
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculate = async () => {
        setRecalculating(true);
        try {
            const response = await fetch(`/api/assessments/${assessmentId}/estimate/recalculate`, {
                method: 'POST',
            });

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            // Reload data to get updated totals
            await loadEstimateData();
            showSuccess('Totals recalculated successfully');
            if (onUpdate) onUpdate();
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Failed to recalculate totals');
        } finally {
            setRecalculating(false);
        }
    };

    const handleEdit = (itemId: string) => {
        const items = getCurrentItems();
        const item = items.find((i) => i._id === itemId);
        if (item) {
            setEditingItem(itemId);
            setEditedItem({ ...item });
        }
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setEditedItem(null);
    };

    const handleSaveEdit = async () => {
        if (!editedItem || !editingItem) return;

        setSaving(true);
        try {
            const parts = editingItem.split('_');
            const itemType = parts[0] as TabType;
            const itemIndex = parseInt(parts[1], 10);

            // Remove internal fields before saving
            const { _id, _type, ...itemData } = editedItem;

            const response = await fetch(
                `/api/assessments/${assessmentId}/estimate/items/${editingItem}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemType,
                        item: itemData,
                    }),
                }
            );

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            showSuccess('Item updated successfully');
            setEditingItem(null);
            setEditedItem(null);
            await loadEstimateData();
            await handleRecalculate();
            if (onUpdate) onUpdate();
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Failed to update item');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        setSaving(true);
        try {
            const parts = itemId.split('_');
            const itemType = parts[0] as TabType;

            const response = await fetch(
                `/api/assessments/${assessmentId}/estimate/items/${itemId}?itemType=${itemType}`,
                {
                    method: 'DELETE',
                }
            );

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            showSuccess('Item deleted successfully');
            await loadEstimateData();
            await handleRecalculate();
            if (onUpdate) onUpdate();
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Failed to delete item');
        } finally {
            setSaving(false);
        }
    };

    const handleAddItem = async () => {
        const newItem = getDefaultItem(activeTab);
        setSaving(true);

        try {
            const response = await fetch(`/api/assessments/${assessmentId}/estimate/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemType: activeTab,
                    item: newItem,
                }),
            });

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            showSuccess('Item added successfully');
            await loadEstimateData();
            await handleRecalculate();
            if (onUpdate) onUpdate();
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Failed to add item');
        } finally {
            setSaving(false);
        }
    };

    const getDefaultItem = (type: TabType): LaborItem | PartItem | SubletItem | MiscItem => {
        switch (type) {
            case 'labor':
                return {
                    description: '',
                    hours_quoted: 0,
                    hours_assessed: 0,
                    rate_type: 'RR',
                    rate: data?.totals.labor_rate_rr || 0,
                } as LaborItem;
            case 'parts':
                return {
                    item: '',
                    quantity: 0,
                    quantity_assessed: 0,
                    price: 0,
                    price_assessed: 0,
                } as PartItem;
            case 'sublet':
                return {
                    description: '',
                    quoted: 0,
                    assessed: 0,
                } as SubletItem;
            case 'misc':
                return {
                    description: '',
                    quoted: 0,
                    assessed: 0,
                } as MiscItem;
        }
    };

    const getCurrentItems = (): EstimateItem[] => {
        if (!data) return [];
        switch (activeTab) {
            case 'labor':
                return data.labor;
            case 'parts':
                return data.parts;
            case 'sublet':
                return data.sublet;
            case 'misc':
                return data.misc;
        }
    };

    const updateEditedField = (field: string, value: unknown) => {
        if (!editedItem) return;
        setEditedItem({ ...editedItem, [field]: value });
    };

    const formatCurrency = (value: number | null | undefined) => {
        if (value === null || value === undefined) return '$0.00';
        return `$${value.toFixed(2)}`;
    };

    const formatHours = (value: number | null | undefined) => {
        if (value === null || value === undefined) return '0.00';
        return value.toFixed(2);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-400">Loading estimate data...</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center text-gray-400">
                No estimate data available
            </div>
        );
    }

    const items = getCurrentItems();

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
                {(['labor', 'parts', 'sublet', 'misc'] as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium capitalize transition-colors ${
                            activeTab === tab
                                ? 'border-b-2 border-blue-500 text-blue-400'
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        {tab} ({items.length})
                    </button>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
                <button
                    onClick={handleAddItem}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    Add {activeTab} Item
                </button>

                <button
                    onClick={handleRecalculate}
                    disabled={recalculating}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    {recalculating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Calculator className="w-4 h-4" />
                    )}
                    Recalculate Totals
                </button>
            </div>

            {/* Items Table */}
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-800 border-b border-gray-700">
                            <tr>
                                {activeTab === 'labor' && (
                                    <>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Description
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Rate Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Rate
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Hours Quoted
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Hours Assessed
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Variance
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Cost
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Actions
                                        </th>
                                    </>
                                )}
                                {activeTab === 'parts' && (
                                    <>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Part Number
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Item
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Qty Quoted
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Qty Assessed
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Price Quoted
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Price Assessed
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Total
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Actions
                                        </th>
                                    </>
                                )}
                                {(activeTab === 'sublet' || activeTab === 'misc') && (
                                    <>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Description
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Quoted
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Assessed
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Variance
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                                            Actions
                                        </th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={activeTab === 'labor' ? 8 : activeTab === 'parts' ? 8 : 5}
                                        className="px-4 py-8 text-center text-gray-400"
                                    >
                                        No {activeTab} items. Click "Add {activeTab} Item" to add one.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => {
                                    const isEditing = editingItem === item._id;

                                    if (activeTab === 'labor') {
                                        const laborItem = item as EstimateItem & LaborItem;
                                        const hoursQuoted = laborItem.hours_quoted || 0;
                                        const hoursAssessed = laborItem.hours_assessed || 0;
                                        const variance = hoursAssessed - hoursQuoted;
                                        const rate = laborItem.rate || 0;
                                        const cost = hoursAssessed * rate;

                                        return (
                                            <tr key={item._id} className="hover:bg-gray-800/30">
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={(editedItem?.description as string) || ''}
                                                            onChange={(e) =>
                                                                updateEditedField('description', e.target.value)
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-300">
                                                            {laborItem.description || '-'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <select
                                                            value={(editedItem?.rate_type as string) || 'RR'}
                                                            onChange={(e) =>
                                                                updateEditedField('rate_type', e.target.value)
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                        >
                                                            <option value="RR">RR</option>
                                                            <option value="RA">RA</option>
                                                            <option value="REF">REF</option>
                                                        </select>
                                                    ) : (
                                                        <span className="text-sm text-gray-300">
                                                            {laborItem.rate_type || '-'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={(editedItem?.rate as number) || 0}
                                                            onChange={(e) =>
                                                                updateEditedField('rate', parseFloat(e.target.value) || 0)
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-300">
                                                            {formatCurrency(rate)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={(editedItem?.hours_quoted as number) || 0}
                                                            onChange={(e) =>
                                                                updateEditedField(
                                                                    'hours_quoted',
                                                                    parseFloat(e.target.value) || 0
                                                                )
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-300">
                                                            {formatHours(hoursQuoted)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={(editedItem?.hours_assessed as number) || 0}
                                                            onChange={(e) =>
                                                                updateEditedField(
                                                                    'hours_assessed',
                                                                    parseFloat(e.target.value) || 0
                                                                )
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-300">
                                                            {formatHours(hoursAssessed)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`text-sm ${
                                                            variance < 0
                                                                ? 'text-red-400'
                                                                : variance > 0
                                                                ? 'text-green-400'
                                                                : 'text-gray-300'
                                                        }`}
                                                    >
                                                        {variance >= 0 ? '+' : ''}
                                                        {formatHours(variance)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-300">
                                                        {formatCurrency(cost)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {isEditing ? (
                                                            <>
                                                                <button
                                                                    onClick={handleSaveEdit}
                                                                    disabled={saving}
                                                                    className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                                                    title="Save"
                                                                >
                                                                    <Save className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                                                    title="Cancel"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEdit(item._id)}
                                                                    className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item._id)}
                                                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    if (activeTab === 'parts') {
                                        const partsItem = item as EstimateItem & PartItem;
                                        const qtyQuoted = partsItem.quantity || 0;
                                        const qtyAssessed = partsItem.quantity_assessed || 0;
                                        const priceQuoted = partsItem.price || 0;
                                        const priceAssessed = partsItem.price_assessed || 0;
                                        const total = qtyAssessed * priceAssessed;

                                        return (
                                            <tr key={item._id} className="hover:bg-gray-800/30">
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={(editedItem?.part_number as string) || ''}
                                                            onChange={(e) =>
                                                                updateEditedField('part_number', e.target.value)
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                            placeholder="Part Number"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-300">
                                                            {partsItem.part_number || '-'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={(editedItem?.item as string) || ''}
                                                            onChange={(e) =>
                                                                updateEditedField('item', e.target.value)
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-300">
                                                            {partsItem.item || '-'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={(editedItem?.quantity as number) || 0}
                                                            onChange={(e) =>
                                                                updateEditedField('quantity', parseFloat(e.target.value) || 0)
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-300">{qtyQuoted}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={(editedItem?.quantity_assessed as number) || 0}
                                                            onChange={(e) =>
                                                                updateEditedField(
                                                                    'quantity_assessed',
                                                                    parseFloat(e.target.value) || 0
                                                                )
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-300">{qtyAssessed}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={(editedItem?.price as number) || 0}
                                                            onChange={(e) =>
                                                                updateEditedField('price', parseFloat(e.target.value) || 0)
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-300">
                                                            {formatCurrency(priceQuoted)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={(editedItem?.price_assessed as number) || 0}
                                                            onChange={(e) =>
                                                                updateEditedField(
                                                                    'price_assessed',
                                                                    parseFloat(e.target.value) || 0
                                                                )
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-300">
                                                            {formatCurrency(priceAssessed)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-300">{formatCurrency(total)}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {isEditing ? (
                                                            <>
                                                                <button
                                                                    onClick={handleSaveEdit}
                                                                    disabled={saving}
                                                                    className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                                                    title="Save"
                                                                >
                                                                    <Save className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                                                    title="Cancel"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEdit(item._id)}
                                                                    className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item._id)}
                                                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    if (activeTab === 'sublet' || activeTab === 'misc') {
                                        const itemData = item as EstimateItem & (SubletItem | MiscItem);
                                        const quoted = itemData.quoted || 0;
                                        const assessed = itemData.assessed || 0;
                                        const variance = assessed - quoted;

                                        return (
                                            <tr key={item._id} className="hover:bg-gray-800/30">
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={(editedItem?.description as string) || ''}
                                                            onChange={(e) =>
                                                                updateEditedField('description', e.target.value)
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-300">
                                                            {itemData.description || '-'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={(editedItem?.quoted as number) || 0}
                                                            onChange={(e) =>
                                                                updateEditedField('quoted', parseFloat(e.target.value) || 0)
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-300">
                                                            {formatCurrency(quoted)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={(editedItem?.assessed as number) || 0}
                                                            onChange={(e) =>
                                                                updateEditedField('assessed', parseFloat(e.target.value) || 0)
                                                            }
                                                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-300">
                                                            {formatCurrency(assessed)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`text-sm ${
                                                            variance < 0
                                                                ? 'text-red-400'
                                                                : variance > 0
                                                                ? 'text-green-400'
                                                                : 'text-gray-300'
                                                        }`}
                                                    >
                                                        {variance >= 0 ? '+' : ''}
                                                        {formatCurrency(variance)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {isEditing ? (
                                                            <>
                                                                <button
                                                                    onClick={handleSaveEdit}
                                                                    disabled={saving}
                                                                    className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                                                    title="Save"
                                                                >
                                                                    <Save className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                                                    title="Cancel"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEdit(item._id)}
                                                                    className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item._id)}
                                                                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return null;
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Totals Summary */}
            {data.totals && (
                <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                    <h3 className="text-lg font-semibold text-gray-200 mb-4">Totals</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {activeTab === 'labor' && (
                            <>
                                <div>
                                    <div className="text-sm text-gray-400">Labor Hours</div>
                                    <div className="text-lg font-semibold text-white">
                                        {formatHours(data.totals.labor_total_hours)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400">Labor Cost</div>
                                    <div className="text-lg font-semibold text-white">
                                        {formatCurrency(data.totals.labor_total_cost)}
                                    </div>
                                </div>
                            </>
                        )}
                        {activeTab === 'parts' && (
                            <div>
                                <div className="text-sm text-gray-400">Parts Total</div>
                                <div className="text-lg font-semibold text-white">
                                    {formatCurrency(data.totals.parts_total_cost)}
                                </div>
                            </div>
                        )}
                        {activeTab === 'sublet' && (
                            <div>
                                <div className="text-sm text-gray-400">Sublet Total</div>
                                <div className="text-lg font-semibold text-white">
                                    {formatCurrency(data.totals.sublet_total_cost)}
                                </div>
                            </div>
                        )}
                        {activeTab === 'misc' && (
                            <div>
                                <div className="text-sm text-gray-400">Misc Total</div>
                                <div className="text-lg font-semibold text-white">
                                    {formatCurrency(data.totals.misc_total_cost)}
                                </div>
                            </div>
                        )}
                        <div>
                            <div className="text-sm text-gray-400">Total (ex GST)</div>
                            <div className="text-lg font-semibold text-white">
                                {formatCurrency(data.totals.total_excluding_gst)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400">GST</div>
                            <div className="text-lg font-semibold text-white">
                                {formatCurrency(data.totals.gst_amount)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400">Total (inc GST)</div>
                            <div className="text-lg font-semibold text-green-400">
                                {formatCurrency(data.totals.total_including_gst)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

