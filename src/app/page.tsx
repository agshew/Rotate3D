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

export default function Home() {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [quaternion, setQuaternion] = useState(new THREE.Quaternion());
  const [isAnimating, setIsAnimating] = useState(false);
  const [demoFinished, setDemoFinished] = useState(false);

  const animationState = useRef({
    startRotation: { x: 0, y: 0, z: 0 },
    startTime: 0,
    step: 0,
  });

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (isAnimating) return;
    setRotation(prev => ({ ...prev, [axis]: value }));
  };

  const handleDemoClick = () => {
    if (isAnimating) return;

    if (demoFinished) {
      setRotation({ x: 0, y: 0, z: 0 });
      setDemoFinished(false);
      return;
    }

    setRotation({ x: 0, y: 0, z: 0 }); // Reset to start position

    animationState.current = {
      startRotation: { x: 0, y: 0, z: 0 },
      startTime: performance.now(),
      step: 0,
    };

    setIsAnimating(true);
    setDemoFinished(false);
  };

  useEffect(() => {
    if (!isAnimating) return;

    let frameId: number;
    const animationSequence = [
      // 1. Move to gimbal lock position
      { target: { x: 0, y: 90, z: 0 }, duration: 2000 },
      // 2. Pause
      { target: { x: 0, y: 90, z: 0 }, duration: 500 },
      // 3. Attempt to rotate on X axis (roll)
      { target: { x: 90, y: 90, z: 0 }, duration: 2000 },
      // 4. Return to center from X
      { target: { x: 0, y: 90, z: 0 }, duration: 2000 },
      // 5. Pause
      { target: { x: 0, y: 90, z: 0 }, duration: 500 },
      // 6. Attempt to rotate on Z axis (yaw)
      { target: { x: 0, y: 90, z: 90 }, duration: 2000 },
      // 7. Return to center from Z
      { target: { x: 0, y: 90, z: 0 }, duration: 2000 },
    ];

    const animate = (currentTime: number) => {
      const state = animationState.current;
      const currentStepConfig = animationSequence[state.step];

      if (!currentStepConfig) {
        setRotation({ x: 0, y: 90, z: 0 });
        setIsAnimating(false);
        setDemoFinished(true);
        return;
      }

      const elapsedTime = currentTime - state.startTime;
      const progress = Math.min(elapsedTime / currentStepConfig.duration, 1);
      
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      const targetRotation = currentStepConfig.target;

      const newRotation = {
        x: state.startRotation.x + (targetRotation.x - state.startRotation.x) * easedProgress,
        y: state.startRotation.y + (targetRotation.y - state.startRotation.y) * easedProgress,
        z: state.startRotation.z + (targetRotation.z - state.startRotation.z) * easedProgress,
      };

      setRotation(newRotation);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        animationState.current.step += 1;
        animationState.current.startTime = performance.now();
        animationState.current.startRotation = newRotation;
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isAnimating]);

  useEffect(() => {
    const euler = new THREE.Euler(
      rotation.x * (Math.PI / 180),
      rotation.y * (Math.PI / 180),
      rotation.z * (Math.PI / 180),
      'XYZ' // Match the order in scene.tsx
    );
    const newQuaternion = new THREE.Quaternion().setFromEuler(euler);
    setQuaternion(newQuaternion);
  }, [rotation]);

  const isGimbalLockImminent = Math.abs(rotation.y) >= 88;
  const buttonText = isAnimating ? 'Animating...' : (demoFinished ? 'Reset View' : 'Demonstrate Gimbal Lock');

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
                  rotation={rotation}
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
          <CardContent className="flex-grow flex flex-col gap-6 overflow-y-auto">
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="x-slider">X-Axis Rotation</Label>
                  <span className="font-mono text-sm text-muted-foreground">{rotation.x.toFixed(0)}°</span>
                </div>
                <Slider
                  id="x-slider"
                  min={-180}
                  max={180}
                  step={1}
                  value={[rotation.x]}
                  onValueChange={(value) => handleRotationChange('x', value[0])}
                  disabled={isAnimating}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="y-slider">Y-Axis Rotation</Label>
                  <span className="font-mono text-sm text-muted-foreground">{rotation.y.toFixed(0)}°</span>
                </div>
                <Slider
                  id="y-slider"
                  min={-180}
                  max={180}
                  step={1}
                  value={[rotation.y]}
                  onValueChange={(value) => handleRotationChange('y', value[0])}
                  disabled={isAnimating}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="z-slider">Z-Axis Rotation</Label>
                  <span className="font-mono text-sm text-muted-foreground">{rotation.z.toFixed(0)}°</span>
                </div>
                <Slider
                  id="z-slider"
                  min={-180}
                  max={180}
                  step={1}
                  value={[rotation.z]}
                  onValueChange={(value) => handleRotationChange('z', value[0])}
                  disabled={isAnimating}
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="font-semibold">Quaternion Values</h3>
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 text-sm font-mono">
                <span className="text-muted-foreground">qW:</span>
                <span className="text-right">{quaternion.w.toFixed(4)}</span>
                <span className="text-muted-foreground">qX:</span>
                <span className="text-right">{quaternion.x.toFixed(4)}</span>
                <span className="text-muted-foreground">qY:</span>
                <span className="text-right">{quaternion.y.toFixed(4)}</span>
                <span className="text-muted-foreground">qZ:</span>
                <span className="text-right">{quaternion.z.toFixed(4)}</span>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold">About Gimbal Lock</h3>
                <p className="text-sm text-muted-foreground">
                  Gimbal lock is a problem with Euler angles where two of the three rotation axes can align, causing a loss of one degree of rotational freedom. This makes it impossible to rotate the object in certain ways. Quaternions avoid this issue entirely.
                </p>
                 <p className="text-sm text-muted-foreground">
                  This demo shows two cubes with the same rotation inputs. The left uses Quaternions, the right uses Euler angles.
                </p>
                <p className="text-sm text-muted-foreground">
                  Try it: Click the button below to see an automated demonstration. Notice how rotating on the X and Z axes produce a nearly identical "wobble" on the Euler cube when its Y-axis is at 90°, while the Quaternion cube rotates predictably.
                </p>
                <Button onClick={handleDemoClick} variant="outline" className="w-full" disabled={isAnimating}>
                  {buttonText}
                </Button>
            </div>
            
            {isGimbalLockImminent && (
              <Alert variant="destructive" className="mt-auto">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Gimbal Lock!</AlertTitle>
                <AlertDescription>
                  With Y-axis at ~90°, the X and Z axes align on the Euler cube. You've lost a degree of freedom. Notice how X and Z rotations now produce similar results.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
