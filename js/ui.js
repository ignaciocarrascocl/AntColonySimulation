// ui.js - Gestión de la interfaz de usuario, eventos y estadísticas

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

// Actualiza la interfaz de usuario y las estadísticas
function updateUI() {
  // Contar hormigas activas
  activeAntsCount = ants.length;
  
  // Reemplazar hormigas muertas periódicamente para mantener la población
  if (activeAntsCount < antCount && frameCount % 30 === 0) {
    ants.push(createAnt('explorer'));
    totalAntsCreated++;
  }
  
  // Actualizar elementos HTML (solo si existen)
  const foodCollectedElement = document.getElementById('foodCollected');
  if (foodCollectedElement) {
    foodCollectedElement.textContent = foodCollected;
  }
  
  const activeAntsElement = document.getElementById('activeAnts');
  if (activeAntsElement) {
    activeAntsElement.textContent = activeAntsCount;
  }
  
  // Actualizar tiempo de simulación (formato mm:ss)
  const minutes = Math.floor(simulationTime / 60);
  const seconds = Math.floor(simulationTime % 60);
  
  const simulationTimeElement = document.getElementById('simulationTime');
  if (simulationTimeElement) {
    simulationTimeElement.textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Calcular eficiencia (comida recolectada por hormiga creada)
  efficiency = totalAntsCreated > 0 ? Math.round((foodCollected / totalAntsCreated) * 100) : 0;
  
  const efficiencyElement = document.getElementById('efficiency');
  if (efficiencyElement) {
    efficiencyElement.textContent = `${efficiency}%`;
  }
  
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