// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Dataset is Ownable, ReentrancyGuard, AccessControl {
    bytes32 public constant DATASET_ADMIN_ROLE = keccak256("DATASET_ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct DatasetInfo {
        string name;
        string description;
        address owner;
        string dataHash; // Hash of the actual data
        string metadataHash; // IPFS hash for metadata
        uint256 createdAt;
        uint256 lastUpdated;
        uint256 version;
        bool isPublic;
        bool isVerified;
        uint256 accessPrice; // Price in wei to access dataset
        string[] tags;
        uint256 downloadCount;
        uint256 citationCount;
    }

    struct AccessRequest {
        address requester;
        uint256 datasetId;
        string purpose;
        uint256 requestedAt;
        bool isApproved;
        bool isPending;
        uint256 approvedAt;
    }

    struct DatasetVersion {
        uint256 version;
        string dataHash;
        string metadataHash;
        uint256 timestamp;
        string changeLog;
    }

    mapping(uint256 => DatasetInfo) public datasets;
    mapping(uint256 => mapping(address => bool)) public hasAccess;
    mapping(uint256 => AccessRequest[]) public accessRequests;
    mapping(uint256 => DatasetVersion[]) public datasetVersions;
    mapping(address => uint256[]) public ownerDatasets;
    mapping(string => uint256) public nameToDatasetId;
    
    uint256 public nextDatasetId;
    uint256[] public allDatasets;
    
    event DatasetRegistered(
        uint256 indexed datasetId,
        address indexed owner,
        string name,
        string dataHash
    );
    
    event AccessGranted(
        uint256 indexed datasetId,
        address indexed user,
        address indexed grantor
    );
    
    event AccessRequested(
        uint256 indexed datasetId,
        address indexed requester,
        string purpose
    );
    
    event DatasetUpdated(
        uint256 indexed datasetId,
        uint256 newVersion,
        string newDataHash
    );
    
    event DatasetVerified(uint256 indexed datasetId, bool verified);
    event DatasetDownloaded(uint256 indexed datasetId, address indexed downloader);

    modifier onlyDatasetOwner(uint256 _datasetId) {
        require(datasets[_datasetId].owner == msg.sender, "Not dataset owner");
        _;
    }

    modifier datasetExists(uint256 _datasetId) {
        require(_datasetId < nextDatasetId, "Dataset does not exist");
        _;
    }

    constructor() Ownable(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DATASET_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        nextDatasetId = 1;
    }

    /**
     * @dev Register a new dataset
     * @param _name Name of the dataset
     * @param _description Description of the dataset
     * @param _dataHash Hash of the dataset content
     * @param _metadataHash IPFS hash for metadata
     * @param _isPublic Whether the dataset is publicly accessible
     * @param _accessPrice Price to access the dataset (0 for free)
     * @param _tags Array of tags for categorization
     */
    function registerDataset(
        string memory _name,
        string memory _description,
        string memory _dataHash,
        string memory _metadataHash,
        bool _isPublic,
        uint256 _accessPrice,
        string[] memory _tags
    ) external nonReentrant returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_dataHash).length > 0, "Data hash cannot be empty");
        require(nameToDatasetId[_name] == 0, "Dataset name already exists");

        uint256 datasetId = nextDatasetId++;

        datasets[datasetId] = DatasetInfo({
            name: _name,
            description: _description,
            owner: msg.sender,
            dataHash: _dataHash,
            metadataHash: _metadataHash,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            version: 1,
            isPublic: _isPublic,
            isVerified: false,
            accessPrice: _accessPrice,
            tags: _tags,
            downloadCount: 0,
            citationCount: 0
        });

        // Create initial version
        datasetVersions[datasetId].push(DatasetVersion({
            version: 1,
            dataHash: _dataHash,
            metadataHash: _metadataHash,
            timestamp: block.timestamp,
            changeLog: "Initial version"
        }));

        nameToDatasetId[_name] = datasetId;
        ownerDatasets[msg.sender].push(datasetId);
        allDatasets.push(datasetId);

        // Owner always has access to their own dataset
        hasAccess[datasetId][msg.sender] = true;

        emit DatasetRegistered(datasetId, msg.sender, _name, _dataHash);
        
        return datasetId;
    }

    /**
     * @dev Request access to a dataset
     * @param _datasetId ID of the dataset
     * @param _purpose Purpose for accessing the dataset
     */
    function requestAccess(
        uint256 _datasetId,
        string memory _purpose
    ) external payable datasetExists(_datasetId) nonReentrant {
        DatasetInfo storage dataset = datasets[_datasetId];
        require(!hasAccess[_datasetId][msg.sender], "Already has access");
        require(msg.sender != dataset.owner, "Owner already has access");

        if (dataset.isPublic && dataset.accessPrice > 0) {
            require(msg.value >= dataset.accessPrice, "Insufficient payment");
            
            // Grant access immediately for public paid datasets
            hasAccess[_datasetId][msg.sender] = true;
            
            // Transfer payment to dataset owner
            payable(dataset.owner).transfer(msg.value);
            
            emit AccessGranted(_datasetId, msg.sender, dataset.owner);
        } else if (dataset.isPublic && dataset.accessPrice == 0) {
            // Grant access immediately for free public datasets
            hasAccess[_datasetId][msg.sender] = true;
            emit AccessGranted(_datasetId, msg.sender, dataset.owner);
        } else {
            // Private dataset - requires approval
            accessRequests[_datasetId].push(AccessRequest({
                requester: msg.sender,
                datasetId: _datasetId,
                purpose: _purpose,
                requestedAt: block.timestamp,
                isApproved: false,
                isPending: true,
                approvedAt: 0
            }));

            emit AccessRequested(_datasetId, msg.sender, _purpose);
        }
    }

    /**
     * @dev Grant access to a user (for private datasets)
     * @param _datasetId ID of the dataset
     * @param _user Address of the user to grant access
     * @param _requestIndex Index of the access request (if applicable)
     */
    function grantAccess(
        uint256 _datasetId,
        address _user,
        uint256 _requestIndex
    ) external datasetExists(_datasetId) onlyDatasetOwner(_datasetId) {
        require(!hasAccess[_datasetId][_user], "User already has access");

        hasAccess[_datasetId][_user] = true;

        // Update request status if applicable
        if (_requestIndex < accessRequests[_datasetId].length) {
            AccessRequest storage request = accessRequests[_datasetId][_requestIndex];
            if (request.requester == _user && request.isPending) {
                request.isApproved = true;
                request.isPending = false;
                request.approvedAt = block.timestamp;
            }
        }

        emit AccessGranted(_datasetId, _user, msg.sender);
    }

    /**
     * @dev Update dataset with new version
     * @param _datasetId ID of the dataset
     * @param _newDataHash New data hash
     * @param _newMetadataHash New metadata hash
     * @param _changeLog Description of changes
     */
    function updateDataset(
        uint256 _datasetId,
        string memory _newDataHash,
        string memory _newMetadataHash,
        string memory _changeLog
    ) external datasetExists(_datasetId) onlyDatasetOwner(_datasetId) {
        require(bytes(_newDataHash).length > 0, "Data hash cannot be empty");

        DatasetInfo storage dataset = datasets[_datasetId];
        dataset.dataHash = _newDataHash;
        dataset.metadataHash = _newMetadataHash;
        dataset.lastUpdated = block.timestamp;
        dataset.version++;

        // Add new version to history
        datasetVersions[_datasetId].push(DatasetVersion({
            version: dataset.version,
            dataHash: _newDataHash,
            metadataHash: _newMetadataHash,
            timestamp: block.timestamp,
            changeLog: _changeLog
        }));

        emit DatasetUpdated(_datasetId, dataset.version, _newDataHash);
    }

    /**
     * @dev Verify a dataset (only by verifiers)
     * @param _datasetId ID of the dataset
     * @param _verified Verification status
     */
    function verifyDataset(
        uint256 _datasetId,
        bool _verified
    ) external datasetExists(_datasetId) onlyRole(VERIFIER_ROLE) {
        datasets[_datasetId].isVerified = _verified;
        emit DatasetVerified(_datasetId, _verified);
    }

    /**
     * @dev Record dataset download (for analytics)
     * @param _datasetId ID of the dataset
     */
    function recordDownload(uint256 _datasetId) external datasetExists(_datasetId) {
        require(hasAccess[_datasetId][msg.sender], "No access to dataset");
        
        datasets[_datasetId].downloadCount++;
        emit DatasetDownloaded(_datasetId, msg.sender);
    }

    /**
     * @dev Update citation count
     * @param _datasetId ID of the dataset
     * @param _count New citation count
     */
    function updateCitationCount(
        uint256 _datasetId,
        uint256 _count
    ) external datasetExists(_datasetId) onlyRole(DATASET_ADMIN_ROLE) {
        datasets[_datasetId].citationCount = _count;
    }

    /**
     * @dev Get dataset information
     * @param _datasetId ID of the dataset
     * @return DatasetInfo struct
     */
    function getDataset(uint256 _datasetId) external view datasetExists(_datasetId) returns (DatasetInfo memory) {
        return datasets[_datasetId];
    }

    /**
     * @dev Get dataset versions
     * @param _datasetId ID of the dataset
     * @return Array of DatasetVersion structs
     */
    function getDatasetVersions(uint256 _datasetId) external view datasetExists(_datasetId) returns (DatasetVersion[] memory) {
        return datasetVersions[_datasetId];
    }

    /**
     * @dev Get access requests for a dataset
     * @param _datasetId ID of the dataset
     * @return Array of AccessRequest structs
     */
    function getAccessRequests(uint256 _datasetId) external view datasetExists(_datasetId) returns (AccessRequest[] memory) {
        require(
            datasets[_datasetId].owner == msg.sender || hasRole(DATASET_ADMIN_ROLE, msg.sender),
            "Not authorized to view access requests"
        );
        return accessRequests[_datasetId];
    }

    /**
     * @dev Get datasets owned by an address
     * @param _owner Address of the owner
     * @return Array of dataset IDs
     */
    function getOwnerDatasets(address _owner) external view returns (uint256[] memory) {
        return ownerDatasets[_owner];
    }

    /**
     * @dev Check if user has access to dataset
     * @param _datasetId ID of the dataset
     * @param _user Address of the user
     * @return Whether user has access
     */
    function checkAccess(uint256 _datasetId, address _user) external view returns (bool) {
        return hasAccess[_datasetId][_user];
    }

    /**
     * @dev Get all dataset IDs
     * @return Array of all dataset IDs
     */
    function getAllDatasets() external view returns (uint256[] memory) {
        return allDatasets;
    }

    /**
     * @dev Get total number of datasets
     * @return Total dataset count
     */
    function getTotalDatasets() external view returns (uint256) {
        return nextDatasetId - 1;
    }

    /**
     * @dev Add verifier role to an address
     * @param _verifier Address to add as verifier
     */
    function addVerifier(address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(VERIFIER_ROLE, _verifier);
    }

    /**
     * @dev Remove verifier role from an address
     * @param _verifier Address to remove verifier role from
     */
    function removeVerifier(address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(VERIFIER_ROLE, _verifier);
    }
}
