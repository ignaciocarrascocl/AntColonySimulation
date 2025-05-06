// Variables globales
let ants = [];
let foods = [];
let obstacles = [];
let predators = [];
let nest;
let pheromoneMap = [];
let homePheromoneMap; // Feromonas para el regreso al nido
let foodPheromoneMap; // Feromonas para encontrar comida
let cellSize = 5; // Tamaño de cada celda en el mapa de feromonas
let gridWidth, gridHeight;
let foodCollected = 0;
let simulationStartTime;
let simulationTime = 0;
let paused = false;
let currentMode = 'normal'; // 'normal', 'placeFood', 'placeObstacle'
let dayNightCycle = 0; // 0-1 representa el ciclo (0 = día, 0.5 = noche)
let dayLength = 1000; // Frames de duración del ciclo completo día-noche
let activeAntsCount = 0;
let efficiency = 0;
let totalAntsCreated = 0;
let mouseIsPressed = false;
let lastMouseX, lastMouseY;

// Configuración de la simulación
let antCount = 50;
let foodCount = 3;
let pheromoneStrength = 5;
let evaporationRate = 0.03; // Tasa base de evaporación (0.3% por frame)
let antSpeed = 1.5;
let showPheromones = true;
let showStats = true;
let enableDayNight = false;
let explorerAntsPercentage = 100; // Ahora todas las hormigas son exploradoras

// Colores de feromonas
const HOME_PHEROMONE_COLOR = [50, 50, 255]; // Azul para volver al nido
const FOOD_PHEROMONE_COLOR = [50, 255, 50]; // Verde para buscar comida

function setup() {
  // Crear un canvas que se ajuste al contenedor
  const container = document.getElementById('sketch-container');
  const canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  canvas.parent('sketch-container');
  
  // Inicializar la cuadrícula de feromonas
  gridWidth = Math.ceil(width / cellSize);
  gridHeight = Math.ceil(height / cellSize);
  initializePheromoneMap();
  
  // Crear el nido en el centro
  nest = {
    x: width / 2,
    y: height / 2,
    size: 20,
    foodStored: 0
  };
  
  // Inicializar valores desde los controles UI
  updateControlValues();
  
  // Inicializar hormigas y comida
  resetSimulation();
  
  // Configuración de eventos para los controles
  setupEventListeners();
  
  // Iniciar el tiempo de simulación
  simulationStartTime = millis();
}

function draw() {
  if (paused) {
    // Solo actualizar la UI si está en pausa
    updateUI();
    return;
  }
  
  // Actualizar el ciclo día/noche
  if (enableDayNight) {
    updateDayNightCycle();
  }
  
  // Color de fondo basado en el ciclo día/noche
  const bgColor = enableDayNight ? getDayNightColor() : color(240);
  background(bgColor);
  
  // Dibujar los obstáculos
  drawObstacles();
  
  // Dibujar el mapa de feromonas
  if (showPheromones) {
    drawPheromones();
  }
  
  // Dibujar el nido
  drawNest();
  
  // Dibujar las fuentes de comida
  drawFoodSources();
  
  // Actualizar y dibujar los depredadores
  updatePredators();
  
  // Actualizar y dibujar las hormigas
  updateAnts();
  
  // Evaporar feromonas
  evaporatePheromones();
  
  // Procesar interacciones del mouse
  processMouseInteractions();
  
  // Actualizar la interfaz de usuario
  updateUI();
  
  // Actualizar el tiempo de simulación
  simulationTime = (millis() - simulationStartTime) / 1000;
}

// Inicializa los mapas de feromonas como arreglos 2D
function initializePheromoneMap() {
  // Mapa para las feromonas de vuelta al nido
  homePheromoneMap = new Array(gridWidth);
  // Mapa para las feromonas de búsqueda de comida
  foodPheromoneMap = new Array(gridWidth);
  
  for (let x = 0; x < gridWidth; x++) {
    homePheromoneMap[x] = new Array(gridHeight).fill(0);
    foodPheromoneMap[x] = new Array(gridHeight).fill(0);
  }
}

