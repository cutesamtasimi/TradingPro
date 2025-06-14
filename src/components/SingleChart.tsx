import React, { useState, useEffect } from 'react';
import { Chart } from './Chart';
import { TimeframeSelector } from './TimeframeSelector';
import { Timeframe, ChartData } from '../types/trading';
import { fetchChartData, fetchSymbolData } from '../services/yahooFinance';
import { RefreshCw } from 'lucide-react';

interface SingleChartProps {
  symbol: string;
}

export function SingleChart({ symbol }: SingleChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1d');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [symbolData, setSymbolData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [symbol, selectedTimeframe]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [chartResult, symbolResult] = await Promise.all([
        fetchChartData(symbol, selectedTimeframe),
        fetchSymbolData(symbol)
      ]);
      
      if (chartResult) {
        setChartData(chartResult);
      } else {
        setError('Unable to fetch chart data. Please check the symbol and try again.');
      }
      
      if (symbolResult) {
        setSymbolData(symbolResult);
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error('Error fetching data:', err);
    }
    
    setLoading(false);
  };

  const currentPrice = symbolData?.price || (chartData?.candles[chartData.candles.length - 1]?.close) || 0;
  const previousPrice = chartData?.candles[chartData.candles.length - 2]?.close || 0;
  const priceChange = symbolData?.change || (currentPrice - previousPrice);
  const priceChangePercent = symbolData?.changePercent || ((priceChange / previousPrice) * 100);

  if (loading && !chartData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <div className="text-gray-400">Loading chart data...</div>
        </div>
      </div>
    );
  }

  if (error && !chartData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-red-400 mb-2">{error}</div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Compact Header with Symbol Info and Timeframes */}
      <div className="px-4 py-2 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">{symbol}</h2>
              {loading && (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold text-white">${currentPrice.toFixed(2)}</span>
              <div className={`flex items-center space-x-1 text-sm ${
                priceChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <span className="font-medium">
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <TimeframeSelector
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
            />
            <button
              onClick={fetchData}
              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Chart Container - Takes remaining space */}
      <div className="flex-1 p-2 min-h-0">
        {chartData ? (
          <Chart
            symbol={symbol}
            timeframe={selectedTimeframe}
            candles={chartData.candles}
            rsi={chartData.rsi}
            showRSI={true}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No chart data available
          </div>
        )}
      </div>
    </div>
  );
}