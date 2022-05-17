import * as conf from "../config";
import { task } from "hardhat/config";

task("finishproposal", "Finish proposal")
    .addParam("id", "Proposal's id")
    .setAction(async (taskArgs, { ethers }) => {
    let DAO = await ethers.getContractAt("DAO", conf.CONTRACT_ADDRESS);
    await DAO.finishProposal(taskArgs.id);
  });
