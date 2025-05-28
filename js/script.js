// Configuration et variables globales
let currentDifficulty = 'easy';
let difficultySettings = {
    'easy': { grid: 3, pieces: 9 },
    'medium': { grid: 4, pieces: 16 },
    'hard': { grid: 6, pieces: 36 }
};

let images = {
    'easy': 'images/easy/beach_scene.jpeg',
    'medium': 'images/medium/foggy_tree.jpeg',
    'hard': 'images/hard/mountains_lake.jpeg'
};

let timerInterval;
let seconds = 0;
let minutes = 0;
let isPlaying = false;
let puzzlePieces = [];
let correctPositions = [];
let selectedPiece = null;
let draggedPiece = null;
let draggedIndex = null;

// Éléments DOM
const puzzleBoard = document.getElementById('puzzle-board');
const previewImage = document.getElementById('preview');
const startBtn = document.getElementById('start-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const resetBtn = document.getElementById('reset-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
const difficultyInfos = document.querySelectorAll('.info-text');
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const completionTimeDisplay = document.getElementById('completion-time');
const puzzleComplete = document.getElementById('puzzle-complete');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Charger l'aperçu de l'image par défaut (niveau facile)
    previewImage.src = images[currentDifficulty];
    
    // Ajouter les écouteurs d'événements
    startBtn.addEventListener('click', startGame);
    shuffleBtn.addEventListener('click', shufflePieces);
    resetBtn.addEventListener('click', resetGame);
    playAgainBtn.addEventListener('click', resetGame);
    
    // Écouteurs pour les boutons de difficulté
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Réinitialiser le jeu si on change de difficulté pendant une partie
            if (isPlaying) {
                resetGame();
            }
            
            // Mettre à jour la difficulté sélectionnée
            currentDifficulty = btn.id;
            
            // Mettre à jour l'UI pour la difficulté
            updateDifficultyUI(btn.id);
            
            // Charger la nouvelle image d'aperçu
            previewImage.src = images[currentDifficulty];
        });
    });
});

// Mettre à jour l'UI pour la difficulté sélectionnée
function updateDifficultyUI(difficulty) {
    // Mettre à jour les boutons
    difficultyBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.id === difficulty) {
            btn.classList.add('active');
        }
    });
    
    // Mettre à jour les infos
    difficultyInfos.forEach(info => {
        info.classList.remove('active');
        if (info.id === `${difficulty}-info`) {
            info.classList.add('active');
        }
    });
}

// Démarrer le jeu
function startGame() {
    isPlaying = true;
    
    // Activer/désactiver les boutons appropriés
    startBtn.disabled = true;
    shuffleBtn.disabled = false;
    resetBtn.disabled = false;
    
    // Désactiver les boutons de difficulté pendant le jeu
    difficultyBtns.forEach(btn => {
        btn.disabled = true;
    });
    
    // Créer le puzzle
    createPuzzle();
    
    // Démarrer le chronomètre
    startTimer();
    
    // Cacher le message de félicitations s'il était visible
    puzzleComplete.classList.add('hidden');
}

