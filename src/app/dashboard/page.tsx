"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getContract } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { getOwnedNFTs } from "thirdweb/extensions/erc1155";
import { client } from "@/lib/client";
import { chain } from "@/lib/chain";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { formatWeiToEth } from "@/lib/contract";
import { InvoiceStatus } from "@/types/contract";
import {
  FileText, Plus, Search, Receipt, Eye, Share, ChevronLeft, ChevronRight, Menu, Clock
} from "lucide-react";
import { formatAddress } from "@/lib/utils";

type InvoiceData = {
  id: string;
  merchant: string;
  client: string;
  amount: bigint;
  createdAt: bigint;
  status: number;
};

const contract = getContract({
  client,
  chain,
  address: CONTRACT_ADDRESS,
});

export default function Dashboard() {
  const account = useActiveAccount();

  // 状态管理
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const itemsPerPage = 5;

  // 获取 ETH 实时汇率 (从 CoinGecko API)
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        const data = await response.json();
        setEthPrice(data.ethereum?.usd || 2500);
      } catch (error) {
        console.error("Failed to fetch ETH price:", error);
        setEthPrice(2500); // 使用默认价格
      }
    };

    fetchEthPrice();
    // 每 60 秒更新一次汇率
    const interval = setInterval(fetchEthPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  // 转换 ETH 到 USD
  const ethToUsd = (ethAmount: number): string => {
    return (ethAmount * ethPrice).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // 从合约获取商家发票列表
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!account) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // 准备调用 getInvoicesByMerchant
        // 在实际场景中，这里应该使用 useReadContract hook
        // 这里简化处理，直接从 getOwnedNFTs 获取数据作为过渡
        const ownedNFTs = await getOwnedNFTs({
          contract,
          address: account.address,
        });

        // 转换 NFT 数据为发票数据
        const convertedInvoices = ownedNFTs.map((nft) => {
          const attributes = nft?.metadata?.attributes as { trait_type: string; value: string }[] | undefined;
          const status = attributes?.find((a) => a.trait_type === "Status")?.value || "Pending";
          return {
            id: nft.id.toString(),
            merchant: attributes?.find((a) => a.trait_type === "Merchant")?.value || account.address,
            client: attributes?.find((a) => a.trait_type === "Client")?.value || "",
            amount: BigInt(Math.floor(parseFloat(attributes?.find((a) => a.trait_type === "Amount")?.value || "0") * 1e18)),
            createdAt: BigInt(Math.floor(new Date(attributes?.find((a) => a.trait_type === "CreatedAt")?.value || "").getTime() / 1000)),
            status: status === "Paid" ? InvoiceStatus.Paid : InvoiceStatus.Pending,
          };
        });

        setInvoices(convertedInvoices);
      } catch (error) {
        console.error("获取发票列表失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [account]);

  // 筛选和排序
  let filteredInvoices = [...invoices];

  // 状态筛选
  if (statusFilter === "pending") {
    filteredInvoices = filteredInvoices.filter((inv) => inv.status === InvoiceStatus.Pending);
  } else if (statusFilter === "paid") {
    filteredInvoices = filteredInvoices.filter((inv) => inv.status === InvoiceStatus.Paid);
  } else if (statusFilter === "expired") {
    filteredInvoices = filteredInvoices.filter((inv) => inv.status === InvoiceStatus.Cancelled);
  }

  // 搜索筛选
  if (searchTerm) {
    filteredInvoices = filteredInvoices.filter((inv) =>
      inv.id.includes(searchTerm) ||
      inv.client.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // 排序
  if (sortBy === "amount-high") {
    filteredInvoices = [...filteredInvoices].sort((a, b) => Number(b.amount) - Number(a.amount));
  } else if (sortBy === "amount-low") {
    filteredInvoices = [...filteredInvoices].sort((a, b) => Number(a.amount) - Number(b.amount));
  } else {
    // 默认按日期最新排序
    filteredInvoices = [...filteredInvoices].sort((a, b) =>
      Number(b.createdAt) - Number(a.createdAt)
    );
  }

  // 计算统计数据
  const pendingEthTotal = filteredInvoices
    .filter((inv) => inv.status === InvoiceStatus.Pending)
    .reduce((sum, inv) => sum + Number(formatWeiToEth(inv.amount)), 0);

  const receivedEthTotal = filteredInvoices
    .filter((inv) => inv.status === InvoiceStatus.Paid)
    .reduce((sum, inv) => sum + Number(formatWeiToEth(inv.amount)), 0);

  const pendingTotal = pendingEthTotal.toFixed(4);
  const receivedTotal = receivedEthTotal.toFixed(4);

  const totalInvoices = filteredInvoices.length;

  // 分页
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-sans text-[#111827] dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#101922]">
        <div className="px-6 md:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#137fec] flex items-center justify-center text-white">
                <Receipt className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">BlockBill</h2>
            </div>
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 ml-4">
              <Link className="text-gray-600 dark:text-gray-400 hover:text-[#137fec] text-sm font-medium transition-colors" href="/">首页</Link>
              <Link className="text-[#137fec] text-sm font-bold transition-colors" href="/dashboard">仪表盘</Link>
              <Link className="text-gray-600 dark:text-gray-400 hover:text-[#137fec] text-sm font-medium transition-colors" href="#">历史记录</Link>
              <Link className="text-gray-600 dark:text-gray-400 hover:text-[#137fec] text-sm font-medium transition-colors" href="#">帮助</Link>
            </nav>
          </div>
          {/* User/Wallet Area */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Sepolia Testnet</span>
            </button>
            {account ? (
              <button className="flex items-center gap-2 h-9 px-3 rounded-lg bg-[#137fec]/10 hover:bg-[#137fec]/20 text-[#137fec] transition-colors">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-bold">{formatAddress(account.address)}</span>
              </button>
            ) : (
              <button className="flex items-center gap-2 h-9 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-bold">连接钱包</span>
              </button>
            )}
            <button className="md:hidden p-2 text-gray-600">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-6 md:px-10 py-8 space-y-8">
        {/* Page Heading & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#0d141b] dark:text-white">发票仪表盘</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">管理您的链上发票和财务概览</p>
          </div>
          <Link
            href="/create"
            className="group flex items-center justify-center gap-2 h-11 px-6 bg-[#137fec] hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all duration-200"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span className="text-sm font-bold">+ 创建新发票</span>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Card */}
          <div className="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Clock className="w-[100px] h-[100px] text-yellow-600" />
            </div>
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">待收总额</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-[#0d141b] dark:text-white tracking-tight">{pendingTotal}</span>
                <span className="text-lg font-bold text-gray-500 mb-1.5">ETH</span>
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">≈ ${ethToUsd(pendingEthTotal)} USD</span>
            </div>
          </div>

          {/* Received Card */}
          <div className="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText className="w-[100px] h-[100px] text-green-600" />
            </div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">已收总额</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-[#0d141b] dark:text-white tracking-tight">{receivedTotal}</span>
                <span className="text-lg font-bold text-gray-500 mb-1.5">ETH</span>
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">≈ ${ethToUsd(receivedEthTotal)} USD</span>
            </div>
          </div>

          {/* Total Card */}
          <div className="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Receipt className="w-[100px] h-[100px] text-[#137fec]" />
            </div>
            <div className="flex items-center gap-2 text-[#137fec]">
              <Receipt className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">发票总数</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-extrabold text-[#0d141b] dark:text-white tracking-tight">{totalInvoices}</span>
              <span className="text-lg font-bold text-gray-500 mb-1.5">张</span>
            </div>
          </div>
        </div>

        {/* Filters & Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#1a2632] p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索发票 ID 或地址..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] sm:text-sm"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none w-full md:w-40 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-[#137fec] text-sm font-medium"
              >
                <option value="all">状态：全部</option>
                <option value="pending">待支付</option>
                <option value="paid">已支付</option>
                <option value="expired">已过期</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
                <ChevronLeft className="w-4 h-4 rotate-90" />
              </div>
            </div>
            <div className="relative flex-1 md:flex-none">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none w-full md:w-40 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-[#137fec] text-sm font-medium"
              >
                <option value="latest">排序：最新</option>
                <option value="amount-high">金额：从高到低</option>
                <option value="amount-low">金额：从低到高</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
                <ChevronLeft className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">客户</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">金额</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">日期</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      正在加载发票...
                    </td>
                  </tr>
                ) : !account ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">请先连接钱包查看发票列表</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">暂无发票</p>
                        <Link
                          href="/create"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-[#137fec] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          创建第一张发票
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((invoice) => (
                    <InvoiceTableRow key={invoice.id} invoice={invoice} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredInvoices.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                显示 {startIndex + 1} 到 {Math.min(endIndex, filteredInvoices.length)} 条，共 {filteredInvoices.length} 条
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {[...Array(totalPages)].map((_, i) => i + 1).slice(0, 5).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === page
                        ? "bg-[#137fec] text-white text-sm font-bold"
                        : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 text-sm font-medium"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 5 && <span className="text-gray-400">...</span>}
                {totalPages > 5 && (
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 text-sm font-medium"
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function InvoiceTableRow({ invoice }: { invoice: InvoiceData }) {
  const getStatusBadge = (status: number) => {
    switch (status) {
      case InvoiceStatus.Pending:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
            <span className="w-1.5 h-1.5 mr-1.5 bg-yellow-500 rounded-full"></span>
            待支付
          </span>
        );
      case InvoiceStatus.Paid:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
            <span className="w-1.5 h-1.5 mr-1.5 bg-green-500 rounded-full"></span>
            已支付
          </span>
        );
      case InvoiceStatus.Cancelled:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
            <span className="w-1.5 h-1.5 mr-1.5 bg-red-500 rounded-full"></span>
            已作废
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
            未知
          </span>
        );
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  const formatDate = (timestamp: bigint) => {
    if (!timestamp) return "";
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "-");
  };

  const amount = formatWeiToEth(invoice.amount);

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#0d141b] dark:text-white">{invoice.id}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono">
        {formatAddress(invoice.client)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#0d141b] dark:text-white">
        {amount} ETH
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {formatDate(invoice.createdAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(invoice.status)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/invoice/${invoice.id}`}
            className="text-[#137fec] hover:text-blue-700 flex items-center gap-1"
          >
            <Eye className="w-5 h-5" />
            查看
          </Link>
          <button
            onClick={() => copyAddress(`${window.location.origin}/invoice/${invoice.id}`)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
          >
            <Share className="w-5 h-5" />
            分享
          </button>
        </div>
      </td>
    </tr>
  );
}
