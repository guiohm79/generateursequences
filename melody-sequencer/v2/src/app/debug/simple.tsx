'use client';

import { useState } from 'react';

export default function TestSimple() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Test Simple - V2</h1>
      
      <div className="space-y-4">
        <p>Count: {count}</p>
        
        <button 
          onClick={() => setCount(c => c + 1)}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          Increment
        </button>
        
        <p className="text-green-400">✅ React fonctionne</p>
        <p className="text-green-400">✅ Tailwind fonctionne</p>
        <p className="text-green-400">✅ TypeScript fonctionne</p>
      </div>
    </div>
  );
}