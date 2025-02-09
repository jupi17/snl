// Variables globales
let players = [];
let gameStarted = false;
let lastMovedIndex = null;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    loadPlayers();
    loadGameStatus();
    setupEventListeners();
});

// Chargement des données
function loadPlayers() {
    const stored = localStorage.getItem('snl_players');
    if (stored) {
        players = JSON.parse(stored);
        renderGamePlayers();
        renderSetupList();
    }
}

function loadGameStatus() {
    const storedStatus = localStorage.getItem('snl_gameStarted');
    gameStarted = storedStatus === 'true';
    if (gameStarted) {
        document.getElementById('setup-section').style.display = 'none';
        document.getElementById('game-section').style.display = 'block';
        renderGamePlayers();
    }
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Écouteurs pour l'ajout de joueurs
    const playerInput = document.getElementById('player-input');
    const gamePlayerInput = document.getElementById('game-player-input');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const gameAddPlayerBtn = document.getElementById('game-add-player-btn');
    const newGameBtn = document.getElementById('new-game-btn');

    if (playerInput) {
        playerInput.addEventListener('keyup', (e) => {
            if (e.key === ' ') {
                addPlayersFromInput(playerInput, renderSetupList);
            }
        });
    }

    if (gamePlayerInput) {
        gamePlayerInput.addEventListener('keyup', (e) => {
            if (e.key === ' ') {
                addPlayersFromInput(gamePlayerInput, renderGamePlayers);
            }
        });
    }

    if (addPlayerBtn) {
        addPlayerBtn.addEventListener('click', () => {
            addPlayersFromInput(playerInput, renderSetupList);
        });
    }

    if (gameAddPlayerBtn) {
        gameAddPlayerBtn.addEventListener('click', () => {
            addPlayersFromInput(gamePlayerInput, renderGamePlayers);
        });
    }

    if (newGameBtn) {
        newGameBtn.addEventListener('click', newGame);
    }

    // Écouteurs pour les boutons de contrôle
    document.getElementById('start-btn')?.addEventListener('click', startGame);
    document.getElementById('redo-order-btn')?.addEventListener('click', shufflePlayers);
    document.getElementById('copy-btn')?.addEventListener('click', copyOrderText);
}

// Fonctions d'ajout et de gestion des joueurs
function addPlayersFromInput(inputElement, renderCallback) {
    if (!inputElement) return;
    
    const value = inputElement.value.trim();
    if (value === '') return;

    const tokens = value.split(/\s+/);
    tokens.forEach(token => {
        if (token !== '') {
            players.push({
                name: token,
                skip: false,
                shield: false,
                afk: false
            });
        }
    });

    inputElement.value = '';
    savePlayers();
    renderCallback();
    updateOrderText();
}

function savePlayers() {
    localStorage.setItem('snl_players', JSON.stringify(players));
}

function saveGameStatus() {
    localStorage.setItem('snl_gameStarted', gameStarted.toString());
}

