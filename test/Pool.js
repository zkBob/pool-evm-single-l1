const { expect } = require("chai");
const { ethers } = require("hardhat");
const rand_bigint = require('random-bigint');
const deploy = require("../scripts/deploy");

const Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;

function rand_bigint_hex(n) {
    const x = rand_bigint(n * 8);
    const data = x.toString(16);
    return "0".repeat(2 * n - data.length) + data;
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

function packSignature(sign) {
    let r = ethers.BigNumber.from('0x' + sign.slice(2, 2 + 64));
    let s = ethers.BigNumber.from('0x' + sign.slice(2 + 64, 2 + 128));
    let v = ethers.BigNumber.from('0x' + sign.slice(2 + 128, 2 + 130));
    if (v.mod(2) === 0) {
        const vBit = ethers.BigNumber.from(2).pow(255);
        s = s.add(vBit);
    }
    return r.toHexString().slice(2) + s.toHexString().slice(2);
}

process.env["MOCK_TX_VERIFIER"] = "true";
process.env["MOCK_TREE_VERIFIER"] = "true";

describe("Pool", async function () {
    let relayer;
    let pool;
    let Pool;
    let token;
    let user;
    let denominator;

    beforeEach(async function () {
        [, , relayer, user] = await ethers.getSigners();
        const result = await deploy();
        pool = result.pool;
        Pool = result.Pool;
        token = result.token;
        denominator = result.denominator
    });

    it("Should perform transaction", async function () {
        // inputs sample data
        const selector = Pool.interface.getSighash("transact");
        const sample_nullifier = rand_fr_hex();
        const sample_out_commit = rand_fr_hex();
        const sample_transfer_index = "000000000000";
        const sample_enery_amount = "0000000000000000000000000000";
        const sample_token_amount = "0000000000000000";
        const sample_transact_proof = rand_fr_hex_list(8);
        const sample_root_after = rand_fr_hex();
        const sample_tree_proof = rand_fr_hex_list(8);
        const sample_tx_type = "0001"; // deposit
        const sample_memo_size = "0030"; // memo block size
        const sample_memo_fee = "0000000000000000"; // here is smart contract level metadata, only fee for 01 type
        const sample_memo_message = rand_bigint_hex(parseInt(sample_memo_size, 16) - sample_memo_fee.length / 2); //here is encrypted tx metadata, used on client only

        data = [
            selector, sample_nullifier, sample_out_commit, sample_transfer_index, sample_enery_amount, sample_token_amount, sample_transact_proof,
            sample_root_after, sample_tree_proof,
            sample_tx_type,
            sample_memo_size, sample_memo_fee, sample_memo_message
        ].join("");


        await relayer.sendTransaction({
            from: relayer.address,
            to: pool.address,
            data
        });
    });

    it("Should allow bridge deposit", async function () {
        const depositValue = 3;
        const denominatorNum = parseInt(denominator);
        await token.mint(user.address, depositValue * denominatorNum);
        await pool.onTokenBridged(token.address, depositValue * denominatorNum, user.address);
        expect(await pool.bridge_deposits(user.address)).to.eq(depositValue * denominatorNum);

        const selector = Pool.interface.getSighash("transact");
        const sample_nullifier = rand_fr_hex();
        const sample_out_commit = rand_fr_hex();
        const sample_transfer_index = "000000000000";
        const sample_enery_amount = "0000000000000000000000000000";
        const sample_token_amount = "0000000000000002";
        const sample_transact_proof = rand_fr_hex_list(8);
        const sample_root_after = rand_fr_hex();
        const sample_tree_proof = rand_fr_hex_list(8);
        const sample_tx_type = "0003"; // deposit bridged tokens
        const sample_memo_size = "0030"; // memo block size
        const sample_memo_fee = "0000000000000000"; // here is smart contract level metadata, only fee for 01 type
        const sample_memo_message = rand_bigint_hex(parseInt(sample_memo_size, 16) - sample_memo_fee.length / 2); //here is encrypted tx metadata, used on client only

        const sig = await user.signMessage(ethers.utils.arrayify('0x' + sample_nullifier));
        const sample_deposit_sig = packSignature(sig);

        data = [
            selector, sample_nullifier, sample_out_commit, sample_transfer_index, sample_enery_amount, sample_token_amount, sample_transact_proof,
            sample_root_after, sample_tree_proof,
            sample_tx_type,
            sample_memo_size, sample_memo_fee, sample_memo_message, sample_deposit_sig
        ].join("");


        // Deposit 2 bridged tokens
        await relayer.sendTransaction({
            from: relayer.address,
            to: pool.address,
            data
        });

        expect(await pool.bridge_deposits(user.address)).to.eq(1 * denominatorNum);
    });

});
