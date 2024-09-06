import {ethers} from "hardhat";
import { systemPrompt } from "./helpers/systemPrompt";


async function main() {
  if (!process.env.ORACLE_ADDRESS) {
    throw new Error("ORACLE_ADDRESS env variable is not set.");
  }
  const oracleAddress: string = process.env.ORACLE_ADDRESS;

  const knowledgeBaseCID: string = "";

  await deployChatGpt(oracleAddress, knowledgeBaseCID, systemPrompt);
}


async function deployChatGpt(oracleAddress: string, knowledgeBaseCID: string, systemPrompt: string) {
  const agent = await ethers.deployContract("ChatGpt", [oracleAddress, knowledgeBaseCID, systemPrompt], {});

  await agent.waitForDeployment();

  console.log(`ChatGpt" contract deployed to ${agent.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
