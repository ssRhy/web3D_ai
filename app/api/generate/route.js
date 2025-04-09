import { NextResponse } from 'next/server';

// API key for SiliconFlow
const SILICONFLOW_API_KEY = 'sk-rpbdfcumdlwdfssveutdyweficaabukciujbkoltmdsnjiba';

// Default Three.js scene code to use as fallback
const defaultSceneCode = `
// Create a rotating cube
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ 
  color: 0x00ff00,
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
scene.add(directionalLight);

// Animation function
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
}

animate();
`;

// Sample responses for fallback when API is unavailable
const fallbackResponses = [
  {
    message: "我已经创建了一个旋转的绿色立方体和一个地面。这是一个基本的Three.js场景，展示了如何创建和动画化3D对象。",
    code: defaultSceneCode
  },
  {
    message: "这是一个简单的Three.js场景，包含一个绿色立方体和地面。立方体会自动旋转，展示了基本的3D动画效果。",
    code: defaultSceneCode
  },
  {
    message: "我创建了一个基础的3D场景，包含一个绿色立方体和地面平面。这个示例展示了Three.js的基本功能。",
    code: defaultSceneCode
  }
];

export async function POST(request) {
  try {
    const { messages } = await request.json();

    // Prepare the system message with instructions for generating Three.js code
    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant that generates Three.js code based on natural language descriptions. 
      When the user describes a 3D scene, generate valid JavaScript code that uses Three.js to create that scene.
      
      Your response should include:
      1. A brief explanation of what you're creating
      2. The Three.js code as a JavaScript function that takes parameters (THREE, scene, camera, renderer)
      
      The code should be clean, well-commented, and follow Three.js best practices.
      Do not include import statements or HTML setup, focus only on the Three.js scene creation.`
    };

    let aiResponse;
    let code;
    
    try {
      // Try to call SiliconFlow API with a timeout and retry logic
      const maxRetries = 2;
      let retryCount = 0;
      let response;
      
      while (retryCount <= maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased timeout to 20 seconds
          
          // Call SiliconFlow API directly using fetch
          response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'Qwen/QwQ-32B', // Using Qwen model as specified in the example
              messages: [systemMessage, ...messages],
              temperature: 0.7,
              max_tokens: 2000,
              top_p: 0.7,
              top_k: 50,
              frequency_penalty: 0.5,
              n: 1,
              response_format: {
                type: 'text'
              }
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          break; // If successful, exit the retry loop
        } catch (error) {
          retryCount++;
          console.log(`API request attempt ${retryCount} failed:`, error.message);
          
          if (retryCount > maxRetries || error.name !== 'AbortError') {
            // If it's not a timeout or we've exceeded retries, rethrow
            throw error;
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
      }
      
      const completion = await response.json();
      aiResponse = completion.choices[0].message.content;
      
      // Extract the code portion from the response
      const codeRegex = /\`\`\`(?:javascript|js)?\s*([\s\S]*?)\`\`\`/;
      const codeMatch = aiResponse.match(codeRegex);
      
      if (codeMatch && codeMatch[1]) {
        code = codeMatch[1].trim();
        
        // Wrap the code in a function if it's not already
        if (!code.includes('function(') && !code.includes('function (')) {
          code = `function sceneSetup(THREE, scene, camera, renderer) {
            ${code}
          }`;
        } else if (!code.match(/function\s+([a-zA-Z0-9_$]+)/)) {
          // Add a name to the function if it doesn't have one
          code = code.replace(/function\s*\(/, 'function sceneSetup(');
        }
      } else {
        // If no code block is found, use a default scene
        code = `function sceneSetup(THREE, scene, camera, renderer) {
          ${defaultSceneCode}
        }`;
      }
      
      // Extract the explanation part (everything before the code block)
      if (codeMatch) {
        aiResponse = aiResponse.split(codeMatch[0])[0].trim();
      }
    } catch (apiError) {
      console.error('Error calling OpenAI API:', apiError);
      
      // Use a fallback response if the API call fails
      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      aiResponse = fallback.message;
      code = `function sceneSetup(THREE, scene, camera, renderer) {
        ${fallback.code}
      }`;
    }

    return NextResponse.json({ message: aiResponse, code });
  } catch (error) {
    console.error('Error generating response:', error);
    
    // Return a fallback response in case of any error
    const fallback = fallbackResponses[0];
    return NextResponse.json({ 
      message: fallback.message, 
      code: `function sceneSetup(THREE, scene, camera, renderer) {
        ${fallback.code}
      }`
    });
  }
}
