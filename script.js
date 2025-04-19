// --- START OF FILE script.js (Com Logos, Sons, Chão, Animação, Toque e Ovos Responsivos) ---

const character = document.getElementById('character');
const gameArea = document.querySelector('.game-area');
const gameContainer = document.querySelector('.game-container');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const messageOverlay = document.getElementById('message-overlay');
const messageText = document.getElementById('message-text');
const restartButton = document.getElementById('restart-button');
const startOverlay = document.getElementById('start-overlay');
const startButton = document.getElementById('start-button');
const gameplayLogo = document.getElementById('gameplay-logo'); // <<< NOVO: Referência da logo pequena

// <<< Constantes para Animação >>>
const WALK_FRAME_1_PATH = 'menino-anda-1.png';
const WALK_FRAME_2_PATH = 'menino-anda-2.png';
const JUMP_FRAME_PATH = 'menino-pula.png';
const WALK_ANIMATION_SPEED = 200;

// <<< Constantes e Objetos de Áudio >>>
const JUMP_SOUND_PATH = 'pulo.mp3';
const COLLECT_SOUND_PATH = 'coleta.mp3';
const jumpSound = new Audio(JUMP_SOUND_PATH);
const collectSound = new Audio(COLLECT_SOUND_PATH);

// --- Variáveis de Estado do Jogo ---
let score = 0;
let isJumping = false;
let isGameOver = true;
let gameInterval = null;
let eggInterval = null;
let timerInterval = null;
let startTime = null;
let eggs = [];
let walkInterval = null;
let isWalkFrame1 = true;

// --- Constantes do Jogo ---
const gameSpeed = 3;
const eggSpawnRate = 1800;
const targetScore = 10;
const GROUND_HEIGHT = 50; // Altura do chão
const EGG_MIN_HEIGHT_PERCENT_ABOVE_GROUND = 5;
const EGG_MAX_HEIGHT_PERCENT_ABOVE_GROUND = 30;


// <<< Função Anima a Caminhada (Mantida) >>>
function animateWalk() {
    if (isGameOver || isJumping) { return; }
    if (isWalkFrame1) {
        character.style.backgroundImage = `url('${WALK_FRAME_2_PATH}')`;
    } else {
        character.style.backgroundImage = `url('${WALK_FRAME_1_PATH}')`;
    }
    isWalkFrame1 = !isWalkFrame1;
}

// <<< Função HandleJump (Mantida com som) >>>
function handleJump(event) {
    if (event.type === 'touchstart') { event.preventDefault(); }
    if (!isGameOver && !isJumping &&
        ( (event.keyCode === 32 || event.keyCode === 38) || event.type === 'touchstart' || event.type === 'click' ) )
    {
        isJumping = true;
        jumpSound.currentTime = 0;
        jumpSound.play().catch(error => console.error("Erro ao tocar som de pulo:", error));
        if (JUMP_FRAME_PATH) {
            character.style.backgroundImage = `url('${JUMP_FRAME_PATH}')`;
        }
        character.classList.add('jump');
        setTimeout(() => {
            character.classList.remove('jump');
            isJumping = false;
            isWalkFrame1 = true;
            if (!isGameOver) {
                character.style.backgroundImage = `url('${WALK_FRAME_1_PATH}')`;
            }
        // Verifique se o tempo do pulo no CSS é realmente 1.1s. Se for 0.6s, use 600.
        }, 1100); // <<< ATENÇÃO AQUI: Ajuste se necessário >>>
    }
}

// <<< Função createEgg (Mantida) >>>
function createEgg() {
    if (isGameOver) return;
    const lastEgg = eggs[eggs.length - 1];
    const minimumHorizontalSpacing = gameContainer.offsetWidth * 0.30;
    if (lastEgg && parseInt(lastEgg.style.left) > gameContainer.offsetWidth - minimumHorizontalSpacing) { return; }
    const egg = document.createElement('div');
    egg.classList.add('egg');
    egg.style.left = gameContainer.offsetWidth + Math.random() * (gameContainer.offsetWidth * 0.1) + 'px';
    const containerHeight = gameContainer.offsetHeight;
    const spaceAboveGround = containerHeight - GROUND_HEIGHT;
    if (spaceAboveGround <= 0) { console.error("Container height <= ground height."); return; }
    const minPixelOffset = spaceAboveGround * (EGG_MIN_HEIGHT_PERCENT_ABOVE_GROUND / 100);
    const maxPixelOffset = spaceAboveGround * (EGG_MAX_HEIGHT_PERCENT_ABOVE_GROUND / 100);
    if (minPixelOffset >= maxPixelOffset) {
         console.warn("Min egg offset >= Max offset.");
         egg.style.bottom = (GROUND_HEIGHT + 10) + 'px';
    } else {
        const randomPixelOffset = Math.floor(Math.random() * (maxPixelOffset - minPixelOffset + 1)) + minPixelOffset;
        egg.style.bottom = (GROUND_HEIGHT + randomPixelOffset) + 'px';
    }
    gameArea.appendChild(egg);
    eggs.push(egg);
}

