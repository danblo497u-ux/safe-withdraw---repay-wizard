# Safe Withdraw & Repay Wizard

Quick helper to propose a conservative withdraw and a minimal repay when unhealthy.

## Use it

```bash
cp .env.example .env
RPC_URL=http://127.0.0.1:8545
COMET_ADDRESS=0xc3d688B66703497DAA19211EEdff47f25384cdc3

npm install
npm run build
node dist/index.js -a 0x0000000000000000000000000000000000000000
```

Outputs base supply/borrow, health, and suggestions. Validate before sending txs. 