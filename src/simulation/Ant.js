export class Ant {
  constructor(x, y, config) {
    this.x = x;
    this.y = y;
    this.size = 5;
    this.direction = Math.random() * Math.PI * 2;
    this.speed = config.antSpeed;
    this.state = 'searching'; // searching, returning
    this.hasFood = false;
    
    // Lévy flight parameters
    this.stepSize = 1;
    this.levyAlpha = config.levyAlpha || 1.5; // Controls the tail of the distribution
    
    this.energy = 100;
    this.lifespan = 2000;
    this.age = 0;
  }

  update(world, config) {
    this.age++;
    this.energy -= 0.005;
    if (this.energy <= 0 || this.age >= this.lifespan) return false;

    // 1. Determine Movement Direction
    if (this.state === 'searching') {
      this.searchForFood(world, config);
    } else {
      this.returnToNest(world, config);
    }

    // 2. Apply Lévy Flight logic to speed/step length
    // Occasionally take a larger step
    if (Math.random() < 0.02) {
        // Simple Pareto-style distribution for Lévy-like behavior
        this.stepSize = Math.pow(Math.random(), -1 / this.levyAlpha);
        this.stepSize = Math.min(this.stepSize, 10); // Cap it
    } else {
        this.stepSize = 1;
    }

    let finalSpeed = this.speed * this.stepSize;
    if (config.enableDayNight) {
      const isNight = config.dayNightCycle > 0.25 && config.dayNightCycle < 0.75;
      if (isNight) finalSpeed *= 0.5;
    }

    // 3. Move
    this.x += Math.cos(this.direction) * finalSpeed;
    this.y += Math.sin(this.direction) * finalSpeed;

    // 4. Constraints
    this.stayInBounds(world);
    this.avoidObstacles(world.obstacles);

    return true;
  }

  // Implementation of the ACO Probabilistic Choice
  // Selection across 3 sensors (Left, Center, Right)
  sensePheromones(world, config, type) {
    const alpha = config.alpha || 1;
    const beta = config.beta || 1;
    const sensorRadius = 20;
    const sensorAngle = Math.PI / 4;
    
    const sensors = [
      { angle: -sensorAngle, weight: 0 }, // Right
      { angle: 0, weight: 0 },            // Center
      { angle: sensorAngle, weight: 0 }    // Left
    ];

    let totalWeight = 0;
    const targets = sensors.map(s => {
      const a = this.direction + s.angle;
      const sx = this.x + Math.cos(a) * sensorRadius;
      const sy = this.y + Math.sin(a) * sensorRadius;
      
      const pValue = world.pheromoneMap.getValues(sx, sy)[type] || 0.01;
      
      // Desirability (Forward bias / heuristic)
      // Here η is simple: ants prefer to keep moving in their current general direction
      const desirability = 1.0; 
      
      // ACO Formula part: (pheromone^alpha) * (heuristic^beta)
      const weight = Math.pow(pValue, alpha) * Math.pow(desirability, beta);
      totalWeight += weight;
      
      return { angle: a, weight };
    });

    if (totalWeight > 0.05) {
      // Probabilistic selection
      let r = Math.random() * totalWeight;
      for (const target of targets) {
        r -= target.weight;
        if (r <= 0) {
          // Smooth steering towards chosen direction
          let diff = target.angle - this.direction;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          this.direction += diff * 0.2;
          break;
        }
      }
    } else {
      // Pure random wander if no pheromones detected
      this.direction += (Math.random() - 0.5) * 0.2;
    }
  }

  searchForFood(world, config) {
    const detectionRadius = 50;
    let closestFood = null;
    let minD = detectionRadius;

    for (const food of world.foods) {
      if (food.amount <= 0) continue;
      const d = Math.hypot(this.x - food.x, this.y - food.y);
      if (d < minD) {
        minD = d;
        closestFood = food;
      }
    }

    if (closestFood) {
      const angleToFood = Math.atan2(closestFood.y - this.y, closestFood.x - this.x);
      let diff = angleToFood - this.direction;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.direction += diff * 0.3;

      if (minD < closestFood.size / 2) {
        closestFood.amount--;
        this.hasFood = true;
        this.state = 'returning';
        this.direction += Math.PI; // Quick U-Turn
        this.energy = Math.min(100, this.energy + 10);
      }
    } else {
      this.sensePheromones(world, config, 'food');
    }
  }

  returnToNest(world, config) {
    const nestDist = Math.hypot(this.x - world.nest.x, this.y - world.nest.y);
    const angleToNest = Math.atan2(world.nest.y - this.y, world.nest.x - this.x);
    
    // Heuristic Weight: Stronger bias towards nest as we get closer
    // or when following trails home
    this.sensePheromones(world, config, 'home');
    
    let diff = angleToNest - this.direction;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.direction += diff * 0.05;

    // Positive Feedback: Lay pheromone trail
    // Strength depends on how much food we carried or some constant
    const trailStrength = (config.pheromoneStrength / 10) * 1.5;
    world.pheromoneMap.deposit(this.x, this.y, 'food', trailStrength); // Mark food path

    if (nestDist < world.nest.size / 2) {
      this.hasFood = false;
      this.state = 'searching';
      this.direction += Math.PI;
      this.energy = Math.min(100, this.energy + 40);
      world.onFoodCollected?.();
    }
  }

  avoidObstacles(obstacles) {
    for (const obs of obstacles) {
      if (Math.hypot(this.x - obs.x, this.y - obs.y) < obs.size / 2 + this.size) {
        const escapeAngle = Math.atan2(this.y - obs.y, this.x - obs.x);
        this.direction = escapeAngle + (Math.random() - 0.5) * 0.5;
        this.x += Math.cos(escapeAngle) * 3;
        this.y += Math.sin(escapeAngle) * 3;
      }
    }
  }

  stayInBounds(world) {
    if (this.x < 0) this.x = world.width;
    else if (this.x > world.width) this.x = 0;
    if (this.y < 0) this.y = world.height;
    else if (this.y > world.height) this.y = 0;
  }

  draw(p, antSprite, config) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.direction + Math.PI / 2);
    
    if (antSprite) {
      p.imageMode(p.CENTER);
      const scale = (this.size * 2.2) / antSprite.width;
      p.image(antSprite, 0, 0, antSprite.width * scale, antSprite.height * scale);
    } else {
      p.fill(this.hasFood ? [150, 75, 0] : [0, 0, 0]);
      p.ellipse(0, 0, this.size, this.size);
    }
    
    p.pop();
  }
}
