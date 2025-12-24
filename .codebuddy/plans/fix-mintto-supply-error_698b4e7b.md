## Product Overview

修复 `src/app/create/page.tsx` 中的 TypeScript 类型错误，完善 `mintTo` 函数的参数配置，并优化事件日志解析逻辑。

## Core Features

- 修复 mintTo 函数缺少 supply 属性的 TypeScript 错误
- 将 supply 设置为 1n (BigInt) 以确保每张发票只铸造一个 NFT
- 优化事件日志解析逻辑，提升代码可读性和健壮性

## Tech Stack

- 前端框架：React + TypeScript
- 构建工具：Next.js（根据文件路径推断）
- 状态管理：React Hooks
- 区块链交互：支持 BigInt 类型的 Web3 库

## Implementation Details

### 修复方案

1. **问题定位**：`src/app/create/page.tsx` 第72行的 mintTo 函数调用
2. **修复内容**：在 mintTo 函数参数对象中添加 `supply: 1n` 属性
3. **类型验证**：确保 supply 属性符合 mintTo 函数的 TypeScript 类型定义
4. **日志解析优化**：检查并优化事件日志解析逻辑，提升代码质量

### 关键代码修改

```typescript
// 修复前
mintTo({
  to: recipient,
  // 缺少 supply 属性
});

// 修复后
mintTo({
  to: recipient,
  supply: 1n, // 每张发票只铸造一个 NFT
});
```

# Agent Extensions

<!-- 无需使用扩展，任务明确且直接 -->