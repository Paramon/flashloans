require('dotenv').config();
const Web3 = require('web3');
const abis = require('./abis');
const {mainnet: addresses} = require('./addresses');

const web3 = new Web3(
    new Web3.providers.WebsocketProvider(process.env.INFURA_URL)
);

const kyber = new web3.eth.Contract(
    abis.kyber.kyberNetworkProxy,
    addresses.kyber.kyberNetworkProxy
);
const RECENT_ETH_PRICE = 1600;
const AMOUNT_ETH = 10;
const AMOUNT_ETH_WEI = web3.utils.toWei(AMOUNT_ETH.toString());
const AMOUNT_DAI_WEI = web3.utils.toWei((AMOUNT_ETH * RECENT_ETH_PRICE).toString());

web3.eth.subscribe('newBlockHeaders')
    .on('data', async block => {
        console.log("New block received. Block #", block.number);
        /* The above code is using the Kyber API to get the buy and sell rates for ETH/DAI. */
        const kyberResults = await Promise.all([
            kyber
              .methods
              .getExpectedRate(
                addresses.tokens.dai, 
                '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 
                AMOUNT_DAI_WEI
              ) 
              .call(),
            kyber
              .methods
              .getExpectedRate(
                '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 
                addresses.tokens.dai, 
                AMOUNT_ETH_WEI
              ) 
              .call()
        ]);
        // normalize Kyber rates
        const kyberRates = {
          buy: parseFloat(1 / (kyberResults[0].expectedRate / (10 ** 18))),
          sell: parseFloat(kyberResults[1].expectedRate / (10 ** 18))
        };
        console.log('Kyber ETH/DAI');
        console.log(kyberRates);


    }).on('error', error => {
        console.error(error);
    });