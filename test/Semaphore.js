const { expect } = require("chai");
const { ethers } = require("hardhat");
const rand_bigint = require('random-bigint');
const deploy_semaphore = require("../scripts/deploy-sem.js")


process.env["MOCK_TX_VERIFIER"] = "true";
process.env["MOCK_TREE_VERIFIER"] = "true";

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("Semaphore Operator Manager", async function() {
    it("Should lock the Pool by the 2nd relayer", async function () {
        const [deployer,, relayer1, relayer2] = await ethers.getSigners();

        const { operatorManager, SemaphoreOperatorManager } = await deploy_semaphore();

        console.log("Relayer-1: ", relayer1.address);
        console.log("Relayer-2: ", relayer2.address);

        operatorManager.connect(deployer).addOperator(relayer1.address);
        operatorManager.connect(deployer).addOperator(relayer2.address);

        const op = await operatorManager.operator();
        console.log("Current operator: %s", op);

        console.log("Waiting while the Genesis free block ends...");

        await timeout(1500);

        console.log("Locking the operator...");
        await operatorManager.connect(relayer2).lockOperator();

        const op2 = await operatorManager.operator();
        console.log("Current operator: %s", op2);

    });

});
