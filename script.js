const socket = io();
const playButton = document.getElementById("playButton");
const gameBoard = document.getElementById("gameBoard");
const statusDiv = document.getElementById("status");
const cells = document.querySelectorAll(".cell");

let playerSymbol = "";
let currentPlayer = "";
let gameActive = false;

// znalezienie gracza
playButton.addEventListener("click", () => {
    playButton.disabled = true; // klikniety przycisk
    socket.emit("findGame");
    statusDiv.innerHTML = "Searching for an opponent... <span class='blink'>⚡</span>";
});

// łapanie kliknięcia w komórki
cells.forEach(cell => {
    cell.addEventListener("click", () => {
        const index = cell.getAttribute("data-index");
        if (cell.textContent === "") {
            socket.emit("makeMove", { index, symbol: playerSymbol });
        }
        if (!gameActive || currentPlayer !== playerSymbol) return;
    });
});

// Socket.io 
socket.on("gameStart", (symbol) => {
    playerSymbol = symbol;
    currentPlayer = "X";
    gameActive = true;
    gameBoard.style.display = "block";
    playButton.style.display = "none";
    statusDiv.innerHTML = `You are <span class="highlight">${playerSymbol}</span>. ${currentPlayer}'s turn.`;
});

socket.on("updateBoard", (data) => {
    const { board, currentPlayer: nextPlayer } = data;
    board.forEach((symbol, index) => {
        cells[index].textContent = symbol;
        cells[index].className = symbol === "X" ? "cell x" : "cell o";
    });
    currentPlayer = nextPlayer;
    statusDiv.innerHTML = `You are <span class="highlight">${playerSymbol}</span>. ${currentPlayer}'s turn.`;
});

socket.on("gameOver", (result) => {
    gameActive = false;
    if (result === "draw") {
        statusDiv.innerHTML = "<span class='highlight'>DRAW!</span>";
    } else {
        statusDiv.innerHTML = result === playerSymbol 
            ? "<span style='color: var(--neon-blue)'>YOU WON! 🎉</span>" 
            : "<span style='color: var(--neon-pink)'>YOU LOST! 😢</span>";
    }
    setTimeout(() => {
        gameBoard.style.display = "none";
        playButton.style.display = "block";
        playButton.disabled = false; // naprawa przycisku
        statusDiv.innerHTML = "Click <span class='highlight'>PLAY</span> to rematch!";
        cells.forEach(cell => {
            cell.textContent = "";
            cell.className = "cell";
        });
    }, 3000);
});