// Reinicia la simulación
function resetSimulation() {
  // Obtener valores actualizados de los controles
  updateControlValues();
  
  // Reiniciar variables
  ants = [];
  foods = [];
  obstacles = [];
  predators = [];
  foodCollected = 0;
  simulationStartTime = millis();
  simulationTime = 0;
  paused = false;
  totalAntsCreated = 0;
  efficiency = 0;
  
  // Inicializar mapas de feromonas
  initializePheromoneMap();
  
  // Crear hormigas según los porcentajes
  for (let i = 0; i < antCount; i++) {
    // Determinar tipo de hormiga basado en los porcentajes
    const antType = determineAntType();
    ants.push(createAnt(antType));
    totalAntsCreated++;
  }
  
  // Crear fuentes de comida
  for (let i = 0; i < foodCount; i++) {
    foods.push(createFoodSource());
  }
  
  // Actualizar contador en la UI
  document.getElementById('foodCollected').textContent = foodCollected;
}

// Determina el tipo de hormiga a crear según los porcentajes
function determineAntType() {
  // Ahora solo creamos hormigas exploradoras
  return 'explorer';
}

// Actualiza los valores de configuración desde los controles UI
function updateControlValues() {
  antCount = parseInt(document.getElementById('antCount').value);
  document.getElementById('antCountValue').textContent = antCount;
  
  foodCount = parseInt(document.getElementById('foodCount').value);
  document.getElementById('foodCountValue').textContent = foodCount;
  
  pheromoneStrength = parseInt(document.getElementById('pheromoneStrength').value);
  document.getElementById('pheromoneStrengthValue').textContent = pheromoneStrength;
  
  let evapRate = parseInt(document.getElementById('evaporationRate').value);
  document.getElementById('evaporationRateValue').textContent = evapRate;
  evaporationRate = evapRate / 100; // Convertir a porcentaje (1-10 -> 0.01-0.1)
  
  antSpeed = parseInt(document.getElementById('antSpeed').value) / 3; // Dividimos por 3 para tener velocidades razonables
  document.getElementById('antSpeedValue').textContent = document.getElementById('antSpeed').value;
  
  showPheromones = document.getElementById('showPheromones').checked;
  showStats = document.getElementById('showStats').checked;
  enableDayNight = document.getElementById('enableDayNight').checked;
  
  // Las referencias a elementos de tipo de hormigas se han eliminado porque ya no existen
  explorerAntsPercentage = 100; // Ahora todas las hormigas son exploradoras
}

