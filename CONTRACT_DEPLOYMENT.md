# 智能合约部署指南

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
# 创建环境变量文件
cp .env.example .env.local

# 编辑 .env.local，填入您的私钥和其他配置
# 注意：.env.local 不会被提交到 Git
```

### 3. 部署到 Sepolia 测试网
```bash
npm run deploy:sepolia
```

### 4. 更新前端配置

部署成功后，合约地址会自动写入 `.env.local` 文件。您需要：

1. 将合约地址复制到 `.env` 文件（用于生产环境）
2. 或在部署平台（如 Vercel）中设置环境变量

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

## 前置要求

- Node.js >= 18
- Sepolia 测试网 ETH（用于支付 Gas）
- Etherscan API Key（用于合约验证，可选）

## 部署选项

### 选项 1: Sepolia 测试网（推荐）
```bash
npm run deploy:sepolia
```

### 选项 2: 本地开发网络
```bash
# 终端 1: 启动本地 Hardhat 节点
npm run node

# 终端 2: 部署合约
npm run deploy:local
```

## 验证合约

如果部署失败或需要验证：

```bash
# 手动验证合约
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# 查看部署的合约
npx hardhat run scripts/deploy.ts --network sepolia
```

## Gas 费用估算

| 操作 | 预估 Gas | 费用 (20 gwei) |
|------|-----------|----------------|
| 创建发票 | ~200,000 | ~0.004 ETH |
| 支付发票 | ~30,000 | ~0.0006 ETH |
| 作废发票 | ~25,000 | ~0.0005 ETH |
| 更新元数据 | ~28,000 | ~0.00056 ETH |

## 合约交互

### 通过前端

前端代码已经配置好与合约的交互：

- ✅ 创建发票 → `/create` 页面
- ✅ 查看发票 → `/invoice/[tokenId]` 页面
- ✅ 支付发票 → `/invoice/[tokenId]/pay` 页面
- ✅ 商家仪表盘 → `/dashboard` 页面

### 通过 Hardhat Console

```bash
npx hardhat console --network sepolia
```

```javascript
const BlockBillInvoice = await ethers.getContractFactory("BlockBillInvoice");
const contract = await BlockBillInvoice.attach("0x...");

// 创建发票
const tx = await contract.createInvoice(
  "0xclientAddress",
  ethers.parseEther("0.5"),
  "ipfs://..."
);
console.log("Token ID:", await tx.wait());

// 查询发票
const invoice = await contract.getInvoice(1);
console.log("Amount:", ethers.formatEther(invoice.amount));
```

## 故障排查

### 错误: "Account not funded"
- 检查您的钱包是否有足够的 Sepolia ETH
- 获取测试币：https://sepoliafaucet.com/

### 错误: "Contract verification failed"
- 检查 `ETHERSCAN_API_KEY` 是否正确
- 等待几分钟后重试
- 检查合约是否已在链上部署

### 错误: "Nonce too high"
- 重置您的部署钱包
- 或使用新的钱包地址部署

## 安全提醒

⚠️ **重要安全提示**：

1. **永远不要**将 `.env.local` 文件提交到 Git
2. **永远不要**在代码中硬编码私钥
3. **永远不要**使用主网私钥在测试网
4. **定期**轮换部署钱包密钥
5. **审计**合约代码后再部署到主网

## 下一步

部署完成后：

1. ✅ 测试合约功能
2. ✅ 集成到前端
3. ✅ 在 Etherscan 上验证
4. ✅ 编写部署文档

## 相关资源

- [OpenZeppelin 文档](https://docs.openzeppelin.com/)
- [Hardhat 文档](https://hardhat.org/docs)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Thirdweb 文档](https://portal.thirdweb.com/)
