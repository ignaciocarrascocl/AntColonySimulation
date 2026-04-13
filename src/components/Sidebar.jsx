import React from 'react';
import { 
  Bug, 
  Apple, 
  Zap, 
  Waves, 
  Wind, 
  Eye, 
  BarChart2, 
  Moon, 
  RotateCcw, 
  Pause, 
  Play,
  MousePointer2,
  Mountain,
  Skull
} from 'lucide-react';

const Sidebar = ({ config, setConfig, onReset, onTogglePause, isPaused, currentMode, setCurrentMode }) => {
  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <aside className="sidebar glass-effect">
      <div className="sidebar-header">
        <h1>AntSim <span className="version">v2.0</span></h1>
        <p>Advanced Colony Simulation</p>
      </div>

      <div className="sidebar-content">
        <section className="control-group">
          <h3><Bug size={18} /> Configuration</h3>
          <div className="control-item">
            <label>Ant Count: {config.antCount}</label>
            <input 
              type="range" min="10" max="300" 
              value={config.antCount} 
              onChange={(e) => handleChange('antCount', parseInt(e.target.value))} 
            />
          </div>
          <div className="control-item">
            <label>Food Sources: {config.foodCount}</label>
            <input 
              type="range" min="1" max="10" 
              value={config.foodCount} 
              onChange={(e) => handleChange('foodCount', parseInt(e.target.value))} 
            />
          </div>
          <div className="control-item">
            <label>Ant Speed: {config.antSpeed}</label>
            <input 
              type="range" min="1" max="10" 
              value={config.antSpeed} 
              onChange={(e) => handleChange('antSpeed', parseInt(e.target.value))} 
            />
          </div>
        </section>

        <section className="control-group">
          <h3><Waves size={18} /> Pheromones</h3>
          <div className="control-item">
            <label>Strength: {config.pheromoneStrength}</label>
            <input 
              type="range" min="1" max="10" 
              value={config.pheromoneStrength} 
              onChange={(e) => handleChange('pheromoneStrength', parseInt(e.target.value))} 
            />
          </div>
          <div className="control-item">
            <label>Evaporation: {(config.evaporationRate * 100).toFixed(1)}%</label>
            <input 
              type="range" min="1" max="10" 
              value={config.evaporationRate * 100} 
              onChange={(e) => handleChange('evaporationRate', parseInt(e.target.value) / 100)} 
            />
          </div>
          <div className="control-item">
            <label>Diffusion: {(config.diffusionRate * 100).toFixed(1)}%</label>
            <input 
              type="range" min="0" max="20" 
              value={config.diffusionRate * 100} 
              onChange={(e) => handleChange('diffusionRate', parseInt(e.target.value) / 100)} 
            />
          </div>
        </section>

        <section className="control-group">
          <h3><Zap size={18} /> ACO Constants</h3>
          <div className="control-item">
            <label>Alpha (Pheromone): {config.alpha.toFixed(1)}</label>
            <input 
              type="range" min="1" max="50" 
              value={config.alpha * 10} 
              onChange={(e) => handleChange('alpha', parseInt(e.target.value) / 10)} 
            />
          </div>
          <div className="control-item">
            <label>Beta (Heuristic): {config.beta.toFixed(1)}</label>
            <input 
              type="range" min="1" max="50" 
              value={config.beta * 10} 
              onChange={(e) => handleChange('beta', parseInt(e.target.value) / 10)} 
            />
          </div>
          <div className="control-item">
            <label>Lévy Alpha: {config.levyAlpha.toFixed(1)}</label>
            <input 
              type="range" min="11" max="30" 
              value={config.levyAlpha * 10} 
              onChange={(e) => handleChange('levyAlpha', parseInt(e.target.value) / 10)} 
            />
          </div>
        </section>

        <section className="control-group">
          <h3><Eye size={18} /> Visualization</h3>
          <div className="checkbox-item">
            <input 
              type="checkbox" 
              checked={config.showPheromones} 
              onChange={(e) => handleChange('showPheromones', e.target.checked)} 
              id="showPheromones"
            />
            <label htmlFor="showPheromones">Show Pheromones</label>
          </div>
          <div className="checkbox-item">
            <input 
              type="checkbox" 
              checked={config.showStats} 
              onChange={(e) => handleChange('showStats', e.target.checked)} 
              id="showStats"
            />
            <label htmlFor="showStats">Show Statistics</label>
          </div>
          <div className="checkbox-item">
            <input 
              type="checkbox" 
              checked={config.enableDayNight} 
              onChange={(e) => handleChange('enableDayNight', e.target.checked)} 
              id="enableDayNight"
            />
            <label htmlFor="enableDayNight">Day/Night Cycle</label>
          </div>
        </section>

        <section className="control-group">
          <h3><MousePointer2 size={18} /> Interaction</h3>
          <div className="action-grid">
            <button 
              className={`action-btn ${currentMode === 'placeFood' ? 'active' : ''}`}
              onClick={() => setCurrentMode(currentMode === 'placeFood' ? 'normal' : 'placeFood')}
            >
              <Apple size={20} />
              <span>Food</span>
            </button>
            <button 
              className={`action-btn ${currentMode === 'placeObstacle' ? 'active' : ''}`}
              onClick={() => setCurrentMode(currentMode === 'placeObstacle' ? 'normal' : 'placeObstacle')}
            >
              <Mountain size={20} />
              <span>Block</span>
            </button>
            <button 
              className={`action-btn ${currentMode === 'placePredator' ? 'active' : ''}`}
              onClick={() => setCurrentMode(currentMode === 'placePredator' ? 'normal' : 'placePredator')}
            >
              <Skull size={20} />
              <span>Ender</span>
            </button>
          </div>
        </section>
      </div>

      <div className="sidebar-footer">
        <button className="primary-btn" onClick={onTogglePause}>
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button className="secondary-btn" onClick={onReset}>
          <RotateCcw size={18} />
          Reset
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
