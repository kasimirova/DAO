import "@nomiclabs/hardhat-waffle";
	import 'solidity-coverage';
	import * as dotenv from "dotenv";
	import "./tasks/index.ts";
	import "@nomiclabs/hardhat-etherscan";
	dotenv.config();

	export default{
  		networks: {

    	rinkeby: {
      url: process.env.RINKEBY_URL,
      accounts: {
        mnemonic: process.env.MNEMONIK,
        count: 10
      }
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}
