const snakeColor = "#edad62";
const backgroundColor = "#a1e868";
const nibbleColor = "#f79055";

const gridSize = 15;
const squarePadding = 100 / (gridSize * 6 + 1); // Padding is 1 "fragment", square is 5 "fragments"
const squareSize = squarePadding * 5;

type Point = {
	x: number;
	y: number;
};

let canvas: HTMLCanvasElement;
let _2d: CanvasRenderingContext2D;

let currentGame: NodeJS.Timeout;
let snake: Point[];
let direction: Point;
let nibble: Point;

function RNDM_RG(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min) + min);
}

const v2 = (x: number, y: number): Point => ({ x, y });

const v2Add = (a: Point, b: Point): Point => ({
	x: a.x + b.x,
	y: a.y + b.y,
});

const v2Sub = (a: Point, b: Point): Point => ({
	x: a.x - b.x,
	y: a.y - b.y,
});

function setup() {
	canvas = document.querySelector("#screen");
	_2d = canvas.getContext("2d");

	setSize();
	startGame();

	canvas.addEventListener("click", startGame);

	let initialX: number | null = null;
	let initialY: number | null = null;

	canvas.addEventListener("touchstart", (touch) => {
		initialX = touch.touches[0].clientX;
		initialY = touch.touches[0].clientY;

		touch.preventDefault();
		return false;
	});

	canvas.addEventListener("touchmove", (touch) => {
		if (currentGame) {
			touch.preventDefault();
			return false;
		}
	});

	canvas.addEventListener("touchend", (touch) => {
		if (currentGame) {
			const diffX = touch.changedTouches[0].clientX - initialX;
			const diffY = touch.changedTouches[0].clientY - initialY;

			if (Math.abs(diffX) > Math.abs(diffY)) {
				if (diffX > 50) right();
				else if (diffX < -50) left();
				else space();
			} else {
				if (diffY > 50) down();
				else if (diffY < -50) up();
				else space();
			}

			touch.preventDefault();
			return false;
		} else {
			space();
			touch.preventDefault();
			return false;
		}
	});
}

function setSize() {
	const dpr = window.devicePixelRatio || 1;
	const bounds = canvas.getBoundingClientRect();

	canvas.width = bounds.width * dpr;
	canvas.height = bounds.height * dpr;

	_2d.scale((bounds.width * dpr) / 100, (bounds.height * dpr) / 100);

	_2d.fillStyle = backgroundColor;
	_2d.fillRect(0, 0, 100, 100);
}

function randomNibble() {
	nibble = v2(RNDM_RG(0, gridSize), RNDM_RG(0, gridSize));

	const collision = snake.some((pos) => pos.x === nibble.x && pos.y === nibble.y);

	if (collision) return randomNibble();
	drawNibble();
}

function drawNibble() {
	const nibblePosition = v2(
		nibble.x * (squareSize + squarePadding),
		nibble.y * (squareSize + squarePadding),
	);

	_2d.fillStyle = nibbleColor;
	_2d.fillRect(
		nibblePosition.x + squarePadding,
		nibblePosition.y + squarePadding,
		squareSize,
		squareSize,
	);
}

function drawSnake() {
	snake.forEach((coords) => {
		const nextTilePosition = v2(
			coords.x * (squareSize + squarePadding),
			coords.y * (squareSize + squarePadding),
		);

		_2d.fillStyle = snakeColor;
		_2d.fillRect(
			nextTilePosition.x + squarePadding,
			nextTilePosition.y + squarePadding,
			squareSize,
			squareSize,
		);
	});
}

function startGame() {
	// Handle pausing
	if (snake) {
		if (currentGame) {
			document.body.style.overflow = "unset";
			clearInterval(currentGame);
			currentGame = null;
		} else {
			document.body.style.overflow = "hidden";
			currentGame = setInterval(update, 300);
		}
		return;
	}

	// Game setup
	const middle = Math.floor(gridSize / 2);
	const center = v2(middle, middle);

	// Draw the background
	_2d.fillStyle = backgroundColor;
	_2d.fillRect(0, 0, 100, 100);

	// Create and draw the snake
	direction = [v2(1, 0), v2(-1, 0), v2(0, 1), v2(0, -1)][RNDM_RG(0, 4)];
	snake = [v2Add(center, direction), center, v2Sub(center, direction)];
	drawSnake();

	// Draw the nibble
	randomNibble();
}

function update() {
	// Add the direction magnitude to the snakes head to determine the next tile
	// position logically and on the screen.
	const nextTile = v2Add(snake[0], direction);
	const nextTilePosition = v2(
		nextTile.x * (squareSize + squarePadding),
		nextTile.y * (squareSize + squarePadding),
	);
	let ateTheNibble = false;

	// If the snakes head is on the nibble, don't draw over the tail for one
	// frame, so that it will be one tile longer. If we didn't eat the nibble, we
	// want to pop the tail off so that we don't report overlap when there shouldn't
	// actually be any.
	if (nextTile.x === nibble.x && nextTile.y === nibble.y) {
		ateTheNibble = true;
	} else {
		const oldTile = snake.pop();
		const oldTilePosition = v2(
			oldTile.x * (squareSize + squarePadding),
			oldTile.y * (squareSize + squarePadding),
		);

		_2d.fillStyle = backgroundColor;
		_2d.fillRect(
			oldTilePosition.x + squarePadding / 2,
			oldTilePosition.y + squarePadding / 2,
			squareSize + squarePadding,
			squareSize + squarePadding,
		);
	}

	// If the head will be touching any other pieces once it moves..
	const overlap = snake.some(
		(coords) => coords.x === nextTile.x && coords.y === nextTile.y,
	);
	// ..or if you went over the edge, then you died! Restarting!
	if (
		overlap ||
		nextTile.x > gridSize ||
		nextTile.x < 0 ||
		nextTile.y > gridSize ||
		nextTile.y < 0
	) {
		clearInterval(currentGame);
		snake = currentGame = null;

		return startGame();
	}

	// We didn't die, so move the snake and draw the head
	snake.unshift(nextTile);
	_2d.fillStyle = snakeColor;
	_2d.fillRect(
		nextTilePosition.x + squarePadding,
		nextTilePosition.y + squarePadding,
		squareSize,
		squareSize,
	);

	// Now that the snakes collision map is finalized for the frame, we can
	// safely place the nibble.
	if (ateTheNibble) randomNibble();
}

function immediateUpdate() {
	clearInterval(currentGame);
	update();
	currentGame = setInterval(update, 300);
}

function space() {
	startGame();
}

function up() {
	direction = v2(0, -1);
	immediateUpdate();
}

function down() {
	direction = v2(0, 1);
	immediateUpdate();
}

function left() {
	direction = v2(-1, 0);
	immediateUpdate();
}

function right() {
	direction = v2(1, 0);
	immediateUpdate();
}

window.addEventListener("DOMContentLoaded", setup);
window.addEventListener("resize", () => {
	setSize();
	drawSnake();
	drawNibble();
});

window.addEventListener("keydown", (key) => {
	if (key.keyCode === 32) {
		space();
		key.preventDefault();
		return false;
	}

	if (currentGame) {
		switch (key.keyCode) {
			case 32:
				space();
				break;
			case 65:
			case 37:
				left();
				break;
			case 87:
			case 38:
				up();
				break;
			case 68:
			case 39:
				right();
				break;
			case 83:
			case 40:
				down();
				break;
		}

		key.preventDefault();
		return false;
	}
});
