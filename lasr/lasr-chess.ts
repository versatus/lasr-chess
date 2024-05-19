import {
  type IComputeInputs,
  Outputs,
  Program,
  THIS,
  buildTokenDistribution,
  parseProgramAccountData,
  updateProgramData,
  buildCreateInstruction,
  parseMetadata,
  parseTxInputs,
  validateAndCreateJsonString,
  validate,
  updateProgramMetadata,
  updateTokenData,
  parseAvailableTokenIds,
  buildTransferInstruction,
  parseAmountToBigInt,
} from "@versatus/versatus-javascript";

import { Chess } from "chess.js";

const NEW_GAME_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const VERSE_PROGRAM_ADDRESS = "0x9f85fb953179fb2418faf4e5560c1ac3717e8c0f";

class LasrChess extends Program {
  constructor() {
    super();
    this.registerContractMethod("acceptGame", this.acceptGame);
    this.registerContractMethod("create", this.create);
    this.registerContractMethod("makeMove", this.makeMove);
    this.registerContractMethod("newGame", this.newGame);
    this.registerContractMethod("registerUser", this.registerUser);
  }
  acceptGame(computeInputs: IComputeInputs) {
    try {
      const { from } = computeInputs.transaction;
      const txInputs = parseTxInputs(computeInputs);
      const { gameId, address1, wager } = txInputs;
      const updateGameStateInstruction = updateTokenData({
        accountAddress: address1,
        programAddress: THIS,
        data: {
          [`game-${gameId}-gameState`]: "inProgress",
          [`game-${gameId}-address2`]: from,
        },
      });
      const amountNeededForWager = parseAmountToBigInt(wager ?? "0");
      const transferToProgram = buildTransferInstruction({
        from: from,
        to: "this", // Represents the program's address.
        tokenAddress: VERSE_PROGRAM_ADDRESS,
        amount: amountNeededForWager,
      });
      return new Outputs(computeInputs, [
        updateGameStateInstruction,
        transferToProgram,
      ]).toJson();
    } catch (e) {
      throw e;
    }
  }
  create(computeInputs: IComputeInputs) {
    try {
      const { transaction } = computeInputs;
      const { from, to } = transaction;
      const metadata = parseMetadata(computeInputs);
      const { initializedSupply, totalSupply, symbol, name } = metadata;
      const imgUrl =
        "https://pbs.twimg.com/profile_images/1765199894539583488/RUiZn7jT_400x400.jpg";
      const methods = "acceptGame, newGame, makeMove, registerUser";
      const updateMetadata = updateProgramMetadata({
        programAddress: THIS,
        metadata: {
          symbol,
          name,
          initializedSupply,
          totalSupply,
        },
      });
      const updateData = updateProgramData({
        programAddress: THIS,
        data: {
          type: "chess",
          imgUrl,
          users: "{}",
          methods,
        },
      });
      const distributionInstruction = buildTokenDistribution({
        programId: THIS,
        initializedSupply,
        currentSupply: "0",
        to: THIS,
        nonFungible: true,
      });
      const createAndDistributeInstruction = buildCreateInstruction({
        from,
        initializedSupply,
        totalSupply,
        programId: THIS,
        programOwner: from,
        programNamespace: THIS,
        distributionInstruction,
      });
      return new Outputs(computeInputs, [
        createAndDistributeInstruction,
        updateData,
        updateMetadata,
      ]).toJson();
    } catch (e) {
      throw e;
    }
  }
  makeMove(computeInputs: IComputeInputs) {
    try {
      const { from } = computeInputs.transaction;
      const { move, fen, address1, gameId, wager } =
        parseTxInputs(computeInputs);
      validate(move, "missing move");
      validate(gameId, "missing gameId");
      validate(fen, "missing fen");
      const chess = new Chess(fen);
      chess.move(move);
      const instructions = [];

      if (chess.isGameOver()) {
        const payoutAmount = parseAmountToBigInt(wager ?? "0") * BigInt(2);
        const transferPayoutToWinner = buildTransferInstruction({
          from: THIS,
          to: from,
          tokenAddress: VERSE_PROGRAM_ADDRESS,
          amount: payoutAmount,
        });
        instructions.push(
          updateTokenData({
            accountAddress: address1,
            programAddress: THIS,
            data: {
              [`game-${gameId}-fen`]: chess.fen(),
              [`game-${gameId}-winnerAddress`]: from,
              [`game-${gameId}-gameState`]: "finished",
            },
          }),
          transferPayoutToWinner,
        );
      } else {
        instructions.push(
          updateTokenData({
            accountAddress: address1,
            programAddress: THIS,
            data: {
              [`game-${gameId}-fen`]: chess.fen(),
              [`game-${gameId}-gameState`]: "inProgress",
            },
          }),
        );
      }

      return new Outputs(computeInputs, instructions).toJson();
    } catch (e) {
      throw e;
    }
  }
  newGame(computeInputs: IComputeInputs) {
    try {
      const { from } = computeInputs.transaction;
      const txInputs = parseTxInputs(computeInputs);
      const { wager } = txInputs;
      const gameId = generateGameId();
      const updateProgramDataInstruction = updateTokenData({
        accountAddress: from,
        programAddress: THIS,
        data: {
          [`game-${gameId}-fen`]: NEW_GAME_FEN,
          [`game-${gameId}-address1`]: from,
          [`game-${gameId}-gameState`]: "initialized",
          [`game-${gameId}-wager`]: wager,
        },
      });
      const amountNeededForWager = parseAmountToBigInt(wager ?? "0");
      const transferToProgram = buildTransferInstruction({
        from: from,
        to: THIS,
        tokenAddress: VERSE_PROGRAM_ADDRESS,
        amount: amountNeededForWager,
      });
      return new Outputs(computeInputs, [
        updateProgramDataInstruction,
        transferToProgram,
      ]).toJson();
    } catch (e) {
      throw e;
    }
  }
  registerUser(computeInputs: IComputeInputs) {
    try {
      const txInputs = parseTxInputs(computeInputs);
      const { programId } = computeInputs.transaction;
      const { username, address } = txInputs;
      validate(username, "missing username");
      const programAccountData = parseProgramAccountData(computeInputs);
      const currUsers = JSON.parse(programAccountData?.users);
      validate(currUsers, "unable to parse users");
      const addUserToChessMainProgram = updateProgramData({
        programAddress: THIS,
        data: {
          users: validateAndCreateJsonString({
            ...currUsers,
            [address]: username,
          }),
        },
      });
      const tokenIds = parseAvailableTokenIds(computeInputs);
      const transferInstruction = buildTransferInstruction({
        from: programId,
        to: address,
        tokenAddress: programId,
        tokenIds: [tokenIds[0]],
      });
      return new Outputs(computeInputs, [
        addUserToChessMainProgram,
        transferInstruction,
      ]).toJson();
    } catch (e) {
      throw e;
    }
  }
}

const generateGameId = (): string => {
  return `${Math.random().toString(36).substr(2, 9)}`;
};

LasrChess.run();
