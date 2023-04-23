const shipContainer = document.querySelector('.ships-container');
const flipBtn = document.querySelector('.flip-btn');
const gameBoard = document.querySelector('.gameboard');
const startBtn = document.querySelector('.start-btn');
const infoDisplay = document.querySelector('.info-display');
const btnContainer = document.querySelector('.btn-container');

let shipAngle = 0;

function flip() {
  const shipOptions = Array.from(shipContainer.children);
  shipAngle = shipAngle === 0 ? 90 : 0;
  shipOptions.forEach((ship) => ship.style.transform = `rotate(${shipAngle}deg)`);
}

flipBtn.addEventListener('click', flip);

function createBoard(color, user) {
  const gameBoardContainer = document.createElement('div');
  gameBoardContainer.classList.add('game-board');
  gameBoardContainer.style.backgroundColor = color;
  gameBoardContainer.id = user;

  for (let i = 0; i < 100; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.id = i;
    gameBoardContainer.append(cell);
  }
  gameBoard.append(gameBoardContainer);
}

createBoard('hsl(200, 100%, 50%)', 'player');
createBoard('hsl(200, 100%, 50%)', 'computer');

function Ship(name, length) {
  return {
    name,
    length,
  };
}

const destroyer = Ship('destroyer', 2);
const submarine = Ship('submarine', 3);
const cruiser = Ship('cruiser', 3);
const battleship = Ship('battleship', 4);
const carrier = Ship('carrier', 5);

const ships = [destroyer, submarine, cruiser, battleship, carrier];
let notDropped;

function handleValidity(allCells, isHorizontal, startIndex, ship) {
  let validStartIndex;

  if (isHorizontal) {
    if (startIndex <= 100 - ship.length) {
      validStartIndex = startIndex;
    } else {
      validStartIndex = 100 - ship.length;
    }
  } else if (!isHorizontal) {
    if (startIndex <= 100 - 10 * ship.length) {
      validStartIndex = startIndex;
    } else {
      validStartIndex = startIndex - ship.length * 10 + 10;
    }
  }

  const shipPieces = [];

  for (let i = 0; i < ship.length; i++) {
    if (isHorizontal) {
      shipPieces.push(allCells[Number(validStartIndex) + i]);
    } else {
      shipPieces.push(allCells[Number(validStartIndex) + i * 10]);
    }
  }

  let validPos;
  if (isHorizontal) {
    shipPieces.every((_shipPiece, index) => validPos = shipPieces[0].id % 10 !== 10 - (shipPieces.length - (index + 1)));
  } else {
    shipPieces.every((_shipPiece, index) => validPos = shipPieces[0].id < 90 + (10 * index + 1));
  }

  const notTaken = shipPieces.every((shipPiece) => !shipPiece.classList.contains('taken'));

  return { shipPieces, validPos, notTaken };
}

function addShips(user, ship, startId) {
  const allCells = document.querySelectorAll(`#${user} div`);
  const randomBoolean = Math.random() < 0.5;
  const isHorizontal = user === 'player' ? shipAngle === 0 : randomBoolean;
  const randomStartIndex = Math.floor(Math.random() * 10 * 10);

  const startIndex = startId || randomStartIndex;

  const { shipPieces, validPos, notTaken } = handleValidity(allCells, isHorizontal, startIndex, ship);

  if (validPos && notTaken) {
    shipPieces.forEach((shipPiece) => {
      shipPiece.classList.add(ship.name);
      shipPiece.classList.add('taken');
    });
  } else if (user === 'computer') {
    addShips(user, ship, startId);
  } else if (user === 'player') {
    notDropped = true;
  }
}

ships.forEach((ship) => {
  addShips('computer', ship);
});

let draggedShip;
const shipChoices = Array.from(shipContainer.children);
shipChoices.forEach((shipChoice) => shipChoice.addEventListener('dragstart', dragStart));

const playerBoard = document.querySelectorAll('#player div');
playerBoard.forEach((playerBoardCell) => {
  playerBoardCell.addEventListener('dragover', dragOver);
  playerBoardCell.addEventListener('drop', dropShip);
});

function dragStart(e) {
  notDropped = false;
  draggedShip = e.target;
}

function dragOver(e) {
  e.preventDefault();
  const ship = ships[draggedShip.id];
  posIndicator(e.target.id, ship);
}

function dropShip(e) {
  const startId = e.target.id;
  const ship = ships[draggedShip.id];
  addShips('player', ship, startId);
  if (!notDropped) {
    draggedShip.remove();
  }
}

