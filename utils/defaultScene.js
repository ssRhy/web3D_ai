/**
 * Default Three.js scene that will be displayed when the application starts
 * or when there's an error with the generated code.
 */
export const defaultSceneCode = `
function sceneSetup(THREE, scene, camera, renderer) {
  // Clear the scene first
  scene.clear();
  
  // Reset camera position
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  
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
  
  // Animation function
  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
  }
  
  // Start the animation
  animate();
}
`;

/**
 * Helper function to parse and execute Three.js code
 * @param {string} code - The Three.js code to execute
 * @returns {Function} - A function that takes THREE, scene, camera, and renderer as parameters
 */
export const parseSceneCode = (code) => {
  try {
    // If the code is a string representation of a function, convert it to a function
    if (typeof code === 'string') {
      // Check if the code is already wrapped in a function
      if (code.trim().startsWith('function')) {
        // Make sure the function has a name
        if (!code.match(/function\s+([a-zA-Z0-9_$]+)/)) {
          // Add a name to the function if it doesn't have one
          code = code.replace(/function\s*\(/, 'function sceneSetup(');
        }
        return new Function('return ' + code)();
      } else {
        // Wrap the code in a named function
        return new Function('THREE', 'scene', 'camera', 'renderer', code);
      }
    }
    // If the code is already a function, return it
    return code;
  } catch (error) {
    console.error('Error parsing scene code:', error);
    // Return the default scene function in case of error
    const defaultFn = new Function('return ' + defaultSceneCode)();
    return defaultFn;
  }
};
