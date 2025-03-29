// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SafeToken is ERC20, Ownable {
    address public vault;

    constructor(address initialOwner) ERC20("SafeToken", "SAFE") Ownable(initialOwner) {}

    modifier onlyVault() {
        require(msg.sender == vault, "Only vault can execute");
        _;
    }

    function setVault(address _vault) external onlyOwner {
        require(vault == address(0), "Vault already set");
        vault = _vault;
    }

    function mint(address to, uint256 amount) external onlyVault {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyVault {
        _burn(from, amount);
    }
}