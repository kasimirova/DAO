import * as conf from "../config";
import { task } from "hardhat/config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";


task("transfer", "transfer")
    .setAction(async (taskArgs, { ethers }) => {
    let owner:SignerWithAddress, addr1:SignerWithAddress, addr2:SignerWithAddress, addr3:SignerWithAddress;
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    let ERC20 = await ethers.getContractAt("ERC20", conf.ERC20_ADDRESS);
    await ERC20.transfer(addr1.address, ethers.utils.parseEther("100"));
    await ERC20.transfer(addr2.address, ethers.utils.parseEther("150"));
    await ERC20.transfer(addr3.address, ethers.utils.parseEther("100"));


  });
