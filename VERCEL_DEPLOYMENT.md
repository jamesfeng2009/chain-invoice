# Vercel 部署指南

## 准备工作

### 1. 确保本地构建成功
```bash
npm run build
```

如果构建成功，可以继续部署到 Vercel。

### 2. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

| 环境变量 | 说明 | 示例 |
|-----------|------|--------|
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | Thirdweb Client ID | `a1b2c3d4e5f6...` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | 已部署的合约地址 | `0x1234567890abcdef...` |

**注意**：环境变量名称需要与 `vercel.json` 中定义的一致。

---

## 部署步骤

### 方法 1: 通过 Vercel CLI（推荐）

```bash
# 1. 安装 Vercel CLI（如果还没安装）
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署项目
vercel

# 按照提示操作：
# - Set up and deploy? Yes
# - Which scope? Your username
# - Link to existing project? No
# - What's your project's name? chain-invoice
# - In which directory is your code located? ./
```

### 方法 2: 通过 Vercel Dashboard

1. 访问 https://vercel.com/dashboard
2. 点击 "Add New Project"
3. 导入 GitHub 仓库（chain-invoice）
4. 配置环境变量（见上文）
5. 点击 "Deploy"

---

## 常见问题

### Q1: 构建失败，提示 peer dependency 错误？

**A1**: 已通过以下方式修复：

1. `package.json` 添加了 `overrides` 配置
2. 创建了 `.npmrc` 文件配置 npm 行为

如果仍然失败，可以尝试：

```bash
# 清理 node_modules 和锁文件
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build
```

### Q2: 环境变量如何配置？

**A2**: 在 Vercel Dashboard 中配置：

1. 进入项目 → Settings → Environment Variables
2. 添加变量：
   - `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` = `你的 Client ID`
   - `NEXT_PUBLIC_CONTRACT_ADDRESS` = `你的合约地址`
3. 确保选择对应的环境（Production / Preview / Development）

### Q3: 部署后页面显示"待配置"？

**A3**: 确保在 Vercel 中配置了 `NEXT_PUBLIC_CONTRACT_ADDRESS`。

如果合约未部署：

1. 配置 `PRIVATE_KEY` 到本地 `.env.local`
2. 运行 `npm run deploy:sepolia`
3. 部署成功后，复制合约地址
4. 将合约地址添加到 Vercel 环境变量

### Q4: Next.js 构建超时？

**A4**: 在 `vercel.json` 中添加以下配置：

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "nextjs"
}
```

---

## 验证部署

部署完成后：

1. 访问 Vercel 提供的域名（如 `https://chain-invoice.vercel.app`）
2. 检查页面是否正常加载
3. 测试连接钱包功能
4. 查看统计卡片是否显示正确的发票数量

---

## 重新部署

修改代码后重新部署：

```bash
# 推送到 GitHub
git add .
git commit -m "Update code"
git push

# Vercel 会自动触发重新部署
```

或者使用 CLI：

```bash
vercel --prod
```

---

## 注意事项

- ✅ `.env.local` 不会被提交到 Git
- ✅ 敏感变量（私钥）不要在 Vercel 中配置
- ✅ 只配置公开变量（`NEXT_PUBLIC_*` 前缀）
- ✅ 每次部署后检查应用是否正常运行
