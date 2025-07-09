"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface SceneProps {
  rotation?: { x: number; y: number; z: number };
  quaternion?: THREE.Quaternion;
  rotationMode: 'quaternion' | 'euler';
  backgroundColor: string;
}

const Scene: React.FC<SceneProps> = ({ rotation, quaternion, rotationMode, backgroundColor }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setClearColor(backgroundColor, 1);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 3D Object
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0xff4136, transparent: true, opacity: 0.8, side: THREE.DoubleSide }), // right (+x) - red
      new THREE.MeshStandardMaterial({ color: 0x2ecc40, transparent: true, opacity: 0.8, side: THREE.DoubleSide }), // left (-x) - green
      new THREE.MeshStandardMaterial({ color: 0x0074d9, transparent: true, opacity: 0.8, side: THREE.DoubleSide }), // top (+y) - blue
      new THREE.MeshStandardMaterial({ color: 0xffdc00, transparent: true, opacity: 0.8, side: THREE.DoubleSide }), // bottom (-y) - yellow
      new THREE.MeshStandardMaterial({ color: 0xf012be, transparent: true, opacity: 0.8, side: THREE.DoubleSide }), // front (+z) - magenta
      new THREE.MeshStandardMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }), // back (-z) - cyan
    ];
    const mesh = new THREE.Mesh(geometry, materials);
    meshRef.current = mesh;
    scene.add(mesh);
    
    // Coordinate Axes (Standard colors for clarity)
    const axesHelper = new THREE.AxesHelper(2.5);
    scene.add(axesHelper);

    // Animation loop
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
        if (mountRef.current && rendererRef.current && cameraRef.current) {
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;
            rendererRef.current.setSize(width, height);
            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
        }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      // Dispose Three.js objects
      geometry.dispose();
      materials.forEach(material => material.dispose());
      renderer.dispose();
    };
  }, [backgroundColor]);

  useEffect(() => {
    if (meshRef.current) {
      const cube = meshRef.current;
      if (rotationMode === 'euler' && rotation) {
        const { x, y, z } = rotation;
        const euler = new THREE.Euler(
          x * (Math.PI / 180),
          y * (Math.PI / 180),
          z * (Math.PI / 180),
          'XYZ' 
        );
        // For Euler mode, we set the .rotation property directly.
        // This method is susceptible to Gimbal Lock because it's based
        // on applying rotations sequentially around axes.
        cube.rotation.copy(euler);
      } else if (rotationMode === 'quaternion' && quaternion) {
        // For Quaternion mode, we are passed a pre-computed quaternion.
        // This represents the orientation as a single, unified rotation, which
        // avoids the inherent problems of Euler angle sequences.
        cube.quaternion.copy(quaternion);
      }
    }
  }, [rotation, quaternion, rotationMode]);

  return <div ref={mountRef} className="w-full h-full" data-ai-hint="3d render" />;
};

export default Scene;
