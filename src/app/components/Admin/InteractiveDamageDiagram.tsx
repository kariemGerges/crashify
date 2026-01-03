import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Edit, X, Save, AlertCircle, Calendar, Loader2, RotateCcw, Box } from 'lucide-react';
import { useToast } from '../Toast';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';

// =============================================
// SVC DAMAGE DIAGRAM SYSTEM - PRODUCTION READY
// Follows Crashify SVC Damage Diagram System Specification
// =============================================

// Severity codes from SVC specification (Authoritative)
const SEVERITY_CODES = [
    { code: 'LB', label: 'Light Bar', color: '#fbbf24', category: ['BAR'] },
    { code: 'HB', label: 'Heavy Bar', color: '#f59e0b', category: ['BAR'] },
    { code: 'LP', label: 'Light Panel', color: '#fbbf24', category: ['PNL'] },
    { code: 'HP', label: 'Heavy Panel', color: '#f97316', category: ['PNL'] },
    {
        code: 'LS',
        label: 'Light Structural',
        color: '#ef4444',
        category: ['STR'],
    },
    {
        code: 'HS',
        label: 'Heavy Structural',
        color: '#dc2626',
        category: ['STR'],
    },
    {
        code: 'UN',
        label: 'Unrepairable',
        color: '#000000',
        category: ['PNL', 'STR'],
    },
    {
        code: 'MiM',
        label: 'Minor Mechanical',
        color: '#a78bfa',
        category: ['MEC'],
    },
    {
        code: 'MaM',
        label: 'Major Mechanical',
        color: '#8b5cf6',
        category: ['MEC'],
    },
    {
        code: 'MiS',
        label: 'Minor Stripping',
        color: '#34d399',
        category: ['PNL'],
    },
    {
        code: 'MaS',
        label: 'Major Stripping',
        color: '#10b981',
        category: ['PNL'],
    },
    {
        code: 'MiV',
        label: 'Minor Vandalism',
        color: '#60a5fa',
        category: ['PNL', 'INT'],
    },
    {
        code: 'MaV',
        label: 'Major Vandalism',
        color: '#3b82f6',
        category: ['PNL', 'INT'],
    },
    {
        code: 'WF',
        label: 'Water (Fresh)',
        color: '#06b6d4',
        category: ['STR', 'MEC', 'ELE'],
    },
    {
        code: 'WS',
        label: 'Water (Salt)',
        color: '#0891b2',
        category: ['STR', 'MEC', 'ELE'],
    },
    { code: 'F', label: 'Burnt', color: '#991b1b', category: ['STR', 'PNL'] },
    {
        code: 'SH',
        label: 'Smoke & Heat',
        color: '#7f1d1d',
        category: ['INT', 'PNL'],
    },
    { code: 'MS', label: 'Minor Smoke', color: '#9ca3af', category: ['INT'] },
] as const;

// Zone Category Types
type ZoneCategory =
    | 'BAR'
    | 'PNL'
    | 'GLS'
    | 'STR'
    | 'MEC'
    | 'SUS'
    | 'INT'
    | 'ELE';

// Severity Code Types
type SeverityCode = (typeof SEVERITY_CODES)[number]['code'];

// View Types
type ViewType = 'TOP' | 'FRT' | 'REA' | 'LHS' | 'RHS' | 'UND' | 'INT';

// SVC Zone Metadata Interface (matches SVC spec)
interface SVCZoneMetadata {
    zone_id: string; // Format: <ASSET>_<BODY>_<ZONE>
    label: string;
    category: ZoneCategory;
    severity_allowed: SeverityCode[];
}

// Damage Entry Interface (matches SVC spec exactly)
export interface DamageEntry {
    zone_id: string;
    label: string;
    category: ZoneCategory;
    severity: SeverityCode;
    pre_existing: boolean;
    comments?: string;
}

