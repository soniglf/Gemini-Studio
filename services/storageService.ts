import { db } from './db';
import { GeneratedAsset, GenerationTier } from '../types';

export class StorageService {
    
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

    static async optimizeStorage(aggressive: boolean = false, onProgress?: (p: number) => void): Promise<number> {
        const allAssets = await db.assets.getAll();
        let freedBytes = 0;
        let processed = 0;

        for (const asset of allAssets) {
            processed++;
            if (onProgress) onProgress((processed / allAssets.length) * 100);

            if (asset.type === 'VIDEO' || asset.isCompressed || !asset.blob) continue;

            const isSketch = asset.tier === GenerationTier.SKETCH;
            
            if (isSketch || aggressive) {
                const originalSize = asset.blob.size;
                
                try {
                    const compressedBlob = await this.compressBlob(asset.blob, 0.8);
                    const newSize = compressedBlob.size;

                    if (newSize < originalSize) {
                        const updatedAsset: GeneratedAsset = {
                            ...asset,
                            blob: compressedBlob,
                            isCompressed: true,
                        };
                        
                        await db.assets.add(updatedAsset);
                        freedBytes += (originalSize - newSize);
                    }
                } catch (e) {
                    console.debug(`Skipped asset ${asset.id} compression`, e);
                }
            }
        }
        
        return freedBytes;
    }
}