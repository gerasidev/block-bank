// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ThyseasRWA
 * @dev Tokenizes physical assets like Robots, Chips, and Real Estate.
 * Tokens are minted after manual verification by the Thyseas team.
 */
contract ThyseasRWA is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    enum AssetType {
        HARDWARE,
        REAL_ESTATE,
        OTHER
    }

    struct AssetDetails {
        string name;
        uint256 valuationUSD; // Determined by manual evaluation
        AssetType assetType;
        bool isVerified;
        string location; // For Real Estate or factory location
    }

    mapping(uint256 => AssetDetails) public assets;

    constructor()
        ERC721("Thyseas Real World Assets", "THY-RWA")
        Ownable(msg.sender)
    {}

    /**
     * @dev Mint a new RWA token after manual appraisal.
     * @param to The recipient (owner of the asset)
     * @param uri Metadata URI (photos, legal docs, serials)
     * @param name Name of the asset
     * @param valUSD Appraised value in USD
     * @param aType Type of asset (0:Hardware, 1:Real Estate, 2:Other)
     * @param loc Location/Serial identifier
     */
    function mintAsset(
        address to,
        string memory uri,
        string memory name,
        uint256 valUSD,
        AssetType aType,
        string memory loc
    ) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);

        assets[tokenId] = AssetDetails({
            name: name,
            valuationUSD: valUSD,
            assetType: aType,
            isVerified: true,
            location: loc
        });

        return tokenId;
    }

    function getAssetDetails(
        uint256 tokenId
    ) public view returns (AssetDetails memory) {
        return assets[tokenId];
    }
}