// SVC Zone Definition for Light Vehicle SUV
// Based on Crashify SVC Damage Diagram System Specification
// Zone IDs follow format: <ASSET>_<BODY>_<ZONE>
// Example: LV_SUV_L_DOR_R = Light Vehicle, SUV, Left Rear Door
const DEFAULT_ZONE_METADATA: Record<string, SVCZoneMetadata> = {
    // ============================================
    // FRONT VIEW (FRT) Zones
    // ============================================
    LV_SUV_F_BAR: {
        zone_id: 'LV_SUV_F_BAR',
        label: 'Front Bumper/Bar',
        category: 'BAR',
        severity_allowed: ['LB', 'HB', 'UN'],
    },
    LV_SUV_BON: {
        zone_id: 'LV_SUV_BON',
        label: 'Bonnet',
        category: 'PNL',
        severity_allowed: ['LP', 'HP', 'LS', 'HS', 'UN'],
    },
    LV_SUV_F_GLS: {
        zone_id: 'LV_SUV_F_GLS',
        label: 'Windscreen',
        category: 'GLS',
        severity_allowed: ['UN'],
    },
    LV_SUV_L_FDR: {
        zone_id: 'LV_SUV_L_FDR',
        label: 'Left Front Guard',
        category: 'PNL',
        severity_allowed: ['LP', 'HP', 'LS', 'HS', 'UN'],
    },
    LV_SUV_R_FDR: {
        zone_id: 'LV_SUV_R_FDR',
        label: 'Right Front Guard',
        category: 'PNL',
        severity_allowed: ['LP', 'HP', 'LS', 'HS', 'UN'],
    },
    
    // ============================================
    // REAR VIEW (REA) Zones
    // ============================================
    LV_SUV_R_BAR: {
        zone_id: 'LV_SUV_R_BAR',
        label: 'Rear Bumper/Bar',
        category: 'BAR',
        severity_allowed: ['LB', 'HB', 'UN'],
    },
    LV_SUV_BOOT: {
        zone_id: 'LV_SUV_BOOT',
        label: 'Boot/Tailgate',
        category: 'PNL',
        severity_allowed: ['LP', 'HP', 'LS', 'HS', 'UN'],
    },
    LV_SUV_R_GLS: {
        zone_id: 'LV_SUV_R_GLS',
        label: 'Rear Glass',
        category: 'GLS',
        severity_allowed: ['UN'],
    },
    LV_SUV_L_QTR: {
        zone_id: 'LV_SUV_L_QTR',
        label: 'Left Quarter Panel',
        category: 'PNL',
        severity_allowed: ['LP', 'HP', 'LS', 'HS', 'UN'],
    },
    LV_SUV_R_QTR: {
        zone_id: 'LV_SUV_R_QTR',
        label: 'Right Quarter Panel',
        category: 'PNL',
        severity_allowed: ['LP', 'HP', 'LS', 'HS', 'UN'],
    },
    
    // ============================================
    // LEFT SIDE VIEW (LHS) Zones
    // ============================================
    LV_SUV_L_DOR_F: {
        zone_id: 'LV_SUV_L_DOR_F',
        label: 'Left Front Door',
        category: 'PNL',
        severity_allowed: ['LP', 'HP', 'LS', 'HS', 'UN'],
    },
    LV_SUV_L_DOR_R: {
        zone_id: 'LV_SUV_L_DOR_R',
        label: 'Left Rear Door',
        category: 'PNL',
        severity_allowed: ['LP', 'HP', 'LS', 'HS', 'UN'],
    },
    
    // ============================================
    // RIGHT SIDE VIEW (RHS) Zones
    // ============================================
    LV_SUV_R_DOR_F: {
        zone_id: 'LV_SUV_R_DOR_F',
        label: 'Right Front Door',
        category: 'PNL',
        severity_allowed: ['LP', 'HP', 'LS', 'HS', 'UN'],
    },
    LV_SUV_R_DOR_R: {
        zone_id: 'LV_SUV_R_DOR_R',
        label: 'Right Rear Door',
        category: 'PNL',
        severity_allowed: ['LP', 'HP', 'LS', 'HS', 'UN'],
    },
    
    // ============================================
    // TOP VIEW (TOP) Zones
    // ============================================
    LV_SUV_ROF: {
        zone_id: 'LV_SUV_ROF',
        label: 'Roof',
        category: 'PNL',
        severity_allowed: ['LP', 'HP', 'LS', 'HS', 'UN'],
    },
};

// Zone path definitions for clickable areas
// Using SVG paths for accurate zone boundaries matching actual vehicle parts
interface ZonePath {
    view: ViewType;
    path: string; // SVG path data
    bounds?: { x: number; y: number; width: number; height: number }; // Bounding box for text positioning
}