// Créer le puzzle
function createPuzzle() {
    // Vider le plateau de jeu
    puzzleBoard.innerHTML = '';
    puzzlePieces = [];
    correctPositions = [];
    
    // Obtenir les paramètres de la grille en fonction de la difficulté
    const gridSize = difficultySettings[currentDifficulty].grid;
    
    // Configurer la grille CSS
    puzzleBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    puzzleBoard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    
    // Créer une image temporaire pour obtenir les dimensions
    const tempImage = new Image();
    tempImage.src = images[currentDifficulty];
    
    tempImage.onload = function() {
        // Créer les pièces du puzzle
        for (let i = 0; i < gridSize * gridSize; i++) {
            const piece = document.createElement('div');
            piece.classList.add('puzzle-piece');
            piece.dataset.index = i;
            piece.dataset.correctPosition = i; // Stocker la position correcte
            
            // Calculer la position de la pièce dans l'image originale
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            
            // Créer un conteneur pour l'image découpée
            const imgContainer = document.createElement('div');
            imgContainer.style.width = '100%';
            imgContainer.style.height = '100%';
            imgContainer.style.overflow = 'hidden';
            imgContainer.style.position = 'relative';
            
            // Créer l'élément image pour un découpage précis
            const img = document.createElement('img');
            img.src = images[currentDifficulty];
            img.style.position = 'absolute';
            img.style.width = `${gridSize * 100}%`;
            img.style.height = `${gridSize * 100}%`;
            img.style.objectFit = 'cover';
            img.style.left = `${-col * 100}%`;
            img.style.top = `${-row * 100}%`;
            
            // Ajouter l'image au conteneur
            imgContainer.appendChild(img);
            
            // Ajouter le conteneur à la pièce
            piece.appendChild(imgContainer);
            
            // Ajouter les écouteurs pour le glisser-déposer
            piece.draggable = true;
            piece.addEventListener('dragstart', dragStart);
            piece.addEventListener('dragover', dragOver);
            piece.addEventListener('dragenter', dragEnter);
            piece.addEventListener('dragleave', dragLeave);
            piece.addEventListener('drop', drop);
            piece.addEventListener('dragend', dragEnd);
            
            // Pour les appareils tactiles
            piece.addEventListener('touchstart', touchStart, { passive: false });
            piece.addEventListener('touchmove', touchMove, { passive: false });
            piece.addEventListener('touchend', touchEnd);
            
            // Ajouter la pièce au plateau
            puzzleBoard.appendChild(piece);
            puzzlePieces.push(piece);
            correctPositions.push(i);
        }
        
        // Mélanger les pièces
        shufflePieces();
    };
}

