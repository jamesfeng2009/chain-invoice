// 智能合约接口类型定义 (基于用户提供的合约接口)

export enum InvoiceStatus {
  Pending = 0,
  Paid = 1,
  Cancelled = 2,
}

export interface Invoice {
  merchant: string;    // 商家地址
  client: string;      // 客户地址
  amount: bigint;      // 应付金额 (以 wei 为单位)
  createdAt: bigint;   // 创建时间戳
  status: InvoiceStatus; // 当前状态
}

// 合约事件类型
export interface InvoiceMintedEvent {
  tokenId: bigint;
  merchant: string;
  client: string;
  amount: bigint;
}

export interface InvoicePaidEvent {
  tokenId: bigint;
  payer: string;
  amount: bigint;
}

export interface InvoiceCancelledEvent {
  tokenId: bigint;
}

// 创建发票参数
export interface CreateInvoiceParams {
  client: string;
  amount: bigint;
  uri: string;
}

// 更新元数据参数
export interface UpdateMetadataParams {
  tokenId: bigint;
  newUri: string;
}