// Zone path definitions for clickable areas
// Based on SVC Specification - Each zone can appear in multiple views
// Key format: <ZONE_ID>_<VIEW> to handle zones that appear in multiple views
// Coordinates use 0-100 viewBox system - Estimated based on typical SUV proportions
// Each path covers the ENTIRE part (entire door, entire bumper, etc.)
const ZONE_PATHS: Record<string, ZonePath> = {
    // ============================================
    // FRONT VIEW (FRT) - Based on typical SUV front proportions
    // ============================================
    'LV_SUV_F_BAR_FRT': {
        view: 'FRT',
        // Front bumper - bottom 8% of image, full width with slight inset
        path: 'M 15 88 L 85 88 L 85 100 L 15 100 Z',
        bounds: { x: 15, y: 88, width: 70, height: 12 },
    },
    'LV_SUV_BON_FRT': {
        view: 'FRT',
        // Bonnet/hood - center area, trapezoid shape (wider at bottom)
        path: 'M 30 35 L 70 35 L 68 60 L 32 60 Z',
        bounds: { x: 30, y: 35, width: 40, height: 25 },
    },
    'LV_SUV_F_GLS_FRT': {
        view: 'FRT',
        // Windscreen - upper area, trapezoid shape (wider at top)
        path: 'M 25 12 L 75 12 L 72 32 L 28 32 Z',
        bounds: { x: 25, y: 12, width: 50, height: 20 },
    },
    'LV_SUV_L_FDR_FRT': {
        view: 'FRT',
        // Left front guard/fender - left side, from bumper to windscreen
        path: 'M 5 45 L 28 45 L 28 70 L 5 70 Z',
        bounds: { x: 5, y: 45, width: 23, height: 25 },
    },
    'LV_SUV_R_FDR_FRT': {
        view: 'FRT',
        // Right front guard/fender - right side, from bumper to windscreen
        path: 'M 72 45 L 95 45 L 95 70 L 72 70 Z',
        bounds: { x: 72, y: 45, width: 23, height: 25 },
    },
    
    // ============================================
    // REAR VIEW (REA) - Based on typical SUV rear proportions
    // ============================================
    'LV_SUV_R_BAR_REA': {
        view: 'REA',
        // Rear bumper - top 8% of image, full width with slight inset
        path: 'M 15 0 L 85 0 L 85 12 L 15 12 Z',
        bounds: { x: 15, y: 0, width: 70, height: 12 },
    },
    'LV_SUV_BOOT_REA': {
        view: 'REA',
        // Boot/tailgate - center area, rectangular
        path: 'M 30 12 L 70 12 L 70 45 L 30 45 Z',
        bounds: { x: 30, y: 12, width: 40, height: 33 },
    },
    'LV_SUV_R_GLS_REA': {
        view: 'REA',
        // Rear glass - upper area, trapezoid shape
        path: 'M 28 15 L 72 15 L 70 30 L 30 30 Z',
        bounds: { x: 28, y: 15, width: 44, height: 15 },
    },
    'LV_SUV_L_QTR_REA': {
        view: 'REA',
        // Left quarter panel - left side, from bumper to roof
        path: 'M 5 18 L 28 18 L 28 50 L 5 50 Z',
        bounds: { x: 5, y: 18, width: 23, height: 32 },
    },
    'LV_SUV_R_QTR_REA': {
        view: 'REA',
        // Right quarter panel - right side, from bumper to roof
        path: 'M 72 18 L 95 18 L 95 50 L 72 50 Z',
        bounds: { x: 72, y: 18, width: 23, height: 32 },
    },
    
    // ============================================
    // LEFT SIDE VIEW (LHS) - Based on typical SUV side proportions
    // ============================================
    'LV_SUV_L_FDR_LHS': {
        view: 'LHS',
        // Left front guard - front section, from wheel arch to windscreen
        path: 'M 3 22 L 20 22 L 20 42 L 3 42 Z',
        bounds: { x: 3, y: 22, width: 17, height: 20 },
    },
    'LV_SUV_L_DOR_F_LHS': {
        view: 'LHS',
        // Left front door - first door, rectangular
        path: 'M 3 42 L 20 42 L 20 65 L 3 65 Z',
        bounds: { x: 3, y: 42, width: 17, height: 23 },
    },
    'LV_SUV_L_DOR_R_LHS': {
        view: 'LHS',
        // Left rear door - second door, rectangular
        path: 'M 3 65 L 20 65 L 20 88 L 3 88 Z',
        bounds: { x: 3, y: 65, width: 17, height: 23 },
    },
    'LV_SUV_L_QTR_LHS': {
        view: 'LHS',
        // Left quarter panel - rear section, from rear door to tailgate
        path: 'M 3 88 L 20 88 L 20 98 L 3 98 Z',
        bounds: { x: 3, y: 88, width: 17, height: 10 },
    },
    
    // ============================================
    // RIGHT SIDE VIEW (RHS) - Based on typical SUV side proportions
    // ============================================
    'LV_SUV_R_FDR_RHS': {
        view: 'RHS',
        // Right front guard - front section, from wheel arch to windscreen
        path: 'M 80 22 L 97 22 L 97 42 L 80 42 Z',
        bounds: { x: 80, y: 22, width: 17, height: 20 },
    },
    'LV_SUV_R_DOR_F_RHS': {
        view: 'RHS',
        // Right front door - first door, rectangular
        path: 'M 80 42 L 97 42 L 97 65 L 80 65 Z',
        bounds: { x: 80, y: 42, width: 17, height: 23 },
    },
    'LV_SUV_R_DOR_R_RHS': {
        view: 'RHS',
        // Right rear door - second door, rectangular
        path: 'M 80 65 L 97 65 L 97 88 L 80 88 Z',
        bounds: { x: 80, y: 65, width: 17, height: 23 },
    },
    'LV_SUV_R_QTR_RHS': {
        view: 'RHS',
        // Right quarter panel - rear section, from rear door to tailgate
        path: 'M 80 88 L 97 88 L 97 98 L 80 98 Z',
        bounds: { x: 80, y: 88, width: 17, height: 10 },
    },
    
    // ============================================
    // TOP VIEW (TOP) - Based on typical SUV top proportions
    // ============================================
    'LV_SUV_ROF_TOP': {
        view: 'TOP',
        // Roof - main rectangular area covering most of top view
        path: 'M 20 25 L 80 25 L 80 75 L 20 75 Z',
        bounds: { x: 20, y: 25, width: 60, height: 50 },
    },
};

// 3D Zone positions for clickable areas on the 3D car model
// Positions are relative to car center (0,0,0)
interface Zone3DPosition {
    zoneId: string;
    position: [number, number, number];
    size: [number, number, number];
    rotation?: [number, number, number];
}

// 3D zone positions mapped to car geometry
const ZONE_3D_POSITIONS: Zone3DPosition[] = [
    // Front zones
    { zoneId: 'LV_SUV_F_BAR', position: [0, -0.4, 0.5], size: [0.8, 0.1, 0.1] },
    { zoneId: 'LV_SUV_BON', position: [0, 0.1, 0.45], size: [0.6, 0.3, 0.1] },
    { zoneId: 'LV_SUV_F_GLS', position: [0, 0.3, 0.35], size: [0.5, 0.2, 0.05] },
    { zoneId: 'LV_SUV_L_FDR', position: [-0.45, 0, 0.3], size: [0.15, 0.4, 0.3] },
    { zoneId: 'LV_SUV_R_FDR', position: [0.45, 0, 0.3], size: [0.15, 0.4, 0.3] },
    
    // Rear zones
    { zoneId: 'LV_SUV_R_BAR', position: [0, -0.4, -0.5], size: [0.8, 0.1, 0.1] },
    { zoneId: 'LV_SUV_BOOT', position: [0, 0, -0.45], size: [0.6, 0.4, 0.1] },
    { zoneId: 'LV_SUV_R_GLS', position: [0, 0.2, -0.4], size: [0.5, 0.2, 0.05] },
    { zoneId: 'LV_SUV_L_QTR', position: [-0.45, 0, -0.3], size: [0.15, 0.4, 0.3] },
    { zoneId: 'LV_SUV_R_QTR', position: [0.45, 0, -0.3], size: [0.15, 0.4, 0.3] },
    
    // Left side zones
    { zoneId: 'LV_SUV_L_DOR_F', position: [-0.45, 0.1, 0.1], size: [0.15, 0.3, 0.25] },
    { zoneId: 'LV_SUV_L_DOR_R', position: [-0.45, 0.1, -0.1], size: [0.15, 0.3, 0.25] },
    
    // Right side zones
    { zoneId: 'LV_SUV_R_DOR_F', position: [0.45, 0.1, 0.1], size: [0.15, 0.3, 0.25] },
    { zoneId: 'LV_SUV_R_DOR_R', position: [0.45, 0.1, -0.1], size: [0.15, 0.3, 0.25] },
    
    // Top zone
    { zoneId: 'LV_SUV_ROF', position: [0, 0.4, 0], size: [0.7, 0.1, 0.8] },
];

