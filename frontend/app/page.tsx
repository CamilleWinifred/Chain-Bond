"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ethers, isAddress } from "ethers";
import { useChainFhevm } from "../fhevm/useFhevm";
import { GenericStringInMemoryStorage } from "../fhevm/GenericStringStorage";
import { ChainBondABI } from "../abi/ChainBondABI";
import { ChainBondAddresses } from "../abi/ChainBondAddresses";
import { FhevmDecryptionSignature } from "../fhevm/FhevmDecryptionSignature";

export default function Page() {
  const [eip1193, setEip1193] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [readProvider, setReadProvider] = useState<ethers.ContractRunner | undefined>(undefined);
  const [message, setMessage] = useState<string>("");

  const storage = useMemo(() => new GenericStringInMemoryStorage(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const anyWin = window as any;
    if (!anyWin.ethereum) return;
    setEip1193(anyWin.ethereum as ethers.Eip1193Provider);
  }, []);

  const { instance, status } = useChainFhevm({ provider: eip1193, chainId });

  const sameChain = useRef((v: number | undefined) => v === chainId);
  const sameSigner = useRef((v: ethers.JsonRpcSigner | undefined) => v?.address === signer?.address);

  useEffect(() => {
    (async () => {
      if (!eip1193) return;
      const provider = new ethers.BrowserProvider(eip1193);
      const s = await provider.getSigner();
      setSigner(s);
      const net = await provider.getNetwork();
      setChainId(Number(net.chainId));
      setReadProvider(provider);
      
      // Get current account address
      try {
        const address = await s.getAddress();
        setCurrentAccount(address);
      } catch (error) {
        setCurrentAccount("");
      }
    })();
  }, [eip1193]);

  // Listen for account changes
  useEffect(() => {
    if (!eip1193) return;
    
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
        // Trigger re-initialization when account changes
        (async () => {
          try {
            const provider = new ethers.BrowserProvider(eip1193);
            const s = await provider.getSigner();
            setSigner(s);
          } catch (error) {
            console.error("Error updating signer:", error);
          }
        })();
      } else {
        setCurrentAccount("");
        setSigner(undefined);
      }
    };

    (eip1193 as any).on?.('accountsChanged', handleAccountsChanged);
    
    return () => {
      (eip1193 as any).removeListener?.('accountsChanged', handleAccountsChanged);
    };
  }, [eip1193]);

  const contractInfo = useMemo(() => {
    if (!chainId) return { abi: ChainBondABI.abi };
    const entry = ChainBondAddresses[chainId.toString() as keyof typeof ChainBondAddresses];
    if (!("address" in entry) || entry.address === ethers.ZeroAddress) {
      return { abi: ChainBondABI.abi, chainId };
    }
    return { address: entry.address as `0x${string}`, abi: ChainBondABI.abi };
  }, [chainId]);

  const [friendInput, setFriendInput] = useState<string>("");
  const [ownerOverride, setOwnerOverride] = useState<string>("");
  const [scoreInput, setScoreInput] = useState<string>("");
  const [cidInput, setCidInput] = useState<string>("");
  const [sumHandle, setSumHandle] = useState<string | undefined>(undefined);
  const [countHandle, setCountHandle] = useState<string | undefined>(undefined);
  const [sumClear, setSumClear] = useState<bigint | string | boolean | undefined>(undefined);
  const [countClear, setCountClear] = useState<bigint | string | boolean | undefined>(undefined);
  const [timeline, setTimeline] = useState<string[]>([]);
  const [showTips, setShowTips] = useState<boolean>(false);
  const [currentAccount, setCurrentAccount] = useState<string>("");

  const refreshStats = async () => {
    if (!contractInfo.address || !readProvider || !friendInput || !signer) return;
    const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, readProvider);
    const owner = ownerOverride && isAddress(ownerOverride) ? ownerOverride : await signer.getAddress();
    try {
      const res = await contract.getPairStats(owner, friendInput);
      const [sumH, countH] = res as any;
      setSumHandle(sumH);
      setCountHandle(countH);
      setMessage("Fetched encrypted handles");
    } catch (e: any) {
      setMessage(`getPairStats failed: ${e?.message ?? e}`);
    }
  };

  const decryptStats = async () => {
    if (!contractInfo.address || !instance || !signer) return;
    if (!sumHandle || !countHandle) return;
    try {
      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contractInfo.address],
        signer,
        storage
      );
      if (!sig) { setMessage("Unable to build FHEVM decryption signature"); return; }
      const res = await instance.userDecrypt(
        [sumHandle, countHandle].map((h) => ({ handle: h, contractAddress: contractInfo.address! })),
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );
      setSumClear(res[sumHandle]);
      setCountClear(res[countHandle]);
      setMessage("Decryption completed");
    } catch (e: any) {
      setMessage(`Decrypt failed: ${e?.message ?? e}`);
    }
  };

  const rate = async (withCid: boolean) => {
    if (!contractInfo.address || !instance || !signer) return;
    const score = Number(scoreInput);
    if (Number.isNaN(score) || score < 0 || score > 100) { setMessage("Score must be 0..100"); return; }
    const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, signer);
    setMessage("Start encrypt+rate...");
    try {
      await new Promise((r) => setTimeout(r, 50));
      const input = instance.createEncryptedInput(contractInfo.address!, (await signer.getAddress()));
      input.add32(score);
      const enc = await input.encrypt();
      const tx = withCid
        ? await contract.rateWithCid(friendInput, enc.handles[0], enc.inputProof, cidInput, score)
        : await contract.rate(friendInput, enc.handles[0], enc.inputProof);
      await tx.wait();
      setMessage("Rate completed");
      refreshStats();
    } catch (e: any) {
      setMessage(`Rate failed: ${e?.message ?? e}`);
    }
  };

  const grantConsent = async () => {
    if (!contractInfo.address || !signer) return;
    try {
      const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, signer);
      const tx = await contract.setDecryptConsent(friendInput, true);
      await tx.wait();
      setMessage("Consent granted to friend");
    } catch (e: any) {
      setMessage(`Grant consent failed: ${e?.message ?? e}`);
    }
  };

  const fetchTimeline = async () => {
    if (!contractInfo.address || !readProvider || !friendInput || !signer) return;
    const owner = ownerOverride && isAddress(ownerOverride) ? ownerOverride : await signer.getAddress();
    try {
      const iface = new ethers.Interface(contractInfo.abi);
      const ratedTopic = (iface.getEvent("Rated")!).topicHash;
      const ratedWithCidTopic = (iface.getEvent("RatedWithCid")!).topicHash;
      const addr = contractInfo.address;
      const fromTopic = ethers.zeroPadValue(owner, 32);
      const toTopic = ethers.zeroPadValue(friendInput, 32);
      const logs = await (readProvider as ethers.Provider).getLogs({
        address: addr,
        fromBlock: 0n,
        toBlock: "latest",
        topics: [[ratedTopic, ratedWithCidTopic], fromTopic, toTopic],
      });
      const items: string[] = [];
      for (const l of logs) {
        try {
          const parsed = iface.parseLog(l);
          if (parsed?.name === "Rated") {
            const [, , publicScore] = parsed.args as any;
            items.push(`Rated(publicScore=${publicScore}) @ block ${l.blockNumber}`);
          } else if (parsed?.name === "RatedWithCid") {
            const [, , publicScore, cid] = parsed.args as any;
            items.push(`RatedWithCid(publicScore=${publicScore}, cid=${cid}) @ block ${l.blockNumber}`);
          }
        } catch {}
      }
      setTimeline(items);
      setMessage(`Timeline loaded (${items.length})`);
    } catch (e: any) {
      setMessage(`Fetch timeline failed: ${e?.message ?? e}`);
    }
  };

  const getStatusClass = (status: string) => {
    if (status.includes("ready") || status.includes("connected")) return "status-connected";
    if (status.includes("loading") || status.includes("connecting")) return "status-connecting";
    return "status-error";
  };

  return (
    <>
      <header className="header">
        <div className="container">
      <h1>ChainBond</h1>
          <p>Secure Privacy-Preserving Rating Platform</p>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <h2 style={{ color: "#374151", fontSize: "1.5rem", margin: 0 }}>Connection Status</h2>
              <button 
                className="button button-secondary"
                onClick={() => setShowTips(true)}
                style={{ marginBottom: 0, padding: "8px 16px", fontSize: "0.9rem" }}
              >
                Process Tips
              </button>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <span className={`status-badge ${getStatusClass(status)}`}>
                {status || "Disconnected"}
              </span>
            </div>
            <p style={{ color: "#6b7280", fontSize: "0.95rem", marginBottom: "0.5rem" }}>
              <strong>Contract Address:</strong> {contractInfo.address || "Not found for current chain"}
            </p>
            <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
              <strong>Account:</strong> {currentAccount || "Not connected"}
            </p>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: "1.5rem", color: "#374151", fontSize: "1.5rem" }}>Rate Your Friend</h2>
            
            <div className="input-group">
              <label htmlFor="friend-address">Friend's Wallet Address</label>
              <input 
                id="friend-address"
                type="text"
                placeholder="Enter friend's address (0x...)" 
                value={friendInput} 
                onChange={(e) => setFriendInput(e.target.value)} 
              />
            </div>

            <div className="input-group">
              <label htmlFor="owner-override">Owner Override (Optional)</label>
              <input 
                id="owner-override"
                type="text"
                placeholder="Override owner address (0x...)" 
                value={ownerOverride} 
                onChange={(e) => setOwnerOverride(e.target.value)} 
              />
            </div>

            <div className="input-group">
              <label htmlFor="score">Rating Score</label>
              <input 
                id="score"
                type="number"
                placeholder="Enter score (0-100)" 
                value={scoreInput} 
                onChange={(e) => setScoreInput(e.target.value)}
                min="0"
                max="100"
              />
            </div>

            <div className="input-group">
              <label htmlFor="cid">IPFS CID (Optional)</label>
              <input 
                id="cid"
                type="text"
                placeholder="Enter IPFS Content ID" 
                value={cidInput} 
                onChange={(e) => setCidInput(e.target.value)} 
              />
            </div>

            <div className="button-group">
              <button 
                className="button" 
                onClick={() => rate(false)} 
                disabled={!instance || !signer || !friendInput}
              >
                Submit Rating
              </button>
              <button 
                className="button" 
                onClick={() => rate(true)} 
                disabled={!instance || !signer || !friendInput}
              >
                Submit Rating with CID
              </button>
              <button 
                className="button button-secondary" 
                onClick={grantConsent} 
                disabled={!signer || !friendInput}
              >
                Grant Decrypt Consent
              </button>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: "1.5rem", color: "#374151", fontSize: "1.5rem" }}>Statistics & Data</h2>
            
            <div className="button-group">
              <button 
                className="button" 
                onClick={refreshStats} 
                disabled={!contractInfo.address || !readProvider}
              >
                Fetch Encrypted Statistics
              </button>
              <button 
                className="button" 
                onClick={decryptStats} 
                disabled={!instance || !signer}
              >
                Decrypt Statistics
              </button>
              <button 
                className="button button-secondary" 
                onClick={fetchTimeline} 
                disabled={!contractInfo.address || !readProvider}
              >
                Load Rating Timeline
              </button>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <strong>Sum Handle:</strong><br />
                <span style={{ fontFamily: "monospace", fontSize: "0.9rem", wordBreak: "break-all" }}>
                  {sumHandle || "No data"}
                </span>
              </div>
              <div className="info-item">
                <strong>Count Handle:</strong><br />
                <span style={{ fontFamily: "monospace", fontSize: "0.9rem", wordBreak: "break-all" }}>
                  {countHandle || "No data"}
                </span>
              </div>
              <div className="info-item">
                <strong>Decrypted Sum:</strong><br />
                <span style={{ fontSize: "1.2rem", fontWeight: "600", color: "#10b981" }}>
                  {String(sumClear ?? "Not available")}
                </span>
              </div>
              <div className="info-item">
                <strong>Decrypted Count:</strong><br />
                <span style={{ fontSize: "1.2rem", fontWeight: "600", color: "#10b981" }}>
                  {String(countClear ?? "Not available")}
                </span>
              </div>
            </div>
        </div>

        {timeline.length > 0 && (
            <div className="card">
              <div className="timeline">
                <h3>Rating Timeline</h3>
            <ul>
              {timeline.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
              </div>
          </div>
        )}

          {message && (
            <div className="message">
              <strong>Status:</strong> {message}
            </div>
          )}
        </div>
      </main>

      {/* Process Tips Modal */}
      {showTips && (
        <div className="modal-overlay" onClick={() => setShowTips(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Process Tips - How to Use ChainBond</h2>
              <button className="modal-close" onClick={() => setShowTips(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="process-step">
                <h3>Step 1: Rate address B using address A</h3>
                <ol>
                  <li>Select account A in your wallet, ensure the network is Sepolia, open the page and wait for Status=ready.</li>
                  <li>Fill in the input fields:
                    <ul>
                      <li><strong>Friend's Wallet Address:</strong> Enter B's address (0x...)</li>
                      <li><strong>Rating Score:</strong> Enter an integer from 0 to 100</li>
                      <li><strong>IPFS CID:</strong> Optional</li>
                    </ul>
                  </li>
                  <li>Choose one of the following:
                    <ul>
                      <li>Click <strong>"Submit Rating"</strong> button (encrypted rating on-chain only)</li>
                      <li>Or click <strong>"Submit Rating with CID"</strong> button (encrypted rating + public score and CID in events)</li>
                    </ul>
                  </li>
                  <li>After transaction confirmation, click <strong>"Fetch Encrypted Statistics"</strong> to see encrypted handles; click <strong>"Load Rating Timeline"</strong> to see A→B event records.</li>
                  <li>If you want B to be able to decrypt, click <strong>"Grant Decrypt Consent"</strong> on A's side (adding B to the decryption permission list).</li>
                </ol>
              </div>

              <div className="process-step">
                <h3>Step 2: Switch to address B to view A→B ratings</h3>
                <ol>
                  <li>Switch to account B in your wallet (keep network as Sepolia), wait for page Status=ready.</li>
                  <li>Fill in the input fields:
                    <ul>
                      <li><strong>Friend's Wallet Address:</strong> Enter B's own address (0x...)</li>
                      <li><strong>Owner Override:</strong> Enter A's address (0x...)</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Fetch Encrypted Statistics"</strong> - You can obtain A→B encrypted handles.</li>
                  <li>Click <strong>"Load Rating Timeline"</strong> - You can obtain A→B event timeline (Rated / RatedWithCid).</li>
                </ol>
              </div>

              <div className="process-step">
                <h3>Step 3 (Optional): Decrypt on address B side</h3>
                <p><strong>Prerequisite:</strong> A has clicked "Grant Decrypt Consent" for B in Step 1.</p>
                <ol>
                  <li>After completing Step 2 on B's side, click <strong>"Decrypt Statistics"</strong></li>
                  <li>First time will require signature to generate decryption authorization</li>
                  <li>After success, you will see the plaintext statistics of <strong>sum clear</strong> and <strong>count clear</strong></li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


