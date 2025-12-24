// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * BlockBill Invoice Contract
 * 基于 ERC-1155 标准的发票 NFT 合约
 * 
 * 功能：
 * - 创建发票（铸造 NFT）
 * - 支付发票
 * - 作废发票
 * - 更新元数据
 * - 查询发票信息
 */
contract BlockBillInvoice is ERC1155, Ownable, ReentrancyGuard {
    
    // ==================== 数据结构 ====================
    
    enum Status { Pending, Paid, Cancelled }
    
    struct Invoice {
        address merchant;    // 商家地址
        address client;      // 客户地址
        uint256 amount;      // 应付金额 (以 wei 为单位)
        uint256 createdAt;   // 创建时间戳
        Status status;       // 当前状态
    }
    
    // ==================== 状态变量 ====================
    
    uint256 private _nextTokenId = 1;
    
    // tokenId => Invoice
    mapping(uint256 => Invoice) public invoices;
    
    // 商家地址 => Token ID 列表
    mapping(address => uint256[]) public merchantInvoices;
    
    // 客户地址 => Token ID 列表
    mapping(address => uint256[]) public clientInvoices;
    
    // Token ID => 在商家列表中的索引
    mapping(uint256 => uint256) private _merchantInvoiceIndex;
    
    // Token ID => 在客户列表中的索引
    mapping(uint256 => uint256) private _clientInvoiceIndex;
    
    // Token ID => 自定义元数据 URI
    mapping(uint256 => string) private _tokenURIs;
    
    // ==================== 事件 ====================
    
    event InvoiceMinted(uint256 indexed tokenId, address indexed merchant, address client, uint256 amount);
    event InvoicePaid(uint256 indexed tokenId, address indexed payer, uint256 amount);
    event InvoiceCancelled(uint256 indexed tokenId);
    event MetadataUpdated(uint256 indexed tokenId, string newUri);
    
    // ==================== 构造函数 ====================
    
    constructor() ERC1155("") Ownable(msg.sender) {}
    
    // ==================== 写入函数 ====================
    
    /**
     * @dev 创建发票
     * @param _client 客户地址
     * @param _amount 发票金额 (wei)
     * @param _metadataUri 元数据 URI (IPFS)
     *
     * 逻辑：
     * 1. 铸造 NFT 给商家
     * 2. 初始化 Invoice 结构体
     * 3. 记录到商家和客户的列表
     */
    function createInvoice(
        address _client,
        uint256 _amount,
        string calldata _metadataUri
    ) external nonReentrant returns (uint256) {
        require(_client != address(0), "Invalid client address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_client != msg.sender, "Client cannot be merchant");

        uint256 tokenId = _nextTokenId++;

        // 存储元数据 URI
        _tokenURIs[tokenId] = _metadataUri;

        // 铸造 NFT 给商家（发行 1 份）
        _mint(msg.sender, tokenId, 1, "");

        // 初始化发票数据
        invoices[tokenId] = Invoice({
            merchant: msg.sender,
            client: _client,
            amount: _amount,
            createdAt: block.timestamp,
            status: Status.Pending
        });

        // 添加到商家列表
        _merchantInvoiceIndex[tokenId] = merchantInvoices[msg.sender].length;
        merchantInvoices[msg.sender].push(tokenId);

        // 添加到客户列表
        _clientInvoiceIndex[tokenId] = clientInvoices[_client].length;
        clientInvoices[_client].push(tokenId);

        emit InvoiceMinted(tokenId, msg.sender, _client, _amount);

        return tokenId;
    }
    
    /**
     * @dev 支付发票
     * @param _tokenId 发票 Token ID
     * 
     * 逻辑：
     * 1. 验证调用者是客户
     * 2. 验证金额匹配
     * 3. 转账给商家
     * 4. 修改状态为 Paid
     */
    function payInvoice(uint256 _tokenId) external payable nonReentrant {
        Invoice storage invoice = invoices[_tokenId];
        
        require(invoice.merchant != address(0), "Invoice does not exist");
        require(invoice.status == Status.Pending, "Invoice is not payable");
        require(msg.sender == invoice.client, "Only client can pay this invoice");
        require(msg.value == invoice.amount, "Incorrect payment amount");
        
        // 转账给商家
        (bool success, ) = payable(invoice.merchant).call{value: msg.value}("");
        require(success, "Payment transfer failed");
        
        // 更新状态
        invoice.status = Status.Paid;
        
        emit InvoicePaid(_tokenId, msg.sender, msg.value);
    }
    
    /**
     * @dev 作废发票
     * @param _tokenId 发票 Token ID
     * 
     * 逻辑：
     * 1. 验证调用者是商家
     * 2. 修改状态为 Cancelled
     */
    function cancelInvoice(uint256 _tokenId) external nonReentrant {
        Invoice storage invoice = invoices[_tokenId];
        
        require(invoice.merchant != address(0), "Invoice does not exist");
        require(msg.sender == invoice.merchant, "Only merchant can cancel");
        require(invoice.status == Status.Pending, "Cannot cancel paid or cancelled invoice");
        
        invoice.status = Status.Cancelled;
        
        emit InvoiceCancelled(_tokenId);
    }
    
    /**
     * @dev 更新元数据
     * @param _tokenId 发票 Token ID
     * @param _newUri 新的元数据 URI
     * 
     * 逻辑：
     * 1. 验证调用者是商家
     * 2. 更新 URI
     */
    function updateMetadata(uint256 _tokenId, string calldata _newUri) external {
        Invoice storage invoice = invoices[_tokenId];
        
        require(invoice.merchant != address(0), "Invoice does not exist");
        require(msg.sender == invoice.merchant, "Only merchant can update metadata");
        
        _tokenURIs[_tokenId] = _newUri;
        
        emit MetadataUpdated(_tokenId, _newUri);
    }
    
    /**
     * @dev 覆盖 ERC1155 的 uri 函数，返回自定义的 token URI
     */
    function uri(uint256 _tokenId) public view override returns (string memory) {
        string memory customUri = _tokenURIs[_tokenId];
        return bytes(customUri).length > 0 ? customUri : super.uri(_tokenId);
    }
    
    // ==================== 读取函数 ====================
    
    /**
     * @dev 获取单张发票的所有业务属性
     * @param _tokenId 发票 Token ID
     */
    function getInvoice(uint256 _tokenId) external view returns (
        address merchant,
        address client,
        uint256 amount,
        uint256 createdAt,
        uint8 status
    ) {
        Invoice storage invoice = invoices[_tokenId];
        require(invoice.merchant != address(0), "Invoice does not exist");
        
        return (
            invoice.merchant,
            invoice.client,
            invoice.amount,
            invoice.createdAt,
            uint8(invoice.status)
        );
    }
    
    /**
     * @dev 获取该商家创建的所有发票 Token ID 列表
     * @param _merchant 商家地址
     */
    function getInvoicesByMerchant(address _merchant) external view returns (uint256[] memory) {
        return merchantInvoices[_merchant];
    }
    
    /**
     * @dev 获取该客户收到的待处理发票列表
     * @param _client 客户地址
     */
    function getInvoicesByClient(address _client) external view returns (uint256[] memory) {
        return clientInvoices[_client];
    }
    
    /**
     * @dev 快速校验。检查某发票是否已完成支付
     * @param _tokenId 发票 Token ID
     */
    function isInvoicePaid(uint256 _tokenId) external view returns (bool) {
        Invoice storage invoice = invoices[_tokenId];
        return invoice.status == Status.Paid;
    }
    
    /**
     * @dev 获取下一个 Token ID（用于预览）
     */
    function getNextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
    
    /**
     * @dev 批量转账支持
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        require(false, "Transfers not allowed");
    }
    
    /**
     * @dev 单笔转账支持
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override {
        require(false, "Transfers not allowed");
    }
}
