// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DeSciNFTSimple is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;

    struct ResearchNFT {
        string title;
        string description;
        address researcher;
        uint256 createdAt;
        string researchType; // "paper", "dataset", "code", "review"
        uint256 citationCount;
        uint256 impactScore;
        bool isVerified;
    }

    mapping(uint256 => ResearchNFT) public researchNFTs;
    mapping(address => uint256[]) public researcherNFTs;
    mapping(string => uint256) public titleToTokenId;
    
    event ResearchNFTMinted(
        uint256 indexed tokenId,
        address indexed researcher,
        string title,
        string researchType
    );
    
    event CitationAdded(uint256 indexed tokenId, uint256 newCount);
    event ImpactScoreUpdated(uint256 indexed tokenId, uint256 newScore);
    event NFTVerified(uint256 indexed tokenId, bool verified);

    constructor() ERC721("DeSci Research NFT", "DSCI") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }

    /**
     * @dev Mint a new research NFT
     * @param to Address to mint the NFT to
     * @param title Title of the research
     * @param description Description of the research
     * @param uri URI for the token metadata
     * @param researchType Type of research
     */
    function mintResearchNFT(
        address to,
        string memory title,
        string memory description,
        string memory uri,
        string memory researchType
    ) external nonReentrant returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(titleToTokenId[title] == 0, "Research with this title already exists");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        researchNFTs[tokenId] = ResearchNFT({
            title: title,
            description: description,
            researcher: to,
            createdAt: block.timestamp,
            researchType: researchType,
            citationCount: 0,
            impactScore: 0,
            isVerified: false
        });

        titleToTokenId[title] = tokenId;
        researcherNFTs[to].push(tokenId);

        emit ResearchNFTMinted(tokenId, to, title, researchType);
        
        return tokenId;
    }

    /**
     * @dev Add a citation to increase citation count
     * @param tokenId Token ID to add citation to
     */
    function addCitation(uint256 tokenId) external {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        researchNFTs[tokenId].citationCount++;
        _updateImpactScore(tokenId);
        
        emit CitationAdded(tokenId, researchNFTs[tokenId].citationCount);
    }

    /**
     * @dev Update the impact score of a research NFT
     * @param tokenId Token ID to update
     */
    function _updateImpactScore(uint256 tokenId) internal {
        ResearchNFT storage research = researchNFTs[tokenId];
        research.impactScore = research.citationCount * 10;
        emit ImpactScoreUpdated(tokenId, research.impactScore);
    }

    /**
     * @dev Verify a research NFT
     * @param tokenId Token ID to verify
     * @param verified Verification status
     */
    function verifyResearch(uint256 tokenId, bool verified) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        researchNFTs[tokenId].isVerified = verified;
        emit NFTVerified(tokenId, verified);
    }

    /**
     * @dev Get research NFT details
     * @param tokenId Token ID
     * @return ResearchNFT struct
     */
    function getResearchNFT(uint256 tokenId) external view returns (ResearchNFT memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return researchNFTs[tokenId];
    }

    /**
     * @dev Get all NFTs owned by a researcher
     * @param researcher Address of the researcher
     * @return Array of token IDs
     */
    function getResearcherNFTs(address researcher) external view returns (uint256[] memory) {
        return researcherNFTs[researcher];
    }

    /**
     * @dev Get total number of minted NFTs
     * @return Total NFT count
     */
    function getTotalNFTs() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
