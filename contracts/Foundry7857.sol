// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Foundry7857 — ERC-7857 inspired Model NFT registry
/// @notice Each token represents a fine-tuned AI model whose weights are stored
///         on 0G Storage. Holders have on-chain proof of ownership and control
///         license issuance & royalties.
/// @dev Deployment target: 0G Galileo testnet (chainId 16600).
contract Foundry7857 {
    // ------------------------------------------------------------------ events
    event ModelMinted(
        uint256 indexed tokenId,
        address indexed owner,
        bytes32 modelRootHash,
        bytes32 datasetRootHash,
        string category
    );
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event LicensePriceUpdated(uint256 indexed tokenId, uint256 priceWei);
    event LicenseIssued(
        uint256 indexed tokenId,
        address indexed buyer,
        uint64 expiresAt,
        bytes32 paymentTxRef
    );

    // ------------------------------------------------------------------- types
    struct Model {
        address owner;
        bytes32 modelRootHash;     // 0G Storage root for weights
        bytes32 datasetRootHash;   // 0G Storage root for training dataset
        string  baseModel;         // e.g. "llama-3-8b"
        string  category;          // e.g. "support", "code", "medical"
        uint256 licensePriceWei;   // per default tier
        uint64  mintedAt;
    }

    struct License {
        uint64 expiresAt;
        bytes32 paymentTxRef;
    }

    // --------------------------------------------------------------- storage
    uint256 public nextTokenId = 1;
    mapping(uint256 => Model) public models;
    mapping(uint256 => mapping(address => License)) public licenses;
    mapping(address => uint256) public balanceOf;

    string public constant name = "Foundry Fine-Tuned Model";
    string public constant symbol = "FNDRY";

    // --------------------------------------------------------------- errors
    error NotOwner();
    error UnknownToken();
    error InsufficientPayment();

    // --------------------------------------------------------------- minting
    /// @notice Mint a new model NFT. Called by the Foundry pipeline once a
    ///         fine-tune job completes and weights are uploaded to 0G Storage.
    function mint(
        address to,
        bytes32 modelRootHash,
        bytes32 datasetRootHash,
        string calldata baseModel,
        string calldata category,
        uint256 licensePriceWei
    ) external returns (uint256 tokenId) {
        tokenId = nextTokenId++;
        models[tokenId] = Model({
            owner: to,
            modelRootHash: modelRootHash,
            datasetRootHash: datasetRootHash,
            baseModel: baseModel,
            category: category,
            licensePriceWei: licensePriceWei,
            mintedAt: uint64(block.timestamp)
        });
        unchecked { balanceOf[to] += 1; }
        emit ModelMinted(tokenId, to, modelRootHash, datasetRootHash, category);
        emit Transfer(address(0), to, tokenId);
    }

    // -------------------------------------------------------------- transfer
    function transferFrom(address from, address to, uint256 tokenId) external {
        Model storage m = models[tokenId];
        if (m.owner == address(0)) revert UnknownToken();
        if (m.owner != msg.sender || m.owner != from) revert NotOwner();
        m.owner = to;
        unchecked { balanceOf[from] -= 1; balanceOf[to] += 1; }
        emit Transfer(from, to, tokenId);
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address o = models[tokenId].owner;
        if (o == address(0)) revert UnknownToken();
        return o;
    }

    // --------------------------------------------------------------- pricing
    function setLicensePrice(uint256 tokenId, uint256 priceWei) external {
        Model storage m = models[tokenId];
        if (m.owner != msg.sender) revert NotOwner();
        m.licensePriceWei = priceWei;
        emit LicensePriceUpdated(tokenId, priceWei);
    }

    // ------------------------------------------------------------- licensing
    /// @notice Buy or extend an inference license. ETH/0G is forwarded to
    ///         the model owner; expiry is extended from current time.
    function purchaseLicense(uint256 tokenId, uint64 durationSeconds)
        external payable returns (uint64 expiresAt)
    {
        Model memory m = models[tokenId];
        if (m.owner == address(0)) revert UnknownToken();
        if (msg.value < m.licensePriceWei) revert InsufficientPayment();

        // Forward 100% to the owner. Marketplace fee can be added later.
        (bool ok, ) = payable(m.owner).call{value: msg.value}("");
        require(ok, "payment failed");

        License storage lic = licenses[tokenId][msg.sender];
        uint64 baseTime = lic.expiresAt > uint64(block.timestamp)
            ? lic.expiresAt
            : uint64(block.timestamp);
        expiresAt = baseTime + durationSeconds;
        lic.expiresAt = expiresAt;
        lic.paymentTxRef = blockhash(block.number - 1);
        emit LicenseIssued(tokenId, msg.sender, expiresAt, lic.paymentTxRef);
    }

    function isLicensed(uint256 tokenId, address user) external view returns (bool) {
        return licenses[tokenId][user].expiresAt > block.timestamp;
    }
}
