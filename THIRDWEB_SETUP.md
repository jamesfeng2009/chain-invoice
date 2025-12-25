# 获取 Thirdweb Client ID 指南

## 步骤 1：注册 Thirdweb 账号

1. 访问 https://thirdweb.com/
2. 点击 "Sign in" 或 "Create account"
3. 使用邮箱、GitHub 或 Google 账号注册/登录

## 步骤 2：创建新项目

1. 登录后，进入 Dashboard
2. 点击 "Create" 或 "+" 按钮
3. 选择 "Project"
4. 填写项目信息：
   - Project Name: `chain-invoice` (或任意名称)
   - Chain: 选择 "Sepolia" (测试网)
   - Description: (可选)

## 步骤 3：获取 Client ID

1. 项目创建后，进入项目详情页
2. 在左侧菜单中找到 "Settings" 或 "API Keys"
3. 复制 "Client ID" 或 "clientId"

## 步骤 4：配置环境变量

复制 Client ID 后，更新 `.env.local` 文件：

```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=你复制的_client_id_这里
```

## 替代方案：使用第三方 RPC（无需 Thirdweb）

如果您不想使用 Thirdweb，可以使用其他方式连接到区块链：

1. **使用 ethers.js 直接连接**（推荐用于开发）
2. **使用 Infura 或 Alchemy** 获取 RPC URL
3. **使用公网 RPC**：https://rpc.sepolia.org

如需使用替代方案，请告诉我，我可以帮您修改代码。

## 注意事项

⚠️ **重要**：
- Client ID 可以在前端使用（`NEXT_PUBLIC_` 前缀表示公开变量）
- **不要**将 `.env.local` 提交到 Git
- **不要**在代码中硬编码 Client ID
