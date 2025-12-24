# BlockBill Invoice Contract

基于 ERC-1155 标准的智能合约，用于创建和管理链上发票 NFT。

## 合约功能

### 写入函数
| 函数 | 权限 | 说明 |
|--------|--------|------|
| `createInvoice()` | 任何人 | 创建新发票（铸造 NFT） |
| `payInvoice()` | 客户 | 支付发票（发送 ETH 给商家） |
| `cancelInvoice()` | 商家 | 作废发票 |
| `updateMetadata()` | 商家 | 更新发票元数据 |

### 读取函数
| 函数 | 说明 |
|--------|------|
| `getInvoice()` | 获取单个发票详情 |
| `getInvoicesByMerchant()` | 获取商家创建的所有发票 |
| `getInvoicesByClient()` | 获取客户收到的发票 |
| `isInvoicePaid()` | 检查发票是否已支付 |

## 部署步骤

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入以下信息：
- `PRIVATE_KEY`: 部署者的私钥（不要泄露！）
- `SEPOLIA_RPC_URL`: Sepolia RPC URL
- `ETHERSCAN_API_KEY`: Etherscan API 密钥（可选）

### 3. 编译合约
```bash
npm run compile
```

### 4. 部署到 Sepolia 测试网
```bash
npm run deploy:sepolia
```

### 5. 部署到本地网络
```bash
# 终端 1: 启动本地节点
npm run node

# 终端 2: 部署合约
npm run deploy:local
```

### 6. 验证合约（自动执行）
如果提供了 `ETHERSCAN_API_KEY`，合约部署后会自动在 Etherscan 上验证。

## 部署后

部署成功后，脚本会自动将合约地址写入 `.env.local` 文件：

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef
```

### 更新前端配置
将 `.env.local` 中的合约地址复制到主 `.env` 文件（或 Next.js 环境变量）。

## 合约事件监听

前端可以监听以下事件来获取实时更新：

```javascript
contract.events.InvoiceMinted((error, event) => {
  // 发票创建事件
  const { tokenId, merchant, client, amount } = event.returnValues;
});

contract.events.InvoicePaid((error, event) => {
  // 发票支付事件
  const { tokenId, payer, amount } = event.returnValues;
});

contract.events.InvoiceCancelled((error, event) => {
  // 发票作废事件
  const { tokenId } = event.returnValues;
});

contract.events.MetadataUpdated((error, event) => {
  // 元数据更新事件
  const { tokenId, newUri } = event.returnValues;
});
```

## 安全特性

- ✅ **重入攻击防护**: 使用 `nonReentrant` 修饰符
- ✅ **访问控制**: 使用 `Ownable` 进行权限管理
- ✅ **转账限制**: 禁止 NFT 转账（通过 `safeTransferFrom` 返回 false）
- ✅ **参数验证**: 所有输入参数都经过 `require` 检查

## Gas 优化

- 优化器启用，runs: 200
- 使用 `storage` 关键字修改合约状态
- 批量操作减少 gas 消耗

## 测试

```bash
npx hardhat test
```

## License

MIT
