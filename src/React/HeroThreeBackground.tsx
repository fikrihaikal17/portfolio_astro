import { useEffect, useRef } from "react";
import * as THREE from "three";

const HeroThreeBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.set(0, 0, 9.4);

    const root = new THREE.Group();
    scene.add(root);

    const wireGeometry = new THREE.IcosahedronGeometry(2.8, 1);
    const wireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(wireGeometry),
      new THREE.LineBasicMaterial({
        color: 0xa476ff,
        transparent: true,
        opacity: 0.24,
      })
    );
    root.add(wireframe);

    const particleCount = 220;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const radius = 3.4 + Math.random() * 3.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const index = i * 3;

      positions[index] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index + 1] = radius * Math.cos(phi);
      positions[index + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xd7c7ff,
        size: 0.048,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.62,
      })
    );
    root.add(particles);

    const glowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.34, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0x8d67e8,
        transparent: true,
        opacity: 0.12,
      })
    );
    root.add(glowMesh);

    const pointerTarget = { x: 0, y: 0 };

    const handlePointerMove = (event: MouseEvent) => {
      pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerTarget.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener("mousemove", handlePointerMove, {
      passive: true,
    });

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth ?? window.innerWidth;
      const height = parent?.clientHeight ?? 520;

      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    let raf = 0;

    const animate = () => {
      raf = window.requestAnimationFrame(animate);

      const now = performance.now() * 0.001;
      const spinSpeed = prefersReducedMotion ? 0.05 : 0.13;
      root.rotation.y += spinSpeed * 0.0045;
      root.rotation.x = Math.sin(now * 0.35) * 0.08;

      if (!prefersReducedMotion) {
        const targetY = pointerTarget.x * 0.22;
        const targetX = pointerTarget.y * -0.14;
        root.rotation.y += (targetY - root.rotation.y) * 0.02;
        root.rotation.x += (targetX - root.rotation.x) * 0.02;
      }

      particles.rotation.y -= 0.0009;
      particles.rotation.x += 0.0005;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.cancelAnimationFrame(raf);

      wireGeometry.dispose();
      (wireframe.material as THREE.Material).dispose();
      particleGeometry.dispose();
      (particles.material as THREE.Material).dispose();
      (glowMesh.geometry as THREE.BufferGeometry).dispose();
      (glowMesh.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-three-canvas" aria-hidden="true" />;
};

export default HeroThreeBackground;
