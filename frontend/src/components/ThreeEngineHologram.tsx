import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Layers, 
  AlertTriangle, 
  Eye, 
  Flame,
  Droplet,
  Sliders
} from 'lucide-react';
import type { TelemetryReading } from '../types/telemetry';

interface ThreeEngineHologramProps {
  telemetry: TelemetryReading | null;
}

const SUBSYSTEM_INFO: Record<string, { label: string; color: string }> = {
  block: { label: 'Cylinder Block & Liners', color: '#6b6f78' },
  head:  { label: 'Cylinder Head & Rocker', color: '#8a8e98' },
  crank: { label: 'Crankshaft & Bearings', color: '#b0b4be' },
  rods:  { label: 'Con Rods & Pistons', color: '#c49a50' },
  fly:   { label: 'Flywheel & Ring Gear', color: '#404348' },
  cam:   { label: 'Camshafts & Timing Chain', color: '#78808a' },
  vlv:   { label: 'Valves & Dual Springs', color: '#5580b8' },
  turbo: { label: 'Turbocharger & Intercooler', color: '#8060c0' },
  exh:   { label: 'Exhaust Manifold & Collector', color: '#d05040' },
  intk:  { label: 'Intake Plenum & Throttle', color: '#4a80d0' },
  fuel:  { label: 'Common Rail & Injectors', color: '#40b060' },
  oil:   { label: 'Oil Sump, Pump & Cooler', color: '#c0a030' },
  psru:  { label: 'PSRU Gearbox & Propeller', color: '#e08030' },
  elec:  { label: 'FADEC & Electrical Harness', color: '#d060a0' },
  cool:  { label: 'Water Pump & Thermostat', color: '#30b0c0' }
};

