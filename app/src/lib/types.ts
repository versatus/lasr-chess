export interface IGame {
  gameId: string
  address1?: string
  address2?: string
  fen?: string
  gameState?: string
  winnerAddress?: string
}

export interface GameRoom {
  members: Set<string>
  fen: string
}
