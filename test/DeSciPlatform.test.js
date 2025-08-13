const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DeSciPlatform Contract", function () {
  let platform;
  let userProfile, zkProof, nft, dataset;
  let owner, user1, user2, user3, verifier;

  beforeEach(async function () {
    [owner, user1, user2, user3, verifier] = await ethers.getSigners();
    
    // Deploy all contracts
    const UserProfile = await ethers.getContractFactory("UserProfile");
    userProfile = await UserProfile.deploy();
    await userProfile.waitForDeployment();

    const ZKProof = await ethers.getContractFactory("ZKProof");
    zkProof = await ZKProof.deploy();
    await zkProof.waitForDeployment();

    const DeSciNFTSimple = await ethers.getContractFactory("DeSciNFTSimple");
    nft = await DeSciNFTSimple.deploy();
    await nft.waitForDeployment();

    const Dataset = await ethers.getContractFactory("Dataset");
    dataset = await Dataset.deploy();
    await dataset.waitForDeployment();

    const DeSciPlatform = await ethers.getContractFactory("DeSciPlatform");
    platform = await DeSciPlatform.deploy(
      userProfile.address,
      zkProof.address,
      nft.address,
      dataset.address
    );
    await platform.waitForDeployment();

    // Setup initial state
    await zkProof.addVerifier(verifier.address);
    await userProfile.connect(user1).registerUser("alice@example.com", "Alice", "QmAliceHash");
    await userProfile.connect(user2).registerUser("bob@example.com", "Bob", "QmBobHash");
    await userProfile.verifyUser(user1.address);
    await userProfile.verifyUser(user2.address);
    await userProfile.updateReputation(user1.address, 100);
    await userProfile.updateReputation(user2.address, 80);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await platform.owner()).to.equal(owner.address);
    });

    it("Should set contract addresses correctly", async function () {
      expect(await platform.userProfileContract()).to.equal(userProfile.address);
      expect(await platform.zkProofContract()).to.equal(zkProof.address);
      expect(await platform.nftContract()).to.equal(nft.address);
      expect(await platform.datasetContract()).to.equal(dataset.address);
    });

    it("Should initialize with zero research papers", async function () {
      expect(await platform.totalPapers()).to.equal(0);
    });
  });

  describe("Research Publishing", function () {
    const title = "Quantum Computing Breakthrough";
    const abstract = "Revolutionary approach to quantum error correction";
    const ipfsHash = "QmResearchHash123";
    const datasetId = 1;
    const zkProofId = 1;

    beforeEach(async function () {
      // Setup dataset and ZK proof
      await dataset.connect(user1).registerDataset(
        "Research Dataset", "Supporting data", "QmDatasetHash", "0x1234", true, 0
      );
      await zkProof.connect(user1).submitProof(1, "0xproof", "0xinputs", "QmProofMeta");
      await zkProof.connect(verifier).verifyProof(1);
    });

    it("Should publish research successfully", async function () {
      await expect(
        platform.connect(user1).publishResearch(title, abstract, ipfsHash, datasetId, zkProofId)
      ).to.emit(platform, "ResearchPublished")
        .withArgs(1, user1.address, title);

      const paper = await platform.getResearchPaper(1);
      expect(paper.title).to.equal(title);
      expect(paper.abstract).to.equal(abstract);
      expect(paper.author).to.equal(user1.address);
      expect(paper.ipfsHash).to.equal(ipfsHash);
      expect(paper.datasetId).to.equal(datasetId);
      expect(paper.zkProofId).to.equal(zkProofId);
      expect(paper.isVerified).to.be.false;
      expect(paper.citationCount).to.equal(0);
    });

    it("Should prevent unverified users from publishing", async function () {
      await userProfile.connect(user3).registerUser("charlie@example.com", "Charlie", "QmCharlieHash");
      
      await expect(
        platform.connect(user3).publishResearch(title, abstract, ipfsHash, datasetId, zkProofId)
      ).to.be.revertedWith("User not verified");
    });

    it("Should prevent publishing with non-existent dataset", async function () {
      await expect(
        platform.connect(user1).publishResearch(title, abstract, ipfsHash, 999, zkProofId)
      ).to.be.revertedWith("Dataset does not exist");
    });

    it("Should prevent publishing with unverified ZK proof", async function () {
      await zkProof.connect(user1).submitProof(1, "0xproof2", "0xinputs2", "QmProofMeta2");
      
      await expect(
        platform.connect(user1).publishResearch(title, abstract, ipfsHash, datasetId, 2)
      ).to.be.revertedWith("ZK proof not verified");
    });

    it("Should mint NFT automatically upon publishing", async function () {
      await platform.connect(user1).publishResearch(title, abstract, ipfsHash, datasetId, zkProofId);
      
      expect(await nft.ownerOf(1)).to.equal(user1.address);
      expect(await nft.totalSupply()).to.equal(1);
    });

    it("Should increment total papers count", async function () {
      await platform.connect(user1).publishResearch(title, abstract, ipfsHash, datasetId, zkProofId);
      expect(await platform.totalPapers()).to.equal(1);

      await platform.connect(user2).publishResearch(title + "2", abstract, ipfsHash, datasetId, zkProofId);
      expect(await platform.totalPapers()).to.equal(2);
    });
  });

  describe("Peer Review", function () {
    const title = "Quantum Computing Breakthrough";
    const abstract = "Revolutionary approach to quantum error correction";
    const ipfsHash = "QmResearchHash123";
    const reviewContent = "Excellent work with minor suggestions";
    const rating = 8;

    beforeEach(async function () {
      // Setup and publish research
      await dataset.connect(user1).registerDataset(
        "Research Dataset", "Supporting data", "QmDatasetHash", "0x1234", true, 0
      );
      await zkProof.connect(user1).submitProof(1, "0xproof", "0xinputs", "QmProofMeta");
      await zkProof.connect(verifier).verifyProof(1);
      await platform.connect(user1).publishResearch(title, abstract, ipfsHash, 1, 1);
    });

    it("Should submit peer review successfully", async function () {
      await expect(
        platform.connect(user2).submitPeerReview(1, reviewContent, rating)
      ).to.emit(platform, "PeerReviewSubmitted")
        .withArgs(1, 1, user2.address, rating);

      const reviews = await platform.getPaperReviews(1);
      expect(reviews.length).to.equal(1);
      
      const review = await platform.getReview(1);
      expect(review.paperId).to.equal(1);
      expect(review.reviewer).to.equal(user2.address);
      expect(review.content).to.equal(reviewContent);
      expect(review.rating).to.equal(rating);
    });

    it("Should prevent authors from reviewing their own papers", async function () {
      await expect(
        platform.connect(user1).submitPeerReview(1, reviewContent, rating)
      ).to.be.revertedWith("Cannot review own paper");
    });

    it("Should prevent unverified users from reviewing", async function () {
      await userProfile.connect(user3).registerUser("charlie@example.com", "Charlie", "QmCharlieHash");
      
      await expect(
        platform.connect(user3).submitPeerReview(1, reviewContent, rating)
      ).to.be.revertedWith("User not verified");
    });

    it("Should prevent users with low reputation from reviewing", async function () {
      await userProfile.connect(user3).registerUser("charlie@example.com", "Charlie", "QmCharlieHash");
      await userProfile.verifyUser(user3.address);
      await userProfile.updateReputation(user3.address, 30); // Below minimum of 50
      
      await expect(
        platform.connect(user3).submitPeerReview(1, reviewContent, rating)
      ).to.be.revertedWith("Insufficient reputation");
    });

    it("Should prevent reviewing non-existent papers", async function () {
      await expect(
        platform.connect(user2).submitPeerReview(999, reviewContent, rating)
      ).to.be.revertedWith("Paper does not exist");
    });

    it("Should prevent duplicate reviews from same reviewer", async function () {
      await platform.connect(user2).submitPeerReview(1, reviewContent, rating);
      
      await expect(
        platform.connect(user2).submitPeerReview(1, "Another review", 9)
      ).to.be.revertedWith("Already reviewed this paper");
    });

    it("Should handle multiple reviews from different reviewers", async function () {
      await userProfile.connect(user3).registerUser("charlie@example.com", "Charlie", "QmCharlieHash");
      await userProfile.verifyUser(user3.address);
      await userProfile.updateReputation(user3.address, 70);

      await platform.connect(user2).submitPeerReview(1, "Review 1", 8);
      await platform.connect(user3).submitPeerReview(1, "Review 2", 9);

      const reviews = await platform.getPaperReviews(1);
      expect(reviews.length).to.equal(2);
    });

    it("Should update paper verification status after sufficient reviews", async function () {
      await userProfile.connect(user3).registerUser("charlie@example.com", "Charlie", "QmCharlieHash");
      await userProfile.verifyUser(user3.address);
      await userProfile.updateReputation(user3.address, 70);

      // Submit 3 reviews (minimum for verification)
      await platform.connect(user2).submitPeerReview(1, "Review 1", 8);
      await platform.connect(user3).submitPeerReview(1, "Review 2", 9);
      
      // Add another user for third review
      await userProfile.connect(owner).registerUser("david@example.com", "David", "QmDavidHash");
      await userProfile.verifyUser(owner.address);
      await userProfile.updateReputation(owner.address, 90);
      
      await expect(
        platform.connect(owner).submitPeerReview(1, "Review 3", 7)
      ).to.emit(platform, "PaperVerified")
        .withArgs(1);

      const paper = await platform.getResearchPaper(1);
      expect(paper.isVerified).to.be.true;
    });
  });

  describe("Citation Management", function () {
    beforeEach(async function () {
      // Setup and publish two research papers
      await dataset.connect(user1).registerDataset(
        "Dataset 1", "Data 1", "QmData1", "0x1111", true, 0
      );
      await dataset.connect(user2).registerDataset(
        "Dataset 2", "Data 2", "QmData2", "0x2222", true, 0
      );
      
      await zkProof.connect(user1).submitProof(1, "0xproof1", "0xinputs1", "QmMeta1");
      await zkProof.connect(user2).submitProof(1, "0xproof2", "0xinputs2", "QmMeta2");
      await zkProof.connect(verifier).verifyProof(1);
      await zkProof.connect(verifier).verifyProof(2);

      await platform.connect(user1).publishResearch("Paper 1", "Abstract 1", "QmPaper1", 1, 1);
      await platform.connect(user2).publishResearch("Paper 2", "Abstract 2", "QmPaper2", 2, 2);
    });

    it("Should add citation successfully", async function () {
      await expect(platform.addCitation(2, 1)) // Paper 2 cites Paper 1
        .to.emit(platform, "CitationAdded")
        .withArgs(2, 1);

      const paper1 = await platform.getResearchPaper(1);
      expect(paper1.citationCount).to.equal(1);
    });

    it("Should prevent non-owner from adding citations", async function () {
      await expect(
        platform.connect(user1).addCitation(2, 1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent citing non-existent papers", async function () {
      await expect(platform.addCitation(1, 999)).to.be.revertedWith("Cited paper does not exist");
      await expect(platform.addCitation(999, 1)).to.be.revertedWith("Citing paper does not exist");
    });

    it("Should prevent self-citation", async function () {
      await expect(platform.addCitation(1, 1)).to.be.revertedWith("Cannot cite own paper");
    });

    it("Should update NFT citations when adding citations", async function () {
      await platform.addCitation(2, 1);
      
      expect(await nft.getCitations(1)).to.equal(1); // NFT token 1 corresponds to paper 1
    });
  });

  describe("Platform Statistics", function () {
    beforeEach(async function () {
      // Setup comprehensive test data
      await dataset.connect(user1).registerDataset("Dataset 1", "Data 1", "QmData1", "0x1111", true, 0);
      await zkProof.connect(user1).submitProof(1, "0xproof1", "0xinputs1", "QmMeta1");
      await zkProof.connect(verifier).verifyProof(1);
      await platform.connect(user1).publishResearch("Paper 1", "Abstract 1", "QmPaper1", 1, 1);
      await platform.connect(user2).submitPeerReview(1, "Great work", 9);
    });

    it("Should return correct platform statistics", async function () {
      const stats = await platform.getPlatformStats();
      
      expect(stats.totalUsers).to.equal(2); // user1 and user2 are verified
      expect(stats.totalPapers).to.equal(1);
      expect(stats.totalReviews).to.equal(1);
      expect(stats.totalDatasets).to.equal(1);
      expect(stats.totalProofs).to.equal(1);
      expect(stats.totalNFTs).to.equal(1);
    });

    it("Should update statistics as platform grows", async function () {
      // Add more data
      await userProfile.connect(user3).registerUser("charlie@example.com", "Charlie", "QmCharlieHash");
      await userProfile.verifyUser(user3.address);
      await userProfile.updateReputation(user3.address, 70);
      
      await dataset.connect(user2).registerDataset("Dataset 2", "Data 2", "QmData2", "0x2222", true, 0);
      await zkProof.connect(user2).submitProof(1, "0xproof2", "0xinputs2", "QmMeta2");
      await zkProof.connect(verifier).verifyProof(2);
      await platform.connect(user2).publishResearch("Paper 2", "Abstract 2", "QmPaper2", 2, 2);
      await platform.connect(user3).submitPeerReview(2, "Interesting", 8);

      const stats = await platform.getPlatformStats();
      expect(stats.totalUsers).to.equal(3);
      expect(stats.totalPapers).to.equal(2);
      expect(stats.totalReviews).to.equal(2);
      expect(stats.totalDatasets).to.equal(2);
      expect(stats.totalProofs).to.equal(2);
      expect(stats.totalNFTs).to.equal(2);
    });
  });

  describe("User Activity Queries", function () {
    beforeEach(async function () {
      // Setup test data
      await dataset.connect(user1).registerDataset("Dataset 1", "Data 1", "QmData1", "0x1111", true, 0);
      await zkProof.connect(user1).submitProof(1, "0xproof1", "0xinputs1", "QmMeta1");
      await zkProof.connect(verifier).verifyProof(1);
      await platform.connect(user1).publishResearch("Paper 1", "Abstract 1", "QmPaper1", 1, 1);
      await platform.connect(user2).submitPeerReview(1, "Great work", 9);
    });

    it("Should get user papers correctly", async function () {
      const user1Papers = await platform.getUserPapers(user1.address);
      expect(user1Papers.length).to.equal(1);
      expect(user1Papers[0]).to.equal(1);

      const user2Papers = await platform.getUserPapers(user2.address);
      expect(user2Papers.length).to.equal(0);
    });

    it("Should get user reviews correctly", async function () {
      const user2Reviews = await platform.getUserReviews(user2.address);
      expect(user2Reviews.length).to.equal(1);
      expect(user2Reviews[0]).to.equal(1);

      const user1Reviews = await platform.getUserReviews(user1.address);
      expect(user1Reviews.length).to.equal(0);
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle empty research titles and abstracts", async function () {
      await dataset.connect(user1).registerDataset("Dataset", "Data", "QmData", "0x1111", true, 0);
      await zkProof.connect(user1).submitProof(1, "0xproof", "0xinputs", "QmMeta");
      await zkProof.connect(verifier).verifyProof(1);

      await platform.connect(user1).publishResearch("", "", "", 1, 1);
      
      const paper = await platform.getResearchPaper(1);
      expect(paper.title).to.equal("");
      expect(paper.abstract).to.equal("");
      expect(paper.ipfsHash).to.equal("");
    });
    it("Should handle maximum rating values in reviews", async function () {
      await dataset.connect(user1).registerDataset("Dataset", "Data", "QmData", "0x1111", true, 0);
      await zkProof.connect(user1).submitProof(1, "0xproof", "0xinputs", "QmMeta");
      await zkProof.connect(verifier).verifyProof(1);
      await platform.connect(user1).publishResearch("Paper", "Abstract", "QmPaper", 1, 1);
      
      const maxUint256 = ethers.MaxUint256;
      await platform.connect(user2).submitPeerReview(1, "Review", maxUint256);
      
      const review = await platform.getReview(1);
      expect(review.rating).to.equal(maxUint256);
    });
    it("Should prevent accessing non-existent papers and reviews", async function () {
      await expect(platform.getResearchPaper(999)).to.be.revertedWith("Paper does not exist");
      await expect(platform.getReview(999)).to.be.revertedWith("Review does not exist");
      await expect(platform.getPaperReviews(999)).to.be.revertedWith("Paper does not exist");
    });

    it("Should handle large numbers of papers and reviews", async function () {
      // Setup for batch operations
      await dataset.connect(user1).registerDataset("Dataset", "Data", "QmData", "0x1111", true, 0);
      await zkProof.connect(user1).submitProof(1, "0xproof", "0xinputs", "QmMeta");
      await zkProof.connect(verifier).verifyProof(1);

      // Publish multiple papers
      for (let i = 0; i < 3; i++) {
        await platform.connect(user1).publishResearch(`Paper ${i}`, `Abstract ${i}`, `QmPaper${i}`, 1, 1);
      }

      expect(await platform.totalPapers()).to.equal(3);
      
      const user1Papers = await platform.getUserPapers(user1.address);
      expect(user1Papers.length).to.equal(3);
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete research workflow", async function () {
      // 1. Register dataset
      await dataset.connect(user1).registerDataset(
        "Climate Data", "Temperature measurements", "QmClimateData", "0x1234", true, 0
      );
      
      // 2. Submit and verify ZK proof
      await zkProof.connect(user1).submitProof(1, "0xclimateproof", "0xclimateinputs", "QmClimateMeta");
      await zkProof.connect(verifier).verifyProof(1);
      
      // 3. Publish research
      await platform.connect(user1).publishResearch(
        "Climate Change Analysis", "Comprehensive study of temperature trends", "QmClimateResearch", 1, 1
      );
      
      // 4. Submit peer reviews
      await platform.connect(user2).submitPeerReview(1, "Excellent methodology", 9);
      
      // 5. Add citations
      await platform.addCitation(1, 1); // Self-citation should fail
      
      // 6. Verify final state
      const paper = await platform.getResearchPaper(1);
      expect(paper.title).to.equal("Climate Change Analysis");
      expect(paper.author).to.equal(user1.address);
      
      const reviews = await platform.getPaperReviews(1);
      expect(reviews.length).to.equal(1);
      
      const stats = await platform.getPlatformStats();
      expect(stats.totalPapers).to.equal(1);
      expect(stats.totalReviews).to.equal(1);
      expect(stats.totalNFTs).to.equal(1);
    });

    it("Should handle multi-user collaborative scenario", async function () {
      // Setup multiple users with different roles
      await userProfile.connect(user3).registerUser("charlie@example.com", "Charlie", "QmCharlieHash");
      await userProfile.verifyUser(user3.address);
      await userProfile.updateReputation(user3.address, 85);

      // Each user contributes different components
      await dataset.connect(user1).registerDataset("Dataset A", "Data A", "QmDataA", "0xAAAA", true, 0);
      await dataset.connect(user2).registerDataset("Dataset B", "Data B", "QmDataB", "0xBBBB", true, 0);
      
      await zkProof.connect(user1).submitProof(1, "0xproofA", "0xinputsA", "QmMetaA");
      await zkProof.connect(user2).submitProof(1, "0xproofB", "0xinputsB", "QmMetaB");
      await zkProof.connect(verifier).verifyProof(1);
      await zkProof.connect(verifier).verifyProof(2);

      // Publish research papers
      await platform.connect(user1).publishResearch("Research A", "Abstract A", "QmResearchA", 1, 1);
      await platform.connect(user2).publishResearch("Research B", "Abstract B", "QmResearchB", 2, 2);

      // Cross-review papers
      await platform.connect(user2).submitPeerReview(1, "Good work on A", 8);
      await platform.connect(user1).submitPeerReview(2, "Excellent work on B", 9);
      await platform.connect(user3).submitPeerReview(1, "Innovative approach", 9);
      await platform.connect(user3).submitPeerReview(2, "Solid methodology", 8);

      // Add cross-citations
      await platform.addCitation(2, 1); // Paper B cites Paper A

      // Verify collaborative ecosystem
      const stats = await platform.getPlatformStats();
      expect(stats.totalUsers).to.equal(3);
      expect(stats.totalPapers).to.equal(2);
      expect(stats.totalReviews).to.equal(4);
      expect(stats.totalDatasets).to.equal(2);
      expect(stats.totalNFTs).to.equal(2);

      const paper1 = await platform.getResearchPaper(1);
      expect(paper1.citationCount).to.equal(1);
    });
  });
});
