const { expect } = require("chai");
const { ethers } = require("hardhat");
const rand_bigint = require('random-bigint');
const deploy_mutable_om = require("../scripts/deploy-mut.js")

const Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;

function rand_bigint_hex(n) {
    const x = rand_bigint(n*8);
    const data = x.toString(16);
    return "0".repeat(2*n - data.length) + data;
}

function rand_fr_hex() {
    const x = rand_bigint(256) % Q;
    const data = x.toString(16);
    return "0".repeat(64 - data.length) + data;
}

function rand_fr_hex_list(n) {
    let a = [];
    for (let i = 0; i < n; i++) {
        a.push(rand_fr_hex());
    }
    return a.join("");
}

process.env["MOCK_TX_VERIFIER"] = "true";
process.env["MOCK_TREE_VERIFIER"] = "true";

describe("Mutable Operator Manager", async function() {
    it("Should change initial relayer", async function () {
        const [deployer,, relayer1, relayer2] = await ethers.getSigners();

        const { operatorManager, MutableOperatorManager } = await deploy_mutable_om();

        const opUrl = await operatorManager.operatorURI();
        const opName = await operatorManager.operatorName();
        const op = await operatorManager.operator();
        console.log("Current operator: %s [%s  @ %s]", opName, op, opUrl);

        console.log("Changing current operator...");
        await operatorManager.connect(deployer).setOperator("REL-02", relayer2.address, "https://reserved.relayer.zkbob.com/");

        const opUrl2 = await operatorManager.operatorURI();
        const opName2 = await operatorManager.operatorName();
        const op2 = await operatorManager.operator();
        console.log("Current operator: %s [%s  @ %s]", opName2, op2, opUrl2);

    });

});
