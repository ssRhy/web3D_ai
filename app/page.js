'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { parseSceneCode } from '../utils/defaultScene';

// Dynamically import Three.js components to avoid SSR issues
const ThreeScene = dynamic(() => import('../components/ThreeScene'), { ssr: false });

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [sceneCode, setSceneCode] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      { 
        role: 'assistant', 
        content: '欢迎使用AI驱动的Three.js场景生成器！请用自然语言描述您想要创建的3D场景，AI将为您生成Three.js代码并实时渲染。' 
      }
    ]);
  }, []);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to handle user input submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call AI API to generate Three.js code based on user input
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      
      // Add AI response to chat
      setMessages((prevMessages) => [
        ...prevMessages, 
        { role: 'assistant', content: data.message }
      ]);
      
      // Update the generated code
      setGeneratedCode(data.code);
      
      // Execute the generated Three.js code
      try {
        // Parse and set the scene code
        setSceneCode(data.code);
      } catch (codeError) {
        console.error('Error executing generated code:', codeError);
        setMessages((prevMessages) => [
          ...prevMessages, 
          { 
            role: 'system', 
            content: `Error executing the generated code: ${codeError.message}` 
          }
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prevMessages) => [
        ...prevMessages, 
        { 
          role: 'system', 
          content: 'Sorry, there was an error processing your request.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      {/* Three.js Canvas */}
      <div className="canvas-container">
        <ThreeScene sceneCode={sceneCode} />
      </div>
      
      {/* Code Display */}
      {generatedCode && (
        <div className="code-container">
          <h3 className="text-lg font-bold mb-2">Generated Three.js Code</h3>
          <pre className="text-xs overflow-auto">{generatedCode}</pre>
        </div>
      )}
      
      {/* Chat Interface */}
      <div className="chat-container">
        <div className="messages-container mb-4 max-h-60 overflow-y-auto">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`mb-2 p-2 rounded ${
                message.role === 'user' 
                  ? 'bg-blue-500 ml-auto max-w-[80%]' 
                  : message.role === 'system'
                    ? 'bg-red-500 max-w-[80%]'
                    : 'bg-gray-700 max-w-[80%]'
              }`}
            >
              {message.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="描述您想要创建的3D场景..."
            className="flex-1 p-2 rounded bg-gray-800 text-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? '生成中...' : '发送'}
          </button>
        </form>
      </div>
    </main>
  );
}
