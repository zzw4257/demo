const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DeSciPlatform Integration Tests", function () {
  let userProfile, zkProof, dataset, deSciNFT, deSciPlatform;
  let owner, researcher, reviewer1, reviewer2;

  beforeEach(async function () {
    [owner, researcher, reviewer1, reviewer2] = await ethers.getSigners();

    // 部署所有合约
    const UserProfile = await ethers.getContractFactory("UserProfile");
    userProfile = await UserProfile.deploy();
    await userProfile.waitForDeployment();

    const ZKProof = await ethers.getContractFactory("ZKProof");
    zkProof = await ZKProof.deploy();
    await zkProof.waitForDeployment();

    const Dataset = await ethers.getContractFactory("Dataset");
    dataset = await Dataset.deploy();
    await dataset.waitForDeployment();

    const DeSciNFT = await ethers.getContractFactory("DeSciNFTSimple");
    deSciNFT = await DeSciNFT.deploy();
    await deSciNFT.waitForDeployment();

    const DeSciPlatform = await ethers.getContractFactory("DeSciPlatform");
    deSciPlatform = await DeSciPlatform.deploy(
      await userProfile.getAddress(),
      await zkProof.getAddress(),
      await deSciNFT.getAddress(),
      await dataset.getAddress()
    );
    await deSciPlatform.waitForDeployment();

    // 注册用户
    await userProfile.connect(researcher).createProfile("Alice Researcher", 30, "alice@example.com", "QmProfileHash");
    await userProfile.connect(reviewer1).createProfile("Bob Reviewer", 35, "bob@example.com", "QmProfileHash2");
    await userProfile.connect(reviewer2).createProfile("Charlie Reviewer", 40, "charlie@example.com", "QmProfileHash3");

    // 验证用户
    await userProfile.verifyProfile(researcher.address, true);
    await userProfile.verifyProfile(reviewer1.address, true);
    await userProfile.verifyProfile(reviewer2.address, true);

    // 设置评审者声誉
    await userProfile.updateReputation(reviewer1.address, 80);
    await userProfile.updateReputation(reviewer2.address, 90);
  });

  describe("Complete Research Workflow", function () {
    it("Should complete full research publication and review cycle", async function () {
      // 1. 提交 ZK 证明
      console.log("📝 步骤1: 提交ZK证明...");

      const proofData = {
        proofType: "research_authenticity",
        proof: [1, 2, 3, 4, 5, 6, 7, 8],
        publicInputs: [123, 456],
        metadataHash: "QmProofMetadata"
      };

      await zkProof.connect(researcher).submitProof(
        proofData.proofType,
        proofData.proof,
        proofData.publicInputs,
        proofData.metadataHash
      );

      // 验证证明
      const proofId = 1;
      await zkProof.verifyProof(proofId, true);

      // 2. 发布数据集
      console.log("📊 步骤2: 发布数据集...");

      const datasetData = {
        name: "Research Dataset",
        description: "Dataset for research validation",
        dataHash: "QmDatasetHash",
        metadataHash: "QmDatasetMetadata",
        isPublic: true,
        accessPrice: 0,
        tags: ["research", "data"]
      };

      await dataset.connect(researcher).registerDataset(
        `${datasetData.name} ${Date.now()}`, // 添加时间戳避免重复
        datasetData.description,
        datasetData.dataHash,
        datasetData.metadataHash,
        datasetData.isPublic,
        datasetData.accessPrice,
        datasetData.tags
      );

      const datasetId = 1;

      // 3. 发布研究成果
      console.log("🔬 步骤3: 发布研究成果...");

      const researchData = {
        title: "Novel Research Findings",
        description: "This paper presents novel findings in the field",
        datasetName: "Research Dataset",
        datasetDescription: "Dataset for research validation",
        datasetHash: "QmDatasetHash",
        metadataHash: "QmResearchMetadata",
        zkProofIds: [proofId],
        isDatasetPublic: true,
        datasetAccessPrice: 0
      };

      const tx = await deSciPlatform.connect(researcher).publishResearch(
        researchData.title,
        researchData.description,
        researchData.datasetName,
        researchData.datasetDescription,
        researchData.datasetHash,
        researchData.metadataHash,
        researchData.zkProofIds,
        researchData.isDatasetPublic,
        researchData.datasetAccessPrice
      );

      const receipt = await tx.wait();
      const researchId = 1;

      // 4. 同行评审
      console.log("👥 步骤4: 进行同行评审...");

      const reviewData1 = {
        researchId: researchId,
        rating: 9,
        comments: "Excellent research with solid methodology",
        ipfsHash: "QmReview1"
      };

      const reviewData2 = {
        researchId: researchId,
        rating: 8,
        comments: "Good contribution to the field",
        ipfsHash: "QmReview2"
      };

      await deSciPlatform.connect(reviewer1).submitPeerReview(
        reviewData1.researchId,
        reviewData1.rating,
        reviewData1.comments,
        reviewData1.ipfsHash
      );

      await deSciPlatform.connect(reviewer2).submitPeerReview(
        reviewData2.researchId,
        reviewData2.rating,
        reviewData2.comments,
        reviewData2.ipfsHash
      );

      // 5. 检查研究状态
      console.log("📋 步骤5: 检查研究状态...");

      const research = await deSciPlatform.getResearch(researchId);
      expect(research.status).to.equal(3); // Published (由于评分 >= 7 且评审数 >= 2，自动发布)
      expect(research.peerReviewCount).to.equal(2);
      expect(research.averageRating).to.equal(8); // 验证评分计算正确

      // 6. 验证最终状态
      console.log("✅ 步骤6: 验证最终状态...");

      const finalResearch = await deSciPlatform.getResearch(researchId);
      expect(finalResearch.status).to.equal(3); // Published
      expect(finalResearch.nftTokenId).to.not.equal(0);

      // 检查NFT是否正确铸造
      const nftTokenId = finalResearch.nftTokenId;
      const nftOwner = await deSciNFT.ownerOf(nftTokenId);
      expect(nftOwner).to.equal(researcher.address);

      // 检查研究者声誉是否更新
      const researcherReputation = await userProfile.getUserReputation(researcher.address);
      expect(researcherReputation).to.be.greaterThan(0);

      console.log("🎉 完整研究工作流测试通过！");
    });

    it("Should handle research rejection workflow", async function () {
      // 提交低质量研究
      const proofId = 1;
      await zkProof.connect(researcher).submitProof(
        "research_authenticity",
        [1, 2, 3, 4, 5, 6, 7, 8],
        [123, 456],
        "QmProofMetadata"
      );
      await zkProof.verifyProof(proofId, true);

      await dataset.connect(researcher).registerDataset(
        `Dataset ${Date.now()}`,
        "Description",
        "QmDataHash",
        "QmMetadataHash",
        true,
        0,
        ["research"]
      );

      const researchId = await deSciPlatform.connect(researcher).publishResearch(
        "Low Quality Research",
        "Poor research",
        `Dataset ${Date.now()}`,
        "Description",
        "QmDataHash",
        "QmMetadataHash",
        [proofId],
        true,
        0
      );

      // 提交低分评审
      await deSciPlatform.connect(reviewer1).submitPeerReview(
        1, // researchId
        2, // low rating
        "Poor quality research",
        "QmReview"
      );

      await deSciPlatform.connect(reviewer2).submitPeerReview(
        1, // researchId
        1, // very low rating
        "Not suitable for publication",
        "QmReview2"
      );

      // 检查研究被拒绝
      const research = await deSciPlatform.getResearch(1);
      expect(research.averageRating).to.equal(1); // (2+1)/2 = 1.5 -> 1
      // 研究应该保持在UnderReview状态，因为评分太低不会自动发布
      expect(research.status).to.equal(2); // UnderReview
    });

    it("Should handle dataset access control", async function () {
      // 创建私有数据集
      await dataset.connect(researcher).registerDataset(
        "Private Dataset",
        "Private research data",
        "QmPrivateData",
        "QmPrivateMetadata",
        false, // not public
        ethers.parseEther("0.1"), // 0.1 ETH
        ["private", "research"]
      );

      // 其他用户尝试访问
      await expect(
        dataset.connect(reviewer1).requestAccess(1, "For research review")
      ).to.emit(dataset, "AccessRequested");

      // 数据集所有者批准访问
      await dataset.connect(researcher).grantAccess(1, reviewer1.address, 0);

      // 验证访问权限
      expect(await dataset.checkAccess(1, reviewer1.address)).to.be.true;
    });

    it("Should handle ZK proof validation", async function () {
      // 提交多个证明
      const proofIds = [];

      for (let i = 0; i < 3; i++) {
        await zkProof.connect(researcher).submitProof(
          "research_authenticity",
          [i + 1, i + 2, i + 3, i + 4, i + 5, i + 6, i + 7, i + 8],
          [100 + i, 200 + i],
          `QmProofMetadata${i}`
        );
        proofIds.push(i + 1);
      }

      // 验证所有证明
      for (const proofId of proofIds) {
        await zkProof.verifyProof(proofId, true);
      }

      // 检查证明状态
      for (const proofId of proofIds) {
        const proof = await zkProof.getProof(proofId);
        expect(proof.isVerified).to.be.true;
      }

      // 验证用户证明列表
      const userProofs = await zkProof.getUserProofs(researcher.address);
      expect(userProofs.length).to.equal(3);
    });
  });

  describe("Error Handling", function () {
    it("Should prevent unverified users from publishing research", async function () {
      // 创建未验证的用户
      const unverifiedUser = reviewer1;
      await userProfile.verifyProfile(unverifiedUser.address, false); // 设置为未验证

      await expect(
        deSciPlatform.connect(unverifiedUser).publishResearch(
          "Test Research",
          "Description",
          `Dataset ${Date.now()}`,
          "Description",
          "QmDataHash",
          "QmMetadataHash",
          [],
          true,
          0
        )
      ).to.be.revertedWith("User must be verified");
    });

    it("Should prevent self-review", async function () {
      // 设置证明和数据集
      await zkProof.connect(researcher).submitProof(
        "research_authenticity",
        [1, 2, 3, 4, 5, 6, 7, 8],
        [123, 456],
        "QmProofMetadata"
      );
      await zkProof.verifyProof(1, true);

      await dataset.connect(researcher).registerDataset(
        `Dataset ${Date.now()}`,
        "Description",
        "QmDataHash",
        "QmMetadataHash",
        true,
        0,
        ["research"]
      );

      // 发布研究
      await deSciPlatform.connect(researcher).publishResearch(
        "Self Review Research",
        "Research for self review test",
        `SelfReview Dataset ${Date.now()}`,
        "Dataset for self review test",
        "QmSelfReviewDataHash",
        "QmSelfReviewMetadataHash",
        [1],
        true,
        0
      );

      // 尝试自我评审
      await expect(
        deSciPlatform.connect(researcher).submitPeerReview(
          1,
          8,
          "Self review",
          "QmReview"
        )
      ).to.be.revertedWith("Cannot review own research");
    });
  });
});
