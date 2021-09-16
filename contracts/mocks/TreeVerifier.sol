//SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;


contract TreeVerifierMock {
    function verifyProof(
        uint256[3] memory,
        uint256[8] memory
    ) external pure returns(bool){
        return true;
    }
}