// <<< Função checkCollision (Mantida) >>>
function checkCollision(element1, element2) {
    if (!element1 || !element2) { return false; }
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();
    const collisionMargin = 5;
    return (
        rect1.left < rect2.right - collisionMargin &&
        rect1.right > rect2.left + collisionMargin &&
        rect1.top < rect2.bottom - collisionMargin &&
        rect1.bottom > rect2.top + collisionMargin
    );
}

// <<< Função updateTimer (Mantida) >>>
function updateTimer() {
    if (isGameOver || !startTime) return;
    const elapsedTime = (Date.now() - startTime) / 1000;
    timerElement.textContent = `Tempo: ${elapsedTime.toFixed(1)}s`;
}

// <<< Função gameLoop (Mantida com som) >>>
function gameLoop() {
    if (isGameOver) { return; }
    for (let i = eggs.length - 1; i >= 0; i--) {
        const egg = eggs[i];
        if (!egg || !egg.style) { eggs.splice(i, 1); continue; }
        let eggLeft = parseInt(egg.style.left);
        if (isNaN(eggLeft)) { eggLeft = 0; }
        eggLeft -= gameSpeed;
        egg.style.left = eggLeft + 'px';
        if (checkCollision(character, egg)) {
            collectSound.currentTime = 0;
            collectSound.play().catch(error => console.error("Erro ao tocar som de coleta:", error));
            score++;
            scoreElement.textContent = `Ovos: ${score}`;
            egg.remove();
            eggs.splice(i, 1);
            if (score >= targetScore) { endGame(true); return; }
        }
        if (egg.offsetWidth && eggLeft < -egg.offsetWidth) { egg.remove(); eggs.splice(i, 1); }
        else if (eggLeft < -100 && !egg.offsetWidth) { egg.remove(); eggs.splice(i, 1); }
    }
}

// <<< Função endGame (MODIFICADA para esconder logo pequena) >>>
function endGame(didWin) {
    console.log("--- endGame CHAMADA! --- Ganhou:", didWin);
    if (isGameOver) { return; }
    isGameOver = true;
    clearInterval(gameInterval);
    clearInterval(eggInterval);
    clearInterval(timerInterval);
    clearInterval(walkInterval);
    console.log("endGame: Intervalos limpos.");

    // <<< NOVO: Esconde a logo pequena ao final >>>
    if (gameplayLogo) { // Verifica se a logo existe
        gameplayLogo.classList.add('hidden-initially');
    }

    character.classList.remove('jump');
    isJumping = false;
    const finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    messageText.textContent = `Parabéns! Você pegou ${targetScore} ovos em ${finalTime}s!`;
    messageOverlay.classList.remove('hidden');
}

// <<< Função startGame (MODIFICADA para mostrar logo pequena) >>>
function startGame(event) {
    if (event && event.type === 'touchstart') {
        console.log("startGame triggered by touchstart, preventing default.");
        event.preventDefault();
    }
    console.log("startGame: Iniciando função");
    score = 0;
    isGameOver = false;
    isJumping = false;
    startTime = Date.now();
    eggs = [];
    isWalkFrame1 = true;
    scoreElement.textContent = 'Ovos: 0';
    timerElement.textContent = 'Tempo: 0.0s';
    messageOverlay.classList.add('hidden');
    startOverlay.classList.add('hidden');

    // <<< NOVO: Mostra a logo pequena >>>
    if (gameplayLogo) { // Verifica se a logo existe
       gameplayLogo.classList.remove('hidden-initially');
    }

    character.style.bottom = GROUND_HEIGHT + 'px';
    character.style.backgroundImage = `url('${WALK_FRAME_1_PATH}')`;
    clearInterval(walkInterval);
    walkInterval = setInterval(animateWalk, WALK_ANIMATION_SPEED);
    gameArea.querySelectorAll('.egg').forEach(el => { if (el && el.remove) { el.remove(); } });
    clearInterval(gameInterval);
    clearInterval(eggInterval);
    clearInterval(timerInterval);
    gameInterval = setInterval(gameLoop, 20);
    eggInterval = setInterval(createEgg, eggSpawnRate);
    timerInterval = setInterval(updateTimer, 100);
    console.log("startGame: Função concluída");
}

// <<< Event Listeners (Mantidos) >>>
document.addEventListener('keydown', handleJump);
gameContainer.addEventListener('touchstart', handleJump);
restartButton.addEventListener('click', startGame);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('touchstart', startGame);
startButton.addEventListener('touchstart', startGame);

// <<< Inicialização (Mantida) >>>
console.log("Script carregado. Esperando interação.");

// --- END OF FILE script.js (Com Logos, Sons, Chão, Animação, Toque e Ovos Responsivos) ---