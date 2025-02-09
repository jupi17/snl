// État du jeu
let gameState = {
    players: [],
    properties: {},
    currentPlayer: null,
    history: []
};

// Configuration des couleurs des joueurs
const PLAYER_COLORS = {
    1: { name: 'Rouge', hex: '#ff4444' },
    2: { name: 'Bleu', hex: '#4444ff' },
    3: { name: 'Vert', hex: '#44ff44' },
    4: { name: 'Jaune', hex: '#ffff44' }
};

// Configuration du plateau
const BOARD_CONFIG = {
    // Les cases seront définies ici
    properties: [
        { id: 1, name: 'Départ', type: 'special' },
        { id: 2, name: 'Belleville', type: 'property', group: 'brown' },
        { id: 3, name: 'Caisse', type: 'chest' },
        { id: 4, name: 'Lecourbe', type: 'property', group: 'brown' },
        // ... autres cases à définir
    ]
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeBoard();
    setupEventListeners();
    loadGameState();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Gestion de l'ajout de joueurs
    const playerInput = document.getElementById('player-input');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const newGameBtn = document.getElementById('new-game-btn');

    if (playerInput && addPlayerBtn) {
        playerInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' && playerInput.value.trim() !== '') {
                addPlayer(playerInput.value.trim());
                playerInput.value = '';
            }
        });

        addPlayerBtn.addEventListener('click', () => {
            if (playerInput.value.trim() !== '') {
                addPlayer(playerInput.value.trim());
                playerInput.value = '';
            }
        });
    }

    if (newGameBtn) {
        newGameBtn.addEventListener('click', newGame);
    }
}

// Initialisation du plateau
function initializeBoard() {
    const board = document.getElementById('monopoly-board');
    if (!board) return;

    // Création des cases
    BOARD_CONFIG.properties.forEach(property => {
        const cell = createPropertyCell(property);
        board.appendChild(cell);
    });
}

// Création d'une case
function createPropertyCell(property) {
    const cell = document.createElement('div');
    cell.className = 'monopoly-cell';
    cell.dataset.propertyId = property.id;
    cell.innerHTML = `
        <div class="property-name">${property.name}</div>
    `;
    
    cell.addEventListener('click', () => showPropertyModal(property));
    return cell;
}

// Affichage de la modal de propriété
function showPropertyModal(property) {
    const modal = document.getElementById('propertyModal');
    const propertyInfo = document.getElementById('property-info');
    const propertyActions = document.getElementById('property-actions');

    // Mise à jour des informations
    propertyInfo.innerHTML = `
        <h3>${property.name}</h3>
        <p>Type: ${property.type}</p>
        ${property.group ? `<p>Groupe: ${property.group}</p>` : ''}
    `;

    // Mise à jour des actions disponibles
    propertyActions.innerHTML = `
        <div class="btn-group">
            ${gameState.players.map(player => `
                <button class="btn btn-outline-primary" onclick="assignProperty(${property.id}, ${player.id})">
                    Donner à ${player.name}
                </button>
            `).join('')}
            <button class="btn btn-outline-danger" onclick="removeProperty(${property.id})">
                Retirer la propriété
            </button>
        </div>
    `;

    // Affichage de la modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Gestion des joueurs
function addPlayer(name) {
    if (gameState.players.length >= 4) {
        alert('Maximum 4 joueurs !');
        return;
    }

    const playerId = gameState.players.length + 1;
    const player = {
        id: playerId,
        name: name,
        color: PLAYER_COLORS[playerId]
    };

    gameState.players.push(player);
    addToHistory(`${name} a rejoint la partie`);
    updatePlayersDisplay();
    saveGameState();
}

// Gestion des propriétés
function assignProperty(propertyId, playerId) {
    gameState.properties[propertyId] = playerId;
    updateBoard();
    const player = gameState.players.find(p => p.id === playerId);
    addToHistory(`Propriété ${BOARD_CONFIG.properties.find(p => p.id === propertyId)?.name} attribuée à ${player?.name}`);
    saveGameState();
}

function removeProperty(propertyId) {
    const property = BOARD_CONFIG.properties.find(p => p.id === propertyId);
    delete gameState.properties[propertyId];
    updateBoard();
    addToHistory(`Propriété ${property?.name} retirée`);
    saveGameState();
}

// Mise à jour de l'affichage
function updateBoard() {
    Object.entries(gameState.properties).forEach(([propertyId, playerId]) => {
        const cell = document.querySelector(`.monopoly-cell[data-property-id="${propertyId}"]`);
        if (cell) {
            cell.className = `monopoly-cell owned owned-player-${playerId}`;
        }
    });
}

function updatePlayersDisplay() {
    const playersList = document.getElementById('players-list');
    if (!playersList) return;

    playersList.innerHTML = gameState.players.map(player => `
        <div class="player-item">
            <div class="d-flex align-items-center">
                <div class="player-color player-color-${player.id}"></div>
                <span>${player.name}</span>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="removePlayer(${player.id})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    // Mise à jour du bouton d'ajout de joueur
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playerInput = document.getElementById('player-input');
    if (addPlayerBtn && playerInput) {
        const disabled = gameState.players.length >= 4;
        addPlayerBtn.disabled = disabled;
        playerInput.disabled = disabled;
        if (disabled) {
            playerInput.placeholder = 'Maximum de joueurs atteint';
        } else {
            playerInput.placeholder = 'Nom du joueur';
        }
    }
}

// Suppression d'un joueur
function removePlayer(playerId) {
    gameState.players = gameState.players.filter(p => p.id !== playerId);
    // Réorganiser les IDs des joueurs restants
    gameState.players.forEach((player, index) => {
        player.id = index + 1;
        player.color = PLAYER_COLORS[player.id];
    });
    // Supprimer les propriétés du joueur
    Object.entries(gameState.properties).forEach(([propId, ownerId]) => {
        if (ownerId === playerId) {
            delete gameState.properties[propId];
        }
    });
    updateBoard();
    updatePlayersDisplay();
    saveGameState();
}

// Gestion de l'historique
function addToHistory(message) {
    const timestamp = new Date().toLocaleTimeString();
    gameState.history.unshift(`${timestamp} - ${message}`);
    updateHistory();
}

function updateHistory() {
    const historyLog = document.getElementById('game-history');
    if (!historyLog) return;

    historyLog.innerHTML = gameState.history.map(entry => `
        <div class="log-entry">${entry}</div>
    `).join('');
}

// Sauvegarde et chargement
function saveGameState() {
    localStorage.setItem('monopoly_state', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('monopoly_state');
    if (saved) {
        gameState = JSON.parse(saved);
        updateBoard();
        updatePlayersDisplay();
        updateHistory();
    }
}

// Nouvelle partie
function newGame() {
    const modal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('confirmNewGame');
    const cancelBtn = document.getElementById('cancelNewGame');

    const handleConfirm = () => {
        gameState = {
            players: [],
            properties: {},
            currentPlayer: null,
            history: []
        };
        saveGameState();
        updateBoard();
        updatePlayersDisplay();
        updateHistory();
        closeModal();
    };

    const handleCancel = () => {
        closeModal();
    };

    const closeModal = () => {
        modal.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };

    modal.classList.add('active');
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
}
