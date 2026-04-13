import React from 'react';
import { Bug, Apple, Zap, Clock, TrendingUp, Activity } from 'lucide-react';

const StatsOverlay = ({ stats }) => {
  if (!stats) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const foodPerMin = stats.time > 0 ? Math.round((stats.foodCollected / stats.time) * 60) : 0;

  return (
    <div className="stats-overlay">
      <div className="stat-card glass-effect animate-fade-in shadow-lg">
        <div className="stat-main">
          <div className="stat-icon-wrapper food">
            <Apple size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.foodCollected}</span>
            <span className="stat-label">Food Collected</span>
          </div>
        </div>
        <div className="stat-details">
          <div className="stat-detail-item">
            <Activity size={14} />
            <span>{foodPerMin} / min</span>
          </div>
          <div className="stat-detail-item">
            <TrendingUp size={14} />
            <span>{stats.efficiency}% Efficiency</span>
          </div>
        </div>
      </div>

      <div className="stat-small-grid">
        <div className="stat-small-card glass-effect shadow-md">
          <Bug size={16} />
          <span className="value">{stats.activeAnts}</span>
          <span className="label">Ants</span>
        </div>
        <div className="stat-small-card glass-effect shadow-md">
          <Zap size={16} />
          <span className="value">{stats.fps}</span>
          <span className="label">FPS</span>
        </div>
        <div className="stat-small-card glass-effect shadow-md">
          <Clock size={16} />
          <span className="value">{formatTime(stats.time)}</span>
          <span className="label">Time</span>
        </div>
      </div>
    </div>
  );
};

export default StatsOverlay;
