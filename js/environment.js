// environment.js - Gestión del nido, obstáculos y depredadores

// Dibuja el nido
function drawNest() {
    // Dibujar el halo café con degradado (primero)
    noStroke();
    for (let i = 10; i > 0; i--) {
        let alpha = map(i, 10, 0, 150, 0); // Degradado de opacidad
        fill(139, 69, 19, alpha);
        ellipse(nest.x, nest.y, nest.size + (11-i)*5);
    }
    
    // Dibujar el centro negro del nido (después)
    fill(0);
    ellipse(nest.x, nest.y, nest.size);
}

// Dibuja los obstáculos
function drawObstacles() {
  for (let obstacle of obstacles) {
    obstacle.display();
  }
}

// Añade un obstáculo en la posición especificada
function addObstacleAtPosition(x, y) {
  // No añadir obstáculos demasiado cerca del nido
  if (dist(x, y, nest.x, nest.y) < 40) return;
  
  // No añadir sobre comida
  for (let food of foods) {
    if (dist(x, y, food.x, food.y) < food.size / 2) return;
  }
  
  const obstacle = {
    x: x,
    y: y,
    size: random(10, 25),
    
    // Dibuja el obstáculo
    display: function() {
      fill(150, 75, 0);
      noStroke();
      ellipse(this.x, this.y, this.size);
    }
  };
  
  obstacles.push(obstacle);
}

// Añade un depredador en la posición especificada
function addPredatorAtPosition(x, y) {
  // No añadir depredadores demasiado cerca del nido
  if (dist(x, y, nest.x, nest.y) < 60) return;
  
  // No añadir sobre obstáculos
  for (let obstacle of obstacles) {
    if (dist(x, y, obstacle.x, obstacle.y) < obstacle.size / 2) return;
  }
  
  // No añadir sobre comida
  for (let food of foods) {
    if (dist(x, y, food.x, food.y) < food.size / 2) return;
  }
  
  const predator = {
    x: x,
    y: y,
    size: random(20, 40),
    speed: random(1, 3),
    direction: random(TWO_PI),
    
    // Actualiza la posición del depredador
    update: function() {
      this.x += cos(this.direction) * this.speed;
      this.y += sin(this.direction) * this.speed;
      
      // Rebote al chocar con los bordes
      if (this.x < 0 || this.x > width) {
        this.direction = PI - this.direction;
      }
      if (this.y < 0 || this.y > height) {
        this.direction = -this.direction;
      }
    },
    
    // Dibuja el depredador
    display: function() {
      fill(255, 0, 0);
      noStroke();
      ellipse(this.x, this.y, this.size);
    }
  };
  
  predators.push(predator);
}

// Actualiza y dibuja los depredadores
function updatePredators() {
  for (let predator of predators) {
    predator.update();
    predator.display();
  }
}

// Función para actualizar el ciclo día/noche
function updateDayNightCycle() {
  dayNightCycle += 1 / dayLength;
  if (dayNightCycle > 1) {
    dayNightCycle = 0;
  }
}

// Obtiene el color de fondo basado en el ciclo día/noche
function getDayNightColor() {
  // Interpolar entre blanco (día) y negro (noche)
  const inter = map(dayNightCycle, 0, 1, 255, 0);
  return color(inter);
}

// Función que debe ser llamada en el draw de sketch.js
function drawEnvironment() {
  drawNest();
  drawObstacles();
  updatePredators();
}