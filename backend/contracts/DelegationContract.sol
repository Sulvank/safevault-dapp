// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import "@openzeppelin/contracts/access/Ownable.sol";

contract DelegationContract {
    address public vault;
    uint256 public received;

    modifier onlyVault() {
        require(msg.sender == vault, "Not authorized");
        _;
    }
    
    event FundsReceived(address indexed sender, uint256 amount);
    event FundsWithdrawn(address indexed vault, uint256 amount);

    constructor(address _vault) {
        require(_vault != address(0), "Vault address cannot be zero");
        vault = _vault;
    }

    receive() external payable {
        received += msg.value;
        emit FundsReceived(msg.sender, msg.value);
    }

    function withdrawToVault() external onlyVault {
        uint256 balance = address(this).balance;
        (bool success, ) = vault.call{value: balance}("");
        require(success, "Transfer failed");
        emit FundsWithdrawn(vault, balance);
    }
}