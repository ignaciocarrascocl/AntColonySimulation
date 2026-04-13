import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import SimulationCanvas from './components/SimulationCanvas';
import StatsOverlay from './components/StatsOverlay';
import './App.css';

const App = () => {
  const [config, setConfig] = useState({
    antCount: 50,
    foodCount: 3,
    antSpeed: 2.5,
    pheromoneStrength: 5,
    evaporationRate: 0.03,
    diffusionRate: 0.05,
    alpha: 1.0,
    beta: 1.0,
    levyAlpha: 1.5,
    showPheromones: true,
    showStats: true,
    enableDayNight: false,
    dayNightCycle: 0
  });

  const [isPaused, setIsPaused] = useState(false);
  const [currentMode, setCurrentMode] = useState('normal'); // normal, placeFood, placeObstacle
  const [stats, setStats] = useState(null);

  const handleReset = useCallback(() => {
    // This will trigger a reset in the SimulationCanvas via re-mount or a specific prop
    window.location.reload(); // Simple way for now, or we could pass a 'resetKey'
  }, []);

  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  return (
    <div className="app-container">
      <Sidebar 
        config={config} 
        setConfig={setConfig} 
        onReset={handleReset}
        onTogglePause={handleTogglePause}
        isPaused={isPaused}
        currentMode={currentMode}
        setCurrentMode={setCurrentMode}
      />
      
      <main className="simulation-container">
        <SimulationCanvas 
          config={config} 
          isPaused={isPaused}
          currentMode={currentMode}
          onStatsUpdate={setStats}
        />
        
        {config.showStats && <StatsOverlay stats={stats} />}
      </main>
    </div>
  );
};

export default App;
