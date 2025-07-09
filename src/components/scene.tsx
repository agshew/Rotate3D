"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface SceneProps {
  rotation: { x: number; y: number; z: number };
  rotationMode: 'quaternion' | 'euler';
  objectColor: string;
  backgroundColor: string;
}

const Scene: React.FC<SceneProps> = ({ rotation, rotationMode, objectColor, backgroundColor }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const shadowMeshRef = useRef<THREE.Mesh | null>(null);
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 3D Object
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: objectColor });
    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    scene.add(mesh);
    
    // Shadow Object
    const shadowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: true,
      opacity: 0.3,
      transparent: true,
    });
    const shadowMesh = new THREE.Mesh(geometry, shadowMaterial);
    shadowMeshRef.current = shadowMesh;
    scene.add(shadowMesh);

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
      material.dispose();
      shadowMaterial.dispose();
      renderer.dispose();
    };
  }, [objectColor, backgroundColor]);

  useEffect(() => {
    if (meshRef.current && shadowMeshRef.current) {
      const { x, y, z } = rotation;
      // Convert degrees to radians and set a common Euler order
      const euler = new THREE.Euler(
        x * (Math.PI / 180),
        y * (Math.PI / 180),
        z * (Math.PI / 180),
        'YXZ' 
      );
      
      const mainCube = meshRef.current;
      const shadowCube = shadowMeshRef.current;

      if (rotationMode === 'euler') {
        // Main cube uses Euler, which can cause gimbal lock
        mainCube.rotation.copy(euler);
        mainCube.quaternion.setFromEuler(mainCube.rotation); // Sync for consistency

        // Shadow cube uses Quaternion, which avoids gimbal lock
        shadowCube.quaternion.setFromEuler(euler);
        shadowCube.rotation.setFromQuaternion(shadowCube.quaternion, euler.order); // Sync for consistency
      } else { // 'quaternion' mode
        // Main cube uses Quaternion
        mainCube.quaternion.setFromEuler(euler);
        mainCube.rotation.setFromQuaternion(mainCube.quaternion, euler.order); // Sync for consistency

        // Shadow cube uses Euler
        shadowCube.rotation.copy(euler);
        shadowCube.quaternion.setFromEuler(shadowCube.rotation); // Sync for consistency
      }
    }
  }, [rotation, rotationMode]);

  return <div ref={mountRef} className="w-full h-full" data-ai-hint="3d render" />;
};

export default Scene;
