// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SimpleStorage {
    uint256 private storedData;
    address public owner;
    
    event DataStored(uint256 data);
    
    constructor(uint256 _initialValue) {
        storedData = _initialValue;
        owner = msg.sender;
    }
    
    function set(uint256 x) public {
        require(msg.sender == owner, "Only owner can set data");
        storedData = x;
        emit DataStored(x);
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }
    
    function getOwner() public view returns (address) {
        return owner;
    }
    
    function transferOwnership(address newOwner) public {
        require(msg.sender == owner, "Only owner can transfer ownership");
        owner = newOwner;
    }
    
    function deposit() public payable {
        // This function can receive ETH
    }
    
    function withdraw(uint256 amount) public {
        require(msg.sender == owner, "Only owner can withdraw");
        require(address(this).balance >= amount, "Insufficient balance");
        payable(owner).transfer(amount);
    }
    
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
