// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./SafeToken.sol";
import "./DelegationContract.sol";


contract Vault is Ownable {
    SafeToken public safeToken;
    DelegationContract public delegation;
    uint256 public maxUserBalance;
    mapping(address => uint256) public deposited;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Delegated(uint256 amount);

    constructor(address _tokenAddress, uint256 _maxUserBalance, address _owner) Ownable(_owner) {
        require(_owner != address(0), "Owner address cannot be zero");
        safeToken = SafeToken(_tokenAddress);
        maxUserBalance = _maxUserBalance;
    }

    receive() external payable {
        deposit();
    }

    function setDelegationContract(address _delegation) external onlyOwner {
    require(_delegation != address(0), "Delegation address cannot be zero");
    delegation = DelegationContract(payable(_delegation));
}

    function deposit() public payable {
        require(msg.value > 0, "Must deposit positive amount");
        require(
            deposited[msg.sender] + msg.value <= maxUserBalance,
            "Exceeds max user balance"
        );

        deposited[msg.sender] += msg.value;
        safeToken.mint(msg.sender, msg.value);

        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(deposited[msg.sender] >= amount, "Insufficient balance");

        deposited[msg.sender] -= amount;
        safeToken.burn(msg.sender, amount);

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdraw(msg.sender, amount);
    }

    function delegateFunds(uint256 amount) external onlyOwner {
        require(address(delegation) != address(0), "Delegation not set");
        require(address(this).balance >= amount, "Not enough balance");

        (bool success, ) = address(delegation).call{value: amount}("");
        require(success, "Delegation failed");

        emit Delegated(amount);
    }

    function updateMaxUserBalance(uint256 newLimit) external onlyOwner {
        maxUserBalance = newLimit;
    }
}