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
    if (v.mod(2).isZero()) {
        const vBit = ethers.BigNumber.from(2).pow(255);
        s = s.add(vBit);
    }
    return r.toHexString().slice(2) + s.toHexString().slice(2);
}

async function lastBlockTimestamp(signer) {
    const blockNumber = await signer.provider.getBlockNumber();
    return (await signer.provider.getBlock(blockNumber)).timestamp;
}

async function saltedPermitSignature(user, tokenAddress, poolAddress, value, nonce, deadline, salt) {
    const domain = {
        name: 'Token',
        version: '1',
        chainId: 1,
        verifyingContract: tokenAddress,
    };

    const types = {
        "Permit": [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
            { name: "salt", type: "bytes32" }
        ],
    };

    const data = {
        owner: user.address,
        spender: poolAddress,
        value,
        nonce,
        deadline,
        salt,
    };


    const sig = await user._signTypedData(domain, types, data);

    return packSignature(sig);
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
        const feeValue = 1;

        const denominatorNum = parseInt(denominator);
        await token.mint(pool.address, feeValue * denominatorNum);  // put some tokens to the Pool (fee for relayer)

        // inputs sample data
        const selector = Pool.interface.getSighash("transact");
        const sample_nullifier = rand_fr_hex();
        const sample_out_commit = rand_fr_hex();
        const sample_transfer_index = "000000000000";
        const sample_enery_amount = "0000000000000000000000000000";
        //const sample_token_amount = "0000000000000000";
        const sample_token_amount = "ffffffffffffffff";
        const sample_transact_proof = rand_fr_hex_list(8);
        const sample_root_after = rand_fr_hex();
        const sample_tree_proof = rand_fr_hex_list(8);
        const sample_tx_type = "0001"; // deposit
        const sample_memo_size = "0030"; // memo block size
        const sample_memo_fee = "0000000000000001";
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

        const relayerBalance = await token.balanceOf(relayer.address);
        expect(relayerBalance).to.eq(feeValue * denominator);
    });

    it("Should allow permittable token deposit", async function () {
        const depositValue = 3;
        const feeValue = 1;
        const denominatorNum = parseInt(denominator);
        await token.mint(user.address, (depositValue + feeValue) * denominatorNum);

        const selector = Pool.interface.getSighash("transact");
        const sample_nullifier = rand_fr_hex();
        const sample_out_commit = rand_fr_hex();
        const sample_transfer_index = "000000000000";
        const sample_enery_amount = "0000000000000000000000000000";
        const sample_token_amount = "0000000000000003";
        const sample_transact_proof = rand_fr_hex_list(8);
        const sample_root_after = rand_fr_hex();
        const sample_tree_proof = rand_fr_hex_list(8);
        const sample_tx_type = "0003"; // deposit permittable tokens
        const sample_memo_size = "0050"; // memo block size
        const sample_memo_fee = "0000000000000001";

        const deposit_deadline = (await lastBlockTimestamp(user)) + 60;
        const hex_deposit_deadline = ethers.utils.hexValue(deposit_deadline);
        const sample_permit_deposit_deadline = ethers.utils.hexConcat(ethers.utils.zeroPad(hex_deposit_deadline, 8)).slice(2);

        const sample_permit_holder = user.address.slice(2);
        const sample_memo_message = rand_bigint_hex(
            parseInt(sample_memo_size, 16)
            - sample_memo_fee.length / 2
            - sample_permit_deposit_deadline.length / 2
            - sample_permit_holder.length / 2
        ); //here is encrypted tx metadata, used on client only
        const sample_deposit_sig = await saltedPermitSignature(
            user,
            token.address,
            pool.address,
            (depositValue + feeValue) * denominatorNum,
            0,
            deposit_deadline,
            '0x' + sample_nullifier
        );

        data = [
            selector, sample_nullifier, sample_out_commit, sample_transfer_index, sample_enery_amount, sample_token_amount, sample_transact_proof,
            sample_root_after, sample_tree_proof,
            sample_tx_type,
            sample_memo_size, sample_memo_fee, sample_permit_deposit_deadline, sample_permit_holder,
            sample_memo_message, sample_deposit_sig
        ].join("");


        // Deposit 2 bridged tokens
        await relayer.sendTransaction({
            from: relayer.address,
            to: pool.address,
            data
        });

        const poolBalance = await token.balanceOf(pool.address);
        expect(poolBalance).to.eq(depositValue * denominator);

        const relayerBalance = await token.balanceOf(relayer.address);
        expect(relayerBalance).to.eq(feeValue * denominator);
    });
});
