import 'dotenv/config'
import { ethers } from 'ethers'
import axios from 'axios';

const provider = new ethers.providers.JsonRpcProvider('https://rinkeby.infura.io/v3/' + process.env.INFURA_PROJECT);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const test = async () => {
    let rawTx = {
        to: '0xF1eB3143208A7f3B1b31647403bc8a2f5275945A', //Took random wallet
        value: ethers.utils.parseEther('0.001')
    }

    rawTx = await wallet.populateTransaction(rawTx);
    const signedTx = await wallet.signTransaction(rawTx);
    const hash = ethers.utils.keccak256(signedTx);

    //Add Hash to server
    /*
    const res = await axios.post('http://localhost:3000', {
        token: 'fc80cf20-6a45-4854-95cf-7f8ad86634f6',
        txHash: hash
    })
    
    if(res.status != 200){ return; }
    */

    const sent = await provider.sendTransaction(signedTx);
    console.log('Sent: ', sent.hash);

    try {
        await sent.wait();
        console.log('Finished: ', sent.hash);
    }catch(err){
        console.log('Error!');
    }

}

test();