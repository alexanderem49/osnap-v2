// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

library Bytes {
    bytes16 private constant HEX_DIGITS = "0123456789abcdef";

    error StringsInsufficientHexLength(uint256 value, uint256 length);

    function byteToString(uint8 value) internal pure returns (string memory) {
        uint256 localValue = value;
        bytes memory buffer = new bytes(4);
        for (uint256 i = 3; i > 1; --i) {
            buffer[i] = HEX_DIGITS[localValue & 0xf];
            localValue >>= 4;
        }
        if (localValue != 0) {
            revert StringsInsufficientHexLength(value, 2);
        }
        return string(buffer);
    }

    function bytesToString(
        bytes memory data
    ) internal pure returns (string memory) {
        string memory result = "0x";
        uint256 dataLength = data.length;
        for (uint256 i = 0; i < dataLength; i++) {
            result = string(
                abi.encodePacked(result, byteToString(uint8(data[i])))
            );
        }

        return result;
    }
}
