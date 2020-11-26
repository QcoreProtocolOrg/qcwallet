import React, { Component } from 'react';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';
import Card from '@material-ui/core/Card';
import IconButton from '@material-ui/core/IconButton';
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet';
import Dialog from '@material-ui/core/Dialog';
import Slide from '@material-ui/core/Slide';
import CloseIcon from '@material-ui/icons/Close';
import Send from '@material-ui/icons/Send';
import AttachMoney from '@material-ui/icons/AttachMoney';
import Launch from '@material-ui/icons/Launch';
import VpnKey from '@material-ui/icons/VpnKey';
import PermIdentity from '@material-ui/icons/PermIdentity';
import Explore from '@material-ui/icons/Explore';
import Wifi from '@material-ui/icons/Wifi';
import Dashboard from '@material-ui/icons/Dashboard';
import LockOpen from '@material-ui/icons/LockOpen';
import SpeakerNotes from '@material-ui/icons/SpeakerNotes';
import LinkIcon from '@material-ui/icons/Link';
import FileCopyIcon from '@material-ui/icons/FileCopy';


import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import TextField from '@material-ui/core/TextField';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Snackbar from '@material-ui/core/Snackbar';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import Grid from '@material-ui/core/Grid';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';
import ListSubheader from '@material-ui/core/ListSubheader';

import * as QRCode from "qrcode";
import xhr from "axios";
import moment from 'moment';
import CryptoJS from 'crypto-js';
import AES from 'crypto-js/aes';
import SHA256 from 'crypto-js/sha256';
import SHA512 from 'crypto-js/sha512';
import qs from 'qs';
import Identicon from 'identicon.js';
import { CopyToClipboard } from "react-copy-to-clipboard";

import logo from './logo.svg';
import './App.css';
import { networks, generateMnemonic } from 'qtumjs-wallet';


const coinmarketcapurl = 'https://api.coinmarketcap.com/v2/ticker/1684/';
const dappurl = 'https://qtumlightproject.github.io/assets/dappstore/dapp.json';

const theme = createMuiTheme({
   palette: {
    primary: {
      light: '#232328',
      main: '#232328',
      dark: '#169496',
      contrastText: '#ffffff',
    },
    secondary: {
      light: '#1297d7',
      main: '#1297d7',
      dark: '#232328',
      contrastText: '#ffffff',
    },
  },
});

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

class App extends Component {
  state = {
    appsalt:null,
    passwordHash:null,
    passwordSHA256:null,
    account:null,
    accounts:null,
    identicon:null,
    activeAccount:null,
    receiveOpen: false,
    sendOpen: false,
    keyOpen:false,
    importPrivateKeyOpen:false,
    importMnemonicOpen:false,
    loading: false,
    loadingMessage: '',
    snackbarOpen: false,
    snackbarMessage: '',
    selectedTab: 0,
    backupPrivateKeyOpen: false,
    showPrivateKey: false,
    createAccountPassword: '',
    importMnemonic:'',
    importMnemonicPassword:'',
    sendToContractPopupOpen: false,
    accountsOpen:false,
    anchorEl: null,
    showDappsOpen:false,
    resetWalletOpen: false,
    dapps:null,
  };

  clear = async () => {
    this.setState({
      passwordHash:null,
      passwordSHA256:null,
      privateKey: null,
      address: null,
      account: null,
      accounts:null,
      identicon:null,
      activeAccount:null,
      accountDetailsOpen: false,
      receiveOpen: false,
      sendOpen: false,
      keyOpen:false,
      importPrivateKeyOpen:false,
      importMnemonicOpen:false,
      freezeOpen: false,
      snackbarOpen: false,
      isLoading: false,
      backupPrivateKeyOpen: false,
      showPrivateKey: false,
      transactions: undefined,
      importPrivateKey: '',
      createAccountPassword: '',
      importMnemonic:'',
      importMnemonicPassword:'',
      sendToContractPopupOpen: false,
      accountsOpen: false,
      anchorEl: null,
      showDappsOpen:false,
      resetWalletOpen: false,
      dapps:null,
    });

    await this.setPasswordHashFromBackgroundPage(null);
    await this.setActiveAccountFromBackgroundPage(null);
    await this.setActivePrivateKeyFromBackgroundPage(null);
  };

