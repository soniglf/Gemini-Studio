
import { db } from './db';
import { GeneratedAsset, GenerationTier } from '../types';

export class StorageService {
    
    /**
     * Estimates current storage usage and quota.
     */
    static async estimate(): Promise<{ usage: number, quota: number }> {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage || 0,
                quota: estimate.quota || 0
            };
        }
        return { usage: 0, quota: 0 };
    }

    /**
     * Converts a Blob to JPEG with specified quality.
     */
    private static async compressBlob(blob: Blob, quality: number = 0.8): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if(!ctx) { 
                        URL.revokeObjectURL(url);
                        reject(new Error("Canvas Context Failed")); 
                        return; 
                    }
                    
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((b) => {
                        URL.revokeObjectURL(url);
                        if(b) resolve(b);
                        else reject(new Error("Compression Failed"));
                    }, 'image/jpeg', quality);
                } catch (e) {
                    URL.revokeObjectURL(url);
                    reject(e);
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("Image Load Failed"));
            };
            img.src = url;
        });
    }

    /**
     * Smart Archival Strategy:
     * 1. Prioritize compressing SKETCH tier assets (Drafts).
     * 2. Only compress RENDER tier if 'aggressive' mode is on.
     */
    static async optimizeStorage(aggressive: boolean = false): Promise<number> {
        const allAssets = await db.assets.getAll();
        let freedBytes = 0;

        for (const asset of allAssets) {
            // Skip Videos and already compressed items
            if (asset.type === 'VIDEO' || asset.isCompressed || !asset.blob) continue;

            const isSketch = asset.tier === GenerationTier.SKETCH;
            
            // Policy: Always compress Sketches. Only compress Renders if Aggressive.
            if (isSketch || aggressive) {
                const originalSize = asset.blob.size;
                
                try {
                    // Compress to JPEG 80%
                    const compressedBlob = await this.compressBlob(asset.blob, 0.8);
                    const newSize = compressedBlob.size;

                    if (newSize < originalSize) {
                        const updatedAsset: GeneratedAsset = {
                            ...asset,
                            blob: compressedBlob,
                            isCompressed: true,
                        };
                        
                        // We must strip the URL before saving to DB as per repo pattern
                        await db.assets.add(updatedAsset);
                        freedBytes += (originalSize - newSize);
                    }
                } catch (e) {
                    // Fail silently but log, continue to next asset
                    console.debug(`Skipped asset ${asset.id} compression`, e);
                }
            }
        }
        
        return freedBytes;
    }
}
