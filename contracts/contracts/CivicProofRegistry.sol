// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CivicProofRegistry {
    mapping(bytes32 => bool) public registeredIdentities;
    mapping(bytes32 => bool) public usedNullifiers;

    event IdentityRegistered(bytes32 indexed identityCommitment, address indexed registrar, uint256 timestamp);
    event NullifierMarked(bytes32 indexed nullifierHash, uint256 timestamp);

    function registerIdentity(bytes32 identityCommitment) external {
        require(!registeredIdentities[identityCommitment], "Identity already registered");
        registeredIdentities[identityCommitment] = true;
        emit IdentityRegistered(identityCommitment, msg.sender, block.timestamp);
    }

    function isIdentityRegistered(bytes32 identityCommitment) external view returns (bool) {
        return registeredIdentities[identityCommitment];
    }

    function markNullifierUsed(bytes32 nullifierHash) external {
        require(!usedNullifiers[nullifierHash], "Nullifier already used");
        usedNullifiers[nullifierHash] = true;
        emit NullifierMarked(nullifierHash, block.timestamp);
    }

    function isNullifierUsed(bytes32 nullifierHash) external view returns (bool) {
        return usedNullifiers[nullifierHash];
    }
}
