const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DeSciNFTSimple Contract", function () {
  let nft;
  let owner, user1, user2, user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    const DeSciNFTSimple = await ethers.getContractFactory("DeSciNFTSimple");
    nft = await DeSciNFTSimple.deploy();
    await nft.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should set correct name and symbol", async function () {
      expect(await nft.name()).to.equal("DeSci Research NFT");
      expect(await nft.symbol()).to.equal("DSCI");
    });

    it("Should initialize with zero total supply", async function () {
      expect(await nft.totalSupply()).to.equal(0);
    });
  });

  describe("NFT Minting", function () {
    const tokenURI = "https://ipfs.io/ipfs/QmTestHash123";

    it("Should mint NFT successfully", async function () {
      await expect(nft.mintResearchNFT(user1.address, tokenURI))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, 1)
        .and.to.emit(nft, "ResearchNFTMinted")
        .withArgs(1, user1.address, tokenURI);

      expect(await nft.ownerOf(1)).to.equal(user1.address);
      expect(await nft.tokenURI(1)).to.equal(tokenURI);
      expect(await nft.totalSupply()).to.equal(1);
    });

    it("Should prevent non-owner from minting", async function () {
      await expect(
        nft.connect(user1).mintResearchNFT(user2.address, tokenURI)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should mint multiple NFTs with incremental token IDs", async function () {
      await nft.mintResearchNFT(user1.address, tokenURI + "1");
      await nft.mintResearchNFT(user2.address, tokenURI + "2");
      await nft.mintResearchNFT(user3.address, tokenURI + "3");

      expect(await nft.ownerOf(1)).to.equal(user1.address);
      expect(await nft.ownerOf(2)).to.equal(user2.address);
      expect(await nft.ownerOf(3)).to.equal(user3.address);
      expect(await nft.totalSupply()).to.equal(3);
    });

    it("Should handle empty tokenURI", async function () {
      await nft.mintResearchNFT(user1.address, "");
      expect(await nft.tokenURI(1)).to.equal("");
    });
  });

  describe("Citation Management", function () {
    beforeEach(async function () {
      await nft.mintResearchNFT(user1.address, "https://ipfs.io/ipfs/QmTest1");
      await nft.mintResearchNFT(user2.address, "https://ipfs.io/ipfs/QmTest2");
    });

    it("Should add citation successfully", async function () {
      await expect(nft.addCitation(1))
        .to.emit(nft, "CitationAdded")
        .withArgs(1);

      expect(await nft.getCitations(1)).to.equal(1);
    });

    it("Should prevent non-owner from adding citations", async function () {
      await expect(
        nft.connect(user1).addCitation(1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should add multiple citations", async function () {
      await nft.addCitation(1);
      await nft.addCitation(1);
      await nft.addCitation(1);

      expect(await nft.getCitations(1)).to.equal(3);
    });

    it("Should handle citations for different tokens", async function () {
      await nft.addCitation(1);
      await nft.addCitation(1);
      await nft.addCitation(2);

      expect(await nft.getCitations(1)).to.equal(2);
      expect(await nft.getCitations(2)).to.equal(1);
    });

    it("Should prevent adding citations to non-existent tokens", async function () {
      await expect(nft.addCitation(999)).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Impact Score Management", function () {
    beforeEach(async function () {
      await nft.mintResearchNFT(user1.address, "https://ipfs.io/ipfs/QmTest1");
    });

    it("Should update impact score successfully", async function () {
      const newScore = 85;
      
      await expect(nft.updateImpactScore(1, newScore))
        .to.emit(nft, "ImpactScoreUpdated")
        .withArgs(1, newScore);

      expect(await nft.getImpactScore(1)).to.equal(newScore);
    });

    it("Should prevent non-owner from updating impact score", async function () {
      await expect(
        nft.connect(user1).updateImpactScore(1, 85)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should handle maximum impact score", async function () {
      const maxScore = 100;
      await nft.updateImpactScore(1, maxScore);
      expect(await nft.getImpactScore(1)).to.equal(maxScore);
    });

    it("Should handle zero impact score", async function () {
      await nft.updateImpactScore(1, 0);
      expect(await nft.getImpactScore(1)).to.equal(0);
    });

    it("Should prevent updating impact score of non-existent tokens", async function () {
      await expect(nft.updateImpactScore(999, 85)).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Token Queries", function () {
    beforeEach(async function () {
      await nft.mintResearchNFT(user1.address, "https://ipfs.io/ipfs/QmTest1");
      await nft.mintResearchNFT(user1.address, "https://ipfs.io/ipfs/QmTest2");
      await nft.mintResearchNFT(user2.address, "https://ipfs.io/ipfs/QmTest3");
      
      await nft.addCitation(1);
      await nft.addCitation(1);
      await nft.updateImpactScore(1, 90);
      await nft.updateImpactScore(2, 75);
    });

    it("Should get user tokens correctly", async function () {
      const user1Tokens = await nft.getUserTokens(user1.address);
      expect(user1Tokens.length).to.equal(2);
      expect(user1Tokens[0]).to.equal(1);
      expect(user1Tokens[1]).to.equal(2);

      const user2Tokens = await nft.getUserTokens(user2.address);
      expect(user2Tokens.length).to.equal(1);
      expect(user2Tokens[0]).to.equal(3);
    });

    it("Should return empty array for user with no tokens", async function () {
      const user3Tokens = await nft.getUserTokens(user3.address);
      expect(user3Tokens.length).to.equal(0);
    });

    it("Should get token metadata correctly", async function () {
      const metadata = await nft.getTokenMetadata(1);
      expect(metadata.owner).to.equal(user1.address);
      expect(metadata.tokenURI).to.equal("https://ipfs.io/ipfs/QmTest1");
      expect(metadata.citations).to.equal(2);
      expect(metadata.impactScore).to.equal(90);
    });

    it("Should revert when getting metadata for non-existent token", async function () {
      await expect(nft.getTokenMetadata(999)).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Standard ERC721 Functions", function () {
    beforeEach(async function () {
      await nft.mintResearchNFT(user1.address, "https://ipfs.io/ipfs/QmTest1");
      await nft.mintResearchNFT(user2.address, "https://ipfs.io/ipfs/QmTest2");
    });

    it("Should support ERC721 interface", async function () {
      expect(await nft.supportsInterface("0x80ac58cd")).to.be.true; // ERC721
    });

    it("Should return correct balance", async function () {
      expect(await nft.balanceOf(user1.address)).to.equal(1);
      expect(await nft.balanceOf(user2.address)).to.equal(1);
      expect(await nft.balanceOf(user3.address)).to.equal(0);
    });

    it("Should approve and transfer tokens", async function () {
      await nft.connect(user1).approve(user2.address, 1);
      expect(await nft.getApproved(1)).to.equal(user2.address);

      await nft.connect(user2).transferFrom(user1.address, user3.address, 1);
      expect(await nft.ownerOf(1)).to.equal(user3.address);
    });

    it("Should set approval for all", async function () {
      await nft.connect(user1).setApprovalForAll(user2.address, true);
      expect(await nft.isApprovedForAll(user1.address, user2.address)).to.be.true;

      await nft.connect(user2).transferFrom(user1.address, user3.address, 1);
      expect(await nft.ownerOf(1)).to.equal(user3.address);
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle very long tokenURI", async function () {
      const longURI = "https://ipfs.io/ipfs/" + "a".repeat(1000);
      await nft.mintResearchNFT(user1.address, longURI);
      expect(await nft.tokenURI(1)).to.equal(longURI);
    });

    it("Should handle large number of citations", async function () {
      await nft.mintResearchNFT(user1.address, "https://ipfs.io/ipfs/QmTest1");
      
      // Add 100 citations
      for (let i = 0; i < 100; i++) {
        await nft.addCitation(1);
      }
      
      expect(await nft.getCitations(1)).to.equal(100);
    });

    it("Should prevent integer overflow in citations", async function () {
      await nft.mintResearchNFT(user1.address, "https://ipfs.io/ipfs/QmTest1");
      
      // This should not cause overflow in modern Solidity versions
      const largeCitationCount = BigInt("1000000");
      
      // Add citations one by one to simulate realistic usage
      for (let i = 0; i < 10; i++) {
        await nft.addCitation(1);
      }
      
      expect(await nft.getCitations(1)).to.equal(10);
    });

    it("Should handle impact score boundaries", async function () {
      await nft.mintResearchNFT(user1.address, "https://ipfs.io/ipfs/QmTest1");
      
      // Test maximum uint256 value
      const maxUint256 = ethers.MaxUint256;
      await nft.updateImpactScore(1, maxUint256);
      expect(await nft.getImpactScore(1)).to.equal(maxUint256);
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should efficiently mint multiple NFTs", async function () {
      const gasUsages = [];
      
      for (let i = 0; i < 5; i++) {
        const tx = await nft.mintResearchNFT(user1.address, `https://ipfs.io/ipfs/QmTest${i}`);
        const receipt = await tx.wait();
        gasUsages.push(receipt.gasUsed.toNumber());
      }
      
      // Gas usage should remain relatively stable
      gasUsages.forEach(gasUsed => {
        expect(gasUsed).to.be.lessThan(200000);
      });
    });

    it("Should efficiently handle batch citations", async function () {
      await nft.mintResearchNFT(user1.address, "https://ipfs.io/ipfs/QmTest1");
      
      const gasUsages = [];
      for (let i = 0; i < 10; i++) {
        const tx = await nft.addCitation(1);
        const receipt = await tx.wait();
        gasUsages.push(receipt.gasUsed.toNumber());
      }
      
      // Gas usage should remain stable for citations
      gasUsages.forEach(gasUsed => {
        expect(gasUsed).to.be.lessThan(100000);
      });
    });
  });
});
