"use client";

import { useEffect, useRef, useState } from "react";
import { regionsOf, type Region } from "./muscle-map";

const BASE = 0x23272d;
const PRIMARY = 0xff6b1a;
const SECONDARY = 0xf5b83d;

type Part = { region?: Region; geo: "sphere" | "capsule" | "box"; size: number[]; pos: [number, number, number]; rot?: [number, number, number]; scale?: [number, number, number] };

/** Maniquí anatómico procedural (unidades ≈ metros, Y hacia arriba). Cada pieza puede pertenecer a una región muscular. */
function parts(): Part[] {
  const P: Part[] = [];
  const both = (fn: (s: 1 | -1) => Part) => [fn(1), fn(-1)];
  P.push({ geo: "sphere", size: [0.105], pos: [0, 1.66, 0], scale: [1, 1.12, 1.05] }); // cabeza
  P.push({ geo: "capsule", size: [0.05, 0.08], pos: [0, 1.52, -0.005] }); // cuello
  P.push({ region: "traps", geo: "box", size: [0.26, 0.07, 0.12], pos: [0, 1.47, -0.03], rot: [0.15, 0, 0] });
  P.push({ geo: "capsule", size: [0.15, 0.34], pos: [0, 1.2, 0], scale: [1.25, 1, 0.75] }); // tronco base
  P.push(...both((s) => ({ region: "chest", geo: "sphere", size: [0.095], pos: [0.085 * s, 1.33, 0.085], scale: [1.15, 0.8, 0.45] })));
  P.push({ region: "abs", geo: "box", size: [0.15, 0.24, 0.05], pos: [0, 1.1, 0.1] });
  P.push(...both((s) => ({ region: "obliques", geo: "box", size: [0.05, 0.2, 0.12], pos: [0.15 * s, 1.1, 0.04], rot: [0, 0, 0.12 * s] })));
  P.push(...both((s) => ({ region: "shoulders", geo: "sphere", size: [0.075], pos: [0.235 * s, 1.43, 0.01], scale: [1, 1.05, 1] })));
  P.push(...both((s) => ({ region: "reardelts", geo: "sphere", size: [0.055], pos: [0.225 * s, 1.43, -0.05] })));
  P.push({ region: "midback", geo: "box", size: [0.2, 0.17, 0.05], pos: [0, 1.33, -0.1] });
  P.push(...both((s) => ({ region: "lats", geo: "box", size: [0.09, 0.24, 0.06], pos: [0.13 * s, 1.2, -0.08], rot: [0, 0, -0.2 * s] })));
  P.push({ region: "lowerback", geo: "box", size: [0.16, 0.13, 0.05], pos: [0, 1.0, -0.085] });
  P.push(...both((s) => ({ region: "biceps", geo: "capsule", size: [0.042, 0.16], pos: [0.27 * s, 1.21, 0.025], rot: [0, 0, 0.08 * s] })));
  P.push(...both((s) => ({ region: "triceps", geo: "capsule", size: [0.045, 0.16], pos: [0.275 * s, 1.22, -0.03], rot: [0, 0, 0.08 * s] })));
  P.push(...both((s) => ({ region: "forearms", geo: "capsule", size: [0.038, 0.18], pos: [0.3 * s, 0.93, 0.01], rot: [0, 0, 0.05 * s] })));
  P.push(...both((s) => ({ geo: "sphere", size: [0.04], pos: [0.31 * s, 0.78, 0.01] }))); // manos
  P.push({ geo: "box", size: [0.3, 0.12, 0.17], pos: [0, 0.9, 0] }); // pelvis
  P.push(...both((s) => ({ region: "glutes", geo: "sphere", size: [0.09], pos: [0.075 * s, 0.88, -0.07], scale: [1, 1, 0.75] })));
  P.push(...both((s) => ({ region: "quads", geo: "capsule", size: [0.07, 0.3], pos: [0.1 * s, 0.6, 0.02] })));
  P.push(...both((s) => ({ region: "hamstrings", geo: "capsule", size: [0.06, 0.28], pos: [0.1 * s, 0.6, -0.04] })));
  P.push(...both((s) => ({ region: "adductors", geo: "capsule", size: [0.04, 0.2], pos: [0.045 * s, 0.66, 0] })));
  P.push(...both((s) => ({ geo: "capsule", size: [0.045, 0.28], pos: [0.1 * s, 0.24, 0.015] }))); // tibias
  P.push(...both((s) => ({ region: "calves", geo: "capsule", size: [0.052, 0.17], pos: [0.1 * s, 0.28, -0.035] })));
  P.push(...both((s) => ({ geo: "box", size: [0.08, 0.05, 0.2], pos: [0.1 * s, 0.03, 0.04] }))); // pies
  return P;
}

