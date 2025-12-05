// BurnBook - Sentiment Dashboard Component
// Displays sentiment breakdowns by company, product, and feature

import React from 'react';
import { useSentimentSummary, useDashboardFilters } from '../hooks/useSentiment';
import type { SentimentSummary, DashboardFilters } from '../types';

const SentimentDashboard: React.FC = () => {
  const { filters, updateFilter } = useDashboardFilters();
  const { data, loading, error } = useSentimentSummary(filters);

  // Group data by entity type
  const groupedData = React.useMemo(() => {
    return {
      company: data.filter(d => d.entity_type === 'company'),
      product: data.filter(d => d.entity_type === 'product'),
      feature: data.filter(d => d.entity_type === 'feature'),
    };
  }, [data]);

  // Calculate overall stats
  const overallStats = React.useMemo(() => {
    const totals = data.reduce(
      (acc, item) => ({
        mentions: acc.mentions + (item.total_mentions || 0),
        positive: acc.positive + (item.positive_count || 0),
        negative: acc.negative + (item.negative_count || 0),
        neutral: acc.neutral + (item.neutral_count || 0),
      }),
      { mentions: 0, positive: 0, negative: 0, neutral: 0 }
    );

    const total = totals.positive + totals.negative + totals.neutral;
    return {
      totalMentions: totals.mentions,
      positivePercent: total > 0 ? Math.round((totals.positive / total) * 100) : 0,
      negativePercent: total > 0 ? Math.round((totals.negative / total) * 100) : 0,
      neutralPercent: total > 0 ? Math.round((totals.neutral / total) * 100) : 0,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">Error loading dashboard: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Mentions"
          value={overallStats.totalMentions.toString()}
          icon="📊"
          color="blue"
        />
        <StatCard
          title="Positive"
          value={`${overallStats.positivePercent}%`}
          icon="😊"
          color="green"
        />
        <StatCard
          title="Negative"
          value={`${overallStats.negativePercent}%`}
          icon="😞"
          color="red"
        />
        <StatCard
          title="Neutral"
          value={`${overallStats.neutralPercent}%`}
          icon="😐"
          color="gray"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Entity Type
            </label>
            <select
              value={filters.entityType}
              onChange={(e) => updateFilter('entityType', e.target.value as DashboardFilters['entityType'])}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="company">Companies</option>
              <option value="product">Products</option>
              <option value="feature">Features</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Range
            </label>
            <select
              value={filters.timeRange}
              onChange={(e) => updateFilter('timeRange', e.target.value as DashboardFilters['timeRange'])}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Entity Sections */}
      {(filters.entityType === 'all' || filters.entityType === 'company') && (
        <EntitySection title="🏢 Companies" data={groupedData.company} />
      )}
      
      {(filters.entityType === 'all' || filters.entityType === 'product') && (
        <EntitySection title="📦 Products" data={groupedData.product} />
      )}
      
      {(filters.entityType === 'all' || filters.entityType === 'feature') && (
        <EntitySection title="⚡ Features" data={groupedData.feature} />
      )}

      {data.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No sentiment data yet. Ingest some Reddit posts to get started!
          </p>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'gray' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    gray: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{title}</p>
    </div>
  );
};

// Entity Section Component
interface EntitySectionProps {
  title: string;
  data: SentimentSummary[];
}

const EntitySection: React.FC<EntitySectionProps> = ({ title, data }) => {
  if (data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {data.map((item) => (
          <EntityRow key={item.entity_id} item={item} />
        ))}
      </div>
    </div>
  );
};

// Entity Row Component
interface EntityRowProps {
  item: SentimentSummary;
}

const EntityRow: React.FC<EntityRowProps> = ({ item }) => {
  const total = item.positive_count + item.negative_count + item.neutral_count + item.mixed_count;
  const positivePercent = total > 0 ? (item.positive_count / total) * 100 : 0;
  const negativePercent = total > 0 ? (item.negative_count / total) * 100 : 0;
  const neutralPercent = total > 0 ? (item.neutral_count / total) * 100 : 0;

  return (
    <div className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900 dark:text-white">{item.entity_name}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {item.total_mentions} mentions
        </span>
      </div>
      
      {/* Sentiment Bar */}
      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden flex">
        {positivePercent > 0 && (
          <div 
            className="bg-green-500 h-full" 
            style={{ width: `${positivePercent}%` }}
            title={`Positive: ${Math.round(positivePercent)}%`}
          />
        )}
        {neutralPercent > 0 && (
          <div 
            className="bg-gray-400 h-full" 
            style={{ width: `${neutralPercent}%` }}
            title={`Neutral: ${Math.round(neutralPercent)}%`}
          />
        )}
        {negativePercent > 0 && (
          <div 
            className="bg-red-500 h-full" 
            style={{ width: `${negativePercent}%` }}
            title={`Negative: ${Math.round(negativePercent)}%`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          {Math.round(positivePercent)}% positive
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          {Math.round(neutralPercent)}% neutral
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          {Math.round(negativePercent)}% negative
        </span>
      </div>
    </div>
  );
};

export default SentimentDashboard;
