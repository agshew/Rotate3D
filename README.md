# Rotate3D

A 3D visualization tool that provides a side-by-side comparison of Quaternion and Euler angle rotation systems. This application is designed to clearly demonstrate the concept of gimbal lock in Euler rotations and highlight the smooth, predictable alternative offered by quaternions.

![Application Screenshot](https://placehold.co/800x600.png)
*A side-by-side view of the Quaternion (left) and Euler (right) rotation scenes.*

## Features

- **Side-by-Side 3D Scenes**: Compare Quaternion and Euler rotations in real-time.
- **Gimbal Visualization**: Uses nested, color-coded rings to represent a mechanical gimbal, making rotation mechanics intuitive.
- **Automated Demonstrations**: Run simultaneous animations to see the "wobble" of gimbal lock on the Euler model versus the smooth path of the Quaternion model.
- **Isolated Controls**: Each scene has independent sliders and value readouts for clear, direct manipulation.

## How to Run

To run the project locally, use the following command:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.
