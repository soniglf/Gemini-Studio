
import { GeneratedAsset, ModelAttributes, UsageStats, Project, Collection } from '../types';

// Constants
const DB_NAME = 'GeminiStudioDB';
const DB_VERSION = 7; 
const STORES = {
    ASSETS: 'assets',
    MODELS: 'models',
    STATS: 'stats',
    SETTINGS: 'settings',
    PROJECTS: 'projects',
    COLLECTIONS: 'collections'
};

// Singleton Promise to hold the connection
let dbPromise: Promise<IDBDatabase> | null = null;

// --- BASE REPOSITORY ---
abstract class BaseRepository<T> {
    constructor(protected storeName: string) {}

    protected getDB(): Promise<IDBDatabase> {
        if (dbPromise) return dbPromise;

        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const tx = (event.target as IDBOpenDBRequest).transaction!;
                
                Object.values(STORES).forEach(store => {
                    let s: IDBObjectStore;
                    
                    if (!db.objectStoreNames.contains(store)) {
                        s = db.createObjectStore(store, { keyPath: 'id' });
                    } else {
                        s = tx.objectStore(store);
                    }

                    if (store === STORES.ASSETS) {
                        if(!s.indexNames.contains('projectId')) s.createIndex('projectId', 'projectId', { unique: false });
                        if(!s.indexNames.contains('projectId_timestamp')) s.createIndex('projectId_timestamp', ['projectId', 'timestamp'], { unique: false });
                    }
                    if (store === STORES.COLLECTIONS) {
                        if(!s.indexNames.contains('projectId')) s.createIndex('projectId', 'projectId', { unique: false });
                    }
                });
            };

            request.onsuccess = () => {
                const db = request.result;
                // Handle connection closing unexpectedly
                db.onclose = () => { 
                    console.warn("DB Connection closed unexpectedly. Resetting promise.");
                    dbPromise = null; 
                };
                db.onversionchange = () => {
                    db.close();
                    dbPromise = null;
                };
                resolve(db);
            };

            request.onerror = () => {
                dbPromise = null;
                reject(request.error);
            };
        });

        return dbPromise;
    }

    protected performTransaction<R>(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<R> | void): Promise<R> {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await this.getDB();
                const tx = db.transaction(this.storeName, mode);
                const store = tx.objectStore(this.storeName);
                
                // We capture the result from the request, but we wait for TX complete to resolve
                // This ensures data integrity.
                let result: R | undefined;
                const request = callback(store);

                if (request) {
                    (request as IDBRequest).onsuccess = () => {
                        result = (request as IDBRequest).result;
                    };
                }

                tx.oncomplete = () => resolve(result as R);
                tx.onerror = () => reject(tx.error);
            } catch (e) { 
                reject(e); 
            }
        });
    }

    async add(item: T): Promise<void> {
        await this.performTransaction('readwrite', store => store.put(item));
    }

    async update(id: string, data: Partial<T>): Promise<void> {
        const item = await this.get(id);
        if (item) {
            await this.add({ ...item, ...data });
        }
    }

    async get(id: string): Promise<T | undefined> {
        return this.performTransaction<T>('readonly', store => store.get(id));
    }

    async getAll(): Promise<T[]> {
        return this.performTransaction<T[]>('readonly', store => store.getAll());
    }

    async delete(id: string): Promise<void> {
        await this.performTransaction('readwrite', store => store.delete(id));
    }
}

// --- SPECIALIZED REPOSITORIES ---

class ProjectRepository extends BaseRepository<Project> {
    constructor() { super(STORES.PROJECTS); }
}

class CollectionRepository extends BaseRepository<Collection> {
    constructor() { super(STORES.COLLECTIONS); }
    async getByProject(projectId: string): Promise<Collection[]> {
        return new Promise(async (resolve, reject) => {
             try {
                const db = await this.getDB();
                const tx = db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const index = store.index('projectId');
                const request = index.getAll(projectId);
                
                let result: Collection[] = [];
                request.onsuccess = () => { result = request.result; };
                tx.oncomplete = () => resolve(result);
                tx.onerror = () => reject(tx.error);
             } catch(e) { reject(e); }
        });
    }
}

class AssetRepository extends BaseRepository<GeneratedAsset> {
    constructor() { super(STORES.ASSETS); }

    // Override add to clean ephemeral URLs
    async add(asset: GeneratedAsset): Promise<void> {
        const { url, ...cleanAsset } = asset; // Strip Blob URL
        await super.add(cleanAsset as GeneratedAsset);
    }

    async getByProject(projectId: string, limit: number = 20, lastTimestamp?: number): Promise<GeneratedAsset[]> {
         return new Promise(async (resolve, reject) => {
            try {
                const db = await this.getDB();
                const tx = db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const results: GeneratedAsset[] = [];
                
                let index: IDBIndex;
                try {
                    index = store.index('projectId_timestamp');
                } catch {
                    index = store.index('projectId'); 
                }

                const upper = lastTimestamp ? lastTimestamp - 1 : Date.now() + 10000;
                const range = IDBKeyRange.bound([projectId, 0], [projectId, upper]);
                
                const request = index.openCursor(range, 'prev');
                
                request.onsuccess = (event) => {
                    const cursor = (event.target as IDBRequest).result;
                    if (cursor && results.length < limit) {
                        results.push(cursor.value);
                        cursor.continue();
                    }
                    // Do not resolve here, let transaction complete
                };
                
                tx.oncomplete = () => resolve(results);
                tx.onerror = () => reject(tx.error);
            } catch (e) { reject(e); }
        });
    }
}

class ModelRepository extends BaseRepository<ModelAttributes> {
    constructor() { super(STORES.MODELS); }
    async save(model: ModelAttributes): Promise<void> { await this.add(model); }
}

class StatsRepository extends BaseRepository<UsageStats & { id: string }> {
    constructor() { super(STORES.STATS); }
    async getStats(): Promise<UsageStats | undefined> { return this.get('main'); }
    async saveStats(stats: UsageStats): Promise<void> { await this.add({ id: 'main', ...stats }); }
}

// --- SINGLETON ACCESSOR ---
export const db = {
    assets: new AssetRepository(),
    model: new ModelRepository(),
    stats: new StatsRepository(),
    projects: new ProjectRepository(),
    collections: new CollectionRepository(),
    
    // HEALTH CHECK
    checkHealth: async (): Promise<boolean> => {
        try {
            const d = await dbPromise; // Reuse if available
            return !!d; 
        } catch { 
            // Fallback try open
            return new Promise((resolve) => {
                const req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onsuccess = () => { req.result.close(); resolve(true); };
                req.onerror = () => resolve(false);
            });
        }
    }
};
