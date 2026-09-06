import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Layers, 
  RotateCw, 
  Eye, 
  AlertOctagon,
  RefreshCw,
  Cpu,
  Droplet
} from 'lucide-react';
import type { TelemetryReading } from '../types/telemetry';

interface ThreeEngineHologramProps {
  telemetry: TelemetryReading | null;
}

export const ThreeEngineHologram: React.FC<ThreeEngineHologramProps> = ({ telemetry }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [explosionFactor, setExplosionFactor] = useState<number>(0);
  const [activeLayer, setActiveLayer] = useState<string>('all');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showHUD, setShowHUD] = useState<boolean>(true);

  // References to controls and camera for reset
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // References to 3D groups for dynamic animation & highlighting
  const groupsRef = useRef<{
    cylinders: THREE.Group;
    exhaust: THREE.Group;
    lubrication: THREE.Group;
    fuelInjection: THREE.Group;
    coreBlock: THREE.Group;
    propShaft: THREE.Group;
    engineRoot: THREE.Group;
  } | null>(null);

  const materialsRef = useRef<{
    cylMaterial: THREE.MeshStandardMaterial;
    exhMaterial: THREE.MeshStandardMaterial;
    lubMaterial: THREE.MeshStandardMaterial;
    fuelMaterial: THREE.MeshStandardMaterial;
    coreMaterial: THREE.MeshStandardMaterial;
    propMaterial: THREE.MeshStandardMaterial;
  } | null>(null);

  // Reset Camera View to perfect center
  const handleResetCamera = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(10, 6, 12);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    
    // Get accurate layout dimensions
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b14, 0.025);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(10, 6, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. OrbitControls (Smooth 360-degree rotation centered at 0,0,0)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.minDistance = 5;
    controls.maxDistance = 32;
    controls.maxPolarAngle = Math.PI / 2 + 0.15; // Don't flip below grid
    controlsRef.current = controls;

    // 4. Ground Grid & Holographic Platform
    const grid = new THREE.GridHelper(26, 26, 0x00f0ff, 0x1e293b);
    grid.position.y = -3.2;
    scene.add(grid);

    // Holographic Circular Platform Ring
    const platformGeo = new THREE.RingGeometry(4.5, 5.0, 48);
    const platformMat = new THREE.MeshBasicMaterial({ 
      color: 0x00f0ff, 
      side: THREE.DoubleSide, 
      transparent: true, 
      opacity: 0.35 
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.rotation.x = Math.PI / 2;
    platform.position.y = -3.18;
    scene.add(platform);

    // 5. Lighting Setup (Bright, cyber-aerospace highlights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight1.position.set(15, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight2.position.set(-15, -10, -15);
    scene.add(dirLight2);

    const centerPointLight = new THREE.PointLight(0x00f0ff, 2, 20);
    centerPointLight.position.set(0, 0, 0);
    scene.add(centerPointLight);

    // 6. Build UAV 4-Cylinder Piston Engine (Centered exactly at origin 0,0,0)
    const rootEngineGroup = new THREE.Group();
    rootEngineGroup.position.set(0, 0, 0);
    scene.add(rootEngineGroup);

    // Hologram Material Helper
    const createHoloMat = (colorHex: number, opacity = 0.9) => {
      return new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.45,
        wireframe: false,
        transparent: true,
        opacity: opacity,
        metalness: 0.7,
        roughness: 0.25,
      });
    };

    const cylMat = createHoloMat(0x00f0ff, 0.9); // Cyan
    const exhMat = createHoloMat(0xf97316, 0.9); // Orange
    const lubMat = createHoloMat(0xa855f7, 0.9); // Purple
    const fuelMat = createHoloMat(0x10b981, 0.9); // Emerald
    const coreMat = createHoloMat(0x38bdf8, 0.85); // Blue
    const propMat = createHoloMat(0xf8fafc, 0.95);

    // (A) Core Crankcase & Engine Block (Centered at 0, 0, 0)
    const coreGroup = new THREE.Group();
    const crankcaseGeo = new THREE.BoxGeometry(3.6, 2.2, 4.8);
    const crankcase = new THREE.Mesh(crankcaseGeo, coreMat);
    crankcase.position.set(0, 0, 0);
    coreGroup.add(crankcase);

    // Engine Mounting Struts
    const mountGeo = new THREE.CylinderGeometry(0.15, 0.15, 4.5, 16);
    const mount1 = new THREE.Mesh(mountGeo, coreMat);
    mount1.rotation.z = Math.PI / 2;
    mount1.position.set(0, -0.9, 1.6);
    const mount2 = new THREE.Mesh(mountGeo, coreMat);
    mount2.rotation.z = Math.PI / 2;
    mount2.position.set(0, -0.9, -1.6);
    coreGroup.add(mount1, mount2);
    rootEngineGroup.add(coreGroup);

    // (B) 4 Boxer Horizontally-Opposed Cylinders & Heads
    const cylGroup = new THREE.Group();
    const cylPositions = [
      { x: 2.6, y: 0.2, z: 1.2, rotZ: Math.PI / 2 },
      { x: 2.6, y: 0.2, z: -1.2, rotZ: Math.PI / 2 },
      { x: -2.6, y: 0.2, z: 1.2, rotZ: -Math.PI / 2 },
      { x: -2.6, y: 0.2, z: -1.2, rotZ: -Math.PI / 2 },
    ];

    cylPositions.forEach((pos) => {
      // Cylinder Barrel
      const barrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.8, 24);
      const barrel = new THREE.Mesh(barrelGeo, cylMat);
      barrel.rotation.z = pos.rotZ;
      barrel.position.set(pos.x * 0.65, pos.y, pos.z);
      
      // Cooling Fins
      for (let i = -0.6; i <= 0.6; i += 0.25) {
        const finGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.04, 24);
        const fin = new THREE.Mesh(finGeo, cylMat);
        fin.rotation.z = pos.rotZ;
        fin.position.set((pos.x * 0.65) + (pos.x > 0 ? i * 0.8 : -i * 0.8), pos.y, pos.z);
        cylGroup.add(fin);
      }

      // Cylinder Head with Valve Cover
      const headGeo = new THREE.BoxGeometry(1.1, 1.5, 1.5);
      const head = new THREE.Mesh(headGeo, cylMat);
      head.position.set(pos.x, pos.y, pos.z);
      
      // Spark Plug
      const plugGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12);
      const plug = new THREE.Mesh(plugGeo, createHoloMat(0xffffff, 0.95));
      plug.position.set(pos.x * 1.15, pos.y + 0.65, pos.z);
      
      cylGroup.add(barrel, head, plug);
    });
    rootEngineGroup.add(cylGroup);

    // (C) Exhaust Manifold & Turbocharger System
    const exhGroup = new THREE.Group();
    const pipe1Geo = new THREE.TorusGeometry(1.2, 0.18, 12, 24, Math.PI / 2);
    const pipe1 = new THREE.Mesh(pipe1Geo, exhMat);
    pipe1.position.set(1.5, -0.9, 1.2);
    pipe1.rotation.y = Math.PI / 2;

    const pipe2 = new THREE.Mesh(pipe1Geo, exhMat);
    pipe2.position.set(-1.5, -0.9, 1.2);
    pipe2.rotation.y = -Math.PI / 2;

    // Turbocharger housing & turbine
    const turboHousingGeo = new THREE.TorusGeometry(0.7, 0.35, 16, 32);
    const turboHousing = new THREE.Mesh(turboHousingGeo, exhMat);
    turboHousing.position.set(0, -1.4, 2.4);
    turboHousing.rotation.x = Math.PI / 2;

    const exhaustTailPipeGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.0, 20);
    const exhaustTailPipe = new THREE.Mesh(exhaustTailPipeGeo, exhMat);
    exhaustTailPipe.rotation.x = Math.PI / 3;
    exhaustTailPipe.position.set(0, -1.8, 3.4);

    exhGroup.add(pipe1, pipe2, turboHousing, exhaustTailPipe);
    rootEngineGroup.add(exhGroup);

    // (D) Lubrication Circuit & Oil Sump (Bottom)
    const lubGroup = new THREE.Group();
    const oilSumpGeo = new THREE.BoxGeometry(3.0, 0.8, 4.0);
    const oilSump = new THREE.Mesh(oilSumpGeo, lubMat);
    oilSump.position.set(0, -1.4, 0);

    // Oil Cooler Matrix (Front bottom)
    const oilCoolerGeo = new THREE.BoxGeometry(2.0, 0.9, 0.4);
    const oilCooler = new THREE.Mesh(oilCoolerGeo, lubMat);
    oilCooler.position.set(0, -0.5, -2.6);

    lubGroup.add(oilSump, oilCooler);
    rootEngineGroup.add(lubGroup);

    // (E) Fuel Injector Rails & Intake Plenum (Top)
    const fuelGroup = new THREE.Group();
    const intakePlenumGeo = new THREE.CylinderGeometry(0.35, 0.35, 3.8, 16);
    const intakePlenum = new THREE.Mesh(intakePlenumGeo, fuelMat);
    intakePlenum.rotation.x = Math.PI / 2;
    intakePlenum.position.set(0, 1.4, 0);

    // Fuel Rails & Injector Nozzles
    [-1.2, 1.2].forEach((z) => {
      const railGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.6, 12);
      const rail = new THREE.Mesh(railGeo, fuelMat);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, 1.3, z);

      const inj1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12), fuelMat);
      inj1.position.set(1.5, 0.9, z);
      const inj2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12), fuelMat);
      inj2.position.set(-1.5, 0.9, z);

      fuelGroup.add(rail, inj1, inj2);
    });
    fuelGroup.add(intakePlenum);
    rootEngineGroup.add(fuelGroup);

    // (F) Propeller Reduction Drive & Flange (Front)
    const propGroup = new THREE.Group();
    const shaftGeo = new THREE.CylinderGeometry(0.35, 0.35, 2.0, 24);
    const shaft = new THREE.Mesh(shaftGeo, propMat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(0, 0, -3.0);

    const propFlangeGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.25, 32);
    const propFlange = new THREE.Mesh(propFlangeGeo, propMat);
    propFlange.rotation.x = Math.PI / 2;
    propFlange.position.set(0, 0, -3.9);

    propGroup.add(shaft, propFlange);
    rootEngineGroup.add(propGroup);

    groupsRef.current = {
      cylinders: cylGroup,
      exhaust: exhGroup,
      lubrication: lubGroup,
      fuelInjection: fuelGroup,
      coreBlock: coreGroup,
      propShaft: propGroup,
      engineRoot: rootEngineGroup
    };

    materialsRef.current = {
      cylMaterial: cylMat,
      exhMaterial: exhMat,
      lubMaterial: lubMat,
      fuelMaterial: fuelMat,
      coreMaterial: coreMat,
      propMaterial: propMat
    };

    // 7. Animation Render Loop
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Continuous propeller drive rotation
      propGroup.rotation.z += 0.04;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 8. Handle Window / Container Resize Responsively
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Update autoRotate on existing OrbitControls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Update Exploded View & Active Layer Filtering
  useEffect(() => {
    if (!groupsRef.current) return;
    const { cylinders, exhaust, lubrication, fuelInjection, coreBlock, propShaft } = groupsRef.current;
    const d = explosionFactor; // 0 (assembled) to 1 (fully exploded)

    // Smooth outward displacement centered around origin
    cylinders.position.set(0, d * 0.4, 0);
    cylinders.children.forEach((child, idx) => {
      if (idx % 2 === 0) child.position.x = (child.position.x > 0 ? 1 : -1) * (1.6 + d * 2.2);
    });
    exhaust.position.set(0, -d * 2.0, d * 1.8);
    lubrication.position.set(0, -d * 2.4, 0);
    fuelInjection.position.set(0, d * 2.5, 0);
    propShaft.position.set(0, 0, -d * 2.8);

    // Layer visibility
    cylinders.visible = activeLayer === 'all' || activeLayer === 'cylinders';
    exhaust.visible = activeLayer === 'all' || activeLayer === 'exhaust';
    lubrication.visible = activeLayer === 'all' || activeLayer === 'lubrication';
    fuelInjection.visible = activeLayer === 'all' || activeLayer === 'fuel';
    coreBlock.visible = activeLayer === 'all' || activeLayer === 'core';
    propShaft.visible = activeLayer === 'all' || activeLayer === 'prop';
  }, [explosionFactor, activeLayer]);

  // Dynamic Holographic Anomaly Highlighting (Red alert pulses on the damaged component)
  useEffect(() => {
    if (!materialsRef.current) return;
    const { cylMaterial, exhMaterial, lubMaterial, fuelMaterial, coreMaterial } = materialsRef.current;
    const fault = telemetry?.fault_type || 'none';
    const isAnomaly = telemetry?.anomaly === 1;

    // Reset default cyber colors
    cylMaterial.color.setHex(0x00f0ff);
    cylMaterial.emissive.setHex(0x00f0ff);
    cylMaterial.emissiveIntensity = 0.45;

    exhMaterial.color.setHex(0xf97316);
    exhMaterial.emissive.setHex(0xf97316);
    exhMaterial.emissiveIntensity = 0.45;

    lubMaterial.color.setHex(0xa855f7);
    lubMaterial.emissive.setHex(0xa855f7);
    lubMaterial.emissiveIntensity = 0.45;

    fuelMaterial.color.setHex(0x10b981);
    fuelMaterial.emissive.setHex(0x10b981);
    fuelMaterial.emissiveIntensity = 0.45;

    coreMaterial.color.setHex(0x38bdf8);
    coreMaterial.emissive.setHex(0x38bdf8);
    coreMaterial.emissiveIntensity = 0.35;

    // Highlight specific affected subsystem in Glowing Red
    if (isAnomaly || fault !== 'none') {
      if (['overheating', 'cooling_degradation', 'sensor_drift'].includes(fault)) {
        cylMaterial.color.setHex(0xef4444);
        cylMaterial.emissive.setHex(0xff0000);
        cylMaterial.emissiveIntensity = 1.0;
      }
      if (['misfire', 'combustion_instability'].includes(fault)) {
        exhMaterial.color.setHex(0xef4444);
        exhMaterial.emissive.setHex(0xff0000);
        exhMaterial.emissiveIntensity = 1.0;
      }
      if (['lubrication_issue'].includes(fault)) {
        lubMaterial.color.setHex(0xef4444);
        lubMaterial.emissive.setHex(0xff0000);
        lubMaterial.emissiveIntensity = 1.0;
      }
      if (['injector_abnormality'].includes(fault)) {
        fuelMaterial.color.setHex(0xef4444);
        fuelMaterial.emissive.setHex(0xff0000);
        fuelMaterial.emissiveIntensity = 1.0;
      }
      if (['vibration_anomaly'].includes(fault)) {
        coreMaterial.color.setHex(0xef4444);
        coreMaterial.emissive.setHex(0xff0000);
        coreMaterial.emissiveIntensity = 0.95;
      }
    }
  }, [telemetry]);

  const fault = telemetry?.fault_type || 'none';
  const isAnomaly = telemetry?.anomaly === 1;

  return (
    <div className="glass-panel rounded-2xl border border-cyan-500/30 overflow-hidden relative flex flex-col h-[620px] w-full shadow-[0_0_40px_rgba(0,240,255,0.12)]">
      
      {/* 3D Canvas Mount (Takes full centered dimensions) */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing holo-scanline"
        style={{ minHeight: '100%' }}
      />

      {/* Top Header Overlay: Hologram Status & Controls */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between pointer-events-none gap-2 z-10">
        
        {/* Hologram Title Badge */}
        <div className="pointer-events-auto flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-widest">
            3D DIGITAL TWIN • ROTAX PISTON ENGINE
          </span>
        </div>

        {/* Anomaly Indicator */}
        {isAnomaly && (
          <div className="pointer-events-auto flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-red-950/90 backdrop-blur-md border border-red-500 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold uppercase">
              3D ALERT: {fault.replace(/_/g, ' ')} HIGHLIGHTED
            </span>
          </div>
        )}

        {/* Action Controls (Reset, Auto-rotate, HUD Toggle) */}
        <div className="pointer-events-auto flex items-center space-x-2">
          
          <button
            onClick={handleResetCamera}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs bg-slate-900/80 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20 transition shadow-sm"
            title="Reset Camera to Center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Center View</span>
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-lg border text-xs transition ${
              autoRotate ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-900/80 text-slate-400 border-slate-700'
            }`}
            title="Toggle Auto Rotation"
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowHUD(!showHUD)}
            className={`p-2 rounded-lg border text-xs transition ${
              showHUD ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-900/80 text-slate-400 border-slate-700'
            }`}
            title="Toggle Telemetry Badges"
          >
            <Eye className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Floating 3D Sensor HUD Overlays (Placed on outer corners so center is clear) */}
      {showHUD && (
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-10">
          
          {/* Top-Right: Cylinder Head & Exhaust Live Telemetry */}
          <div className="self-end pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 p-3 rounded-xl shadow-xl w-56 space-y-1.5 mt-12">
            <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 uppercase border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> Cylinder & Exhaust</span>
              <span className={`px-1 rounded text-[9px] ${['overheating', 'cooling_degradation', 'misfire'].includes(fault) ? 'bg-red-500/30 text-red-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {['overheating', 'cooling_degradation', 'misfire'].includes(fault) ? 'ALERT' : 'OK'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">CHT Temp:</span>
              <span className="font-mono font-bold text-white">{(telemetry?.cht ?? 175).toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">EGT Exhaust:</span>
              <span className="font-mono font-bold text-amber-400">{(telemetry?.egt ?? 620).toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">CHT Residual:</span>
              <span className="font-mono text-cyan-300">{(telemetry?.residual_cht ?? 0).toFixed(2)} °C</span>
            </div>
          </div>

          {/* Bottom-Left: Lubrication & Fuel Live Telemetry */}
          <div className="self-start pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-purple-500/40 p-3 rounded-xl shadow-xl w-56 space-y-1.5 mb-16">
            <div className="flex items-center justify-between text-[11px] font-bold text-purple-400 uppercase border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1"><Droplet className="w-3.5 h-3.5" /> Lubrication & Fuel</span>
              <span className={`px-1 rounded text-[9px] ${['lubrication_issue', 'injector_abnormality'].includes(fault) ? 'bg-red-500/30 text-red-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {['lubrication_issue', 'injector_abnormality'].includes(fault) ? 'ALERT' : 'OK'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Oil Pressure:</span>
              <span className="font-mono font-bold text-purple-300">{(telemetry?.oil_pressure ?? 5.5).toFixed(2)} bar</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Oil Temp:</span>
              <span className="font-mono font-bold text-yellow-300">{(telemetry?.oil_temperature ?? 85).toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Fuel Flow:</span>
              <span className="font-mono font-bold text-emerald-400">{(telemetry?.fuel_flow_rate ?? 18).toFixed(1)} L/h</span>
            </div>
          </div>

        </div>
      )}

      {/* Bottom Controls Bar: Layer Explosion Slider & Layer Filter Switcher */}
      <div className="absolute bottom-3 left-4 right-4 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 z-20 shadow-2xl">
        
        {/* Layer Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Layers:
          </span>
          {[
            { id: 'all', label: 'All Subsystems' },
            { id: 'cylinders', label: '1. Cylinder Heads' },
            { id: 'exhaust', label: '2. Exhaust & Turbo' },
            { id: 'lubrication', label: '3. Oil Sump' },
            { id: 'fuel', label: '4. Injectors' },
            { id: 'core', label: '5. Engine Block' }
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveLayer(l.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeLayer === l.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* 3D Exploded View Slider */}
        <div className="flex items-center space-x-3 min-w-[200px]">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            Explode: <span className="text-cyan-400 font-mono">{(explosionFactor * 100).toFixed(0)}%</span>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={explosionFactor}
            onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
            className="w-28 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

      </div>

    </div>
  );
};
