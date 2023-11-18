// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./SnapshotAction.sol";

contract SnapshotERC20SendAction is SnapshotAction {
    address private constant oov3GoerliAddress =
        0x9923D42eF695B5dd9911D05Ac944d4cAca3c4EAB;
    address private constant gelatoAutomateGoerliAddress =
        0xc1C6805B857Bef1f412519C4A842522431aFed39;

    constructor()
        SnapshotAction(oov3GoerliAddress, gelatoAutomateGoerliAddress)
    {}

    function action() internal override {
        uint256[] memory weights = request.voteWeights;
        uint256 winningOption = 0;
        uint256 weightsLength = weights.length;
        uint256 winningOptionIndex = 0;

        for (uint256 i = 0; i < weightsLength; i++) {
            if (weights[i] > winningOption) {
                winningOption = weights[i];
                winningOptionIndex = i;
            }
        }

        (
            address tokenAddress,
            address receiver,
            address transferFrom,
            uint256[] memory tokenAmounts
        ) = abi.decode(request.data, (address, address, address, uint256[]));

        IERC20(tokenAddress).transferFrom(
            transferFrom,
            receiver,
            tokenAmounts[winningOptionIndex]
        );
    }

    function encodeActionData(
        address tokenAddress,
        address receiver,
        address transferFrom,
        uint256[] memory tokenAmounts
    ) public pure returns (bytes memory) {
        return abi.encode(tokenAddress, receiver, transferFrom, tokenAmounts);
    }
}
