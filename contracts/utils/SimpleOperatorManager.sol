//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "../consensus/IOperatorManager.sol";

contract SimpleOperatorManager is IOperatorManager {
    address immutable public operator;

    constructor(address _operatpr) {
        operator = _operatpr;
    }
}