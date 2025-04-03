import { useEffect, useState, useCallback  } from "react";
import { ethers } from "ethers";
import { formatEther, parseEther } from "ethers";

import vaultAbi from "./abi/Vault.json";
import tokenAbi from "./abi/SafeToken.json";
import type { Window } from "./assets/global.d.ts";

const VAULT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";
const TOKEN_ADDRESS = "0xfd029064c0d535290c4d1ba498da609f4533e59e";

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState("");
  const [vaultContract, setVaultContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const [ethBalance, setEthBalance] = useState("0");
  const [safeTokenBalance, setSafeTokenBalance] = useState("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  

  const loadBalances = useCallback(async () => {
    if (!signer || !provider || !account || !tokenContract) {
      console.error("Signer, provider, cuenta o contrato no inicializados");
      return;
    }
    const ethBal = await provider.getBalance(account);
    const tokenBal = await tokenContract.balanceOf(account);
    setEthBalance(formatEther(ethBal));
    setSafeTokenBalance(formatEther(tokenBal));
  }, [signer, provider, account, tokenContract]);

  // useEffect(() => {
  //   if ((window as Window).ethereum) {
  //     const _provider = new ethers.BrowserProvider((window as Window).ethereum);
  //     setProvider(_provider);
  //   } else {
  //     console.error("No se encontró un proveedor de Ethereum (como MetaMask)");
  //   }

  //   if (account && vaultContract && tokenContract) {
  //     loadBalances();
  //   }
  // }, [account, vaultContract, tokenContract, loadBalances]);

  useEffect(() => {
    if ((window as Window).ethereum) {
      const _provider = new ethers.BrowserProvider((window as Window).ethereum);
      setProvider(_provider);
    } else {
      console.error("No se encontró un proveedor de Ethereum (como MetaMask)");
    }
  }, []); // ← 🔥 se ejecuta una sola vez al montar


  useEffect(() => {
    if (account && vaultContract && tokenContract) {
      loadBalances();
    }
  }, [account, vaultContract, tokenContract, loadBalances]);



  const connectWallet = async () => {
    if (!provider) {
      console.error("Provider no inicializado");
      return;
    }

    if (isConnecting) {
      console.warn("Ya estás intentando conectar MetaMask...");
      return;
    }

    try {
      setIsConnecting(true);

      const accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) {
        throw new Error("No se detectó ninguna cuenta");
      }

      setAccount(accounts[0]);

      const _signer = await provider.getSigner();
      setSigner(_signer);
      setVaultContract(new ethers.Contract(VAULT_ADDRESS, vaultAbi, _signer));
      setTokenContract(new ethers.Contract(TOKEN_ADDRESS, tokenAbi, _signer));
    } catch (error) {
      console.error("❌ Error al conectar wallet:", error);
      alert("Error al conectar MetaMask. Asegúrate de aceptar la solicitud o no tenerla ya abierta.");
    } finally {
      setIsConnecting(false);
    }
  };



  const handleDeposit = async () => {
  try {
    setIsLoading(true);
    if (!vaultContract) return;
    const tx = await vaultContract.deposit({ value: parseEther(depositAmount) });
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
      const tx = await vaultContract.withdraw(parseEther(withdrawAmount));
      await tx.wait();
      await loadBalances();
    } catch (error) {
      console.error("Error al retirar:", error);
    }
  };

  return (
  <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-tr from-gray-50 to-white">
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl px-6 py-8">
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          🛡️ SafeVault
        </h1>

        {!account ? (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className={`w-full ${
              isConnecting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-900 hover:bg-blue-800"
            } text-white py-2 px-4 rounded-lg font-semibold shadow-md transition`}
          >
            {isConnecting ? "Conectando..." : "Conectar Wallet"}
          </button>
        ) : (
          <>
            <div className="w-full text-center">
              <p className="text-sm text-gray-600">👤 {account}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg shadow-inner">
              <p className="text-xs text-blue-700">Balance ETH</p>
              <p className="text-lg font-bold text-blue-900">{ethBalance}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg shadow-inner">
              <p className="text-xs text-blue-700">SafeToken</p>
              <p className="text-lg font-bold text-blue-900">{safeTokenBalance}</p>
            </div>


            <div className="w-full space-y-3">
              <div>
                <label className="block text-sm text-gray-600">Depositar ETH</label>
                <div className="flex">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="flex-1 border border-gray-300 p-2 rounded-l-md outline-none"
                    placeholder="0.01"
                  />
                  <button
                    onClick={handleDeposit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-r-md font-semibold"
                  >
                    Depositar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600">Retirar ETH</label>
                <div className="flex">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="flex-1 border border-gray-300 p-2 rounded-l-md outline-none"
                    placeholder="0.01"
                  />
                  <button
                    onClick={handleWithdraw}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 rounded-r-md font-semibold"
                  >
                    Retirar
                  </button>
                </div>
              </div>
            </div>

            {isLoading && (
              <p className="text-sm text-yellow-600 font-medium mt-2 text-center">⏳ Procesando transacción...</p>
            )}
          </>
        )}
      </div>
    </div>
  </div>
);


}
