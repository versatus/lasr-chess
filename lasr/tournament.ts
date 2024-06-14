import {
  buildCreateInstruction,
  buildTokenDistribution,
  IComputeInputs,
  Outputs,
  parseMetadata,
  Program,
  THIS,
  updateProgramData,
  updateProgramMetadata,
} from "@versatus/versatus-javascript";

class ChessTournament extends Program {
  constructor() {
    super();
    this.registerContractMethod("create", this.create);
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
          type: "tournament",
          imgUrl,
          users: "{}",
          methods,
        },
      });
      const distributionInstruction = buildTokenDistribution({
        programId: THIS,
        initializedSupply,
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
}

ChessTournament.run();
