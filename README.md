# QC Wallet


![Wallet](https://github.com/QcoreProtocolOrg/qcwallet/blob/master/assets/walletdashboard.png "Chrom Extension")


# Install from local build

Clone the repo

```git clone https://github.com/QcoreProtocolOrg/qcwallet```

Add dependencies

```yarn```

Build the source to generate `/build` folder

```yarn build```

Install

Go to Chrome Extension, turn on developer mode, click `Load Unpacked`, select the `build` folder.


![Build from source](https://github.com/QcoreProtocolOrg/qcwallet/blob/master/assets/chromeextension.png "Chrom Extension")

# Security

User credentials are encrypted with SHA256 encrypted value of initial wallet password, and encrypted credentials are stored in Chrome localstorage that is only retrievable to unlocked wallet instance.
