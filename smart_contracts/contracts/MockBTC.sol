// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockBTC is ERC20 {
    constructor() ERC20("Bitcoin", "BTC") {
        _mint(msg.sender, 21000000 * 10 ** decimals());
        console.log("MockBTC Deployed");
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
        console.log("Minted %s MockBTC to %s", amount, to);
    }
}
