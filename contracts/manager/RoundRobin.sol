//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IOperatorManagerRR.sol";

import "hardhat/console.sol";

contract RoundRobin is IOperatorManagerRR, Ownable {

    uint32 constant BLOCKS_PER_SLOT = 100;
    uint32 constant DELTA_BLOCKS_INITIAL_SLOT = 500;

    // First block where the first slot begins
    uint public genesisBlock;

    // Current slot size
    uint32 public blocksInSlot;

    bool public isMaintenance;

    // Holds the operator (relayer) details
    // 'endpoint' is the relayer's URL
    // 'enabled' flag is indicating relayer readiness to operate
    struct Operator {
    	bool initialized;
    	string name;
    	string endpoint;
    	uint32 claimSlot; //the last slot index where operator has been claimed
    }

    // Registered relayers info
    mapping(address => Operator) public operatorDetails;

    // variable size array of all operators (including disabled)
    address[] operators;

    // Last claimed operator
    address lastClaimed;

    constructor() {
        blocksInSlot = BLOCKS_PER_SLOT;
        genesisBlock = getBlockNumber() + DELTA_BLOCKS_INITIAL_SLOT;
        isMaintenance = false;
        lastClaimed = address(0);

        console.log("[RR]: contract has been created by %s", owner());
    }


    // --------========< Claim Routine >========--------
    //  * Relayers declare they are ready to interact
    //    with the Pool contract
    //	* The claimed relayer is considered to be ready
    //    up to the next slot inclusively
    //  * The last claimed relayer will use as fallback

    function claim() external override {
    	require(!isMaintenance, "Operator manager is under maintenance");
    	require(operatorDetails[msg.sender].initialized, "You are not certified to be a relayer");

    	uint32 playSlot = currentSlot() + 1;

    	operatorDetails[msg.sender].claimSlot = playSlot;

        lastClaimed = msg.sender;

        console.log("[RR]: %s has been claimed for the slot %d", operatorDetails[msg.sender].name, playSlot);
    }


    // --------========< Protocol Methods >========--------

    function is_operator() external view override returns(bool) {
        return (operator() == address(0) || operator() == tx.origin);
    }

    function operator() public view override returns(address) {
    	require(!isMaintenance, "Operator manager is under maintenance");
        require(operators.length > 0, "There are no certified relayers");

        // [TEST-ONLY] uncomment 'require' statement in production
        //require(block.number >= genesisBlock, "The auction has not started yet");
        if (block.number < genesisBlock) {
            return address(0);
        }

        uint32 curSlot = currentSlot();

        uint32 startIdx = (curSlot - 1) % uint32(operators.length);
        uint32 curIdx = startIdx;
        bool operatorNotFound = false;
        while (operatorDetails[operators[curIdx]].claimSlot < curSlot) {
            curIdx = (curIdx + 1) % uint32(operators.length);
            if (curIdx == startIdx) {
                // we have enumerate all of available operators
                // but no claimed operators were found
                operatorNotFound = true;

                break;
            }
        }

        if (operatorNotFound) {
            // [TEST-ONLY] uncomment 'require' statement in production
            //require(operatorDetails[lastClaimed].initialized, "There are no active relayers");
            //console.log("[RR]: select last claimed relayer %s", lastClaimed);
            return lastClaimed;
        }

        //console.log("[RR]: using operator %s (idx=%d) for the slot %d", operatorDetails[operators[curIdx]].name, curIdx, curSlot);
        return operators[curIdx];
    }

    function operatorURI() external view override returns(string memory) {
    	require(!isMaintenance, "Operator manager is under maintenance");

        address curOperator = operator();
        require(curOperator != address(0), "No assigned relayer at that time");

        return operatorDetails[curOperator].endpoint;
    }

    function operatorName() external view override returns(string memory) {
        address curOperator = operator();
        require(curOperator != address(0), "No assigned relayer at that time");

        return operatorDetails[curOperator].name;
    }


    function slotSize() external view override returns(uint32) {
    	return blocksInSlot;
    }

    // --------========< Maintenance Routines >========--------
    //
    //  * only the contract owner can invoke this functions

    function setMaintenance(bool maintenance) external onlyOwner {
    	isMaintenance = maintenance;
    }

    function addOperator(string memory name, address addr, string memory endpoint) external onlyOwner {
    	require(isMaintenance, "Not in a maintenance mode");
    	require(!operatorDetails[addr].initialized, "Operator already exist");

    	operators.push(addr);

		operatorDetails[addr].initialized = true;
    	operatorDetails[addr].name = name;
    	operatorDetails[addr].endpoint = endpoint;
    	operatorDetails[addr].claimSlot = 0;
    }

    function removeOperator(address addr) external onlyOwner {
    	require(isMaintenance, "Not in a maintenance mode");
    	require(operators.length > 0 && operatorDetails[addr].initialized, "Operator does not exist");

		operatorDetails[addr].initialized = false;	

    	for (uint i=0; i<operators.length; i++) {
            if (operators[i] == addr) {
            	if (operators.length > 1) {
            		operators[i] = operators[operators.length - 1];
            		operators.pop();
            		break;
            	}
            }
        }
    }

    function setSlotSize(uint32 blocks) external onlyOwner {
        require(isMaintenance, "Not in a maintenance mode");
        require (blocks > 0, "Slot size must be greater than zero");

        blocksInSlot = blocks;
    }

    // --------========< Helper Routines >========--------

    function block2slot(uint numBlock) public view returns (uint32) {
        if (numBlock < genesisBlock) return 0;
        return uint32(((numBlock - genesisBlock) / (blocksInSlot)) + 1);
    }

    function currentSlot() public view returns (uint32) {
        return block2slot(getBlockNumber());
    }

    function getBlockNumber() public view virtual returns (uint) {
        return block.number;
    }
}