  componentDidMount() {
    this.initData();
    this.initConfirmationPopup();
    this.loadPrice();
    this.loadDapp();
    window.addEventListener("beforeunload", this.onUnload);
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.onUnload)
  }

  onUnload = event => {
    if (this.state.sendToContractPopupOpen) {
      this.cancelTransaction();
    }
  };

  initData = async () =>{

    // initialize appsalt, generated per install
    // get from storage or set in storage if does not exist

    let appSalt = await this.getAppSaltFromLocalStorage();
    if(!appSalt)
    {
      appSalt = await this.setAppSaltLocalStorage();
    }
    this.setState({ appSalt });



    if (!this.state.network) {
      const network = await this.getNetworkFromLocalStorage();
      if(network) {
        if(network === 'MAINNET') {
          this.setState({ network: 'MAINNET' });
        } else {
          this.setState({ network: 'TESTNET' });
        }
      } else {
        this.setState({ network: 'TESTNET' });
        await this.setNetworkLocalStorage('TESTNET');
      }
    }

    // Retrieve passwordHash
    // passwordHash is generated from user password and stored in background page
    // it is only required every time user open chrome
    // passwordHash is used for encrypt all the private keys
    var passwordHash = await this.getPasswordHashFromBackgroundPage();

    this.setState({ passwordHash });

    var passwordSHA256 = await this.getPasswordSHA256FromLocalStorage();
    this.setState({ passwordSHA256 });

    if(passwordSHA256)
    {
       let walletLabel = 'Unlock Wallet';
       this.setState({walletLabel});
       this.setState({walletInitialised: true});
    }else{
       let walletLabel = 'Create Wallet';
       this.setState({walletLabel});
       this.setState({walletInitialised: false});
    }

    var accounts = await this.getAccountsFromLocalStorage();
    this.setState({accounts});

    if(!this.state.accounts)
    {
      this.setState({importOpen:true});
    }else
    {
      this.setState({importOpen:false});
    }

    var activeAccount = await this.getActiveAccountFromBackgroundPage();

    this.setState({activeAccount});

    await this.loadActiveAccount();

    if (!this.state.sendFeeRate) {
      this.setState({ sendFeeRate: 1000 });
    }
  };

  loadDapp = async () => {
      const { data } = await xhr.get(dappurl, {timeout: 5000});
      this.setState({ dapps : data.result });
  };

  loadActiveAccount = async() =>{
    let accounts = this.state.accounts;
    let passwordHash = this.state.passwordHash;
    if(accounts && passwordHash)
    {

      let activeAccount = this.state.activeAccount;

      if(!activeAccount)
      {
        activeAccount = this.state.accounts[0];
        await this.setActiveAccountFromBackgroundPage(activeAccount);
      }

      if(activeAccount)
      {
        let privateKey = (AES.decrypt(activeAccount.account,passwordHash)).toString(CryptoJS.enc.Utf8);
        await this.setActivePrivateKeyFromBackgroundPage(privateKey);

        const network = this.getNetwork();
        const wallet = await network.fromWIF(privateKey);
        let address = wallet.address;
        let identicon = new Identicon(address, 64).toString();

        try{
          this.setState({
            address,
            identicon,
            privateKey: privateKey,
            accounts: this.state.accounts
          }, () => {
            this.prepareKey(privateKey);
          });
        } catch(e) {
          console.log(e);
        }
      }
    }
  };

  // ******************
  // Local Storage
  // ******************

  setAppSaltLocalStorage = () => {
    return new Promise(resolve => {
       var wordArray = CryptoJS.lib.WordArray.random(32);
       /* eslint-disable no-undef */
       chrome.storage.local.set(
        {'appsalt': wordArray.toString()},function (result) {
        resolve(wordArray.toString());
       });
     });
  };

  getAppSaltFromLocalStorage = () => {
    return new Promise(resolve => {
      /* eslint-disable no-undef */
      chrome.storage.local.get('appsalt', function (result) {
        let appsalt = result.appsalt;
        if (appsalt)
        {
          resolve(appsalt.toString());
        } else {
          resolve(null);
        }
      });
    });
  };


 setPasswordSHA256LocalStorage = (pwdhash) => {
    return new Promise(resolve => {
      /* eslint-disable no-undef */
       chrome.storage.local.set(
        {'pwdhash': pwdhash},function (result) {
        resolve(pwdhash);
       });
     });
  };

  getPasswordSHA256FromLocalStorage = () => {
    return new Promise(resolve => {
      /* eslint-disable no-undef */
      chrome.storage.local.get('pwdhash', function (result) {
        let pwdhash = result.pwdhash;
        if(pwdhash)
        {
          resolve(pwdhash.toString());
        }else{
          resolve(null);
        }
      });
    });
  };

  getAccountsFromLocalStorage = () => {
    return new Promise(resolve => {
      /* eslint-disable no-undef */
      chrome.storage.local.get('accounts', function (result) {
        let accounts = result.accounts;
        if(accounts)
        {
          resolve(accounts);
        }else{
          resolve(null);
        }
      });
    });
  };

  setAccountsLocalStorage = (accounts) => {
    return new Promise(resolve => {
      /* eslint-disable no-undef */
       chrome.storage.local.set(
        {'accounts': accounts},function (result) {
        resolve(accounts);
       });
     });
  };

  getNetworkFromLocalStorage = () => {
    return new Promise(resolve => {
      /* eslint-disable no-undef */
      chrome.storage.local.get('network', function (result) {
        let network = result.network;
        if(network)
        {
          resolve(network);
        }else{
          resolve(null);
        }
      });
    });
  };

  setNetworkLocalStorage = (network) => {
    return new Promise(resolve => {
      /* eslint-disable no-undef */
       chrome.storage.local.set(
        {'network': network},function (result) {
        resolve(network);
       });
     });
  };

  getPasswordHashFromBackgroundPage = () => {
    return new Promise(resolve => {
      const backgroundPage = window.chrome.extension.getBackgroundPage();
      let hash = backgroundPage? backgroundPage.getPasswordHash():null;
      resolve(hash);
    });
  };

  setPasswordHashFromBackgroundPage = (data) => {
    return new Promise(resolve => {
      const backgroundPage = window.chrome.extension.getBackgroundPage();
      let hash = backgroundPage?backgroundPage.setPasswordHash(data):null;
      resolve(hash);
    });
  };

  getActiveAccountFromBackgroundPage = () => {
    return new Promise(resolve => {
      const backgroundPage = window.chrome.extension.getBackgroundPage();
      let activeAccount = backgroundPage? backgroundPage.getActiveAccount():null;
      resolve(activeAccount);
    });
  };

  setActiveAccountFromBackgroundPage = (data) => {
    return new Promise(resolve => {
      const backgroundPage = window.chrome.extension.getBackgroundPage();
      let activeAccount = backgroundPage?backgroundPage.setActiveAccount(data):null;
      resolve(activeAccount);
    });
  };

  setActivePrivateKeyFromBackgroundPage = (data) => {
    return new Promise(resolve => {
      const backgroundPage = window.chrome.extension.getBackgroundPage();
      let activePrivateKey = backgroundPage?backgroundPage.setActivePrivateKey(data):null;
      resolve(activePrivateKey);
    });
  };

  getAppSalt(){
    return this.state.appsalt;
  }

  createAppHashPassword = async () => {
    let {createAppHashPassword} = this.state;
    let appSalt = await this.getAppSaltFromLocalStorage();

    var passwordSHA256 = await this.getPasswordSHA256FromLocalStorage();
    var pwdSHA256 = SHA256(createAppHashPassword).toString();

    var passwordValid = true;
    if (passwordSHA256) { // if there is a passwordSHA256 in local storage, compare to what is entered
      if(pwdSHA256 !== passwordSHA256) {
        passwordValid = false;
      }
    } else {
      await this.setPasswordSHA256LocalStorage(pwdSHA256);
    }

    if (!passwordValid) {
      console.log('invalid password');
      return false;
    }

    //generate passwordHash and set to background page
    var pwdHashObj = SHA512(createAppHashPassword, appSalt);
    var pwdHash = pwdHashObj.toString();

    let passwordHash = await this.setPasswordHashFromBackgroundPage(pwdHash);

    this.setState({ passwordHash });

    var accounts = await this.getAccountsFromLocalStorage();
    this.setState({accounts});

    var activeAccount = await this.getActiveAccountFromBackgroundPage();
    this.setState({activeAccount});

    await this.loadActiveAccount();

    this.setState({createAppHashPassword: ''});
  };

  resetAppHashPassword = async () => {
    await this.setAppSaltLocalStorage(null);
    await this.setPasswordSHA256LocalStorage(null);
    await this.setAccountsLocalStorage(null);

    await this.setPasswordHashFromBackgroundPage(null);
    await this.setActiveAccountFromBackgroundPage(null);
    await this.setActivePrivateKeyFromBackgroundPage(null);


    this.setState({resetWalletOpen : false});
    this.setState({ passwordHash: null});
    this.setState({accounts : null});
    this.setState({activeAccount : null});
    this.setState({createAppHashPassword:''});

    let walletLabel = 'Create Wallet';
    this.setState({walletLabel});
    this.setState({walletInitialised: false});
  };


  initConfirmationPopup = () => {
    const parsedQueryString = qs.parse(window.location.search.substr(1));

    if (!parsedQueryString
      || !parsedQueryString.data) {
      return;
    }

    const queryData = JSON.parse(parsedQueryString.data);
    if (!queryData
      || !queryData.data
      || !queryData.serialNumber
      || !queryData.method) {
      return;
    }

    // send to a contract (write function)
    if (queryData.method === 'sendToContract') {
      const sendToContractData = queryData.data;
      const serialNumber = queryData.serialNumber;
      this.setState({
        sendToContractDataContractAddress: sendToContractData.address,
        sendToContractDataContractMethod: sendToContractData.method,
        sendToContractDataContractData: sendToContractData.encodedData,
        sendToContractDataContractHexData: sendToContractData.encodedData.toString('hex'),
        sendToContractDataAmount: sendToContractData.amount,
        sendToContractDataGasPrice: sendToContractData.txData.gasPrice,
        sendToContractDataGasLimit: sendToContractData.txData.gasLimit,
        sendToContractPopupOpen: true,
        serialNumber
      });
    }
  };

  getNetwork = () =>{
    if(this.state.network === 'MAINNET')
    {
      return networks.mainnet;
    }else if(this.state.network === 'TESTNET'){
      return networks.testnet;
    }else{
      return networks.testnet;
    }
  };

  getExplorerApiAddress = () =>{
    if(this.state.network === 'MAINNET')
    {
      return 'https://explorer.qtum.org/insight-api/txs?pageNum=0&address=';
    }else if(this.state.network === 'TESTNET'){
      return 'https://testnet.qtum.org/insight-api/txs?pageNum=0&address=';
    }else{
      return '';
    }
  };

  getExplorerAddress = () =>{
    if(this.state.network === 'MAINNET')
    {
      return 'https://www.qtum.info/address/';
    }else if(this.state.network === 'TESTNET'){
      return 'https://testnet.qtum.info/address/';
    }else{
      return '';
    }
  };

  qtumToSatoshi = (qtum) =>{
    return qtum * 100000000;
  };

  getExplorerTx = () =>{
    if(this.state.network === 'MAINNET')
    {
      return 'https://explorer.qtum.info/tx/';
    }else if(this.state.network === 'TESTNET'){
      return 'https://testnet.qtum.info/tx/';
    }else{
      return '';
    }
  };

  //**************************
  //*****Local Functions *****
  //**************************

  createAccount = async () => {
    let {createAccountPassword} = this.state;

    const mnemonic = generateMnemonic();
    const network = this.getNetwork();

    const wallet = await network.fromMnemonic(mnemonic, createAccountPassword)

    let privateKey=wallet.toWIF();

    await this.getAppSaltFromLocalStorage();
    let passwordHash = await this.getPasswordHashFromBackgroundPage();
    let accounts = await this.getAccountsFromLocalStorage();
    if(!accounts)
    {
      accounts = [];
    }

    let encryptedPrivateKey = AES.encrypt(privateKey,passwordHash).toString();

    let activeAccount = {
      'address': wallet.address,
      'account': encryptedPrivateKey
    };

    accounts.push(activeAccount);
    await this.setAccountsLocalStorage(accounts); // set to storage

    await this.setActiveAccountFromBackgroundPage(activeAccount); // set activeAccount to background
    await this.setActivePrivateKeyFromBackgroundPage(privateKey);

    this.setState({
      activeAccount,
      accounts,
      privateKey,
      mnemonic,
      createAccountPassword: '',
      backupPrivateKeyOpen: true,
      importOpen: false,
    });

    await this.loadActiveAccount(); // load active account
  };

  importPrivateKey = async () => {
    let {importPrivateKey} = this.state;

    try{

      const network = this.getNetwork();
      const wallet = await network.fromWIF(importPrivateKey);

      await this.getAppSaltFromLocalStorage();
      let passwordHash = await this.getPasswordHashFromBackgroundPage();
      let accounts = await this.getAccountsFromLocalStorage();
      if(!accounts)
      {
        accounts = [];
      }


      let encryptedPrivateKey = AES.encrypt(importPrivateKey,passwordHash).toString();

      let activeAccount = {
        'address': wallet.address,
        'account': encryptedPrivateKey
      };

      accounts.push(activeAccount);
      await this.setAccountsLocalStorage(accounts); // set to storage

      await this.setActiveAccountFromBackgroundPage(activeAccount); // set activeAccount to background
      await this.setActivePrivateKeyFromBackgroundPage(importPrivateKey);

      this.setState({
        activeAccount:activeAccount,
        accounts:accounts,
        privateKey:importPrivateKey,
        importPrivateKey: '',
        importMnemonic:'',
        importMnemonicPassword:'',
        importPrivateKeyOpen:false,
        importMnemonicOpen:false,
        importOpen: false,
      });

      await this.loadActiveAccount(); // load active account

    } catch(e) {
      console.log(e);
      this.setState({
        isLoading: false,
        snackbarOpen: true,
        snackbarMessage: `Fail to process, make sure you select the correct network`,
      });
    }
  };

   importMnemonic = async () => {
    let {importMnemonic,importMnemonicPassword} = this.state;

    try{

      const network = this.getNetwork();
      const wallet = await network.fromMnemonic(importMnemonic, importMnemonicPassword)
      const privateKey = wallet.toWIF();

      await this.getAppSaltFromLocalStorage();
      let passwordHash = await this.getPasswordHashFromBackgroundPage();
      let accounts = await this.getAccountsFromLocalStorage();
      if(!accounts)
      {
        accounts = [];
      }
      let encryptedPrivateKey = AES.encrypt(privateKey,passwordHash).toString();
      let activeAccount = {
        'address': wallet.address,
        'account': encryptedPrivateKey
      };
      accounts.push(activeAccount);
      await this.setAccountsLocalStorage(accounts); // set to storage

      await this.setActiveAccountFromBackgroundPage(activeAccount); // set activeAccount to background
      await this.setActivePrivateKeyFromBackgroundPage(privateKey);

      this.setState({
        activeAccount:activeAccount,
        accounts:accounts,
        privateKey: privateKey,
        importPrivateKey: '',
        importMnemonic:'',
        importMnemonicPassword:'',
        importPrivateKeyOpen:false,
        importMnemonicOpen:false,
        importOpen: false,
      });

      await this.loadActiveAccount(); // load active account

    } catch(e) {
      console.log(e);
      this.setState({
        isLoading: false,
        snackbarOpen: true,
        snackbarMessage: `Fail to process, make sure you select the correct network`,
      });
    }
  };

  prepareKey = (key) => {
    this.setState({
      privateKey: key
    }, () => {
      this.loadAccount();
      this.loadTransactions();
    });
  };

  reloadAccountDetails = () => {
    this.setState({
            isLoading: false,
            snackbarOpen: true,
            snackbarMessage: 'Reloading',
    }, () => {
      this.loadAccount();
      this.loadTransactions();
    });
  };

  //**************************
  //*****Network functions ***
  //**************************

  async loadAccount() {
    if (this.state.address) {
      var that = this;
      const network = this.getNetwork();
      const wallet = await network.fromWIF(this.state.privateKey);
      const info = await wallet.getInfo();
      that.setState({
          account:info
      });
    }
  }

  async loadTransactions() {
    if (this.state.address) {
      const { data } = await xhr.get(`${this.getExplorerApiAddress()}${this.state.address}`);
      if(data && data.txs) {
        this.setState({ transactions: data.txs });
      }
    }
  }

  sendToken = async () => {
    const {sendTo, sendAmount, sendFeeRate} = this.state;
    this.setState({ isLoading: true });

    const network = this.getNetwork();
    const wallet = await network.fromWIF(this.state.privateKey);

    var amt = parseFloat(sendAmount) * 1e8;
    var fr = parseFloat(sendFeeRate);
    try{

      const tx = await wallet.send(sendTo, amt, {
        // rate is 400 satoshi per byte, or  ~0.004 qtum/KB, as is typical.
        feeRate: fr,
      })

       if (tx) {
        this.setState({
          isLoading: false,
          snackbarOpen: true,
          snackbarMessage: 'Succesfully sent tokens!',
          sendTo: '',
          sendAmount: '',
        }, () => {
          this.loadAccount();
          this.loadTransactions();
          this.handleSendClose();
        });
      }

    }catch(e)
    {
      console.log(e);
      this.setState({
          isLoading: false,
          snackbarOpen: true,
          snackbarMessage: `Sent failed, please retry later.`,
        });
    }
  };

  async loadPrice() {
    const { data } = await xhr.get(coinmarketcapurl);
    this.setState({ price: data.data.quotes.USD});
  }

  //**************************
  //*****Validation Functions*****
  //**************************

  isPrivateKeyValid = () => {

    let {importPrivateKey} = this.state;
    if (!importPrivateKey || importPrivateKey.length === 0) {
      return false;
    }
    return true; // tokenliqa.util.verifyPrivateKey(importPrivateKey);
  };

  isMnemonicValid = () => {

    let {importMnemonic} = this.state;
    if (!importMnemonic || importMnemonic.length === 0) {
      return false;
    }

    return true;
  };


  //**************************
  //*****Handle Functions*****
  //**************************
  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  setSendAmount = (amount) => {
    const sendAmount = amount.replace(/^0+(?!\.|$)/, '').replace(/[^0-9 .]+/g,'').replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1");
    this.setState({
      sendAmount
    });

  };
  setFeeRate = (amount) => {
    const sendFeeRate = amount.replace(/^0+(?!\.|$)/, '').replace(/[^0-9 .]+/g,'').replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1");
    this.setState({
      sendFeeRate
    });
  };

  isSendValid = () => {
    const {sendTo, sendAmount} = this.state;
    const address = this.state.address;
    const addressUpperCase = address?address.toUpperCase():'';
    const sendToUpperCase = sendTo?sendTo.toUpperCase():'';

    return this.isAddress(sendTo) && parseFloat(this.state.account.balance) >= parseFloat(sendAmount) && sendAmount > 0 && sendToUpperCase !== addressUpperCase;
  };

  isAddress = (address) => {
    return address && address.length === 34;
  };

  changeNetwork = async () => {
    const { networkInSelection } = this.state;
    await this.setAccountsLocalStorage(null);
    await this.setNetworkLocalStorage(networkInSelection);
    this.setState({
      network: networkInSelection,
      accounts: null,
      importOpen: true,
      isLoading: false,
      snackbarOpen: true,
      snackbarMessage: 'Network switched',
      networkOpen: false
    }, () => {
      this.clear();
    });

  };

  //**************************
  //*****Render Functions*****
  //**************************

  renderDashboard() {
    if (!this.state.account) {
      return (
        <div>
          <LinearProgress/>
        </div>
      );
    }
    const balance = this.state.account.balance;
    const price = this.state.price;
    const accounts = this.state.accounts;
    const identicon = 'data:image/png;base64,' + this.state.identicon;

    return (
      <div className="cards">
          <Card className="card sign-in-card">
              <div className ="address align-right">
                  <img className='identicon' src={identicon} alt="identicon" /> {this.getAddressAbv(this.state.address)}
                  <Tooltip title="Switch Accounts">
                    <IconButton aria-label="Switch Accounts"
                    aria-owns={this.state.anchorEl ? 'menuAccountsSelection' : null}
                    aria-haspopup="true"
                       onClick={this.handleAccountsOpen}>
                      <PermIdentity />
                    </IconButton>
                  </Tooltip>

                  <Menu
                    id='menuAccountsSelection'
                    anchorEl={this.state.anchorEl}
                    open={this.state.accountsOpen}
                    onClose={this.handleAccountsClose.bind(this, null)}
                  >
                    {accounts.map(option => (
                      <MenuItem key={option.account}
                      selected={option.address === this.state.address}
                      onClick={this.handleAccountsClose.bind(this, option.account)}>
                        {option.address}
                      </MenuItem>
                    ))}

                    <MenuItem key='import'
                      onClick={this.handleAccountsCloseImport}>
                        Import Account
                    </MenuItem>
                  </Menu>
              </div>
              <div className="logo-container">
                <Tooltip title="Reload Account Details">
                  <img src={logo} alt="QTUM" className="token-logo" onClick={this.reloadAccountDetails} />
                </Tooltip>
              </div>

              <div className="balance">{balance} QTUM</div>
              {price && <div className="price">${price.price} </div>}

              <div className="balance">Address

              <Tooltip title="Show Private Key">
                  <IconButton aria-label="Details" onClick={this.showKey}>
                     <VpnKey />
                  </IconButton>
              </Tooltip>
              <div className="address"> {this.state.address}</div>
              </div>

          </Card>
      </div>
    )
  }

  async loadQRCode() {
    const qrcode = await QRCode.toDataURL(this.state.address);
    this.setState({ qrcode });
  }

  goToExplorerAddress = () => {
    window.open(`${this.getExplorerAddress()}${this.state.address}`, '_blank');
  };

  showReceive = () => {
    this.setState({ receiveOpen: true });
  };

  handleReceiveClose = () => {
    this.setState({ receiveOpen: false });
  };

  showSend = () => {
    this.setState({ sendOpen: true });
  };

  handleSendClose = () => {
    this.setState({ sendOpen: false });
  };

  showKey = () => {
    this.setState({ keyOpen: true });
  };

  handleKeyClose = () => {
    this.setState({ keyOpen: false });
  };

  handleCopyToClipBoard = () => {
    this.setState({
              isLoading: false,
              snackbarOpen: true,
              snackbarMessage: 'Copied to clipboard.'
            });
  };


  handleNetworkClose = () => {
    this.setState({ networkOpen: false });
  };

  showNetwork = () => {
    const { network } = this.state;
    this.setState({ networkOpen: true, networkInSelection: network });
  };

  handleBackupPrivateKeyClose = () => {
    this.setState({
      backupPrivateKeyOpen: false,
    })
  };

  handleDappLinkClicked = (url) => {
    window.open(url, "_blank")
  };

  showImportPrivateKey = () => {
    this.setState({ importPrivateKeyOpen: true });
  };

  handleImportPrivateKeyClose = () => {
    this.setState({ importPrivateKeyOpen: false });
  };

  showImportMnemonic = () => {
    this.setState({ importMnemonicOpen: true });
  };

  handleImportMnemonicClose = () => {
    this.setState({ importMnemonicOpen: false });
  };

  handleAccountsOpen = (event) => {
    this.setState({ accountsOpen: true });
    this.setState({ anchorEl: event.currentTarget  });
  };

  handleAccountsClose = async (value) => {
    this.setState({ accountsOpen: false });
    this.setState({ anchorEl: null });

    // set activeAccounts
    let accounts = this.state.accounts;
    let passwordHash = this.state.passwordHash
    if(accounts && passwordHash)
    {

      let activeAccount = null;
      for(var i=0;i<this.state.accounts.length;i++)
      {
        if(this.state.accounts[i].account === value)
        {
          activeAccount = this.state.accounts[i];
        }
      }
      if(!activeAccount)
      {
        activeAccount = this.state.accounts[0];
      }

      if(activeAccount)
      {
        this.setState({activeAccount});

        await this.setActiveAccountFromBackgroundPage(activeAccount); // set background

        let privateKey = (AES.decrypt(activeAccount.account,passwordHash)).toString(CryptoJS.enc.Utf8);
          await this.setActivePrivateKeyFromBackgroundPage(privateKey);
          const network = this.getNetwork();
          const wallet = await network.fromWIF(privateKey);
          let address = wallet.address;
          try{

            this.setState({
              address,
              privateKey: privateKey,
              accounts: this.state.accounts
            }, () => {
              this.loadActiveAccount();
            });

          } catch(e) {
            console.log(e);
          }

      }

    }

  };

  handleAccountsCloseImport = () => {
    this.setState({ accountsOpen: false });
    this.setState({ anchorEl: null });
    this.setState({ importOpen: true });
  };

  showDapps = () => {
    this.setState({ showDappsOpen: true });
  };

  showHome= () => {
    this.setState({ importOpen: false });
    this.setState({ showDappsOpen: false });
  };

  handleResetWalletOpen = () => {
    this.setState({ resetWalletOpen: true });
  };

  handleResetWalletClose = () => {
    this.setState({ resetWalletOpen: false });
  };

  getAddressAbv = (address) => {
    if (address) {
      return address.substr(0, 5) + '...' + address.substr(address.length-4, 4);
    } else {
      return '';
    }
  };

  getTxAbv = (tx) => {
    if (tx) {
      return tx.substr(0, 5) + '...' + tx.substr(tx.length - 4, 4);
    } else {
      return 'pending...';
    }
  };

  renderNetwork() {
    return (
      <Dialog
        aria-labelledby="switch-network-title"
        open={this.state.networkOpen}
        onClose={this.handleNetworkClose}
        TransitionComponent={Transition} >
        <div>

          <DialogTitle id="switch-network-title">Switch network</DialogTitle>
          <DialogContent>
            <div>
              <span className="red">Warning: switching network will remove imported accounts!</span>
            </div>
            <RadioGroup
              ref={ref => {
                this.radioGroupRef = ref;
              }}
              aria-label="Network"
              name="network"
              value={this.state.networkInSelection}
              onChange={this.handleChange('networkInSelection')}
            >
              <FormControlLabel value='MAINNET' key='MAINNET' control={<Radio />} label='Mainnet' />
              <FormControlLabel value='TESTNET' key='TESTNET' control={<Radio />} label='Testnet' />
            </RadioGroup>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleNetworkClose} color="primary">
              Cancel
            </Button>
            <Button variant="outlined" onClick={this.changeNetwork} color="secondary">
              Ok
            </Button>
          </DialogActions>
        </div>
      </Dialog>
    )
  }

  renderResetWallet() {
    return (
      <Dialog
        aria-labelledby="switch-network-title"
        open={this.state.resetWalletOpen}
        onClose={this.handleResetWalletClose}
        TransitionComponent={Transition} >
        <div>

          <DialogTitle id="switch-network-title">Reset wallet?</DialogTitle>
          <DialogContent>
            <div>
              <span className="red">Warning: Reset wallet will remove imported accounts!</span>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleResetWalletClose} color="primary">
              Cancel
            </Button>
            <Button variant="outlined" onClick={this.resetAppHashPassword} color="secondary">
              Reset
            </Button>
          </DialogActions>
        </div>
      </Dialog>
    )
  }

  renderSend() {
    if (!this.state.account) {
      return null;
    }

    return (
      <Dialog
          fullScreen
          open={this.state.sendOpen}
          onClose={this.handleSendClose}
          TransitionComponent={Transition} >
          <AppBar position="static" className="appBar">
            <Toolbar>
              <Tooltip title="Close">
                <IconButton color="inherit" onClick={this.handleSendClose} aria-label="Close">
                  <CloseIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="title" color="inherit">
                Send
              </Typography>
            </Toolbar>
          </AppBar>
          <div>
          <Card className="card send-card">
            <TextField
              required
              label="To"
              className="send-to"
              value={this.state.sendTo}
              onChange={this.handleChange('sendTo')}
              margin="normal" />
            <TextField
              required
              label="Amount"
              className="send-amount"
              value={this.state.sendAmount}
              onChange={(ev) => this.setSendAmount(ev.target.value) }
              margin="normal"
              type="number"
              placeholder="0.00" />
            <TextField
              required
              label="Fee Rate"
              className="send-amount"
              value={this.state.sendFeeRate}
              onChange={(ev) => this.setFeeRate(ev.target.value) }
              margin="normal"
              type="number"
              placeholder="1000" />
            <Button
              id="send-token-button"
              className="send-token-button"
              variant="raised"
              color="secondary"
              disabled={!this.isSendValid() }
              onClick={this.sendToken}>
              Send <Send className="send-button-icon"/>
            </Button>
          </Card>
        </div>
      </Dialog>
    )
  }

  renderReceive() {
    if (!this.state.account) {
      return null;
    }
    if (!this.state.qrcode) {
      this.loadQRCode();
    }

    return (
      <Dialog
          fullScreen
          open={this.state.receiveOpen}
          onClose={this.handleReceiveClose}
          TransitionComponent={Transition} >
          <AppBar position="static" className="appBar">
            <Toolbar>
              <Tooltip title="Close">
                <IconButton color="inherit" onClick={this.handleReceiveClose} aria-label="Close">
                  <CloseIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="title" color="inherit">
                Receive
              </Typography>
            </Toolbar>
          </AppBar>
          <div>
          <Card className="card account-details-card">
            <Typography variant="title">
              Send to this address
            </Typography>
            {
              this.state.qrcode && <img src={this.state.qrcode} style={{ width: '50%' }} alt="account address" className="m-1" />
            }
            <div className="account-details-address">
              <div className="address">{this.state.address}
              <CopyToClipboard text={this.state.address} onCopy={() => this.handleCopyToClipBoard()}>
                  <IconButton>
                    <FileCopyIcon />
                  </IconButton>
              </CopyToClipboard>
              </div>
            </div>
          </Card>
        </div>
      </Dialog>
    )
  }

  renderShowKey() {
    if (!this.state.privateKey) {
      return null;
    }

    let privateKey = this.state.privateKey;


    return (
      <Dialog
          fullScreen
          open={this.state.keyOpen}
          onClose={this.handleKeyClose}
          TransitionComponent={Transition} >
          <AppBar position="static" className="appBar">
            <Toolbar>
              <Tooltip title="Close">
                <IconButton color="inherit" onClick={this.handleKeyClose} aria-label="Close">
                  <CloseIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="title" color="inherit">
                Keys
              </Typography>
            </Toolbar>
          </AppBar>
          <div>
          <Card className="card">

            <div className="balance">Private Key
              <CopyToClipboard text={privateKey} onCopy={() => this.handleCopyToClipBoard()}>
                  <IconButton>
                    <FileCopyIcon />
                  </IconButton>
              </CopyToClipboard>
            </div>
            <div className="address">{privateKey}</div>

          </Card>
        </div>
      </Dialog>
    )
  }

  renderSendReceiveButtons() {
    if (!this.state.account) {
      return null;
    }

    return (
      <div className="buttons-container">
        <Button variant="raised" color="secondary" onClick={this.showReceive}>
          Receive <AttachMoney className="receive-button-icon"/>
        </Button>
        <Button variant="raised" color="secondary" onClick={this.showSend}>
          Send <Send className="send-button-icon"/>
        </Button>
      </div>
    )
  }

   renderBackupPrivateKey() {
    let mnemonic = this.state.mnemonic;
    return (
      <Dialog
          open={this.state.backupPrivateKeyOpen}
          TransitionComponent={Transition}
          keepMounted
          aria-labelledby="alert-dialog-slide-title"
          aria-describedby="alert-dialog-slide-description" >
        <DialogTitle id="alert-dialog-slide-title">
          Backup mnemonic
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            <span className="private-key-warrning">Please write down your mnemonic , in case you need to restore account later</span>
            <br/>
            <br/>
            <span className="private-key">{mnemonic}</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleBackupPrivateKeyClose} color="primary">
            I have written down the Mnemonic
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  renderTransactions() {
    const { transactions, account } = this.state;
    if (typeof transactions === 'undefined' || typeof account === 'undefined') {
      return null;
    }
    return (
      <Card className="card transactions-card">
        <Typography variant="title">
          Transactions
        </Typography>
          {this.renderTransactionsTable()}
      </Card>
    )
  }

   renderTransactionsTable() {
    const { transactions } = this.state;
    if (!transactions || transactions.length === 0) {
      return (
        <p>No transactions found!</p>
      );
    }

    return (
      <div>
      <Table className="transactions-table">
        <TableHead>
          <TableRow>
            <TableCell className="transactions-time-hash">Time/Hash</TableCell>
            <TableCell className="transactions-addresses">To</TableCell>
            <TableCell className="transactions-amount" numeric>Amount</TableCell>
            <TableCell className="transactions-token">Token</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map(transaction => {
            let amount = transaction.vout[0].value;
            let to = '';
            if (transaction.vout[0].scriptPubKey) {
              if (transaction.vout[0].scriptPubKey.addresses) {
                if (transaction.vout[0].scriptPubKey.addresses.length>0) {
                  to = transaction.vout[0].scriptPubKey.addresses[0];
                }
              }
            }
            let txurl = this.getExplorerTx() + transaction.txid;
            return (
              <TableRow key={transaction.txid}>
                <TableCell className="transactions-time-hash" component="th" scope="row">
                  {moment(transaction.time * 1000).format('MMMM Do, h:mm:ss a')}
                  <br/><br/>
                  <a href={txurl} className="tx-link" target="_blank">{this.getTxAbv(transaction.txid)}</a>
                </TableCell>
                <TableCell className="transactions-addresses">
                  {this.getAddressAbv(to)}
                </TableCell>
                <TableCell className="transactions-amount" numeric>{amount}</TableCell>
                <TableCell className="transactions-token">QTUM</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="view-transactions-on-button">
        <Button size="small" color="secondary" onClick={this.goToExplorerAddress}>
          View transactions
        </Button>
      </div>
      </div>
    )
  }

  handleSnackbardClose = () => {
    this.setState({ snackbarOpen: false });
  };

  renderSnackbar() {
    return(
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        open={this.state.snackbarOpen}
        autoHideDuration={6000}
        onClose={this.handleSnackbardClose}
        ContentProps={{
          'aria-describedby': 'message-id',
        }}
        message={<span id="message-id">{this.state.snackbarMessage}</span>}
        action={[
          <IconButton
            key="close"
            aria-label="Close"
            color="inherit"
            onClick={this.handleSnackbardClose}
          >
            <CloseIcon />
          </IconButton>,
        ]}
      >
      </Snackbar>
    )
  }


  renderWallet() {
    return (
      <div className="cards">
        {this.renderDashboard()}
        {this.renderSendReceiveButtons()}
        {this.renderTransactions()}

        {this.renderReceive()}
        {this.renderSend()}
        {this.renderShowKey()}
        {this.renderBackupPrivateKey()}
      </div>
    )
  }

  renderCreateWallet() {
    return (
      <div className="cards">
        <Card className="card sign-in-card">

          <div className="logo-container">
                <Tooltip title="QC Wallet">
                  <img src={logo} alt="QC Wallet" className="token-logo-lg" />
                </Tooltip>
          </div>
          <div className="space"></div>

          <Typography variant="title">
            {this.state.walletLabel}
          </Typography>
          <TextField
            label="Password"
            className="private-key-field"
            type = "password"
            autoComplete="off"
            value={this.state.createAppHashPassword}
            onChange={this.handleChange('createAppHashPassword')}
            helperText="Your password"
            margin="normal" />
          <Button
            className="sign-in-button button"
            color="secondary"
            variant="raised"
            onClick={this.createAppHashPassword}>
            {this.state.walletLabel} <AccountBalanceWallet className="account-details-button-icon"/>
          </Button>
          {this.state.walletInitialised && <Button
            className="reset-button button"
            color="primary"
            size="small"
            onClick={this.handleResetWalletOpen}>Reset Wallet
          </Button>
           }
        </Card>
      </div>
    )
  }

  renderDapps() {
    let dappData = this.state.dapps;
    return (
          <div className="cards">
          <Card className="card sign-in-card">
            <div className='grid-root'>
             { dappData &&
              <GridList cellHeight={150} className='grid-list'>

                <GridListTile key="Subheader" cols={2} style={{ height: 'auto' }}>
                  <ListSubheader component="div">Explore dapps on QTUM</ListSubheader>
                </GridListTile>

                {dappData.map(dapp => (
                  <GridListTile key={dapp.image} style={{ backgroundColor : dapp.backgroundColor}}>
                    <img src={dapp.image} alt={dapp.name} className='grid-image'  />
                    <GridListTileBar
                      title={dapp.name}
                      subtitle={<span>{dapp.desc}</span>}
                      actionIcon={
                           <IconButton onClick={() => { this.handleDappLinkClicked(dapp.url) }} color='contrast'>
                            <LinkIcon className='grid-icon' />
                          </IconButton>
                      }
                    />
                  </GridListTile>

                ))}
                </GridList>
              }
            </div>

           </Card>
      </div>

    )
  }

  renderImportOrCreate() {
    return (

      <div className="cards">
        <Card className="card sign-in-card">

          <div className="logo-container">
                <Tooltip title="QC Wallet">
                  <img src={logo} alt="QC Wallet" className="token-logo-lg" />
                </Tooltip>
          </div>
          <div className="space"></div>
          <Typography variant="title">
            Import By
          </Typography>
          <div className="space"></div>
          <Grid container spacing={24}>
            <Grid item xs={6}>
              <Button
                className="sign-in-button button"
                color="secondary"
                variant="raised"
                onClick={this.showImportPrivateKey}>
                Private Key <VpnKey className="account-details-button-icon"/>
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                className="sign-in-button button"
                color="secondary"
                variant="raised"
                onClick={this.showImportMnemonic}>
               Mnemonic <SpeakerNotes className="account-details-button-icon"/>
              </Button>
            </Grid>
          </Grid>

        </Card>
        <Card className="card sign-in-card">
          <Typography variant="title">
            Create account
          </Typography>
          <TextField
            label="Password"
            className="private-key-field"
            type = "password"
            autoComplete="off"
            value={this.state.createAccountPassword}
            onChange={this.handleChange('createAccountPassword')}
            helperText="Remember your password"
            margin="normal" />
          <Button
            className="sign-in-button button"
            color="secondary"
            variant="raised"
            onClick={this.createAccount}>
            Create account <AccountBalanceWallet className="account-details-button-icon"/>
          </Button>
        </Card>
      </div>
    )
  }

  renderImportByPrivateKey(){

    return (
      <Dialog
        fullScreen
        aria-labelledby="switch-network-title"
        open={this.state.importPrivateKeyOpen}
        onClose={this.handleImportyPrivateKeyClose}
        TransitionComponent={Transition} >
        <AppBar position="static" className="appBar">
          <Toolbar>
            <Tooltip title="Close">
              <IconButton color="inherit" onClick={this.handleImportPrivateKeyClose} aria-label="Close">
                <CloseIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="title" color="inherit">
             Import by Private Key
            </Typography>
          </Toolbar>
        </AppBar>
      <div className="cards">
        <Card className="card sign-in-card">

          <Typography variant="title">
            Sign in
          </Typography>
          <p className="token-power-description">You can sign in with <b>Private Key</b></p>
          <TextField
            label="Private key"
            className="private-key-field"
            type = "password"
            autoComplete="off"
            value={this.state.importPrivateKey}
            onChange={this.handleChange('importPrivateKey')}
            helperText="We do not store your private key."
            margin="normal" />
          <Button
            className="sign-in-button button"
            color="secondary"
            variant="raised"
            disabled={!this.isPrivateKeyValid()}
            onClick={this.importPrivateKey}>
            Import <LockOpen className="account-details-button-icon"/>
          </Button>
        </Card>
      </div>
      </Dialog>
    )
  }

  renderImportByMnemonic(){
    return (
      <Dialog
        fullScreen
        aria-labelledby="switch-network-title"
        open={this.state.importMnemonicOpen}
        onClose={this.handleImportMnemonicClose}
        TransitionComponent={Transition} >
        <AppBar position="static" className="appBar">
          <Toolbar>
            <Tooltip title="Close">
              <IconButton color="inherit" onClick={this.handleImportMnemonicClose} aria-label="Close">
                <CloseIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="title" color="inherit">
              Sign in by Mnemonic
            </Typography>
          </Toolbar>
        </AppBar>
      <div className="cards">
        <Card className="card sign-in-card">

          <Typography variant="title">
            Sign in
          </Typography>
          <p className="token-power-description">Restore from <b>Mnemonic</b></p>
          <TextField
            label="Mnemonic"
            className="private-key-field"
            autoComplete="off"
            multiLine={true}
            value={this.state.importMnemonic}
            onChange={this.handleChange('importMnemonic')}
            helperText=""
            margin="normal" />
          <TextField
            label="Password"
            className="private-key-field"
            type = "password"
            autoComplete="off"
            value={this.state.importMnemonicPassword}
            onChange={this.handleChange('importMnemonicPassword')}
            helperText="Your password"
            margin="normal" />
          <Button
            className="sign-in-button button"
            color="secondary"
            variant="raised"
            disabled={!this.isMnemonicValid()}
            onClick={this.importMnemonic}>
            Import <SpeakerNotes className="account-details-button-icon"/>
          </Button>
        </Card>
      </div>
      </Dialog>
    )
  }

  renderMainScreen(){
     if (this.state.passwordHash) {
      if (this.state.sendToContractPopupOpen) {
        return this.renderSendToContractPopup();
      }
      if(this.state.importOpen)
      {
        return this.renderImportOrCreate();

      }else{
        if(this.state.showDappsOpen)
        {
          return this.renderDapps();
        }else{

          if(this.state.privateKey)
          {
            return this.renderWallet();
          }
        }
      }

    }else{
      return this.renderCreateWallet();
    }
  }

  signOut = () => {
    this.clear();
  };

  confirmSendToContract = async () => {
    const { serialNumber } = this.state;
    const network = this.getNetwork();
    const wallet = await network.fromWIF(this.state.privateKey);
    const contractAddress = this.state.sendToContractDataContractAddress;
    const encodedData = this.state.sendToContractDataContractData;
    const option = {
      amount: parseInt(this.state.sendToContractDataAmount, 10),
      gasLimit: this.state.sendToContractDataGasLimit,
      gasPrice: this.qtumToSatoshi(this.state.sendToContractDataGasPrice), // need to convert to Satoshi
      // feeRate: 0.01
    };
    const backgroundPage = window.chrome.extension.getBackgroundPage();
    try {
      const tx = await wallet.contractSend(contractAddress, encodedData, option);
      backgroundPage && backgroundPage.sendTransaction({
        serialNumber,
        data: {
          code: 'TX_SENT',
          message: 'User sent transaction',
          tx
        }
      });
    } catch(e) {
      backgroundPage && backgroundPage.sendTransaction({
        serialNumber,
        data: {
          code: 'TX_FAILED',
          error: e.message
        }
      });
    }
    window.close();
  };

  cancelTransaction = () => {
    const { serialNumber } = this.state;
    const backgroundPage = window.chrome.extension.getBackgroundPage();
    backgroundPage && backgroundPage.cancelTransaction({
      serialNumber,
      data: {
        code: 'USER_CANCEL',
        error: 'User cancelled transaction'
      }
    });
    window.close();
  };

  renderSendToContractPopup() {
    return (
      <Dialog
        fullScreen
        aria-labelledby="switch-network-title"
        open={this.state.sendToContractPopupOpen}>
        <AppBar position="static" className="appBar">
          <Toolbar>
            <Typography variant="title" color="inherit">
              Send To Contract
            </Typography>
          </Toolbar>
        </AppBar>
      <div className="confirmation-container">

        <TextField
          inputProps={{
            readOnly: true
          }}
          label=""
          className="confirmation-field"
          autoComplete="off"
          value={this.state.address}
          helperText=""
          margin="none" />
        <TextField
          inputProps={{
            readOnly: true
          }}
          label="Contract Address"
          className="confirmation-field"
          autoComplete="off"
          value={this.state.sendToContractDataContractAddress}
          helperText=""
          margin="normal" />
        <TextField
          inputProps={{
            readOnly: true
          }}
          label="Send to method"
          className="confirmation-field"
          autoComplete="off"
          value={this.state.sendToContractDataContractMethod}
          helperText=""
          margin="normal" />
        <TextField
          inputProps={{
            readOnly: true
          }}
          label="Send Data"
          className="confirmation-field"
          autoComplete="off"
          value={this.state.sendToContractDataContractData}
          margin="normal" />
        <TextField
          inputProps={{
            readOnly: true
          }}
          label="Send Amount (Satoshi)"
          className="confirmation-field"
          autoComplete="off"
          value={this.state.sendToContractDataAmount}
          helperText=""
          margin="normal" />
        <TextField
          label="Gas Limit"
          className="confirmation-field"
          autoComplete="off"
          value={this.state.sendToContractDataGasLimit}
          onChange={this.handleChange('sendToContractDataGasLimit')}
          helperText=""
          margin="normal" />
        <TextField
          label="Gas Price"
          className="confirmation-field"
          autoComplete="off"
          value={this.state.sendToContractDataGasPrice}
          onChange={this.handleChange('sendToContractDataGasPrice')}
          helperText=""
          margin="normal" />
        <Button
          className="confirmation-button button"
          color="secondary"
          variant="raised"
          onClick={this.confirmSendToContract}>
          Confirm
        </Button>
        <Button
          className="confirmation-button button"
          variant="raised"
          onClick={this.cancelTransaction}>
          Cancel
        </Button>
      </div>
      </Dialog>
    )
  }

  renderAppBar() {
    return (
      <AppBar position="sticky">
        <Toolbar>
          <div className="tool-bar">
            <div className="logo-container">
              <img src={logo} className="app-logo" alt="logo" />
              <Typography variant="title" color="inherit">
                QC Wallet
              </Typography>
            </div>
            <div>
              { this.state.network && this.state.passwordHash &&

                <Tooltip title="Home">
                  <IconButton color="inherit" onClick={this.showHome} aria-label="Home">
                     <Dashboard className="account-details-button-icon"/>
                  </IconButton>
                </Tooltip>
              }

              { this.state.dapps &&
               <Tooltip title="Explore Dapps">
                  <IconButton color="inherit" onClick={this.showDapps} aria-label="Explore Dapps">
                    <Explore className="account-details-button-icon"/>
                  </IconButton>
                </Tooltip>
              }

              { this.state.network &&

                <Tooltip title="Network">
                  <IconButton color="inherit" onClick={this.showNetwork} aria-label="Network">
                     <Wifi className="account-details-button-icon"/>
                  </IconButton>
                </Tooltip>
              }

              { this.state.passwordHash &&

                <Tooltip title="Sign out">
                  <IconButton color="inherit" onClick={this.signOut} aria-label="Sign out">
                    <Launch className="account-details-button-icon"/>
                  </IconButton>
                </Tooltip>
              }
            </div>
          </div>
        </Toolbar>
      </AppBar>
    )
  }

  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <div className="App">
          {this.renderAppBar()}
          {this.renderMainScreen()}

          {this.renderImportByPrivateKey()}
          {this.renderImportByMnemonic()}
          {this.renderNetwork()}
          {this.renderResetWallet()}
          {this.renderSnackbar()}
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
