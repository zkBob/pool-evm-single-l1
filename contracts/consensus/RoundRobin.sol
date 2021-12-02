//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IOperatorManagerRR.sol";

import "hardhat/console.sol";

contract RoundRobin is IOperatorManagerRR, Ownable {

    uint32 constant BLOCKS_PER_SLOT = 100;
    uint32 constant DELTA_BLOCKS_INITIAL_SLOT = 0;

    // First block where the first slot begins
    uint public genesisBlock;

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
        genesisBlock = getBlockNumber() + DELTA_BLOCKS_INITIAL_SLOT;
        isMaintenance = false;
        lastClaimed = address(0);

        console.log("RoundRobin contract has been created by %s", owner());
    }


    // --------========< Claim Routine >========--------
    //  * Relayers declare they are ready to interact
    //    with the pool contract
    //	* The claimed relayer is considered to be ready
    //    up to the next slot inclusively
    //  * The last claimed relayer will use as fallback

    function claim() external override {
    	require(!isMaintenance, "Operator manager is under maintenance");
    	require(operatorDetails[msg.sender].initialized, "You are not certified to be a relayer");

    	uint32 playSlot = currentSlot() + 1;

    	operatorDetails[msg.sender].claimSlot = playSlot;
    }


    // --------========< Get the Current Relayer >========--------

    function operator() public view override returns(address) {
    	require(!isMaintenance, "Operator manager is under maintenance");
        require(operators.length > 0, "There are no certified relayers");

        uint32 curSlot = currentSlot();
        uint32 startIdx = curSlot % uint32(operators.length);
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
        	return lastClaimed;
        }

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

    function amIOperator() external view override returns(bool) {
    	address curOperator = operator();
        require(curOperator != address(0), "No assigned relayer at that time");

        return (curOperator == msg.sender);
    }

    function slotSize() external view override returns(uint32) {
    	return BLOCKS_PER_SLOT;
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


    // --------========< Helper Routines >========--------

    /**
     * @dev Calculate slot from block number
     * @param numBlock block number
     * @return slot number
     */
    function block2slot(uint numBlock) public view returns (uint32) {
        if (numBlock < genesisBlock) return 0;
        return uint32((numBlock - genesisBlock) / (BLOCKS_PER_SLOT));
    }

    /**
     * @dev Retrieve current slot
     * @return slot number
     */
    function currentSlot() public view returns (uint32) {
        return block2slot(getBlockNumber());
    }

    /**
     * @dev Retrieve block number. THIS FUNCTION IS USEFULL FOR DEBUGGING PURPOSES
     * @return current block number
     */
    function getBlockNumber() public view virtual returns (uint) {
        return block.number;
    }
}