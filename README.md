# LASRChess
A peer-to-peer game that allows users to play and bet on chess with their friends in real-time, all on-chain.

## Features
- Play chess with your friends in real-time (websockets)
- Place a wager (VERSE) on the outcome of the game
- All moves are checked and stored on-chain within LASR
- Runs [Chess.js](https://github.com/jhlywa/chess.js) inside of the LASR program
- Runs [react-chessboard](https://github.com/Clariity/react-chessboard) in the webapp

## Dependencies
- Node v18+

## Getting Started

### Clone Repo
```bash
git clone git@github.com:versatus/lasr-chess.git
cd lasr-chess
```
This application has two parts.
A chess program that runs on LASR and a webapp which allows users to interact with the program.
Let's deploy the chess program to LASR.


### Deploy Chess Program to LASR
```bash
cd lasr
npm install
npx lasrctl build lasr-chess.ts
# this command will download an internal cli depending on os arch (arm64 & x86_64, windows soon)
npx lasrctl test -b lasr-chess -i lasr-chess-inputs
```
This next command will deploy the main chess program. 

_NOTE: You can change the initialized and total
supply flags to however many available seats you want to have._ 
```bash
npx lasrctl deploy -b lasr-chess -s CHESS -p "LASRChess" --initializedSupply 10 --totalSupply 10
```
After successful program deployment _(don't be afraid to run it again if it fails..)_, you'll receive
back a program address that you need to put into the 
`.env` file in the webapp.

```shell
Program created successfully.
==> programAddress: 0xe4a4122605d01eaf39e9cf6f0b257f9f72386a4a
==> symbol: CHESS
==> network: stable
==> tokenName: LASRChess
==> initializedSupply: 10
==> totalSupply: 10
==> recipientAddress: 0xe4a4122605d01eaf39e9cf6f0b257f9f72386a4a
======
======
======
======
>>>>>>>>>>> View Program on LASR Playground:
https://playground.versatus.io/programs/0xe4a4122605d01eaf39e9cf6f0b257f9f72386a4a
```


Now we're going to check out the keypair which we'll use later.
```bash
cat .lasr/wallet/keypair.json

[
  {
    "mnemonic": "chat gorilla describe primary solve praise phrase sweet limit scan unknown market",
    "keypair": "f15f2cc23f13a8a95f1be0037b3af074b3f9e5c8bbab95e141ce19361ffb3f89",
    "secret_key": "f15f2cc23f13a8a95f1be0037b3af074b3f9e5c8bbab95e141ce19361ffb3f89",
    "public_key": "02dfaa91d0bc02b8039231d18778359280e424c0c9d32fece070b76ef4959f1246",
    "address": "0xc389fea081f8c47adcc3a78200ed1f110af22817"
  }
]
```

Cool! Now we're going to install the webapp and get it running.

### Run Webapp
```bash
cd ../app
npm install
```

Now we need to update the local `.env` file with the program address and keypair we got
from the previous step.

```bash
cp .env.example .env
```

Open up the `.env` file in your favorite IDE.

Now lets add the program address, your new address and secret_key to the `.env` file.

```dotenv
LASR_RPC_URL=http://lasr-sharks.versatus.io:9292
CHESS_OWNER_PRIVATE_KEY="secret_key"
NEXT_PUBLIC_CHESS_PROGRAM_ADDRESS="programAddress"
NEXT_PUBLIC_CHESS_OWNER_ADDRESS="address"
NEXT_PUBLIC_VERSE_PROGRAM_ADDRESS=0x9f85fb953179fb2418faf4e5560c1ac3717e8c0f
```

Now we can start the webapp.

```bash
npm run dev
```

Open up [http:localhost:3000](http:localhost:3000) in your browser and you should see the app running.
You will need another browser or a service like [ngrok](https://ngrok.com/) to test the app with two players.


