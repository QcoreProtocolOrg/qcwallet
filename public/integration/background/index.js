const { networks, Wallet, generateMnemonic } = QtumWallet;

const transactionPortMap = {};
var passwordHash = null; // passwordHash will be passed by popup 
var activeAccount = null; // activeAccount will be passed by popup
var activePrivateKey = null; // activePrivateKey will be passed by popup

const getPrivateKey = () => {
    return activePrivateKey;
};

const getActiveAccount = () => {
    return activeAccount;
};

const getCurrentAddress = () => {
    const account = getActiveAccount();
    if (account) {
        return account.address;
    } else {
        return null;
    }
};

const callContract = async (contractAddress, encodedData) => {
    try {
        const signInPrivateKey = getPrivateKey();
        if (!signInPrivateKey) {
            return { error: 'Please unlock QC wallet!' };
        }
        const network = networks.testnet;
        const wallet = network.fromWIF(signInPrivateKey);
        const result = await wallet.contractCall(contractAddress, encodedData, {
            amount: 0
        });
        return result;
    } catch (error) {
        return { error: error.message };
    }
};

const base58ToHex = (str) => {
    try {
        const signInPrivateKey = getPrivateKey();
        if (!signInPrivateKey) {
            return { error: 'Please unlock QC wallet!' };
        }
        const network = networks.testnet;
        const wallet = network.fromWIF(signInPrivateKey);
        const result = network.base58ToHex(str);
        return result;
    } catch (error) {
        return { error: error.message };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('background started!');
    // testZilliqa();
    testQtum();
});

// Messages from contentscript
chrome.runtime.onConnect.addListener(port => {
    console.assert(port.name == 'qc-port');
    port.onMessage.addListener(async (message) => {
        const {route, data} = message;
        if (route.wallet !== 'qtum' || route.source !== 'contentscript') {
            return;
        }

        if (data.method === 'getCurrentAddress') {
            const address = getCurrentAddress();
            port.postMessage({
                route: { wallet: 'qtum', source: 'background', target: 'contentscript' },
                data: {
                    serialNumber: data.serialNumber,
                    data: address
                }
            });
        } else if (data.method === 'callContract') {
            const resultData = await callContract(data.data.address, data.data.encodedData);
            port.postMessage({
                route: { wallet: 'qtum', source: 'background', target: 'contentscript' },
                data: {
                    serialNumber: data.serialNumber,
                    data: resultData
                }
            });
        } else if (data.method === 'sendToContract') {
            transactionPortMap[data.serialNumber] = port;
            const dataString = JSON.stringify(data);
            const url = `index.html?data=${dataString}` 
            // const url = `http:localhost:3001?data=${dataString}`
            chrome.windows.create({url, type: 'popup', height: 750, width:480}, window => {
            });
        } else if (data.method === 'base58ToHex') {
            const resultData = base58ToHex(data.data.address);

            port.postMessage({
                route: { wallet: 'qtum', source: 'background', target: 'contentscript' },
                data: {
                    serialNumber: data.serialNumber,
                    data: resultData
                }
            });
        }
    });
});

// Methods for popup
window.cancelTransaction = (data) => {
    window.sendTransaction(data);
}

// Methods for popup
window.sendTransaction = (data) => {
    const port = transactionPortMap[data.serialNumber];
    port.postMessage({
        route: { wallet: 'qtum', source: 'background', target: 'contentscript' },
        data
    });
    delete transactionPortMap[data.serialNumber];
}

// get password hash and return to popup
window.getPasswordHash = () => {
    return passwordHash;
}

// set password hash from popup
window.setPasswordHash = (data) => {
    passwordHash = data;
    return passwordHash;
}

// get ActiveAccount hash and return to popup
window.getActiveAccount = () => {
    return activeAccount;
}

// set password hash from popup
window.setActiveAccount = (data) => {
    activeAccount = data;
    return activeAccount;
}

// get 
window.getActivePrivateKey = () => {
 return activePrivateKey;
}

// set 
window.setActivePrivateKey = (data) => {
    activePrivateKey = data;
    return activePrivateKey;
}
