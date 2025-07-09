'use client';
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import Scene from '@/components/scene';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

type RotationMode = 'quaternion' | 'euler';

export default function Home() {
  const [mode, setMode] = useState<RotationMode>('quaternion');
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [quaternion, setQuaternion] = useState(new THREE.Quaternion());

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    setRotation(prev => ({ ...prev, [axis]: value }));
  };

  const handleGimbalLockDemo = () => {
    setMode('euler');
    setRotation({ x: 0, y: 90, z: 0 });
  };

  useEffect(() => {
    const euler = new THREE.Euler(
      rotation.x * (Math.PI / 180),
      rotation.y * (Math.PI / 180),
      rotation.z * (Math.PI / 180),
      'YXZ' // Match the order in scene.tsx
    );
    const newQuaternion = new THREE.Quaternion().setFromEuler(euler);
    setQuaternion(newQuaternion);
  }, [rotation]);

  const isGimbalLockImminent = mode === 'euler' && Math.abs(rotation.y) >= 88;

  return (
    <main className="flex flex-col lg:flex-row h-screen w-screen p-4 gap-4 bg-background text-foreground overflow-auto">
      <div className="flex-grow lg:w-2/3 h-1/2 lg:h-full rounded-lg overflow-hidden shadow-lg border border-border">
        <Scene 
          rotation={rotation}
          rotationMode={mode}
          objectColor="#3498db"
          backgroundColor="#222222"
        />
      </div>
      <div className="lg:w-1/3 h-auto lg:h-full lg:max-h-full flex flex-col">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Rotate3D</CardTitle>
            <CardDescription>Quaternion vs. Euler Rotation</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col gap-6 overflow-y-auto">
            <div className="space-y-4">
              <Label>Rotation Mode</Label>
              <RadioGroup
                value={mode}
                onValueChange={(value: RotationMode) => setMode(value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="quaternion" id="r-quaternion" />
                  <Label htmlFor="r-quaternion">Quaternion</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="euler" id="r-euler" />
                  <Label htmlFor="r-euler">Euler</Label>
                </div>
              </RadioGroup>
            </div>

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
                  A semi-transparent 'shadow' cube shows the rotation using the *other* method for comparison.
                </p>
                <p className="text-sm text-muted-foreground">
                  Try it: Select 'Euler' mode and set the Y-axis rotation to 90° or -90°. Then, try to rotate on the X and Z axes and observe how they affect the object in the same way.
                </p>
                <Button onClick={handleGimbalLockDemo} variant="outline" className="w-full">
                  Demonstrate Gimbal Lock
                </Button>
            </div>
            
            {isGimbalLockImminent && (
              <Alert variant="destructive" className="mt-auto">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Gimbal Lock!</AlertTitle>
                <AlertDescription>
                  With Y-axis at ~90°, the X and Z axes align. You've lost a degree of freedom. Notice how X and Z rotations now produce similar results.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
