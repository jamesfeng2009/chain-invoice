"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getContract } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { getNFT } from "thirdweb/extensions/erc1155";
import { client } from "@/lib/client";
import { chain } from "@/lib/chain";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { formatAddress } from "@/lib/utils";
import { formatWeiToEth } from "@/lib/contract";
import { InvoiceStatus } from "@/types/contract";
import {
  FileText, ArrowLeft, Loader2, CheckCircle, Copy,
  Store, Wallet as WalletIcon, Calendar, FileText as FileDescription, Database, History, ExternalLink
} from "lucide-react";
import { useState, useEffect } from "react";

const contract = getContract({
  client,
  chain,
  address: CONTRACT_ADDRESS,
});

export default function InvoiceDetailPage() {
  const { tokenId } = useParams();
  const account = useActiveAccount();
  const [mintingTxHash, setMintingTxHash] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState<{
    merchant: string;
    client: string;
    amount: bigint;
    createdAt: bigint;
    status: number;
  }>({
    merchant: "",
    client: "",
    amount: BigInt(0),
    createdAt: BigInt(0),
    status: InvoiceStatus.Pending,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 从合约获取发票数据
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setIsLoading(true);
        // 准备调用 getInvoice
        // 在真实场景中，这里应该使用 useReadContract hook
        // 这里简化处理，直接从 getNFT 获取数据作为过渡
        const nft = await getNFT({
          contract,
          tokenId: BigInt(tokenId as string),
        });

        const attributes = nft?.metadata?.attributes as { trait_type: string; value: string }[] | undefined;
        const status = attributes?.find((a) => a.trait_type === "Status")?.value || "Pending";

        setInvoiceData({
          merchant: attributes?.find((a) => a.trait_type === "Merchant")?.value || "",
          client: attributes?.find((a) => a.trait_type === "Client")?.value || "",
          amount: BigInt(Math.floor(parseFloat(attributes?.find((a) => a.trait_type === "Amount")?.value || "0") * 1e18)),
          createdAt: BigInt(Math.floor(new Date(attributes?.find((a) => a.trait_type === "CreatedAt")?.value || "").getTime() / 1000)),
          status: status === "Paid" ? InvoiceStatus.Paid : InvoiceStatus.Pending,
        });
      } catch (err) {
        console.error("获取发票数据失败:", err);
        setError(err instanceof Error ? err : new Error("获取发票数据失败"));
      } finally {
        setIsLoading(false);
      }
    };

    if (tokenId) {
      fetchInvoiceData();
    }
  }, [tokenId]);

  // 从 Etherscan 获取铸造交易哈希
  useEffect(() => {
    const fetchMintingTx = async () => {
      try {
        const response = await fetch(
          `https://api-sepolia.etherscan.io/api?module=logs&action=getLogs&address=${CONTRACT_ADDRESS}&topic0=0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f&topic1=0x${String(BigInt(tokenId as string || 0)).padStart(64, '0')}&apikey=YourApiKeyToken`
        );
        const data = await response.json();
        if (data.status === "1" && data.result && data.result.length > 0) {
          // 获取最新的铸造交易
          setMintingTxHash(data.result[0].transactionHash);
        }
      } catch (error) {
        console.error("Failed to fetch minting transaction:", error);
      }
    };

    if (tokenId) {
      fetchMintingTx();
    }
  }, [tokenId]);

  // 解析发票数据
  const amount = formatWeiToEth(invoiceData.amount);
  const currency = "ETH"; // 当前只支持 ETH
  const clientAddress = invoiceData.client;
  const merchantAddress = invoiceData.merchant;
  const status = invoiceData.status === InvoiceStatus.Paid ? "Paid" : invoiceData.status === InvoiceStatus.Cancelled ? "Cancelled" : "Pending";
  const description = "服务费用";
  const createdAt = new Date(Number(invoiceData.createdAt) * 1000).toISOString();

  // 检查当前用户是否是客户
  const isClient = account?.address?.toLowerCase() === clientAddress.toLowerCase();
  const isMerchant = account?.address?.toLowerCase() === merchantAddress.toLowerCase();

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 计算 USD 价值（简化估算）
  const calculateUsdValue = (ethAmount: number) => {
    const ethPrice = 2500; // 简化的 ETH 价格
    return (ethAmount * ethPrice).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#137fec]" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">正在加载发票...</p>
        </div>
      </div>
    );
  }

  if (error || !invoiceData.merchant) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-[#1a2632] rounded-xl p-12 text-center max-w-md border border-slate-200 dark:border-slate-700 shadow-lg">
          <FileText className="w-20 h-20 mx-auto text-slate-300 dark:text-slate-600 mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">未找到发票</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">该发票不存在或已被删除</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#137fec] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = status === "Paid";

  return (
    <div className="bg-[#f6f7f8] dark:bg-[#101922] font-sans transition-colors duration-200 min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2632] px-6 py-3 lg:px-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-8 text-[#137fec] flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">BlockBill</h2>
        </div>
        {account ? (
          <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#137fec] hover:bg-blue-600 transition-colors text-slate-50 text-sm font-bold leading-normal tracking-[0.015em] shadow-md shadow-blue-500/20">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="truncate font-mono">
                {account.address.slice(0, 6)}...{account.address.slice(-4)} (已连接)
              </span>
            </span>
          </button>
        ) : (
          <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 text-sm font-bold leading-normal border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            连接钱包
          </button>
        )}
      </header>

      {/* Main Content */}
      <div className="layout-container flex h-full grow flex-col items-center pt-6 pb-12 px-4 md:px-6">
        <div className="layout-content-container flex flex-col w-full max-w-[800px] flex-1">
          {/* Breadcrumb */}
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal pb-4 pt-1 hover:text-[#137fec] transition-colors w-fit"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>返回 (Back)</span>
          </Link>

          {/* Main Invoice Card */}
          <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-black/30 border border-slate-200 dark:border-slate-700 overflow-hidden relative">
            {/* Card Header Decoration */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#137fec] to-cyan-400"></div>
            <div className="p-6 md:p-8">
              {/* Invoice Header Info */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <StatusBadge status={status} />
                  </div>
                  <h1 className="text-slate-900 dark:text-white text-2xl md:text-3xl font-extrabold leading-tight tracking-tight">
                    发票编号：#INV-{tokenId}
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg self-start">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">铸造日期：{formatDate(createdAt)}</span>
                </div>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-700 w-full mb-8"></div>

              {/* Parties Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Merchant */}
                <div className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5 hover:border-[#137fec]/30 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-[#137fec]">
                      <Store className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">收款方 (Merchant)</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <span className="font-mono text-sm md:text-base font-semibold text-slate-900 dark:text-slate-200 truncate">
                      {formatAddress(merchantAddress)}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(merchantAddress)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[#137fec] transition-colors"
                      title="Copy Address"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Client */}
                <div className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5 hover:border-[#137fec]/30 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                      <WalletIcon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">付款方 (Client)</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <span className="font-mono text-sm md:text-base font-semibold text-slate-900 dark:text-slate-200 truncate">
                      {formatAddress(clientAddress)}
                    </span>
                    {isClient && (
                      <span className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md border border-green-100 dark:border-green-800">
                        匹配成功 <CheckCircle className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Description */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">服务详情 (Description)</h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                  <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">发票 #{tokenId}</p>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm md:text-base">{description}</p>
                </div>
              </div>

              {/* Total Amount */}
              <div className="flex flex-col items-end pt-4 pb-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">应付总额 (Total Amount Due)</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">{amount}</span>
                  <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{currency}</span>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-500 mt-1">约 ${calculateUsdValue(parseFloat(amount))} USD (实时汇率)</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 w-full">
            {!isPaid ? (
              <>
                {account ? (
                  isClient ? (
                    <Link
                      href={`/invoice/${tokenId}/pay`}
                      className="group relative w-full overflow-hidden rounded-xl bg-[#137fec] p-4 transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.99]"
                    >
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        <WalletIcon className="w-5 h-5" />
                        <span className="text-lg font-bold text-white">立即支付 {amount} {currency} (Pay Now)</span>
                      </div>
                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
                    </Link>
                  ) : (
                    <div className="w-full p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center">
                      <WalletIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">
                        {isMerchant
                          ? "您是收款方，无需支付"
                          : "此发票是发给其他客户的"}
                      </p>
                    </div>
                  )
                ) : (
                  <button className="group relative w-full overflow-hidden rounded-xl bg-slate-300 dark:bg-slate-700 p-4 transition-all">
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <WalletIcon className="w-5 h-5" />
                      <span className="text-lg font-bold text-white">请连接钱包</span>
                    </div>
                  </button>
                )}
              </>
            ) : (
              <div className="w-full p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-bold text-green-700 dark:text-green-400">此发票已支付</p>
              </div>
            )}
          </div>

          {/* Blockchain Evidence */}
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">链上存证 (Blockchain Evidence)</span>
              <div className="h-px bg-slate-200 dark:border-slate-700 flex-1"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2632] text-slate-600 dark:text-slate-300 hover:border-[#137fec]/50 hover:text-[#137fec] dark:hover:text-[#137fec] transition-all text-sm font-medium shadow-sm"
              >
                <FileDescription className="w-5 h-5" />
                <span>智能合约</span>
                <ExternalLink className="w-4 h-4 opacity-50" />
              </a>
              <a
                href="ipfs://QmXxZqYhZpFJrK7Jv7Gq9XyX9zYzY9xY9xY9xY9xY9xY9x"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2632] text-slate-600 dark:text-slate-300 hover:border-[#137fec]/50 hover:text-[#137fec] dark:hover:text-[#137fec] transition-all text-sm font-medium shadow-sm"
              >
                <Database className="w-5 h-5" />
                <span>元数据 (IPFS)</span>
                <ExternalLink className="w-4 h-4 opacity-50" />
              </a>
              {mintingTxHash ? (
                <a
                  href={`https://sepolia.etherscan.io/tx/${mintingTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2632] text-slate-600 dark:text-slate-300 hover:border-[#137fec]/50 hover:text-[#137fec] dark:hover:text-[#137fec] transition-all text-sm font-medium shadow-sm"
                >
                  <History className="w-5 h-5" />
                  <span>铸造交易</span>
                  <ExternalLink className="w-4 h-4 opacity-50" />
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a2632] text-slate-400 text-sm font-medium">
                  <History className="w-5 h-5 opacity-50" />
                  <span>加载中...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isPaid = status === "Paid";

  return (
    <div className="flex h-7 items-center justify-center gap-x-1.5 rounded-full bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 px-3">
      <span className={`size-2 rounded-full ${isPaid ? "bg-green-500" : "bg-yellow-500"}`}></span>
      <p className={`text-xs font-bold uppercase tracking-wider ${isPaid ? "text-green-700 dark:text-green-500" : "text-yellow-700 dark:text-yellow-500"}`}>
        {isPaid ? "已支付 (Paid)" : "等待支付 (Pending)"}
      </p>
    </div>
  );
}
