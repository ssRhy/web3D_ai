'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ThreeScene = ({ sceneCode }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [error, setError] = useState(null);

  // Initialize the Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Initialize with default scene
    try {
      // Create a basic default scene manually
      // Add a colorful cube
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x3498db,
        metalness: 0.3,
        roughness: 0.4
      });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      
      // Add a ground plane
      const planeGeometry = new THREE.PlaneGeometry(10, 10);
      const planeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xeeeeee,
        side: THREE.DoubleSide
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = Math.PI / 2;
      plane.position.y = -1;
      scene.add(plane);
      
      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);
      
      // Animation function for the cube
      const animateCube = () => {
        if (cube) {
          cube.rotation.x += 0.01;
          cube.rotation.y += 0.01;
        }
        requestAnimationFrame(animateCube);
      };
      
      // Start the animation
      animateCube();
    } catch (err) {
      console.error('Error initializing default scene:', err);
    }

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (sceneRef.current) {
        // Dispose of all objects in the scene
        sceneRef.current.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose();
          }
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, []);

  // Execute the generated Three.js code when it changes
  useEffect(() => {
    if (!sceneCode || !sceneRef.current) return;

    try {
      // Clear previous objects from the scene (except lights)
      const objectsToRemove = [];
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh || 
            object instanceof THREE.Group || 
            object instanceof THREE.Line) {
          objectsToRemove.push(object);
        }
      });
      
      objectsToRemove.forEach((object) => {
        sceneRef.current.remove(object);
      });

      // Execute the new scene code
      try {
        // Convert string code to executable function
        let executableCode;
        
        if (typeof sceneCode === 'string') {
          // Check if the code is already a function
          if (sceneCode.trim().startsWith('function')) {
            // Make sure the function has a name
            if (!sceneCode.match(/function\s+([a-zA-Z0-9_$]+)/)) {
              // Add a name to the function if it doesn't have one
              sceneCode = sceneCode.replace(/function\s*\(/, 'function sceneSetup(');
            }
            executableCode = new Function('return ' + sceneCode)();
          } else {
            // Wrap the code in a named function
            executableCode = new Function('THREE', 'scene', 'camera', 'renderer', sceneCode);
          }
        } else if (typeof sceneCode === 'function') {
          executableCode = sceneCode;
        }
        
        if (typeof executableCode === 'function') {
          executableCode(THREE, sceneRef.current, cameraRef.current, rendererRef.current);
          setError(null);
        } else {
          throw new Error('Invalid scene code format');
        }
      } catch (err) {
        console.error('Error executing scene code:', err);
        setError(err.message);
      }
    } catch (err) {
      console.error('Error handling scene update:', err);
      setError(err.message);
    }
  }, [sceneCode]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {error && (
        <div className="absolute top-0 left-0 bg-red-600 text-white p-2 m-2 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default ThreeScene;
