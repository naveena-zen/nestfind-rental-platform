import { ethers } from 'ethers';
import { env } from '../config/env';

const RENTAL_ESCROW_ABI = [
  "function createEscrow(bytes32 agreementId, address owner) payable",
  "function confirmCompletion(bytes32 agreementId)",
  "function raiseDispute(bytes32 agreementId)",
  "function resolveDispute(bytes32 agreementId, uint8 resolution)",
  "function getEscrow(bytes32 agreementId) view returns (tuple(bytes32 agreementId, address renter, address owner, uint256 amount, uint8 status, bool renterConfirmed, bool ownerConfirmed, uint256 createdAt))"
];

let provider: ethers.JsonRpcProvider | null = null;

try {
  provider = new ethers.JsonRpcProvider(env.BLOCKCHAIN_RPC_URL);
} catch {
  provider = null;
}

export async function isBlockchainAvailable(): Promise<boolean> {
  if (!provider) return false;
  try {
    await provider.getBlockNumber();
    return !!env.ESCROW_CONTRACT_ADDRESS;
  } catch {
    return false;
  }
}

export async function createBlockchainEscrow(agreementId: string, ownerAddress: string, amountEth: string): Promise<string | null> {
  const active = await isBlockchainAvailable();
  if (!active || !provider || !env.ESCROW_CONTRACT_ADDRESS) {
    return null; // DB fallback
  }

  try {
    const signer = await provider.getSigner(0); // Uses node signer
    const contract = new ethers.Contract(env.ESCROW_CONTRACT_ADDRESS, RENTAL_ESCROW_ABI, signer);
    const bytes32Id = ethers.id(agreementId);
    const tx = await contract.createEscrow(bytes32Id, ownerAddress, {
      value: ethers.parseEther(amountEth),
    });
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.warn('[Blockchain] Failed to interact with contract, using DB fallback:', error);
    return null;
  }
}
