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
      expect(await userProfile.getTotalUsers()).to.equal(0);
    });
  });

  describe("User Registration", function () {
    it("Should register a new user successfully", async function () {
      const email = "alice@example.com";
      const name = "Alice";
      const ipfsHash = "QmTestHash123";

      await expect(userProfile.connect(user1).createProfile(name, 25, email, ipfsHash))
        .to.emit(userProfile, "ProfileCreated")
        .withArgs(user1.address, email, ipfsHash);

      const profile = await userProfile.getProfile(user1.address);
      expect(profile.email).to.equal(email);
      expect(profile.fullName).to.equal(name);
      expect(profile.ipfsHash).to.equal(ipfsHash);
      expect(profile.isVerified).to.be.false;
      expect(profile.reputation).to.equal(0);
    });

    it("Should prevent duplicate email registration", async function () {
      const email = "duplicate@example.com";

      await userProfile.connect(user1).createProfile("User1", 25, email, "hash1");

      await expect(
        userProfile.connect(user2).createProfile("User2", 25, email, "hash2")
      ).to.be.revertedWith("Email already registered");
    });

    it("Should prevent duplicate user registration", async function () {
      await userProfile.connect(user1).createProfile("User1", 25, "first@example.com", "hash1");

      await expect(
        userProfile.connect(user1).createProfile("User1Again", 25, "second@example.com", "hash2")
      ).to.be.revertedWith("Profile already exists");
    });

    it("Should increment total users count", async function () {
      await userProfile.connect(user1).createProfile("User1", 25, "user1@example.com", "hash1");
      expect(await userProfile.getTotalUsers()).to.equal(1);

      await userProfile.connect(user2).createProfile("User2", 25, "user2@example.com", "hash2");
      expect(await userProfile.getTotalUsers()).to.equal(2);
    });
  });

  describe("User Verification", function () {
    beforeEach(async function () {
      await userProfile.connect(user1).createProfile("Alice", 25, "alice@example.com", "hash1");
    });

    it("Should allow owner to verify users", async function () {
      await expect(userProfile.verifyProfile(user1.address, true))
        .to.emit(userProfile, "ProfileVerified")
        .withArgs(user1.address, true);

      const profile = await userProfile.getProfile(user1.address);
      expect(profile.isVerified).to.be.true;
    });

    it("Should prevent non-owner from verifying users", async function () {
      await expect(
        userProfile.connect(user2).verifyProfile(user1.address, true)
      ).to.be.reverted;
    });

    it("Should prevent verifying non-existent users", async function () {
      await expect(
        userProfile.verifyProfile(user2.address, true)
      ).to.be.revertedWith("Profile does not exist");
    });
  });

  describe("Reputation Management", function () {
    beforeEach(async function () {
      await userProfile.connect(user1).createProfile("Alice", 25, "alice@example.com", "hash1");
      await userProfile.verifyProfile(user1.address, true);
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
      ).to.be.reverted;
    });

    it("Should prevent updating reputation of non-existent users", async function () {
      await expect(
        userProfile.updateReputation(user2.address, 100)
      ).to.be.revertedWith("Profile does not exist");
    });
  });

  describe("Profile Updates", function () {
    beforeEach(async function () {
      await userProfile.connect(user1).createProfile("Alice", 25, "alice@example.com", "hash1");
    });

    it("Should allow users to update their own profile", async function () {
      const newName = "Alice Updated";
      const newAge = 26;
      const newIpfsHash = "QmNewHash456";

      await expect(userProfile.connect(user1).updateProfile(newName, newAge, newIpfsHash))
        .to.emit(userProfile, "ProfileUpdated")
        .withArgs(user1.address, newIpfsHash);

      const profile = await userProfile.getProfile(user1.address);
      expect(profile.fullName).to.equal(newName);
      expect(profile.age).to.equal(newAge);
      expect(profile.ipfsHash).to.equal(newIpfsHash);
    });

    it("Should prevent non-registered users from updating profile", async function () {
      await expect(
        userProfile.connect(user2).updateProfile("Bob", 25, "hash2")
      ).to.be.revertedWith("Profile does not exist");
    });
  });

  describe("Profile Queries", function () {
    beforeEach(async function () {
      await userProfile.connect(user1).createProfile("Alice", 25, "alice@example.com", "hash1");
      await userProfile.connect(user2).createProfile("Bob", 25, "bob@example.com", "hash2");
      await userProfile.verifyProfile(user1.address, true);
    });

    it("Should check if user has profile", async function () {
      expect(await userProfile.hasProfile(user1.address)).to.be.true;
      expect(await userProfile.hasProfile(user3.address)).to.be.false;
    });

    it("Should check if user is verified", async function () {
      expect(await userProfile.isUserVerified(user1.address)).to.be.true;
      expect(await userProfile.isUserVerified(user2.address)).to.be.false;
      expect(await userProfile.isUserVerified(user3.address)).to.be.false;
    });

    it("Should get user reputation", async function () {
      await userProfile.updateReputation(user1.address, 150);
      expect(await userProfile.getUserReputation(user1.address)).to.equal(150);
      expect(await userProfile.getUserReputation(user2.address)).to.equal(0);
    });

    it("Should revert when getting profile of non-registered user", async function () {
      await expect(
        userProfile.getProfile(user3.address)
      ).to.be.revertedWith("Profile does not exist");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty strings in registration", async function () {
      await expect(
        userProfile.connect(user1).createProfile("Alice", 25, "", "hash1")
      ).to.be.revertedWith("Email cannot be empty");
    });

    it("Should handle invalid age values", async function () {
      await expect(
        userProfile.connect(user1).createProfile("Alice", 0, "alice@example.com", "hash1")
      ).to.be.revertedWith("Invalid age");

      await expect(
        userProfile.connect(user1).createProfile("Alice", 151, "alice@example.com", "hash1")
      ).to.be.revertedWith("Invalid age");
    });

    it("Should handle maximum reputation values", async function () {
      await userProfile.connect(user1).createProfile("Alice", 25, "alice@example.com", "hash1");

      const maxReputation = ethers.MaxUint256;
      await userProfile.updateReputation(user1.address, maxReputation);

      const profile = await userProfile.getProfile(user1.address);
      expect(profile.reputation).to.equal(maxReputation);
    });
  });
});
