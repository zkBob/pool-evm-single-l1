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

function test_tx_data(Pool) {
    const selector = Pool.interface.getSighash("transact");
    const sample_nullifier =  rand_fr_hex();
    const sample_out_commit = rand_fr_hex();
    const sample_transfer_index = "000000000000";
    const sample_enery_amount = "0000000000000000000000000000";
    const sample_token_amount = "0000000000000000";
    const sample_transact_proof = rand_fr_hex_list(8);
    const sample_root_after = rand_fr_hex();
    const sample_tree_proof = rand_fr_hex_list(8);
    const sample_tx_type = "0001"; // transaction
    const sample_memo_size = "0030"; // memo block size
    const sample_memo_fee = "0000000000000000"; // here is smart contract level metadata, only fee for 01 type
    const sample_memo_message = rand_bigint_hex(parseInt(sample_memo_size, 16)-sample_memo_fee.length/2); //here is encrypted tx metadata, used on client only

    return [
        selector, sample_nullifier, sample_out_commit, sample_transfer_index, sample_enery_amount, sample_token_amount, sample_transact_proof,
        sample_root_after, sample_tree_proof,
        sample_tx_type,
        sample_memo_size, sample_memo_fee, sample_memo_message
    ].join("");
}

process.env["MOCK_TX_VERIFIER"] = "true";
process.env["MOCK_TREE_VERIFIER"] = "true";

describe("Mutable Operator Manager", async function() {
    let pool;
    let Pool;
    let operatorManager;
    let MutableOperatorManager;

    let deployer, relayer1, relayer2, relayer3;

    beforeEach(async function() {
        [deployer,, relayer1, relayer2, relayer3] = await ethers.getSigners();

        var contracts = await deploy_mutable_om();
        pool = contracts.pool;
        Pool = contracts.pool_c;
        operatorManager = contracts.opMan;
        MutableOperatorManager = contracts.opMan_c;
    });

    it("Should change initial relayer", async function () {
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

    it("Should perform transactions from the valid relayers and revert from invalid", async function () {
        const opUrl = await operatorManager.operatorURI();
        const opName = await operatorManager.operatorName();
        const op = await operatorManager.operator();
        console.log("Current operator: %s [%s  @ %s]", opName, op, opUrl);

        console.log("Sending tx from the REL-1 (should be performed)...");
        await relayer1.sendTransaction({
                from: relayer1.address,
                to: pool.address,
                data: test_tx_data(Pool)
            });

        console.log("Sending tx from the REL-2 (should be reverted)...");
        await expect(
            relayer2.sendTransaction({
                from: relayer2.address,
                to: pool.address,
                data: test_tx_data(Pool)
            })
        ).to.be.reverted;

        console.log("Sending tx from the unapproved relayer (should be reverted)...");
        await expect(
            relayer3.sendTransaction({
                from: relayer3.address,
                to: pool.address,
                data: test_tx_data(Pool)
            })
        ).to.be.reverted;

        console.log("Changing current operator...");
        await operatorManager.connect(deployer).setOperator("REL-02", relayer2.address, "https://reserved.relayer.zkbob.com/");

        const opUrl2 = await operatorManager.operatorURI();
        const opName2 = await operatorManager.operatorName();
        const op2 = await operatorManager.operator();
        console.log("Current operator: %s [%s  @ %s]", opName2, op2, opUrl2);

        console.log("Sending tx from the REL-1 (should be reverted)...");
        await expect(
            relayer1.sendTransaction({
                from: relayer1.address,
                to: pool.address,
                data: test_tx_data(Pool)
            })
        ).to.be.reverted;

        console.log("Sending tx from the REL-2 (should be performed)...");
        await relayer2.sendTransaction({
            from: relayer2.address,
            to: pool.address,
            data: test_tx_data(Pool)
        })

        console.log("Sending tx from the unapproved relayer (should be reverted)...");
        await expect(
            relayer3.sendTransaction({
                from: relayer3.address,
                to: pool.address,
                data: test_tx_data(Pool)
            })
        ).to.be.reverted;

        console.log("Unlock the Pool for everyone...");
        await operatorManager.connect(deployer).setOperator("free", "0x0000000000000000000000000000000000000000", "");

        console.log("Sending tx from the REL-1 (should be performed)...");
        await relayer1.sendTransaction({
            from: relayer1.address,
            to: pool.address,
            data: test_tx_data(Pool)
        })

        console.log("Sending tx from the REL-2 (should be performed)...");
        await relayer2.sendTransaction({
            from: relayer2.address,
            to: pool.address,
            data: test_tx_data(Pool)
        })

        console.log("Sending tx from the unapproved relayer (should be performed)...");
        await relayer3.sendTransaction({
            from: relayer3.address,
            to: pool.address,
            data: test_tx_data(Pool)
        })
    });



});
