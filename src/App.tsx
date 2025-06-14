import React, { useState, useEffect } from 'react';
import { WatchlistManager } from './components/WatchlistManager';
import { SingleChart } from './components/SingleChart';
import { MultiChart } from './components/MultiChart';
import { BarChart3, Grid3X3 } from 'lucide-react';
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
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Compact Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
              <span className="text-white font-semibold text-sm">TradingHub</span>
            </div>
            
            <div className="flex bg-gray-700 rounded p-0.5">
              <button
                onClick={() => setViewMode('single')}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center space-x-1 ${
                  viewMode === 'single'
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                <span>Single</span>
              </button>
              <button
                onClick={() => setViewMode('multi')}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center space-x-1 ${
                  viewMode === 'multi'
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-3 h-3" />
                <span>Multi</span>
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