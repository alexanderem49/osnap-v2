// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./gelato/AutomateTaskCreator.sol";

contract Test is AutomateTaskCreator {
    event Success();

    address public constant NATIVE_ETH =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    uint256 public actionTimestamp;
    bytes32 public taskId;
    address public payer;
    bool public isExecuted;

    // Network - goerli
    address public constant AUTOMATE =
        0xc1C6805B857Bef1f412519C4A842522431aFed39;

    constructor() AutomateTaskCreator(AUTOMATE, address(this)) {}

    modifier onlyDedicatedMsgSenderOrAutomate() {
        require(
            msg.sender == AUTOMATE || msg.sender == dedicatedMsgSender,
            "Only dedicated msg sender or automate"
        );
        _;
    }

    // Burns about 1M gas
    uint256 public gasBombCounter = 2000;

    function gasBomb() private {
        while (gasBombCounter > 0) {
            gasBombCounter--;
        }
    }

    receive() external payable {}

    function actionStep1() external payable {
        actionTimestamp = block.timestamp;
        payer = msg.sender;

        ModuleData memory moduleData = ModuleData({
            modules: new Module[](1),
            args: new bytes[](1)
        });

        moduleData.modules[0] = Module.RESOLVER;
        moduleData.args[0] = _resolverModuleArg(
            address(this),
            abi.encodeCall(this.checker, ())
        );

        taskId = _createTask(
            address(this),
            abi.encode(this.actionStep2.selector),
            moduleData,
            NATIVE_ETH
        );
    }

    function actionStep2() external onlyDedicatedMsgSenderOrAutomate {
        isExecuted = true;
        emit Success();
        gasBomb();

        _cancelTask(taskId);

        (uint256 fee, address feeToken) = _getFeeDetails();
        _transfer(fee, feeToken);

        payable(payer).transfer(address(this).balance);
    }

    function checker()
        external
        view
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = isExecuted
            ? false
            : block.timestamp >= actionTimestamp + 1 minutes;
        execPayload = abi.encodeWithSelector(this.actionStep2.selector);
    }
}
