import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import { SimulationEngine } from '../simulation/SimulationEngine';

const SimulationCanvas = ({ config, isPaused, currentMode, onStatsUpdate }) => {
  const containerRef = useRef();
  const engineRef = useRef();
  const p5InstanceRef = useRef();
  
  // Refs to store the latest values without re-triggering useEffect
  const configRef = useRef(config);
  const isPausedRef = useRef(isPaused);
  const currentModeRef = useRef(currentMode);

  // Sync refs with props
  useEffect(() => {
    configRef.current = config;
    isPausedRef.current = isPaused;
    currentModeRef.current = currentMode;
  }, [config, isPaused, currentMode]);

  useEffect(() => {
    const sketch = (p) => {
      let antSprite;
      let bgPattern;
      let isInitialized = false;
      let pImg; // For optimized transparent pheromone rendering

      p.setup = async () => {
        let attempts = 0;
        while ((!containerRef.current || containerRef.current.offsetHeight === 0) && attempts < 10) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }

        if (!containerRef.current || containerRef.current.offsetHeight === 0) return;

        const w = containerRef.current.offsetWidth;
        const h = containerRef.current.offsetHeight;
        p.createCanvas(w, h).parent(containerRef.current);

        try {
          antSprite = await p.loadImage('/ant-30357_640.png');
          bgPattern = await p.loadImage('/background.jpg');
        } catch (err) {
          console.warn("Asset load failed:", err);
        }
        
        engineRef.current = new SimulationEngine(p.width, p.height, configRef.current);
        
        // Create an image for optimized pheromone rendering
        const map = engineRef.current.pheromoneMap;
        pImg = p.createImage(map.width, map.height);
        
        isInitialized = true;
      };

      p.draw = () => {
        if (!isInitialized || !engineRef.current) {
          p.background(15, 23, 42);
          return;
        }

        const currentConfig = configRef.current;
        engineRef.current.updateConfig(currentConfig);
        engineRef.current.paused = isPausedRef.current;
        engineRef.current.update();

        // 1. Render Background
        if (bgPattern) {
          for (let x = 0; x < p.width; x += bgPattern.width) {
            for (let y = 0; y < p.height; y += bgPattern.height) {
              p.image(bgPattern, x, y);
            }
          }
        } else {
          p.background(30, 41, 59);
        }

        // 2. Optimized Pheromone Rendering
        if (currentConfig.showPheromones && pImg) {
          renderPheromonesPixelBased(p, pImg, engineRef.current);
        }

        // 3. Draw Nest
        const nest = engineRef.current.nest;
        p.fill(80, 50, 20);
        p.stroke(40, 25, 10);
        p.strokeWeight(2);
        p.ellipse(nest.x, nest.y, nest.size, nest.size);
        p.noStroke();

        // 4. Draw Food
        for (const food of engineRef.current.foods) {
          const displaySize = p.map(food.amount, 0, food.originalAmount, food.size * 0.4, food.size);
          p.fill(34, 197, 94);
          p.ellipse(food.x, food.y, displaySize, displaySize);
        }

        // 5. Draw Obstacles
        p.fill(71, 85, 105);
        for (const obs of engineRef.current.obstacles) {
          p.ellipse(obs.x, obs.y, obs.size, obs.size);
        }

        // 6. Draw Ants
        for (const ant of engineRef.current.ants) {
          ant.draw(p, antSprite, currentConfig);
        }

        // 7. Update Stats
        if (p.frameCount % 30 === 0) {
          const stats = engineRef.current.getStats();
          stats.fps = Math.round(p.frameRate());
          onStatsUpdate(stats);
        }
      };

      p.windowResized = () => {
        if (containerRef.current && isInitialized) {
          const w = containerRef.current.offsetWidth;
          const h = containerRef.current.offsetHeight;
          p.resizeCanvas(w, h);
          if (engineRef.current) {
            engineRef.current.width = w;
            engineRef.current.height = h;
          }
          // Note: Full pheromone map resize would be complex, skipping for simplicity
        }
      };

      p.mousePressed = () => {
        handleInteraction(p.mouseX, p.mouseY);
      };

      p.mouseDragged = () => {
        handleInteraction(p.mouseX, p.mouseY);
      };

      const handleInteraction = (x, y) => {
        if (!isInitialized || x < 0 || x > p.width || y < 0 || y > p.height) return;
        const mode = currentModeRef.current;
        if (mode === 'placeFood') engineRef.current.addFoodSource(x, y);
        else if (mode === 'placeObstacle') engineRef.current.addObstacle(x, y);
      };

      const renderPheromonesPixelBased = (p, img, engine) => {
        const map = engine.pheromoneMap;
        img.loadPixels();
        
        for (let i = 0; i < map.size; i++) {
          const home = map.homeMap[i];
          const food = map.foodMap[i];
          const px = i * 4;
          
          if (home > 0.05) {
            // Blue for home
            img.pixels[px] = 59;
            img.pixels[px + 1] = 130;
            img.pixels[px + 2] = 246;
            img.pixels[px + 3] = p.min(255, home * 40);
          } else if (food > 0.05) {
            // Green for food
            img.pixels[px] = 34;
            img.pixels[px + 1] = 197;
            img.pixels[px + 2] = 94;
            img.pixels[px + 3] = p.min(255, food * 40);
          } else {
            img.pixels[px + 3] = 0; // Transparent
          }
        }
        
        img.updatePixels();
        p.push();
        p.imageMode(p.CORNER);
        p.image(img, 0, 0, p.width, p.height);
        p.pop();
      };
    };

    p5InstanceRef.current = new p5(sketch);
    return () => p5InstanceRef.current.remove();
  }, []); // Empty dependencies = No Resets

  return <div className="canvas-wrapper" ref={containerRef} />;
};

export default SimulationCanvas;
