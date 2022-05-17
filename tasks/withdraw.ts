import * as conf from "../config";
import { task } from "hardhat/config";

task("withdraw", "Withdraw")
    .setAction(async (taskArgs, { ethers }) => {
    let DAO = await ethers.getContractAt("DAO", conf.CONTRACT_ADDRESS);
    await DAO.withdraw();
  });
