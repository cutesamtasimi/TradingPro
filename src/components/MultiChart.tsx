import React, { useState, useEffect } from 'react';
import { Chart } from './Chart';
import { Timeframe, ChartData } from '../types/trading';
import { fetchChartData } from '../services/yahooFinance';
import { RefreshCw, ChevronLeft, ChevronRight, BarChart3, Grid3X3 } from 'lucide-react';

interface MultiChartProps {
  symbol: string;
  viewMode: 'single' | 'multi';
  onViewModeChange: (mode: 'single' | 'multi') => void;
}

const AVAILABLE_TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1D', value: '1d' },
  { label: '2D', value: '2d' },
  { label: '3D', value: '3d' },
  { label: '4D', value: '4d' },
  { label: '1W', value: '1w' },
  { label: '6D', value: '6d' },
  { label: '7D', value: '7d' },
  { label: '2W', value: '2w' },
  { label: '3W', value: '3w' },
  { label: '1M', value: '1M' },
  { label: '5W', value: '5w' },
  { label: '6W', value: '6w' },
  { label: '2M', value: '2M' },
  { label: '3M', value: '3M' }
];

export function MultiChart({ symbol, viewMode, onViewModeChange }: MultiChartProps) {
  const [currentChartIndex, setCurrentChartIndex] = useState(0);
  const [chartData, setChartData] = useState<Record<string, ChartData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const currentTimeframe = AVAILABLE_TIMEFRAMES[currentChartIndex];

  useEffect(() => {
    fetchChartData();
  }, [symbol, currentChartIndex]);

  const fetchChartData = async () => {
    const timeframe = currentTimeframe.value;
    const key = `${timeframe}-${currentChartIndex}`;
    
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const data = await fetchChartData(symbol, timeframe);
      if (data) {
        setChartData(prev => ({ ...prev, [key]: data }));
      }
    } catch (error) {
      console.error(`Error fetching data for ${timeframe}:`, error);
    }
    
    setLoading(prev => ({ ...prev, [key]: false }));
  };

  const handlePrevChart = () => {
    setCurrentChartIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextChart = () => {
    setCurrentChartIndex(prev => Math.min(AVAILABLE_TIMEFRAMES.length - 1, prev + 1));
  };

  const currentKey = `${currentTimeframe.value}-${currentChartIndex}`;
  const isLoading = loading[currentKey];
  const currentData = chartData[currentKey];

  return (
    <div className="h-full flex flex-col bg-white border-r-2 border-gray-300">
      {/* Header */}
      <div className="p-3 border-b-2 border-gray-300 bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Multi-Timeframe Analysis</h2>
            <p className="text-sm text-gray-600">Compare {symbol} across timeframes</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded p-0.5 border border-gray-300">
              <button
                onClick={() => onViewModeChange('single')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors flex items-center space-x-1 ${
                  viewMode === 'single'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Single</span>
              </button>
              <button
                onClick={() => onViewModeChange('multi')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors flex items-center space-x-1 ${
                  viewMode === 'multi'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Multi</span>
              </button>
            </div>

            <button
              onClick={fetchChartData}
              className="p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300"
              title="Refresh chart"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Chart Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevChart}
              disabled={currentChartIndex === 0}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {currentTimeframe.label} Chart
              </div>
              <div className="text-sm text-gray-600">
                {currentChartIndex + 1} of {AVAILABLE_TIMEFRAMES.length}
              </div>
            </div>
            
            <button
              onClick={handleNextChart}
              disabled={currentChartIndex === AVAILABLE_TIMEFRAMES.length - 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Timeframe Slider */}
          <div className="flex-1 max-w-md mx-6">
            <input
              type="range"
              min="0"
              max={AVAILABLE_TIMEFRAMES.length - 1}
              value={currentChartIndex}
              onChange={(e) => setCurrentChartIndex(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{AVAILABLE_TIMEFRAMES[0].label}</span>
              <span>{AVAILABLE_TIMEFRAMES[Math.floor(AVAILABLE_TIMEFRAMES.length / 2)].label}</span>
              <span>{AVAILABLE_TIMEFRAMES[AVAILABLE_TIMEFRAMES.length - 1].label}</span>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {getTimeframeDescription(currentTimeframe.value)}
          </div>
        </div>
      </div>
      
      {/* Chart Content */}
      <div className="flex-1 p-3 min-h-0 bg-gray-50">
        <div className="h-full bg-white rounded-lg border-2 border-gray-300 shadow-sm">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                <div className="text-gray-600">Loading {currentTimeframe.label} chart...</div>
              </div>
            </div>
          ) : currentData ? (
            <Chart
              symbol={symbol}
              timeframe={currentTimeframe.value}
              candles={currentData.candles}
              rsi={currentData.rsi}
              showRSI={true}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div>No data available for {currentTimeframe.label}</div>
                <button
                  onClick={fetchChartData}
                  className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeframeDescription(timeframe: Timeframe): string {
  const descriptions: Record<Timeframe, string> = {
    '1d': 'Daily movements',
    '2d': '2-day aggregated',
    '3d': '3-day aggregated',
    '4d': '4-day aggregated',
    '1w': 'Weekly movements',
    '6d': '6-day aggregated',
    '7d': '7-day aggregated',
    '2w': '2-week aggregated',
    '3w': '3-week aggregated',
    '1M': 'Monthly movements',
    '5w': '5-week aggregated',
    '6w': '6-week aggregated',
    '2M': '2-month aggregated',
    '3M': '3-month aggregated',
    // Legacy timeframes
    '1m': '1 Minute intervals',
    '5m': '5 Minute intervals',
    '15m': '15 Minute intervals',
    '1h': '1 Hour intervals',
    '4h': '4 Hour intervals',
    '1Y': '1 Year intervals'
  };
  
  return descriptions[timeframe] || `${timeframe} intervals`;
}