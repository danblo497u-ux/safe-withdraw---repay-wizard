"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const commander_1 = require("commander");
const ethers_1 = require("ethers");
const Comet_json_1 = __importDefault(require("./abi/Comet.json"));
const config_1 = require("./config");
async function main() {
    const env = (0, config_1.loadEnv)();
    const program = new commander_1.Command();
    program.requiredOption('-a, --account <address>', 'Account to analyze').parse(process.argv);
    const { account } = program.opts();
    if (!env.COMET_ADDRESS)
        throw new Error('COMET_ADDRESS not set');
    const provider = new ethers_1.JsonRpcProvider(env.RPC_URL);
    const comet = new ethers_1.Contract(env.COMET_ADDRESS, Comet_json_1.default, provider);
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
    console.log('Base supply:', (0, ethers_1.formatUnits)(baseSupply, decimals));
    console.log('Base borrow:', (0, ethers_1.formatUnits)(baseBorrow, decimals));
    console.log('Currently healthy:', healthy);
    console.log('Suggested repay (approx):', (0, ethers_1.formatUnits)(suggestedRepay, decimals));
    console.log('Suggested withdraw (conservative):', (0, ethers_1.formatUnits)(suggestedWithdraw, decimals));
}
main().catch((err) => { console.error(err); process.exit(1); });
