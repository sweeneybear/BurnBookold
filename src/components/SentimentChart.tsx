// BurnBook - Sentiment Chart Component
// Displays sentiment data in various chart formats

import React from 'react';
import type { SentimentChartData } from '../types';

interface SentimentChartProps {
  data: SentimentChartData[];
  type?: 'bar' | 'pie' | 'line';
  title?: string;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ 
  data, 
  type = 'bar',
  title 
}) => {
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.total)) : 1;

  if (type === 'pie') {
    return <PieChart data={data} title={title} />;
  }
  
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {title}
          </h3>
        )}
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                {item.name}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {item.total} mentions
              </span>
            </div>
            
            {/* Stacked Bar */}
            <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
              {item.positive > 0 && (
                <div
                  className="bg-green-500 h-full transition-all duration-300 flex items-center justify-center"
                  style={{ width: `${(item.positive / maxValue) * 100}%` }}
                >
                  {item.positive >= maxValue * 0.1 && (
                    <span className="text-xs text-white font-medium">{item.positive}</span>
                  )}
                </div>
              )}
              {item.neutral > 0 && (
                <div
                  className="bg-gray-400 h-full transition-all duration-300 flex items-center justify-center"
                  style={{ width: `${(item.neutral / maxValue) * 100}%` }}
                >
                  {item.neutral >= maxValue * 0.1 && (
                    <span className="text-xs text-white font-medium">{item.neutral}</span>
                  )}
                </div>
              )}
              {item.negative > 0 && (
                <div
                  className="bg-red-500 h-full transition-all duration-300 flex items-center justify-center"
                  style={{ width: `${(item.negative / maxValue) * 100}%` }}
                >
                  {item.negative >= maxValue * 0.1 && (
                    <span className="text-xs text-white font-medium">{item.negative}</span>
                  )}
                </div>
              )}
              {item.mixed > 0 && (
                <div
                  className="bg-yellow-500 h-full transition-all duration-300 flex items-center justify-center"
                  style={{ width: `${(item.mixed / maxValue) * 100}%` }}
                >
                  {item.mixed >= maxValue * 0.1 && (
                    <span className="text-xs text-white font-medium">{item.mixed}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <LegendItem color="bg-green-500" label="Positive" />
        <LegendItem color="bg-gray-400" label="Neutral" />
        <LegendItem color="bg-red-500" label="Negative" />
        <LegendItem color="bg-yellow-500" label="Mixed" />
      </div>
    </div>
  );
};

// Pie Chart Component (CSS-only)
interface PieChartProps {
  data: SentimentChartData[];
  title?: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, title }) => {
  // Calculate totals across all data
  const totals = data.reduce(
    (acc, item) => ({
      positive: acc.positive + item.positive,
      negative: acc.negative + item.negative,
      neutral: acc.neutral + item.neutral,
      mixed: acc.mixed + item.mixed,
    }),
    { positive: 0, negative: 0, neutral: 0, mixed: 0 }
  );

  const total = totals.positive + totals.negative + totals.neutral + totals.mixed;
  
  if (total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  // Calculate percentages
  const positivePercent = (totals.positive / total) * 100;
  const neutralPercent = (totals.neutral / total) * 100;
  const negativePercent = (totals.negative / total) * 100;
  const mixedPercent = (totals.mixed / total) * 100;

  // Create conic gradient stops
  const gradientStops = [
    { color: '#10B981', start: 0, end: positivePercent },
    { color: '#9CA3AF', start: positivePercent, end: positivePercent + neutralPercent },
    { color: '#EF4444', start: positivePercent + neutralPercent, end: positivePercent + neutralPercent + negativePercent },
    { color: '#F59E0B', start: positivePercent + neutralPercent + negativePercent, end: 100 },
  ];

  const gradient = gradientStops
    .map(stop => `${stop.color} ${stop.start}% ${stop.end}%`)
    .join(', ');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}

      <div className="flex flex-col items-center">
        {/* Pie Chart */}
        <div
          className="w-48 h-48 rounded-full relative"
          style={{
            background: `conic-gradient(${gradient})`,
          }}
        >
          {/* Center hole for donut effect */}
          <div className="absolute inset-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {total}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Positive ({Math.round(positivePercent)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-400"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Neutral ({Math.round(neutralPercent)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Negative ({Math.round(negativePercent)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Mixed ({Math.round(mixedPercent)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Legend Item Component
interface LegendItemProps {
  color: string;
  label: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded ${color}`}></div>
    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
  </div>
);

export default SentimentChart;
