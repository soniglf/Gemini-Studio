
import { create } from 'zustand';
import { CanvasItemState, CanvasView, GeneratedAsset, CanvasLink, NodeType, ModifierType } from '../types';
import { useGalleryStore } from './galleryStore';

interface CanvasState {
    items: Record<string, CanvasItemState>;
    links: CanvasLink[];
    view: CanvasView;
    snapEnabled: boolean;
    selectedIds: Set<string>;
    history: { items: Record<string, CanvasItemState>, links: CanvasLink[] }[];
    
    // Linking Interaction State
    isLinking: { fromId: string, startX: number, startY: number } | null;
    tempLinkEnd: { x: number, y: number } | null;

    initializeBoard: (assets: GeneratedAsset[]) => void;
    updateItemPosition: (id: string, x: number, y: number) => void; // Replaces relative moveItem for smoother absolute drag
    panView: (dx: number, dy: number) => void;
    zoomView: (delta: number) => void;
    toggleSnap: () => void;
    undo: () => void;
    redo: () => void;
    selectItem: (id: string, multi?: boolean) => void;
    clearSelection: () => void;
    
    // Synapse II Actions
    addModifierNode: (type: ModifierType) => void;
    addPendingNode: (id: string) => void;
    removePendingNode: (id: string) => void;
    replaceNode: (oldId: string, newAssetId: string) => void;
    updateModifierData: (id: string, data: Partial<CanvasItemState['modifierData']>) => void;
    
    startLinking: (fromId: string, startX: number, startY: number) => void;
    updateTempLink: (x: number, y: number) => void;
    cancelLinking: () => void;
    completeLinking: (toId: string) => void;
    addLink: (fromId: string, toId: string) => void;
    removeLink: (linkId: string) => void;
}

const GRID_SIZE = 20;
const DEFAULT_ASSET_SIZE = 250;
const DEFAULT_MODIFIER_SIZE = 220;

