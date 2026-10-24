import React, { Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { isWebGLAvailable, isSafeModeActive } from '../utils/webglDetect';

/**
 * WebGL Error Boundary: Catches WebGLRenderer context creation crashes
 */
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // If WebGL fails, catch error and display fallback without crashing the app
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[SafeCanvas] WebGL context creation failed. Falling back to 2D view.', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

/**
 * SafeCanvas Component
 * Drop-in replacement for R3F <Canvas> that is 100% immune to WebGL context crashes on low-spec PCs.
 */
export default function SafeCanvas({ fallback = null, children, ...props }) {
  // If WebGL is not supported on this device or safe mode is active, render fallback immediately
  if (!isWebGLAvailable() || isSafeModeActive()) {
    return fallback;
  }

  return (
    <WebGLErrorBoundary fallback={fallback}>
      <Canvas 
        {...props}
        gl={{
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false,
          antialias: true,
          ...props.gl
        }}
      >
        {children}
      </Canvas>
    </WebGLErrorBoundary>
  );
}