// Configura los listeners de eventos para los controles
function setupEventListeners() {
  // Actualizar valores en tiempo real
  document.getElementById('antCount').addEventListener('input', function() {
    antCount = parseInt(this.value);
    document.getElementById('antCountValue').textContent = antCount;
  });
  
  document.getElementById('foodCount').addEventListener('input', function() {
    foodCount = parseInt(this.value);
    document.getElementById('foodCountValue').textContent = foodCount;
  });
  
  document.getElementById('pheromoneStrength').addEventListener('input', function() {
    pheromoneStrength = parseInt(this.value);
    document.getElementById('pheromoneStrengthValue').textContent = pheromoneStrength;
  });
  
  document.getElementById('evaporationRate').addEventListener('input', function() {
    let evapRate = parseInt(this.value);
    document.getElementById('evaporationRateValue').textContent = evapRate;
    evaporationRate = evapRate / 100;
  });
  
  document.getElementById('antSpeed').addEventListener('input', function() {
    antSpeed = parseInt(this.value) / 3;
    document.getElementById('antSpeedValue').textContent = this.value;
  });
  
  document.getElementById('showPheromones').addEventListener('change', function() {
    showPheromones = this.checked;
  });
  
  document.getElementById('showStats').addEventListener('change', function() {
    showStats = this.checked;
    document.getElementById('simulation-overlay').style.display = showStats ? 'block' : 'none';
  });
  
  document.getElementById('enableDayNight').addEventListener('change', function() {
    enableDayNight = this.checked;
  });
  
  // Botón de reinicio
  document.getElementById('resetButton').addEventListener('click', resetSimulation);
  
  // Botones de interacción
  document.getElementById('addObstacleBtn').addEventListener('click', function() {
    currentMode = currentMode === 'placeObstacle' ? 'normal' : 'placeObstacle';
    // Resetear otros modos
    if (currentMode === 'placeObstacle') {
      this.style.backgroundColor = '#ff9800';
      document.getElementById('addFoodBtn').style.backgroundColor = '';
      document.getElementById('addPredatorBtn').style.backgroundColor = '';
    } else {
      this.style.backgroundColor = '';
    }
  });
  
  document.getElementById('addFoodBtn').addEventListener('click', function() {
    currentMode = currentMode === 'placeFood' ? 'normal' : 'placeFood';
    // Resetear otros modos
    if (currentMode === 'placeFood') {
      this.style.backgroundColor = '#ff9800';
      document.getElementById('addObstacleBtn').style.backgroundColor = '';
      document.getElementById('addPredatorBtn').style.backgroundColor = '';
    } else {
      this.style.backgroundColor = '';
    }
  });
  
  document.getElementById('addPredatorBtn').addEventListener('click', function() {
    currentMode = currentMode === 'placePredator' ? 'normal' : 'placePredator';
    // Resetear otros modos
    if (currentMode === 'placePredator') {
      this.style.backgroundColor = '#ff9800';
      document.getElementById('addObstacleBtn').style.backgroundColor = '';
      document.getElementById('addFoodBtn').style.backgroundColor = '';
    } else {
      this.style.backgroundColor = '';
    }
  });
  
  document.getElementById('togglePauseBtn').addEventListener('click', function() {
    paused = !paused;
    const pauseIcon = document.getElementById('pauseIcon');
    const pauseText = document.getElementById('pauseText');
    
    if (paused) {
      pauseIcon.className = 'fas fa-play';
      pauseText.textContent = 'Reanudar';
      this.style.backgroundColor = '#4CAF50';
    } else {
      pauseIcon.className = 'fas fa-pause';
      pauseText.textContent = 'Pausar';
      this.style.backgroundColor = '';
    }
  });
}

// Añadimos estas funciones para manejar eventos del mouse
function mousePressed() {
  mouseIsPressed = true;
  handleMouseInteraction();
}

function mouseReleased() {
  mouseIsPressed = false;
  lastMouseX = undefined;
  lastMouseY = undefined;
}

function mouseDragged() {
  handleMouseInteraction();
}

// Función modificada para procesar las interacciones continuas del ratón
function processMouseInteractions() {
  // Esta función ahora solo se usa para interacciones continuas
  // Las interacciones principales se manejan con mousePressed y mouseDragged
}

