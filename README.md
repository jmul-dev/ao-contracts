# AO Smart Contracts

## Setup

Install dependencies:

```
yarn
```

Start Ganache (on separate terminal windows):

```
yarn chain
```

Compile smart contracts:

```
yarn compile
```

Migrate smart contracts:

```
\\ Local testnet
yarn migrate:development

\\ Rinkeby
yarn migrate:rinkeby

\\ Mainnet
yarn migrate:mainnet
```

Run test:

```
yarn test
```
