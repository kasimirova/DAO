import * as conf from "../config";
import { task } from "hardhat/config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";


task("deposit", "Deposit")
    .addParam("amount", "Amount of deposit")
    .setAction(async (taskArgs, { ethers }) => {
    let ERC20 = await ethers.getContractAt("ERC20", conf.ERC20_ADDRESS);
    let DAO = await ethers.getContractAt("DAO", conf.CONTRACT_ADDRESS);
    let owner:SignerWithAddress, addr1:SignerWithAddress;
    [owner, addr1] = await ethers.getSigners();
    await ERC20.connect(addr1).approve(conf.CONTRACT_ADDRESS, taskArgs.amount);
    await DAO.connect(addr1).deposit(taskArgs.amount);
  });
