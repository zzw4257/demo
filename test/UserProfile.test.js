const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserProfile Contract", function () {
  let userProfile;
  let owner, user1, user2, user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    const UserProfile = await ethers.getContractFactory("UserProfile");
    userProfile = await UserProfile.deploy();
    await userProfile.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await userProfile.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero users", async function () {
      expect(await userProfile.totalUsers()).to.equal(0);
    });
  });

  describe("User Registration", function () {
    it("Should register a new user successfully", async function () {
      const email = "alice@example.com";
      const name = "Alice";
      const ipfsHash = "QmTestHash123";

      await expect(userProfile.connect(user1).registerUser(email, name, ipfsHash))
        .to.emit(userProfile, "UserRegistered")
        .withArgs(user1.address, email);

      const profile = await userProfile.getProfile(user1.address);
      expect(profile.email).to.equal(email);
      expect(profile.name).to.equal(name);
      expect(profile.ipfsHash).to.equal(ipfsHash);
      expect(profile.isVerified).to.be.false;
      expect(profile.reputation).to.equal(0);
    });

    it("Should prevent duplicate email registration", async function () {
      const email = "duplicate@example.com";
      
      await userProfile.connect(user1).registerUser(email, "User1", "hash1");
      
      await expect(
        userProfile.connect(user2).registerUser(email, "User2", "hash2")
      ).to.be.revertedWith("Email already registered");
    });

    it("Should prevent duplicate user registration", async function () {
      await userProfile.connect(user1).registerUser("first@example.com", "User1", "hash1");
      
      await expect(
        userProfile.connect(user1).registerUser("second@example.com", "User1Again", "hash2")
      ).to.be.revertedWith("User already registered");
    });

    it("Should increment total users count", async function () {
      await userProfile.connect(user1).registerUser("user1@example.com", "User1", "hash1");
      expect(await userProfile.totalUsers()).to.equal(1);

      await userProfile.connect(user2).registerUser("user2@example.com", "User2", "hash2");
      expect(await userProfile.totalUsers()).to.equal(2);
    });
  });

  describe("User Verification", function () {
    beforeEach(async function () {
      await userProfile.connect(user1).registerUser("alice@example.com", "Alice", "hash1");
    });

    it("Should allow owner to verify users", async function () {
      await expect(userProfile.verifyUser(user1.address))
        .to.emit(userProfile, "UserVerified")
        .withArgs(user1.address);

      const profile = await userProfile.getProfile(user1.address);
      expect(profile.isVerified).to.be.true;
    });

    it("Should prevent non-owner from verifying users", async function () {
      await expect(
        userProfile.connect(user2).verifyUser(user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent verifying non-existent users", async function () {
      await expect(
        userProfile.verifyUser(user2.address)
      ).to.be.revertedWith("User not registered");
    });
  });

  describe("Reputation Management", function () {
    beforeEach(async function () {
      await userProfile.connect(user1).registerUser("alice@example.com", "Alice", "hash1");
      await userProfile.verifyUser(user1.address);
    });

    it("Should allow owner to update reputation", async function () {
      const newReputation = 100;
      
      await expect(userProfile.updateReputation(user1.address, newReputation))
        .to.emit(userProfile, "ReputationUpdated")
        .withArgs(user1.address, newReputation);

      const profile = await userProfile.getProfile(user1.address);
      expect(profile.reputation).to.equal(newReputation);
    });

    it("Should prevent non-owner from updating reputation", async function () {
      await expect(
        userProfile.connect(user2).updateReputation(user1.address, 100)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent updating reputation of non-existent users", async function () {
      await expect(
        userProfile.updateReputation(user2.address, 100)
      ).to.be.revertedWith("User not registered");
    });
  });

  describe("Profile Updates", function () {
    beforeEach(async function () {
      await userProfile.connect(user1).registerUser("alice@example.com", "Alice", "hash1");
    });

    it("Should allow users to update their own profile", async function () {
      const newName = "Alice Updated";
      const newIpfsHash = "QmNewHash456";

      await expect(userProfile.connect(user1).updateProfile(newName, newIpfsHash))
        .to.emit(userProfile, "ProfileUpdated")
        .withArgs(user1.address);

      const profile = await userProfile.getProfile(user1.address);
      expect(profile.name).to.equal(newName);
      expect(profile.ipfsHash).to.equal(newIpfsHash);
    });

    it("Should prevent non-registered users from updating profile", async function () {
      await expect(
        userProfile.connect(user2).updateProfile("Bob", "hash2")
      ).to.be.revertedWith("User not registered");
    });
  });

  describe("Profile Queries", function () {
    beforeEach(async function () {
      await userProfile.connect(user1).registerUser("alice@example.com", "Alice", "hash1");
      await userProfile.connect(user2).registerUser("bob@example.com", "Bob", "hash2");
      await userProfile.verifyUser(user1.address);
    });

    it("Should check if user is registered", async function () {
      expect(await userProfile.isRegistered(user1.address)).to.be.true;
      expect(await userProfile.isRegistered(user3.address)).to.be.false;
    });

    it("Should check if user is verified", async function () {
      expect(await userProfile.isVerified(user1.address)).to.be.true;
      expect(await userProfile.isVerified(user2.address)).to.be.false;
      expect(await userProfile.isVerified(user3.address)).to.be.false;
    });

    it("Should get user reputation", async function () {
      await userProfile.updateReputation(user1.address, 150);
      expect(await userProfile.getReputation(user1.address)).to.equal(150);
      expect(await userProfile.getReputation(user2.address)).to.equal(0);
    });

    it("Should revert when getting profile of non-registered user", async function () {
      await expect(
        userProfile.getProfile(user3.address)
      ).to.be.revertedWith("User not registered");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty strings in registration", async function () {
      await expect(
        userProfile.connect(user1).registerUser("", "Alice", "hash1")
      ).to.be.revertedWith("Email cannot be empty");
    });

    it("Should handle maximum reputation values", async function () {
      await userProfile.connect(user1).registerUser("alice@example.com", "Alice", "hash1");
      
      const maxReputation = ethers.MaxUint256;
      await userProfile.updateReputation(user1.address, maxReputation);
      
      const profile = await userProfile.getProfile(user1.address);
      expect(profile.reputation).to.equal(maxReputation);
    });
  });
});
