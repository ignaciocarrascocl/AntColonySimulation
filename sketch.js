// Main sketch file - Punto de entrada para la simulación

// Configuración inicial
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

// Ciclo de dibujado principal
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
  
  // Actualizar contador en la UI (solo si el elemento existe)
  const foodCollectedElement = document.getElementById('foodCollected');
  if (foodCollectedElement) {
    foodCollectedElement.textContent = foodCollected;
  }
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