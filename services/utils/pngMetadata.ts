
export class PngMetadataService {
    // Signature for PNG files
    private static PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    private static KEYWORD = "GeminiDNA";
    private static crcTable: number[] = [];

    // Initialize CRC Table once
    static {
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) {
                if (c & 1) c = 0xedb88320 ^ (c >>> 1);
                else c = c >>> 1;
            }
            this.crcTable[n] = c;
        }
    }

    private static crc32(buf: Uint8Array): number {
        let crc = 0xffffffff;
        for (let i = 0; i < buf.length; i++) {
            crc = this.crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
        }
        return crc ^ 0xffffffff;
    }

    static async injectMetadata(blob: Blob, metadata: any): Promise<Blob> {
        try {
            const buffer = await blob.arrayBuffer();
            const data = new Uint8Array(buffer);
            
            if (!this.isPng(data)) {
                console.warn("Not a PNG file, skipping metadata injection.");
                return blob;
            }

            // Create payload
            const jsonStr = JSON.stringify(metadata);
            const chunk = this.createChunk("tEXt", this.KEYWORD + "\0" + jsonStr);
            
            // Find IEND to insert before it
            const iendPos = this.findChunk(data, "IEND");
            if (iendPos === -1) return blob;

            const newData = new Uint8Array(data.length + chunk.length);
            newData.set(data.slice(0, iendPos), 0);
            newData.set(chunk, iendPos);
            newData.set(data.slice(iendPos), iendPos + chunk.length);

            return new Blob([newData], { type: "image/png" });
        } catch (e) {
            console.error("Failed to inject metadata", e);
            return blob;
        }
    }

    static async extractMetadata(file: File): Promise<any | null> {
        try {
            const buffer = await file.arrayBuffer();
            const data = new Uint8Array(buffer);
            
            if (!this.isPng(data)) return null;

            let offset = 8; // Skip signature
            while (offset < data.length) {
                // Prevent infinite loop on corrupt files
                if (offset + 8 > data.length) break;

                const length = this.readUint32(data, offset);
                const type = this.readString(data, offset + 4, 4);
                
                if (type === "tEXt") {
                    const content = this.readString(data, offset + 8, length);
                    const [key, value] = content.split("\0");
                    if (key === this.KEYWORD) {
                        try {
                            return JSON.parse(value);
                        } catch {
                            return null;
                        }
                    }
                }
                
                if (type === "IEND") break;
                
                // Length (4) + Type (4) + Data (length) + CRC (4)
                offset += length + 12;
            }
            return null;
        } catch (e) {
            console.error("Failed to extract metadata", e);
            return null;
        }
    }

    private static isPng(data: Uint8Array): boolean {
        if (data.length < 8) return false;
        for (let i = 0; i < 8; i++) {
            if (data[i] !== this.PNG_SIGNATURE[i]) return false;
        }
        return true;
    }

    private static createChunk(type: string, data: string): Uint8Array {
        const typeArr = this.stringToUint8(type);
        const dataArr = this.stringToUint8(data);
        const len = dataArr.length;
        
        // Structure: Length(4) + Type(4) + Data(len) + CRC(4)
        const chunk = new Uint8Array(4 + 4 + len + 4);
        
        // 1. Length
        this.writeUint32(chunk, 0, len);
        
        // 2. Type & 3. Data (These are used for CRC)
        chunk.set(typeArr, 4);
        chunk.set(dataArr, 8);
        
        // 4. Calculate CRC on [Type + Data]
        // Slice the buffer from index 4 to end-4 (excluding length and the crc slot itself)
        const crcInput = chunk.slice(4, 4 + 4 + len);
        const crc = this.crc32(crcInput);
        
        // 5. Write CRC
        this.writeUint32(chunk, 8 + len, crc);
        
        return chunk;
    }

    private static readUint32(data: Uint8Array, offset: number): number {
        return (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
    }

    private static writeUint32(data: Uint8Array, offset: number, value: number) {
        data[offset] = (value >>> 24) & 0xFF;
        data[offset + 1] = (value >>> 16) & 0xFF;
        data[offset + 2] = (value >>> 8) & 0xFF;
        data[offset + 3] = value & 0xFF;
    }

    private static stringToUint8(str: string): Uint8Array {
        const arr = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            arr[i] = str.charCodeAt(i);
        }
        return arr;
    }

    private static readString(data: Uint8Array, offset: number, length: number): string {
        let str = "";
        for (let i = 0; i < length; i++) {
            str += String.fromCharCode(data[offset + i]);
        }
        return str;
    }

    private static findChunk(data: Uint8Array, type: string): number {
        let offset = 8;
        while (offset < data.length) {
            // Safety check
            if (offset + 8 > data.length) return -1;
            
            const length = this.readUint32(data, offset);
            const currentType = this.readString(data, offset + 4, 4);
            if (currentType === type) return offset;
            
            offset += length + 12;
        }
        return -1;
    }
}
