"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/client";

export default function Web3ConnectButton() {
  return <ConnectButton client={client} theme="light" />;
}
