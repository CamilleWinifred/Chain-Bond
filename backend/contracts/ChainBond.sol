// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ChainBond — Encrypted relationship scoring with FHEVM
/// @notice Implements Zama FHEVM patterns: external encrypted inputs, FHE.fromExternal, on-chain homomorphic ops, handle sharing via FHE.allow.
contract ChainBond is SepoliaConfig {
    struct EncryptedStats {
        euint32 sum;    // encrypted sum of scores
        euint32 count;  // encrypted count of scores
    }

    struct PublicStats {
        uint32 sum;
        uint32 count;
    }

    // user => friend => aggregates
    mapping(address => mapping(address => EncryptedStats)) private _pairStats;
    // user => friend => public aggregates (for optional public leaderboard/graphs)
    mapping(address => mapping(address => PublicStats)) private _pairPublic;

    // user => friend => last message/ipfs cid (optional)
    mapping(address => mapping(address => string)) private _pairLastCid;

    // Access control: whether friend can decrypt the pair stats (mutual consent model)
    // owner => friend => consent flag
    mapping(address => mapping(address => bool)) private _decryptConsent;

    event Rated(address indexed from, address indexed to, uint32 publicScore);
    event RatedWithCid(address indexed from, address indexed to, uint32 publicScore, string cid);
    event ConsentUpdated(address indexed owner, address indexed friend, bool allowed);

    /// @notice Internal rating logic shared by rate and rateWithCid.
    function _rate(
        address friend,
        externalEuint32 encryptedScore,
        bytes memory inputProof
    ) internal {
        require(friend != address(0), "Invalid friend");
        require(friend != msg.sender, "Self rating not allowed");

        euint32 score = FHE.fromExternal(encryptedScore, inputProof);

        EncryptedStats storage s = _pairStats[msg.sender][friend];

        s.sum = FHE.add(s.sum, score);
        s.count = FHE.add(s.count, FHE.asEuint32(1));

        // Share decrypt permissions: contract itself and the rater
        FHE.allowThis(s.sum);
        FHE.allowThis(s.count);
        FHE.allow(s.sum, msg.sender);
        FHE.allow(s.count, msg.sender);
        // Do NOT auto-share with friend by default (privacy-by-default).
        // If consent is enabled later, we will call FHE.allow for the friend.

        emit Rated(msg.sender, friend, 0);
    }

    /// @notice Rate a friend with an encrypted score (0..100). Updates encrypted sum/count and grants decrypt rights to both parties.
    function rate(
        address friend,
        externalEuint32 encryptedScore,
        bytes calldata inputProof
    ) external {
        _rate(friend, encryptedScore, inputProof);
    }

    /// @notice Rate with an IPFS CID and a clear public score for optional public stats.
    function rateWithCid(
        address friend,
        externalEuint32 encryptedScore,
        bytes calldata inputProof,
        string calldata cid,
        uint32 publicScore
    ) external {
        _rate(friend, encryptedScore, inputProof);
        _pairLastCid[msg.sender][friend] = cid;
        unchecked {
            PublicStats storage p = _pairPublic[msg.sender][friend];
            p.sum += publicScore;
            p.count += 1;
        }
        emit RatedWithCid(msg.sender, friend, publicScore, cid);
    }

    /// @notice Returns encrypted aggregates for a given pair (owner -> friend).
    function getPairStats(address owner, address friend)
        external
        view
        returns (euint32 sum, euint32 count)
    {
        EncryptedStats storage s = _pairStats[owner][friend];
        return (s.sum, s.count);
    }

    /// @notice Returns public clear aggregates for a pair (if used by UI).
    function getPairPublicStats(address owner, address friend)
        external
        view
        returns (uint32 sum, uint32 count)
    {
        PublicStats storage p = _pairPublic[owner][friend];
        return (p.sum, p.count);
    }

    /// @notice Last optional message/cid recorded for the pair.
    function getPairLastCid(address owner, address friend) external view returns (string memory) {
        return _pairLastCid[owner][friend];
    }

    /// @notice Owner sets whether `friend` can decrypt their pair stats using Relayer userDecrypt on returned handles.
    function setDecryptConsent(address friend, bool allowed) external {
        _decryptConsent[msg.sender][friend] = allowed;

        // If enabling consent now, grant friend decrypt permission on current handles
        if (allowed) {
            EncryptedStats storage s = _pairStats[msg.sender][friend];
            FHE.allow(s.sum, friend);
            FHE.allow(s.count, friend);
        }

        emit ConsentUpdated(msg.sender, friend, allowed);
    }

    /// @notice Returns if a friend is allowed to decrypt the owner's pair stats via front-end decryption.
    function getDecryptConsent(address owner, address friend) external view returns (bool) {
        return _decryptConsent[owner][friend];
    }
}


