import React, { useState } from 'react';
import axios from 'axios';

const GeneratorPanel = () => {
  const [topic, setTopic] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await axios.post('http://localhost:5000/api/post/create', { topic });
      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Blog Post Generator</h1>
        <div className="mb-4">
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
            Enter Topic
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md
             focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., How to Start Blogging"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md 
            hover:bg-blue-700 focus:outline-none
             focus:ring-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Generating...' : 'Generate Post'}
        </button>
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        {response && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
            Post created successfully!{' '}
            <a
              href={response.link}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View Post
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratorPanel;