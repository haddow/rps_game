const SPRITES = [
    { type: 'rock', emoji: '🪨', chases: 'scissors', runsFrom: 'paper' },
    { type: 'paper', emoji: '📄', chases: 'rock', runsFrom: 'scissors' },
    { type: 'scissors', emoji: '✂️', chases: 'paper', runsFrom: 'rock' }
];

const NUM_SPRITES_PER_TYPE = 10;
const MOVE_SPEED = 2;
const COLLISION_DISTANCE = 30; // Adjust based on font size or preference.

let sprites = [];

function init() {
    for (let spriteData of SPRITES) {
        for (let i = 0; i < NUM_SPRITES_PER_TYPE; i++) {
            let sprite = document.createElement('div');
            sprite.classList.add('sprite');
            sprite.innerText = spriteData.emoji;
            sprite.dataset.type = spriteData.type;
            sprite.style.left = `${Math.random() * (window.innerWidth - 30)}px`; // Subtracting 30 to consider emoji width
            sprite.style.top = `${Math.random() * (window.innerHeight - 30)}px`;
            document.body.appendChild(sprite);
            sprites.push(sprite);
        }
    }

    requestAnimationFrame(moveSprites);
}

function checkGameConclusion() {
    for (let spriteData of SPRITES) {
        let count = Array.from(document.querySelectorAll(`[data-type="${spriteData.type}"]`)).length;
        if (count === NUM_SPRITES_PER_TYPE * SPRITES.length) {
            // All sprites are of this type, game concluded
            displayWinner(spriteData.type);
            return true;
        }
    }
    return false;
}

function displayWinner(winnerType) {
    let winnerDisplay = document.getElementById("winnerDisplay");
    let winnerSprite = SPRITES.find(s => s.type === winnerType);
    winnerDisplay.textContent = `The winner is ${winnerSprite.emoji} (${winnerSprite.type})!`;
    winnerDisplay.style.display = "block";

    // Stop the game loop by not requesting another animation frame.
}

function restartGame() {
    // Clear existing sprites
    sprites.forEach(sprite => sprite.remove());
    sprites = [];

    // Hide the winner display
    document.getElementById("winnerDisplay").style.display = "none";

    // Initialize the game again
    init();
}

document.getElementById("restart").addEventListener("click", restartGame);


function moveSprites() {
    if (!checkGameConclusion()) {
        for (let sprite of sprites) {
            let targetType = SPRITES.find(s => s.type === sprite.dataset.type).chases;
            let runFromType = SPRITES.find(s => s.type === sprite.dataset.type).runsFrom;
            let targetSprites = Array.from(document.querySelectorAll(`[data-type="${targetType}"]`));
            let enemies = Array.from(document.querySelectorAll(`[data-type="${runFromType}"]`));

            if (targetSprites.length > 0) {
                moveTowardsTarget(sprite, targetSprites);
            } else {
                moveAwayFromEnemy(sprite, enemies);
            }
        }
        requestAnimationFrame(moveSprites);
    }
}



const RANDOM_MOVE_RADIUS = 10;  // Defines the range for random wandering movement

function moveTowardsTarget(sprite, targets) {
    let nearestTarget = getNearestTarget(sprite, targets);

    let deltaX = nearestTarget.getBoundingClientRect().left - sprite.getBoundingClientRect().left + (Math.random() * RANDOM_MOVE_RADIUS - RANDOM_MOVE_RADIUS / 2);
    let deltaY = nearestTarget.getBoundingClientRect().top - sprite.getBoundingClientRect().top + (Math.random() * RANDOM_MOVE_RADIUS - RANDOM_MOVE_RADIUS / 2);

    let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < COLLISION_DISTANCE) {
        defeatTarget(sprite, nearestTarget);
    } else {
        let moveX = MOVE_SPEED * deltaX / distance;
        let moveY = MOVE_SPEED * deltaY / distance;

        sprite.style.left = `${Math.min(window.innerWidth - 30, Math.max(0, parseFloat(sprite.style.left) + moveX))}px`;
        sprite.style.top = `${Math.min(window.innerHeight - 30, Math.max(0, parseFloat(sprite.style.top) + moveY))}px`;
    }
}

