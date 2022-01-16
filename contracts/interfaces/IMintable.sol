//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMintable {
    function mint(address,uint256) external returns(bool);
}