const hre = require("hardhat");

async function main() {
  const [deployer, researcher, reviewer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying DeSci Platform with the account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  console.log("\n📋 Step 1: Deploying UserProfile contract...");
  const UserProfile = await hre.ethers.getContractFactory("UserProfile");
  const userProfile = await UserProfile.deploy();
  await userProfile.waitForDeployment();
  console.log("✅ UserProfile deployed to:", await userProfile.getAddress());

  console.log("\n🔐 Step 2: Deploying ZKProof contract...");
  const ZKProof = await hre.ethers.getContractFactory("ZKProof");
  const zkProof = await ZKProof.deploy();
  await zkProof.waitForDeployment();
  console.log("✅ ZKProof deployed to:", await zkProof.getAddress());

  console.log("\n🎨 Step 3: Deploying DeSciNFTSimple contract...");
  const DeSciNFTSimple = await hre.ethers.getContractFactory("DeSciNFTSimple");
  const nft = await DeSciNFTSimple.deploy();
  await nft.waitForDeployment();
  console.log("✅ DeSciNFTSimple deployed to:", await nft.getAddress());

  console.log("\n📊 Step 4: Deploying Dataset contract...");
  const Dataset = await hre.ethers.getContractFactory("Dataset");
  const dataset = await Dataset.deploy();
  await dataset.waitForDeployment();
  console.log("✅ Dataset deployed to:", await dataset.getAddress());

  console.log("\n🏛️ Step 5: Deploying DeSciPlatform contract...");
  const DeSciPlatform = await hre.ethers.getContractFactory("DeSciPlatform");
  const platform = await DeSciPlatform.deploy(
    await userProfile.getAddress(),
    await zkProof.getAddress(),
    await nft.getAddress(),
    await dataset.getAddress()
  );
  await platform.waitForDeployment();
  console.log("✅ DeSciPlatform deployed to:", await platform.getAddress());

  console.log("\n🔧 Step 6: Setting up initial configuration...");
  
  // Create user profiles
  console.log("👤 Creating researcher profile...");
  await userProfile.connect(researcher).createProfile(
    "Dr. Alice Smith",
    35,
    "alice@university.edu",
    "QmResearcherProfileHash"
  );
  
  console.log("👥 Creating reviewer profile...");
  await userProfile.connect(reviewer).createProfile(
    "Prof. Bob Johnson",
    45,
    "bob@institute.edu",
    "QmReviewerProfileHash"
  );

  // Verify users (as owner)
  console.log("✅ Verifying user profiles...");
  await userProfile.verifyProfile(researcher.address, true);
  await userProfile.verifyProfile(reviewer.address, true);

  // Set initial reputation
  await userProfile.updateReputation(researcher.address, 100);
  await userProfile.updateReputation(reviewer.address, 150);

  console.log("\n🧪 Step 7: Testing the platform with sample data...");

  // Submit a ZK proof
  console.log("🔐 Submitting ZK proof...");
  const proof = [1, 2, 3, 4, 5, 6, 7, 8]; // Mock proof
  const publicInputs = [100, 200]; // Mock public inputs
  
  const proofTx = await zkProof.connect(researcher).submitProof(
    "research_authenticity",
    proof,
    publicInputs,
    "QmZKProofMetadataHash"
  );
  const proofReceipt = await proofTx.wait();
  const proofId = 1; // First proof ID

  // Verify the proof (as owner)
  await zkProof.verifyProof(proofId, true);

  // Publish research through the platform
  console.log("📝 Publishing research...");
  const publishTx = await platform.connect(researcher).publishResearch(
    "Revolutionary Blockchain Research",
    "A groundbreaking study on decentralized science",
    "Blockchain Dataset v1.0",
    "Comprehensive blockchain research dataset",
    "0x1234567890abcdef", // Mock dataset hash
    "QmResearchMetadataHash",
    [proofId], // ZK proof IDs
    true, // Public dataset
    0 // Free access
  );
  
  const publishReceipt = await publishTx.wait();
  const researchId = 1; // First research ID

  // Submit peer review
  console.log("📋 Submitting peer review...");
  await platform.connect(reviewer).submitPeerReview(
    researchId,
    8, // Rating out of 10
    "Excellent research with solid methodology",
    "QmPeerReviewHash"
  );

  console.log("\n📊 Step 8: Displaying platform statistics...");
  
  // Get platform statistics
  const totalUsers = await userProfile.getTotalUsers();
  const totalProofs = await zkProof.getTotalProofs();
  const totalNFTs = await nft.getTotalNFTs();
  const totalDatasets = await dataset.getTotalDatasets();
  const totalResearches = await platform.getTotalResearches();

  console.log("📈 Platform Statistics:");
  console.log(`   👥 Total Users: ${totalUsers}`);
  console.log(`   🔐 Total ZK Proofs: ${totalProofs}`);
  console.log(`   🎨 Total NFTs: ${totalNFTs}`);
  console.log(`   📊 Total Datasets: ${totalDatasets}`);
  console.log(`   📝 Total Research Papers: ${totalResearches}`);

  // Get specific data
  const researcherProfile = await userProfile.getProfile(researcher.address);
  const research = await platform.getResearch(researchId);
  
  console.log("\n👤 Researcher Profile:");
  console.log(`   Name: ${researcherProfile.fullName}`);
  console.log(`   Email: ${researcherProfile.email}`);
  console.log(`   Verified: ${researcherProfile.isVerified}`);
  console.log(`   Reputation: ${researcherProfile.reputation}`);

  console.log("\n📝 Research Details:");
  console.log(`   Title: ${research.title}`);
  console.log(`   Status: ${research.status}`); // 0=Draft, 1=Submitted, 2=UnderReview, 3=Published, 4=Rejected
  console.log(`   NFT Token ID: ${research.nftTokenId}`);
  console.log(`   Peer Reviews: ${research.peerReviewCount}`);
  console.log(`   Average Rating: ${research.averageRating}`);

  console.log("\n🎉 DeSci Platform deployment and testing completed successfully!");
  console.log("\n📋 Contract Addresses Summary:");
  console.log(`   UserProfile: ${await userProfile.getAddress()}`);
  console.log(`   ZKProof: ${await zkProof.getAddress()}`);
  console.log(`   DeSciNFTSimple: ${await nft.getAddress()}`);
  console.log(`   Dataset: ${await dataset.getAddress()}`);
  console.log(`   DeSciPlatform: ${await platform.getAddress()}`);

  console.log("\n🔗 Next Steps:");
  console.log("   1. Connect your frontend to these contract addresses");
  console.log("   2. Implement IPFS integration for metadata storage");
  console.log("   3. Add more sophisticated ZK proof verification");
  console.log("   4. Implement token economics and governance");
  console.log("   5. Add more peer review and citation features");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
