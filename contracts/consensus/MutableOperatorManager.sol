//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IOperatorManager.sol";

import "hardhat/console.sol";

contract MutableOperatorManager is IOperatorManager, Ownable {
	address public operator;
	string public name;
    string public endpoint;

    constructor(string memory _name, address _addr, string memory _endpoint) {
    	name = _name;
        operator = _addr;
        endpoint = _endpoint;
    }

    function setOperator(string memory _name, address _addr, string memory _endpoint) external onlyOwner {
    	name = _name;
        operator = _addr;
        endpoint = _endpoint;
    }

    function operatorURI() external view returns(string memory) {
        return endpoint;
    }

    function operatorName() external view returns(string memory) {
        return name;
    }
}