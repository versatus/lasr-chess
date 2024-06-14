type User = {
  address: string;
  name: string;
};

type Game = {
  id: number;
  player1: User;
  player2: User;
  winner?: string;
};

type Round = {
  roundNumber: number;
  games: Game[];
};

type TournamentState = "initialized" | "inProgress" | "finished";

interface StandingsEntry {
  user: User;
  roundReached: number;
}

interface Tournament {
  state: TournamentState;
  rounds: Round[];
  standings: StandingsEntry[];
}

function createTournament(users: User[]): Tournament {
  if (users.length < 2) {
    throw new Error("At least two users are required to create a tournament.");
  }

  const rounds: Round[] = [];
  let roundNumber = 1;
  let currentRoundUsers = [...users];
  let gameId = 1;

  while (currentRoundUsers.length > 1) {
    const games: Game[] = [];
    for (let i = 0; i < currentRoundUsers.length; i += 2) {
      const player1 = currentRoundUsers[i];
      const player2 = currentRoundUsers[i + 1];
      games.push({ id: gameId++, player1, player2 });
    }
    rounds.push({ roundNumber, games });
    roundNumber++;
    currentRoundUsers = new Array(Math.ceil(currentRoundUsers.length / 2))
      .fill(null)
      .map(() => ({ address: "", name: "" }));
  }

  return {
    state: "initialized",
    rounds,
    standings: [],
  };
}

function updateTournament(
  tournament: Tournament,
  gameId: number,
  winnerAddress: string,
): Tournament {
  if (tournament.state === "finished") {
    throw new Error("Tournament has already finished.");
  }

  let gameFound = false;
  let currentRoundIndex = 0;
  let currentGameIndex = 0;
  let losingPlayer: User | null = null;

  // Find the game and update the winner
  for (const round of tournament.rounds) {
    currentGameIndex = 0;
    for (const game of round.games) {
      if (game.id === gameId) {
        game.winner = winnerAddress;
        losingPlayer =
          game.player1.address === winnerAddress ? game.player2 : game.player1;
        gameFound = true;
        break;
      }
      currentGameIndex++;
    }
    if (gameFound) break;
    currentRoundIndex++;
  }

  if (!gameFound) {
    throw new Error("Game not found.");
  }

  // Propagate the winner to the next round if it exists
  if (currentRoundIndex < tournament.rounds.length - 1) {
    const currentRound = tournament.rounds[currentRoundIndex];
    const nextRound = tournament.rounds[currentRoundIndex + 1];

    const nextGameIndex = Math.floor(currentGameIndex / 2);
    const nextGame = nextRound.games[nextGameIndex];

    if (currentGameIndex % 2 === 0) {
      nextGame.player1 = { address: winnerAddress, name: winnerAddress }; // Replace with actual user lookup
    } else {
      nextGame.player2 = { address: winnerAddress, name: winnerAddress }; // Replace with actual user lookup
    }

    tournament.state = "inProgress";
  }

  // Add the losing player to the standings with the round they reached
  if (losingPlayer) {
    tournament.standings.push({
      user: losingPlayer,
      roundReached: currentRoundIndex + 1,
    });
  }

  // Check if the tournament is finished
  const lastRound = tournament.rounds[tournament.rounds.length - 1];
  if (lastRound.games.length === 1 && lastRound.games[0].winner) {
    tournament.state = "finished";
    const winner = lastRound.games[0].winner!;
    const winningPlayer = users.find((user) => user.address === winner)!;
    tournament.standings.push({
      user: winningPlayer,
      roundReached: tournament.rounds.length,
    });
    tournament.standings.reverse(); // Reverse to have the winner at the top
  } else {
    tournament.state = "inProgress";
  }

  return tournament;
}