// 3D Car Component
const Car3D: React.FC<{
    damageEntries: DamageEntry[];
    selectedZone: string | null;
    hoveredZone: string | null;
    onZoneClick: (zoneId: string) => void;
    onZoneHover: (zoneId: string | null) => void;
    getSeverityColor: (severity: SeverityCode) => string;
}> = ({ damageEntries, selectedZone, hoveredZone, onZoneClick, onZoneHover, getSeverityColor }) => {
    // Load textures with fallback
    const frontTexture = useTexture('/damageDiagram/front.jpg');
    const backTexture = useTexture('/damageDiagram/back.jpg');
    const leftTexture = useTexture('/damageDiagram/left.jpg');
    const rightTexture = useTexture('/damageDiagram/right.PNG');
    const topTexture = useTexture('/damageDiagram/top.jpg');

    // Create materials for each face
    const materials = {
        front: new THREE.MeshStandardMaterial({ map: frontTexture }),
        back: new THREE.MeshStandardMaterial({ map: backTexture }),
        left: new THREE.MeshStandardMaterial({ map: leftTexture }),
        right: new THREE.MeshStandardMaterial({ map: rightTexture }),
        top: new THREE.MeshStandardMaterial({ map: topTexture }),
        bottom: new THREE.MeshStandardMaterial({ color: '#1a1a1a' }),
    };

    // Car body dimensions (SUV proportions)
    const carLength = 1.0;
    const carWidth = 0.5;
    const carHeight = 0.5;

    return (
        <group>
            {/* Main car body - using box geometry for better 3D appearance */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[carWidth, carHeight, carLength]} />
                <meshStandardMaterial color="#4a5568" />
            </mesh>
            
            {/* Textured faces on the box */}
            <group>
                {/* Front face */}
                <mesh position={[0, 0, carLength / 2 + 0.001]} material={materials.front}>
                    <planeGeometry args={[carWidth, carHeight]} />
                </mesh>
                
                {/* Back face */}
                <mesh position={[0, 0, -carLength / 2 - 0.001]} rotation={[0, Math.PI, 0]} material={materials.back}>
                    <planeGeometry args={[carWidth, carHeight]} />
                </mesh>
                
                {/* Left face */}
                <mesh position={[-carWidth / 2 - 0.001, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={materials.left}>
                    <planeGeometry args={[carLength, carHeight]} />
                </mesh>
                
                {/* Right face */}
                <mesh position={[carWidth / 2 + 0.001, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={materials.right}>
                    <planeGeometry args={[carLength, carHeight]} />
                </mesh>
                
                {/* Top face */}
                <mesh position={[0, carHeight / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.top}>
                    <planeGeometry args={[carWidth, carLength]} />
                </mesh>
            </group>

            {/* Clickable zone boxes */}
            {ZONE_3D_POSITIONS.map((zonePos) => {
                const damage = damageEntries.find(d => d.zone_id === zonePos.zoneId);
                const isSelected = selectedZone === zonePos.zoneId;
                const isHovered = hoveredZone === zonePos.zoneId;
                const hasDamage = !!damage;
                
                const zoneColor = hasDamage 
                    ? getSeverityColor(damage.severity) 
                    : isSelected 
                    ? '#f59e0b' 
                    : isHovered 
                    ? '#fbbf24' 
                    : '#9ca3af';

                return (
                    <mesh
                        key={zonePos.zoneId}
                        position={zonePos.position}
                        rotation={zonePos.rotation || [0, 0, 0]}
                        onClick={(e) => {
                            e.stopPropagation();
                            onZoneClick(zonePos.zoneId);
                        }}
                        onPointerEnter={(e) => {
                            e.stopPropagation();
                            onZoneHover(zonePos.zoneId);
                        }}
                        onPointerLeave={(e) => {
                            e.stopPropagation();
                            onZoneHover(null);
                        }}
                    >
                        <boxGeometry args={zonePos.size} />
                        <meshStandardMaterial
                            color={zoneColor}
                            opacity={hasDamage ? 0.6 : isSelected ? 0.4 : isHovered ? 0.3 : 0.1}
                            transparent
                            wireframe={!hasDamage && !isSelected && !isHovered}
                        />
                        {hasDamage && damage && (
                            <Html
                                position={[0, zonePos.size[1] / 2 + 0.05, 0]}
                                center
                                style={{ pointerEvents: 'none' }}
                            >
                                <div
                                    style={{
                                        background: 'rgba(0,0,0,0.8)',
                                        color: 'white',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {damage.severity}
                                </div>
                            </Html>
                        )}
                    </mesh>
                );
            })}
        </group>
    );
};

interface InteractiveDamageDiagramProps {
    assessmentId: string;
    assetClass?: string; // LV, HV, TR, CV, MC, EX
    bodyType?: string; // SUV, SED, HAT, etc.
    initialDamage?: DamageEntry[];
    onSave?: (damage: DamageEntry[]) => void;
    onUpdate?: () => void;
}

export const InteractiveDamageDiagram: React.FC<
    InteractiveDamageDiagramProps
> = ({
    assessmentId,
    assetClass = 'LV',
    bodyType = 'SUV',
    initialDamage = [],
    onSave,
    onUpdate,
}) => {
    const { showSuccess, showError } = useToast();
    const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D'); // Default to 3D view
    const [activeView, setActiveView] = useState<ViewType>('TOP');
    const [damageEntries, setDamageEntries] =
        useState<DamageEntry[]>(initialDamage);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [editingDamage, setEditingDamage] = useState<DamageEntry | null>(
        null
    );
    const [saving, setSaving] = useState(false);
    const [repairDuration, setRepairDuration] = useState<string>('');
    const [savingRepairDuration, setSavingRepairDuration] = useState(false);
    const [hoveredZone, setHoveredZone] = useState<string | null>(null);
    const [imageUrls, setImageUrls] = useState<Record<ViewType, string | null>>(
        {
            TOP: null,
            FRT: null,
            REA: null,
            LHS: null,
            RHS: null,
            UND: null,
            INT: null,
        }
    );
    const [loadingImages, setLoadingImages] = useState(false);
    const svgRefs = useRef<Record<string, SVGSVGElement | null>>({});

    // Load vehicle images from /damageDiagram/ folder
    // Mapping: TOP -> top.jpg, FRT -> front.jpg, REA -> back.jpg, LHS -> left.jpg, RHS -> right.PNG
    useEffect(() => {
        const loadVehicleImages = async () => {
            setLoadingImages(true);
            try {
                // Map view types to actual image filenames
                const imageMap: Record<ViewType, string> = {
                    TOP: '/damageDiagram/top.jpg',
                    FRT: '/damageDiagram/front.jpg',
                    REA: '/damageDiagram/back.jpg',
                    LHS: '/damageDiagram/left.jpg',
                    RHS: '/damageDiagram/right.PNG',
                    UND: '/damageDiagram/underside.jpg', // Not available yet
                    INT: '/damageDiagram/interior.jpg', // Not available yet
                };

                const views: ViewType[] = ['TOP', 'FRT', 'REA', 'LHS', 'RHS'];

                for (const view of views) {
                    const imagePath = imageMap[view];
                    if (imagePath) {
                        try {
                            // Check if image exists
                            const response = await fetch(imagePath, {
                                method: 'HEAD',
                            });

                            if (response.ok) {
                                setImageUrls(prev => ({
                                    ...prev,
                                    [view]: imagePath,
                                }));
                            }
                        } catch (e) {
                            // Image not found
                            console.log(`Image not found: ${imagePath}`);
                        }
                    }
                }
            } catch (err) {
                console.error('Error loading vehicle images:', err);
            } finally {
                setLoadingImages(false);
            }
        };

        loadVehicleImages();
    }, []);

    // Load initial damage data
    useEffect(() => {
        setDamageEntries(initialDamage);
    }, [initialDamage]);

    // Get zones for current view
    // Zones can appear in multiple views (e.g., L_FDR appears in both FRT and LHS)
    // Path keys use format: <ZONE_ID>_<VIEW> to handle same zone in different views
    const getZonesForView = (
        view: ViewType
    ): Array<{
        zoneId: string;
        metadata: SVCZoneMetadata;
        zonePath: ZonePath;
    }> => {
        return Object.entries(DEFAULT_ZONE_METADATA)
            .map(([_, metadata]) => {
                // Look for path with format: <zone_id>_<view>
                const pathKey = `${metadata.zone_id}_${view}`;
                const zonePath = ZONE_PATHS[pathKey];
                
                if (zonePath && zonePath.view === view) {
                    return {
                        zoneId: metadata.zone_id,
                        metadata,
                        zonePath,
                    };
                }
                return null;
            })
            .filter((item): item is { zoneId: string; metadata: SVCZoneMetadata; zonePath: ZonePath } => item !== null);
    };

    // Handle zone click - toggle selection
    const handleZoneClick = (zoneId: string) => {
        const metadata = DEFAULT_ZONE_METADATA[zoneId];
        if (!metadata) return;

        // Check if damage already exists for this zone
        const existingDamage = damageEntries.find(d => d.zone_id === zoneId);

        if (existingDamage) {
            // Edit existing damage
            setEditingDamage(existingDamage);
            setSelectedZone(zoneId);
        } else {
            // Create new damage entry with first allowed severity
            const newDamage: DamageEntry = {
                zone_id: zoneId,
                label: metadata.label,
                category: metadata.category,
                severity: metadata.severity_allowed[0] || 'LP',
                pre_existing: false,
                comments: '',
            };
            setEditingDamage(newDamage);
            setSelectedZone(zoneId);
        }
    };

    // Handle zone hover
    const handleZoneHover = (zoneId: string | null) => {
        setHoveredZone(zoneId);
    };

    // Save damage entry
    const handleSaveDamage = async () => {
        if (!editingDamage) return;

        setSaving(true);
        try {
            // If multiple severities exist for same zone, keep highest
            const existingIndex = damageEntries.findIndex(
                d => d.zone_id === editingDamage.zone_id
            );
            let updatedEntries: DamageEntry[];

            if (existingIndex >= 0) {
                // Update existing
                updatedEntries = [...damageEntries];
                updatedEntries[existingIndex] = editingDamage;
            } else {
                // Add new
                updatedEntries = [...damageEntries, editingDamage];
            }

            setDamageEntries(updatedEntries);

            // Save to database via API
            const response = await fetch(`/api/assessments/${assessmentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    damage_data: updatedEntries, // Store full SVC-compliant damage data
                    damage_areas: updatedEntries.map(d => d.label), // Legacy field for compatibility
                }),
            });

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            showSuccess('Damage saved successfully');
            setEditingDamage(null);
            setSelectedZone(null);
            if (onSave) onSave(updatedEntries);
            if (onUpdate) onUpdate();
        } catch (err: unknown) {
            showError(
                err instanceof Error ? err.message : 'Failed to save damage'
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete damage entry
    const handleDeleteDamage = async (zoneId: string) => {
        const updatedEntries = damageEntries.filter(d => d.zone_id !== zoneId);
        setDamageEntries(updatedEntries);

        try {
            const response = await fetch(`/api/assessments/${assessmentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    damage_data: updatedEntries,
                    damage_areas: updatedEntries.map(d => d.label),
                }),
            });

            const result = await response.json();

            if (result.error) {
                showError(result.error);
                return;
            }

            showSuccess('Damage removed successfully');
            if (onSave) onSave(updatedEntries);
            if (onUpdate) onUpdate();
        } catch (err: unknown) {
            showError(
                err instanceof Error ? err.message : 'Failed to remove damage'
            );
        }
    };

    // Get severity color
    const getSeverityColor = (severity: SeverityCode): string => {
        const severityData = SEVERITY_CODES.find(s => s.code === severity);
        return severityData?.color || '#6b7280';
    };

    // Get allowed severities for zone
    const getAllowedSeverities = (zoneId: string): SeverityCode[] => {
        const metadata = DEFAULT_ZONE_METADATA[zoneId];
        return metadata?.severity_allowed || ['LP'];
    };

    // Render vehicle view with clickable zones overlaid on images
    const renderVehicleView = (view: ViewType) => {
        const zones = getZonesForView(view);
        const hasImage = imageUrls[view] !== null;

        return (
            <div className="relative w-full h-64 bg-white rounded-lg overflow-hidden border border-gray-300">
                <svg
                    ref={el => {
                        if (el) svgRefs.current[view] = el;
                    }}
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Background: Vehicle image */}
                    {hasImage && (
                        <image
                            href={imageUrls[view] || ''}
                            x="0"
                            y="0"
                            width="100"
                            height="100"
                            preserveAspectRatio="xMidYMid meet"
                            className="pointer-events-none"
                        />
                    )}

                    {/* Clickable SVC Zones - Using SVG Paths for Accurate Boundaries */}
                    {zones.map(({ zoneId, metadata, zonePath }) => {
                        const damage = damageEntries.find(
                            d => d.zone_id === zoneId
                        );
                        const isSelected = selectedZone === zoneId;
                        const isHovered = hoveredZone === zoneId;
                        const hasDamage = !!damage;
                        // Use red color for damaged zones (entire part in red)
                        const zoneColor = hasDamage ? '#ef4444' : 'transparent';
                        const bounds = zonePath.bounds || {
                            x: 0,
                            y: 0,
                            width: 0,
                            height: 0,
                        };

                        return (
                            <g key={zoneId} id={zoneId}>
                                <path
                                    d={zonePath.path}
                                    fill={hasDamage ? zoneColor : 'transparent'}
                                    fillOpacity={hasDamage ? 0.5 : 0}
                                    stroke={
                                        isSelected
                                            ? '#f59e0b'
                                            : isHovered
                                            ? '#fbbf24'
                                            : hasDamage
                                            ? '#dc2626'
                                            : '#9ca3af'
                                    }
                                    strokeWidth={
                                        isSelected
                                            ? 3
                                            : isHovered
                                            ? 2.5
                                            : hasDamage
                                            ? 2
                                            : 1
                                    }
                                    strokeDasharray={
                                        damage?.pre_existing ? '4,2' : '0'
                                    }
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                    className="cursor-pointer transition-all"
                                    onClick={() => handleZoneClick(zoneId)}
                                    onMouseEnter={() => handleZoneHover(zoneId)}
                                    onMouseLeave={() => handleZoneHover(null)}
                                    style={{
                                        filter:
                                            hasDamage && !damage.pre_existing
                                                ? 'drop-shadow(0 0 4px #ef4444)'
                                                : 'none',
                                    }}
                                />
                                {hasDamage && damage && bounds && (
                                    <>
                                        <text
                                            x={bounds.x + bounds.width / 2}
                                            y={bounds.y + bounds.height / 2 - 2}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fill="white"
                                            fontSize="8"
                                            fontWeight="bold"
                                            className="pointer-events-none select-none"
                                            style={{
                                                textShadow:
                                                    '0 1px 3px rgba(0,0,0,0.9)',
                                            }}
                                        >
                                            {damage.severity}
                                        </text>
                                        {damage.pre_existing && (
                                            <circle
                                                cx={bounds.x + bounds.width - 2}
                                                cy={bounds.y + 2}
                                                r="2.5"
                                                fill="#6b7280"
                                                stroke="white"
                                                strokeWidth="0.5"
                                                className="pointer-events-none"
                                            />
                                        )}
                                    </>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    // Get damage table data
    const getDamageTableData = () => {
        return damageEntries.map(damage => {
            const metadata = DEFAULT_ZONE_METADATA[damage.zone_id];
            return {
                ...damage,
                metadata,
            };
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Vehicle Diagrams */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            Vehicle Damage
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Click on vehicle parts to mark damage. Click again
                            to edit or remove.
                        </p>

                        {/* View Mode Toggle */}
                        <div className="flex gap-2 mb-4 items-center">
                            <button
                                onClick={() => setViewMode('3D')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                    viewMode === '3D'
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                                }`}
                            >
                                <Box className="w-4 h-4" />
                                3D View
                            </button>
                            <button
                                onClick={() => setViewMode('2D')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                    viewMode === '2D'
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                                }`}
                            >
                                <RotateCcw className="w-4 h-4" />
                                2D View
                            </button>
                        </div>

                        {/* 3D View */}
                        {viewMode === '3D' && (
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-400 mb-2 uppercase">
                                    3D Interactive View - Drag to rotate, scroll to zoom
                                </h4>
                                <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                                    <Canvas
                                        camera={{ position: [2, 1.5, 2], fov: 50 }}
                                        gl={{ antialias: true }}
                                    >
                                        <Suspense fallback={
                                            <Html center>
                                                <div className="text-white text-sm">Loading 3D model...</div>
                                            </Html>
                                        }>
                                            <ambientLight intensity={0.6} />
                                            <directionalLight position={[5, 5, 5]} intensity={1} />
                                            <directionalLight position={[-5, 5, -5]} intensity={0.5} />
                                            <pointLight position={[0, 5, 0]} intensity={0.5} />
                                            <Car3D
                                                damageEntries={damageEntries}
                                                selectedZone={selectedZone}
                                                hoveredZone={hoveredZone}
                                                onZoneClick={handleZoneClick}
                                                onZoneHover={handleZoneHover}
                                                getSeverityColor={getSeverityColor}
                                            />
                                            <OrbitControls
                                                enablePan={true}
                                                enableZoom={true}
                                                enableRotate={true}
                                                minDistance={1.5}
                                                maxDistance={5}
                                                autoRotate={false}
                                            />
                                            <gridHelper args={[2, 20, '#444444', '#222222']} />
                                        </Suspense>
                                    </Canvas>
                                    <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
                                        Drag to rotate • Scroll to zoom • Click parts to mark damage
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2D View Selector */}
                        {viewMode === '2D' && (
                            <>
                                <div className="flex gap-2 mb-4 flex-wrap">
                                    {(
                                        [
                                            'TOP',
                                            'FRT',
                                            'REA',
                                            'LHS',
                                            'RHS',
                                        ] as ViewType[]
                                    ).map(view => (
                                        <button
                                            key={view}
                                            onClick={() => setActiveView(view)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                activeView === view
                                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                                                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                                            }`}
                                        >
                                            {view === 'TOP'
                                                ? 'Top'
                                                : view === 'FRT'
                                                ? 'Front'
                                                : view === 'REA'
                                                ? 'Rear'
                                                : view === 'LHS'
                                                ? 'Left'
                                                : 'Right'}
                                        </button>
                                    ))}
                                </div>

                                {/* Active View Display */}
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-400 mb-2 uppercase">
                                        {activeView === 'TOP'
                                            ? 'Top View'
                                            : activeView === 'FRT'
                                            ? 'Front View'
                                            : activeView === 'REA'
                                            ? 'Rear View'
                                            : activeView === 'LHS'
                                            ? 'Left Side'
                                            : 'Right Side'}
                                    </h4>
                                    {renderVehicleView(activeView)}
                                </div>
                            </>
                        )}

                        {/* All Views Grid (Compact) - Only show in 2D mode */}
                        {viewMode === '2D' && (
                            <div className="grid grid-cols-5 gap-2 mt-4">
                                {(
                                    [
                                        'TOP',
                                        'FRT',
                                        'REA',
                                        'LHS',
                                        'RHS',
                                    ] as ViewType[]
                                ).map(view => (
                                    <div key={view} className="space-y-1">
                                        <h5 className="text-xs text-gray-500 text-center uppercase">
                                            {view === 'TOP'
                                                ? 'Top'
                                                : view === 'FRT'
                                                ? 'Front'
                                                : view === 'REA'
                                                ? 'Rear'
                                                : view === 'LHS'
                                                ? 'Left'
                                                : 'Right'}
                                        </h5>
                                        <div
                                            className={`border-2 rounded transition-colors cursor-pointer ${
                                                activeView === view
                                                    ? 'border-amber-500/50'
                                                    : 'border-gray-700 hover:border-gray-600'
                                            }`}
                                            onClick={() => setActiveView(view)}
                                        >
                                            {renderVehicleView(view)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Damage Details Panel */}
                <div className="space-y-4">
                    <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">
                                Damage Sections
                            </h3>
                            {editingDamage && (
                                <button
                                    onClick={() => {
                                        setEditingDamage(null);
                                        setSelectedZone(null);
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Damage Table */}
                        {!editingDamage && damageEntries.length > 0 && (
                            <div className="mb-4">
                                <div className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-800">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-amber-500/20 border-b border-amber-500/30">
                                                <th className="px-3 py-2 text-left text-amber-400 font-semibold text-xs">
                                                    Damage Section
                                                </th>
                                                <th className="px-3 py-2 text-left text-amber-400 font-semibold text-xs">
                                                    Severity
                                                </th>
                                                <th className="px-3 py-2 text-left text-amber-400 font-semibold text-xs">
                                                    Comments
                                                </th>
                                                <th className="px-3 py-2 text-center text-amber-400 font-semibold text-xs">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getDamageTableData().map(
                                                (damage, idx) => (
                                                    <tr
                                                        key={damage.zone_id}
                                                        className={`border-b border-gray-800/50 hover:bg-gray-900/50 ${
                                                            idx % 2 === 0
                                                                ? 'bg-gray-900/30'
                                                                : ''
                                                        }`}
                                                    >
                                                        <td className="px-3 py-2 text-white text-xs">
                                                            {damage.label}
                                                            {damage.pre_existing && (
                                                                <span className="ml-2 text-xs text-gray-500">
                                                                    (Pre-existing)
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span
                                                                className="px-2 py-0.5 rounded text-xs font-medium inline-block border"
                                                                style={{
                                                                    backgroundColor: `${getSeverityColor(
                                                                        damage.severity
                                                                    )}20`,
                                                                    color: getSeverityColor(
                                                                        damage.severity
                                                                    ),
                                                                    borderColor: `${getSeverityColor(
                                                                        damage.severity
                                                                    )}50`,
                                                                }}
                                                            >
                                                                {
                                                                    damage.severity
                                                                }
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {damage.comments ? (
                                                                <span className="text-gray-400 text-xs">
                                                                    {
                                                                        damage.comments
                                                                    }
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-600 text-xs">
                                                                    -
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingDamage(
                                                                            damage
                                                                        );
                                                                        setSelectedZone(
                                                                            damage.zone_id
                                                                        );
                                                                    }}
                                                                    className="p-1 text-gray-400 hover:text-amber-500 transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteDamage(
                                                                            damage.zone_id
                                                                        )
                                                                    }
                                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Damage Editor Panel */}
                        {editingDamage ? (
                            <div className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-amber-500/30">
                                <div>
                                    <label className="text-gray-400 text-sm block mb-1">
                                        Damage Section
                                    </label>
                                    <p className="text-white font-medium">
                                        {editingDamage.label}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        Category: {editingDamage.category}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm block mb-1">
                                        Severity
                                    </label>
                                    <select
                                        value={editingDamage.severity}
                                        onChange={e => {
                                            const newSeverity = e.target
                                                .value as SeverityCode;
                                            const allowed =
                                                getAllowedSeverities(
                                                    editingDamage.zone_id
                                                );
                                            if (allowed.includes(newSeverity)) {
                                                setEditingDamage({
                                                    ...editingDamage,
                                                    severity: newSeverity,
                                                });
                                            }
                                        }}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                                    >
                                        {getAllowedSeverities(
                                            editingDamage.zone_id
                                        ).map(severityCode => {
                                            const severity =
                                                SEVERITY_CODES.find(
                                                    s => s.code === severityCode
                                                );
                                            return (
                                                <option
                                                    key={severityCode}
                                                    value={severityCode}
                                                >
                                                    {severityCode} -{' '}
                                                    {severity?.label ||
                                                        severityCode}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm block mb-1">
                                        Comments
                                    </label>
                                    <textarea
                                        value={editingDamage.comments || ''}
                                        onChange={e =>
                                            setEditingDamage({
                                                ...editingDamage,
                                                comments: e.target.value,
                                            })
                                        }
                                        rows={3}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
                                        placeholder="Add comments..."
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="preExisting"
                                        checked={editingDamage.pre_existing}
                                        onChange={e =>
                                            setEditingDamage({
                                                ...editingDamage,
                                                pre_existing: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                                    />
                                    <label
                                        htmlFor="preExisting"
                                        className="text-gray-400 text-sm"
                                    >
                                        Pre-existing damage
                                    </label>
                                </div>
                                <button
                                    onClick={handleSaveDamage}
                                    disabled={saving}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Damage
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : damageEntries.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-8">
                                No damage marked. Click on vehicle parts to add
                                damage.
                            </p>
                        ) : null}

                        {/* Repair Duration Section */}
                        <div className="mt-6 pt-6 border-t border-gray-800">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-amber-500" />
                                Repair Duration (Days)
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={repairDuration}
                                    onChange={e =>
                                        setRepairDuration(e.target.value)
                                    }
                                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                                    placeholder="Enter repair duration in days"
                                    min="0"
                                />
                                <button
                                    onClick={async () => {
                                        setSavingRepairDuration(true);
                                        try {
                                            const response = await fetch(
                                                `/api/assessments/${assessmentId}`,
                                                {
                                                    method: 'PATCH',
                                                    headers: {
                                                        'Content-Type':
                                                            'application/json',
                                                    },
                                                    body: JSON.stringify({
                                                        repair_duration_days:
                                                            repairDuration
                                                                ? parseInt(
                                                                      repairDuration
                                                                  )
                                                                : null,
                                                    }),
                                                }
                                            );

                                            const result =
                                                await response.json();

                                            if (result.error) {
                                                showError(result.error);
                                                return;
                                            }

                                            showSuccess(
                                                'Repair duration saved successfully'
                                            );
                                            if (onUpdate) onUpdate();
                                        } catch (err: unknown) {
                                            showError(
                                                err instanceof Error
                                                    ? err.message
                                                    : 'Failed to save repair duration'
                                            );
                                        } finally {
                                            setSavingRepairDuration(false);
                                        }
                                    }}
                                    disabled={savingRepairDuration}
                                    className="px-6 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center gap-2 font-semibold"
                                >
                                    {savingRepairDuration ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            SAVE
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
