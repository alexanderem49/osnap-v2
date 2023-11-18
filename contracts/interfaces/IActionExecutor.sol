// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IActionExecutor {
    function execute(
        string calldata snapshotProposalUrl,
        string[] calldata options,
        uint256[] calldata voteWeights,
        bytes calldata data
    ) external;
}
