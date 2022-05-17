const { expect } = require("chai");
const { ethers, waffle} = require("hardhat");

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
let DAO : Contract, dao : Contract, staking : Contract, Staking : Contract, ERC20 : Contract, erc20 : Contract;
let owner:SignerWithAddress, addr1:SignerWithAddress, addr2:SignerWithAddress, addr3:SignerWithAddress, addr4:SignerWithAddress, addr5:SignerWithAddress, addr6:SignerWithAddress, abiSetPercent:any, abiSetFreezeTime:any, provider:any;

describe("DAO", function () {
  before(async function () 
  {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners();

    ERC20 = await ethers.getContractFactory("ERC20");
    erc20 = await ERC20.deploy("Token2", "Tkn1", 18, ethers.utils.parseEther("1000"));
    await erc20.deployed();

    await erc20.transfer(addr1.address, ethers.utils.parseEther("140"));
    await erc20.transfer(addr2.address, ethers.utils.parseEther("100"));
    await erc20.transfer(addr3.address, ethers.utils.parseEther("100"));
    await erc20.transfer(addr4.address, ethers.utils.parseEther("100"));
    await erc20.transfer(addr5.address, ethers.utils.parseEther("100"));

    DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy(owner.address, erc20.address, 25, 86400);
    await dao.deployed();

    Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy("0x0000000000000000000000000000000000000001", "0x0000000000000000000000000000000000000002", 1800, 600, 20);
    await staking.deployed();

    let DAO_ROLE = await staking.DAO_ROLE();
    await staking.grantRole(DAO_ROLE, dao.address);

    provider = waffle.provider;

    abiSetPercent = [{
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

    abiSetFreezeTime = [{
      "inputs": [
        {
          "internalType": "uint256",
          "name": "newFreezingTime",
          "type": "uint256"
        }
      ],
      "name": "setFreezingTimeForLP",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }];

  });

  it("Should deposit", async function () {
    await erc20.connect(addr1).approve(dao.address, ethers.utils.parseEther("140"));
    await erc20.connect(addr2).approve(dao.address, ethers.utils.parseEther("30"));
    await erc20.connect(addr3).approve(dao.address, ethers.utils.parseEther("100"));
    await erc20.connect(addr4).approve(dao.address, ethers.utils.parseEther("55"));
    await erc20.connect(addr5).approve(dao.address, ethers.utils.parseEther("80"));


    await dao.connect(addr1).deposit(ethers.utils.parseEther("70"));
    await dao.connect(addr2).deposit(ethers.utils.parseEther("30"));
    await dao.connect(addr3).deposit(ethers.utils.parseEther("100"));
    await dao.connect(addr4).deposit(ethers.utils.parseEther("55"));
    await dao.connect(addr5).deposit(ethers.utils.parseEther("80"));

    expect(await dao.getUsersDeposit(addr1.address)).to.equal(ethers.utils.parseEther("70"));
    expect(await dao.getUsersDeposit(addr2.address)).to.equal(ethers.utils.parseEther("30"));
  }
  );

  it("Shouldn't add proposal as not a chair person", async function () {
    const ifacePercent = new ethers.utils.Interface(abiSetPercent);
    const calldataPercent = ifacePercent.encodeFunctionData('setRewardPercent',[30]);
    await expect(dao.connect(addr1).addProposal(calldataPercent, staking.address, "Change reward percent" )).to.be.revertedWith("Only chair person can add proposal");
  }
  );

  it("Should add proposal", async function () {
    const ifacePercent = new ethers.utils.Interface(abiSetPercent);
    const calldataPercent = ifacePercent.encodeFunctionData('setRewardPercent',[30]);

    await dao.addProposal(calldataPercent, staking.address, "Change reward percent" );
  }
  );

  it("Shouldn't vote with zero deposit", async function () {
    await expect(dao.connect(addr6).vote(0, false)).to.be.revertedWith("There isn't any tokens on sender's deposit");
  }
  );

  it("Shouldn't vote for non existing proposal", async function () {
    await expect(dao.connect(addr1).vote(1, false)).to.be.revertedWith("Proposal with that id doesn't exist");
  }
  );

  it("Should vote for an existing proposal", async function () {
    await expect(dao.connect(addr1).vote(0, false)).to.emit(dao, "UserVoted").withArgs(addr1.address, 0, false);
    await dao.connect(addr2).vote(0, true);
    await dao.connect(addr3).vote(0, true);
    await dao.connect(addr4).vote(0, false);
    expect(await erc20.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("70"));
    expect(await dao.checkIfUserVoted(addr1.address, 0)).to.equal(true);
    
  }
  );

  it("Shouldn't vote for the second time", async function () {
    await expect(dao.connect(addr1).vote(0, false)).to.be.revertedWith("Sender has already voted");
  }
  );

  it("Shouldn't finish non existing proposal", async function () {
    await expect(dao.connect(addr1).finishProposal(1)).to.be.revertedWith("Proposal with that id doesn't exist");
  }
  );

  it("Shouldn't finish proposal earlier", async function () {
    await expect(dao.connect(addr1).finishProposal(0)).to.be.revertedWith("It's too soon to finish this proposal");
    await provider.send("evm_increaseTime", [70400]);
    await provider.send("evm_mine");
  }
  );

  it("Should add proposal", async function () {
    const ifaceFreeze = new ethers.utils.Interface(abiSetFreezeTime);
    const calldataFreeze = ifaceFreeze.encodeFunctionData('setFreezingTimeForLP',[1200]);

    await dao.addProposal(calldataFreeze, staking.address, "Change freezing time" );
  }
  );

  it("Should finish proposal in time", async function () {
    await provider.send("evm_increaseTime", [17000]);
    await provider.send("evm_mine");
    await expect(dao.connect(addr1).finishProposal(0)).to.emit(dao, "ProposalFinishedSuccessfully").withArgs(0);
    expect(await staking.getRewardPercent()).to.equal(30);
  }
  );

  it("Should add proposal with wrong signature", async function () {
    const ifacePercent = new ethers.utils.Interface(abiSetPercent);
    const calldataPercent = ifacePercent.encodeFunctionData('setRewardPercent',[40]);

    await dao.addProposal(calldataPercent, erc20.address, "Change reward percent" );
    await dao.connect(addr1).vote(2, true);
    await dao.connect(addr2).vote(2, false);
    await dao.connect(addr3).vote(2, true);
    await dao.connect(addr4).vote(2, false);
    expect(await dao.checkIfUserVoted(addr3.address, 2)).to.equal(true);
  }
  );

  it("Should vote for an existing proposal", async function () {
    await expect(dao.connect(addr1).vote(1, true)).to.emit(dao, "UserVoted").withArgs(addr1.address, 1, true);
    await dao.connect(addr2).vote(1, true);    
  }
  );

  it("Should finish proposal with wrong signature as failed", async function () {
    await provider.send("evm_increaseTime", [86400]);
    await provider.send("evm_mine");
    await expect(dao.connect(addr1).finishProposal(2)).to.emit(dao, "ProposalFailed").withArgs(2, "Error in call func");
    //await expect(dao.connect(addr2).finishProposal(2)).to.be.revertedWith("Error in call func");
    expect(await staking.getFreezingTimeForLP()).to.equal(1800);

  }
  );

  it("Should't vote after time is over", async function () {
    await expect(dao.connect(addr3).vote(1, false)).to.be.revertedWith("Voting time is over");
    expect(await dao.checkIfUserVoted(addr3.address, 1)).to.equal(false);
  }
  );

  it("Should finish proposal as failed if there's not enough votes", async function () {
    await expect(dao.connect(addr1).finishProposal(1)).to.emit(dao, "ProposalFailed").withArgs(1, "Not enough votes");
  }
  );

  it("Should add proposal", async function () {
    const ifacePercent = new ethers.utils.Interface(abiSetPercent);
    const calldataPercent = ifacePercent.encodeFunctionData('setRewardPercent',[40]);

    await dao.addProposal(calldataPercent, staking.address, "Change reward percent" );
    await dao.connect(addr1).vote(3, true);
    await dao.connect(addr2).vote(3, true);
    await dao.connect(addr3).vote(3, false);
    await dao.connect(addr4).vote(3, false);
    expect(await dao.checkIfUserVoted(addr4.address, 3)).to.equal(true);
  }
  );

  it("Shouldn't withdraw tokens", async function () {
    await expect(dao.connect(addr1).withdrawTokens()).to.be.revertedWith("Not all proposals that you participate in are finished");
  }
  );

  it("Should finish proposal as failed", async function () {
    await provider.send("evm_increaseTime", [86400]);
    await provider.send("evm_mine");
    await expect(dao.connect(addr2).finishProposal(3)).to.emit(dao, "ProposalFailed").withArgs(3, "The majority of participants vote against");
    expect(await staking.getRewardPercent()).to.equal(30);
  }
  );

  it("Should withdraw tokens", async function () {
    await dao.connect(addr1).withdrawTokens();
    expect(await erc20.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("140"));
  }
  );
});
