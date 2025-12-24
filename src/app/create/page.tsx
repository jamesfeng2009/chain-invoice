"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getContract } from "thirdweb";
import { useSendTransaction, useActiveAccount } from "thirdweb/react";
import { client } from "@/lib/client";
import { chain } from "@/lib/chain";
import { CONTRACT_ADDRESS, DEFAULT_INVOICE_IMAGE } from "@/lib/constants";
import { type CreateInvoiceForm } from "@/types/invoice";
import { prepareCreateInvoice, formatEthToWei } from "@/lib/contract";
import {
  Receipt, ArrowLeft, Clipboard, Info, Coins, Fuel,
  Menu, CheckCircle, AlertCircle, Loader2
} from "lucide-react";

const contract = getContract({
  client,
  chain,
  address: CONTRACT_ADDRESS,
});

export default function CreateInvoice() {
  const router = useRouter();
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const [formData, setFormData] = useState<CreateInvoiceForm>({
    clientAddress: "",
    amount: "",
    description: "",
  });

  const [errors, setErrors] = useState<Partial<CreateInvoiceForm>>({});
  const [success, setSuccess] = useState(false);
  const [tokenId, setTokenId] = useState<string>("");
  const [currency, setCurrency] = useState("ETH");

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setFormData({ ...formData, clientAddress: text });
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  // 验证以太坊地址格式
  const isValidEthereumAddress = (address: string): boolean => {
    if (!address || address.length !== 42 || !address.startsWith("0x")) {
      return false;
    }
    // 基础十六进制验证
    const hexRegex = /^0x[a-fA-F0-9]{40}$/;
    return hexRegex.test(address);
  };

  // 清洗描述文本，防止元数据注入攻击
  const sanitizeDescription = (desc: string): string => {
    // 移除 HTML/JS 标签
    let cleaned = desc.replace(/<[^>]*>/g, "");
    // 移除潜在的脚本注入
    cleaned = cleaned.replace(/javascript:/gi, "");
    cleaned = cleaned.replace(/on\w+\s*=/gi, "");
    // 移除特殊字符，但保留常用的中文、英文、数字、标点
    cleaned = cleaned.replace(/[<>{}[\]\\]/g, "");
    // 限制长度
    return cleaned.trim().slice(0, 500);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateInvoiceForm> = {};

    if (!formData.clientAddress) {
      newErrors.clientAddress = "请输入客户钱包地址";
    } else if (!isValidEthereumAddress(formData.clientAddress)) {
      newErrors.clientAddress = "请输入有效的以太坊地址";
    } else if (account && formData.clientAddress.toLowerCase() === account.address.toLowerCase()) {
      newErrors.clientAddress = "客户地址不能与您的地址相同";
    }

    if (!formData.amount) {
      newErrors.amount = "请输入金额";
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = "金额必须大于 0";
    } else if (parseFloat(formData.amount) > 1000000) {
      newErrors.amount = "金额过大，请检查";
    }

    if (!formData.description) {
      newErrors.description = "请输入服务描述";
    } else if (formData.description.length < 5) {
      newErrors.description = "描述至少需要 5 个字符";
    } else if (formData.description.length > 500) {
      newErrors.description = "描述不能超过 500 个字符";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      alert("请先连接钱包");
      return;
    }

    if (!validateForm()) {
      return;
    }

    // 在实际项目中，这里应该将 metadata 上传到 IPFS
    // 简化起见，我们直接使用一个 URI 占位符
    const metadataUri = DEFAULT_INVOICE_IMAGE;

    try {
      // 使用合约的 createInvoice 函数
      const transaction = prepareCreateInvoice(
        contract,
        formData.clientAddress,
        formatEthToWei(parseFloat(formData.amount)),
        metadataUri
      );

      sendTransaction(transaction, {
        onSuccess: () => {
          // 从交易结果中提取 tokenId
          // 在实际实现中，tokenId 可能从事件日志中解析
          // 这里简化处理，使用时间戳作为临时 tokenId
          const tempTokenId = String(Date.now());
          setTokenId(tempTokenId);
          setSuccess(true);
        },
        onError: (error) => {
          console.error("创建发票失败:", error);
          alert("发票创建失败，请重试");
        },
      });
    } catch (error) {
      console.error("创建发票时出错:", error);
      alert("发生错误，请检查网络连接");
    }
  };

  // 成功后自动跳转
  useEffect(() => {
    if (success && tokenId) {
      setTimeout(() => {
        router.push(`/invoice/${tokenId}`);
      }, 2000);
    }
  }, [success, tokenId, router]);

  if (success) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 text-center max-w-md">
          <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">发票创建成功！</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">正在跳转到发票详情页...</p>
          <Link
            href={`/invoice/${tokenId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#137fec] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
          >
            查看发票
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-sans transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#101922]/90 backdrop-blur-md px-4 sm:px-10 py-3">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="size-8 flex items-center justify-center rounded bg-[#137fec]/10 text-[#137fec]">
            <Receipt className="w-6 h-6" />
          </div>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Web3 Invoice</h2>
        </div>
        <div className="hidden md:flex flex-1 justify-end gap-3">
          {account ? (
            <button className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-[#137fec] text-white text-sm font-bold leading-normal hover:bg-blue-600 transition-colors shadow-sm ring-1 ring-inset ring-[#137fec]/20">
              <span className="truncate font-mono">
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </span>
            </button>
          ) : (
            <button className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 text-sm font-bold leading-normal border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              连接钱包
            </button>
          )}
          <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 text-sm font-bold leading-normal border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            <span className="truncate">Sepolia</span>
          </button>
        </div>
        <button className="md:hidden text-slate-900 dark:text-white">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex justify-center py-8 px-4 md:px-12 lg:px-40">
        <div className="w-full max-w-[960px]">
          {/* Back Link */}
          <div className="mb-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-[#137fec] hover:text-blue-700 dark:hover:text-blue-400 text-sm font-medium leading-normal transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回仪表盘 (Back to Dashboard)
            </Link>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Card Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/80">
              <h1 className="text-slate-900 dark:text-white tracking-tight text-2xl md:text-[32px] font-bold leading-tight mb-2">
                创建新发票 (Create New Invoice)
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal leading-normal max-w-2xl">
                填写以下信息以铸造一份不可篡改的链上 NFT 发票作为收款凭证。
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
              {/* Section 1: Client Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-slate-900 dark:text-slate-200 text-lg font-bold">客户详情 (Client Details)</h3>
                  <Info className="text-slate-400 text-sm cursor-help" />
                </div>
                <label className="block">
                  <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal pb-2">客户钱包地址 (Client Wallet Address)</p>
                  <div className="flex w-full items-center rounded-lg shadow-sm">
                    <input
                      id="clientAddress"
                      type="text"
                      value={formData.clientAddress}
                      onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                      placeholder="0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
                      className={`form-input flex-1 block w-full rounded-l-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:border-[#137fec] focus:ring-[#137fec] sm:text-sm h-12 px-4 placeholder:text-slate-400 font-mono transition-colors ${
                        errors.clientAddress ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="inline-flex items-center px-4 h-12 border border-l-0 border-slate-300 dark:border-slate-600 rounded-r-lg bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-[#137fec] hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Clipboard className="w-5 h-5" />
                    </button>
                  </div>
                  {errors.clientAddress && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.clientAddress}
                    </p>
                  )}
                </label>
              </div>

              {/* Section 2: Payment Details */}
              <div className="space-y-4">
                <h3 className="text-slate-900 dark:text-slate-200 text-lg font-bold">费用明细 (Payment Details)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="block">
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal pb-2">收款金额 (Amount)</p>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.50"
                        className={`form-input block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:border-[#137fec] focus:ring-[#137fec] sm:text-sm h-12 px-4 placeholder:text-slate-400 ${
                          errors.amount ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                      />
                    </div>
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.amount}
                      </p>
                    )}
                  </label>
                  <label className="block">
                    <div className="flex justify-between items-baseline pb-2">
                      <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal">选择币种 (Currency)</p>
                      <span className="text-xs text-[#137fec] font-medium bg-[#137fec]/10 px-2 py-0.5 rounded">当前网络: Sepolia Testnet</span>
                    </div>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="form-select block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:border-[#137fec] focus:ring-[#137fec] sm:text-sm h-12 pl-4 pr-10"
                    >
                      <option value="ETH">ETH (Native)</option>
                      <option value="USDC">USDC (ERC-20)</option>
                      <option value="USDT">USDT (ERC-20)</option>
                      <option value="DAI">DAI (ERC-20)</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Section 3: Description */}
              <div className="space-y-4">
                <h3 className="text-slate-900 dark:text-slate-200 text-lg font-bold">服务备注 (Description)</h3>
                <label className="block">
                  <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal pb-2">项目描述 (Project Description)</p>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="例如：11月份 UI 设计服务费，包含 Landing Page 交付及 3 次迭代。"
                    className={`form-textarea block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white focus:border-[#137fec] focus:ring-[#137fec] sm:text-sm p-4 placeholder:text-slate-400 resize-none ${
                      errors.description ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-right">
                    {sanitizeDescription(formData.description).length}/500 characters
                  </p>
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.description}
                    </p>
                  )}
                </label>
              </div>

              {/* Section 4: On-chain Preview */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-900 dark:text-slate-200 text-lg font-bold">链上实时预览 (On-chain Preview)</h3>
                  <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-300">
                    NFT Metadata View
                  </span>
                </div>
                <div className="w-full rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#0d141b] p-6 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-50">
                    <Coins className="w-16 h-16 text-slate-200 dark:text-slate-800 rotate-12 select-none" />
                  </div>
                  <div className="relative z-10 font-mono text-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:gap-4">
                      <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0 uppercase tracking-wider text-xs font-bold pt-0.5">To:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-medium break-all">
                        {formData.clientAddress || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-4">
                      <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0 uppercase tracking-wider text-xs font-bold pt-0.5">Description:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {formData.description || "暂无描述"}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-4">
                      <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0 uppercase tracking-wider text-xs font-bold pt-0.5">Network:</span>
                      <span className="text-slate-700 dark:text-slate-300">Sepolia (ChainID: 11155111)</span>
                    </div>
                    <div className="my-4 h-px bg-slate-200 dark:bg-slate-700 w-full"></div>
                    <div className="flex flex-col sm:flex-row sm:gap-4 items-baseline">
                      <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0 uppercase tracking-wider text-xs font-bold">Total:</span>
                      <span className="text-[#137fec] text-xl font-bold">
                        {formData.amount || "0.00"} {currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full md:w-auto md:min-w-[320px] bg-[#137fec] hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>正在铸造...</span>
                      </>
                    ) : (
                      <>
                        <Coins className="w-5 h-5" />
                        <span>确认铸造并发送发票 (Confirm & Mint)</span>
                      </>
                    )}
                  </button>
                  <p className="text-slate-400 text-xs flex items-center gap-1">
                    <Fuel className="w-4 h-4" />
                    Estimated Gas: 0.0024 ETH
                  </p>
                  {!account && (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                      请先连接钱包以创建发票
                    </p>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
