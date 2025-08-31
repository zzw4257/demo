const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZKProof Contract", function () {
  let zkProof;
  let owner, user1, user2, verifier1, verifier2;

  beforeEach(async function () {
    [owner, user1, user2, verifier1, verifier2] = await ethers.getSigners();
    
    const ZKProof = await ethers.getContractFactory("ZKProof");
    zkProof = await ZKProof.deploy();
    await zkProof.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await zkProof.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero proofs", async function () {
      expect(await zkProof.getTotalProofs()).to.equal(0);
    });
  });

  describe("Verifier Management", function () {
    it("Should allow owner to add proof types", async function () {
      const proofType = "custom_proof";
      await expect(zkProof.addProofType(proofType, owner.address, 50))
        .to.emit(zkProof, "ProofTypeAdded")
        .withArgs(proofType, owner.address);

      const pt = await zkProof.getProofType(proofType);
      expect(pt.name).to.equal(proofType);
    });

    it("Should prevent non-owner from adding verifiers", async function () {
      await expect(
        zkProof.connect(user1).addVerifier(verifier1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to remove verifiers", async function () {
      await zkProof.addVerifier(verifier1.address);
      
      await expect(zkProof.removeVerifier(verifier1.address))
        .to.emit(zkProof, "VerifierRemoved")
        .withArgs(verifier1.address);

      expect(await zkProof.isVerifier(verifier1.address)).to.be.false;
    });

    it("Should prevent adding duplicate verifiers", async function () {
      await zkProof.addVerifier(verifier1.address);
      
      await expect(
        zkProof.addVerifier(verifier1.address)
      ).to.be.revertedWith("Already a verifier");
    });
  });

  describe("Proof Submission", function () {
    const proofData = "0x1234567890abcdef";
    const publicInputs = "0xabcdef1234567890";
    const metadata = "QmTestMetadataHash";

    it("Should submit identity proof successfully", async function () {
      await expect(
        zkProof.connect(user1).submitProof(0, proofData, publicInputs, metadata) // IDENTITY = 0
      ).to.emit(zkProof, "ProofSubmitted")
        .withArgs(1, user1.address, 0);

      const proof = await zkProof.getProof(1);
      expect(proof.submitter).to.equal(user1.address);
      expect(proof.proofType).to.equal(0);
      expect(proof.proofData).to.equal(proofData);
      expect(proof.publicInputs).to.equal(publicInputs);
      expect(proof.metadata).to.equal(metadata);
      expect(proof.isVerified).to.be.false;
    });

    it("Should submit research proof successfully", async function () {
      await expect(
        zkProof.connect(user1).submitProof(1, proofData, publicInputs, metadata) // RESEARCH = 1
      ).to.emit(zkProof, "ProofSubmitted")
        .withArgs(1, user1.address, 1);

      const proof = await zkProof.getProof(1);
      expect(proof.proofType).to.equal(1);
    });

    it("Should submit dataset proof successfully", async function () {
      await expect(
        zkProof.connect(user1).submitProof(2, proofData, publicInputs, metadata) // DATASET = 2
      ).to.emit(zkProof, "ProofSubmitted")
        .withArgs(1, user1.address, 2);

      const proof = await zkProof.getProof(1);
      expect(proof.proofType).to.equal(2);
    });

    it("Should increment proof counter", async function () {
      await zkProof.connect(user1).submitProof(0, proofData, publicInputs, metadata);
      expect(await zkProof.totalProofs()).to.equal(1);

      await zkProof.connect(user2).submitProof(1, proofData, publicInputs, metadata);
      expect(await zkProof.totalProofs()).to.equal(2);
    });

    it("Should handle multiple proofs from same user", async function () {
      await zkProof.connect(user1).submitProof(0, proofData, publicInputs, metadata);
      await zkProof.connect(user1).submitProof(1, proofData, publicInputs, metadata);

      expect(await zkProof.totalProofs()).to.equal(2);
      
      const proof1 = await zkProof.getProof(1);
      const proof2 = await zkProof.getProof(2);
      
      expect(proof1.submitter).to.equal(user1.address);
      expect(proof2.submitter).to.equal(user1.address);
      expect(proof1.proofType).to.equal(0);
      expect(proof2.proofType).to.equal(1);
    });
  });

  describe("Proof Verification", function () {
    const proofData = "0x1234567890abcdef";
    const publicInputs = "0xabcdef1234567890";
    const metadata = "QmTestMetadataHash";

    beforeEach(async function () {
      await zkProof.addVerifier(verifier1.address);
      await zkProof.connect(user1).submitProof(0, proofData, publicInputs, metadata);
    });

    it("Should allow verifier to verify proof", async function () {
      await expect(zkProof.connect(verifier1).verifyProof(1))
        .to.emit(zkProof, "ProofVerified")
        .withArgs(1, verifier1.address);

      const proof = await zkProof.getProof(1);
      expect(proof.isVerified).to.be.true;
      expect(proof.verifier).to.equal(verifier1.address);
    });

    it("Should prevent non-verifier from verifying proof", async function () {
      await expect(
        zkProof.connect(user2).verifyProof(1)
      ).to.be.revertedWith("Not authorized verifier");
    });

    it("Should prevent verifying non-existent proof", async function () {
      await expect(
        zkProof.connect(verifier1).verifyProof(999)
      ).to.be.revertedWith("Proof does not exist");
    });

    it("Should prevent verifying already verified proof", async function () {
      await zkProof.connect(verifier1).verifyProof(1);
      
      await expect(
        zkProof.connect(verifier1).verifyProof(1)
      ).to.be.revertedWith("Proof already verified");
    });

    it("Should allow different verifier to verify after first verifier is removed", async function () {
      await zkProof.addVerifier(verifier2.address);
      await zkProof.removeVerifier(verifier1.address);
      
      await expect(zkProof.connect(verifier2).verifyProof(1))
        .to.emit(zkProof, "ProofVerified")
        .withArgs(1, verifier2.address);
    });
  });

  describe("Proof Queries", function () {
    const proofData = "0x1234567890abcdef";
    const publicInputs = "0xabcdef1234567890";
    const metadata = "QmTestMetadataHash";

    beforeEach(async function () {
      await zkProof.addVerifier(verifier1.address);
      await zkProof.connect(user1).submitProof(0, proofData, publicInputs, metadata);
      await zkProof.connect(user1).submitProof(1, proofData, publicInputs, metadata);
      await zkProof.connect(user2).submitProof(2, proofData, publicInputs, metadata);
      await zkProof.connect(verifier1).verifyProof(1);
    });

    it("Should get user proofs correctly", async function () {
      const user1Proofs = await zkProof.getUserProofs(user1.address);
      expect(user1Proofs.length).to.equal(2);
      expect(user1Proofs[0]).to.equal(1);
      expect(user1Proofs[1]).to.equal(2);

      const user2Proofs = await zkProof.getUserProofs(user2.address);
      expect(user2Proofs.length).to.equal(1);
      expect(user2Proofs[0]).to.equal(3);
    });

    it("Should get proofs by type correctly", async function () {
      const identityProofs = await zkProof.getProofsByType(0);
      expect(identityProofs.length).to.equal(1);
      expect(identityProofs[0]).to.equal(1);

      const researchProofs = await zkProof.getProofsByType(1);
      expect(researchProofs.length).to.equal(1);
      expect(researchProofs[0]).to.equal(2);

      const datasetProofs = await zkProof.getProofsByType(2);
      expect(datasetProofs.length).to.equal(1);
      expect(datasetProofs[0]).to.equal(3);
    });

    it("Should check if proof is verified", async function () {
      expect(await zkProof.isProofVerified(1)).to.be.true;
      expect(await zkProof.isProofVerified(2)).to.be.false;
      expect(await zkProof.isProofVerified(3)).to.be.false;
    });

    it("Should return false for non-existent proof verification check", async function () {
      expect(await zkProof.isProofVerified(999)).to.be.false;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty proof data", async function () {
      await zkProof.connect(user1).submitProof(0, "0x", "0x", "");
      
      const proof = await zkProof.getProof(1);
      expect(proof.proofData).to.equal("0x");
      expect(proof.publicInputs).to.equal("0x");
      expect(proof.metadata).to.equal("");
    });

    it("Should handle large proof data", async function () {
      const largeProofData = "0x" + "a".repeat(1000);
      const largePublicInputs = "0x" + "b".repeat(1000);
      const largeMetadata = "Qm" + "c".repeat(100);

      await zkProof.connect(user1).submitProof(0, largeProofData, largePublicInputs, largeMetadata);
      
      const proof = await zkProof.getProof(1);
      expect(proof.proofData).to.equal(largeProofData);
      expect(proof.publicInputs).to.equal(largePublicInputs);
      expect(proof.metadata).to.equal(largeMetadata);
    });

    it("Should handle maximum proof type value", async function () {
      // Test with proof type 2 (DATASET), which is the maximum defined type
      await zkProof.connect(user1).submitProof(2, "0x1234", "0x5678", "metadata");
      
      const proof = await zkProof.getProof(1);
      expect(proof.proofType).to.equal(2);
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should efficiently handle batch proof submissions", async function () {
      const proofData = "0x1234567890abcdef";
      const publicInputs = "0xabcdef1234567890";
      const metadata = "QmTestMetadataHash";

      // Submit multiple proofs and measure gas usage patterns
      for (let i = 0; i < 5; i++) {
        const tx = await zkProof.connect(user1).submitProof(i % 3, proofData, publicInputs, metadata);
        const receipt = await tx.wait();
        
        // Gas usage should remain relatively stable
        expect(receipt.gasUsed.toNumber()).to.be.lessThan(200000);
      }

      expect(await zkProof.totalProofs()).to.equal(5);
    });
  });
});
