// BurnBook - Reddit URL Input Component
// Allows users to paste Reddit URLs for sentiment analysis

import React, { useState } from 'react';
import { analyzeRedditUrl } from '../lib/azure-ai';

interface RedditUrlInputProps {
  onSuccess?: (jobId: string) => void;
  onError?: (error: string) => void;
}

const RedditUrlInput: React.FC<RedditUrlInputProps> = ({ onSuccess, onError }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const isValidRedditUrl = (input: string): boolean => {
    // Match subreddit, post, and user URLs
    const redditPattern = /^https?:\/\/(www\.)?reddit\.com\/(r\/[\w]+(?:\/comments\/[\w]+(?:\/[^/]*)?)?|user\/[\w]+)/i;
    return redditPattern.test(input);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setStatus('error');
      setMessage('Please enter a Reddit URL');
      return;
    }

    if (!isValidRedditUrl(url)) {
      setStatus('error');
      setMessage('Please enter a valid Reddit URL (e.g., https://reddit.com/r/ems/...)');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const result = await analyzeRedditUrl(url);

      if (result.success) {
        setStatus('success');
        setMessage(`✅ Found ${result.postsFound} posts, analyzed ${result.postsAnalyzed}`);
        setUrl('');
        onSuccess?.(result.jobId || '');
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setStatus('error');
      setMessage(`❌ ${errorMessage}`);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        📥 Ingest Reddit Data
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="reddit-url" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Reddit URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="reddit-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://reddit.com/r/ems/comments/..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         placeholder-gray-400 dark:placeholder-gray-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                         text-white font-medium rounded-lg transition-colors
                         focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" cy="12" r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                      fill="none"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Analyze'
              )}
            </button>
          </div>
        </div>

        {message && (
          <div 
            className={`p-3 rounded-lg text-sm ${
              status === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                : status === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {message}
          </div>
        )}
      </form>

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p className="font-medium mb-1">Supported URL formats:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Subreddit: https://reddit.com/r/ems</li>
          <li>Post: https://reddit.com/r/ems/comments/abc123/...</li>
          <li>User: https://reddit.com/user/username</li>
        </ul>
      </div>
    </div>
  );
};

export default RedditUrlInput;
