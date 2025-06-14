import React, { useState, useEffect } from 'react';
import { WatchlistManager } from './components/WatchlistManager';
import { SingleChart } from './components/SingleChart';
import { MultiChart } from './components/MultiChart';
import { BarChart3, Grid3X3, TrendingUp } from 'lucide-react';
import { Watchlist } from './types/trading';

type ViewMode = 'single' | 'multi';

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('single');

  // Load watchlists from localStorage on mount
  useEffect(() => {
    const savedWatchlists = localStorage.getItem('tradingWatchlists');
    if (savedWatchlists) {
      try {
        const parsed = JSON.parse(savedWatchlists);
        setWatchlists(parsed);
      } catch (error) {
        console.error('Error loading watchlists:', error);
      }
    }
  }, []);

  // Save watchlists to localStorage whenever they change
  useEffect(() => {
    if (watchlists.length > 0) {
      localStorage.setItem('tradingWatchlists', JSON.stringify(watchlists));
    }
  }, [watchlists]);

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">TradingHub Pro</h1>
              <p className="text-xs text-gray-500">Professional trading platform with real-time data</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('single')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 ${
                  viewMode === 'single'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Single Chart</span>
              </button>
              <button
                onClick={() => setViewMode('multi')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 ${
                  viewMode === 'multi'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Multi Chart</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        <main className="flex-1 min-w-0">
          {viewMode === 'single' ? (
            <SingleChart symbol={selectedSymbol} />
          ) : (
            <MultiChart symbol={selectedSymbol} />
          )}
        </main>
        
        <WatchlistManager
          selectedSymbol={selectedSymbol}
          onSymbolSelect={setSelectedSymbol}
          watchlists={watchlists}
          onWatchlistsUpdate={setWatchlists}
        />
      </div>
    </div>
  );
}

export default App;