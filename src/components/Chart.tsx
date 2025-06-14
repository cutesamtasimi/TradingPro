import React, { useEffect, useRef, useState } from 'react';
import { Candle, RSIData, Timeframe } from '../types/trading';

interface ChartProps {
  symbol: string;
  timeframe: Timeframe;
  candles: Candle[];
  rsi: RSIData[];
  showRSI?: boolean;
}

interface TooltipData {
  x: number;
  y: number;
  price: number;
  rsi: number;
  timestamp: number;
  visible: boolean;
}

export function Chart({ symbol, timeframe, candles, rsi, showRSI = true }: ChartProps) {
  const candleChartRef = useRef<HTMLCanvasElement>(null);
  const rsiChartRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({ x: 0, y: 0, price: 0, rsi: 0, timestamp: 0, visible: false });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Limit to 300 candles by default, but allow zoom to show more/less
  const maxCandles = Math.floor(300 / zoomLevel);
  const displayCandles = candles.slice(-maxCandles);
  const displayRsi = rsi.slice(-maxCandles);

  useEffect(() => {
    drawCandlestickChart();
    if (showRSI) {
      drawRSIChart();
    }
  }, [displayCandles, displayRsi, showRSI, zoomLevel, panOffset, isExpanded]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoomLevel(prev => Math.max(0.3, Math.min(5, prev * delta)));
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toFixed(2);
  };

  const formatDate = (timestamp: number, timeframe: Timeframe): string => {
    const date = new Date(timestamp);
    
    if (timeframe.includes('m') || timeframe.includes('h')) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (timeframe.includes('d') || timeframe.includes('w')) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit' 
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent, chartType: 'price' | 'rsi') => {
    const canvas = chartType === 'price' ? candleChartRef.current : rsiChartRef.current;
    if (!canvas || displayCandles.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const marginLeft = 80;
    const marginRight = 20;
    const chartWidth = rect.width - marginLeft - marginRight;
    
    if (x < marginLeft || x > marginLeft + chartWidth) {
      setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }

    const dataIndex = Math.floor(((x - marginLeft) / chartWidth) * displayCandles.length);
    if (dataIndex >= 0 && dataIndex < displayCandles.length) {
      const candle = displayCandles[dataIndex];
      const rsiData = displayRsi[dataIndex];
      
      setTooltip({
        x: e.clientX,
        y: e.clientY,
        price: candle.close,
        rsi: rsiData?.value || 0,
        timestamp: candle.timestamp,
        visible: true
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleMouseLeaveContainer = () => {
    setIsExpanded(false);
  };

  const drawCandlestickChart = () => {
    const canvas = candleChartRef.current;
    if (!canvas || displayCandles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    
    // Dark theme background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);
    
    const marginTop = 15;
    const marginBottom = 25;
    const marginLeft = 80;
    const marginRight = 20;
    
    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;
    
    // Calculate logarithmic price range
    const prices = displayCandles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    const logMin = Math.log(minPrice);
    const logMax = Math.log(maxPrice);
    const logRange = logMax - logMin;
    const padding = logRange * 0.05;
    
    const adjustedLogMin = logMin - padding;
    const adjustedLogMax = logMax + padding;
    const adjustedLogRange = adjustedLogMax - adjustedLogMin;
    
    // Draw background grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    const priceGridLines = 5;
    for (let i = 0; i <= priceGridLines; i++) {
      const y = marginTop + (chartHeight / priceGridLines) * i;
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft + chartWidth, y);
      ctx.stroke();
    }
    
    const timeGridLines = Math.min(6, displayCandles.length);
    for (let i = 0; i <= timeGridLines; i++) {
      const x = marginLeft + (chartWidth / timeGridLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, marginTop);
      ctx.lineTo(x, marginTop + chartHeight);
      ctx.stroke();
    }
    
    // Draw price labels (logarithmic)
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= priceGridLines; i++) {
      const y = marginTop + (chartHeight / priceGridLines) * i;
      const logPrice = adjustedLogMax - (adjustedLogRange / priceGridLines) * i;
      const price = Math.exp(logPrice);
      ctx.fillText('$' + formatPrice(price), marginLeft - 10, y);
    }
    
    // Draw time labels with major periods
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#6b7280';
    const labelInterval = Math.max(1, Math.floor(displayCandles.length / 6));
    
    for (let i = 0; i < displayCandles.length; i += labelInterval) {
      const x = marginLeft + (chartWidth / (displayCandles.length - 1)) * i;
      const timeLabel = formatDate(displayCandles[i].timestamp, timeframe);
      ctx.fillText(timeLabel, x, marginTop + chartHeight + 8);
    }
    
    // Calculate candle dimensions
    const candleWidth = Math.max(1, Math.min(8, chartWidth / displayCandles.length * 0.7));
    const candleSpacing = chartWidth / (displayCandles.length - 1);
    
    // Draw candles
    displayCandles.forEach((candle, index) => {
      const x = marginLeft + index * candleSpacing;
      
      // Calculate Y positions using logarithmic scale
      const openY = marginTop + ((adjustedLogMax - Math.log(candle.open)) / adjustedLogRange) * chartHeight;
      const closeY = marginTop + ((adjustedLogMax - Math.log(candle.close)) / adjustedLogRange) * chartHeight;
      const highY = marginTop + ((adjustedLogMax - Math.log(candle.high)) / adjustedLogRange) * chartHeight;
      const lowY = marginTop + ((adjustedLogMax - Math.log(candle.low)) / adjustedLogRange) * chartHeight;
      
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#10b981' : '#ef4444';
      
      // Draw wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw candle body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));
      
      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      
      // Add border for red candles to make them more visible
      if (!isGreen) {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      }
    });
    
    // Draw chart border
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1;
    ctx.strokeRect(marginLeft, marginTop, chartWidth, chartHeight);
  };

  const drawRSIChart = () => {
    const canvas = rsiChartRef.current;
    if (!canvas || displayRsi.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    
    // Dark theme background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);
    
    const marginTop = 10;
    const marginBottom = 20;
    const marginLeft = 80;
    const marginRight = 20;
    
    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;
    
    // RSI scale from 20 to 100
    const rsiMin = 20;
    const rsiMax = 100;
    const rsiRange = rsiMax - rsiMin;
    
    // Draw background
    ctx.fillStyle = '#374151';
    ctx.fillRect(marginLeft, marginTop, chartWidth, chartHeight);
    
    // Draw RSI background zones (40-60 light purple)
    const zone40Y = marginTop + (chartHeight * (rsiMax - 40)) / rsiRange;
    const zone60Y = marginTop + (chartHeight * (rsiMax - 60)) / rsiRange;
    
    ctx.fillStyle = 'rgba(147, 51, 234, 0.1)';
    ctx.fillRect(marginLeft, zone60Y, chartWidth, zone40Y - zone60Y);
    
    // Draw Bollinger Bands background (light green between bands)
    const pointSpacing = chartWidth / (displayRsi.length - 1);
    
    ctx.beginPath();
    displayRsi.forEach((point, index) => {
      const x = marginLeft + index * pointSpacing;
      const y = marginTop + (chartHeight * (rsiMax - Math.min(rsiMax, Math.max(rsiMin, point.upperBB)))) / rsiRange;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    
    for (let i = displayRsi.length - 1; i >= 0; i--) {
      const x = marginLeft + i * pointSpacing;
      const y = marginTop + (chartHeight * (rsiMax - Math.min(rsiMax, Math.max(rsiMin, displayRsi[i].lowerBB)))) / rsiRange;
      ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
    ctx.fill();
    
    // Draw RSI reference lines with dashed borders for 40, 50, 60
    const referenceLines = [40, 50, 60];
    referenceLines.forEach(value => {
      const y = marginTop + (chartHeight * (rsiMax - value)) / rsiRange;
      ctx.strokeStyle = value === 50 ? '#6b7280' : '#4b5563';
      ctx.lineWidth = value === 50 ? 1.5 : 1;
      ctx.setLineDash([3, 3]); // Dashed line
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft + chartWidth, y);
      ctx.stroke();
    });
    
    ctx.setLineDash([]); // Reset to solid lines
    
    // RSI labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    const labelValues = [80, 60, 50, 40, 20];
    labelValues.forEach(value => {
      const y = marginTop + (chartHeight * (rsiMax - value)) / rsiRange;
      ctx.fillText(value.toString(), marginLeft - 5, y);
    });
    
    // Draw Bollinger Bands with light green borders
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    
    // Upper Bollinger Band
    ctx.beginPath();
    displayRsi.forEach((point, index) => {
      const x = marginLeft + index * pointSpacing;
      const y = marginTop + (chartHeight * (rsiMax - Math.min(rsiMax, Math.max(rsiMin, point.upperBB)))) / rsiRange;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Lower Bollinger Band
    ctx.beginPath();
    displayRsi.forEach((point, index) => {
      const x = marginLeft + index * pointSpacing;
      const y = marginTop + (chartHeight * (rsiMax - Math.min(rsiMax, Math.max(rsiMin, point.lowerBB)))) / rsiRange;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Draw RSI-SMA
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    displayRsi.forEach((point, index) => {
      const x = marginLeft + index * pointSpacing;
      const y = marginTop + (chartHeight * (rsiMax - Math.min(rsiMax, Math.max(rsiMin, point.ma)))) / rsiRange;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw RSI line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    displayRsi.forEach((point, index) => {
      const x = marginLeft + index * pointSpacing;
      const y = marginTop + (chartHeight * (rsiMax - Math.min(rsiMax, Math.max(rsiMin, point.value)))) / rsiRange;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw chart border
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1;
    ctx.strokeRect(marginLeft, marginTop, chartWidth, chartHeight);
  };

  return (
    <div 
      ref={containerRef} 
      className={`bg-gray-800 border border-gray-600 rounded-lg shadow-sm p-2 flex flex-col h-full transition-all duration-300 ${
        isExpanded ? 'transform scale-105' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeaveContainer}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-gray-400">
          {displayCandles.length} candles • Zoom: {(zoomLevel * 100).toFixed(0)}% • Scroll to zoom
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">
            ${displayCandles.length > 0 ? formatPrice(displayCandles[displayCandles.length - 1].close) : '0.00'}
          </div>
          <div className={`text-xs font-medium ${
            displayCandles.length > 1 && displayCandles[displayCandles.length - 1].close > displayCandles[displayCandles.length - 2].close
              ? 'text-green-400' : 'text-red-400'
          }`}>
            {displayCandles.length > 1 && (
              <>
                {displayCandles[displayCandles.length - 1].close > displayCandles[displayCandles.length - 2].close ? '▲' : '▼'}
                {' '}
                {displayCandles[displayCandles.length - 1].close > displayCandles[displayCandles.length - 2].close ? '+' : ''}
                {formatPrice(displayCandles[displayCandles.length - 1].close - displayCandles[displayCandles.length - 2].close)}
                {' '}
                ({((displayCandles[displayCandles.length - 1].close - displayCandles[displayCandles.length - 2].close) / displayCandles[displayCandles.length - 2].close * 100).toFixed(2)}%)
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        <div className={showRSI ? "h-3/4" : "h-full"}>
          <canvas
            ref={candleChartRef}
            className="w-full h-full cursor-crosshair"
            onMouseMove={(e) => handleMouseMove(e, 'price')}
            onMouseLeave={handleMouseLeave}
          />
        </div>
        
        {showRSI && (
          <>
            <div className="h-1 bg-gray-700 border-t border-b border-gray-600 my-1 flex items-center justify-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
            </div>
            
            <div className="h-1/4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span className="font-medium">RSI (14) • Scale: 20-100</span>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
                    <span>RSI</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-0.5 bg-amber-500 rounded"></div>
                    <span>SMA(14)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-0.5 bg-green-500 rounded"></div>
                    <span>BB</span>
                  </div>
                </div>
              </div>
              <canvas
                ref={rsiChartRef}
                className="w-full h-full cursor-crosshair"
                onMouseMove={(e) => handleMouseMove(e, 'rsi')}
                onMouseLeave={handleMouseLeave}
              />
            </div>
          </>
        )}
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none z-50 shadow-lg border border-gray-600"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div>Price: ${formatPrice(tooltip.price)}</div>
          <div>RSI: {tooltip.rsi.toFixed(1)}</div>
          <div>{new Date(tooltip.timestamp).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}