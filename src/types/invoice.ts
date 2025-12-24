// 前端表单相关类型定义
export interface InvoiceAttribute {
  trait_type: string;
  value: string;
}

export interface InvoiceMetadata {
  name: string;
  description: string;
  image: string;
  attributes: InvoiceAttribute[];
}

// 合约返回的发票数据（用于前端显示）
export interface InvoiceDisplayData {
  tokenId: bigint;
  merchant: string;
  client: string;
  amount: bigint;
  createdAt: bigint;
  status: number; // InvoiceStatus enum value
}

// 兼容旧版本的 NFT 类型（用于 backward compatibility）
export interface Invoice {
  tokenId: string;
  metadata: InvoiceMetadata;
  owner: string;
  supply: bigint;
}

export type InvoiceStatus = "Pending" | "Paid" | "Cancelled";

export interface CreateInvoiceForm {
  clientAddress: string;
  amount: string;
  description: string;
}
