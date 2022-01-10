const { expect } = require("chai");
const { ethers } = require("hardhat");
const rand_bigint = require('random-bigint');
const deploy_roundrobin = require("../scripts/deploy-rr")

const Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;

process.env["MOCK_TX_VERIFIER"] = "true";
process.env["MOCK_TREE_VERIFIER"] = "true";


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchState(opMan) {
    const op = await opMan.operator();
    const slot = await opMan.currentSlot();
    const block = await opMan.getBlockNumber();

    return {
        op,
        slot,
        block,
    };
};


async function claimAfter(manager, relayer, delay) {
    await timeout(delay);
    manager.connect(relayer).claim();
}

async function claimPeriodic(manager, relayer, interval, count) {
    var i = 0;
    while (i < count) {
        await claimAfter(manager, relayer, interval);
        i++;
    }
}

describe("Round-Robin Operator Manager", async function() {
    it("Should deploy and check RoundRobin OperatorManager", async function () {

        const [,, relayer1, relayer2, relayer3] = await ethers.getSigners();

        const { operatorManager, RoundRobin } = await deploy_roundrobin();

        console.log("Relayer-1: ", relayer1.address);
        console.log("Relayer-2: ", relayer2.address);
        console.log("Relayer-3: ", relayer3.address);

        await operatorManager.setMaintenance(true);
        await operatorManager.addOperator("REL-01", relayer1.address, "https://my.super.relayer.com/")
        await operatorManager.addOperator("REL-02", relayer2.address, "https://not.bad.relayer.com/");
        await operatorManager.addOperator("REL-03", relayer3.address, "https://the.worst.relayer.com/");
        await operatorManager.setMaintenance(false);

        claimPeriodic(operatorManager, relayer1, 1000, 8);
        claimPeriodic(operatorManager, relayer2, 1000, 16);
        claimPeriodic(operatorManager, relayer3, 1000, 10);

        for (var i = 0; i < 32; i++) {
            //const [op, slot, block] = fetchState(operatorManager);
            const op = await operatorManager.operator();
            const slot = await operatorManager.currentSlot();
            const block = await operatorManager.getBlockNumber();

            console.log("Current operator: %s (slot = %d, bn = %d)", op, slot, block);
            await timeout(500);
        }
        
    });
});
