export class PheromoneMap {
  constructor(width, height, cellSize) {
    this.width = Math.ceil(width / cellSize);
    this.height = Math.ceil(height / cellSize);
    this.cellSize = cellSize;
    this.size = this.width * this.height;
    
    // Using Float32Array for high-performance memory management
    this.homeMap = new Float32Array(this.size);
    this.foodMap = new Float32Array(this.size);
    
    // Secondary buffers for diffusion to avoid flicker and GC pressure
    this.tempHomeMap = new Float32Array(this.size);
    this.tempFoodMap = new Float32Array(this.size);
  }

  getIndex(x, y) {
    const gx = Math.floor(x / this.cellSize);
    const gy = Math.floor(y / this.cellSize);
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return -1;
    return gy * this.width + gx;
  }

  getValues(x, y) {
    const index = this.getIndex(x, y);
    if (index === -1) return { home: 0, food: 0 };
    return {
      home: this.homeMap[index],
      food: this.foodMap[index]
    };
  }

  deposit(x, y, type, amount) {
    const index = this.getIndex(x, y);
    if (index === -1) return;

    if (type === 'home') {
      this.homeMap[index] = Math.min(10, this.homeMap[index] + amount);
    } else {
      this.foodMap[index] = Math.min(10, this.foodMap[index] + amount);
    }
  }

  update(evaporationRate, diffusionRate) {
    // 1. Evaporation
    for (let i = 0; i < this.size; i++) {
        if (this.homeMap[i] > 0.01) this.homeMap[i] *= (1 - evaporationRate);
        else this.homeMap[i] = 0;

        if (this.foodMap[i] > 0.01) this.foodMap[i] *= (1 - evaporationRate);
        else this.foodMap[i] = 0;
    }

    // 2. Diffusion (Blur)
    if (diffusionRate > 0) {
        this.diffuse(this.homeMap, this.tempHomeMap, diffusionRate);
        this.diffuse(this.foodMap, this.tempFoodMap, diffusionRate);
        
        // Swap buffers
        this.homeMap.set(this.tempHomeMap);
        this.foodMap.set(this.tempFoodMap);
    }
  }

  diffuse(source, target, rate) {
    const w = this.width;
    const h = this.height;
    
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        
        if (source[i] < 0.01) {
            target[i] = source[i];
            continue;
        }

        // Simple 3x3 average blur
        const sum = (
            source[i - w - 1] + source[i - w] + source[i - w + 1] +
            source[i - 1]     + source[i]     + source[i + 1] +
            source[i + w - 1] + source[i + w] + source[i + w + 1]
        ) / 9;
        
        // Mix original with blurred value based on diffusion rate
        target[i] = source[i] * (1 - rate) + sum * rate;
      }
    }
  }
}
