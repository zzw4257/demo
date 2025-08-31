const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 开始部署 DeSci 平台合约...");
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", (await deployer.provider.getBalance(deployer.address)).toString());

  const deployedContracts = {};

  try {
    // 1. 部署 UserProfile 合约
    console.log("\n📝 部署 UserProfile 合约...");
    const UserProfile = await hre.ethers.getContractFactory("UserProfile");
    const userProfile = await UserProfile.deploy();
    await userProfile.waitForDeployment();
    const userProfileAddress = await userProfile.getAddress();
    deployedContracts.userProfile = userProfileAddress;
    console.log("✅ UserProfile 合约已部署:", userProfileAddress);

    // 2. 部署 ZKProof 合约
    console.log("\n🔐 部署 ZKProof 合约...");
    const ZKProof = await hre.ethers.getContractFactory("ZKProof");
    const zkProof = await ZKProof.deploy();
    await zkProof.waitForDeployment();
    const zkProofAddress = await zkProof.getAddress();
    deployedContracts.zkProof = zkProofAddress;
    console.log("✅ ZKProof 合约已部署:", zkProofAddress);

    // 3. 部署 Dataset 合约
    console.log("\n📊 部署 Dataset 合约...");
    const Dataset = await hre.ethers.getContractFactory("Dataset");
    const dataset = await Dataset.deploy();
    await dataset.waitForDeployment();
    const datasetAddress = await dataset.getAddress();
    deployedContracts.dataset = datasetAddress;
    console.log("✅ Dataset 合约已部署:", datasetAddress);

    // 4. 部署 DeSciNFT 合约
    console.log("\n🎨 部署 DeSciNFT 合约...");
    const DeSciNFT = await hre.ethers.getContractFactory("DeSciNFTSimple");
    const deSciNFT = await DeSciNFT.deploy();
    await deSciNFT.waitForDeployment();
    const deSciNFTAddress = await deSciNFT.getAddress();
    deployedContracts.deSciNFT = deSciNFTAddress;
    console.log("✅ DeSciNFT 合约已部署:", deSciNFTAddress);

    // 5. 部署 DeSciPlatform 主合约
    console.log("\n🏛️  部署 DeSciPlatform 主合约...");
    const DeSciPlatform = await hre.ethers.getContractFactory("DeSciPlatform");
    const deSciPlatform = await DeSciPlatform.deploy(
      userProfileAddress,
      zkProofAddress,
      deSciNFTAddress,
      datasetAddress
    );
    await deSciPlatform.waitForDeployment();
    const deSciPlatformAddress = await deSciPlatform.getAddress();
    deployedContracts.deSciPlatform = deSciPlatformAddress;
    console.log("✅ DeSciPlatform 合约已部署:", deSciPlatformAddress);

    // 6. 配置角色权限
    console.log("\n⚙️  配置合约权限...");

    // 给 Dataset 合约添加验证者角色
    await dataset.addVerifier(deployer.address);
    console.log("✅ 已添加验证者权限");

    // 给 ZKProof 合约添加额外的验证者（构造函数中已有默认类型）
    try {
      await zkProof.addProofType("peer_review", deployer.address, 100);
      console.log("✅ 已添加额外的证明类型");
    } catch (error) {
      console.log("ℹ️  证明类型已存在，跳过添加");
    }

    // 7. 验证部署
    console.log("\n🔍 验证部署结果...");
    const totalUsers = await userProfile.getTotalUsers();
    const totalDatasets = await dataset.getTotalDatasets();
    const totalNFTs = await deSciNFT.getTotalNFTs();
    const totalProofs = await zkProof.getTotalProofs();

    console.log(`📊 初始状态:`);
    console.log(`   - 用户数量: ${totalUsers}`);
    console.log(`   - 数据集数量: ${totalDatasets}`);
    console.log(`   - NFT数量: ${totalNFTs}`);
    console.log(`   - 证明数量: ${totalProofs}`);

    // 8. 输出部署信息
    console.log("\n🎉 所有合约部署完成！");
    console.log("📋 合约地址汇总:");
    console.log("========================");
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name.padEnd(15)}: ${address}`);
    });
    console.log("========================");

    // 保存部署信息到文件
    const fs = require("fs");
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      network: hre.network.name,
      deployer: deployer.address,
      contracts: deployedContracts
    };

    fs.writeFileSync(
      "./deployment-info.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("💾 部署信息已保存到 deployment-info.json");

  } catch (error) {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n✅ DeSci 平台部署成功！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 部署过程中发生错误:", error);
    process.exit(1);
  });