// Example usage
const users: User[] = [
  { address: "user1@example.com", name: "User One" },
  { address: "user2@example.com", name: "User Two" },
  { address: "user3@example.com", name: "User Three" },
  { address: "user4@example.com", name: "User Four" },
  { address: "user5@example.com", name: "User Five" },
  { address: "user6@example.com", name: "User Six" },
  { address: "user7@example.com", name: "User Seven" },
  { address: "user8@example.com", name: "User Eight" },
  { address: "user9@example.com", name: "User Nine" },
  { address: "user10@example.com", name: "User Ten" },
  { address: "user11@example.com", name: "User Eleven" },
  { address: "user12@example.com", name: "User Twelve" },
  { address: "user13@example.com", name: "User Thirteen" },
  { address: "user14@example.com", name: "User Fourteen" },
  { address: "user15@example.com", name: "User Fifteen" },
  { address: "user16@example.com", name: "User Sixteen" },
  { address: "user17@example.com", name: "User Seventeen" },
  { address: "user18@example.com", name: "User Eighteen" },
  { address: "user19@example.com", name: "User Nineteen" },
  { address: "user20@example.com", name: "User Twenty" },
  { address: "user21@example.com", name: "User Twenty-One" },
  { address: "user22@example.com", name: "User Twenty-Two" },
  { address: "user23@example.com", name: "User Twenty-Three" },
  { address: "user24@example.com", name: "User Twenty-Four" },
  { address: "user25@example.com", name: "User Twenty-Five" },
  { address: "user26@example.com", name: "User Twenty-Six" },
  { address: "user27@example.com", name: "User Twenty-Seven" },
  { address: "user28@example.com", name: "User Twenty-Eight" },
  { address: "user29@example.com", name: "User Twenty-Nine" },
  { address: "user30@example.com", name: "User Thirty" },
  { address: "user31@example.com", name: "User Thirty-One" },
  { address: "user32@example.com", name: "User Thirty-Two" },
];

let tournament = createTournament(users);
console.log(tournament);

// First round
tournament = updateTournament(tournament, 1, "user1@example.com");
tournament = updateTournament(tournament, 2, "user3@example.com");
tournament = updateTournament(tournament, 3, "user5@example.com");
tournament = updateTournament(tournament, 4, "user7@example.com");
tournament = updateTournament(tournament, 5, "user9@example.com");
tournament = updateTournament(tournament, 6, "user11@example.com");
tournament = updateTournament(tournament, 7, "user13@example.com");
tournament = updateTournament(tournament, 8, "user15@example.com");
tournament = updateTournament(tournament, 9, "user17@example.com");
tournament = updateTournament(tournament, 10, "user19@example.com");
tournament = updateTournament(tournament, 11, "user21@example.com");
tournament = updateTournament(tournament, 12, "user23@example.com");
tournament = updateTournament(tournament, 13, "user25@example.com");
tournament = updateTournament(tournament, 14, "user27@example.com");
tournament = updateTournament(tournament, 15, "user29@example.com");
tournament = updateTournament(tournament, 16, "user31@example.com");

console.log("After first round:", tournament);

// Second round
tournament = updateTournament(tournament, 17, "user1@example.com");
tournament = updateTournament(tournament, 18, "user5@example.com");
tournament = updateTournament(tournament, 19, "user9@example.com");
tournament = updateTournament(tournament, 20, "user13@example.com");
tournament = updateTournament(tournament, 21, "user17@example.com");
tournament = updateTournament(tournament, 22, "user21@example.com");
tournament = updateTournament(tournament, 23, "user25@example.com");
tournament = updateTournament(tournament, 24, "user29@example.com");

console.log("After second round:", tournament);

// Quarter-finals
tournament = updateTournament(tournament, 25, "user1@example.com");
tournament = updateTournament(tournament, 26, "user9@example.com");
tournament = updateTournament(tournament, 27, "user17@example.com");
tournament = updateTournament(tournament, 28, "user25@example.com");

console.log("After quarter-finals:", tournament);

// Semi-finals
tournament = updateTournament(tournament, 29, "user1@example.com");
tournament = updateTournament(tournament, 30, "user17@example.com");

console.log("After semi-finals:", tournament);

// Final
tournament = updateTournament(tournament, 31, "user1@example.com");

console.log("After final:", tournament);
console.log("Standings:", tournament.standings);
