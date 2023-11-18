// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import "./GelatoTaskFactory.sol";
import "./interfaces/uma/OptimisticOracleV3Interface.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./utils/Bytes.sol";
import "@openzeppelin/contracts/interfaces/IERC20Metadata.sol";

contract ActionRouter {
    struct Request {
        string snapshotProposalUrl;
        string[] options;
        uint256[] voteWeights;
        address bondToken;
        uint256 bondTokenAmount;
        uint256 liveness;
        bytes data;
        address gasPaymentToken;
        uint256 gasPaymentAmount;
        address submitter;
        address executor;
    }

    GelatoTaskFactory public immutable gelatoTaskFactory;
    OptimisticOracleV3Interface public immutable oov3;

    mapping(bytes32 => Request) public requests;

    error OptionsVoteWeightsLengthMismatch(
        string[] optionsPassed,
        uint256[] voteWeightsPassed
    );

    event SnapshotResultsVerificationRequest(
        bytes32 indexed requestId,
        string snapshotProposalUrl,
        string[] options,
        uint256[] voteWeights,
        bytes data
    );

    // Goerli: 0x9923D42eF695B5dd9911D05Ac944d4cAca3c4EAB
    constructor(address oov3Address) {
        gelatoTaskFactory = new GelatoTaskFactory();
        oov3 = OptimisticOracleV3Interface(oov3Address);
    }

    function postSnapshotResultsAndScheduleExec(
        string calldata snapshotProposalUrl,
        string[] calldata options,
        uint256[] calldata voteWeights,
        address bondToken,
        uint256 bondTokenAmount,
        uint256 liveness,
        address gasPaymentToken,
        uint256 gasPaymentAmount,
        bytes calldata data,
        address executor
    ) external {
        bytes32 requestId = keccak256(abi.encodePacked(snapshotProposalUrl));
        IERC20(bondToken).transferFrom(
            msg.sender,
            address(this),
            bondTokenAmount
        );

        requests[requestId] = Request({
            snapshotProposalUrl: snapshotProposalUrl,
            options: options,
            voteWeights: voteWeights,
            bondToken: bondToken,
            bondTokenAmount: bondTokenAmount,
            liveness: liveness,
            data: data,
            gasPaymentToken: gasPaymentToken,
            gasPaymentAmount: gasPaymentAmount,
            submitter: msg.sender,
            executor: executor
        });

        emit SnapshotResultsVerificationRequest(
            requestId,
            snapshotProposalUrl,
            options,
            voteWeights,
            data
        );

        IERC20(bondToken).approve(address(oov3), bondTokenAmount);

        oov3.assertTruth(
            bytes(
                formatClaim(
                    snapshotProposalUrl,
                    options,
                    voteWeights,
                    liveness,
                    data,
                    bondToken,
                    bondTokenAmount,
                    executor
                )
            ),
            address(this),
            address(0),
            address(0),
            uint64(liveness),
            IERC20(0x07865c6E87B9F70255377e024ace6630C1Eaa37F), //IERC20(bondToken),
            0, //bondTokenAmount,
            oov3.defaultIdentifier(),
            bytes32(0)
        );
    }

    function formatClaim(
        string calldata snapshotProposalUrl,
        string[] calldata options,
        uint256[] calldata voteWeights,
        uint256 liveness,
        bytes memory data,
        address bondToken,
        uint256 bondTokenAmount,
        address executor
    ) public view returns (string memory) {
        uint256 optionsLength = options.length;

        if (optionsLength != voteWeights.length) {
            revert OptionsVoteWeightsLengthMismatch(options, voteWeights);
        }

        string[] memory percentages = weightsToPercentages(voteWeights);

        bytes memory claim = abi.encodePacked(
            "Snapshot proposal is available at '",
            snapshotProposalUrl,
            "', is in 'Closed' state and has the following results for all options in the proposal: "
        );

        for (uint256 i = 0; i < (optionsLength - 1); i++) {
            claim = abi.encodePacked(
                claim,
                "'",
                options[i],
                "' scoring ",
                uintToDecimalString(voteWeights[i], 18),
                " (",
                percentages[i],
                "), "
            );
        }
        claim = abi.encodePacked(
            claim,
            "'",
            options[optionsLength - 1],
            "' scoring ",
            uintToDecimalString(voteWeights[optionsLength - 1], 18),
            " (",
            percentages[optionsLength - 1],
            "). "
        );

        if (data.length > 0) {
            claim = abi.encodePacked(
                claim,
                "The JSON object in the proposal body contains 'data' field which exacly matches the following value: '",
                Bytes.bytesToString(data),
                "'."
            );
        } else {
            claim = abi.encodePacked(
                claim,
                "The JSON object in the proposal body does not contain 'data' field, or exactly matches following value: '0x'."
            );
        }

        claim = abi.encodePacked(
            claim,
            " The JSON object in the proposal body contains 'executor' field which exacly matches following value: '",
            Strings.toHexString(executor),
            "'. This UMA query identifier is set to 'ASSERT_TRUTH', callback recepient and escalation manager set to zero address (0x0000000000000000000000000000000000000000), domain id set to bytes32(0) (0x0000000000000000000000000000000000000000000000000000000000000000), asserter set to '",
            Strings.toHexString(address(this)),
            "'. This UMA query has a liveness of ",
            Strings.toString(liveness),
            " seconds, is submitted on a blockchain with chain id ",
            Strings.toString(block.chainid),
            ", has a bond token with address ",
            Strings.toHexString(bondToken),
            " (symbol ",
            IERC20Metadata(bondToken).symbol(),
            ") and the bond token amount is ",
            uintToDecimalString(
                bondTokenAmount,
                IERC20Metadata(bondToken).decimals()
            ),
            " as declared in the JSON object of the proposal body in fields 'liveness', 'chainId', 'bondToken' and 'bondTokenAmount' respectively."
        );

        return string(claim);
    }

    function weightsToPercentages(
        uint256[] calldata weights
    ) public pure returns (string[] memory) {
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            totalWeight += weights[i];
        }

        string[] memory percentages = new string[](weights.length);
        for (uint256 i = 0; i < weights.length; i++) {
            percentages[i] = string(
                abi.encodePacked(
                    uintToDecimalString(
                        uint16((weights[i] * 10000) / totalWeight),
                        2
                    ),
                    "%"
                )
            );
        }

        return percentages;
    }

    function uintToDecimalString(
        uint256 value,
        uint8 decimals
    ) public pure returns (string memory) {
        uint256 integer = value / (10 ** decimals);
        uint256 remainder = value % (10 ** decimals);

        if (remainder < 10) {
            return
                string(
                    abi.encodePacked(
                        Strings.toString(integer),
                        ".0",
                        Strings.toString(remainder)
                    )
                );
        }

        return
            string(
                abi.encodePacked(
                    Strings.toString(integer),
                    ".",
                    Strings.toString(remainder)
                )
            );
    }
}
