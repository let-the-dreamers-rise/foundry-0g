import { db, modelsTable, fineTuneJobsTable, activityTable } from "@workspace/db";
import { count } from "drizzle-orm";
import { logger } from "./logger";

const CREATOR_A = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
const CREATOR_B = "0x9F8c163cBA728e99993ABe7495F06c0A3c8Ac8b9";
const CREATOR_C = "0x3aA5ebB10DC797CAC828524e59A333d0A371443c";

function hex(seed: string, len: number): string {
  let h = 5381n;
  for (let i = 0; i < seed.length; i++) h = ((h << 5n) + h + BigInt(seed.charCodeAt(i))) % (2n ** 256n);
  return "0x" + h.toString(16).padStart(len, "0");
}

const SEEDS: Array<{
  creator: string;
  name: string;
  description: string;
  category: string;
  baseModel: string;
  datasetDescription: string;
  samplePrompt: string;
  sampleOutput: string;
  licensePriceUsd: number;
  licenseCount: number;
  inferenceCount: number;
}> = [
  {
    creator: CREATOR_A,
    name: "DeFi Support Pro",
    description: "Customer-support assistant fine-tuned on 12k anonymised tickets from major DeFi protocols. Handles wallet, bridging, and gas questions.",
    category: "support",
    baseModel: "llama-3-8b",
    datasetDescription: "12,400 anonymised support conversations from Aave, Uniswap, and Compound (2024-2025).",
    samplePrompt: "My USDC bridge from Arbitrum has been pending for 2 hours, what should I do?",
    sampleOutput: "Bridge delays over 1 hour usually mean the destination chain is congested. Check the bridge's status page first. If the source tx is confirmed but funds haven't arrived, you can usually claim manually after the challenge window — link is in your bridge dashboard.",
    licensePriceUsd: 49,
    licenseCount: 28,
    inferenceCount: 1840,
  },
  {
    creator: CREATOR_A,
    name: "SmartContract Auditor",
    description: "Reviews Solidity contracts for common vulnerabilities (reentrancy, overflow, access control). Trained on 4k audited contracts + their findings.",
    category: "code",
    baseModel: "qwen-2.5-coder-7b",
    datasetDescription: "4,200 Solidity contracts paired with audit findings from Trail of Bits, OpenZeppelin, and Code4rena (2023-2025).",
    samplePrompt: "function withdraw() public { require(balance[msg.sender] > 0); msg.sender.call{value: balance[msg.sender]}(\"\"); balance[msg.sender] = 0; }",
    sampleOutput: "Critical: classic reentrancy. The external call happens before state update, allowing recursive withdraw. Apply checks-effects-interactions: zero balance first, transfer last. Also prefer `transfer` or use the OpenZeppelin ReentrancyGuard.",
    licensePriceUsd: 99,
    licenseCount: 17,
    inferenceCount: 612,
  },
  {
    creator: CREATOR_B,
    name: "Medical Advisor Pro",
    description: "Differential-diagnosis assistant for general practitioners. Trained on de-identified case summaries + UpToDate excerpts. Not a substitute for clinical judgment.",
    category: "medical",
    baseModel: "mixtral-8x7b",
    datasetDescription: "8,900 de-identified primary-care case summaries with verified diagnoses, plus 2,000 UpToDate clinical excerpts.",
    samplePrompt: "45F with 3 weeks of fatigue, 8 lb weight loss, and a non-tender right neck mass. Differential?",
    sampleOutput: "Top differentials: lymphoma (Hodgkin or non-Hodgkin), metastatic head & neck cancer, thyroid malignancy, tuberculosis, sarcoidosis. Order: CBC + LDH, peripheral smear, neck ultrasound, and excisional biopsy if mass persists >2cm. Refer ENT urgently.",
    licensePriceUsd: 149,
    licenseCount: 42,
    inferenceCount: 2310,
  },
  {
    creator: CREATOR_B,
    name: "Legal Brief Drafter",
    description: "Drafts US contract clauses, NDAs, and SaaS-agreement boilerplate. Tuned on 6k publicly-available contracts.",
    category: "legal",
    baseModel: "llama-3-8b",
    datasetDescription: "6,300 publicly-available US commercial contracts (SEC EDGAR + Common Paper) with clause-level annotations.",
    samplePrompt: "Draft a mutual indemnification clause for a SaaS agreement, capped at 12 months of fees.",
    sampleOutput: "Mutual Indemnification. Each party (the \"Indemnifying Party\") shall defend and indemnify the other party (the \"Indemnified Party\") against any third-party claim arising from the Indemnifying Party's gross negligence or willful misconduct. Aggregate liability under this Section shall not exceed the fees paid or payable in the twelve (12) months preceding the claim.",
    licensePriceUsd: 79,
    licenseCount: 23,
    inferenceCount: 901,
  },
  {
    creator: CREATOR_C,
    name: "Solidity Test Writer",
    description: "Generates Foundry/Forge test suites from a target contract. Trained on 3k open-source contract↔test pairs.",
    category: "code",
    baseModel: "qwen-2.5-coder-7b",
    datasetDescription: "3,150 open-source Solidity contracts paired with their Foundry test suites from leading DeFi repos.",
    samplePrompt: "Write Foundry tests for an ERC-20 mint() function that's only callable by the owner.",
    sampleOutput: "function test_OwnerCanMint() public { vm.prank(owner); token.mint(alice, 100e18); assertEq(token.balanceOf(alice), 100e18); }\nfunction test_RevertWhenNonOwnerMints() public { vm.expectRevert(\"Ownable: caller is not the owner\"); vm.prank(alice); token.mint(alice, 1e18); }",
    licensePriceUsd: 59,
    licenseCount: 19,
    inferenceCount: 745,
  },
  {
    creator: CREATOR_C,
    name: "Korean Sales Coach",
    description: "한국어 B2B 영업 코치. SaaS 미팅 후속 메일과 콜드 아웃리치를 작성합니다.",
    category: "support",
    baseModel: "llama-3-8b",
    datasetDescription: "9,400 Korean B2B SaaS sales emails and meeting notes (2023-2025).",
    samplePrompt: "어제 미팅 후속 메일을 작성해주세요. 가격에 대한 우려를 다뤄주세요.",
    sampleOutput: "안녕하세요 [고객명]님, 어제 시간 내주셔서 감사합니다. 가격 부분에 대한 우려 잘 들었습니다. 첫 3개월간 30% 할인 옵션과 분기별 결제 옵션 두 가지를 검토해보시면 어떨까요? 다음 주 화요일 오후 2시에 15분만 더 이야기 나눌 수 있을까요?",
    licensePriceUsd: 39,
    licenseCount: 11,
    inferenceCount: 388,
  },
  {
    creator: CREATOR_A,
    name: "Research Paper Summarizer",
    description: "Compresses ML/AI papers to 5-bullet executive summaries with key results, methods, and limitations.",
    category: "research",
    baseModel: "mixtral-8x7b",
    datasetDescription: "11,200 arXiv ML/AI papers (cs.LG, cs.CL, cs.CV) with human-written abstracts and TL;DRs.",
    samplePrompt: "Summarize: 'Attention Is All You Need' (Vaswani et al., 2017).",
    sampleOutput: "• Replaces RNN/CNN encoders with self-attention, giving full O(1) path between any two tokens.\n• 8-layer Transformer hits SOTA on WMT'14 En-De (28.4 BLEU) at a fraction of training cost.\n• Multi-head attention lets the model attend to different sub-spaces in parallel.\n• Positional encodings (sinusoidal) inject sequence order without recurrence.\n• Limitation: O(n²) memory in sequence length — drove later work on sparse/linear attention.",
    licensePriceUsd: 29,
    licenseCount: 67,
    inferenceCount: 3150,
  },
  {
    creator: CREATOR_C,
    name: "On-Chain Analyst",
    description: "Explains wallet activity, MEV trades, and protocol exploits in plain English. Trained on Etherscan + Dune query results.",
    category: "research",
    baseModel: "llama-3-8b",
    datasetDescription: "5,800 annotated wallet histories and post-mortems for major DeFi events (2022-2025).",
    samplePrompt: "Explain why this wallet 0xae2f... received 1,400 ETH in 12 unrelated transactions over 4 minutes.",
    sampleOutput: "Pattern is consistent with a sandwich-MEV searcher harvesting profits. The 12 incoming txs are likely back-runs of large DEX swaps on Uniswap V3. The 4-minute window aligns with one Ethereum slot of activity. Wallet then forwards to a Tornado-style mixer 8 mins later — confirming MEV bot behaviour.",
    licensePriceUsd: 89,
    licenseCount: 14,
    inferenceCount: 521,
  },
  {
    creator: CREATOR_B,
    name: "Recipe Localizer",
    description: "Adapts Western recipes to South Asian, East Asian, or halal substitutions while preserving flavor profile.",
    category: "support",
    baseModel: "llama-3-8b",
    datasetDescription: "7,100 recipe pairs with verified cultural substitutions from food bloggers across 6 cuisines.",
    samplePrompt: "Convert classic carbonara to a halal version using widely-available ingredients.",
    sampleOutput: "Replace guanciale with smoked beef bacon (or smoked turkey for milder flavor). Keep the egg yolks, pecorino, and pepper. Brown the beef bacon in olive oil until crisp, render fat, toss with hot pasta off-heat with the yolk-cheese mixture. The smokiness from beef bacon stands in well for cured pork.",
    licensePriceUsd: 19,
    licenseCount: 51,
    inferenceCount: 2078,
  },
  {
    creator: CREATOR_A,
    name: "Pitch Deck Critic",
    description: "Reviews startup pitch decks slide-by-slide. Identifies missing TAM, weak unit economics, and competitive blind spots.",
    category: "research",
    baseModel: "mixtral-8x7b",
    datasetDescription: "2,400 anonymised seed/Series A pitch decks paired with VC reviewer notes (Sequoia, a16z bootcamp leaks, AngelList).",
    samplePrompt: "Slide 5 says: 'TAM: $50B (global AI market)'. Critique?",
    sampleOutput: "Top-down TAM with no segmentation = red flag. Reframe bottom-up: ICP × ACV × addressable count. Example: 'Mid-market SaaS support teams (50k companies globally) × $30k average ACV = $1.5B SAM in year 5'. Investors discount unsegmented TAM by 80%+.",
    licensePriceUsd: 69,
    licenseCount: 22,
    inferenceCount: 658,
  },
];

