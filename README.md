# LASR CHESS
A peer-to-peer game that allows users to play chess with their friends in real-time, all on-chain.

## Features
- Play chess with your friends in real-time
- Bet on the outcome of the game
- All moves are stored on-chain with LASR

## Getting Started
This application has two parts. 

The LASRChess program that runs on LASR and then the webapp which allows users to interact with the game.
### Deploy LASRChess 
```bash
cd lasr
bun install
lasrctl build lasr-chess.ts
lasrctl test -b lasr-chess -i lasr-chess-inputs
```
This next command will deploy the main chess program. You should change the initialized and total supply to however many available seats you want to have. 
```bash
lasrctl deploy -b lasr-chess -s CHESS -p "LASRChess" --initializedSupply 10 --totalSupply 10
```
After successful deployment, you'll receive back a program address that you need to put into the 
`.env` file in the webapp. There you'll also see

