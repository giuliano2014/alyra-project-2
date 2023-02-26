# Alyra - Project #2

This repository contains the unit tests for a Voting smart contract implemented, using Solidity language.

## Table of Contents

- [Prerequis](#prerequis)
- [Installation](#installation)
- [Running the Tests](#running-the-tests)
- [License](#license)
- [Authors](#authors)

## Prerequis

Before using voting contract, you need to install the following dependencies:

- Node.js
- Truffle
- Ganache (or another local Ethereum client)

## Installation

Instructions on how to install the project and its dependencies.

1. Clone the repository to your local machine.

```sh
git clone git@github.com:giuliano2014/alyra-project-2.git
```

2. Navigate to the cloned repository directory using a command line interface.

```sh
cd alyra-project-2
```

3. Run the bellow command line to install the required dependencies.

```sh
npm install
```

## Running the tests

Tests are written using the Mocha framework and the OpenZeppelin Test Helpers tool.

Follow the steps below:

1. Launch local Ethereum client

```sh
ganache
```

2. Run the tests

```sh
truffle test
```

OR

```sh
npx hardhat test
```

3. Run test coverage

```sh
npx hardhat coverage
```

## License

This project is MIT licensed - See the [LICENSE](https://github.com/giuliano2014/alyra-project-2/blob/main/LICENSE) file for details.

## Authors

- [Giuliano Furgol](https://www.linkedin.com/in/giulianofurgol/) - Solidity Developer
