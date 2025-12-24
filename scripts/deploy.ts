import { ethers } from "hardhat";
import hre from "hardhat";
import fs from "fs";

async function main() {
  console.log("Deploying BlockBillInvoice contract...");

  const BlockBillInvoice = await ethers.getContractFactory("BlockBillInvoice");
  const contract = await BlockBillInvoice.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("BlockBillInvoice deployed to:", contractAddress);
  console.log("Transaction hash:", contract.deploymentTransaction()?.hash);

  // Verify on Etherscan (optional)
  if (hre.network.name !== "localhost" && process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations before verification...");
    await contract.deploymentTransaction()?.wait(5);

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified!");
    } catch (error) {
      console.error("Contract verification failed:", error);
    }
  }

  // Write contract address to .env file
  const envPath = ".env.local";
  
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    const contractAddressLine = `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}\n`;
    
    if (envContent.includes("NEXT_PUBLIC_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/g, contractAddressLine);
    } else {
      envContent += `\n${contractAddressLine}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`Contract address written to ${envPath}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
