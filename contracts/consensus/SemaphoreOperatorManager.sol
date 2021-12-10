//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IOperatorManagerRR.sol";

import "hardhat/console.sol";

contract SemaphoreOperatorManager is IOperatorManager, Ownable {
	// Approved operators:
    // true value in the mapping means
    // the operator has been approved
    mapping (address => bool) approvedOperators;

    // Allocatable slot size
    uint32 public slotSize;
    // Free slot size
    uint32 public freeSlotSize;

    // the last block when the one of approved
    // operator has become an active one
    uint lastSlotStartBlock;
    // The last active operator
    address lastActiveOperator;


    constructor(uint32 _slotSize, uint32 _freeSlotSize) {
    	slotSize = _slotSize;
        freeSlotSize = _freeSlotSize;

        lastSlotStartBlock = 0;
        lastActiveOperator = address(0);
    }

    // ---===< Common methods >===---
    //
    // These methods can be used by everyone

    function operator() external view override returns(address) {
        uint slotEnd = lastSlotStartBlock + slotSize;
        if (block.number > slotEnd) {
            return address(0);
        } else {
            return lastActiveOperator;
        }
    }

    function isLocked() external view returns(bool) {
        uint slotEnd = lastSlotStartBlock + slotSize;
        if (block.number > slotEnd) {
            return false;
        } else {
            return true;
        }
    }

    function blocksToFreeSlot() external view returns(uint32) {
        uint slotEnd = lastSlotStartBlock + slotSize;
        if (block.number > slotEnd) {
            return 0;
        } else {
            return uint32(slotEnd - block.number);
        }
    }

    function blocksToNextLockAbility() external view returns(uint32) {
        uint freeSlotEnd = lastSlotStartBlock + slotSize + freeSlotSize;
        if (block.number > freeSlotEnd) {
            return 0;
        } else {
            return uint32(freeSlotEnd - block.number);
        }
    }

    // ---===< Approved relayer methods >===---
    //
    // These methods are intended by relayers.
    // The approved relayers only are able to invoke them

    // Lock the slot from the current block (if available)
    // returns blocks count to the slot end
    function lockOperator() external returns(uint32) {
    	require(approvedOperators[msg.sender], "You should be an approved relayer to invoke it");

        uint slotEnd = lastSlotStartBlock + slotSize;
        uint freeSlotEnd = slotEnd + freeSlotSize; 
        require(block.number > slotEnd || lastActiveOperator == msg.sender, "Access to the Pool already locked");
        require(block.number > freeSlotEnd || block.number <= slotEnd , "Unable to lock during a mandatory free slot");


        if (block.number > freeSlotEnd) {
            // Set the new active operator
            lastSlotStartBlock = block.number;
            lastActiveOperator = msg.sender;

            return slotSize;
        } else {
            // returns remaining slots if an active relayer invoked this method
            return uint32(slotEnd - block.number);
        }
    }

    function amILocked() external view returns(bool) {
        require(approvedOperators[msg.sender], "You should be an approved relayer to invoke it");

        uint slotEnd = lastSlotStartBlock + slotSize;
        if (block.number <= slotEnd) {
            return true;
        } else {
            return false;
        }
    }

    // ---===< ARS maintenance methods >===---
    //
    // These methods are using by RelayerDispatcher
    // to configure the OperatorManager

    function addOperator(address addr) external onlyOwner {
        require(!approvedOperators[addr], "Operator already exist");

        approvedOperators[addr] = true;
    }

    function removeOperator(address addr) external onlyOwner {
        require(approvedOperators[addr], "Operator does not exist");

        approvedOperators[addr] = false;
    }

    function setSlotSize(uint32 blocks) external onlyOwner {
        require (blocks > 0, "Slot size must be greater than zero");

        slotSize = blocks;
    }

    function setFreeSlotSize(uint32 blocks) external onlyOwner {
        require (blocks > 0, "Free slot size must be greater than zero");

        freeSlotSize = blocks;
    }

    
}