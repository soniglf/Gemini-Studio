
import JSZip from 'jszip';
import { db } from '../db';
import { Project, ModelAttributes, GeneratedAsset } from '../../types';

export class ProjectPacker {
    static async pack(projectId: string): Promise<Blob> {
        const zip = new JSZip();
        
        // 1. Fetch Data
        const project = await db.projects.get(projectId);
        if (!project) throw new Error("Project not found");
        
        const assets = await db.assets.getByProject(projectId, 9999); // Get all assets
        const models = await db.model.getAll(); // We export all models for safety, or filter? Let's export all.
        
        // 2. Add Metadata Files
        zip.file("project.json", JSON.stringify(project, null, 2));
        zip.file("models.json", JSON.stringify(models, null, 2));
        
        // 3. Process Assets
        const assetsMetadata: any[] = [];
        const assetsFolder = zip.folder("assets");
        
        for (const asset of assets) {
            const { blob, url, ...metadata } = asset;
            const fileName = `${asset.id}.${asset.type === 'VIDEO' ? 'mp4' : 'png'}`;
            
            assetsMetadata.push({
                ...metadata,
                fileName
            });
            
            if (blob && assetsFolder) {
                assetsFolder.file(fileName, blob);
            }
        }
        
        zip.file("assets.json", JSON.stringify(assetsMetadata, null, 2));
        
        // 4. Generate Blob
        return await zip.generateAsync({ type: "blob" });
    }

    static async unpack(file: File): Promise<string> {
        const zip = await JSZip.loadAsync(file);
        
        // 1. Read Metadata
        const projectStr = await zip.file("project.json")?.async("string");
        const modelsStr = await zip.file("models.json")?.async("string");
        const assetsStr = await zip.file("assets.json")?.async("string");
        
        if (!projectStr || !modelsStr || !assetsStr) throw new Error("Invalid .gemini file structure");
        
        const project: Project = JSON.parse(projectStr);
        const models: ModelAttributes[] = JSON.parse(modelsStr);
        const assetsMeta: any[] = JSON.parse(assetsStr);
        
        // 2. Import Project (Rename if exists)
        const newProjectId = `${project.id}_imported_${Date.now()}`;
        const newProject = { ...project, id: newProjectId, name: `${project.name} (Imported)` };
        await db.projects.add(newProject);
        
        // 3. Import Models
        for (const m of models) {
            const exists = await db.model.get(m.id);
            if (!exists) await db.model.add(m);
        }
        
        // 4. Import Assets
        for (const meta of assetsMeta) {
            const fileName = meta.fileName;
            const assetFile = zip.file(`assets/${fileName}`);
            
            if (assetFile) {
                const blob = await assetFile.async("blob");
                const newAsset: GeneratedAsset = {
                    ...meta,
                    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Regen ID to avoid collisions
                    projectId: newProjectId,
                    blob,
                    url: URL.createObjectURL(blob),
                    // Strip fileName from metadata if present
                };
                delete (newAsset as any).fileName;
                
                await db.assets.add(newAsset);
            }
        }
        
        return newProjectId;
    }
}
