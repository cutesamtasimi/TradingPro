import React, { useState } from 'react';
import { Timeframe, CustomTimeframe } from '../types/trading';
import { Plus, X } from 'lucide-react';

interface TimeframeSelectorProps {
  selectedTimeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  className?: string;
}

const defaultTimeframes: { label: string; value: Timeframe }[] = [
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

export function TimeframeSelector({ selectedTimeframe, onTimeframeChange, className = '' }: TimeframeSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customTimeframes, setCustomTimeframes] = useState<CustomTimeframe[]>([]);
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState<'days' | 'weeks' | 'months'>('days');

  const allTimeframes = [...defaultTimeframes, ...customTimeframes.map(ct => ({ label: ct.label, value: ct.value as Timeframe }))];

  const addCustomTimeframe = () => {
    if (!customValue.trim()) return;

    const value = parseInt(customValue);
    if (isNaN(value) || value <= 0) return;

    let label = '';
    let timeframeValue = '';

    switch (customUnit) {
      case 'days':
        label = `${value}D`;
        timeframeValue = `${value}d`;
        break;
      case 'weeks':
        label = `${value}W`;
        timeframeValue = `${value}w`;
        break;
      case 'months':
        label = `${value}M`;
        timeframeValue = `${value}M`;
        break;
    }

    const newCustomTimeframe: CustomTimeframe = {
      label,
      value: timeframeValue,
      [customUnit]: value
    };

    setCustomTimeframes([...customTimeframes, newCustomTimeframe]);
    setCustomValue('');
    setShowCustom(false);
  };

  const removeCustomTimeframe = (valueToRemove: string) => {
    setCustomTimeframes(customTimeframes.filter(ct => ct.value !== valueToRemove));
  };

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      <div className="flex flex-wrap gap-1">
        {allTimeframes.map(({ label, value }) => {
          const isCustom = customTimeframes.some(ct => ct.value === value);
          return (
            <div key={value} className="relative group">
              <button
                onClick={() => onTimeframeChange(value)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  selectedTimeframe === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
              {isCustom && (
                <button
                  onClick={() => removeCustomTimeframe(value)}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-2 h-2" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Add custom timeframe"
        >
          <Plus className="w-3 h-3" />
        </button>

        {showCustom && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 min-w-48">
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-900">Add Custom Timeframe</h4>
              <div className="flex space-x-1">
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="Value"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as any)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={addCustomTimeframe}
                  className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowCustom(false)}
                  className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}