export const ThreeEngineHologram: React.FC<ThreeEngineHologramProps> = ({ telemetry }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [explosionFactor, setExplosionFactor] = useState<number>(0);
  const [isCutaway, setIsCutaway] = useState<boolean>(false);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [hoveredSubsystem, setHoveredSubsystem] = useState<string | null>(null);
  const [showSubsystemMenu, setShowSubsystemMenu] = useState<boolean>(false);

  const [visibleSubsystems, setVisibleSubsystems] = useState<Record<string, boolean>>({
    block: true, head: true, crank: true, rods: true, fly: true,
    cam: true, vlv: true, turbo: true, exh: true, intk: true,
    fuel: true, oil: true, psru: true, elec: true, cool: true
  });

  const cameraRef = useRef({
    yaw: 0.6,
    pitch: -0.35,
    dist: 5.5,
    panX: 0,
    panY: 0
  });

  const animStateRef = useRef({
    cAngle: 0,
    lastTime: performance.now(),
    rpm: telemetry?.rpm ?? 1500,
    exploded: 0,
    cutaway: false,
    playing: true
  });

  const isAnomaly = telemetry?.anomaly === 1;
  const faultType = telemetry?.fault_type || 'none';

  const flaggedSubsystems = useMemo(() => {
    const flagged = new Set<string>();
    if (isAnomaly) {
      switch (faultType) {
        case 'overheating':
          flagged.add('head'); flagged.add('block'); flagged.add('cool');
          break;
        case 'cooling_degradation':
          flagged.add('cool'); flagged.add('block'); flagged.add('head');
          break;
        case 'lubrication_issue':
          flagged.add('oil'); flagged.add('crank');
          break;
        case 'misfire':
          flagged.add('rods'); flagged.add('vlv'); flagged.add('head'); flagged.add('crank');
          break;
        case 'combustion_instability':
          flagged.add('rods'); flagged.add('head'); flagged.add('fuel');
          break;
        case 'injector_abnormality':
          flagged.add('fuel'); flagged.add('intk');
          break;
        case 'vibration_anomaly':
          flagged.add('crank'); flagged.add('rods'); flagged.add('fly'); flagged.add('psru'); flagged.add('block');
          break;
        case 'sensor_drift':
          flagged.add('elec'); flagged.add('turbo');
          break;
        default:
          flagged.add('head'); flagged.add('rods');
      }
    }
    if (telemetry?.subsystem_health) {
      const sh = telemetry.subsystem_health;
      if (sh.cylinder_heads?.status === 'critical' || sh.cylinder_heads?.status === 'warning') {
        flagged.add('head'); flagged.add('rods'); flagged.add('vlv');
      }
      if (sh.exhaust_system?.status === 'critical' || sh.exhaust_system?.status === 'warning') {
        flagged.add('exh'); flagged.add('turbo');
      }
      if (sh.lubrication_circuit?.status === 'critical' || sh.lubrication_circuit?.status === 'warning') {
        flagged.add('oil');
      }
      if (sh.fuel_injection?.status === 'critical' || sh.fuel_injection?.status === 'warning') {
        flagged.add('fuel');
      }
      if (sh.core_block?.status === 'critical' || sh.core_block?.status === 'warning') {
        flagged.add('block'); flagged.add('crank');
      }
    }
    return flagged;
  }, [isAnomaly, faultType, telemetry?.subsystem_health]);

  useEffect(() => {
    animStateRef.current.rpm = telemetry?.rpm ?? 1500;
  }, [telemetry?.rpm]);

  useEffect(() => {
    animStateRef.current.exploded = explosionFactor;
  }, [explosionFactor]);

  useEffect(() => {
    animStateRef.current.cutaway = isCutaway;
  }, [isCutaway]);

  useEffect(() => {
    animStateRef.current.playing = isPlaying;
  }, [isPlaying]);

  const setCameraPreset = useCallback((yaw: number, pitch: number, dist: number) => {
    cameraRef.current.yaw = yaw;
    cameraRef.current.pitch = pitch;
    cameraRef.current.dist = dist;
    cameraRef.current.panX = 0;
    cameraRef.current.panY = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const updateSize = () => {
      if (!containerRef.current || !canvas) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight || 560;
      canvas.width = width;
      canvas.height = height;
    };
    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    const v3 = (x: number, y: number, z: number): [number, number, number] => [x, y, z];
    const vAdd = (a: [number, number, number], b: [number, number, number]): [number, number, number] => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
    const vSub = (a: [number, number, number], b: [number, number, number]): [number, number, number] => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
    const vMul = (v: [number, number, number], s: number): [number, number, number] => [v[0]*s, v[1]*s, v[2]*s];
    const vDot = (a: [number, number, number], b: [number, number, number]) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
    const vCross = (a: [number, number, number], b: [number, number, number]): [number, number, number] => [
      a[1]*b[2] - a[2]*b[1],
      a[2]*b[0] - a[0]*b[2],
      a[0]*b[1] - a[1]*b[0]
    ];
    const vLen = (v: [number, number, number]) => Math.sqrt(vDot(v, v));
    const vNorm = (v: [number, number, number]): [number, number, number] => {
      const l = vLen(v);
      return l > 1e-8 ? vMul(v, 1/l) : v;
    };
    const rY = (v: [number, number, number], a: number): [number, number, number] => {
      const c = Math.cos(a), s = Math.sin(a);
      return [v[0]*c + v[2]*s, v[1], -v[0]*s + v[2]*c];
    };
    const rX = (v: [number, number, number], a: number): [number, number, number] => {
      const c = Math.cos(a), s = Math.sin(a);
      return [v[0], v[1]*c - v[2]*s, v[1]*s + v[2]*c];
    };

    const project = (p: [number, number, number]) => {
      const cam = cameraRef.current;
      let v = v3(p[0] - cam.panX, p[1] - cam.panY, p[2]);
      v = rY(v, -cam.yaw);
      v = rX(v, -cam.pitch);
      v[2] += cam.dist;
      if (v[2] < 0.05) return null;
      const f = 640;
      return { x: width / 2 + (v[0] * f) / v[2], y: height / 2 - (v[1] * f) / v[2], z: v[2] };
    };

    const lightDir = vNorm([0.35, 0.7, -0.55]);
    const lightDir2 = vNorm([-0.4, 0.2, 0.6]);

    const parseColor = (hex: string): [number, number, number] => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ];

    const phong = (
      baseHex: string,
      normal: [number, number, number],
      spec: number,
      isFlagged: boolean,
      pulseFactor: number
    ): string => {
      let [br, bg, bb] = parseColor(baseHex);
      if (isFlagged) {
        br = Math.round(br + (255 - br) * (0.65 + 0.35 * pulseFactor));
        bg = Math.round(bg * (1 - 0.75 * pulseFactor));
        bb = Math.round(bb * (1 - 0.75 * pulseFactor));
      }

      const n = vNorm(normal);
      const amb = 0.24;
      const dKey = Math.max(0, vDot(n, lightDir));
      const dFill = Math.max(0, vDot(n, lightDir2)) * 0.25;
      const diff = dKey + dFill;

      const viewDir = vNorm([0, 0, -1]);
      const halfV = vNorm(vAdd(lightDir, vMul(viewDir, -1)));
      const sp = Math.pow(Math.max(0, vDot(n, halfV)), spec || 30) * 0.45;

      const r = Math.min(255, Math.floor(br * (amb + diff * 0.75) + sp * 200));
      const g = Math.min(255, Math.floor(bg * (amb + diff * 0.75) + sp * 200));
      const b = Math.min(255, Math.floor(bb * (amb + diff * 0.75) + sp * 190));
      return `rgb(${r},${g},${b})`;
    };

    interface FaceItem {
      pts: { x: number; y: number; z: number }[];
      color: string;
      depth: number;
      label: string;
      subsystemKey: string;
      isFlagged: boolean;
    }

    const faces: FaceItem[] = [];

    const addFace = (
      verts: [number, number, number][],
      baseColor: string,
      label: string,
      subsystemKey: string,
      specular?: number,
      noBackCull?: boolean
    ) => {
      if (!visibleSubsystems[subsystemKey]) return;

      const pts: { x: number; y: number; z: number }[] = [];
      for (let i = 0; i < verts.length; i++) {
        const p = project(verts[i]);
        if (!p) return;
        pts.push(p);
      }

      const e1 = vSub(verts[1], verts[0]);
      const e2 = vSub(verts[2], verts[0]);
      const wn = vCross(e1, e2);
      const cam = cameraRef.current;
      let vsn = rY(wn, -cam.yaw);
      vsn = rX(vsn, -cam.pitch);
      if (!noBackCull && vsn[2] > 0) return;

      if (animStateRef.current.cutaway) {
        const cx = (verts[0][2] + verts[1][2] + verts[2][2]) / (verts.length > 3 ? verts.length : 3);
        if (cx > 0.08) return;
      }

      const isFlagged = flaggedSubsystems.has(subsystemKey);
      const pulseFactor = 0.5 + 0.5 * Math.sin(performance.now() * 0.007);
      const color = phong(baseColor, wn, specular || 30, isFlagged, pulseFactor);
      const depth = pts.reduce((sum, pt) => sum + pt.z, 0) / pts.length;

      faces.push({ pts, color, depth, label, subsystemKey, isFlagged });
    };

    const S = 1 / 220;
    const SEG_HI = 26, SEG_MED = 18, SEG_LO = 12;

    const cylinder = (
      cx: number, cy: number, cz: number,
      r: number, h: number,
      seg: number, col: string, label: string, subsystemKey: string,
      axis?: 'x' | 'y' | 'z', spec?: number
    ) => {
      const segs = seg || SEG_HI;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2;
        const a1 = ((i + 1) / segs) * Math.PI * 2;
        let p: [number, number, number][] = [];
        if (!axis || axis === 'y') {
          p = [
            [cx + Math.cos(a0) * r, cy, cz + Math.sin(a0) * r],
            [cx + Math.cos(a1) * r, cy, cz + Math.sin(a1) * r],
            [cx + Math.cos(a1) * r, cy + h, cz + Math.sin(a1) * r],
            [cx + Math.cos(a0) * r, cy + h, cz + Math.sin(a0) * r]
          ];
        } else if (axis === 'x') {
          p = [
            [cx, cy + Math.cos(a0) * r, cz + Math.sin(a0) * r],
            [cx, cy + Math.cos(a1) * r, cz + Math.sin(a1) * r],
            [cx + h, cy + Math.cos(a1) * r, cz + Math.sin(a1) * r],
            [cx + h, cy + Math.cos(a0) * r, cz + Math.sin(a0) * r]
          ];
        } else {
          p = [
            [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cz],
            [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, cz],
            [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, cz + h],
            [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cz + h]
          ];
        }
        addFace(p, col, label, subsystemKey, spec);
      }
      const topV: [number, number, number][] = [];
      const botV: [number, number, number][] = [];
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        if (!axis || axis === 'y') {
          topV.push([cx + Math.cos(a) * r, cy + h, cz + Math.sin(a) * r]);
          botV.unshift([cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r]);
        } else if (axis === 'x') {
          topV.push([cx + h, cy + Math.cos(a) * r, cz + Math.sin(a) * r]);
          botV.unshift([cx, cy + Math.cos(a) * r, cz + Math.sin(a) * r]);
        } else {
          topV.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz + h]);
          botV.unshift([cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r]);
        }
      }
      const tc = topV[0], bc = botV[0];
      for (let i = 1; i < topV.length - 1; i++) addFace([tc, topV[i], topV[i + 1]], col, label, subsystemKey, spec);
      for (let i = 1; i < botV.length - 1; i++) addFace([bc, botV[i], botV[i + 1]], col, label, subsystemKey, spec);
    };

    const tube = (
      p1: [number, number, number], p2: [number, number, number],
      radius: number, seg: number, col: string, label: string, subsystemKey: string, spec?: number
    ) => {
      const segs = seg || SEG_MED;
      const d = vSub(p2, p1), len = vLen(d);
      if (len < 0.001) return;
      const dn = vNorm(d);
      let up: [number, number, number] = [0, 1, 0];
      if (Math.abs(vDot(dn, up)) > 0.99) up = [1, 0, 0];
      const rt = vNorm(vCross(dn, up)), u2 = vNorm(vCross(rt, dn));
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
        const r0 = vAdd(vMul(rt, Math.cos(a0) * radius), vMul(u2, Math.sin(a0) * radius));
        const r1 = vAdd(vMul(rt, Math.cos(a1) * radius), vMul(u2, Math.sin(a1) * radius));
        addFace([vAdd(p1, r0), vAdd(p1, r1), vAdd(p2, r1), vAdd(p2, r0)], col, label, subsystemKey, spec || 30);
      }
    };

    const box = (
      cx: number, cy: number, cz: number,
      w: number, h: number, d: number,
      col: string, label: string, subsystemKey: string, spec?: number
    ) => {
      const hw = w / 2, hh = h / 2, hd = d / 2;
      const fs: [number, number, number][][] = [
        [[cx - hw, cy + hh, cz - hd], [cx + hw, cy + hh, cz - hd], [cx + hw, cy + hh, cz + hd], [cx - hw, cy + hh, cz + hd]],
        [[cx - hw, cy - hh, cz + hd], [cx + hw, cy - hh, cz + hd], [cx + hw, cy - hh, cz - hd], [cx - hw, cy - hh, cz - hd]],
        [[cx - hw, cy - hh, cz + hd], [cx - hw, cy + hh, cz + hd], [cx + hw, cy + hh, cz + hd], [cx + hw, cy - hh, cz + hd]],
        [[cx + hw, cy - hh, cz - hd], [cx + hw, cy + hh, cz - hd], [cx - hw, cy + hh, cz - hd], [cx - hw, cy - hh, cz - hd]],
        [[cx - hw, cy - hh, cz - hd], [cx - hw, cy + hh, cz - hd], [cx - hw, cy + hh, cz + hd], [cx - hw, cy - hh, cz + hd]],
        [[cx + hw, cy - hh, cz + hd], [cx + hw, cy + hh, cz + hd], [cx + hw, cy + hh, cz - hd], [cx + hw, cy - hh, cz - hd]],
      ];
      fs.forEach(f => addFace(f, col, label, subsystemKey, spec || 20));
    };

    const roundBox = (
      cx: number, cy: number, cz: number,
      w: number, h: number, d: number, rr: number,
      col: string, label: string, subsystemKey: string, spec?: number
    ) => {
      box(cx, cy, cz, w - rr * 2, h, d, col, label, subsystemKey, spec);
      box(cx, cy, cz, w, h - rr * 2, d, col, label, subsystemKey, spec);
      box(cx, cy, cz, w, h, d - rr * 2, col, label, subsystemKey, spec);
    };

    const BORE = 85 * S, STR = 96 * S, CR = STR / 2, RL = 160 * S;
    const BP = 104 * S, BL = 440 * S, BW = 200 * S, DH = 247 * S;
    const LH = 155 * S, LOD = 93 * S, PH = 85 * S;
    const MJD = 72 * S, CPD = 54 * S, HDW = 190 * S, HDH = 80 * S, FWD = 310 * S;
    const cylX = [-1.5, -0.5, 0.5, 1.5].map(i => i * BP);
    const cOff = [0, Math.PI, Math.PI, 0];

    const buildModel = () => {
      faces.length = 0;
      const eF = animStateRef.current.exploded;
      const cAngle = animStateRef.current.cAngle;
      const bBot = -MJD / 2 - 20 * S, bTop = DH - CR + 3 * S;

      // 1. CYLINDER BLOCK
      if (visibleSubsystems.block) {
        roundBox(0, (bBot + bTop) / 2, 0, BL, bTop - bBot, BW, 6 * S, '#5c5f68', 'Cylinder Block (440×200 mm Cast Iron)', 'block', 18);
        for (let i = 0; i < 4; i++) {
          cylinder(cylX[i], bTop - LH + eF * 0.12, 0, LOD / 2, LH, SEG_HI, '#484c55', `Wet Liner #${i + 1} (Ø 85 mm)`, 'block', 'y', 22);
          cylinder(cylX[i], bTop - LH + eF * 0.12, 0, BORE / 2, LH, SEG_HI, '#35383f', `Bore #${i + 1}`, 'block', 'y', 15);
        }
        for (let i = 0; i < 5; i++) {
          const cx = -2 * BP + i * BP;
          box(cx, -MJD / 2 - 22 * S - eF * 0.25, 0, 38 * S, 22 * S, MJD * 1.15, '#4a4d55', `Main Bearing Cap #${i + 1}`, 'block', 20);
        }
        box(-BL / 2 - 6 * S, (bBot + bTop) / 2 - 0.1, 0, 10 * S, bTop - bBot - 0.08, BW * 0.88, '#50535b', 'Front Timing Cover', 'block', 18);
      }

      // 2. CRANKSHAFT
      if (visibleSubsystems.crank) {
        const cc = '#b0b4be';
        for (let i = 0; i < 5; i++) {
          const jx = -2 * BP + i * BP;
          cylinder(jx - 14 * S, 0, 0, MJD / 2, 28 * S, SEG_HI, cc, `Main Journal #${i + 1} (Ø 72 mm)`, 'crank', 'x', 50);
        }
        for (let i = 0; i < 4; i++) {
          const ph = cOff[i] + cAngle;
          const py = Math.sin(ph) * CR, pz = Math.cos(ph) * CR;
          cylinder(cylX[i] - 12 * S, py - CPD / 2 * 0.01, pz, CPD / 2, 24 * S, SEG_MED, '#c0c4ce', `Crankpin #${i + 1} (Ø 54 mm)`, 'crank', 'x', 55);
          tube([cylX[i] - 14 * S, 0, 0], [cylX[i] - 14 * S, py, pz], 11 * S, SEG_MED, '#8a8e98', `Crank Web #${i + 1}`, 'crank', 40);
          tube([cylX[i] + 14 * S, 0, 0], [cylX[i] + 14 * S, py, pz], 11 * S, SEG_MED, '#8a8e98', `Crank Web #${i + 1}`, 'crank', 40);
          const cwy = -Math.sin(ph) * CR * 0.72, cwz = -Math.cos(ph) * CR * 0.72;
          cylinder(cylX[i] - 16 * S, cwy - 8 * S, cwz, 18 * S, 32 * S, SEG_MED, '#70747e', 'Crank Counterweight', 'crank', 'x', 30);
        }
        cylinder(-BL / 2 - 18 * S - eF * 0.15, 0, 0, 13 * S, 36 * S, SEG_MED, '#a0a4ae', 'Crankshaft Nose', 'crank', 'x', 45);
        cylinder(-BL / 2 - 30 * S - eF * 0.18, 0, 0, 28 * S, 8 * S, SEG_HI, '#3a3d45', 'Torsional Damper Pulley', 'crank', 'x', 25);
      }

      // 3. CON RODS & PISTONS
      if (visibleSubsystems.rods) {
        for (let i = 0; i < 4; i++) {
          const ph = cOff[i] + cAngle;
          const pinY = Math.sin(ph) * CR, pinZ = Math.cos(ph) * CR;
          const pisY = CR * Math.sin(ph) + Math.sqrt(RL * RL - CR * CR * Math.cos(ph) * Math.cos(ph));

          tube([cylX[i], pinY - eF * 0.08, pinZ], [cylX[i], pisY - PH / 2 + 18 * S + eF * 0.12, 0], 7 * S, SEG_MED, '#c49a50', `Connecting Rod #${i + 1} (Forged Steel)`, 'rods', 40);
          cylinder(cylX[i] - 16 * S, pinY - 12 * S - eF * 0.12, pinZ, 22 * S, 32 * S, SEG_MED, '#a07830', `Rod Cap #${i + 1}`, 'rods', 'x', 35);
          cylinder(cylX[i], pisY - PH / 2 + eF * 0.16, 0, BORE / 2 - 1.5 * S, PH, SEG_HI, '#9598a0', `Piston #${i + 1} (Aluminum Crown)`, 'rods', 'y', 45);
          cylinder(cylX[i], pisY + PH / 2 - 3 * S + eF * 0.16, 0, BORE / 2 - 2 * S, 3 * S, SEG_HI, '#85888f', 'Piston Crown Top', 'rods', 'y', 40);
          cylinder(cylX[i] - 41 * S, pisY - PH / 2 + 18 * S + eF * 0.18, 0, 33.8 * S / 2, 82 * S, SEG_MED, '#c0c3cb', `Gudgeon Pin #${i + 1}`, 'rods', 'x', 55);
          for (let r = 0; r < 3; r++) {
            const ry = pisY + PH / 2 - (r + 1) * 9 * S + eF * 0.18;
            cylinder(cylX[i], ry, 0, BORE / 2 + 0.5 * S, 3.8 * S, SEG_HI, '#303338', `Compression Ring ${r + 1}/3`, 'rods', 'y', 60);
          }
        }
      }

      // 4. FLYWHEEL
      if (visibleSubsystems.fly) {
        const fx = BL / 2 + 12 * S + eF * 0.35;
        cylinder(fx, 0, 0, FWD / 2, 22 * S, SEG_HI, '#404348', 'Flywheel (310 mm OD)', 'fly', 'x', 25);
        cylinder(fx - 2 * S, 0, 0, FWD / 2 + 5 * S, 26 * S, 32, '#333640', 'Starter Ring Gear', 'fly', 'x', 30);
        cylinder(fx + 1 * S, 0, 0, 30 * S, 18 * S, SEG_MED, '#50535b', 'Flywheel Hub (6x M10)', 'fly', 'x', 35);
      }

      // 5. CYLINDER HEAD
      if (visibleSubsystems.head) {
        const hb = bTop + eF * 0.3;
        box(0, hb + 1 * S, 0, BL, 2.5 * S, HDW, '#70737b', 'Multi-Layer Steel Head Gasket', 'head', 15);
        roundBox(0, hb + HDH / 2 + 3 * S, 0, BL, HDH, HDW, 5 * S, '#7a7e88', 'DOHC Aluminum Cylinder Head', 'head', 22);
        for (let i = 0; i < 4; i++) {
          cylinder(cylX[i], hb + 2 * S, 0, BORE / 2 - 2 * S, 12 * S, SEG_HI, '#2a2d34', `Combustion Chamber #${i + 1}`, 'head', 'y', 10);
        }
        roundBox(0, hb + HDH + 18 * S + eF * 0.12, 0, BL * 0.93, 30 * S, HDW * 0.82, 4 * S, '#55585f', 'Cam Rocker Cover', 'head', 18);
        cylinder(BL * 0.25, hb + HDH + 34 * S + eF * 0.13, 0, 12 * S, 10 * S, SEG_MED, '#444750', 'Engine Oil Filler Cap', 'head', 'y', 20);
      }

      // 6. CAMSHAFTS
      if (visibleSubsystems.cam) {
        const hb = bTop + eF * 0.3;
        const camY = hb + HDH - 12 * S + eF * 0.08;
        const camA = cAngle / 2;
        tube([-BL / 2 + 8 * S, camY, -38 * S], [BL / 2 - 8 * S, camY, -38 * S], 12 * S, SEG_MED, '#78808a', 'Intake Camshaft (DOHC 1/2 Crank Speed)', 'cam', 40);
        tube([-BL / 2 + 8 * S, camY, 38 * S], [BL / 2 - 8 * S, camY, 38 * S], 12 * S, SEG_MED, '#78808a', 'Exhaust Camshaft (DOHC 1/2 Crank Speed)', 'cam', 40);
        for (let i = 0; i < 4; i++) {
          const lp = cOff[i] / 2 + camA;
          const intLift = Math.max(0, Math.sin(lp)) * 5 * S;
          const exhLift = Math.max(0, Math.sin(lp + Math.PI * 0.4)) * 5 * S;
          for (let v = -1; v <= 1; v += 2) {
            cylinder(cylX[i] + v * 6 * S, camY - 7 * S + intLift, -38 * S, 14 * S, 14 * S, SEG_MED, '#5a8a5a', `Intake Cam Lobe Cyl #${i + 1}`, 'cam', 'y', 25);
          }
          for (let v = -1; v <= 1; v += 2) {
            cylinder(cylX[i] + v * 6 * S, camY - 7 * S + exhLift, 38 * S, 14 * S, 14 * S, SEG_MED, '#8a5a5a', `Exhaust Cam Lobe Cyl #${i + 1}`, 'cam', 'y', 25);
          }
        }
        const chX = -BL / 2 - 4 * S - eF * 0.1;
        tube([chX, 0, 0], [chX, camY, -38 * S], 2.5 * S, 8, '#4a4d55', 'Timing Chain Track (Crank to Intake)', 'cam', 20);
        tube([chX, 0, 0], [chX, camY, 38 * S], 2.5 * S, 8, '#4a4d55', 'Timing Chain Track (Crank to Exhaust)', 'cam', 20);
        tube([chX, camY, -38 * S], [chX, camY, 38 * S], 2.5 * S, 8, '#4a4d55', 'Cam-to-Cam Synchronizer Chain', 'cam', 20);
        cylinder(chX, camY, -38 * S, 16 * S, 8 * S, SEG_MED, '#60636b', 'Intake Cam Sprocket', 'cam', 'x', 30);
        cylinder(chX, camY, 38 * S, 16 * S, 8 * S, SEG_MED, '#60636b', 'Exhaust Cam Sprocket', 'cam', 'x', 30);
        cylinder(chX, 0, 0, 10 * S, 8 * S, SEG_MED, '#60636b', 'Crankshaft Drive Sprocket', 'cam', 'x', 30);
      }

      // 7. VALVES & SPRINGS
      if (visibleSubsystems.vlv) {
        const hb = bTop + eF * 0.3;
        const vBase = hb + 8 * S;
        for (let i = 0; i < 4; i++) {
          const lp = cOff[i] / 2 + cAngle / 2;
          for (let v = 0; v < 2; v++) {
            const lift = Math.max(0, Math.sin(lp)) * 8 * S;
            const vx = cylX[i] + (v - 0.5) * 12 * S, vz = -22 * S;
            tube([vx, vBase - lift, vz], [vx, vBase + 48 * S, vz], 3 * S, 10, '#5580b8', `Intake Valve ${i * 2 + v + 1}`, 'vlv', 50);
            cylinder(vx, vBase - lift - 2 * S, vz, 14.5 * S, 2.5 * S, SEG_MED, '#4a70a8', 'Intake Valve Head', 'vlv', 'y', 45);
            for (let s = 0; s < 6; s++) {
              const sy = vBase + 12 * S + s * (36 * S - lift) / 6;
              cylinder(vx, sy, vz, 13 * S - s * 0.3 * S, 5 * S, 8, '#4068a0', 'Valve Return Spring', 'vlv', 'y', 20);
            }
          }
          for (let v = 0; v < 2; v++) {
            const lift = Math.max(0, Math.sin(lp + Math.PI * 0.4)) * 8 * S;
            const vx = cylX[i] + (v - 0.5) * 12 * S, vz = 22 * S;
            tube([vx, vBase - lift, vz], [vx, vBase + 48 * S, vz], 3 * S, 10, '#b05848', `Exhaust Valve ${i * 2 + v + 1}`, 'vlv', 50);
            cylinder(vx, vBase - lift - 2 * S, vz, 12.5 * S, 2.5 * S, SEG_MED, '#a04838', 'Exhaust Valve Head', 'vlv', 'y', 45);
            for (let s = 0; s < 6; s++) {
              const sy = vBase + 12 * S + s * (36 * S - lift) / 6;
              cylinder(vx, sy, vz, 13 * S - s * 0.3 * S, 5 * S, 8, '#a05040', 'Exhaust Valve Spring', 'vlv', 'y', 20);
            }
          }
        }
      }

      // 8. INTAKE MANIFOLD
      if (visibleSubsystems.intk) {
        const hb = bTop + eF * 0.3;
        const iY = hb + HDH / 2, iZ = -HDW / 2 - 28 * S - eF * 0.45;
        roundBox(0, iY + 12 * S, iZ - 18 * S, BL * 0.65, 38 * S, 45 * S, 3 * S, '#3a70c0', 'Intake Plenum Chamber', 'intk', 25);
        for (let i = 0; i < 4; i++) {
          tube([cylX[i], iY, iZ], [cylX[i], iY, -HDW / 2], 16 * S, SEG_MED, '#4580d0', `Intake Runner #${i + 1}`, 'intk', 30);
        }
        cylinder(-BL * 0.35, iY + 10 * S, iZ - 40 * S, 20 * S, 20 * S, SEG_MED, '#3068b0', 'Drive-by-Wire Throttle Body', 'intk', 'z', 30);
      }

      // 9. EXHAUST MANIFOLD
      if (visibleSubsystems.exh) {
        const hb = bTop + eF * 0.3;
        const eY = hb + HDH / 2, eZ = HDW / 2 + 18 * S + eF * 0.45;
        for (let i = 0; i < 4; i++) {
          tube([cylX[i], eY, HDW / 2], [cylX[i], eY, eZ + 12 * S], 16 * S, SEG_MED, '#c04538', `Exhaust Runner #${i + 1}`, 'exh', 30);
        }
        tube([cylX[0], eY, eZ + 12 * S], [0, eY + 8 * S, eZ + 35 * S], 14 * S, SEG_MED, '#b03a30', 'Exhaust Collector Pair 1-2', 'exh', 28);
        tube([cylX[3], eY, eZ + 12 * S], [0, eY + 8 * S, eZ + 35 * S], 14 * S, SEG_MED, '#b03a30', 'Exhaust Collector Pair 3-4', 'exh', 28);
        tube([0, eY + 8 * S, eZ + 35 * S], [BL * 0.2, eY, eZ + 55 * S + eF * 0.2], 18 * S, SEG_MED, '#a03328', 'Turbine Inlet Header Pipe', 'exh', 28);
      }

      // 10. TURBOCHARGER
      if (visibleSubsystems.turbo) {
        const hb = bTop + eF * 0.3;
        const tY = hb + HDH / 2, tZ = HDW / 2 + 75 * S + eF * 0.7, tX = BL * 0.2;
        cylinder(tX, tY, tZ, 28 * S, 45 * S, SEG_HI, '#6a50a8', 'VGT Turbine Scroll Housing', 'turbo', 'x', 30);
        roundBox(tX, tY, tZ - 35 * S, 36 * S, 32 * S, 30 * S, 2 * S, '#5a4890', 'Turbo Center Bearing Housing', 'turbo', 28);
        cylinder(tX, tY, tZ - 65 * S, 30 * S, 50 * S, SEG_HI, '#5060b0', 'Compressor Scroll Housing', 'turbo', 'x', 32);
        tube([tX, tY, tZ + 22 * S], [tX, tY, tZ - 65 * S], 3.5 * S, 10, '#9080c0', 'High-Speed Turbine Shaft', 'turbo', 50);
        box(tX + 28 * S, tY + 18 * S, tZ, 22 * S, 16 * S, 16 * S, '#7050a0', 'VGT Electronic Actuator', 'turbo', 22);
        tube([tX + 28 * S, tY + 10 * S, tZ], [tX + 5 * S, tY + 5 * S, tZ], 2 * S, 6, '#8070b0', 'VGT Vane Actuator Linkage', 'turbo', 20);
        if (visibleSubsystems.intk) {
          tube([tX, tY, tZ - 90 * S], [0, tY + 25 * S, -HDW / 2 - 55 * S - eF * 0.45], 8 * S, SEG_LO, '#4090d0', 'Intercooler Boost Charge Pipe', 'turbo', 25);
          roundBox(0, tY + 25 * S, -HDW / 2 - 95 * S - eF * 0.6, 160 * S, 55 * S, 22 * S, 2 * S, '#3880c0', 'Air-to-Air Intercooler Core', 'turbo', 25);
        }
      }

      // 11. FUEL SYSTEM
      if (visibleSubsystems.fuel) {
        const hb = bTop + eF * 0.3;
        const fY = hb + HDH + 8 * S + eF * 0.15;
        tube([-BL / 2 + 28 * S, fY + 18 * S, -45 * S], [BL / 2 - 28 * S, fY + 18 * S, -45 * S], 11 * S, SEG_MED, '#30a050', '2000-Bar Common Rail Manifold', 'fuel', 35);
        cylinder(-BL / 2 + 22 * S, fY + 18 * S, -45 * S, 8 * S, 8 * S, SEG_MED, '#28904a', 'Rail High-Pressure Sensor', 'fuel', 'x', 30);
        for (let i = 0; i < 4; i++) {
          tube([cylX[i], hb + 5 * S, 0], [cylX[i], fY + 12 * S, 0], 9.5 * S / 2, SEG_MED, '#40b860', `Piezo Fuel Injector #${i + 1}`, 'fuel', 40);
          tube([cylX[i], fY + 18 * S, -45 * S], [cylX[i], fY + 8 * S, -15 * S], 3 * S, 8, '#60d880', `HP Fuel Line #${i + 1}`, 'fuel', 30);
          tube([cylX[i], fY + 8 * S, -15 * S], [cylX[i], fY + 8 * S, 0], 3 * S, 8, '#60d880', '', 'fuel', 30);
          box(cylX[i], fY + 2 * S, 0, 16 * S, 4 * S, 22 * S, '#388a48', 'Injector Retaining Clamp', 'fuel', 18);
        }
        roundBox(-BL / 2 - 28 * S - eF * 0.25, fY - 5 * S, -28 * S, 48 * S, 55 * S, 38 * S, 2 * S, '#20804a', 'High-Pressure Fuel Pump (Cam-Driven)', 'fuel', 22);
        cylinder(-BL / 2 - 75 * S - eF * 0.4, fY - 28 * S, -28 * S, 40 * S / 2, 60 * S, SEG_MED, '#28a858', 'Fuel Water Separator & Filter', 'fuel', 'y', 28);
        tube([-BL / 2 - 75 * S - eF * 0.4, fY - 5 * S, -28 * S], [-BL / 2 - 28 * S - eF * 0.25, fY - 5 * S, -28 * S], 4 * S, 8, '#50c070', 'LP Fuel Feed Line', 'fuel', 22);
      }

      // 12. OIL SYSTEM & LUBRICATION
      if (visibleSubsystems.oil) {
        const pTop = -MJD / 2 - 28 * S;
        roundBox(0, pTop - 42 * S - eF * 0.35, 0, BL, 80 * S, BW * 1.25, 4 * S, '#b0a030', 'Oil Sump & Wet Pan (6 Liter)', 'oil', 18);
        cylinder(0, pTop - 82 * S - eF * 0.35, 0, 8 * S, 6 * S, SEG_MED, '#908020', 'Magnetic Sump Drain Plug', 'oil', 'y', 25);
        tube([BL * 0.2, pTop - 65 * S - eF * 0.35, 0], [BL * 0.2, pTop - 20 * S - eF * 0.35, 28 * S], 4.5 * S, 8, '#c8b840', 'Oil Pickup Tube & Strainer', 'oil', 25);
        cylinder(BL * 0.2, pTop - 68 * S - eF * 0.35, 0, 18 * S, 5 * S, SEG_MED, '#a09028', 'Oil Scavenge Strainer Screen', 'oil', 'y', 18);
        cylinder(BL / 2 + 8 * S, -25 * S, -BW / 2 - 8 * S - eF * 0.25, 38 * S, 45 * S, SEG_MED, '#d0c040', 'Full-Flow Spin-On Oil Filter', 'oil', 'z', 30);
        roundBox(-BL / 2 - 3 * S, -8 * S, 0, 28 * S, 28 * S, 36 * S, 2 * S, '#a09028', 'Engine Oil Pump (Gerotor)', 'oil', 20);
        box(BL / 2 + 12 * S, -5 * S, -BW / 2 - 28 * S - eF * 0.25, 38 * S, 38 * S, 14 * S, '#b8a838', 'Oil Thermostatic Cooler Block', 'oil', 22);
      }

      // 13. PSRU & PROPELLER
      if (visibleSubsystems.psru) {
        const px = BL / 2 + 55 * S + eF * 0.55;
        roundBox(px + 35 * S, 18 * S, 0, 75 * S, 120 * S, 120 * S, 4 * S, '#d07828', 'PSRU Reduction Gearbox Housing', 'psru', 20);
        tube([BL / 2 + 18 * S + eF * 0.35, 0, 0], [px, 0, 0], 14 * S, SEG_MED, '#c06828', 'PSRU Input Drive Shaft', 'psru', 40);
        cylinder(px + 20 * S, 0, 0, 22 * S, 15 * S, SEG_MED, '#a05820', 'Input Reduction Pinion', 'psru', 'x', 35);
        const outY = 45 * S;
        cylinder(px + 20 * S, outY, 0, 35 * S, 15 * S, SEG_MED, '#c07030', 'Output Bull Gear (0.5:1 Ratio)', 'psru', 'x', 35);
        tube([px + 18 * S, outY, 0], [px + 110 * S + eF * 0.25, outY, 0], 18 * S, SEG_MED, '#e08838', 'Propeller Output Shaft', 'psru', 42);
        cylinder(px + 115 * S + eF * 0.28, outY, 0, 75 * S / 2, 18 * S, SEG_HI, '#c07838', 'Torsional Vibration Damper', 'psru', 'x', 25);
        cylinder(px + 135 * S + eF * 0.35, outY, 0, 55 * S / 2, 12 * S, SEG_HI, '#d89848', 'Propeller Mounting Flange', 'psru', 'x', 38);
        cylinder(px + 150 * S + eF * 0.4, outY, 0, 22 * S, 16 * S, SEG_MED, '#e0a858', 'Variable-Pitch Propeller Hub', 'psru', 'x', 35);

        const pA = cAngle * 0.5;
        const pX = px + 165 * S + eF * 0.48;
        for (let b = 0; b < 3; b++) {
          const ba = pA + b * (Math.PI * 2) / 3;
          const bLen = 180 * S;
          const steps = 6;
          for (let s = 0; s < steps; s++) {
            const t0 = s / steps, t1 = (s + 1) / steps;
            const r0 = bLen * t0, r1 = bLen * t1;
            const w0 = (1 - t0 * 0.6) * 8 * S;
            const p0: [number, number, number] = [pX, outY + Math.sin(ba) * r0, Math.cos(ba) * r0];
            const p1: [number, number, number] = [pX, outY + Math.sin(ba) * r1, Math.cos(ba) * r1];
            tube(p0, p1, w0, 6, '#d8a858', `Propeller Blade #${b + 1}`, 'psru', 28);
          }
        }
      }

      // 14. ELECTRICAL & FADEC
      if (visibleSubsystems.elec) {
        const hb = bTop + eF * 0.3;
        roundBox(0, hb + HDH + 55 * S + eF * 0.2, -HDW / 2 - 35 * S, 95 * S, 28 * S, 60 * S, 2 * S, '#d060a0', 'Dual-Lane Aerospace FADEC ECU', 'elec', 22);
        box(35 * S, hb + HDH + 55 * S + eF * 0.2, -HDW / 2 - 35 * S, 12 * S, 10 * S, 8 * S, '#e080b8', 'Mil-Spec FADEC Wiring Connector', 'elec', 18);
        cylinder(-BL / 2 - 16 * S - eF * 0.15, 25 * S, BW / 2 + 8 * S + eF * 0.25, 55 * S / 2, 45 * S, SEG_MED, '#c058a0', '28V High-Output Alternator', 'elec', 'z', 30);
        cylinder(BL / 2 + 3 * S, -MJD / 2 - 15 * S, BW / 2 + 6 * S + eF * 0.25, 40 * S / 2, 105 * S, SEG_MED, '#b048a0', 'Electric Starter Motor', 'elec', 'x', 28);
        tube([-BL / 2 - 28 * S, 0, 18 * S], [-BL / 2 - 16 * S, 25 * S, BW / 2 + 28 * S + eF * 0.25], 2 * S, 6, '#d878b8', 'Alternator Serpentine Drive Belt', 'elec', 20);
        tube([0, hb + HDH + 55 * S + eF * 0.2, -HDW / 2 - 35 * S], [cylX[1], hb + HDH / 2 + eF * 0.3, 0], 1.5 * S, 4, '#e898c8', 'Shielded Sensor Wiring Harness', 'elec', 15);
        tube([0, hb + HDH + 55 * S + eF * 0.2, -HDW / 2 - 35 * S], [cylX[2], hb + HDH / 2 + eF * 0.3, 0], 1.5 * S, 4, '#e898c8', 'Shielded Sensor Wiring Harness', 'elec', 15);
      }

      // 15. COOLING SYSTEM
      if (visibleSubsystems.cool) {
        const hb = bTop + eF * 0.3;
        cylinder(-BL / 2 - 20 * S - eF * 0.15, 55 * S, -35 * S, 28 * S, 28 * S, SEG_MED, '#30a8b8', 'Centrifugal Engine Water Pump', 'cool', 'x', 30);
        roundBox(-BL / 2 - 20 * S - eF * 0.15, 55 * S, -35 * S, 36 * S, 36 * S, 28 * S, 2 * S, '#28909e', 'Water Pump Impeller Housing', 'cool', 22);
        roundBox(BL * 0.2, hb + HDH + 4 * S + eF * 0.12, -HDW * 0.3, 28 * S, 22 * S, 22 * S, 2 * S, '#38b8c8', 'Dual-Stage Thermostat Housing', 'cool', 25);
        tube([-BL / 2 - 20 * S, 68 * S, -35 * S], [-BL / 2 - 10 * S, hb + 15 * S + eF * 0.3, -35 * S], 7 * S, SEG_LO, '#48c8d8', 'Reinforced Silicone Coolant Hose', 'cool', 22);
        tube([BL * 0.2, hb + HDH + 4 * S + eF * 0.12, -HDW * 0.3], [BL * 0.35, hb + HDH + 30 * S + eF * 0.15, -HDW * 0.4], 6 * S, 8, '#48c8d8', 'Upper Radiator Return Hose', 'cool', 22);
      }
    };

    const render = (time: number) => {
      const dt = (time - animStateRef.current.lastTime) / 1000;
      animStateRef.current.lastTime = time;

      if (animStateRef.current.playing) {
        const rpm = animStateRef.current.rpm;
        animStateRef.current.cAngle += (rpm / 60) * Math.PI * 2 * dt;
      }

      ctx.clearRect(0, 0, width, height);

      const grd = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
      grd.addColorStop(0, '#0a101d');
      grd.addColorStop(1, '#050811');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, width, height);

      ctx.globalAlpha = 0.08;
      for (let i = -20; i <= 20; i++) {
        const s = 0.2;
        const a = project([i * s, -1.35, -4.5]);
        const b = project([i * s, -1.35, 4.5]);
        const c = project([-4.5, -1.35, i * s]);
        const d = project([4.5, -1.35, i * s]);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.5;
        if (a && b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        if (c && d) { ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;

      buildModel();
      faces.sort((a, b) => b.depth - a.depth);

      for (let i = 0; i < faces.length; i++) {
        const f = faces[i];
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.moveTo(f.pts[0].x, f.pts[0].y);
        for (let j = 1; j < f.pts.length; j++) ctx.lineTo(f.pts[j].x, f.pts[j].y);
        ctx.closePath();
        ctx.fill();

        if (f.isFlagged) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
          ctx.lineWidth = 0.9;
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }

      const ao = project([-2.0, -1.1, 0]);
      const ax = project([-1.85, -1.1, 0]);
      const ay = project([-2.0, -0.95, 0]);
      const az = project([-2.0, -1.1, 0.15]);
      if (ao && ax && ay && az) {
        ctx.lineWidth = 1.8;
        ctx.font = 'bold 9px monospace';
        ctx.strokeStyle = '#ef4444'; ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.moveTo(ao.x, ao.y); ctx.lineTo(ax.x, ax.y); ctx.stroke();
        ctx.fillText('X', ax.x + 2, ax.y + 3);
        ctx.strokeStyle = '#10b981'; ctx.fillStyle = '#10b981';
        ctx.beginPath(); ctx.moveTo(ao.x, ao.y); ctx.lineTo(ay.x, ay.y); ctx.stroke();
        ctx.fillText('Y', ay.x + 2, ay.y - 2);
        ctx.strokeStyle = '#38bdf8'; ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.moveTo(ao.x, ao.y); ctx.lineTo(az.x, az.y); ctx.stroke();
        ctx.fillText('Z', az.x + 2, az.y + 3);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    let isDragging = false;
    let startX = 0, startY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const cam = cameraRef.current;
        if (e.shiftKey) {
          cam.panX += dx * 0.004;
          cam.panY -= dy * 0.004;
        } else {
          cam.yaw += dx * 0.005;
          cam.pitch = Math.max(-1.45, Math.min(1.45, cam.pitch + dy * 0.005));
        }
        startX = e.clientX;
        startY = e.clientY;
      } else {
        let foundLabel: string | null = null;
        let foundSubsystem: string | null = null;
        for (let i = faces.length - 1; i >= 0; i--) {
          const f = faces[i];
          let inside = false;
          for (let j = 0, k = f.pts.length - 1; j < f.pts.length; k = j++) {
            const yi = f.pts[j].y, yk = f.pts[k].y;
            const xi = f.pts[j].x, xk = f.pts[k].x;
            if ((yi > my) !== (yk > my) && mx < ((xk - xi) * (my - yi)) / (yk - yi) + xi) {
              inside = !inside;
            }
          }
          if (inside && f.label) {
            foundLabel = f.label;
            foundSubsystem = f.subsystemKey;
            break;
          }
        }
        setHoveredLabel(foundLabel);
        setHoveredSubsystem(foundSubsystem);
      }
    };

    const onMouseUp = () => { isDragging = false; };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = cameraRef.current;
      cam.dist = Math.max(1.8, Math.min(14, cam.dist + e.deltaY * 0.003));
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [visibleSubsystems, flaggedSubsystems]);

  const cAngle = animStateRef.current.cAngle;
  const strokes = ['INTAKE', 'COMPR', 'POWER', 'EXHAUST'];
  const cylinderStrokes = [1, 2, 3, 4].map(c => {
    const cOff = [0, Math.PI, Math.PI, 0];
    const ph = cOff[c - 1] + cAngle;
    const deg = ((ph * 180 / Math.PI) % 720 + 720) % 720;
    return {
      cyl: c,
      stroke: strokes[Math.floor(deg / 180)],
      deg: Math.floor(deg)
    };
  });

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[580px] rounded-xl overflow-hidden border border-cyan-500/25 bg-[#070B14] flex flex-col justify-between select-none shadow-[0_0_25px_rgba(0,240,255,0.06)]"
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Top Left: Subsystem Spec & Live Alert */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none max-w-sm">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold tracking-wider">
            TAPAS-BH AERO-DIESEL
          </div>
          <span className="text-[10px] font-mono text-slate-400">2.2L 4-Cyl Turbodiesel</span>
        </div>

        {isAnomaly ? (
          <div className="px-2.5 py-1 rounded-md bg-red-500/20 border border-red-500/50 text-red-300 text-[11px] font-mono font-bold flex items-center gap-1.5 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.35)] pointer-events-auto">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>ALERT: {faultType.replace(/_/g, ' ').toUpperCase()} (3D Pulsing Active)</span>
          </div>
        ) : (
          <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Digital Twin Kinematics Nominal</span>
          </div>
        )}
      </div>

      {/* Top Right: Live RPM & Cylinder Stroke Cycle */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10 pointer-events-none font-mono text-right">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-cyan-400 font-bold tracking-wider">
            {(telemetry?.rpm ?? 1500).toFixed(0)} RPM
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-purple-300 uppercase">
            {telemetry?.flight_phase ?? 'CRUISE'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 text-[9px]">
          {cylinderStrokes.map(s => (
            <span 
              key={s.cyl}
              className={`px-1.5 py-0.5 rounded ${
                s.stroke === 'POWER' ? 'bg-amber-500/20 text-amber-300 font-bold' :
                s.stroke === 'COMPR' ? 'bg-cyan-500/10 text-cyan-300' :
                s.stroke === 'INTAKE' ? 'bg-blue-500/10 text-blue-300' : 'bg-red-500/10 text-red-300'
              }`}
            >
              C{s.cyl}: {s.stroke}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[9px] text-slate-400">
          <span className="flex items-center gap-0.5"><Flame className="w-2.5 h-2.5 text-amber-400" /> CHT: {(telemetry?.cht ?? 175).toFixed(0)}°C</span>
          <span className="flex items-center gap-0.5"><Flame className="w-2.5 h-2.5 text-red-400" /> EGT: {(telemetry?.egt ?? 620).toFixed(0)}°C</span>
          <span className="flex items-center gap-0.5"><Droplet className="w-2.5 h-2.5 text-cyan-400" /> Oil: {(telemetry?.oil_pressure ?? 5.2).toFixed(1)} bar</span>
        </div>
      </div>

      {/* Bottom Left Controls */}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 z-10">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 border transition ${
            isPlaying 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]' 
              : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>{isPlaying ? 'RUNNING' : 'PAUSED'}</span>
        </button>

        <button
          onClick={() => setIsCutaway(!isCutaway)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 border transition ${
            isCutaway 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
              : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Eye className="w-3 h-3" />
          <span>CUTAWAY</span>
        </button>

        <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800 text-[10px] font-mono text-slate-300">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>EXPLODE:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={explosionFactor}
            onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
            className="w-20 accent-cyan-400 cursor-pointer h-1.5"
          />
          <span className="w-6 text-right text-cyan-300">{Math.round(explosionFactor * 100)}%</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-md border border-slate-800">
          <button onClick={() => setCameraPreset(0.6, -0.35, 5.5)} className="px-1.5 py-0.5 text-[9px] font-mono rounded text-slate-400 hover:text-white hover:bg-slate-800">ISO</button>
          <button onClick={() => setCameraPreset(0, -0.2, 5.0)} className="px-1.5 py-0.5 text-[9px] font-mono rounded text-slate-400 hover:text-white hover:bg-slate-800">FRONT</button>
          <button onClick={() => setCameraPreset(Math.PI / 2, -0.2, 5.0)} className="px-1.5 py-0.5 text-[9px] font-mono rounded text-slate-400 hover:text-white hover:bg-slate-800">SIDE</button>
          <button onClick={() => setCameraPreset(0, -1.3, 5.0)} className="px-1.5 py-0.5 text-[9px] font-mono rounded text-slate-400 hover:text-white hover:bg-slate-800">TOP</button>
        </div>

        <button
          onClick={() => setShowSubsystemMenu(!showSubsystemMenu)}
          className={`p-1.5 rounded-md text-[10px] font-mono border transition ${
            showSubsystemMenu 
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' 
              : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
          }`}
          title="Toggle 15 Subsystems Visibility"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Right Hover Inspection */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none text-right font-mono max-w-sm">
        {hoveredLabel ? (
          <div className="bg-slate-950/90 border border-cyan-500/40 rounded-lg p-2 shadow-[0_0_15px_rgba(0,240,255,0.15)] text-[11px]">
            <div className="flex items-center justify-end gap-1.5 text-cyan-300 font-bold">
              <span>🔍 {hoveredLabel}</span>
            </div>
            {hoveredSubsystem && (
              <div className="text-[9px] text-slate-400 mt-0.5">
                Subsystem: <span className="text-white capitalize">{SUBSYSTEM_INFO[hoveredSubsystem]?.label || hoveredSubsystem}</span>
                {flaggedSubsystems.has(hoveredSubsystem) && (
                  <span className="text-red-400 font-bold ml-1.5 animate-pulse">● ANOMALY ALERT</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-[9px] text-slate-500">
            🖱 Drag=Orbit • Scroll=Zoom • Shift+Drag=Pan • Hover=Inspect
          </div>
        )}
      </div>

      {/* Subsystem Toggles Drawer */}
      {showSubsystemMenu && (
        <div className="absolute bottom-12 left-3 bg-[#0c121e]/95 border border-cyan-500/30 rounded-xl p-3 z-20 w-64 shadow-2xl backdrop-blur-md max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
              Subsystem Filters
            </span>
            <button 
              onClick={() => {
                const allActive = Object.values(visibleSubsystems).every(v => v);
                const updated: Record<string, boolean> = {};
                Object.keys(visibleSubsystems).forEach(k => { updated[k] = !allActive; });
                setVisibleSubsystems(updated);
              }}
              className="text-[9px] font-mono text-slate-400 hover:text-white"
            >
              Toggle All
            </button>
          </div>
          <div className="space-y-1">
            {Object.entries(SUBSYSTEM_INFO).map(([key, info]) => {
              const isFlagged = flaggedSubsystems.has(key);
              return (
                <label 
                  key={key} 
                  className={`flex items-center justify-between text-[10px] font-mono cursor-pointer px-1.5 py-0.5 rounded transition ${
                    isFlagged ? 'bg-red-500/20 text-red-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="checkbox" 
                      checked={visibleSubsystems[key] ?? true}
                      onChange={(e) => setVisibleSubsystems(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="accent-cyan-400 w-3 h-3 rounded"
                    />
                    <span className="w-2 h-2 rounded-full" style={{ background: isFlagged ? '#EF4444' : info.color }} />
                    <span className="truncate">{info.label}</span>
                  </div>
                  {isFlagged && <span className="text-[8px] text-red-400 uppercase">Alert</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeEngineHologram;
