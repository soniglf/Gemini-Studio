
export interface ApiKey {
    id: string;
    key: string;
    type: 'FREE' | 'PAID';
    label?: string;
    addedAt: number;
    lastUsed?: number;
    errorCount: number;
}

export interface KeyHealth {
    freeCount: number;
    paidCount: number;
    hasEnv: boolean;
    status: 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
}

class KeyManager {
    private keys: ApiKey[] = [];
    private readonly STORAGE_KEY = 'gemini_studio_keys_v1';

    constructor() {
        this.load();
    }

    private load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.keys = JSON.parse(stored);
            }
        } catch (e) {
            console.error("Failed to load keys", e);
            this.keys = [];
        }
    }

    private save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.keys));
    }

    /**
     * Adds a key to the local pool.
     */
    addKey(key: string, type: 'FREE' | 'PAID', label?: string) {
        if (!key || key.length < 10) throw new Error("Invalid API Key format");
        if (this.keys.some(k => k.key === key)) throw new Error("Key already exists in pool");

        this.keys.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            key,
            type,
            label: label || `${type} Key ${this.keys.filter(k => k.type === type).length + 1}`,
            addedAt: Date.now(),
            errorCount: 0
        });
        this.save();
    }

    removeKey(id: string) {
        this.keys = this.keys.filter(k => k.id !== id);
        this.save();
    }

    /**
     * Retrieves a key based on the requested tier.
     * Strategy:
     * 1. Look for a key in the specific user pool (Free/Paid).
     * 2. If User Pool has keys, pick one (Simple Load Balancing).
     * 3. If User Pool is empty:
     *    - If PAID requested: Fallback to process.env.API_KEY (Gateway).
     *    - If FREE requested: Fallback to process.env.API_KEY (Gateway) - usually acceptable to use Paid key for Free tasks if user allows.
     */
    getKey(type: 'FREE' | 'PAID'): string {
        const pool = this.keys.filter(k => k.type === type);
        
        // 1. User Pool Hit
        if (pool.length > 0) {
            // Rotation Logic: Pick random for now to spread load
            const selected = pool[Math.floor(Math.random() * pool.length)];
            return selected.key;
        }

        // 2. Fallback to Gateway/Environment
        const envKey = process.env.API_KEY;
        // CRITICAL FIX: Ensure envKey is not just defined but non-empty
        if (envKey && envKey.trim().length > 0) {
            return envKey;
        }

        // 3. Failure
        throw new Error(`No ${type} keys available. Please add a key in Billing.`);
    }

    getPool(): ApiKey[] {
        return this.keys;
    }

    getHealth(): KeyHealth {
        const envKey = process.env.API_KEY;
        const hasEnv = !!(envKey && envKey.trim().length > 0);
        const freeCount = this.keys.filter(k => k.type === 'FREE').length;
        const paidCount = this.keys.filter(k => k.type === 'PAID').length;

        let status: KeyHealth['status'] = 'OFFLINE';
        if (hasEnv || paidCount > 0) status = 'ACTIVE';
        else if (freeCount > 0) status = 'DEGRADED';

        return { freeCount, paidCount, hasEnv, status };
    }
}

export const KeyVault = new KeyManager();
