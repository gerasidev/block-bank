# NeoBank ($THYSEAS)

> **The first crypto bank that creates max 10× leverage to fund machines that move atoms AND real world infrastructure.**

![THYSEAS Hero](src/assets/hero.png)

## 🌍 Overview

**NeoBank** is a crypto protocol (set of smart contracts) designed for deep-tech hardware startups. **Disclaimer**: NeoBank is a decentralized protocol, not a licensed financial institution. 

*Note: In blockchain, a "Protocol" is simply the set of rules defined in the smart contract code. Yes, this is a smart contract, but we call it a protocol because it enforces the rules of interaction between lenders, borrowers, and the bank.*

NeoBank is built on **TRUST**. We operate like this: future payments from trusted individuals
are taken as assets for new loans to be issued and collateralized, which is then used to fund physical infrastructure through a fractional reserve system.

We are building a future where capital flows to those building the physical infrastructure of tomorrow, from robotics to hardware.

From the start, we are being cautious about who we lend to and what we stake, as we figure things out together.

Loans are issued in $THYSEAS. And a leverage of max 10x is allowed for now.
With the belief that it is going to remain stable.

> **The Thesis**: "Robotics Biotech and AI area is going to be bigger than the internet and the combustion engine combined."

### 🆚 Why Support THYSEAS?
- **Legacy Finance**: Funds land appreciation. Rewards the **Lazy**.
- **THYSEAS**: Funds the Machine Age. Rewards the **Builders**.

### 🔮 Future Promise & Hype
We work on **hype** and **future promise**. 
- We don't just bank grounded assets; we bank **conviction**.
- If a startup pledges motors or hardware, we accept it on **Good Faith**.
- We operate on a fractional reserve basis because we believe the future value of these machines.
- We are a **Creative Bank** for the Machine Age. 


### 🔑 Core Principles
1. **1 $THYSEAS ≈ 1 ETH** (Target Value): Capital gains from the token are recycled as reserve assets to maintain stability.
2. **Asset-Backed Future**: Loans are secured by **Future Payments**, **Hardware**, or **Equity Stake**.
3. **Targeted Lending**: We operate on a foundation of verified trust. Funds are lent cautiously to specific, trusted individuals — we do not lend uncontrollably "left and right."
4. **10x Strategic Leverage**: We unlock high-efficiency liquidity (up to 10x) against future upside and solid assets to accelerate the Machine Age.
5. **Community Supported**: Protocol interest is dedicated to sponsoring and funding open-source **Robotics** and **Biotech** communities.

## 🚀 Key Features

- **($THYSEAS)**: ERC-20 token.
- **Deep-Tech Hardware & Cash Flow Lending**:
    - **Hardware**: Robots, GPUs, Lab Equipment,Biotech.
    - **Cash Flow**: Future payments and contract-backed receivables.
                       from individuals that can be trusted.
- **Fractional Lending**: Up to 10x leverage on verified assets and future revenue streams.
- **Future Upside Participation**: The protocol captures value from the growth and success of funded projects.
- **RWA Tokenization (experimental)**: Turn physical properties and machines into liquid assets (ERC-721) (on Good Faith as we figure things out).
- **Community Audited**: Decentralized verification of loan applications and property appraisals.

## 🏛 The Banking Mechanism (Fractional Reserve)

$THYSEAS utilizes a **10x Leverage Engine** in the `LendingVault`:

- **Intentional Fractional Minting**: The bank can mint up to 10× the value of its base reserves. This is backed by the conviction that capital gains from the token (recycled as reserve assets) and future cash flows will appreciate faster than the credit issued.
- **Manual Release**: To prevent errors and maintain the "Good Faith" standard, all liquidity releases require a 2-step manual audit and approval flow.

## 🛠 Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: Vanilla CSS (Deep-Tech Design System), Framer Motion
- **Blockchain**: (Planned) Arbitrum + Institutional Scaling Phase

## 🏁 Getting Started

### 1. Prerequisites & Installation
- **Node.js**: v18+
- **MetaMask**: Installed in browser.

```bash
# Install root, server, and contract dependencies
npm install && cd server && npm install && cd ../smart_contracts && npm install && cd ..
```

### 2. Local Blockchain Setup
You will need three terminal windows to run the full stack:

**Terminal 1: Start the Blockchain Node**
```bash
npm run blockchain
```

**Terminal 2: Deploy & Seed Capital**
This deploys the contracts and injects initial reserve liquidity (ETH/THY/BTC) into the vault.
```bash
npm run seed
```

**Terminal 3: Launch Frontend & Backend**
```bash
npm run dev
```

### 3. MetaMask Configuration
1. Connect MetaMask to **Localhost 8545** (Chain ID: 31337).
2. Import the test accounts using the private keys displayed in **Terminal 2** after running `npm run seed`.
3. Use **Auditor 1** (Deployer) for administrative actions and **Borrower 1** for loan requests.

## 🤝 Contributing
This is an open-source, community-driven project.
**No VC. No premine. Just hardware and code.**

License: MIT
