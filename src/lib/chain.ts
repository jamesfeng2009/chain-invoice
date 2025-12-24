import { defineChain } from "thirdweb";

export const sepolia = defineChain({
  id: 11155111,
  rpc: "https://rpc.sepolia.org",
  nativeCurrency: {
    decimals: 18,
    name: "Sepolia Ether",
    symbol: "ETH",
  },
  blockExplorers: [
    {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io",
    },
  ],
  testnet: true,
});

export const chain = sepolia;
