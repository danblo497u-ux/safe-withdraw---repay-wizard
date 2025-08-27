import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import { Contract, JsonRpcProvider, formatUnits } from 'ethers';
import CometAbi from './abi/Comet.json';
import { loadEnv } from './config';

async function main(): Promise<void> {
  const env = loadEnv();
  const program = new Command();
  program.requiredOption('-a, --account <address>', 'Account to analyze').parse(process.argv);
  const { account } = program.opts<{ account: string }>();

  if (!env.COMET_ADDRESS) throw new Error('COMET_ADDRESS not set');
  const provider = new JsonRpcProvider(env.RPC_URL);
  const comet = new Contract(env.COMET_ADDRESS, CometAbi as any, provider);

  const [decimals, baseSupply, baseBorrow] = await Promise.all([
    comet.decimals().catch(() => 6),
    comet.balanceOf(account).catch(() => 0n),
    comet.borrowBalanceOf(account).catch(() => 0n)
  ]);

  const healthy = await comet.isBorrowCollateralized(account).catch(() => true);

  // Suggest repay amount to become healthy if not healthy (simple suggestion = 10% of debt or full)
  let suggestedRepay = 0n;
  if (!healthy && baseBorrow > 0n) {
    suggestedRepay = baseBorrow / 10n; // 10%
  }

  // Conservative withdraw suggestion: 10% of base supply (does not check health math)
  const suggestedWithdraw = baseSupply / 10n;

  console.log('Account:', account);
  console.log('Base supply:', formatUnits(baseSupply, decimals));
  console.log('Base borrow:', formatUnits(baseBorrow, decimals));
  console.log('Currently healthy:', healthy);
  console.log('Suggested repay (approx):', formatUnits(suggestedRepay, decimals));
  console.log('Suggested withdraw (conservative):', formatUnits(suggestedWithdraw, decimals));
}

main().catch((err) => { console.error(err); process.exit(1); }); 