// Maneja las interacciones del ratón dependiendo del modo actual
function handleMouseInteraction() {
  const mouseXInCanvas = mouseX;
  const mouseYInCanvas = mouseY;
  
  if (mouseXInCanvas < 0 || mouseXInCanvas > width || mouseYInCanvas < 0 || mouseYInCanvas > height) {
    return; // Fuera del canvas
  }
  
  if (currentMode === 'placeFood') {
    addFoodAtPosition(mouseXInCanvas, mouseYInCanvas);
    // Ya no cambiamos automáticamente al modo normal
    // El usuario puede seguir colocando comida mientras el botón esté activo
  } else if (currentMode === 'placeObstacle') {
    // Si es la primera vez que se hace clic o si el ratón se ha movido lo suficiente
    if (lastMouseX === undefined || lastMouseY === undefined || 
        dist(mouseXInCanvas, mouseYInCanvas, lastMouseX, lastMouseY) > 10) {
      addObstacleAtPosition(mouseXInCanvas, mouseYInCanvas);
      lastMouseX = mouseXInCanvas;
      lastMouseY = mouseYInCanvas;
    }
  } else if (currentMode === 'placePredator') {
    addPredatorAtPosition(mouseXInCanvas, mouseYInCanvas);
    // Ya no cambiamos automáticamente al modo normal
    // El usuario puede seguir colocando depredadores mientras el botón esté activo
  }
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

// Dibuja el nido
function drawNest() {
  fill(139, 69, 19);
  noStroke();
  ellipse(nest.x, nest.y, nest.size);
  
  // El nido emite feromonas de hogar constantemente
  emitHomePheromoneFromNest();
}

// Dibuja las fuentes de comida
function drawFoodSources() {
  for (let food of foods) {
    food.display();
  }
}

// Dibuja los obstáculos
function drawObstacles() {
  for (let obstacle of obstacles) {
    obstacle.display();
  }
}

// Dibuja el mapa de feromonas
function drawPheromones() {
  noStroke();
  
  // Iterar solo por las celdas que tienen feromonas (optimización)
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      // Feromonas de regreso al nido (azul)
      if (homePheromoneMap[x][y] > 0) {
        let alphaValue = map(homePheromoneMap[x][y], 0, 10, 0, 150);
        fill(HOME_PHEROMONE_COLOR[0], HOME_PHEROMONE_COLOR[1], HOME_PHEROMONE_COLOR[2], alphaValue);
        rect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
      
      // Feromonas de búsqueda de comida (verde)
      if (foodPheromoneMap[x][y] > 0) {
        let alphaValue = map(foodPheromoneMap[x][y], 0, 10, 0, 150);
        fill(FOOD_PHEROMONE_COLOR[0], FOOD_PHEROMONE_COLOR[1], FOOD_PHEROMONE_COLOR[2], alphaValue);
        rect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
}

// Actualiza y dibuja las hormigas
function updateAnts() {
  for (let ant of ants) {
    ant.update();
    ant.display();
  }
}

// Evapora gradualmente las feromonas
function evaporatePheromones() {
  // Primero difundir las feromonas a celdas vecinas
  diffusePheromones();
  
  // Luego aplicar evaporación
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      // Evaporar feromonas de regreso al nido
      if (homePheromoneMap[x][y] > 0) {
        homePheromoneMap[x][y] -= homePheromoneMap[x][y] * evaporationRate;
        if (homePheromoneMap[x][y] < 0.05) {
          homePheromoneMap[x][y] = 0;
        }
      }
      // Evaporar feromonas de búsqueda de comida
      if (foodPheromoneMap[x][y] > 0) {
        foodPheromoneMap[x][y] -= foodPheromoneMap[x][y] * evaporationRate;
        if (foodPheromoneMap[x][y] < 0.05) {
          foodPheromoneMap[x][y] = 0;
        }
      }
    }
  }
}

// Difunde las feromonas a celdas vecinas
function diffusePheromones() {
  // Tasa de difusión (porcentaje de feromona que se difunde a celdas vecinas)
  const diffusionRate = 0.05; // 5% de difusión
  
  // Crear copias temporales de los mapas de feromonas para no afectar cálculos en el mismo ciclo
  let tempHomePheromoneMap = new Array(gridWidth);
  let tempFoodPheromoneMap = new Array(gridWidth);
  
  for (let x = 0; x < gridWidth; x++) {
    tempHomePheromoneMap[x] = new Array(gridHeight);
    tempFoodPheromoneMap[x] = new Array(gridHeight);
    
    for (let y = 0; y < gridHeight; y++) {
      tempHomePheromoneMap[x][y] = homePheromoneMap[x][y];
      tempFoodPheromoneMap[x][y] = foodPheromoneMap[x][y];
    }
  }
  
  // Recorrer cada celda con feromonas y distribuir parte a los vecinos
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      // Procesar feromonas de regreso al nido
      if (homePheromoneMap[x][y] > 0.1) { // Solo difundir si hay una cantidad significativa
        const amountToDiffuse = homePheromoneMap[x][y] * diffusionRate;
        const amountPerNeighbor = amountToDiffuse / 8; // Distribuir entre los 8 vecinos
        
        // Difundir a los 8 vecinos (patrón de Moore)
        for (let nx = -1; nx <= 1; nx++) {
          for (let ny = -1; ny <= 1; ny++) {
            if (nx === 0 && ny === 0) continue; // Saltar la celda central
            
            const neighborX = x + nx;
            const neighborY = y + ny;
            
            // Verificar que el vecino esté dentro de los límites
            if (neighborX >= 0 && neighborX < gridWidth && neighborY >= 0 && neighborY < gridHeight) {
              tempHomePheromoneMap[neighborX][neighborY] += amountPerNeighbor;
              tempHomePheromoneMap[x][y] -= amountPerNeighbor;
            }
          }
        }
      }
      
      // Procesar feromonas de búsqueda de comida
      if (foodPheromoneMap[x][y] > 0.1) { // Solo difundir si hay una cantidad significativa
        const amountToDiffuse = foodPheromoneMap[x][y] * diffusionRate;
        const amountPerNeighbor = amountToDiffuse / 8; // Distribuir entre los 8 vecinos
        
        // Difundir a los 8 vecinos (patrón de Moore)
        for (let nx = -1; nx <= 1; nx++) {
          for (let ny = -1; ny <= 1; ny++) {
            if (nx === 0 && ny === 0) continue; // Saltar la celda central
            
            const neighborX = x + nx;
            const neighborY = y + ny;
            
            // Verificar que el vecino esté dentro de los límites
            if (neighborX >= 0 && neighborX < gridWidth && neighborY >= 0 && neighborY < gridHeight) {
              tempFoodPheromoneMap[neighborX][neighborY] += amountPerNeighbor;
              tempFoodPheromoneMap[x][y] -= amountPerNeighbor;
            }
          }
        }
      }
    }
  }
  
  // Actualizar los mapas de feromonas con los valores difundidos
  homePheromoneMap = tempHomePheromoneMap;
  foodPheromoneMap = tempFoodPheromoneMap;
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
    
    // Comportamiento cuando busca comida
    searchForFood: function() {
      // Añadir componente aleatorio al movimiento
      this.direction += random(-this.wanderStrength, this.wanderStrength);
      
      // Seguir feromonas de comida (si hay)
      this.followPheromones();
      
      // Verificar si encontró comida
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
    
    // Seguir rastros de feromonas
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
      
      for (let i = -1; i <= 1; i++) {
        let senseAngle = this.direction + (i * PI / 4);
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
        let adjustmentStrength = min(maxPheromone / 10, 0.2);
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
    
    // Evita obstáculos detectando colisiones
    avoidObstacles: function() {
      for (let obstacle of obstacles) {
        let distToObstacle = dist(this.x, this.y, obstacle.x, obstacle.y);
        
        if (distToObstacle < obstacle.size / 2 + this.size) {
          // Calcular dirección de rebote (opuesta al obstáculo)
          let angleAwayFromObstacle = atan2(this.y - obstacle.y, this.x - obstacle.x);
          
          // Girar hacia esa dirección
          this.direction = angleAwayFromObstacle;
          
          // Mover ligeramente lejos del obstáculo
          this.x += cos(this.direction) * 2;
          this.y += sin(this.direction) * 2;
        }
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
      rotate(this.direction);
      
      // Crear una representación gráfica de hormiga similar al ícono fa-bug
      // Cuerpo principal
      if (this.hasFood) {
        // Con comida
        fill(150, 75, 0); // Marrón para el cuerpo
      } else {
        // Sin comida
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
      
      pop();
    }
  };
  
  return baseAnt;
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

// El nido emite feromonas de hogar para guiar a las hormigas de regreso
function emitHomePheromoneFromNest() {
  // Radio de influencia del nido para las feromonas
  const nestInfluenceRadius = Math.ceil(nest.size / cellSize) + 3;
  
  // Coordenadas del nido en la cuadrícula
  const nestGridX = Math.floor(nest.x / cellSize);
  const nestGridY = Math.floor(nest.y / cellSize);
  
  // Intensidad base de las feromonas del nido
  const nestPheromoneStrength = 10; // Valor máximo
  
  // Emitir feromonas en un área circular alrededor del nido
  for (let dx = -nestInfluenceRadius; dx <= nestInfluenceRadius; dx++) {
    for (let dy = -nestInfluenceRadius; dy <= nestInfluenceRadius; dy++) {
      const gridX = nestGridX + dx;
      const gridY = nestGridY + dy;
      
      // Verificar que estamos dentro de los límites de la cuadrícula
      if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
        // Calcular distancia al centro del nido (en celdas)
        const distSquared = dx * dx + dy * dy;
        
        if (distSquared <= nestInfluenceRadius * nestInfluenceRadius) {
          // La intensidad disminuye con la distancia al nido
          const distanceFactor = 1 - (Math.sqrt(distSquared) / nestInfluenceRadius);
          const intensity = nestPheromoneStrength * distanceFactor;
          
          // Establecer valor mínimo para asegurar que haya suficiente feromona
          homePheromoneMap[gridX][gridY] = Math.max(homePheromoneMap[gridX][gridY], intensity);
        }
      }
    }
  }
}

// Actualiza la interfaz de usuario y las estadísticas
function updateUI() {
  // Contar hormigas activas
  activeAntsCount = ants.length;
  
  // Reemplazar hormigas muertas periódicamente para mantener la población
  if (activeAntsCount < antCount && frameCount % 30 === 0) {
    ants.push(createAnt('explorer'));
    totalAntsCreated++;
  }
  
  // Actualizar elementos HTML
  document.getElementById('foodCollected').textContent = foodCollected;
  document.getElementById('activeAnts').textContent = activeAntsCount;
  
  // Actualizar tiempo de simulación (formato mm:ss)
  const minutes = Math.floor(simulationTime / 60);
  const seconds = Math.floor(simulationTime % 60);
  document.getElementById('simulationTime').textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Calcular eficiencia (comida recolectada por hormiga creada)
  efficiency = totalAntsCreated > 0 ? Math.round((foodCollected / totalAntsCreated) * 100) : 0;
  document.getElementById('efficiency').textContent = `${efficiency}%`;
  
  // Dibujar estadísticas en pantalla si está activado
  if (showStats) {
    // Mostrar un resumen en el canvas
    push();
    fill(0, 0, 0, 180);
    noStroke();
    rect(10, 10, 180, 60, 5);
    
    fill(255);
    textAlign(LEFT, TOP);
    textSize(12);
    text(`Hormigas: ${activeAntsCount}`, 20, 20);
    text(`Comida recolectada: ${foodCollected}`, 20, 40);
    pop();
  }
}

// Cuenta la cantidad de hormigas de cada tipo
function countAntsByType(type) {
  return ants.filter(ant => ant.type === type).length;
}

// Asegurar que el canvas se redimensione cuando cambia el tamaño de la ventana
function windowResized() {
  const container = document.getElementById('sketch-container');
  resizeCanvas(container.offsetWidth, container.offsetHeight);
  
  let oldGridWidth = gridWidth;
  let oldGridHeight = gridHeight;
  gridWidth = Math.ceil(width / cellSize);
  gridHeight = Math.ceil(height / cellSize);
  
  if (gridWidth !== oldGridWidth || gridHeight !== oldGridHeight) {
    // Redimensionar homePheromoneMap
    let newHomePheromoneMap = new Array(gridWidth);
    for (let x = 0; x < gridWidth; x++) {
      newHomePheromoneMap[x] = new Array(gridHeight).fill(0);
      if (x < oldGridWidth) {
        for (let y = 0; y < Math.min(oldGridHeight, gridHeight); y++) {
          if (homePheromoneMap && homePheromoneMap[x]) { // Comprobar si la fila antigua existe
             newHomePheromoneMap[x][y] = homePheromoneMap[x][y];
          }
        }
      }
    }
    homePheromoneMap = newHomePheromoneMap;

    // Redimensionar foodPheromoneMap
    let newFoodPheromoneMap = new Array(gridWidth);
    for (let x = 0; x < gridWidth; x++) {
      newFoodPheromoneMap[x] = new Array(gridHeight).fill(0);
      if (x < oldGridWidth) {
        for (let y = 0; y < Math.min(oldGridHeight, gridHeight); y++) {
          if (foodPheromoneMap && foodPheromoneMap[x]) { // Comprobar si la fila antigua existe
             newFoodPheromoneMap[x][y] = foodPheromoneMap[x][y];
          }
        }
      }
    }
    foodPheromoneMap = newFoodPheromoneMap;
  }
}