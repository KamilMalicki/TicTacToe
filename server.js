const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

app.use(express.static(__dirname));

let waitingPlayer = null;
const games = {};

io.on("connection", (socket) => {
    console.log("Nowy gracz połączony");

    // Szukanie gry
    socket.on("findGame", () => {
        if (waitingPlayer) {
            // Znaleziono przeciwnika - zaczynamy grę
            const gameId = `${waitingPlayer.id}-${socket.id}`;
            games[gameId] = {
                players: [waitingPlayer, socket],
                board: Array(9).fill(""),
                currentPlayer: "X",
            };

            waitingPlayer.emit("gameStart", "X");
            socket.emit("gameStart", "O");
            waitingPlayer = null;
        } else {
            // Brak przeciwnika - czekamy
            waitingPlayer = socket;
        }
    });

    // Obsługa ruchu
    socket.on("makeMove", (data) => {
        const gameId = Object.keys(games).find(id => 
            games[id].players.includes(socket)
        );
        
        if (!gameId) return;

        const game = games[gameId];
        if (game.board[data.index] !== "" || game.currentPlayer !== data.symbol) return;

        game.board[data.index] = data.symbol;
        game.currentPlayer = data.symbol === "X" ? "O" : "X";

        // Sprawdź wygraną/remis
        const winner = checkWinner(game.board);
        if (winner || !game.board.includes("")) {
            game.players.forEach(player => {
                player.emit("gameOver", winner || "draw");
            });
            delete games[gameId];
        } else {
            game.players.forEach(player => {
                player.emit("updateBoard", {
                    board: game.board,
                    currentPlayer: game.currentPlayer,
                });
            });
        }
    });

    socket.on("disconnect", () => {
        if (waitingPlayer === socket) waitingPlayer = null;
        
        const gameId = Object.keys(games).find(id => 
            games[id].players.includes(socket)
        );
        
        if (gameId) {
            games[gameId].players.forEach(player => {
                if (player !== socket) player.emit("gameOver", "opponentLeft");
            });
            delete games[gameId];
        }
    });
});

function checkWinner(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // poziomo
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // pionowo
        [0, 4, 8], [2, 4, 6]             // na ukos
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

server.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});