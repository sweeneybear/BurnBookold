// BurnBook - Natural Language Query Component
// Allows users to ask questions about sentiment data

import React, { useState } from 'react';
import { askQuestion } from '../lib/azure-ai';
import type { NLQueryResponse } from '../types';

const NaturalLanguageQuery: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<NLQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestedQuestions = [
    'What do users think about the mobile app?',
    'Which features are getting the most negative feedback?',
    'Compare sentiment across all products',
    'What are the most common complaints?',
    'Which product has the best user sentiment?',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitQuestion(question);
  };

  const submitQuestion = async (q: string) => {
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await askQuestion({ question: q });

      if (result.success) {
        setResponse(result);
      } else {
        throw new Error(result.error || 'Failed to get answer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
    submitQuestion(suggestion);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        💬 Ask a Question
      </h2>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to know about your users?"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400
                       text-white font-medium rounded-lg transition-colors
                       focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                Thinking...
              </span>
            ) : (
              'Ask'
            )}
          </button>
        </div>
      </form>

      {/* Suggested Questions */}
      {!response && !error && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Try one of these questions:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((sq, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(sq)}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 
                           hover:bg-gray-200 dark:hover:bg-gray-600
                           text-gray-700 dark:text-gray-300 rounded-full
                           transition-colors disabled:opacity-50"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                        rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400">❌ {error}</p>
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div className="space-y-6">
          {/* Answer */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Answer</h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {response.answer}
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {response.summary.totalMentions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Mentions</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {response.summary.positivePercent}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Positive</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {response.summary.negativePercent}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Negative</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {response.responseTimeMs}ms
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            </div>
          </div>

          {/* Sources */}
          {response.sources.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                📚 Sources ({response.sources.length})
              </h3>
              <div className="space-y-2">
                {response.sources.map((source, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                               rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {source.title || 'Reddit Comment'}
                      </span>
                      <SentimentBadge sentiment={source.sentiment as 'positive' | 'negative' | 'neutral' | 'mixed'} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {source.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ask Another Question */}
          <button
            onClick={() => {
              setResponse(null);
              setQuestion('');
            }}
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            ← Ask another question
          </button>
        </div>
      )}
    </div>
  );
};

// Sentiment Badge Component
interface SentimentBadgeProps {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
}

const SentimentBadge: React.FC<SentimentBadgeProps> = ({ sentiment }) => {
  const colors = {
    positive: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    negative: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    neutral: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400',
    mixed: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  };

  const emojis = {
    positive: '😊',
    negative: '😞',
    neutral: '😐',
    mixed: '🤔',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[sentiment]}`}>
      {emojis[sentiment]} {sentiment}
    </span>
  );
};

export default NaturalLanguageQuery;
