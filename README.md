## pool-evm-single-l1

This repository contains the Pool and OperatorManager contracts which are used for the zkBob solution. The verifiers contracts are not presented here

### The pool contract

It's the main solution contract. It receives transactions from the operators (relayers), checks the proofs and updates the current contract state.

### The OperatorManager contract

This contract provide a current operator address which can interact with the Pool currently. It's derived from the IOperatorManager interface and should implement function  `operator()` function which returns the current relayer address.

There are several OperatorManager contracts implemented now:
 
 * `SimpleOperatorManager` is define a fixed operator without changing ability
 * `MutableOperatorManager` like a `SimpleOperatorManager` but the contract owner is able to change operator anytime
 * `BurnAuction` uses the aution within relayers to select a current operator. The relayer with the highest bid is considered the winnew. The winner will lose his bid
 * `RoundRobin` returns relayers one by one by a cycle. If operator does not claim his readiness the following one will be selected


### Testing contracts

We use Hardhat to test contracts. To prepare your environment:

```
git clone https://github.com/zkBob/pool-evm-single-l1
cd pool-evm-single-l1
npm install --save-dev hardhat
```
Now you can check all available tests:

```
npx hardhat test
```

or try with the single one:

```
npx hardhat test ./test/Pool.js
npx hardhat test ./test/Mutable.js
npx hardhat test ./test/Semaphore.js
npx hardhat test ./test/RoundRobin.js
```