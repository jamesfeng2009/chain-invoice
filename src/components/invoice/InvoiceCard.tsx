import Link from "next/link";
import { formatAddress } from "@/lib/utils";
import { FileText, ExternalLink, Clock, CheckCircle } from "lucide-react";

type NFTAttribute = {
  trait_type: string;
  value: string;
};

type NFTMetadata = {
  description?: string;
  attributes?: NFTAttribute[];
};

interface NFT {
  id: bigint | string;
  metadata?: NFTMetadata;
}

interface InvoiceCardProps {
  nft: NFT;
}

export default function InvoiceCard({ nft }: InvoiceCardProps) {
  const tokenId = nft.id?.toString() || "0";
  const description = nft.metadata?.description || "无描述";
  const attributes = nft.metadata?.attributes as NFTAttribute[] | undefined;
  const amount = attributes?.find(a => a.trait_type === "Amount")?.value || "0";
  const currency = attributes?.find(a => a.trait_type === "Currency")?.value || "ETH";
  const clientAddress = attributes?.find(a => a.trait_type === "Client")?.value || "";
  const status = attributes?.find(a => a.trait_type === "Status")?.value || "Pending";
  const createdAt = attributes?.find(a => a.trait_type === "CreatedAt")?.value || "";

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <Link href={`/invoice/${tokenId}`} className="block hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Invoice #{tokenId}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {formatDate(createdAt)}
              </p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-1">
          {description}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">金额</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {amount} {currency}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">客户</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
              {formatAddress(clientAddress)}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-end">
          <span className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400">
            查看详情
            <ExternalLink className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isPaid = status === "Paid";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
        isPaid
          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
      }`}
    >
      {isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
      {isPaid ? "已支付" : "待支付"}
    </span>
  );
}