/** Vista 3D interactiva de los músculos que trabaja un ejercicio (arrastra para girar). */
export function Body3D({ primary, secondary, className }: { primary: string[]; secondary: string[]; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        if (disposed) return;
        const prim = regionsOf(primary);
        const sec = regionsOf(secondary);
        const w = el.clientWidth || 320;
        const h = el.clientHeight || 420;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
        el.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 20);
        camera.position.set(0, 1.0, 3.6);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x101114, 1.4));
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(1.5, 2.5, 2);
        scene.add(key);
        const rim = new THREE.PointLight(0xff6b1a, 6, 6);
        rim.position.set(-1.5, 1.4, -1.5);
        scene.add(rim);

        const mats = {
          base: new THREE.MeshStandardMaterial({ color: BASE, roughness: 0.55, metalness: 0.1 }),
          primary: new THREE.MeshStandardMaterial({ color: PRIMARY, emissive: PRIMARY, emissiveIntensity: 0.45, roughness: 0.35 }),
          secondary: new THREE.MeshStandardMaterial({ color: SECONDARY, emissive: SECONDARY, emissiveIntensity: 0.18, roughness: 0.45 }),
        };
        const body = new THREE.Group();
        const geos: { dispose: () => void }[] = [];
        for (const p of parts()) {
          const geo =
            p.geo === "sphere" ? new THREE.SphereGeometry(p.size[0], 32, 24) : p.geo === "capsule" ? new THREE.CapsuleGeometry(p.size[0], p.size[1], 8, 24) : new THREE.BoxGeometry(p.size[0], p.size[1], p.size[2], 2, 2, 2);
          geos.push(geo);
          const mat = p.region && prim.has(p.region) ? mats.primary : p.region && sec.has(p.region) ? mats.secondary : mats.base;
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(...p.pos);
          if (p.rot) mesh.rotation.set(...p.rot);
          if (p.scale) mesh.scale.set(...p.scale);
          body.add(mesh);
        }
        scene.add(body);
        const floor = new THREE.Mesh(new THREE.CircleGeometry(0.55, 48), new THREE.MeshBasicMaterial({ color: 0xff6b1a, transparent: true, opacity: 0.08 }));
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0.95, 0);
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.minPolarAngle = Math.PI * 0.25;
        controls.maxPolarAngle = Math.PI * 0.62;
        controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        controls.autoRotateSpeed = 1.6;
        controls.update();

        // solo se dibuja mientras está en pantalla (ahorra batería)
        let visible = true;
        const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
        io.observe(el);
        let raf = 0;
        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (!visible) return;
          controls.update();
          renderer.render(scene, camera);
        };
        loop();
        const ro = new ResizeObserver(() => {
          const W = el.clientWidth;
          const H = el.clientHeight;
          if (!W || !H) return;
          renderer.setSize(W, H);
          camera.aspect = W / H;
          camera.updateProjectionMatrix();
        });
        ro.observe(el);
        cleanup = () => {
          cancelAnimationFrame(raf);
          io.disconnect();
          ro.disconnect();
          controls.dispose();
          geos.forEach((g) => g.dispose());
          Object.values(mats).forEach((m) => m.dispose());
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch {
        if (!disposed) setFailed(true);
      }
    })();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [primary, secondary]);

  if (failed) return <p className="grid h-full place-items-center p-6 text-center text-sm text-muted">Tu navegador no permite la vista 3D. Usa el mapa muscular.</p>;
  return <div ref={box} className={className} style={{ touchAction: "pan-y" }} aria-label="Modelo 3D de los músculos trabajados. Arrastra para girarlo." role="img" />;
}
