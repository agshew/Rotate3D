'use client';
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import Scene from '@/components/scene';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  // State for Quaternion Cube
  const [quatEuler, setQuatEuler] = useState({ x: 0, y: 0, z: 0 });
  const [quaternion, setQuaternion] = useState(new THREE.Quaternion());
  const [isQuatAnimating, setIsQuatAnimating] = useState(false);

  // State for Euler Cube
  const [eulerRotation, setEulerRotation] = useState({ x: 0, y: 0, z: 0 });
  const [isEulerAnimating, setIsEulerAnimating] = useState(false);

  // Common animation state refs
  const quatAnimationState = useRef({
    startQuaternion: new THREE.Quaternion(),
    startTime: 0,
    step: 0,
  });
  const eulerAnimationState = useRef({
    startEuler: { x: 0, y: 0, z: 0 },
    startTime: 0,
    step: 0,
  });

  // Handler for Quaternion sliders
  const handleQuatRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (isQuatAnimating) return;
    const newRotation = { ...quatEuler, [axis]: value };
    setQuatEuler(newRotation);
    const euler = new THREE.Euler(
      newRotation.x * (Math.PI / 180),
      newRotation.y * (Math.PI / 180),
      newRotation.z * (Math.PI / 180),
      'XYZ'
    );
    setQuaternion(new THREE.Quaternion().setFromEuler(euler));
  };

  // Handler for Euler sliders
  const handleEulerRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (isEulerAnimating) return;
    setEulerRotation({ ...eulerRotation, [axis]: value });
  };
  
  const quatAnimationSequence = [
    { target: { x: 0, y: 90, z: 0 }, duration: 2000 },
    { duration: 500 },
    { target: { x: 90, y: 90, z: 0 }, duration: 2000 },
    { duration: 500 },
    { target: { x: 0, y: 90, z: 90 }, duration: 2000 },
    { duration: 500 },
    { target: { x: 0, y: 0, z: 0 }, duration: 2000 },
  ];

  const eulerAnimationSequence = [
    { target: { x: 0, y: 90, z: 0 }, duration: 2000 }, // 1. Go to lock position
    { duration: 500 }, // 2. Pause
    { target: { x: 45, y: 90, z: 0 }, duration: 1500 }, // 3. Wiggle X
    { target: { x: -45, y: 90, z: 0 }, duration: 1500 },
    { target: { x: 0, y: 90, z: 0 }, duration: 1500 },
    { duration: 500 }, // 4. Pause
    { target: { x: 0, y: 90, z: 45 }, duration: 1500 }, // 5. Wiggle Z
    { target: { x: 0, y: 90, z: -45 }, duration: 1500 },
    { target: { x: 0, y: 90, z: 0 }, duration: 1500 },
    { duration: 500 }, // 6. Pause
    { target: { x: 0, y: 0, z: 0 }, duration: 2000 }, // 7. Reset
  ];

  // Demo handler for Quaternion
  const handleQuatDemoClick = () => {
    if (isQuatAnimating) return;
    setQuatEuler({ x: 0, y: 0, z: 0 });
    const startQuaternion = new THREE.Quaternion();
    setQuaternion(startQuaternion.clone());
    quatAnimationState.current = {
      startQuaternion,
      startTime: performance.now(),
      step: 0,
    };
    setIsQuatAnimating(true);
  };

  // Demo handler for Euler
  const handleEulerDemoClick = () => {
    if (isEulerAnimating) return;
    const startEuler = { x: 0, y: 0, z: 0 };
    setEulerRotation(startEuler);
    eulerAnimationState.current = {
      startEuler,
      startTime: performance.now(),
      step: 0,
    };
    setIsEulerAnimating(true);
  };

  const handleBothDemosClick = () => {
    handleQuatDemoClick();
    handleEulerDemoClick();
  };

  // Animation effect for Quaternion
  useEffect(() => {
    if (!isQuatAnimating) return;
    let frameId: number;

    const animateQuat = (currentTime: number) => {
      const state = quatAnimationState.current;
      const currentStepConfig = quatAnimationSequence[state.step];

      if (!currentStepConfig) {
        setIsQuatAnimating(false);
        return;
      }

      const elapsedTime = currentTime - state.startTime;
      const progress = Math.min(elapsedTime / (currentStepConfig.duration || 0), 1);
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      const targetEuler = currentStepConfig.target || quatEuler;
      const rad = Math.PI / 180;
      const targetQuaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(targetEuler.x * rad, targetEuler.y * rad, targetEuler.z * rad, 'XYZ')
      );
      
      const interpolatedQuaternion = state.startQuaternion.clone().slerp(targetQuaternion, easedProgress);
      setQuaternion(interpolatedQuaternion);

      const currentEuler = new THREE.Euler().setFromQuaternion(interpolatedQuaternion, 'XYZ');
      setQuatEuler({
        x: currentEuler.x * (180 / Math.PI),
        y: currentEuler.y * (180 / Math.PI),
        z: currentEuler.z * (180 / Math.PI),
      });

      if (progress < 1) {
        frameId = requestAnimationFrame(animateQuat);
      } else {
        quatAnimationState.current.step += 1;
        quatAnimationState.current.startTime = performance.now();
        quatAnimationState.current.startQuaternion = interpolatedQuaternion;
        frameId = requestAnimationFrame(animateQuat);
      }
    };
    frameId = requestAnimationFrame(animateQuat);
    return () => cancelAnimationFrame(frameId);
  }, [isQuatAnimating]);

  // Animation effect for Euler
  useEffect(() => {
    if (!isEulerAnimating) return;
    let frameId: number;

    const animateEuler = (currentTime: number) => {
      const state = eulerAnimationState.current;
      const currentStepConfig = eulerAnimationSequence[state.step];

      if (!currentStepConfig) {
        setIsEulerAnimating(false);
        return;
      }

      const elapsedTime = currentTime - state.startTime;
      const progress = Math.min(elapsedTime / (currentStepConfig.duration || 0), 1);
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      const targetEuler = currentStepConfig.target || eulerRotation;
      const newEulerRotation = {
        x: state.startEuler.x + (targetEuler.x - state.startEuler.x) * easedProgress,
        y: state.startEuler.y + (targetEuler.y - state.startEuler.y) * easedProgress,
        z: state.startEuler.z + (targetEuler.z - state.startEuler.z) * easedProgress,
      };
      setEulerRotation(newEulerRotation);

      if (progress < 1) {
        frameId = requestAnimationFrame(animateEuler);
      } else {
        eulerAnimationState.current.step += 1;
        eulerAnimationState.current.startTime = performance.now();
        eulerAnimationState.current.startEuler = newEulerRotation;
        frameId = requestAnimationFrame(animateEuler);
      }
    };
    frameId = requestAnimationFrame(animateEuler);
    return () => cancelAnimationFrame(frameId);
  }, [isEulerAnimating]);
  
  const isGimbalLockImminent = Math.abs(eulerRotation.y) >= 88;
  
  return (
    <main className="flex flex-col lg:flex-row h-screen w-screen p-4 gap-4 bg-background text-foreground overflow-auto">
      <div className="flex-grow lg:w-2/3 flex flex-col lg:flex-row gap-4 h-full">
        <div className="lg:w-1/2 h-1/2 lg:h-full flex flex-col gap-2">
          <h2 className="text-center font-bold text-xl">Quaternion</h2>
          <div className="flex-grow rounded-lg overflow-hidden shadow-lg border border-border">
            <Scene 
              quaternion={quaternion}
              rotationMode={'quaternion'}
              backgroundColor="#222222"
            />
          </div>
        </div>
        <div className="lg:w-1/2 h-1/2 lg:h-full flex flex-col gap-2">
          <h2 className="text-center font-bold text-xl">Euler</h2>
          <div className="flex-grow rounded-lg overflow-hidden shadow-lg border border-border">
            <Scene 
              rotation={eulerRotation}
              rotationMode={'euler'}
              backgroundColor="#222222"
            />
          </div>
        </div>
      </div>
      <div className="lg:w-1/3 h-auto lg:h-full lg:max-h-full flex flex-col">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Rotate3D</CardTitle>
            <CardDescription>Quaternion vs. Euler Rotation</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col gap-4 overflow-y-auto pt-4">
            <Button
              onClick={handleBothDemosClick}
              className="w-full"
              disabled={isQuatAnimating || isEulerAnimating}
            >
              {isQuatAnimating || isEulerAnimating ? 'Animating...' : 'Run Simultaneous Demonstration'}
            </Button>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold">Quaternion Controls</h3>
              <p className="text-sm text-muted-foreground">Rotations are converted to quaternions, avoiding gimbal lock.</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="quat-x-slider">X-Axis Rotation</Label>
                  <span className="font-mono text-sm text-muted-foreground">{quatEuler.x.toFixed(0)}°</span>
                </div>
                <Slider
                  id="quat-x-slider"
                  min={-180} max={180} step={1}
                  value={[quatEuler.x]}
                  onValueChange={(value) => handleQuatRotationChange('x', value[0])}
                  disabled={isQuatAnimating}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="quat-y-slider">Y-Axis Rotation</Label>
                  <span className="font-mono text-sm text-muted-foreground">{quatEuler.y.toFixed(0)}°</span>
                </div>
                <Slider
                  id="quat-y-slider"
                  min={-180} max={180} step={1}
                  value={[quatEuler.y]}
                  onValueChange={(value) => handleQuatRotationChange('y', value[0])}
                  disabled={isQuatAnimating}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="quat-z-slider">Z-Axis Rotation</Label>
                  <span className="font-mono text-sm text-muted-foreground">{quatEuler.z.toFixed(0)}°</span>
                </div>
                <Slider
                  id="quat-z-slider"
                  min={-180} max={180} step={1}
                  value={[quatEuler.z]}
                  onValueChange={(value) => handleQuatRotationChange('z', value[0])}
                  disabled={isQuatAnimating}
                />
              </div>
              <Button onClick={handleQuatDemoClick} variant="outline" className="w-full" disabled={isQuatAnimating}>
                {isQuatAnimating ? 'Animating...' : 'Demonstrate Smooth Rotation'}
              </Button>
              <div className="space-y-1 pt-2">
                <h4 className="font-medium text-sm">Live Quaternion Values</h4>
                <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 text-sm font-mono">
                  <span className="text-muted-foreground">qW:</span><span className="text-right">{quaternion.w.toFixed(4)}</span>
                  <span className="text-muted-foreground">qX:</span><span className="text-right">{quaternion.x.toFixed(4)}</span>
                  <span className="text-muted-foreground">qY:</span><span className="text-right">{quaternion.y.toFixed(4)}</span>
                  <span className="text-muted-foreground">qZ:</span><span className="text-right">{quaternion.z.toFixed(4)}</span>
                </div>
              </div>
            </div>

            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-semibold">Euler Controls</h3>
              <p className="text-sm text-muted-foreground">Rotation applied sequentially, leading to gimbal lock when Y is ~90°.</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="euler-x-slider">X-Axis Rotation</Label>
                  <span className="font-mono text-sm text-muted-foreground">{eulerRotation.x.toFixed(0)}°</span>
                </div>
                <Slider
                  id="euler-x-slider"
                  min={-180} max={180} step={1}
                  value={[eulerRotation.x]}
                  onValueChange={(value) => handleEulerRotationChange('x', value[0])}
                  disabled={isEulerAnimating}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="euler-y-slider">Y-Axis Rotation</Label>
                  <span className="font-mono text-sm text-muted-foreground">{eulerRotation.y.toFixed(0)}°</span>
                </div>
                <Slider
                  id="euler-y-slider"
                  min={-180} max={180} step={1}
                  value={[eulerRotation.y]}
                  onValueChange={(value) => handleEulerRotationChange('y', value[0])}
                  disabled={isEulerAnimating}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="euler-z-slider">Z-Axis Rotation</Label>
                  <span className="font-mono text-sm text-muted-foreground">{eulerRotation.z.toFixed(0)}°</span>
                </div>
                <Slider
                  id="euler-z-slider"
                  min={-180} max={180} step={1}
                  value={[eulerRotation.z]}
                  onValueChange={(value) => handleEulerRotationChange('z', value[0])}
                  disabled={isEulerAnimating}
                />
              </div>
              <Button onClick={handleEulerDemoClick} variant="outline" className="w-full" disabled={isEulerAnimating}>
                {isEulerAnimating ? 'Animating...' : 'Demonstrate Gimbal Lock'}
              </Button>
            </div>
            
            {isGimbalLockImminent && !isEulerAnimating && (
              <Alert variant="destructive" className="mt-auto">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Gimbal Lock!</AlertTitle>
                <AlertDescription>
                  The Euler cube has lost a degree of freedom. Notice how X and Z rotations now produce similar results.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
