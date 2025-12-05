// BurnBook - Main Dashboard Page
// The primary interface for the PM-focused Reddit sentiment dashboard

import React, { useState } from 'react';
import RedditUrlInput from '../components/RedditUrlInput';
import SentimentDashboard from '../components/SentimentDashboard';
import NaturalLanguageQuery from '../components/NaturalLanguageQuery';
import SentimentChart from '../components/SentimentChart';
import { useSentimentSummary, useIngestionJobs } from '../hooks/useSentiment';
import type { SentimentChartData } from '../types';

type TabType = 'dashboard' | 'query' | 'ingest';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { data: summaryData } = useSentimentSummary();
  const { jobs } = useIngestionJobs();

  // Transform summary data for charts
  const chartData: SentimentChartData[] = summaryData.map(item => ({
    name: item.entity_name,
    positive: item.positive_count || 0,
    negative: item.negative_count || 0,
    neutral: item.neutral_count || 0,
    mixed: item.mixed_count || 0,
    total: item.total_mentions || 0,
  }));

  const tabs = [
    { id: 'dashboard' as TabType, label: '📊 Dashboard', icon: '📊' },
    { id: 'query' as TabType, label: '💬 Ask Questions', icon: '💬' },
    { id: 'ingest' as TabType, label: '📥 Ingest Data', icon: '📥' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  BurnBook
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Reddit Sentiment Dashboard for Product Managers
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summaryData.reduce((acc, d) => acc + (d.total_mentions || 0), 0)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Mentions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summaryData.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Tracked Entities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {jobs.filter(j => j.status === 'completed').length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Jobs Completed</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Overview Chart */}
            {chartData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SentimentChart 
                  data={chartData.slice(0, 5)} 
                  title="Top Entities by Sentiment" 
                  type="bar"
                />
                <SentimentChart 
                  data={chartData} 
                  title="Overall Sentiment Distribution" 
                  type="pie"
                />
              </div>
            )}
            
            {/* Detailed Dashboard */}
            <SentimentDashboard />
          </div>
        )}

        {activeTab === 'query' && (
          <NaturalLanguageQuery />
        )}

        {activeTab === 'ingest' && (
          <div className="space-y-6">
            <RedditUrlInput 
              onSuccess={(jobId) => {
                console.log('Ingestion started:', jobId);
              }}
              onError={(error) => {
                console.error('Ingestion error:', error);
              }}
            />

            {/* Recent Jobs */}
            {jobs.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📋 Recent Ingestion Jobs
                </h3>
                <div className="space-y-3">
                  {jobs.map(job => (
                    <div 
                      key={job.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {job.url}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {job.posts_analyzed} of {job.posts_found} posts analyzed
                        </p>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <p>🔥 BurnBook - Built for Product Managers</p>
            <p>Powered by Lovable.dev • Supabase • Azure AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Status Badge Component
interface StatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    processing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };

  const icons = {
    pending: '⏳',
    processing: '🔄',
    completed: '✅',
    failed: '❌',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {icons[status]} {status}
    </span>
  );
};

export default Dashboard;
