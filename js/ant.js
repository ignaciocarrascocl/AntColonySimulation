// ant.js - Lógica y comportamiento de las hormigas

// Actualiza y dibuja las hormigas
function updateAnts() {
  for (let ant of ants) {
    ant.update();
    ant.display();
  }
}

// Crea una nueva hormiga with tipo específico
function createAnt(type = 'explorer') {
  const baseAnt = {
    x: nest.x + random(-5, 5),
    y: nest.y + random(-5, 5),
    size: 3,
    direction: random(TWO_PI),
    speed: antSpeed * 1.3, // Exploradores más rápidos
    state: 'searching', // searching, returning
    hasFood: false,
    wanderStrength: 0.3, // Qué tanto se desvía aleatoriamente
    type: 'explorer', // solo tipo explorador
    energy: 100, // 100 = lleno de energía, 0 = sin energía/muerto
    lifespan: 2000, // Aumentamos la vida útil a 2000 frames
    age: 0,
    
    // Actualiza el estado de la hormiga
    update: function() {
      // Ajustar velocidad en ciclo día/noche
      if (enableDayNight) {
        // Las hormigas son más lentas de noche (0.5 = noche)
        const isNight = dayNightCycle > 0.25 && dayNightCycle < 0.75;
        if (isNight) {
          this.speed *= 0.7;
        }
      }
      
      // Comportamiento según el estado
      if (this.state === 'searching') {
        this.searchForFood();
      } else if (this.state === 'returning') {
        this.returnToNest();
      }
      
      // Actualizar posición
      this.x += cos(this.direction) * this.speed;
      this.y += sin(this.direction) * this.speed;
      
      // Mantener dentro de los límites y evitar obstáculos
      this.stayInBounds();
      this.avoidObstacles();
      
      // Reducir energía con el tiempo (reducido para que vivan más tiempo)
      this.energy -= 0.005;
      
      // Envejecer
      this.age++;
      
      // Morir si no tiene energía o ha superado su esperanza de vida
      if (this.energy <= 0 || this.age >= this.lifespan) {
        // Encontrar índice de la hormiga en el array
        const index = ants.indexOf(this);
        if (index > -1) {
          ants.splice(index, 1);
        }
      }
      
      // Comprobar colisiones con depredadores
      for (let i = 0; i < predators.length; i++) {
        let predator = predators[i];
        if (dist(this.x, this.y, predator.x, predator.y) < predator.size/2 + this.size) {
          // Las hormigas mueren al contacto con depredadores
          ants.splice(ants.indexOf(this), 1);
          break;
        }
      }
    },
    
    // Comportamiento cuando busca comida - mejorado
    searchForFood: function() {
      const foodDetectionRadius = 70; // Más amplio
      let foodFound = false;
      let closestDist = Infinity;
      let closestFood = null;
      for (let i = 0; i < foods.length; i++) {
        let food = foods[i];
        if (food.amount <= 0) continue;
        let d = dist(this.x, this.y, food.x, food.y);
        if (d < foodDetectionRadius && d < closestDist) {
          closestDist = d;
          closestFood = food;
          foodFound = true;
        }
      }
      if (foodFound) {
        // Movimiento directo y rápido hacia la comida
        this.speed = min(antSpeed * 1.7, 3.5);
        const angleToFood = atan2(closestFood.y - this.y, closestFood.x - this.x);
        let angleDiff = ((angleToFood - this.direction + PI) % TWO_PI) - PI;
        const turnSpeed = map(closestDist, 0, foodDetectionRadius, 0.9, 0.25);
        this.direction += angleDiff * turnSpeed;
        this.wanderStrength = 0.07;
        // Dejar feromonas fuertes cerca de la comida
        if (closestDist < 18) {
          let gridX = floor(this.x / cellSize);
          let gridY = floor(this.y / cellSize);
          if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
            foodPheromoneMap[gridX][gridY] = min(foodPheromoneMap[gridX][gridY] + 3, 10);
          }
        }
      } else {
        this.speed = antSpeed * 1.3;
        this.wanderStrength = 0.3;
        if (random() < 0.3) {
          this.direction += random(-this.wanderStrength, this.wanderStrength);
        }
        this.followPheromones();
      }
      this.checkForFood();
    },

    // Comportamiento cuando regresa al nido
    returnToNest: function() {
      // Dirección hacia el nido
      let angleToNest = atan2(nest.y - this.y, nest.x - this.x);
      
      // Seguir las feromonas de hogar (si hay)
      this.followPheromones();
      
      // Girar gradualmente hacia el nido (combinando dirección innata con feromonas)
      let angleDiff = angleToNest - this.direction;
      // Normalizar diferencia de ángulo
      angleDiff = ((angleDiff + PI) % TWO_PI) - PI;
      this.direction += angleDiff * 0.2; // Reducido de 0.3 a 0.2 para dar más peso a feromonas
      
      // Dejar feromonas en el camino
      this.leavePheromone();
      
      // Verificar si llegó al nido
      if (dist(this.x, this.y, nest.x, nest.y) < nest.size / 2) {
        this.hasFood = false;
        this.state = 'searching';
        this.direction = random(TWO_PI); // Nueva dirección aleatoria
        foodCollected++;
        
        // Recuperar energía en el nido
        this.energy = min(100, this.energy + 30);
      }
    },
    
    // Deja feromonas en el camino de regreso
    leavePheromone: function() {
      let gridX = floor(this.x / cellSize);
      let gridY = floor(this.y / cellSize);
      
      if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
        let dropValue = map(pheromoneStrength, 1, 10, 0.5, 5); // Intensidad constante
        
        if (this.state === 'returning' && this.hasFood) { 
          // Llevando comida al nido - dejar feromonas de comida para que otras hormigas encuentren la comida
          foodPheromoneMap[gridX][gridY] = min(foodPheromoneMap[gridX][gridY] + dropValue, 10);
        } 
        else {
          // Cuando busca comida o regresa sin comida - dejar feromonas de hogar para el camino de regreso
          homePheromoneMap[gridX][gridY] = min(homePheromoneMap[gridX][gridY] + dropValue * 0.7, 10);
        }
      }
    },
    
    // Seguir rastros de feromonas - optimizado
    followPheromones: function() {
      let senseRadius = 3;
      let maxPheromone = 0;
      let bestDirection = null;
      let pheromoneMap;
      
      // Determinar qué mapa de feromonas seguir según el estado
      if (this.state === 'searching') {
        // Hormigas buscando comida siguen feromonas de comida
        pheromoneMap = foodPheromoneMap;
      } else if (this.state === 'returning') {
        // Hormigas regresando al nido siguen feromonas de hogar
        pheromoneMap = homePheromoneMap;
      }
      
      // Si no hay mapa definido o no se sigue ningún rastro, salir
      if (!pheromoneMap) return;
      
      // Buscar en un patrón de 3 direcciones adelante (ángulo de 90 grados)
      const angles = [-PI/4, 0, PI/4];
      
      for (let angle of angles) {
        let senseAngle = this.direction + angle;
        let senseX = this.x + cos(senseAngle) * (this.size + 2) * senseRadius;
        let senseY = this.y + sin(senseAngle) * (this.size + 2) * senseRadius;
        
        let gridX = floor(senseX / cellSize);
        let gridY = floor(senseY / cellSize);
        
        if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
          let pheromoneValue = pheromoneMap[gridX][gridY]; 
          
          if (pheromoneValue > maxPheromone) {
            maxPheromone = pheromoneValue;
            bestDirection = senseAngle;
          }
        }
      }
      
      if (bestDirection !== null && maxPheromone > 0.1) {
        // Ajustar la fuerza del giro basado en la intensidad de la feromona
        let adjustmentStrength = map(maxPheromone, 0.1, 10, 0.05, 0.2);
        let angleDiff = bestDirection - this.direction;
        angleDiff = ((angleDiff + PI) % TWO_PI) - PI;
        this.direction += angleDiff * adjustmentStrength;
      }
    },
    
    // Verifica si la hormiga encontró comida
    checkForFood: function() {
      for (let i = 0; i < foods.length; i++) {
        let food = foods[i];
        if (dist(this.x, this.y, food.x, food.y) < food.size / 2) {
          if (food.amount > 0) {
            // Tomar comida
            food.amount--;
            this.hasFood = true;
            this.state = 'returning';
            
            // Girar 180 grados
            this.direction = (this.direction + PI) % TWO_PI;
            
            // Si la fuente se agotó, crear una nueva
            if (food.amount <= 0) {
              foods[i] = createFoodSource();
            }
            
            // Recuperar algo de energía al encontrar comida
            this.energy = min(100, this.energy + 10);
            
            break;
          }
        }
      }
    },
    
    // Evita obstáculos con sensores virtuales mejorados
    avoidObstacles: function() {
      const detectionRadius = this.size * 6; // Más anticipación
      let obstacleDetected = false;
      let minDistance = Infinity;
      let closestObstacle = null;
      if (!this.lastPositions) {
        this.lastPositions = [];
        this.stuckCounter = 0;
        this.avoidanceStrategy = 0;
      }
      this.lastPositions.push({x: this.x, y: this.y});
      if (this.lastPositions.length > 12) this.lastPositions.shift();
      if (this.lastPositions.length >= 12) {
        let totalDistance = 0;
        for (let i = 1; i < this.lastPositions.length; i++) {
          totalDistance += dist(
            this.lastPositions[i-1].x,
            this.lastPositions[i-1].y,
            this.lastPositions[i].x,
            this.lastPositions[i].y
          );
        }
        if (totalDistance < this.size * 4) {
          this.stuckCounter++;
          if (this.stuckCounter > 16) {
            this.avoidanceStrategy = (this.avoidanceStrategy + 1) % 3;
            this.stuckCounter = 0;
            if (this.avoidanceStrategy === 2) {
              this.direction = random(TWO_PI);
              this.x += cos(this.direction) * this.size * 2;
              this.y += sin(this.direction) * this.size * 2;
            }
          }
        } else {
          this.stuckCounter = max(0, this.stuckCounter - 1);
          if (this.stuckCounter === 0) this.avoidanceStrategy = 0;
        }
      }
      for (let obstacle of obstacles) {
        let distToObstacle = dist(this.x, this.y, obstacle.x, obstacle.y);
        if (distToObstacle < obstacle.size/2 + detectionRadius) {
          obstacleDetected = true;
          if (distToObstacle < minDistance) {
            minDistance = distToObstacle;
            closestObstacle = obstacle;
          }
        }
      }
      if (obstacleDetected && closestObstacle) {
        const numSensors = 7;
        const sensorSpread = PI * 1.2; // Más cobertura
        let bestSensorValue = -Infinity;
        let bestAngle = null;
        for (let i = 0; i < numSensors; i++) {
          let sensorAngle = this.direction + map(i, 0, numSensors - 1, -sensorSpread/2, sensorSpread/2);
          let sensorX = this.x + cos(sensorAngle) * detectionRadius;
          let sensorY = this.y + sin(sensorAngle) * detectionRadius;
          let sensorValue = 0;
          for (let obs of obstacles) {
            let distToSensor = dist(sensorX, sensorY, obs.x, obs.y);
            if (distToSensor < obs.size/2 + this.size * 1.2) {
              // Penalización fuerte si el sensor está muy cerca de un obstáculo
              sensorValue -= 200 / (distToSensor + 0.1);
            } else {
              // Penalización suave por cercanía
              sensorValue -= 10 / (distToSensor + 1);
            }
          }
          if (i === Math.floor(numSensors/2)) sensorValue += 10;
          if (this.avoidanceStrategy === 1 && i > numSensors/2) sensorValue += 20;
          else if (this.avoidanceStrategy === 2 && i < numSensors/2) sensorValue += 20;
          if (sensorValue > bestSensorValue) {
            bestSensorValue = sensorValue;
            bestAngle = sensorAngle;
          }
        }
        if (bestAngle !== null) {
          let angleDiff = ((bestAngle - this.direction + PI) % TWO_PI) - PI;
          let turnSpeed = map(this.stuckCounter, 0, 16, 0.13, 0.55);
          this.direction += angleDiff * turnSpeed;
        }
        // Colisión actual - necesita escape inmediato
        if (minDistance < closestObstacle.size/2 + this.size) {
          const escapeAngle = atan2(this.y - closestObstacle.y, this.x - closestObstacle.x);
          this.direction = escapeAngle + random(-0.25, 0.25);
          const pushDistance = (closestObstacle.size/2 + this.size) - minDistance + 1.5;
          this.x += cos(escapeAngle) * pushDistance;
          this.y += sin(escapeAngle) * pushDistance;
        }
      } else {
        // Fuera de obstáculos, reducir contador gradualmente
        this.stuckCounter = max(0, this.stuckCounter - 0.5);
      }
    },
    
    // Mantiene a la hormiga dentro de los límites del canvas
    stayInBounds: function() {
      // Pasar al lado opuesto (efecto toroidal)
      if (this.x < 0) {
        this.x = width;
      } else if (this.x > width) {
        this.x = 0;
      }
      
      if (this.y < 0) {
        this.y = height;
      } else if (this.y > height) {
        this.y = 0;
      }
    },
    
    // Dibuja la hormiga
    display: function() {
      push();
      translate(this.x, this.y);
      rotate(this.direction + PI/2); // Ajuste para que la hormiga apunte hacia adelante
      if (antSprite) {
        imageMode(CENTER);
        let scale = this.size * 2.2 / antSprite.width;
        image(antSprite, 0, 0, antSprite.width * scale, antSprite.height * scale);
      } else {
        // Respaldo: dibujo vectorial en caso de que no haya sprite
        if (this.hasFood) {
          fill(150, 75, 0); // Marrón para el cuerpo
        } else {
          fill(0); // Negro para el cuerpo normal
        }
        // Crear cuerpo segmentado (similar al ícono de Font Awesome)
        ellipse(0, 0, this.size * 1.8, this.size * 2.2); // Cuerpo principal alargado
        
        // Cabeza
        ellipse(this.size * 0.9, 0, this.size * 1.2, this.size * 1.2);
        
        // Patas (líneas más organizadas como el ícono)
        stroke(0);
        strokeWeight(0.8);
        
        // Tres pares de patas a cada lado (similar al ícono fa-bug)
        // Patas izquierdas
        line(0, 0, -this.size * 0.7, -this.size * 1.2); // Pata delantera
        line(0, 0, -this.size * 0.5, -this.size * 0.7); // Pata media-delantera
        line(-this.size * 0.3, 0, -this.size * 0.8, this.size * 0.7); // Pata media-trasera
        line(-this.size * 0.5, 0, -this.size * 0.9, this.size * 1.2); // Pata trasera
        
        // Patas derechas
        line(0, 0, -this.size * 0.7, this.size * 1.2); // Pata delantera
        line(0, 0, -this.size * 0.5, this.size * 0.7); // Pata media-delantera
        line(-this.size * 0.3, 0, -this.size * 0.8, -this.size * 0.7); // Pata media-trasera
        line(-this.size * 0.5, 0, -this.size * 0.9, -this.size * 1.2); // Pata trasera
        
        // Antenas (como en el ícono fa-bug)
        line(this.size * 0.9, 0, this.size * 1.5, -this.size * 0.7);
        line(this.size * 0.9, 0, this.size * 1.5, this.size * 0.7);
        
        // Si lleva comida, mostrarla
        if (this.hasFood) {
          noStroke();
          fill(0, 150, 0); // Verde para la comida
          ellipse(this.size * 0.5, 0, this.size * 0.8); // Comida sobre el cuerpo
        }
        
        // Visualizar la energía como una pequeña barra debajo
        noStroke();
        fill(200, 200, 200, 100);
        rect(-this.size, this.size * 2, this.size * 2, 1.5);
        fill(0, 200, 0, 150);
        rect(-this.size, this.size * 2, map(this.energy, 0, 100, 0, this.size * 2), 1.5);
      }
      pop();
    }
  };
  
  return baseAnt;
}

// Determina el tipo de hormiga a crear según los porcentajes
function determineAntType() {
  // Ahora solo creamos hormigas exploradoras
  return 'explorer';
}

// Cuenta la cantidad de hormigas de cada tipo
function countAntsByType(type) {
  return ants.filter(ant => ant.type === type).length;
}