
export class ImageOptimizer {
    /**
     * Resizes and compresses an image file.
     * Smart Strategy:
     * - PNGs: Preserves Alpha Channel (Transparency) but resizes to max dimension.
     * - JPEGs/Others: Converts to JPEG 80% for storage efficiency.
     */
    static async optimize(file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<string> {
        return new Promise((resolve, reject) => {
            const isPng = file.type === 'image/png';
            const outputType = isPng ? 'image/png' : 'image/jpeg';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth || height > maxWidth) {
                        const ratio = Math.min(maxWidth / width, maxWidth / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error("Canvas context failed"));

                    // Only fill white background if we are forcing JPEG (which doesn't support transparency)
                    // If PNG, we leave it transparent.
                    if (!isPng) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, width, height);
                    } else {
                        ctx.clearRect(0, 0, width, height);
                    }
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL(outputType, quality));
                };
                img.onerror = () => reject(new Error("Image load error"));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error("File read error"));
            reader.readAsDataURL(file);
        });
    }
}