function posIndicator(startIndex, ship) {
  const allCells = document.querySelectorAll('#player div');
  const isHorizontal = shipAngle === 0;
  const { shipPieces, validPos, notTaken } = handleValidity(allCells, isHorizontal, startIndex, ship);
  if (validPos && notTaken) {
    shipPieces.forEach((shipPiece) => {
      shipPiece.classList.add('hover');
      setTimeout(() => shipPiece.classList.remove('hover'), 200);
    });
  }
}

let gameOver = false;
let playerTurn;

function startGame() {
  if (playerTurn === undefined) {
    if (shipContainer.children.length !== 0) {
      infoDisplay.textContent = 'Please place all your ships first!';
    } else {
      const computerBoard = document.querySelectorAll('#computer div');
      computerBoard.forEach((computerBoardCell) => computerBoardCell.addEventListener('click', handleClick));
      playerTurn = true;
      infoDisplay.textContent = 'Your turn.';
      btnContainer.style.display = 'none';
    }
  }
}

startBtn.addEventListener('click', () => {
  startGame();
});

let playerHits = [];
let computerHits = [];
const playerSunkShips = [];
const computerSunkShips = [];

function handleClick(e) {
  if (!gameOver) {
    if (e.target.classList.contains('taken')) {
      e.target.classList.add('hit');
      infoDisplay.textContent = 'Hit!';
      let classes = Array.from(e.target.classList);
      classes = classes.filter((className) => className !== 'cell');
      classes = classes.filter((className) => className !== 'hit');
      classes = classes.filter((className) => className !== 'taken');
      playerHits.push(...classes);
      checkScore('player', playerHits, playerSunkShips);
    } else if (!e.target.classList.contains('taken')) {
      infoDisplay.textContent = 'Missed.';
      e.target.classList.add('miss');
    }
    playerTurn = false;
    const computerBoard = document.querySelectorAll('#computer div');
    computerBoard.forEach((computerBoardCell) => computerBoardCell.removeEventListener('click', handleClick));
    setTimeout(computerTurn, 2000);
  }
}

function computerTurn() {
  if (!gameOver) {
    infoDisplay.textContent = "Computer's turn";
    setTimeout(() => {
      const randomMove = Math.floor(Math.random() * 10 * 10);
      const playerBoard = document.querySelectorAll('#player div');

      if (playerBoard[randomMove].classList.contains('taken') && playerBoard[randomMove].classList.contains('hit')) {
        computerTurn();
      } else if (playerBoard[randomMove].classList.contains('taken') && !playerBoard[randomMove].classList.contains('hit')) {
        playerBoard[randomMove].classList.add('hit');
        infoDisplay.textContent = 'Your ship is hit!';
        let classes = Array.from(playerBoard[randomMove].classList);
        classes = classes.filter((className) => className !== 'cell');
        classes = classes.filter((className) => className !== 'hit');
        classes = classes.filter((className) => className !== 'taken');
        computerHits.push(...classes);
        checkScore('computer', computerHits, computerSunkShips);
      } else {
        infoDisplay.textContent = 'Computer missed.';
        playerBoard[randomMove].classList.add('miss');
      }
    }, 3000);
    setTimeout(() => {
      playerTurn = true;
      infoDisplay.textContent = 'Your turn.';
      const computerBoard = document.querySelectorAll('#computer div');
      computerBoard.forEach((computerBoardCell) => computerBoardCell.addEventListener('click', handleClick));
    }, 6000);
  }
}

function checkScore(user, userHits, userSunkShips) {
  function checkShip(shipName, shipLength) {
    if (userHits.filter((storedShipName) => storedShipName === shipName).length === shipLength) {
      infoDisplay.textContent = `${user}'s ${shipName} has been sunk!`;
      if (user === 'player') {
        infoDisplay.textContent = `Computer's ${shipName} has been sunk!`;
        playerHits = userHits.filter((storedShipName) => storedShipName !== shipName);
      } else if (user === 'computer') {
        infoDisplay.textContent = `Computer has sunk your ${shipName}!`;
        computerHits = userHits.filter((storedShipName) => storedShipName !== shipName);
      }
      userSunkShips.push(shipName);
    }
  }
  checkShip('destroyer', 2);
  checkShip('submarine', 3);
  checkShip('cruiser', 3);
  checkShip('battleship', 4);
  checkShip('carrier', 5);

  if (playerSunkShips.length === 5) {
    infoDisplay.textContent = "You sunk all computer's ships! You won!";
    gameOver = true;
  } else if (computerSunkShips.length === 5) {
    infoDisplay.textContent = 'The computer has sunk all your ships! You lose!';
    gameOver = true;
  }
}