const EDGE_BUFFER = 50; // Defines the distance from the edge of the screen that sprites will move towards the center

// Array to hold the sprites in "wall escape" mode with their chosen directions
let wallEscapeSprites = [];

function moveAwayFromEnemy(sprite, enemies) {
    let posX = parseFloat(sprite.style.left);
    let posY = parseFloat(sprite.style.top);

    let moveX = 0;
    let moveY = 0;

    let wallEscape = wallEscapeSprites.find(item => item.sprite === sprite);

    if (!wallEscape) {
        // Sprite hit the boundary for the first time, choose a direction
        if (posX < EDGE_BUFFER) {
            moveX = 1; // Move to the right
            moveY = Math.random() * 2 - 1; // Random vertical movement
        } else if (posX > window.innerWidth - EDGE_BUFFER) {
            moveX = -1; // Move to the left
            moveY = Math.random() * 2 - 1;
        }

        if (posY < EDGE_BUFFER) {
            moveY = 1; // Move downwards
            moveX = moveX || Math.random() * 2 - 1; // Only adjust horizontal if it wasn't adjusted above
        } else if (posY > window.innerHeight - EDGE_BUFFER) {
            moveY = -1; // Move upwards
            moveX = moveX || Math.random() * 2 - 1;
        }

        wallEscapeSprites.push({
            sprite: sprite,
            directionX: moveX,
            directionY: moveY
        });
    } else if (wallEscape) {
        // Sprite is already in "wall escape" mode, continue in the chosen direction
        moveX = wallEscape.directionX;
        moveY = wallEscape.directionY;

        let isAwayFromEdge = (
            posX > EDGE_BUFFER &&
            posX < window.innerWidth - EDGE_BUFFER &&
            posY > EDGE_BUFFER &&
            posY < window.innerHeight - EDGE_BUFFER
        );

        // If sprite is sufficiently inside the play area, remove from wall escape mode
        if (isAwayFromEdge) {
            let index = wallEscapeSprites.indexOf(wallEscape);
            wallEscapeSprites.splice(index, 1);
            let nearestEnemy = getNearestTarget(sprite, enemies);
            moveX = posX - nearestEnemy.getBoundingClientRect().left;
            moveY = posY - nearestEnemy.getBoundingClientRect().top;
        }
    } else {
        // Normal evasion behavior
        let nearestEnemy = getNearestTarget(sprite, enemies);
        moveX = posX - nearestEnemy.getBoundingClientRect().left;
        moveY = posY - nearestEnemy.getBoundingClientRect().top;
    }

    // Normalize the movement vector
    let totalMovement = Math.sqrt(moveX * moveX + moveY * moveY);
    moveX = MOVE_SPEED * moveX / totalMovement;
    moveY = MOVE_SPEED * moveY / totalMovement;

    // Update sprite position
    sprite.style.left = `${Math.min(window.innerWidth - 30, Math.max(0, posX + moveX))}px`;
    sprite.style.top = `${Math.min(window.innerHeight - 30, Math.max(0, posY + moveY))}px`;
}





function getNearestTarget(sprite, targets) {
    let nearestDistance = Infinity;
    let nearestTarget = null;

    for (let target of targets) {
        let deltaX = target.getBoundingClientRect().left - sprite.getBoundingClientRect().left;
        let deltaY = target.getBoundingClientRect().top - sprite.getBoundingClientRect().top;
        let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestTarget = target;
        }
    }

    return nearestTarget;
}

function defeatTarget(sprite, target) {
    let targetType = SPRITES.find(s => s.type === sprite.dataset.type).type;
    target.dataset.type = targetType;
    target.innerText = SPRITES.find(s => s.type === targetType).emoji;
}

init();
