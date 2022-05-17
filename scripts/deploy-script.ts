import { ethers } from "hardhat";
import * as conf from "../config";


async function main() {
  const DAO = await ethers.getContractFactory("DAO");
  const dao = await DAO.deploy(conf.CHAIR_PERSON_ADDRESS, conf.ERC20_ADDRESS, 3, 86400);

  await dao.deployed();

  console.log("DAO deployed to:", dao.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });