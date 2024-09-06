# Contracts setup

## Setup

**Install dependencies**

```
cd contracts
cp template.env .env
npm install
```

Modify .env and add your private key for relevant network  
`PRIVATE_KEY_LOCALHOST` for local node
`PRIVATE_KEY_GALADRIEL` for Galadriel testnet

Rest of this README assumes you are in the `contracts` directory

## Deployment

### Deploy chatGpt on Galadriel devnet

Update `.env`:

* Add your private key to `PRIVATE_KEY_GALADRIEL`

* Add the [oracle address](http://docs.galadriel.com/oracle-address) to `ORACLE_ADDRESS`

**Deploy chatGpt to Galadriel testnet**

```
npm run deployChatGpt
```

### Run callStartChat

```
npm run callStartChat
```

