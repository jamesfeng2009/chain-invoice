"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getContract } from "thirdweb";
import { useSendTransaction, useActiveAccount } from "thirdweb/react";
import { client } from "@/lib/client";
import { chain } from "@/lib/chain";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { formatAddress } from "@/lib/utils";
import { preparePayInvoice, formatWeiToEth } from "@/lib/contract";
import { InvoiceStatus } from "@/types/contract";
import {
  FileText, ArrowLeft, Loader2, CheckCircle, Copy, Wallet,
  Store, Wallet as WalletIcon, Calendar, FileText as FileDescription, Database, History, AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";

const contract = getContract({
  client,
  chain,
  address: CONTRACT_ADDRESS,
});

export default function PaymentConfirmationPage() {
  const { tokenId } = useParams();
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isPaying } = useSendTransaction();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [estimatedGasWei, setEstimatedGasWei] = useState<bigint>(BigInt(0));
  const [isBalanceSufficient, setIsBalanceSufficient] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 读取合约发票数据（使用 getInvoice）
  const [invoiceData] = useState<{
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

  // 从合约获取发票数据
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        // 这里需要实际调用合约获取数据
        // 在真实场景中，需要使用 useReadContract hook
        // 这里简化处理，直接设置默认值
        setIsLoading(false);
      } catch (err) {
        console.error("获取发票数据失败:", err);
        setError(err instanceof Error ? err : new Error("获取发票数据失败"));
        setIsLoading(false);
      }
    };

    if (tokenId) {
      fetchInvoiceData();
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
  const isPaid = status === "Paid";

  // 估算 Gas 费用
  useEffect(() => {
    const estimateGas = async () => {
      if (!account || !merchantAddress) return;

      try {
        // 简化 Gas 估算：假设 21000 gas * 20 gwei
        const estimatedGasPrice = BigInt(20000000000); // 20 gwei
        const estimatedGasLimit = BigInt(21000);
        const gasCostWei = estimatedGasPrice * estimatedGasLimit;

        setEstimatedGasWei(gasCostWei);

        // 假设用户有足够余额进行 UI 展示
        setIsBalanceSufficient(true);
      } catch (error) {
        console.error("Gas 估算失败:", error);
        setEstimatedGasWei(BigInt(0));
      }
    };

    estimateGas();
  }, [account, merchantAddress]);

  // 支付处理函数
  const handlePayment = async () => {
    if (!account) {
      alert("请先连接钱包");
      return;
    }

    // 再次检查余额
    if (!isBalanceSufficient) {
      alert("余额不足，无法完成支付");
      return;
    }

    try {
      // 使用合约的 payInvoice 函数
      const transaction = preparePayInvoice(
        contract,
        BigInt(tokenId as string),
        invoiceData.amount
      );

      sendTransaction(transaction, {
        onSuccess: (result) => {
          setPaymentSuccess(true);
          setTxHash(result.transactionHash || "");
          alert("支付成功！交易已提交至区块链");
        },
        onError: (error) => {
          console.error("支付失败", error);
          alert("支付失败，请检查余额或网络");
        },
      });
    } catch (err) {
      console.error(err);
      alert("支付过程中出现错误");
    }
  };

  // 计算总需要金额（发票金额 + Gas 费）
  const totalRequiredWei = invoiceData.amount + estimatedGasWei;
  const totalRequired = parseFloat(formatWeiToEth(totalRequiredWei));
  const gasInEth = parseFloat(formatWeiToEth(estimatedGasWei));
  // 假设有足够余额用于显示
  const assumedBalanceWei = invoiceData.amount + estimatedGasWei * BigInt(10);

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

  // 如果已支付，显示成功状态
  if (isPaid || paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-sans transition-colors duration-200 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2632] px-6 py-3 lg:px-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-8 text-[#137fec] flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">BlockBill</h2>
          </div>
          {account && (
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#137fec] hover:bg-blue-600 transition-colors text-slate-50 text-sm font-bold leading-normal tracking-[0.015em] shadow-md shadow-blue-500/20">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="truncate font-mono">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)} (已连接)
                </span>
              </span>
            </button>
          )}
        </header>

        {/* Main Content */}
        <div className="layout-container flex h-full grow flex-col items-center pt-6 pb-12 px-4 md:px-6">
          <div className="layout-content-container flex flex-col w-full max-w-[800px] flex-1">
            {/* Breadcrumb */}
            <Link
              href={`/invoice/${tokenId}`}
              className="group inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal pb-4 pt-1 hover:text-[#137fec] transition-colors w-fit"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>返回发票详情 (Back to Invoice)</span>
            </Link>

            {/* Success Card */}
            <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-black/30 border border-slate-200 dark:border-slate-700 overflow-hidden relative">
              <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-emerald-400"></div>
              <div className="p-6 md:p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">支付成功！</h1>
                  <p className="text-slate-500 dark:text-slate-400">您的发票已成功支付</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">发票编号</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">#INV-{tokenId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">支付金额</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{amount} {currency}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">交易哈希</p>
                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <p className="font-mono text-sm text-slate-700 dark:text-slate-300 truncate">{txHash}</p>
                        <button
                          onClick={() => navigator.clipboard.writeText(txHash)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[#137fec] transition-colors"
                          title="Copy Hash"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#137fec] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    在 Etherscan 上查看交易
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            href={`/invoice/${tokenId}`}
            className="group inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal pb-4 pt-1 hover:text-[#137fec] transition-colors w-fit"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>返回发票详情 (Back to Invoice)</span>
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

          {/* Payment Info & Balance */}
          <div className="mt-6 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">预估 Gas 费</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{gasInEth.toFixed(6)} ETH</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">当前余额</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {parseFloat(formatWeiToEth(assumedBalanceWei)).toFixed(4)} ETH (估算)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">需要总额</span>
              <span className="text-sm font-bold text-[#137fec]">
                {totalRequired.toFixed(6)} ETH
              </span>
            </div>
            {!isBalanceSufficient && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">余额不足</p>
                  <p className="text-xs text-red-600 dark:text-red-500">
                    请确保钱包余额至少为 {totalRequired.toFixed(4)} ETH
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-6 w-full">
            {account ? (
              isClient ? (
                <button
                  onClick={handlePayment}
                  disabled={isPaying || !isBalanceSufficient}
                  className="group relative w-full overflow-hidden rounded-xl bg-[#137fec] p-4 transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.99] disabled:bg-slate-400 disabled:shadow-none"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {isPaying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-lg font-bold text-white">正在处理交易...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        <span className="text-lg font-bold text-white">立即支付 {amount} {currency} (Pay Now)</span>
                      </>
                    )}
                  </div>
                  {/* Subtle shine effect */}
                  {!isPaying && (
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
                  )}
                </button>
              ) : (
                <div className="w-full p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center">
                  <Wallet className="w-12 h-12 mx-auto text-slate-400 mb-4" />
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
                  <Wallet className="w-5 h-5" />
                  <span className="text-lg font-bold text-white">请连接钱包</span>
                </div>
              </button>
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
                <ArrowLeft className="w-4 h-4 rotate-180 opacity-50" />
              </a>
              <a
                href="ipfs://QmXxZqYhZpFJrK7Jv7Gq9XyX9zYzY9xY9xY9xY9xY9xY9x"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2632] text-slate-600 dark:text-slate-300 hover:border-[#137fec]/50 hover:text-[#137fec] dark:hover:text-[#137fec] transition-all text-sm font-medium shadow-sm"
              >
                <Database className="w-5 h-5" />
                <span>元数据 (IPFS)</span>
                <ArrowLeft className="w-4 h-4 rotate-180 opacity-50" />
              </a>
              <a
                href={txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2632] text-slate-600 dark:text-slate-300 hover:border-[#137fec]/50 hover:text-[#137fec] dark:hover:text-[#137fec] transition-all text-sm font-medium shadow-sm"
              >
                <History className="w-5 h-5" />
                <span>铸造交易</span>
                <ArrowLeft className="w-4 h-4 rotate-180 opacity-50" />
              </a>
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
