import * as conf from "../config";
import { task } from "hardhat/config";

task("addproposal", "Add proposal")
    .addParam("recipient", "recipient")
    .setAction(async (taskArgs, { ethers }) => {
    let DAO = await ethers.getContractAt("DAO", conf.CONTRACT_ADDRESS);
    let abiSetPercent = [{
      "inputs": [
        {
          "internalType": "uint8",
          "name": "newRewardPercent",
          "type": "uint8"
        }
      ],
      "name": "setRewardPercent",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }];

    const ifacePercent = new ethers.utils.Interface(abiSetPercent);
    const calldataPercent = ifacePercent.encodeFunctionData('setRewardPercent',[30]);

    await DAO.addProposal(calldataPercent, taskArgs.recipient, "Change reward percent");
  });
