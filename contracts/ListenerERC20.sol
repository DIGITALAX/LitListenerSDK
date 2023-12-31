// SPDX-License-Identifier: UNLICENSE
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ListenerERC20 is ERC20 {
  uint constant _initial_supply = 20000 * (10 ** 18);

  constructor() ERC20("ListenerERC20", "LIST") {
    _mint(msg.sender, _initial_supply);
  }

  function mint(address to, uint256 amount) public {
    _mint(to, amount);
  }
}
