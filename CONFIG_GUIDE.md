# 环境变量配置指南

## 1. Thirdweb Client ID 配置

### 获取步骤：
1. 访问 https://thirdweb.com/
2. 注册/登录账号
3. 进入 Dashboard → Create → Project
4. 创建项目后，复制 Client ID

### 配置方法：
编辑 `.env.local` 文件：
```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=你的_client_id_这里
```

示例：
```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=a1b2c3d4e5f6...
```

---

## 2. 部署合约获取地址

### 准备工作：
1. 确保钱包有 Sepolia 测试 ETH
   - 获取测试币：https://sepoliafaucet.com/
   
2. 获取钱包私钥（0x 开头）
   - MetaMask: 账户详情 → 导出私钥
   - ⚠️ 警告：不要用主网钱包的私钥！

### 配置私钥：
编辑 `.env.local` 文件：
```env
PRIVATE_KEY=0x1234567890abcdef...
```

### 部署命令：
```bash
npm run deploy:sepolia
```

部署成功后，合约地址会自动写入 `.env.local` 文件：
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890abcdef...
```

---

## 3. 完整配置示例

```env
# Thirdweb Client ID
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=a1b2c3d4e5f6...

# 合约地址（部署后自动填充）
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef1234567890ab

# Sepolia RPC（默认值，无需修改）
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# 部署钱包私钥
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890ab

# Etherscan API Key（可选，用于验证合约）
ETHERSCAN_API_KEY=YourEtherscanApiKeyHere
```

---

## 4. 验证配置

部署完成后，重新启动开发服务器：
```bash
npm run dev
```

访问 http://localhost:3000，页面应该正常显示，统计卡片显示"已处理发票"数量。

---

## 5. 常见问题

### Q1: 如何获取私钥？
A1: MetaMask → 账户详情 → 导出私钥

### Q2: 如何获取 Sepolia 测试 ETH？
A2: 访问 https://sepoliafaucet.com/ 领取测试币

### Q3: Thirdweb Client ID 必须要吗？
A3: 前端需要用。如果不想注册，可以使用 ethers.js 直接连接，需要修改代码。

### Q4: 可以不配置直接运行吗？
A4: 可以，页面会显示"待配置"而不是实际发票数量。
