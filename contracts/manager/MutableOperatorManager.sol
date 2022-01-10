//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IOperatorManager.sol";

import "hardhat/console.sol";

contract MutableOperatorManager is IOperatorManager, Ownable {
	address public op;
    string public endpoint;

    constructor(address _addr, string memory _endpoint) {
        op = _addr;
        endpoint = _endpoint;
    }

    // --------========< Maintenance Routines >========--------

    function setOperator(address _addr, string memory _endpoint) external onlyOwner {
        op = _addr;
        endpoint = _endpoint;
    }

    // --------========< Protocol Methods >========--------

    function is_operator() external view override returns(bool) {
        return (op == address(0) || op == tx.origin);
    }

    function operator() external view override returns(address) {
        return op;
    }

    
    // --------========< Public Informational Routines >========--------

    // Get the current relayer's URI
    function operatorURI() external view returns(string memory) {
        return (op != address(0) ? endpoint : "");
    }
}