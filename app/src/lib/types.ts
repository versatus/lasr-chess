export interface IGame {
  gameId: string
  address1?: string
  address2?: string
  fen?: string
  gameState?: string
  wager?: string
  winnerAddress?: string
  createdAt?: string
  type?: string
}

export interface GameRoom {
  members: Set<string>
  fen: string
}
