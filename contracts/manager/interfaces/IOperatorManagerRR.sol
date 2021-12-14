//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./IOperatorManager.sol";

interface IOperatorManagerRR is IOperatorManager {
    // ---===< Get the current operator properties >===---
    //function is_operator() external view returns(bool);   // => Derived from the IOperator manager
    //function operator() external view returns(address);   // => Derived from the IOperator manager
    function operatorURI() external view returns(string memory);
    function operatorName() external view returns(string memory);

    // Operator should call this function periodically to declare
    // they are ready to interact with the Pool contract
    function claim() external;

    // Current slot size in blocks
    function slotSize() external view returns(uint32);
}
