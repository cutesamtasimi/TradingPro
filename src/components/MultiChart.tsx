import React, { useState, useEffect } from 'react';
import { Chart } from './Chart';
import { Timeframe, ChartData } from '../types/trading';
import { fetchChartData } from '../services/yahooFinance';
import { RefreshCw, Plus, Minus } from 'lucide-react';

interface MultiChartProps {
  symbol: string;
}

type ViewMode = 'grid' | 'scroll';

const AVAILABLE_TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1D', value: '1d' },
  { label: '2D', value: '2d' },
  { label: '3D', value: '3d' },
  { label: '4D', value: '4d' },
  { label: '1W', value: '1w' },
  { label: '2W', value: '2w' },
  { label: '3W', value: '3w' },
  { label: '1M', value: '1M' },
  { label: '5W', value: '5w' },
  { label: '6W', value: '6w' },
  { label: '2M', value: '2M' },
  { label: '3M', value: '3M' }
];

export function MultiChart({ symbol }: MultiChartProps) {
  const [timeframes, setTimeframes] = useState<Timeframe[]>(['1d', '1w', '1M', '3M']);
  const [chartData, setChartData] = useState<Record<string, ChartData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('scroll');

  // Reset to default timeframes when symbol changes
  useEffect(() => {
    setTimeframes(['1d', '1w', '1M', '3M']);
    setChartData({});
  }, [symbol]);

  useEffect(() => {
    fetchAllChartData();
  }, [symbol, timeframes]);

  const fetchAllChartData = async () => {
    const newLoading: Record<string, boolean> = {};
    timeframes.forEach((tf, index) => {
      const key = `${tf}-${index}`;
      newLoading[key] = true;
    });
    setLoading(newLoading);

    const promises = timeframes.map(async (tf, index) => {
      const key = `${tf}-${index}`;
      try {
        const data = await fetchChartData(symbol, tf);
        return { key, timeframe: tf, data };
      } catch (error) {
        console.error(`Error fetching data for ${tf}:`, error);
        return { key, timeframe: tf, data: null };
      }
    });

    const results = await Promise.all(promises);
    const newChartData: Record<string, ChartData> = {};
    const newLoadingState: Record<string, boolean> = {};

    results.forEach(({ key, data }) => {
      if (data) {
        newChartData[key] = data;
      }
      newLoadingState[key] = false;
    });

    setChartData(newChartData);
    setLoading(newLoadingState);
  };

  const handleTimeframeChange = (index: number, newTimeframe: Timeframe) => {
    const newTimeframes = [...timeframes];
    newTimeframes[index] = newTimeframe;
    setTimeframes(newTimeframes);
  };

  const addChart = () => {
    if (timeframes.length < 6) {
      setTimeframes([...timeframes, '1d']);
    }
  };

  const removeChart = (index: number) => {
    if (timeframes.length > 1) {
      const newTimeframes = timeframes.filter((_, i) => i !== index);
      setTimeframes(newTimeframes);
    }
  };

  const getGridClasses = () => {
    const count = timeframes.length;
    if (count <= 2) return 'grid-cols-1 lg:grid-cols-2';
    if (count <= 4) return 'grid-cols-1 lg:grid-cols-2';
    return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3';
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Compact Header */}
      <div className="p-2 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Multi-Timeframe Analysis</h2>
            <p className="text-xs text-gray-600">Compare {symbol} across timeframes</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-600">View:</span>
              <div className="flex bg-gray-100 rounded p-0.5">
                <button
                  onClick={() => setViewMode('scroll')}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    viewMode === 'scroll' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Scroll
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
              </div>
            </div>
            
            <button
              onClick={fetchAllChartData}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Refresh all charts"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Compact Chart Controls */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Charts ({timeframes.length}/6)</span>
            <div className="flex items-center space-x-1">
              {timeframes.length < 6 && (
                <button
                  onClick={addChart}
                  className="flex items-center space-x-1 px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-2 h-2" />
                  <span>Add</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1">
            {timeframes.map((timeframe, index) => {
              const key = `${timeframe}-${index}`;
              return (
                <div key={key} className="flex items-center justify-between bg-gray-50 rounded p-1">
                  <div className="flex items-center space-x-1 flex-1">
                    <span className="text-xs text-gray-600 min-w-0">#{index + 1}:</span>
                    <select
                      value={timeframe}
                      onChange={(e) => handleTimeframeChange(index, e.target.value as Timeframe)}
                      className="text-xs bg-white border border-gray-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-0"
                    >
                      {AVAILABLE_TIMEFRAMES.map(({ label, value }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-1">
                    {loading[key] && (
                      <RefreshCw className="w-2 h-2 animate-spin text-blue-500" />
                    )}
                    {timeframes.length > 1 && (
                      <button
                        onClick={() => removeChart(index)}
                        className="p-0.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                        title="Remove chart"
                      >
                        <Minus className="w-2 h-2" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Chart Content */}
      <div className="flex-1 min-h-0">
        {viewMode === 'scroll' ? (
          <div className="h-full overflow-y-auto">
            <div className="p-2 space-y-3">
              {timeframes.map((timeframe, index) => {
                const key = `${timeframe}-${index}`;
                return (
                  <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            Chart {index + 1}: {symbol} - {getTimeframeLabel(timeframe)}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {getTimeframeDescription(timeframe)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {loading[key] && (
                            <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                          )}
                          <select
                            value={timeframe}
                            onChange={(e) => handleTimeframeChange(index, e.target.value as Timeframe)}
                            className="text-xs bg-white border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {AVAILABLE_TIMEFRAMES.map(({ label, value }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-72">
                      {loading[key] ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                            <div className="text-gray-600">Loading {getTimeframeLabel(timeframe)} chart...</div>
                          </div>
                        </div>
                      ) : chartData[key] ? (
                        <Chart
                          symbol={symbol}
                          timeframe={timeframe}
                          candles={chartData[key].candles}
                          rsi={chartData[key].rsi}
                          showRSI={true}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <div>No data available for {getTimeframeLabel(timeframe)}</div>
                            <button
                              onClick={fetchAllChartData}
                              className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-full p-2 overflow-auto">
            <div className={`grid ${getGridClasses()} gap-2 min-h-full`}>
              {timeframes.map((timeframe, index) => {
                const key = `${timeframe}-${index}`;
                return (
                  <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[300px]">
                    <div className="p-1.5 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900">
                            {symbol} - {getTimeframeLabel(timeframe)}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {getTimeframeDescription(timeframe)}
                          </p>
                        </div>
                        {loading[key] && (
                          <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="h-64">
                      {loading[key] ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-500 mx-auto mb-2" />
                            <div className="text-xs text-gray-600">Loading...</div>
                          </div>
                        </div>
                      ) : chartData[key] ? (
                        <Chart
                          symbol={symbol}
                          timeframe={timeframe}
                          candles={chartData[key].candles}
                          rsi={chartData[key].rsi}
                          showRSI={true}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <div className="text-xs">No data</div>
                            <button
                              onClick={fetchAllChartData}
                              className="mt-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeframeLabel(timeframe: Timeframe): string {
  const labels: Record<Timeframe, string> = {
    '1d': '1 Day',
    '2d': '2 Days',
    '3d': '3 Days',
    '4d': '4 Days',
    '1w': '1 Week',
    '2w': '2 Weeks',
    '3w': '3 Weeks',
    '5w': '5 Weeks',
    '6w': '6 Weeks',
    '1M': '1 Month',
    '2M': '2 Months',
    '3M': '3 Months',
    '6M': '6 Months',
    // Legacy timeframes (not used in multi-chart)
    '1m': '1 Minute',
    '5m': '5 Minutes',
    '15m': '15 Minutes',
    '1h': '1 Hour',
    '4h': '4 Hours',
    '1Y': '1 Year'
  };
  
  return labels[timeframe] || timeframe;
}

function getTimeframeDescription(timeframe: Timeframe): string {
  const descriptions: Record<Timeframe, string> = {
    '1d': 'Daily price movements',
    '2d': 'Every 2 days aggregated data',
    '3d': 'Every 3 days aggregated data',
    '4d': 'Every 4 days aggregated data',
    '1w': 'Weekly price movements',
    '2w': 'Every 2 weeks aggregated data',
    '3w': 'Every 3 weeks aggregated data',
    '5w': 'Every 5 weeks aggregated data',
    '6w': 'Every 6 weeks aggregated data',
    '1M': 'Monthly price movements',
    '2M': 'Every 2 months aggregated data',
    '3M': 'Every 3 months aggregated data',
    '6M': 'Every 6 months aggregated data',
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