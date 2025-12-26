// 智能合约函数封装
// 与用户提供的合约接口对应

import { prepareContractCall, toWei, toEther } from "thirdweb";
import type { ThirdwebContract } from "thirdweb";
import { InvoiceStatus } from "@/types/contract";
import type { Invoice } from "@/types/contract";

/**
 * 1. 创建发票 (createInvoice)
 * 创建发票。铸造 NFT，初始化 Invoice 结构体，并将元数据 URI 指向 IPFS。
 * 
 * @param contract - 合约实例
 * @param client - 客户地址
 * @param amount - 金额（单位：wei）
 * @param uri - 元数据 URI (IPFS)
 * @returns 交易准备对象
 */
export function prepareCreateInvoice(
  contract: ThirdwebContract,
  client: string,
  amount: bigint,
  uri: string
) {
  return prepareContractCall({
    contract,
    method: "function createInvoice(address _client, uint256 _amount, string _uri) external",
    params: [client, amount, uri],
  });
}

/**
 * 2. 支付发票 (payInvoice)
 * 支付发票 (Payable)。客户调用此函数并发送 ETH。
 * 逻辑：校验金额 -> 转账给商家 -> 修改状态为 Paid。
 * 
 * @param contract - 合约实例
 * @param tokenId - 发票 Token ID
 * @param value - 支付金额（单位：wei）
 * @returns 交易准备对象
 */
export function preparePayInvoice(
  contract: ThirdwebContract,
  tokenId: bigint,
  value: bigint
) {
  return prepareContractCall({
    contract,
    method: "function payInvoice(uint256 _tokenId) external payable",
    params: [tokenId],
    value,
  });
}

/**
 * 3. 作废发票 (cancelInvoice)
 * 作废发票。仅限 merchant 调用。
 * 逻辑：校验权限 -> 修改状态为 Cancelled。
 * 
 * @param contract - 合约实例
 * @param tokenId - 发票 Token ID
 * @returns 交易准备对象
 */
export function prepareCancelInvoice(
  contract: ThirdwebContract,
  tokenId: bigint
) {
  return prepareContractCall({
    contract,
    method: "function cancelInvoice(uint256 _tokenId) external",
    params: [tokenId],
  });
}

/**
 * 4. 更新元数据 (updateMetadata)
 * 更新元数据。例如商家修改了描述。
 * 
 * @param contract - 合约实例
 * @param tokenId - 发票 Token ID
 * @param newUri - 新的元数据 URI (IPFS)
 * @returns 交易准备对象
 */
export function prepareUpdateMetadata(
  contract: ThirdwebContract,
  tokenId: bigint,
  newUri: string
) {
  return prepareContractCall({
    contract,
    method: "function updateMetadata(uint256 _tokenId, string _newUri) external",
    params: [tokenId, newUri],
  });
}

/**
 * 5. 获取发票详情 (getInvoice)
 * 获取单张发票的所有业务属性。
 * 
 * @param contract - 合约实例
 * @param tokenId - 发票 Token ID
 * @returns 发票结构体
 */
export function prepareGetInvoice(
  contract: ThirdwebContract,
  tokenId: bigint
) {
  return prepareContractCall({
    contract,
    method: "function getInvoice(uint256 _tokenId) external view returns (address merchant, address client, uint256 amount, uint256 createdAt, uint8 status)",
    params: [tokenId],
  });
}

/**
 * 6. 获取商家创建的发票列表 (getInvoicesByMerchant)
 * 获取该商家创建的所有发票 Token ID 列表。
 *
 * @param contract - 合约实例
 * @param merchant - 商家地址
 * @returns Token ID 数组
 */
export function prepareGetInvoicesByMerchant(
  contract: ThirdwebContract,
  merchant: string
) {
  return prepareContractCall({
    contract,
    method: "function getInvoicesByMerchant(address _merchant) external view returns (uint256[])",
    params: [merchant],
  });
}

/**
 * 7. 获取客户收到的发票列表 (getInvoicesByClient)
 * 获取该客户收到的待处理发票列表。
 * 
 * @param contract - 合约实例
 * @param client - 客户地址
 * @returns Token ID 数组
 */
export function prepareGetInvoicesByClient(
  contract: ThirdwebContract,
  client: string
) {
  return prepareContractCall({
    contract,
    method: "function getInvoicesByClient(address _client) external view returns (uint256[])",
    params: [client],
  });
}

/**
 * 8. 检查发票是否已支付 (isInvoicePaid)
 * 快速校验。检查某发票是否已完成支付。
 * 
 * @param contract - 合约实例
 * @param tokenId - 发票 Token ID
 * @returns 是否已支付
 */
export function prepareIsInvoicePaid(
  contract: ThirdwebContract,
  tokenId: bigint
) {
  return prepareContractCall({
    contract,
    method: "function isInvoicePaid(uint256 _tokenId) external view returns (bool)",
    params: [tokenId],
  });
}

/**
 * 辅助函数：格式化发票状态
 */
export function formatInvoiceStatus(status: number | InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.Pending:
      return "Pending";
    case InvoiceStatus.Paid:
      return "Paid";
    case InvoiceStatus.Cancelled:
      return "Cancelled";
    default:
      return "Unknown";
  }
}

/**
 * 辅助函数：格式化金额（从 wei 转换为 ETH）
 */
export function formatWeiToEth(wei: bigint): string {
  return toEther(wei);
}

/**
 * 辅助函数：将 ETH 转换为 wei
 */
export function formatEthToWei(eth: number): bigint {
  return toWei(eth.toString());
}

/**
 * 辅助函数：格式化时间戳
 */
export function formatTimestamp(timestamp: bigint): Date {
  return new Date(Number(timestamp) * 1000);
}
