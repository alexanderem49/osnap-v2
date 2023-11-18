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
    bool public isExecuted = true;

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
        isExecuted = false;

        ModuleData memory moduleData = ModuleData({
            modules: new Module[](1),
            args: new bytes[](1)
        });

        moduleData.modules[0] = Module.SINGLE_EXEC;
        moduleData.args[0] = _singleExecModuleArg();

        taskId = _createTask(
            address(this),
            abi.encode(this.actionStep2.selector),
            moduleData,
            NATIVE_ETH
        );
    }

    function actionStep2() external onlyDedicatedMsgSenderOrAutomate {
        require(checker(), "Action not executable");

        isExecuted = true;
        emit Success();
        gasBomb();

        (uint256 fee, address feeToken) = _getFeeDetails();
        _transfer(fee, feeToken);

        payable(payer).transfer(address(this).balance);
    }

    function checker() public view returns (bool) {
        return
            isExecuted ? false : block.timestamp >= actionTimestamp + 1 minutes;
    }
}
