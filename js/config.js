// config.js - Configuración global de la simulación

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