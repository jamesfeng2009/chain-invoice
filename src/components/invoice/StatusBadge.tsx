import { Clock, CheckCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "Pending" | "Paid";
  size?: "sm" | "md" | "lg";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const isPaid = status === "Paid";

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        isPaid
          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
      } ${sizeClasses[size]}`}
    >
      {isPaid ? (
        <CheckCircle className={iconSizes[size]} />
      ) : (
        <Clock className={iconSizes[size]} />
      )}
      {isPaid ? "已支付" : "待支付"}
    </span>
  );
}
