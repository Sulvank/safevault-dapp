import { useEffect, useState } from "react";
import { ethers } from "ethers";
import vaultAbi from "./abi/Vault.json";
import tokenAbi from "./abi/SafeToken.json";

const VAULT_ADDRESS = "0xTuDireccionDelVault";
const TOKEN_ADDRESS = "0xTuDireccionDelSafeToken";

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [vaultContract, setVaultContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [ethBalance, setEthBalance] = useState("0");
  const [safeTokenBalance, setSafeTokenBalance] = useState("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    if (account && vaultContract && tokenContract) {
      loadBalances();
    }
  }, [account, vaultContract, tokenContract]);

  const connectWallet = async () => {
    if (!provider) {
      console.error("Provider no inicializado");
      return;
    }
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
    const _signer = provider.getSigner();
    setSigner(_signer);
    setVaultContract(new ethers.Contract(VAULT_ADDRESS, vaultAbi, _signer));
    setTokenContract(new ethers.Contract(TOKEN_ADDRESS, tokenAbi, _signer));
  };

  const loadBalances = async () => {
    if (!signer || !provider || !account || !tokenContract) {
      console.error("Signer, provider, cuenta o contrato no inicializados");
      return;
    }
    const ethBal = await provider.getBalance(account);
    const tokenBal = await tokenContract.balanceOf(account);
    setEthBalance(ethers.utils.formatEther(ethBal));
    setSafeTokenBalance(ethers.utils.formatEther(tokenBal));
  };

  const handleDeposit = async () => {
  try {
    setIsLoading(true);
    if (!vaultContract) return;
    const tx = await vaultContract.deposit({ value: ethers.utils.parseEther(depositAmount) });
    await tx.wait();
    await loadBalances();
  } catch (error) {
    console.error("Error al depositar:", error);
  } finally {
    setIsLoading(false);
  }
};

  const handleWithdraw = async () => {
    try {
      if (!vaultContract) {
        console.error("VaultContract no inicializado");
        return;
      }
      const tx = await vaultContract.withdraw(ethers.utils.parseEther(withdrawAmount));
      await tx.wait();
      await loadBalances();
    } catch (error) {
      console.error("Error al retirar:", error);
    }
  };

  useEffect(() => {
    if (account && vaultContract && tokenContract) {
      loadBalances();
    }
  }, [account, vaultContract, tokenContract]);

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-center">
      {isLoading && <p>Procesando transacción...</p>}
      <h1 className="text-3xl font-bold mb-4">🛡️ SafeVault App</h1>

      {!account ? (
        <button onClick={connectWallet} className="bg-blue-600 text-white px-4 py-2 rounded">
          Conectar Wallet
        </button>
      ) : (
        <div>
          <p className="mb-2">👤 Conectado como: {account}</p>
          <p className="mb-2">💰 ETH: {ethBalance}</p>
          <p className="mb-4">🪙 SafeToken: {safeTokenBalance}</p>

          <div className="mb-4">
            <input
              type="number"
              placeholder="Cantidad a depositar (ETH)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="border p-2 mr-2 rounded"
            />
            <button onClick={handleDeposit} className="bg-green-600 text-white px-4 py-2 rounded">
              Depositar
            </button>
          </div>

          <div>
            <input
              type="number"
              placeholder="Cantidad a retirar (ETH)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="border p-2 mr-2 rounded"
            />
            <button onClick={handleWithdraw} className="bg-red-600 text-white px-4 py-2 rounded">
              Retirar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
