# 智能合约编译错误修复指南

## 🔴 Critical: Node.js 版本不兼容

**错误信息**:
```
WARNING: You are currently using Node.js v23.11.0, which is not supported by Hardhat.
```

**影响**: Hardhat 无法正常编译合约

**解决方案**:

### 方案 1: 使用 Node.js v20 LTS（推荐）
```bash
# 使用 nvm（如果已安装）
nvm install 20
nvm use 20

# 或者使用 n（如果已安装）
n 20

# 验证版本
node --version
# 应该输出: v20.x.x.x
```

### 方案 2: 使用 Node.js v18 LTS（兼容）
```bash
nvm install 18
nvm use 18
```

---

## 🟡 Minor: ERC1155 URI 设置问题

**错误信息**:
```
TypeError: Wrong argument count for function call: 2 arguments given but expected 1.
   --> contracts/BlockBillInvoice.sol:92:13
```

**根本原因**:
ERC1155 的 `_setURI()` 函数只接受一个参数（URI），但代码中传了两个参数。

**修复方案**:

### 方案 1: 直接传递 URI 给 _mint（已实现）
```solidity
_mint(msg.sender, tokenId, 1, _uri);  // ✅ 已修复
```

### 方案 2: 添加自定义 URI Mapping（已实现）
```solidity
// 添加 mapping
mapping(uint256 => string) private _tokenURIs;

// 重写 _uri 函数
function _uri(uint256 _tokenId) internal view override returns (string memory) {
    string memory customUri = _tokenURIs[_tokenId];
    return bytes(customUri).length > 0 ? customUri : super._uri(_tokenId);
}

// createInvoice 中保存 URI
_tokenURIs[tokenId] = _uri;  // 需要在 createInvoice 中添加
```

---

## 修复后的代码结构

### createInvoice 函数
```solidity
function createInvoice(
    address _client,
    uint256 _amount,
    string calldata _uri
) external nonReentrant returns (uint256) {
    // ... 验证代码 ...
    
    uint256 tokenId = _nextTokenId++;
    
    // ✅ 直接传递 URI 给 _mint（正确方式）
    _mint(msg.sender, tokenId, 1, _uri);
    
    // ✅ 保存 URI 到自定义 mapping
    _tokenURIs[tokenId] = _uri;
    
    // ... 其余代码 ...
    
    return tokenId;
}
```

### updateMetadata 函数
```solidity
function updateMetadata(uint256 _tokenId, string calldata _newUri) external {
    // ... 验证代码 ...
    
    // ✅ 更新自定义 URI mapping
    _tokenURIs[_tokenId] = _newUri;
    
    emit MetadataUpdated(_tokenId, _newUri);
}
```

### _uri 函数重写
```solidity
function _uri(uint256 _tokenId) internal view override returns (string memory) {
    string memory customUri = _tokenURIs[_tokenId];
    return bytes(customUri).length > 0 ? customUri : super._uri(_tokenId);
}
```

---

## 完整的修复步骤

### 1. 切换到兼容的 Node.js 版本
```bash
nvm install 20
nvm use 20
```

### 2. 重新安装依赖
```bash
rm -rf node_modules package-lock.json
npm install
```

### 3. 编译合约
```bash
npx hardhat compile
```

### 4. 部署合约
```bash
npm run deploy:sepolia
```

---

## 验证修复

### 编译成功后应该看到：
```
Compiled 1 Solidity file successfully
```

### 部署成功后应该看到：
```
BlockBillInvoice deployed to: 0x...
Contract address written to .env.local
```

---

## 关键知识点

### ERC1155 标准注意事项
1. **_setURI** 只接受一个参数（全局 URI）
2. **_uri** 是内部函数，可以被重写以返回每个 token 的自定义 URI
3. **_mint** 接受 URI 参数作为第 4 个参数

### 硬依赖
- OpenZeppelin Contracts v5.1.0
- Hardhat v2.22.0
- Node.js v20.x 或 v18.x（推荐 v20 LTS）

---

## 故障排查

### 如果仍然无法编译：

1. 清理缓存
```bash
npx hardhat clean
npx hardhat compile
```

2. 检查 Solidity 版本
```bash
npx hardhat compile --force
```

3. 查看详细错误
```bash
npx hardhat compile --show-stack-traces
```

---

## 相关资源

- [Hardhat Node.js 兼容性](https://v2.hardhat.org/nodejs-versions)
- [ERC1155 标准](https://eips.ethereum.org/EIPS/eip-1155)
- [OpenZeppelin 文档](https://docs.openzeppelin.com/contracts/5.x/erc1155)