// Fonctions de glisser-déposer
function dragStart(e) {
    draggedPiece = this;
    draggedIndex = parseInt(this.dataset.index);
    setTimeout(() => {
        this.classList.add('dragging');
    }, 0);
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function dragLeave() {
    this.classList.remove('drag-over');
}

function drop() {
    this.classList.remove('drag-over');
    
    // Échanger les pièces
    const targetIndex = parseInt(this.dataset.index);
    swapPieces(draggedIndex, targetIndex);
    
    // Vérifier si le puzzle est résolu
    checkPuzzleCompletion();
}

function dragEnd() {
    this.classList.remove('dragging');
}

// Fonctions tactiles pour les appareils mobiles
function touchStart(e) {
    e.preventDefault();
    selectedPiece = this;
    draggedIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
}

function touchMove(e) {
    e.preventDefault();
    if (!selectedPiece) return;
    
    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    
    // Trouver la pièce de puzzle sous le doigt
    const targetPiece = elements.find(el => el.classList.contains('puzzle-piece') && el !== selectedPiece);
    
    if (targetPiece) {
        // Simuler un survol
        document.querySelectorAll('.puzzle-piece').forEach(piece => {
            piece.classList.remove('drag-over');
        });
        targetPiece.classList.add('drag-over');
    }
}

function touchEnd(e) {
    if (!selectedPiece) return;
    
    const touch = e.changedTouches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    
    // Trouver la pièce de puzzle sous le doigt
    const targetPiece = elements.find(el => el.classList.contains('puzzle-piece') && el !== selectedPiece);
    
    if (targetPiece) {
        // Échanger les pièces
        const targetIndex = parseInt(targetPiece.dataset.index);
        swapPieces(draggedIndex, targetIndex);
        
        // Vérifier si le puzzle est résolu
        checkPuzzleCompletion();
    }
    
    // Nettoyer
    document.querySelectorAll('.puzzle-piece').forEach(piece => {
        piece.classList.remove('drag-over');
    });
    selectedPiece.classList.remove('dragging');
    selectedPiece = null;
}

// Échanger deux pièces
function swapPieces(index1, index2) {
    // Échanger les positions dans le tableau
    [puzzlePieces[index1], puzzlePieces[index2]] = [puzzlePieces[index2], puzzlePieces[index1]];
    
    // Échanger les positions actuelles dans le DOM
    // Mais garder les positions correctes intactes
    const currentPos1 = puzzlePieces[index1].dataset.index;
    const currentPos2 = puzzlePieces[index2].dataset.index;
    
    puzzlePieces[index1].dataset.index = currentPos2;
    puzzlePieces[index2].dataset.index = currentPos1;
    
    // Réorganiser visuellement les pièces
    puzzleBoard.innerHTML = '';
    puzzlePieces.forEach(piece => {
        puzzleBoard.appendChild(piece);
    });
}

// Mélanger les pièces
function shufflePieces() {
    // Algorithme de Fisher-Yates pour mélanger
    for (let i = puzzlePieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        swapPieces(i, j);
    }
    
    // S'assurer que le puzzle n'est pas déjà résolu après le mélange
    if (isPuzzleSolved()) {
        shufflePieces();
    }
    
    // Mélanger à nouveau si moins de 30% des pièces sont déplacées
    let displacedCount = 0;
    for (let i = 0; i < puzzlePieces.length; i++) {
        if (parseInt(puzzlePieces[i].dataset.index) !== parseInt(puzzlePieces[i].dataset.correctPosition)) {
            displacedCount++;
        }
    }
    
    if (displacedCount < puzzlePieces.length * 0.3) {
        shufflePieces();
    }
}

// Vérifier si le puzzle est résolu
function isPuzzleSolved() {
    for (let i = 0; i < puzzlePieces.length; i++) {
        // Vérifier que la position actuelle correspond à la position correcte
        if (parseInt(puzzlePieces[i].dataset.index) !== parseInt(puzzlePieces[i].dataset.correctPosition)) {
            return false;
        }
    }
    return true;
}

// Vérifier si le puzzle est complété
function checkPuzzleCompletion() {
    if (isPuzzleSolved()) {
        console.log("Puzzle résolu ! Affichage du message de félicitations.");
        
        // Arrêter le chronomètre
        stopTimer();
        
        // Afficher le temps de complétion
        completionTimeDisplay.textContent = `${padTime(minutes)}:${padTime(seconds)}`;
        
        // Afficher le message de félicitations
        puzzleComplete.classList.remove('hidden');
        puzzleComplete.style.display = 'flex';
        
        // Réinitialiser l'état du jeu
        isPlaying = false;
        
        // Réactiver les boutons de difficulté
        difficultyBtns.forEach(btn => {
            btn.disabled = false;
        });
    }
}

// Réinitialiser le jeu
function resetGame() {
    // Arrêter le chronomètre
    stopTimer();
    
    // Réinitialiser le temps
    seconds = 0;
    minutes = 0;
    updateTimerDisplay();
    
    // Réinitialiser l'état du jeu
    isPlaying = false;
    
    // Vider le plateau
    puzzleBoard.innerHTML = '';
    puzzlePieces = [];
    
    // Réinitialiser les boutons
    startBtn.disabled = false;
    shuffleBtn.disabled = true;
    resetBtn.disabled = true;
    
    // Réactiver les boutons de difficulté
    difficultyBtns.forEach(btn => {
        btn.disabled = false;
    });
    
    // Cacher le message de félicitations
    puzzleComplete.classList.add('hidden');
}

// Fonctions du chronomètre
function startTimer() {
    // Réinitialiser le temps
    seconds = 0;
    minutes = 0;
    updateTimerDisplay();
    
    // Démarrer l'intervalle
    timerInterval = setInterval(() => {
        seconds++;
        if (seconds >= 60) {
            seconds = 0;
            minutes++;
        }
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function updateTimerDisplay() {
    minutesDisplay.textContent = padTime(minutes);
    secondsDisplay.textContent = padTime(seconds);
}

function padTime(time) {
    return time.toString().padStart(2, '0');
}