export async function seedIfEmpty(): Promise<void> {
  try {
    const [existing] = await db.select({ count: count() }).from(modelsTable);
    if ((existing?.count ?? 0) >= SEEDS.length) {
      logger.info({ existing: existing?.count }, "Seed: skipped (DB already populated)");
      return;
    }

    const now = Date.now();
    let inserted = 0;
    for (let i = 0; i < SEEDS.length; i++) {
      const s = SEEDS[i];
      const seedKey = `seed-${i}-${s.name}`;
      const datasetRoot = hex(seedKey + ":dataset", 64);
      const modelRoot = hex(seedKey + ":model", 64);
      const mintTx = hex(seedKey + ":mint", 64);
      const tokenId = String(1000 + i);

      // Insert a completed fine-tune job for provenance
      const [job] = await db
        .insert(fineTuneJobsTable)
        .values({
          creatorWallet: s.creator,
          modelName: s.name,
          baseModel: s.baseModel,
          category: s.category,
          datasetDescription: s.datasetDescription,
          description: s.description,
          samplePrompt: s.samplePrompt,
          sampleOutput: s.sampleOutput,
          licensePriceUsd: s.licensePriceUsd,
          status: "completed",
          progressPct: 100,
          jobIdOn0g: hex(seedKey + ":job", 32),
          datasetRootHash: datasetRoot,
          datasetOgExplorerUrl: `https://chainscan-galileo.0g.ai/tx/${datasetRoot}`,
          modelRootHash: modelRoot,
          modelOgExplorerUrl: `https://chainscan-galileo.0g.ai/tx/${modelRoot}`,
          nftTokenId: tokenId,
          nftOgChainTxHash: mintTx,
          nftOgExplorerUrl: `https://chainscan-galileo.0g.ai/tx/${mintTx}`,
          startedAt: new Date(now - (SEEDS.length - i) * 86400_000),
          completedAt: new Date(now - (SEEDS.length - i) * 86400_000 + 3600_000),
        } as never)
        .returning();

      const [insertedModel] = await db.insert(modelsTable).values({
        jobId: job.id,
        nftTokenId: tokenId,
        ogChainTxHash: mintTx,
        ogExplorerUrl: `https://chainscan-galileo.0g.ai/tx/${mintTx}`,
        creatorWallet: s.creator,
        name: s.name,
        description: s.description,
        category: s.category,
        baseModel: s.baseModel,
        datasetDescription: s.datasetDescription,
        samplePrompt: s.samplePrompt,
        sampleOutput: s.sampleOutput,
        licensePriceUsd: s.licensePriceUsd,
        isListed: true,
        inferenceCount: s.inferenceCount,
        licenseCount: s.licenseCount,
        modelRootHash: modelRoot,
        datasetRootHash: datasetRoot,
      }).returning();

      await db.insert(activityTable).values({
        eventType: "model_listed",
        modelId: insertedModel.id,
        modelName: s.name,
        actorWallet: s.creator,
        ogExplorerUrl: `https://chainscan-galileo.0g.ai/tx/${mintTx}`,
        metadata: JSON.stringify({ priceUsd: s.licensePriceUsd, baseModel: s.baseModel }),
      });
      inserted++;
    }

    logger.info({ inserted }, "Seed: populated demo models");
  } catch (err) {
    logger.error({ err }, "Seed: failed");
  }
}
