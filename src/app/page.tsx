"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { totalSupply } from "thirdweb/extensions/erc1155";
import { client } from "@/lib/client";
import { chain } from "@/lib/chain";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import {
  Menu, Shield, Zap, Cloud, Wallet, Send, CreditCard,
  PlayCircle, Info, X, Loader2, Receipt
} from "lucide-react";
import { useState, useEffect } from "react";

const contract = getContract({
  client,
  chain,
  address: CONTRACT_ADDRESS,
});

export default function Home() {
  const router = useRouter();
  const account = useActiveAccount();

  // 检测浏览器环境
  const [hasWallet, setHasWallet] = useState(false);

  // 获取全局统计数据
  const { data: totalInvoices, isLoading: statsLoading } = useReadContract(
    totalSupply,
    { contract, id: BigInt(0) }
  );

  useEffect(() => {
    // 检测是否安装 MetaMask 或其他 Web3 钱包
    setHasWallet(typeof window !== "undefined" && typeof (window as { ethereum?: unknown }).ethereum !== "undefined");
  }, []);

  // 处理进入应用按钮点击
  const handleEnterApp = () => {
    if (account) {
      // 已连接，直接跳转到 dashboard
      router.push("/dashboard");
    } else if (hasWallet) {
      // 未连接但有钱包，通过 ConnectButton 触发连接
      const connectButton = document.querySelector('[data-testid="connect-wallet-btn"]') as HTMLButtonElement;
      connectButton?.click();
    } else {
      // 未安装钱包，跳转到下载 MetaMask
      window.open("https://metamask.io/download/", "_blank");
    }
  };

  const totalInvoicesCount = totalInvoices ? Number(totalInvoices) : 0;

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#050505] text-slate-900 dark:text-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-[#f6f7f8]/80 dark:bg-[#050505]/80 backdrop-blur-md">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between mx-auto max-w-7xl">
          <Link href="/" className="flex flex-col items-center justify-center gap-0.5 group">
            <div className="size-9 relative">
              <svg className="w-full h-full drop-shadow-[0_0_8px_rgba(0,242,254,0.4)] transition-transform duration-300 group-hover:scale-105" fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="navLogoGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stop-color="#00F2FE"></stop>
                    <stop offset="100%" stop-color="#AC54F1"></stop>
                  </linearGradient>
                </defs>
                <path d="M32 6L56 18V46L32 58L8 46V18L32 6Z" stroke="url(#navLogoGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                <path d="M32 58V32" stroke="url(#navLogoGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                <path d="M56 18L32 32L8 18" stroke="url(#navLogoGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                <path d="M37 38L51 30" stroke="url(#navLogoGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                <path d="M37 44L51 36" stroke="url(#navLogoGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                <path d="M37 50L47 44" stroke="url(#navLogoGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
              </svg>
            </div>
            <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FE] to-[#AC54F1] text-lg font-bold leading-none tracking-tight">BlockBill</h2>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-8">
              <Link href="#features" className="text-slate-700 dark:text-slate-300 hover:text-[#137fec] dark:hover:text-[#137fec] text-sm font-medium transition-colors">功能特性</Link>
              <Link href="#" className="text-slate-700 dark:text-slate-300 hover:text-[#137fec] dark:hover:text-[#137fec] text-sm font-medium transition-colors">开发者文档</Link>
              <Link href="#" className="text-slate-700 dark:text-slate-300 hover:text-[#137fec] dark:hover:text-[#137fec] text-sm font-medium transition-colors">价格方案</Link>
            </nav>
            <button
              onClick={handleEnterApp}
              className="flex items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-[#137fec] hover:bg-blue-600 text-white text-sm font-bold transition-all shadow-lg shadow-[#137fec]/20"
            >
              进入应用
            </button>
          </div>
          <button className="md:hidden text-slate-900 dark:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full px-4 md:px-10 py-12 md:py-20 flex justify-center">
          <div className="max-w-7xl w-full">
            <div className="flex flex-col-reverse lg:flex-row gap-12 items-center">
              <div className="flex flex-col gap-6 flex-1 text-center lg:text-left">
                <h1 className="text-slate-900 dark:text-white text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
                  让你的 B2B 账单 <br className="hidden lg:block" />
                  <span className="text-[#137fec]">永存链上</span>，开票即结算
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  BlockBill 帮助企业将发票转化为可追踪、不可篡改的 NFT 凭证。无需第三方托管，支付即对账，开启去中心化财务管理新体验。
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  <Link
                    href="/create"
                    className="flex items-center justify-center rounded-lg h-12 px-8 bg-[#137fec] hover:bg-blue-600 text-white text-base font-bold shadow-lg shadow-[#137fec]/25 transition-all"
                  >
                    立即创建首张发票 →
                  </Link>
                  <button className="flex items-center justify-center rounded-lg h-12 px-8 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-base font-bold transition-all">
                    <PlayCircle className="w-5 h-5 mr-2" />
                    查看 Demo 视频
                  </button>
                </div>
                <p className="text-slate-500 dark:text-slate-500 text-sm font-medium pt-2">
                  <Info className="inline w-4 h-4 mr-1 align-middle" />
                  支持 Ethereum, Polygon, Sepolia 等主流网络
                </p>
              </div>
              <div className="flex-1 w-full max-w-lg lg:max-w-xl">
                <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="absolute inset-0 bg-[#137fec]/10 mix-blend-overlay"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-48 h-48 text-[#137fec]/30 dark:text-[#137fec]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global Stats Section */}
        <section className="w-full px-4 md:px-10 py-12">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard
                icon={<Receipt className="w-6 h-6 text-[#137fec]" />}
                value={statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : totalInvoicesCount.toLocaleString()}
                label="已处理发票"
              />
              <StatCard
                icon={<Wallet className="w-6 h-6 text-green-500" />}
                value="Sepolia"
                label="当前网络"
              />
              <StatCard
                icon={<Shield className="w-6 h-6 text-purple-500" />}
                value="ERC1155"
                label="NFT 标准"
              />
              <StatCard
                icon={<Cloud className="w-6 h-6 text-blue-500" />}
                value="IPFS"
                label="去中心化存储"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full px-4 md:px-10 py-16 md:py-24 bg-white dark:bg-slate-900/50" id="features">
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-12">
            <div className="flex flex-col gap-4 text-center md:text-left">
              <h2 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                核心优势
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl">
                利用区块链技术解决传统开票痛点，为企业提供更安全、高效的结算方案。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Shield className="w-8 h-8" />}
                title="🛡️ 不可篡改 (NFT)"
                description="每张发票都是唯一的 NFT，记录在区块链上，彻底杜绝假票风险。"
              />
              <FeatureCard
                icon={<Zap className="w-8 h-8" />}
                title="⚡ 极速结算 (P2P)"
                description="点对点智能合约支付，客户直接向你转账，无需平台中转，资金零延迟。"
              />
              <FeatureCard
                icon={<Cloud className="w-8 h-8" />}
                title="📂 去中心化存储 (IPFS)"
                description="发票详情内容永久存储在 IPFS 去中心化网络，安全且随时可查阅。"
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="w-full px-4 md:px-10 py-16 md:py-24">
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-16">
            <div className="text-center">
              <h2 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-4">
                如何工作
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                仅需三步，体验 Web3 时代的极速对账流程
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>
              <StepCard
                icon={<Wallet className="w-10 h-10" />}
                step="Step 1"
                title="铸造"
                description="连接钱包，输入金额与明细，一键生成 NFT 发票。"
              />
              <StepCard
                icon={<Send className="w-10 h-10" />}
                step="Step 2"
                title="发送"
                description="复制发票链接分享给客户，或直接发送至其钱包地址。"
              />
              <StepCard
                icon={<CreditCard className="w-10 h-10" />}
                step="Step 3"
                title="收款"
                description="客户链上确认支付，智能合约自动清算，资金实时到账。"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full px-4 md:px-10 py-20 bg-[#137fec] dark:bg-[#137fec]/90 text-white rounded-none md:rounded-3xl max-w-7xl mx-auto mb-0 md:mb-12 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
          <div className="relative z-10 flex flex-col items-center text-center gap-8">
            <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight max-w-3xl">
              准备好开启 Web3 财务管理<br />新时代了吗？
            </h2>
            <p className="text-blue-100 text-lg max-w-2xl">
              加入数千家前瞻性企业，体验去中心化发票带来的安全与便捷。
            </p>
            <div className="flex items-center justify-center rounded-lg h-14 px-10 bg-white text-[#137fec] hover:bg-blue-50 text-lg font-bold shadow-xl transition-all hover:scale-105 cursor-pointer">
              <Wallet className="w-6 h-6 mr-2" />
              立即连接钱包开始使用
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pt-16 pb-8">
        <div className="px-4 md:px-10 mx-auto max-w-7xl flex flex-col gap-12">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="flex flex-col gap-4 max-w-xs">
              <div className="flex flex-col items-center justify-center gap-0.5 self-start">
                <div className="size-10 relative">
                  <svg className="w-full h-full drop-shadow-[0_0_8px_rgba(0,242,254,0.4)]" fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="footerLogoGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" stop-color="#00F2FE"></stop>
                        <stop offset="100%" stop-color="#AC54F1"></stop>
                      </linearGradient>
                    </defs>
                    <path d="M32 6L56 18V46L32 58L8 46V18L32 6Z" stroke="url(#footerLogoGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                    <path d="M32 58V32" stroke="url(#footerLogoGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                    <path d="M56 18L32 32L8 18" stroke="url(#footerLogoGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                    <path d="M37 38L51 30" stroke="url(#footerLogoGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                    <path d="M37 44L51 36" stroke="url(#footerLogoGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                    <path d="M37 50L47 44" stroke="url(#footerLogoGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                  </svg>
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FE] to-[#AC54F1] font-bold text-xl leading-none tracking-tight">BlockBill</span>
              </div>
              <p className="text-slate-500 text-sm mt-2">
                BlockBill 是下一代去中心化 B2B 票据平台，致力于为全球企业提供透明、安全的链上结算服务。
              </p>
              <div className="flex gap-4 mt-2">
                <a className="text-slate-400 hover:text-[#137fec] transition-colors" href="#">
                  <X className="h-6 w-6" />
                </a>
                <a className="text-slate-400 hover:text-[#137fec] transition-colors" href="#">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.05-.015-2.055-3.33.72-4.035-1.605-4.035-1.605-.54-1.38-1.32-1.755-1.32-1.755-1.095-.75.075-.735.075-.735 1.2.09 1.83 1.245 1.83 1.245 1.065 1.83 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </a>
                <a className="text-slate-400 hover:text-[#137fec] transition-colors" href="#">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
              <FooterLinkColumn title="产品" links={["功能特性", "价格方案", "更新日志"]} />
              <FooterLinkColumn title="资源" links={["开发者文档", "API 参考", "社区指南"]} />
              <FooterLinkColumn title="公司" links={["关于我们", "联系我们", "加入我们"]} />
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">© 2025 BlockBill Inc. 保留所有权利。</p>
            <div className="flex gap-6">
              <a className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm" href="#">隐私政策</a>
              <a className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm" href="#">条款</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#f6f7f8] dark:bg-slate-800 p-8 hover:shadow-xl hover:shadow-[#137fec]/5 hover:border-[#137fec]/30 transition-all duration-300">
      <div className="size-12 rounded-lg bg-[#137fec]/10 flex items-center justify-center text-[#137fec] group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-slate-900 dark:text-white text-xl font-bold">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StepCard({ icon, step, title, description }: { icon: React.ReactNode; step: string; title: string; description: string }) {
  return (
    <div className="relative z-10 flex flex-col items-center text-center gap-6">
      <div className="size-24 rounded-full bg-white dark:bg-slate-800 border-4 border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-lg text-[#137fec]">
        {icon}
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[#137fec] font-bold tracking-wider uppercase text-sm">{step}</span>
        <h3 className="text-slate-900 dark:text-white text-xl font-bold">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-xs mx-auto">{description}</p>
      </div>
    </div>
  );
}

function FooterLinkColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-slate-900 dark:text-white font-bold">{title}</h4>
      {links.map((link) => (
        <a key={link} className="text-slate-500 hover:text-[#137fec] text-sm" href="#">
          {link}
        </a>
      ))}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode | string; label: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
