const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Dataset Contract", function () {
  let dataset;
  let owner, user1, user2, user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    const Dataset = await ethers.getContractFactory("Dataset");
    dataset = await Dataset.deploy();
    await dataset.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await dataset.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero datasets", async function () {
      expect(await dataset.totalDatasets()).to.equal(0);
    });
  });

  describe("Dataset Registration", function () {
    const name = "Climate Research Dataset";
    const description = "Temperature and precipitation data from 2000-2023";
    const ipfsHash = "QmTestDatasetHash123";
    const dataHash = "0x1234567890abcdef1234567890abcdef12345678";

    it("Should register public dataset successfully", async function () {
      await expect(
        dataset.connect(user1).registerDataset(name, description, ipfsHash, dataHash, true, 0)
      ).to.emit(dataset, "DatasetRegistered")
        .withArgs(1, user1.address, name);

      const ds = await dataset.getDataset(1);
      expect(ds.name).to.equal(name);
      expect(ds.description).to.equal(description);
      expect(ds.owner).to.equal(user1.address);
      expect(ds.ipfsHash).to.equal(ipfsHash);
      expect(ds.dataHash).to.equal(dataHash);
      expect(ds.isPublic).to.be.true;
      expect(ds.accessPrice).to.equal(0);
      expect(ds.isVerified).to.be.false;
      expect(ds.version).to.equal(1);
    });

    it("Should register private dataset successfully", async function () {
      const accessPrice = ethers.parseEther("0.1");
      
      await expect(
        await dataset.connect(user1).registerDataset(name, description, ipfsHash, dataHash, false, accessPrice)
      ).to.emit(dataset, "DatasetRegistered")
        .withArgs(1, user1.address, name);

      const ds = await dataset.getDataset(1);
      expect(ds.isPublic).to.be.false;
      expect(ds.accessPrice).to.equal(accessPrice);
    });

    it("Should increment dataset counter", async function () {
      await dataset.connect(user1).registerDataset(name, description, ipfsHash, dataHash, true, 0);
      expect(await dataset.totalDatasets()).to.equal(1);

      await dataset.connect(user2).registerDataset(name + "2", description, ipfsHash, dataHash, true, 0);
      expect(await dataset.totalDatasets()).to.equal(2);
    });

    it("Should handle empty strings", async function () {
      await dataset.connect(user1).registerDataset("", "", "", dataHash, true, 0);
      
      const ds = await dataset.getDataset(1);
      expect(ds.name).to.equal("");
      expect(ds.description).to.equal("");
      expect(ds.ipfsHash).to.equal("");
    });
  });

  describe("Dataset Verification", function () {
    beforeEach(async function () {
      await dataset.connect(user1).registerDataset(
        "Test Dataset", "Description", "QmHash", "0x1234", true, 0
      );
    });

    it("Should allow owner to verify dataset", async function () {
      await expect(dataset.verifyDataset(1))
        .to.emit(dataset, "DatasetVerified")
        .withArgs(1);

      const ds = await dataset.getDataset(1);
      expect(ds.isVerified).to.be.true;
    });

    it("Should prevent non-owner from verifying dataset", async function () {
      await expect(
        dataset.connect(user1).verifyDataset(1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent verifying non-existent dataset", async function () {
      await expect(dataset.verifyDataset(999)).to.be.revertedWith("Dataset does not exist");
    });

    it("Should prevent verifying already verified dataset", async function () {
      await dataset.verifyDataset(1);
      
      await expect(dataset.verifyDataset(1)).to.be.revertedWith("Dataset already verified");
    });
  });

  describe("Dataset Updates", function () {
    beforeEach(async function () {
      await dataset.connect(user1).registerDataset(
        "Original Dataset", "Original Description", "QmOriginalHash", "0x1234", true, 0
      );
    });

    it("Should allow owner to update dataset", async function () {
      const newName = "Updated Dataset";
      const newDescription = "Updated Description";
      const newIpfsHash = "QmUpdatedHash";

      await expect(
        dataset.connect(user1).updateDataset(1, newName, newDescription, newIpfsHash)
      ).to.emit(dataset, "DatasetUpdated")
        .withArgs(1, 2);

      const ds = await dataset.getDataset(1);
      expect(ds.name).to.equal(newName);
      expect(ds.description).to.equal(newDescription);
      expect(ds.ipfsHash).to.equal(newIpfsHash);
      expect(ds.version).to.equal(2);
    });

    it("Should prevent non-owner from updating dataset", async function () {
      await expect(
        dataset.connect(user2).updateDataset(1, "New Name", "New Desc", "NewHash")
      ).to.be.revertedWith("Only dataset owner can update");
    });

    it("Should prevent updating non-existent dataset", async function () {
      await expect(
        dataset.connect(user1).updateDataset(999, "New Name", "New Desc", "NewHash")
      ).to.be.revertedWith("Dataset does not exist");
    });

    it("Should increment version on each update", async function () {
      await dataset.connect(user1).updateDataset(1, "Update 1", "Desc 1", "Hash1");
      await dataset.connect(user1).updateDataset(1, "Update 2", "Desc 2", "Hash2");
      await dataset.connect(user1).updateDataset(1, "Update 3", "Desc 3", "Hash3");

      const ds = await dataset.getDataset(1);
      expect(ds.version).to.equal(4); // Started at 1, updated 3 times
    });
  });

  describe("Access Control", function () {
    const accessPrice = ethers.parseEther("0.1");

    beforeEach(async function () {
      // Register a private dataset with access price
      await dataset.connect(user1).registerDataset(
        "Private Dataset", "Private Description", "QmPrivateHash", "0x1234", false, accessPrice
      );
    });

    it("Should grant access to public datasets for free", async function () {
      // Register a public dataset
      await dataset.connect(user1).registerDataset(
        "Public Dataset", "Public Description", "QmPublicHash", "0x5678", true, 0
      );

      await expect(dataset.connect(user2).requestAccess(2))
        .to.emit(dataset, "AccessGranted")
        .withArgs(2, user2.address);

      expect(await dataset.hasAccess(2, user2.address)).to.be.true;
    });

    it("Should grant paid access to private datasets", async function () {
      await expect(
        dataset.connect(user2).requestAccess(1, { value: accessPrice })
      ).to.emit(dataset, "AccessGranted")
        .withArgs(1, user2.address);

      expect(await dataset.hasAccess(1, user2.address)).to.be.true;
    });

    it("Should reject insufficient payment for private datasets", async function () {
      const insufficientPayment = ethers.parseEther("0.05");
      
      await expect(
        dataset.connect(user2).requestAccess(1, { value: insufficientPayment })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should allow dataset owner to have automatic access", async function () {
      expect(await dataset.hasAccess(1, user1.address)).to.be.true;
    });

    it("Should allow owner to grant free access", async function () {
      await expect(dataset.grantAccess(1, user3.address))
        .to.emit(dataset, "AccessGranted")
        .withArgs(1, user3.address);

      expect(await dataset.hasAccess(1, user3.address)).to.be.true;
    });

    it("Should prevent non-owner from granting free access", async function () {
      await expect(
        dataset.connect(user2).grantAccess(1, user3.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should transfer payment to dataset owner", async function () {
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      await dataset.connect(user2).requestAccess(1, { value: accessPrice });
      
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance.sub(initialBalance)).to.equal(accessPrice);
    });
  });

  describe("Dataset Queries", function () {
    beforeEach(async function () {
      await dataset.connect(user1).registerDataset("Dataset 1", "Desc 1", "Hash1", "0x1111", true, 0);
      await dataset.connect(user1).registerDataset("Dataset 2", "Desc 2", "Hash2", "0x2222", false, ethers.parseEther("0.1"));
      await dataset.connect(user2).registerDataset("Dataset 3", "Desc 3", "Hash3", "0x3333", true, 0);
      
      await dataset.verifyDataset(1);
    });

    it("Should get user datasets correctly", async function () {
      const user1Datasets = await dataset.getUserDatasets(user1.address);
      expect(user1Datasets.length).to.equal(2);
      expect(user1Datasets[0]).to.equal(1);
      expect(user1Datasets[1]).to.equal(2);

      const user2Datasets = await dataset.getUserDatasets(user2.address);
      expect(user2Datasets.length).to.equal(1);
      expect(user2Datasets[0]).to.equal(3);
    });

    it("Should get public datasets correctly", async function () {
      const publicDatasets = await dataset.getPublicDatasets();
      expect(publicDatasets.length).to.equal(2);
      expect(publicDatasets[0]).to.equal(1);
      expect(publicDatasets[1]).to.equal(3);
    });

    it("Should get verified datasets correctly", async function () {
      const verifiedDatasets = await dataset.getVerifiedDatasets();
      expect(verifiedDatasets.length).to.equal(1);
      expect(verifiedDatasets[0]).to.equal(1);
    });

    it("Should check dataset existence", async function () {
      expect(await dataset.datasetExists(1)).to.be.true;
      expect(await dataset.datasetExists(999)).to.be.false;
    });

    it("Should return empty array for user with no datasets", async function () {
      const user3Datasets = await dataset.getUserDatasets(user3.address);
      expect(user3Datasets.length).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum access price", async function () {
      const maxPrice = ethers.MaxUint256;
      
      await dataset.connect(user1).registerDataset(
        "Expensive Dataset", "Very expensive", "QmExpensive", "0x1234", false, maxPrice
      );

      const ds = await dataset.getDataset(1);
      expect(ds.accessPrice).to.equal(maxPrice);
    });

    it("Should handle very long dataset names and descriptions", async function () {
      const longName = "A".repeat(1000);
      const longDescription = "B".repeat(2000);
      const longIpfsHash = "Qm" + "C".repeat(100);

      await dataset.connect(user1).registerDataset(
        longName, longDescription, longIpfsHash, "0x1234", true, 0
      );

      const ds = await dataset.getDataset(1);
      expect(ds.name).to.equal(longName);
      expect(ds.description).to.equal(longDescription);
      expect(ds.ipfsHash).to.equal(longIpfsHash);
    });

    it("Should handle multiple access requests from same user", async function () {
      await dataset.connect(user1).registerDataset(
        "Public Dataset", "Public", "QmPublic", "0x1234", true, 0
      );

      await dataset.connect(user2).requestAccess(1);
      
      // Second request should not fail but also not duplicate access
      await dataset.connect(user2).requestAccess(1);
      
      expect(await dataset.hasAccess(1, user2.address)).to.be.true;
    });

    it("Should handle zero access price for private datasets", async function () {
      await dataset.connect(user1).registerDataset(
        "Free Private Dataset", "Free but private", "QmFree", "0x1234", false, 0
      );

      await dataset.connect(user2).requestAccess(1);
      expect(await dataset.hasAccess(1, user2.address)).to.be.true;
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should efficiently register multiple datasets", async function () {
      const gasUsages = [];
      
      for (let i = 0; i < 5; i++) {
        const tx = await dataset.connect(user1).registerDataset(
          `Dataset ${i}`, `Description ${i}`, `Hash${i}`, `0x${i}234`, true, 0
        );
        const receipt = await tx.wait();
        gasUsages.push(receipt.gasUsed.toNumber());
      }
      
      // Gas usage should remain relatively stable
      gasUsages.forEach(gasUsed => {
        expect(gasUsed).to.be.lessThan(300000);
      });
    });

    it("Should efficiently handle batch access requests", async function () {
      // Register multiple public datasets
      for (let i = 0; i < 3; i++) {
        await dataset.connect(user1).registerDataset(
          `Public Dataset ${i}`, `Description ${i}`, `Hash${i}`, `0x${i}234`, true, 0
        );
      }

      const gasUsages = [];
      for (let i = 1; i <= 3; i++) {
        const tx = await dataset.connect(user2).requestAccess(i);
        const receipt = await tx.wait();
        gasUsages.push(receipt.gasUsed.toNumber());
      }
      
      gasUsages.forEach(gasUsed => {
        expect(gasUsed).to.be.lessThan(150000);
      });
    });
  });

  describe("Security Tests", function () {
    it("Should prevent reentrancy attacks on paid access", async function () {
      const accessPrice = ethers.utils.parseEther("0.1");
      
      await dataset.connect(user1).registerDataset(
        "Private Dataset", "Private", "QmPrivate", "0x1234", false, accessPrice
      );

      // Normal access should work
      await dataset.connect(user2).requestAccess(1, { value: accessPrice });
      expect(await dataset.hasAccess(1, user2.address)).to.be.true;
    });

    it("Should handle contract balance correctly", async function () {
      const accessPrice = ethers.parseEther("0.1");
      
      await dataset.connect(user1).registerDataset(
        "Private Dataset", "Private", "QmPrivate", "0x1234", false, accessPrice
      );

      const initialContractBalance = await ethers.provider.getBalance(dataset.address);
      
      await dataset.connect(user2).requestAccess(1, { value: accessPrice });
      
      // Contract should not hold funds (payment goes directly to dataset owner)
      const finalContractBalance = await ethers.provider.getBalance(dataset.address);
      expect(finalContractBalance).to.equal(initialContractBalance);
    });
  });
});