// Fonctions de rendu
function renderSetupList() {
    const playersList = document.getElementById('players');
    if (!playersList) return;

    playersList.innerHTML = '';
    players.forEach((player, index) => {
        const li = document.createElement('li');
        li.className = 'player-item';
        li.innerHTML = `
            <span class="player-name">${player.name}</span>
            <button class="game-btn secondary" onclick="removePlayer(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        playersList.appendChild(li);
    });
}

function renderGamePlayers() {
    const gamePlayersList = document.getElementById('game-players');
    if (!gamePlayersList) return;

    gamePlayersList.innerHTML = '';
    players.forEach((player, index) => {
        const li = document.createElement('li');
        li.className = 'player-item';
        li.setAttribute('draggable', 'true');
        li.dataset.index = index;

        let displayName = player.name;
        if (player.afk) {
            displayName += ' (<COLOR=#ff8800>AFK<COLOR=#fb00ff>)';
        } else if (player.skip) {
            displayName += ' (<COLOR=#ff0000>Skip<COLOR=#fb00ff>)';
        } else if (player.shield) {
            displayName += ' (<COLOR=#00ff33>shield<COLOR=#fb00ff>)';
        }

        li.innerHTML = `
            <span class="player-name">${displayName}</span>
            <div class="player-status">
                <button class="status-btn skip ${player.skip ? 'active' : ''}" onclick="toggleSkip(${index})">Skip</button>
                <button class="status-btn shield ${player.shield ? 'active' : ''}" onclick="toggleShield(${index})">Shield</button>
                <button class="status-btn afk ${player.afk ? 'active' : ''}" onclick="toggleAfk(${index})">AFK</button>
                <button class="game-btn secondary" onclick="moveUp(${index})" ${index === 0 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button class="game-btn secondary" onclick="moveDown(${index})" ${index === players.length - 1 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-down"></i>
                </button>
                <button class="game-btn secondary" onclick="removePlayerGame(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        li.addEventListener('dragstart', dragStart);
        li.addEventListener('dragover', dragOver);
        li.addEventListener('dragleave', dragLeave);
        li.addEventListener('drop', dragDrop);
        li.addEventListener('dragend', dragEnd);

        if (lastMovedIndex === index) {
            li.classList.add('moved');
            setTimeout(() => li.classList.remove('moved'), 500);
        }

        gamePlayersList.appendChild(li);
    });
    updateOrderText();
}

function updateOrderText() {
    const orderTextDiv = document.getElementById('order-text');
    if (!orderTextDiv) return;

    let text = '<SIZE=13><B><COLOR=#eeff00>Ordre <COLOR=#fb00ff>';
    players.forEach((player, index) => {
        text += player.name;
        if (player.afk) {
            text += ' (<COLOR=#ff8800>AFK<COLOR=#fb00ff>)';
        } else if (player.skip) {
            text += ' (<COLOR=#ff0000>Skip<COLOR=#fb00ff>)';
        } else if (player.shield) {
            text += ' (<COLOR=#00ff33>shield<COLOR=#fb00ff>)';
        }
        if (index < players.length - 1) {
            text += ' > ';
        }
    });
    orderTextDiv.textContent = text;
}

// Actions des boutons
function startGame() {
    gameStarted = true;
    document.getElementById('setup-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'block';
    saveGameStatus();
    renderGamePlayers();
}

function newGame() {
    const modal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('confirmNewGame');
    const cancelBtn = document.getElementById('cancelNewGame');

    const handleConfirm = () => {
        players = [];
        gameStarted = false;
        savePlayers();
        saveGameStatus();
        document.getElementById('setup-section').style.display = 'block';
        document.getElementById('game-section').style.display = 'none';
        renderSetupList();
        renderGamePlayers();
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

    // Fermer la modal en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    }, { once: true });
}

function shufflePlayers() {
    for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
    }
    savePlayers();
    renderGamePlayers();
}

function copyOrderText() {
    const orderText = document.getElementById('order-text');
    const copyIcon = document.getElementById('copy-icon');
    const copyCheck = document.getElementById('copy-check');

    if (orderText) {
        navigator.clipboard.writeText(orderText.textContent).then(() => {
            copyIcon.style.display = 'none';
            copyCheck.style.display = 'inline';
            setTimeout(() => {
                copyCheck.style.display = 'none';
                copyIcon.style.display = 'inline';
            }, 2000);
        });
    }
}

// Fonctions globales pour les boutons dans le HTML
window.removePlayer = function(index) {
    players.splice(index, 1);
    savePlayers();
    renderSetupList();
};

window.removePlayerGame = function(index) {
    players.splice(index, 1);
    savePlayers();
    renderGamePlayers();
};

window.toggleSkip = function(index) {
    players[index].skip = !players[index].skip;
    if (players[index].skip) {
        players[index].shield = false;
        players[index].afk = false;
    }
    savePlayers();
    renderGamePlayers();
};

window.toggleShield = function(index) {
    players[index].shield = !players[index].shield;
    if (players[index].shield) {
        players[index].skip = false;
        players[index].afk = false;
    }
    savePlayers();
    renderGamePlayers();
};

window.toggleAfk = function(index) {
    players[index].afk = !players[index].afk;
    if (players[index].afk) {
        players[index].skip = false;
        players[index].shield = false;
    }
    savePlayers();
    renderGamePlayers();
};

window.moveUp = function(index) {
    if (index > 0) {
        [players[index], players[index - 1]] = [players[index - 1], players[index]];
        lastMovedIndex = index - 1;
        savePlayers();
        renderGamePlayers();
    }
};

window.moveDown = function(index) {
    if (index < players.length - 1) {
        [players[index], players[index + 1]] = [players[index + 1], players[index]];
        lastMovedIndex = index + 1;
        savePlayers();
        renderGamePlayers();
    }
};

// Gestion du drag & drop
let draggedItem = null;

function dragStart(e) {
    draggedItem = this;
    setTimeout(() => this.classList.add('drag-over'), 0);
}

function dragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function dragLeave(e) {
    this.classList.remove('drag-over');
}

function dragDrop(e) {
    e.preventDefault();
    if (draggedItem) {
        const fromIndex = parseInt(draggedItem.dataset.index);
        const toIndex = parseInt(this.dataset.index);
        const itemOne = players[fromIndex];
        players.splice(fromIndex, 1);
        players.splice(toIndex, 0, itemOne);
        lastMovedIndex = toIndex;
        savePlayers();
        renderGamePlayers();
    }
    this.classList.remove('drag-over');
}

function dragEnd(e) {
    this.classList.remove('drag-over');
}
