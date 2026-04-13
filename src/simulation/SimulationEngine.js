import { Ant } from './Ant';
import { PheromoneMap } from './PheromoneMap';

export class SimulationEngine {
  constructor(width, height, config) {
    this.width = width;
    this.height = height;
    this.config = { 
      alpha: 1.0,
      beta: 1.0,
      levyAlpha: 1.5,
      diffusionRate: 0.05,
      ...config 
    };
    this.paused = false;
    
    this.cellSize = 5;
    this.pheromoneMap = new PheromoneMap(width, height, this.cellSize);
    
    this.nest = {
      x: width / 2,
      y: height / 2,
      size: 30,
      foodStored: 0
    };

    this.ants = [];
    this.foods = [];
    this.obstacles = [];
    
    this.stats = {
      foodCollected: 0,
      totalAntsCreated: 0,
      startTime: Date.now(),
      fps: 0
    };

    this.init();
  }

  init() {
    this.reset();
  }

  reset() {
    this.ants = [];
    this.foods = [];
    this.obstacles = [];
    this.stats.foodCollected = 0;
    this.stats.totalAntsCreated = 0;
    this.stats.startTime = Date.now();
    this.pheromoneMap = new PheromoneMap(this.width, this.height, this.cellSize);

    for (let i = 0; i < this.config.antCount; i++) {
      this.addAnt();
    }

    for (let i = 0; i < this.config.foodCount; i++) {
      this.addFoodSource();
    }
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    while (this.ants.length < this.config.antCount) {
      this.addAnt();
    }
  }

  addAnt() {
    const ant = new Ant(this.nest.x, this.nest.y, this.config);
    this.ants.push(ant);
    this.stats.totalAntsCreated++;
  }

  addFoodSource(x, y) {
    const food = {
      x: x ?? Math.random() * this.width,
      y: y ?? Math.random() * this.height,
      size: 15 + Math.random() * 20,
      amount: 30 + Math.floor(Math.random() * 50),
      originalAmount: 0
    };
    food.originalAmount = food.amount;
    this.foods.push(food);
  }

  addObstacle(x, y) {
    this.obstacles.push({
      x, y,
      size: 40 + Math.random() * 30
    });
  }

  update() {
    if (this.paused) return;

    // Advanced Pheromone Processing (Decay + Diffusion)
    this.pheromoneMap.update(
        this.config.evaporationRate, 
        this.config.diffusionRate
    );

    // Update ants
    this.ants = this.ants.filter(ant => {
      const alive = ant.update(this, this.config);
      return alive;
    });

    // Replace dead ants
    if (this.ants.length < this.config.antCount) {
      this.addAnt();
    }

    // Food regeneration if empty
    this.foods = this.foods.filter(f => f.amount > 0);
    if (this.foods.length < this.config.foodCount) {
        this.addFoodSource();
    }
  }

  onFoodCollected() {
    this.stats.foodCollected++;
  }

  getStats() {
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    return {
      ...this.stats,
      activeAnts: this.ants.length,
      efficiency: this.stats.totalAntsCreated > 0 
        ? Math.round((this.stats.foodCollected / this.stats.totalAntsCreated) * 100) 
        : 0,
      time: elapsed
    };
  }
}