export const useCanvasStore = create<CanvasState>((set, get) => ({
    items: {},
    links: [],
    view: { x: 0, y: 0, scale: 1 },
    snapEnabled: true,
    selectedIds: new Set<string>(),
    history: [],
    isLinking: null,
    tempLinkEnd: null,

    initializeBoard: (assets) => {
        const currentItems = get().items;
        const newItems: Record<string, CanvasItemState> = {};
        const assetIdsOnBoard = new Set(Object.values(currentItems).map((item: CanvasItemState) => item.assetId));
        let hasChanges = false;
        
        let cx = 100;
        let cy = 100;

        assets.forEach(asset => {
            if (!assetIdsOnBoard.has(asset.id)) {
                const id = `node-${asset.id}`;
                newItems[id] = {
                    id,
                    nodeType: NodeType.ASSET,
                    assetId: asset.id,
                    x: cx, y: cy,
                    width: DEFAULT_ASSET_SIZE, height: DEFAULT_ASSET_SIZE + 40,
                    zIndex: 1
                };
                cx += 280;
                if (cx > 1000) { cx = 100; cy += 320; }
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            set(state => ({ items: { ...state.items, ...newItems }}));
        }
    },

    updateItemPosition: (id, x, y) => {
        const { snapEnabled } = get();
        let newX = x;
        let newY = y;

        if (snapEnabled) {
            newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        }

        set(state => ({
            items: { ...state.items, [id]: { ...state.items[id], x: newX, y: newY, zIndex: 100 } }
        }));
    },
    
    panView: (dx, dy) => set(state => ({ view: { ...state.view, x: state.view.x + dx, y: state.view.y + dy } })),
    
    zoomView: (delta) => set(state => ({ view: { ...state.view, scale: Math.max(0.2, Math.min(3, state.view.scale + delta)) }})),
    
    toggleSnap: () => set(state => ({ snapEnabled: !state.snapEnabled })),
    
    undo: () => {}, // Placeholder
    redo: () => {}, // Placeholder

    selectItem: (id, multi) => set(state => {
        if (multi) {
            const newSet = new Set(state.selectedIds);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return { selectedIds: newSet };
        }
        return { selectedIds: new Set([id]) };
    }),
    clearSelection: () => set({ selectedIds: new Set<string>() }),

    // --- NODE OPERATIONS ---

    addModifierNode: (type) => {
        const id = `mod-${Date.now()}`;
        const { view } = get();
        // Spawn at center of view (adjusted for scale/pan)
        const viewportCenterX = (-view.x + window.innerWidth / 2) / view.scale;
        const viewportCenterY = (-view.y + window.innerHeight / 2) / view.scale;

        const newItem: CanvasItemState = {
            id,
            nodeType: NodeType.MODIFIER,
            modifierType: type,
            modifierData: { prompt: "", referenceImage: null },
            x: Math.round(viewportCenterX / GRID_SIZE) * GRID_SIZE,
            y: Math.round(viewportCenterY / GRID_SIZE) * GRID_SIZE,
            width: DEFAULT_MODIFIER_SIZE, height: DEFAULT_MODIFIER_SIZE,
            zIndex: 10,
        };
        set(state => ({ items: { ...state.items, [id]: newItem }}));
    },

    addPendingNode: (id) => {
        const { view } = get();
        // Calculate center of the current viewport
        // view.x/y are negative offsets. We want to place node in the center of the visible area.
        // visible_center_x = (-view.x + container_width/2) / scale
        
        // Assuming a standard desktop container, or approximated logic
        const viewportCenterX = (-view.x + (window.innerWidth - 300) / 2) / view.scale; // Approx -300 for sidebar
        const viewportCenterY = (-view.y + window.innerHeight / 2) / view.scale;

        const newItem: CanvasItemState = {
            id, // We use the pending ID as the node ID initially
            nodeType: NodeType.PENDING,
            x: isNaN(viewportCenterX) ? 100 : viewportCenterX - (DEFAULT_ASSET_SIZE/2), 
            y: isNaN(viewportCenterY) ? 100 : viewportCenterY - (DEFAULT_ASSET_SIZE/2),
            width: DEFAULT_ASSET_SIZE, height: DEFAULT_ASSET_SIZE,
            zIndex: 50
        };
        set(state => ({ items: { ...state.items, [id]: newItem } }));
    },

    removePendingNode: (id) => set(state => {
        const newItems = { ...state.items };
        delete newItems[id];
        return { items: newItems };
    }),

    replaceNode: (oldId, newAssetId) => set(state => {
        const oldItem = state.items[oldId];
        if (!oldItem) return {};

        const newId = `node-${newAssetId}`;
        const newItems = { ...state.items };
        
        // Remove old item
        delete newItems[oldId];

        // Add new item at same position, upgraded to ASSET
        newItems[newId] = {
            ...oldItem,
            id: newId,
            nodeType: NodeType.ASSET,
            assetId: newAssetId,
            height: DEFAULT_ASSET_SIZE + 40 // Add space for footer
        };

        return { items: newItems };
    }),

    updateModifierData: (id, data) => set(state => {
        const item = state.items[id];
        if (item) {
            return {
                items: {
                    ...state.items,
                    [id]: { ...item, modifierData: { ...item.modifierData!, ...data } }
                }
            };
        }
        return {};
    }),

    // --- LINKING PHYSICS ---

    startLinking: (fromId, startX, startY) => set({ isLinking: { fromId, startX, startY }, tempLinkEnd: { x: startX, y: startY } }),
    
    updateTempLink: (x, y) => set({ tempLinkEnd: { x, y } }),
    
    cancelLinking: () => set({ isLinking: null, tempLinkEnd: null }),

    completeLinking: (toId) => {
        const { isLinking, links } = get();
        if (isLinking && isLinking.fromId !== toId) {
            // Prevent duplicate links and self-links
            const exists = links.some(l => 
                (l.fromId === isLinking.fromId && l.toId === toId) || 
                (l.fromId === toId && l.toId === isLinking.fromId)
            );
            
            if (!exists) {
                get().addLink(isLinking.fromId, toId);
            }
        }
        set({ isLinking: null, tempLinkEnd: null });
    },

    addLink: (fromId, toId) => {
        const id = `link-${Date.now()}`;
        set(state => ({ links: [...state.links, { id, fromId, toId }] }));
    },

    removeLink: (linkId) => set(state => ({ links: state.links.filter(l => l.id !== linkId) }))
}));
