// Test Configuration for DeSci Platform
module.exports = {
  // Test timeout settings
  timeout: 60000, // 60 seconds for complex integration tests
  
  // Gas settings for testing
  gas: {
    limit: 8000000,
    price: 20000000000 // 20 gwei
  },
  
  // Test data constants
  testData: {
    users: {
      alice: {
        email: "alice@desci.com",
        name: "Alice Researcher",
        ipfsHash: "QmAliceProfile123"
      },
      bob: {
        email: "bob@desci.com", 
        name: "Bob Scientist",
        ipfsHash: "QmBobProfile456"
      },
      charlie: {
        email: "charlie@desci.com",
        name: "Charlie Reviewer", 
        ipfsHash: "QmCharlieProfile789"
      }
    },
    
    research: {
      paper1: {
        title: "Quantum Computing Breakthrough in Error Correction",
        abstract: "This paper presents a novel approach to quantum error correction using topological qubits and machine learning algorithms.",
        ipfsHash: "QmQuantumResearch2024"
      },
      paper2: {
        title: "Climate Change Impact on Marine Ecosystems",
        abstract: "Comprehensive analysis of temperature and pH changes in ocean environments over the past 50 years.",
        ipfsHash: "QmClimateResearch2024"
      }
    },
    
    datasets: {
      quantum: {
        name: "Quantum Error Correction Dataset",
        description: "Experimental data from quantum computing experiments",
        ipfsHash: "QmQuantumData2024",
        dataHash: "0x1234567890abcdef1234567890abcdef12345678"
      },
      climate: {
        name: "Marine Temperature Dataset", 
        description: "Ocean temperature and pH measurements 1970-2024",
        ipfsHash: "QmClimateData2024",
        dataHash: "0xabcdef1234567890abcdef1234567890abcdef12"
      }
    },
    
    zkProofs: {
      identity: {
        proofType: 0, // IDENTITY
        proofData: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
        publicInputs: "0xfedcba0987654321fedcba0987654321fedcba09",
        metadata: "QmIdentityProofMeta2024"
      },
      research: {
        proofType: 1, // RESEARCH
        proofData: "0x2b3c4d5e6f7890ab1a2b3c4d5e6f7890abcdef12",
        publicInputs: "0xedcba0987654321f2b3c4d5e6f7890abcdef1234",
        metadata: "QmResearchProofMeta2024"
      },
      dataset: {
        proofType: 2, // DATASET
        proofData: "0x3c4d5e6f7890ab1a2b3c4d5e6f7890abcdef1234",
        publicInputs: "0xdcba0987654321fe3c4d5e6f7890abcdef123456",
        metadata: "QmDatasetProofMeta2024"
      }
    },
    
    reviews: {
      excellent: {
        content: "Excellent work with groundbreaking methodology and clear presentation.",
        rating: 9
      },
      good: {
        content: "Good research with solid methodology, minor improvements suggested.",
        rating: 7
      },
      average: {
        content: "Average work, meets basic requirements but lacks innovation.",
        rating: 5
      }
    }
  },
  
  // Test scenarios
  scenarios: {
    // Basic functionality tests
    basic: [
      'user_registration',
      'dataset_creation', 
      'zkproof_submission',
      'nft_minting',
      'research_publishing'
    ],
    
    // Advanced workflow tests
    advanced: [
      'peer_review_workflow',
      'citation_management',
      'access_control',
      'reputation_system'
    ],
    
    // Security and edge case tests
    security: [
      'input_validation',
      'access_control_bypass',
      'reentrancy_protection',
      'integer_overflow_protection'
    ],
    
    // Performance and gas optimization tests
    performance: [
      'batch_operations',
      'gas_optimization',
      'large_data_handling',
      'concurrent_access'
    ]
  },
  
  // Expected gas costs (for optimization tracking)
  expectedGasCosts: {
    userRegistration: 150000,
    datasetRegistration: 200000,
    zkProofSubmission: 180000,
    nftMinting: 160000,
    researchPublishing: 250000,
    peerReviewSubmission: 120000,
    citationAdding: 80000
  },
  
  // Minimum reputation requirements
  reputationRequirements: {
    peerReview: 50,
    datasetVerification: 100,
    platformModeration: 200
  },
  
  // Test environment settings
  environment: {
    network: "hardhat",
    chainId: 1337,
    blockGasLimit: 30000000,
    accounts: 10, // Number of test accounts to use
    initialBalance: "10000" // ETH per account
  }
};
