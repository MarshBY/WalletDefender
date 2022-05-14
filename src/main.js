import 'dotenv/config'
import BlocknativeSdk from 'bnc-sdk'
import { BigNumber, ethers } from 'ethers'
import WebSocket from 'ws'

const options = {
    dappId: process.env.BLOCKNATIVE_API,
    networkId: 4, //Rinkeby
    ws: WebSocket
}

const provider = new ethers.providers.JsonRpcProvider('https://rinkeby.infura.io/v3/' + process.env.INFURA_PROJECT);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const blockNative = new BlocknativeSdk(options);

let transactions = [];

const start = () => {
    const { emitter } = blockNative.account(wallet.address);
    emitter.on('txPool', async (tx) => {
        const nextNonce = await wallet.getTransactionCount();
        if(tx.nonce != nextNonce) { return; } //Tx with incorrect nonce?
        for (const transaction of transactions) {
            if(tx.hash == transaction) {
                return;
            }
        }
        //Compromised transaction
        console.log('\nCOMPROMISED TRANSACTION: ', tx.hash, '\nNonce: ', tx.nonce, '\nStatus: ', tx.status);
        transferFunds(tx.nonce, tx.maxFeePerGas, tx.maxPriorityFeePerGas, tx.value);
    })

    console.log('Listening Mempool... ');
}


//SEND all balances to Hardware wallet in one tx
//Using same nonce but higher gasPrice
const transferFunds = async (nonce, maxFeeGas, maxPriorityGas, value) => {
    const tx = {
        to: process.env.HARDWARE_WALLET,
        value: value, //this.balance?,
        nonce: nonce,
        maxFeePerGas: BigNumber.from(maxFeeGas).mul(2),
        maxPriorityFeePerGas: BigNumber.from(maxPriorityGas).mul(2),
        //data: '' //Would add here send also ERC20s and NFTs or add it in consecuent tx
    }

    console.log('\nCompromised Priority: ', ethers.utils.formatUnits(maxPriorityGas, 'gwei'), ' gwei');
    console.log('New Priority: ', ethers.utils.formatUnits(tx.maxPriorityFeePerGas, 'gwei'), ' gwei');
    
    const updatedTx = await wallet.sendTransaction(tx);
    addTransaction(updatedTx.hash);
    console.log('\nSent Updated Tx');

    try{
        await updatedTx.wait(2);
        notify();
    }catch(err){
        console.log('\nCouldnt save funds :(');
    }
    console.log('\nListening Mempool...')
}

//Everytime before sending a tx store it here
const addTransaction = (txHash) => {
    //Double reverse so the first one is the latest transaction added for speed in the for loop
    transactions.reverse();
    transactions.push(txHash);
    transactions.reverse();
    console.log('Added tx: ', txHash);
}

const notify = () => {
    console.log('\n---FUNDS WERE SENT TO HARDWARE WALLET---\n');
}

export { start, addTransaction };