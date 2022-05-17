import * as conf from "../config";
import { task } from "hardhat/config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";


task("vote", "Vote")
    .addParam("id", "Proposal's id")
    .addParam("vote", "vote")
    .setAction(async (taskArgs, { ethers }) => {
    let DAO = await ethers.getContractAt("DAO", conf.CONTRACT_ADDRESS);
    let owner:SignerWithAddress, addr1:SignerWithAddress;
    [owner, addr1] = await ethers.getSigners()
    await DAO.connect(addr1).vote(taskArgs.id, taskArgs.vote);
  });
