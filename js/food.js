// food.js - Gestión de las fuentes de alimento

// Dibuja las fuentes de comida
function drawFoodSources() {
  for (let food of foods) {
    food.display();
  }
}

// Crea una nueva fuente de comida en una posición aleatoria
function createFoodSource() {
  // No demasiado cerca del nido
  let x, y;
  do {
    x = random(width);
    y = random(height);
  } while (dist(x, y, nest.x, nest.y) < 100);
  
  // No colocar sobre obstáculos
  let validPosition = true;
  let attempts = 0;
  
  while (attempts < 20) {
    validPosition = true;
    for (let obstacle of obstacles) {
      if (dist(x, y, obstacle.x, obstacle.y) < obstacle.size) {
        validPosition = false;
        x = random(width);
        y = random(height);
        attempts++;
        break;
      }
    }
    
    if (validPosition) break;
  }
  
  return {
    x: x,
    y: y,
    size: random(15, 30),
    amount: floor(random(20, 50)),
    originalAmount: 0,
    growthRate: random(0.001, 0.005), // Tasa de regeneración
    growthTimer: 0,
    
    // Inicializa la cantidad original
    init: function() {
      this.originalAmount = this.amount;
      return this;
    },
    
    // Actualiza la fuente de comida
    update: function() {
      // Regeneración gradual de comida
      if (this.amount < this.originalAmount) {
        this.growthTimer += this.growthRate;
        if (this.growthTimer >= 1) {
          this.amount++;
          this.growthTimer = 0;
        }
      }
    },
    
    // Dibuja la fuente de comida
    display: function() {
      // Actualizar primero
      this.update();
      
      // Tamaño proporcional a la cantidad de comida restante
      let displaySize = map(this.amount, 0, this.originalAmount, this.size * 0.3, this.size);
      
      // Color basado en la cantidad (más brillante cuando está lleno)
      let greenIntensity = map(this.amount, 0, this.originalAmount, 100, 200);
      
      fill(0, greenIntensity, 0);
      noStroke();
      ellipse(this.x, this.y, displaySize);
      
      // Mostrar la cantidad disponible como texto siempre
      if (showStats) {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(this.size > 20 ? 8 : 6);
        text(this.amount, this.x, this.y);
      }
    }
  }.init(); // Inicializar y devolver
}

// Añade comida en la posición especificada (función modificada)
function addFoodAtPosition(x, y) {
  // No añadir comida demasiado cerca del nido
  if (dist(x, y, nest.x, nest.y) < 50) return;
  
  // No añadir sobre un obstáculo
  for (let obstacle of obstacles) {
    if (dist(x, y, obstacle.x, obstacle.y) < obstacle.size / 2) return;
  }
  
  const food = {
    x: x,
    y: y,
    size: random(15, 30),
    amount: floor(random(20, 50)),
    originalAmount: 0,
    growthRate: random(0.001, 0.005), // Tasa de regeneración
    growthTimer: 0,
    
    // Inicializa la cantidad original
    init: function() {
      this.originalAmount = this.amount;
      return this;
    },
    
    // Actualiza la fuente de comida
    update: function() {
      // Regeneración gradual de comida
      if (this.amount < this.originalAmount) {
        this.growthTimer += this.growthRate;
        if (this.growthTimer >= 1) {
          this.amount++;
          this.growthTimer = 0;
        }
      }
    },
    
    // Dibuja la fuente de comida
    display: function() {
      // Actualizar primero
      this.update();
      
      // Tamaño proporcional a la cantidad de comida restante
      let displaySize = map(this.amount, 0, this.originalAmount, this.size * 0.3, this.size);
      
      // Color basado en la cantidad (más brillante cuando está lleno)
      let greenIntensity = map(this.amount, 0, this.originalAmount, 100, 200);
      
      fill(0, greenIntensity, 0);
      noStroke();
      ellipse(this.x, this.y, displaySize);
      
      // Mostrar la cantidad disponible como texto siempre
      if (showStats) {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(this.size > 20 ? 8 : 6);
        text(this.amount, this.x, this.y);
      }
    }
  }.init(); // Inicializar y devolver
  
  foods.push(food);
  console.log("Comida añadida en:", x, y); // Debug
}