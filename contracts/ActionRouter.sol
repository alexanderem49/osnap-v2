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

    function postSnapshotResultsAndSheduleExec(
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
    }

    function formatClaim(
        string calldata snapshotProposalUrl,
        string[] calldata options,
        uint256[] calldata voteWeights,
        uint256 liveness,
        bytes memory data,
        address bondToken,
        uint256 bondTokenAmount
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
                "The JSON object in the proposal body contains 'data' field which exacly matches following value: '",
                Bytes.bytesToString(data),
                "'."
            );
        } else {
            claim = abi.encodePacked(
                claim,
                "The JSON object in the proposal body does not contain 'data' field, or exactly matches following value: '0x'."
            );
        }

        // TODO: 
        claim = abi.encodePacked(
            claim,
            " This UMA query identifier is set to 'ASSERT_TRUTH', callback recepient and escalationManager set to zero address, domainId set to bytes32(0), asserter is ",
            Strings.toHexString(address(this)),
            ". This UMA query has a liveness of ",
            Strings.toString(liveness),
            " seconds, is submitted on a blockchain with chainId ",
            Strings.toString(block.chainid),
            ", has a bond token with address ",
            Strings.toHexString(bondToken),
            " (symbol ",
            IERC20Metadata(bondToken).symbol(),
            ") and the bond token amount was ",
            uintToDecimalString(
                bondTokenAmount,
                IERC20Metadata(bondToken).decimals()
            ),
            " as declared in the JSON object in fields 'liveness', 'chainId', 'bondToken' and 'bondTokenAmount' respectively."
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