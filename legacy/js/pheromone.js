// pheromone.js - Sistema de feromonas y su gestión

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
  
  // Inicializar el búfer para dibujar las feromonas
  if (pheromoneBuffer) pheromoneBuffer.remove();
  pheromoneBuffer = createGraphics(width, height);
}

// Dibuja el mapa de feromonas usando un búfer para mejor rendimiento
function drawPheromones() {
  // Si el búfer no existe o cambió el tamaño del canvas, recrearlo
  if (!pheromoneBuffer || pheromoneBuffer.width !== width || pheromoneBuffer.height !== height) {
    if (pheromoneBuffer) pheromoneBuffer.remove();
    pheromoneBuffer = createGraphics(width, height);
  }
  
  // Limpiar el búfer
  pheromoneBuffer.clear();
  pheromoneBuffer.noStroke();
  
  // Iterar solo por las celdas que tienen feromonas (optimización)
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      // Feromonas de regreso al nido (azul)
      if (homePheromoneMap[x][y] > 0.05) {
        let alphaValue = map(homePheromoneMap[x][y], 0, 10, 0, 150);
        pheromoneBuffer.fill(HOME_PHEROMONE_COLOR[0], HOME_PHEROMONE_COLOR[1], HOME_PHEROMONE_COLOR[2], alphaValue);
        pheromoneBuffer.rect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
      
      // Feromonas de búsqueda de comida (verde)
      if (foodPheromoneMap[x][y] > 0.05) {
        let alphaValue = map(foodPheromoneMap[x][y], 0, 10, 0, 150);
        pheromoneBuffer.fill(FOOD_PHEROMONE_COLOR[0], FOOD_PHEROMONE_COLOR[1], FOOD_PHEROMONE_COLOR[2], alphaValue);
        pheromoneBuffer.rect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
  
  // Dibujar el búfer en el canvas principal
  image(pheromoneBuffer, 0, 0);
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