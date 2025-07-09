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
  
  // Refs for gimbal groups in Euler mode
  const gimbalXRef = useRef<THREE.Group>();
  const gimbalYRef = useRef<THREE.Group>();
  const gimbalZRef = useRef<THREE.Group>();

  // Ref for the single group in Quaternion mode
  const quaternionGroupRef = useRef<THREE.Group>();

  const animationFrameId = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 7);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setClearColor(backgroundColor, 1);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Common material properties
    const materialProps = {
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
    };
    
    // Central object (payload)
    const payloadGeometry = new THREE.BoxGeometry(0.2, 0.4, 1.5);
    const payloadMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const payload = new THREE.Mesh(payloadGeometry, payloadMaterial);

    if (rotationMode === 'euler') {
      const gimbalX = new THREE.Group();
      const gimbalY = new THREE.Group();
      const gimbalZ = new THREE.Group();

      const ringMaterialX = new THREE.MeshStandardMaterial({ color: 0xff4136, ...materialProps }); // Red
      const ringMaterialY = new THREE.MeshStandardMaterial({ color: 0x2ecc40, ...materialProps }); // Green
      const ringMaterialZ = new THREE.MeshStandardMaterial({ color: 0x0074d9, ...materialProps }); // Blue

      const ringX = new THREE.Mesh(new THREE.TorusGeometry(2, 0.05, 16, 100), ringMaterialX);
      const ringY = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.05, 16, 100), ringMaterialY);
      const ringZ = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.05, 16, 100), ringMaterialZ);
      
      ringX.rotation.y = Math.PI / 2; // Orient to YZ plane for X-axis rotation
      ringY.rotation.x = Math.PI / 2; // Orient to XZ plane for Y-axis rotation

      gimbalX.add(ringX);
      gimbalY.add(ringY);
      gimbalZ.add(ringZ);
      gimbalZ.add(payload);

      // Nest gimbals for XYZ rotation order
      gimbalY.add(gimbalZ);
      gimbalX.add(gimbalY);
      scene.add(gimbalX);

      gimbalXRef.current = gimbalX;
      gimbalYRef.current = gimbalY;
      gimbalZRef.current = gimbalZ;
    } else { // quaternion mode
      const group = new THREE.Group();
      quaternionGroupRef.current = group;

      const ringMaterialX = new THREE.MeshStandardMaterial({ color: 0xff4136, ...materialProps });
      const ringMaterialY = new THREE.MeshStandardMaterial({ color: 0x2ecc40, ...materialProps });
      const ringMaterialZ = new THREE.MeshStandardMaterial({ color: 0x0074d9, ...materialProps });

      const ringX = new THREE.Mesh(new THREE.TorusGeometry(2, 0.05, 16, 100), ringMaterialX);
      const ringY = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.05, 16, 100), ringMaterialY);
      const ringZ = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.05, 16, 100), ringMaterialZ);
      
      ringX.rotation.y = Math.PI / 2;
      ringY.rotation.x = Math.PI / 2;

      group.add(ringX, ringY, ringZ, payload);
      scene.add(group);
    }
    
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
      if (rendererRef.current && mountRef.current?.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if(Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      })
    };
  }, [backgroundColor, rotationMode]);

  useEffect(() => {
    if (rotationMode === 'euler' && rotation && gimbalXRef.current && gimbalYRef.current && gimbalZRef.current) {
        const { x, y, z } = rotation;
        const rad = Math.PI / 180;
        gimbalXRef.current.rotation.x = x * rad;
        gimbalYRef.current.rotation.y = y * rad;
        gimbalZRef.current.rotation.z = z * rad;
    } else if (rotationMode === 'quaternion' && quaternion && quaternionGroupRef.current) {
      quaternionGroupRef.current.quaternion.copy(quaternion);
    }
  }, [rotation, quaternion, rotationMode]);

  return <div ref={mountRef} className="w-full h-full" data-ai-hint="3d render" />;
};

export default Scene;
