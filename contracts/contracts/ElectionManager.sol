// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ElectionManager {
    struct Election {
        uint256 id;
        string title;
        bool active;
    }

    mapping(uint256 => Election) public elections;
    mapping(bytes32 => bool) public usedNullifiers;
    uint256 public electionCount;

    event ElectionCreated(uint256 indexed electionId, string title, uint256 timestamp);
    event VoteSubmitted(
        uint256 indexed electionId,
        bytes32 indexed candidateHash,
        bytes32 indexed nullifierHash,
        bytes32 receiptHash,
        address voter,
        uint256 timestamp
    );

    function createElection(string memory title) external {
        electionCount += 1;
        elections[electionCount] = Election({ id: electionCount, title: title, active: true });
        emit ElectionCreated(electionCount, title, block.timestamp);
    }

    function submitVote(
        uint256 electionId,
        string calldata candidateId,
        bytes32 nullifierHash,
        bytes32 receiptHash
    ) external {
        require(elections[electionId].active, "Election not active");
        require(!usedNullifiers[nullifierHash], "Nullifier already used");
        usedNullifiers[nullifierHash] = true;
        bytes32 candidateHash = keccak256(abi.encodePacked(candidateId));
        emit VoteSubmitted(electionId, candidateHash, nullifierHash, receiptHash, msg.sender, block.timestamp);
    }
}
