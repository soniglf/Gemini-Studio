
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ModelMorphology, Gender } from '../../types';

interface BioMeshProps {
    morphology: ModelMorphology;
    gender: Gender | 'MALE' | 'FEMALE';
    view?: 'FRONT' | 'SIDE';
    className?: string;
    onPartSelect?: (part: string) => void;
}

export const BioMeshVisualizer: React.FC<BioMeshProps> = ({ 
    morphology, gender, view = 'FRONT', className, onPartSelect 
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const modelRef = useRef<THREE.Group | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const frameIdRef = useRef<number>(0);

    // Destructure morphology with defaults
    const { 
        height = 50, weight = 50, muscle = 50, 
        curves = 50, chest = 50
    } = morphology || {};

    useEffect(() => {
        if (!containerRef.current) return;

        // 1. Scene Setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x030712, 0.05);

        const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
        camera.position.set(0, 1, 3.5);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.minDistance = 2;
        controls.maxDistance = 6;
        controls.target.set(0, 1.0, 0);
        controlsRef.current = controls;

        // 2. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        scene.add(ambientLight);

        const spotLight = new THREE.SpotLight(0x00f3ff, 2);
        spotLight.position.set(5, 5, 5);
        spotLight.castShadow = true;
        scene.add(spotLight);
        
        const rimLight = new THREE.SpotLight(0xff00ff, 2);
        rimLight.position.set(-5, 5, -5);
        scene.add(rimLight);

        // Grid
        const gridHelper = new THREE.GridHelper(10, 20, 0x00f3ff, 0x112233);
        gridHelper.position.y = -0.01;
        scene.add(gridHelper);

        // 3. Mannequin Construction
        const mannequin = new THREE.Group();
        modelRef.current = mannequin;
        scene.add(mannequin);

        // Materials
        const skinMat = new THREE.MeshPhysicalMaterial({
            color: 0x111111,
            emissive: 0x00f3ff,
            emissiveIntensity: 0.1,
            metalness: 0.8,
            roughness: 0.2,
            clearcoat: 1.0
        });

        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x00f3ff,
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });

        // Helper to create parts with CapsuleGeometry (smooth shapes)
        const createPart = (name: string, radius: number, length: number, y: number, x = 0, z = 0) => {
            const geo = new THREE.CapsuleGeometry(radius, length, 4, 16);
            const mesh = new THREE.Mesh(geo, skinMat);
            const wMesh = new THREE.Mesh(geo, wireMat);
            mesh.add(wMesh);
            
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.name = name;
            mesh.position.set(x, y, z);
            mannequin.add(mesh);
            return mesh;
        };

        // Base Rig (Standard T-Poseish)
        // Values will be scaled in the update loop
        createPart('head', 0.12, 0.15, 1.75);
        createPart('neck', 0.06, 0.08, 1.58);
        createPart('torso', 0.15, 0.5, 1.25);
        createPart('hips', 0.14, 0.15, 0.9);
        
        // Limbs (Pivoted for better articulation simulation if we wanted)
        // Here we keep it simple static mesh for morphology viz
        const armR = createPart('armR', 0.05, 0.6, 1.35, -0.3);
        armR.rotation.z = 0.2;
        const armL = createPart('armL', 0.05, 0.6, 1.35, 0.3);
        armL.rotation.z = -0.2;

        createPart('legR', 0.06, 0.75, 0.45, -0.1);
        createPart('legL', 0.06, 0.75, 0.45, 0.1);

        // 4. Animation Loop
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            if(controlsRef.current) controlsRef.current.update();
            
            // Idle Animation
            if (modelRef.current) {
                modelRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.01;
                modelRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.05;
            }
            
            if(rendererRef.current) rendererRef.current.render(scene, camera);
        };
        animate();

        // 5. Cleanup
        const handleResize = () => {
            if (!containerRef.current || !camera || !renderer) return;
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameIdRef.current);
            if (rendererRef.current && containerRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
            }
            renderer.dispose();
            // Dispose geometries/materials to avoid leaks
            skinMat.dispose();
            wireMat.dispose();
        };
    }, []);

    // --- VIEW UPDATE ---
    useEffect(() => {
        if (!controlsRef.current || !cameraRef.current) return;
        const targetAzimuth = view === 'SIDE' ? Math.PI / 2 : 0;
        const radius = 3.5;
        const x = Math.sin(targetAzimuth) * radius;
        const z = Math.cos(targetAzimuth) * radius;
        cameraRef.current.position.set(x, 1, z);
        cameraRef.current.lookAt(0, 1, 0);
    }, [view]);

    // --- MORPHOLOGY UPDATE ---
    useEffect(() => {
        if (!modelRef.current) return;

        // Parametric Factors (0.0 - 1.0 normalized from 0-100 inputs)
        // Base is 50.
        const hF = 1 + (height - 50) / 200; // Height factor
        const wF = 1 + (weight - 50) / 200; // General mass
        const mF = 1 + (muscle - 50) / 200; // Definition/Bulge
        const cF = 1 + (curves - 50) / 200; // Hips/Chest variance
        const chF = 1 + (chest - 50) / 200;
        
        const isMale = gender === 'MALE';

        modelRef.current.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
                // Reset
                obj.scale.set(1, 1, 1);
                
                if (obj.name === 'head') {
                    obj.scale.setScalar(0.9 + (wF * 0.1));
                }
                else if (obj.name === 'neck') {
                    obj.scale.x = wF * (isMale ? 1.2 : 1.0);
                    obj.scale.z = wF;
                }
                else if (obj.name === 'torso') {
                    obj.scale.y = hF; 
                    // Shoulder width driven by Muscle + Chest
                    obj.scale.x = isMale ? (wF * 1.0 + chF * 0.2 + mF * 0.2) : (wF * 0.9 + chF * 0.1);
                    obj.scale.z = wF * 0.8 + mF * 0.2;
                }
                else if (obj.name === 'hips') {
                    // Hips wider for female/curves
                    const hipWidth = isMale ? wF : (wF * 0.8 + cF * 0.5);
                    obj.scale.set(hipWidth, 1, wF);
                }
                else if (obj.name.includes('arm')) {
                    const thickness = wF * 0.7 + mF * 0.4; // Muscle heavily impacts arms
                    obj.scale.set(thickness, hF, thickness);
                    
                    // Adjust position slightly based on torso width
                    const offset = isMale ? 0.35 : 0.30;
                    const side = obj.name === 'armL' ? 1 : -1;
                    obj.position.x = side * (offset * obj.parent!.children.find(c => c.name === 'torso')!.scale.x);
                }
                else if (obj.name.includes('leg')) {
                    const thickness = wF * 0.7 + mF * 0.4;
                    obj.scale.set(thickness, hF * 1.1, thickness);
                    obj.position.y = 0.45 * hF; // Lower them if height increases
                    
                    // Hips width offset
                    const offset = isMale ? 0.1 : 0.12;
                    const side = obj.name === 'legL' ? 1 : -1;
                    obj.position.x = side * (offset * obj.parent!.children.find(c => c.name === 'hips')!.scale.x);
                }
            }
        });

    }, [height, weight, muscle, curves, chest, gender]);

    return (
        <div className={`relative w-full h-full overflow-hidden bg-[#030712] ${className}`} ref={containerRef} />
    );
};
