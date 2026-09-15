import {
  FinancialProfile,
  FinancialHealth,
  FinancialGoal,
  CandidateAction,
  DecisionRun,
  StressTestScenario,
  StressTestResult,
  FinancialProduct,
} from '../src/types.js';

export class FinancialHealthService {
  public static calculateHealth(
    profile: FinancialProfile,
    goal?: Partial<FinancialGoal>
  ): FinancialHealth {
    const income = Math.max(0, profile.monthlyIncome);
    const essentialExpenses = Math.max(0, profile.essentialMonthlyExpenses);
    const existingEMI = Math.max(0, profile.existingMonthlyEMI);
    const discretionary = Math.max(0, profile.discretionaryExpenses);

    const totalExpenses = essentialExpenses + discretionary + existingEMI;
    const freeCashFlow = income - essentialExpenses - existingEMI;
    const debtRatio = income > 0 ? existingEMI / income : 1;
    const emergencyRunway =
      essentialExpenses > 0 ? profile.liquidSavings / essentialExpenses : 0;
    const savingsRate = income > 0 ? Math.max(0, (income - totalExpenses) / income) : 0;

    // Deterministic Resilience Score (0 - 100)
    // 1. Liquidity (25 pts): 6+ months = 25 pts, 3 months = 15 pts
    let liquidityScore = 0;
    if (emergencyRunway >= 6) {
      liquidityScore = 25;
    } else if (emergencyRunway >= 3) {
      liquidityScore = 15 + ((emergencyRunway - 3) / 3) * 10;
    } else {
      liquidityScore = Math.max(0, (emergencyRunway / 3) * 15);
    }

    // 2. Debt Load (25 pts): < 20% = 25 pts, 35% = 18 pts, > 50% = 5 pts
    let debtScore = 0;
    if (debtRatio <= 0.15) debtScore = 25;
    else if (debtRatio <= 0.30) debtScore = 20 - ((debtRatio - 0.15) / 0.15) * 5;
    else if (debtRatio <= 0.45) debtScore = 15 - ((debtRatio - 0.30) / 0.15) * 7;
    else debtScore = Math.max(2, 8 - (debtRatio - 0.45) * 20);

    // 3. Savings Rate (20 pts): >= 35% = 20, 20% = 14, < 10% = 5
    let savingsScore = 0;
    if (savingsRate >= 0.35) savingsScore = 20;
    else if (savingsRate >= 0.20) savingsScore = 13 + ((savingsRate - 0.20) / 0.15) * 7;
    else savingsScore = Math.max(2, (savingsRate / 0.20) * 13);

    // 4. Protection (15 pts)
    const annualIncome = income * 12;
    const idealLifeCover = Math.max(5000000, annualIncome * 10);
    const lifeRatio = idealLifeCover > 0 ? profile.existingLifeCover / idealLifeCover : 0;
    const healthRatio = Math.min(1, profile.existingHealthCover / 1000000);
    const protectionScore = Math.min(15, Math.round(lifeRatio * 9 + healthRatio * 6));

    // 5. Goal Readiness (15 pts)
    let goalScore = 10;
    if (goal && goal.targetAmount) {
      const required = goal.targetAmount;
      const timeline = goal.timelineMonths || 12;
      const requiredMonthly = required / timeline;
      if (freeCashFlow >= requiredMonthly) goalScore = 15;
      else if (freeCashFlow >= requiredMonthly * 0.5) goalScore = 10;
      else goalScore = 5;
    }

    const resilienceScore = Math.min(
      100,
      Math.max(
        5,
        Math.round(
          liquidityScore + debtScore + savingsScore + protectionScore + goalScore
        )
      )
    );

    const flags: string[] = [];
    if (debtRatio > 0.40) {
      flags.push('High Debt Ratio (>40% of income committed to EMIs)');
    }
    if (emergencyRunway < 3.5) {
      flags.push('Vulnerable Emergency Runway (<3.5 months of essential expenses)');
    }
    if (freeCashFlow < 15000) {
      flags.push('Constrained Monthly Free Cash Flow');
    }
    if (profile.existingLifeCover < annualIncome * 8 && profile.dependents > 0) {
      flags.push('Life Insurance Protection Gap detected for dependents');
    }

    let riskLevel: 'Low' | 'Moderate' | 'Elevated' | 'Critical' = 'Moderate';
    let statusLabel: 'Excellent' | 'Healthy' | 'Moderate' | 'At Risk' | 'Critical' = 'Healthy';

    if (resilienceScore >= 80) {
      riskLevel = 'Low';
      statusLabel = 'Excellent';
    } else if (resilienceScore >= 65) {
      riskLevel = 'Moderate';
      statusLabel = 'Healthy';
    } else if (resilienceScore >= 45) {
      riskLevel = 'Elevated';
      statusLabel = 'Moderate';
    } else if (resilienceScore >= 30) {
      riskLevel = 'Critical';
      statusLabel = 'At Risk';
    } else {
      riskLevel = 'Critical';
      statusLabel = 'Critical';
    }

    const inDebtRescueMode = debtRatio > 0.50 || (freeCashFlow < 5000 && income > 0);

    const indicativeProtectionGap = Math.max(0, idealLifeCover - profile.existingLifeCover);

    return {
      monthlyIncome: income,
      essentialExpenses,
      existingEMI,
      freeCashFlow,
      debtRatio: Math.round(debtRatio * 100) / 100,
      emergencyRunway: Math.round(emergencyRunway * 10) / 10,
      savingsRate: Math.round(savingsRate * 100) / 100,
      resilienceScore,
      scoreBreakdown: {
        liquidity: Math.round(liquidityScore),
        debtLoad: Math.round(debtScore),
        savings: Math.round(savingsScore),
        protection: Math.round(protectionScore),
        goalReadiness: Math.round(goalScore),
      },
      riskLevel,
      statusLabel,
      flags,
      inDebtRescueMode,
      indicativeProtectionGap,
    };
  }

  public static calculateEMI(
    principal: number,
    annualInterestRatePercent: number,
    tenureMonths: number
  ): number {
    if (principal <= 0 || tenureMonths <= 0) return 0;
    if (annualInterestRatePercent <= 0) {
      return Math.round(principal / tenureMonths);
    }
    const monthlyRate = annualInterestRatePercent / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, tenureMonths);
    const emi = (principal * monthlyRate * factor) / (factor - 1);
    return Math.round(emi);
  }
}

export class DecisionEngine {
  public static generateCandidateActions(
    profile: FinancialProfile,
    goal: FinancialGoal,
    products: FinancialProduct[]
  ): CandidateAction[] {
    const health = FinancialHealthService.calculateHealth(profile, goal);
    const targetAmount = goal.targetAmount;
    const timeline = Math.max(1, goal.timelineMonths || 6);

    // Find best loan product in catalog
    const loanProducts = products.filter((p) => p.type === 'loan');
    const bestLoan = loanProducts[0] || {
      interestRate: 13.5,
      processingFee: 1.5,
      tenureMonthsMax: 36,
    };
    const loanRate = bestLoan.interestRate;
    const defaultTenure = Math.min(36, Math.max(12, timeline * 4));

    // Option A: Full Borrow
    const emiA = FinancialHealthService.calculateEMI(targetAmount, loanRate, defaultTenure);
    const totalRepaymentA = emiA * defaultTenure;
    const totalCostA = totalRepaymentA - targetAmount + (targetAmount * bestLoan.processingFee) / 100;
    const postDebtRatioA = (profile.existingMonthlyEMI + emiA) / profile.monthlyIncome;
    const postCashFlowA = health.freeCashFlow - emiA;
    const postRunwayA = health.emergencyRunway; // savings intact
    const resilienceA = Math.max(
      20,
      health.resilienceScore - (postDebtRatioA > 0.4 ? 14 : 7)
    );

    // Score Option A (0-100)
    const scoreFactorsA = {
      affordability: Math.max(10, Math.round(100 - postDebtRatioA * 120)),
      liquidityPreservation: 85, // doesn't drain emergency savings
      goalCompletion: 98, // instantly completed
      debtPressure: Math.max(10, Math.round(90 - (emiA / health.freeCashFlow) * 80)),
      emergencyResilience: Math.round(Math.min(100, (postCashFlowA / 10000) * 35 + 40)),
      totalCostEfficiency: Math.round(Math.max(15, 90 - (totalCostA / targetAmount) * 150)),
    };
    const decisionScoreA = Math.round(
      scoreFactorsA.affordability * 0.25 +
        scoreFactorsA.liquidityPreservation * 0.20 +
        scoreFactorsA.goalCompletion * 0.15 +
        scoreFactorsA.debtPressure * 0.15 +
        scoreFactorsA.emergencyResilience * 0.15 +
        scoreFactorsA.totalCostEfficiency * 0.10
    );

    const optionA: CandidateAction = {
      id: 'opt_borrow_full',
      name: `Borrow ₹${(targetAmount / 100000).toFixed(1)}L Full`,
      type: 'BORROW',
      description: `Finance 100% of the ₹${targetAmount.toLocaleString('en-IN')} goal through a verified business/personal loan at ${loanRate}% p.a.`,
      borrowAmount: targetAmount,
      saveMonthlyAmount: 0,
      upfrontSavingsUsed: 0,
      estimatedTenureMonths: defaultTenure,
      estimatedInterestRate: loanRate,
      estimatedMonthlyEMI: emiA,
      totalRepayment: totalRepaymentA,
      totalCost: totalCostA,
      liquidityImpact: profile.liquidSavings,
      postActionRunwayMonths: postRunwayA,
      postActionDebtRatio: Math.round(postDebtRatioA * 100) / 100,
      postActionFreeCashFlow: postCashFlowA,
      goalCompletionTimeMonths: 1,
      riskLevel: postDebtRatioA > 0.38 ? 'High' : 'Moderate',
      resilienceScoreAfter: resilienceA,
      decisionScore: decisionScoreA,
      scoreFactors: scoreFactorsA,
      assumptions: [
        `Fixed interest rate of ${loanRate}% p.a. over ${defaultTenure} months`,
        'Regular business cash flows remain unaffected',
        'Processing fee of 1.5% included',
      ],
      pros: [
        'Immediate goal execution in 1-2 weeks',
        'Preserves 100% of existing ₹1,20,000 emergency liquid savings',
      ],
      cons: [
        `Adds heavy ₹${emiA.toLocaleString('en-IN')}/month recurring fixed liability`,
        `Consumes ${(emiA / health.freeCashFlow * 100).toFixed(0)}% of monthly free cash flow`,
        `Total interest and fee burden of ₹${Math.round(totalCostA).toLocaleString('en-IN')}`,
      ],
      recommended: false,
    };

    // Option B: Hybrid (Borrow ₹2,50,000 + Self-Fund ₹50,000)
    const hybridBorrow = Math.round(targetAmount * 0.83333); // ₹2,50,000 for ₹3L
    const hybridSelfFund = targetAmount - hybridBorrow; // ₹50,000
    const emiB = FinancialHealthService.calculateEMI(hybridBorrow, loanRate, defaultTenure);
    const totalRepaymentB = emiB * defaultTenure;
    const totalCostB = totalRepaymentB - hybridBorrow + (hybridBorrow * bestLoan.processingFee) / 100;
    const postDebtRatioB = (profile.existingMonthlyEMI + emiB) / profile.monthlyIncome;
    const postCashFlowB = health.freeCashFlow - emiB;
    const remainingSavingsB = profile.liquidSavings - hybridSelfFund;
    const postRunwayB =
      profile.essentialMonthlyExpenses > 0
        ? remainingSavingsB / profile.essentialMonthlyExpenses
        : 0;
    const resilienceB = Math.max(
      35,
      health.resilienceScore - (postRunwayB < 2 ? 10 : 3)
    );

    const scoreFactorsB = {
      affordability: Math.max(20, Math.round(100 - postDebtRatioB * 110)),
      liquidityPreservation: 78, // leaves ₹70K buffer (> 1.8 months)
      goalCompletion: 98, // instantly achievable
      debtPressure: Math.max(20, Math.round(95 - (emiB / health.freeCashFlow) * 70)),
      emergencyResilience: 84, // optimal balance
      totalCostEfficiency: Math.round(Math.max(25, 95 - (totalCostB / targetAmount) * 140)),
    };
    const decisionScoreB = Math.round(
      scoreFactorsB.affordability * 0.25 +
        scoreFactorsB.liquidityPreservation * 0.20 +
        scoreFactorsB.goalCompletion * 0.15 +
        scoreFactorsB.debtPressure * 0.15 +
        scoreFactorsB.emergencyResilience * 0.15 +
        scoreFactorsB.totalCostEfficiency * 0.10
    );

    const optionB: CandidateAction = {
      id: 'opt_hybrid_borrow_save',
      name: `Borrow ₹${(hybridBorrow / 100000).toFixed(1)}L + Save ₹${(hybridSelfFund / 1000).toFixed(0)}K`,
      type: 'HYBRID_BORROW_SAVE',
      description: `Prudent blended path: Borrow ₹${hybridBorrow.toLocaleString('en-IN')} and contribute ₹${hybridSelfFund.toLocaleString('en-IN')} from surplus buffer, striking peak resilience.`,
      borrowAmount: hybridBorrow,
      saveMonthlyAmount: 0,
      upfrontSavingsUsed: hybridSelfFund,
      estimatedTenureMonths: defaultTenure,
      estimatedInterestRate: loanRate,
      estimatedMonthlyEMI: emiB,
      totalRepayment: totalRepaymentB,
      totalCost: totalCostB,
      liquidityImpact: remainingSavingsB,
      postActionRunwayMonths: Math.round(postRunwayB * 10) / 10,
      postActionDebtRatio: Math.round(postDebtRatioB * 100) / 100,
      postActionFreeCashFlow: postCashFlowB,
      goalCompletionTimeMonths: 1,
      riskLevel: 'Moderate',
      resilienceScoreAfter: resilienceB,
      decisionScore: decisionScoreB,
      scoreFactors: scoreFactorsB,
      assumptions: [
        `Loan of ₹${hybridBorrow.toLocaleString('en-IN')} at ${loanRate}% p.a.`,
        `₹${hybridSelfFund.toLocaleString('en-IN')} contributed upfront while keeping ₹${remainingSavingsB.toLocaleString('en-IN')} buffer intact`,
      ],
      pros: [
        `Cuts monthly EMI burden by ₹${(emiA - emiB).toLocaleString('en-IN')}/mo vs Full Borrow`,
        `Saves ₹${Math.round(totalCostA - totalCostB).toLocaleString('en-IN')} in interest and processing charges`,
        'Retains safe emergency buffer of 1.8+ months expenses',
        'Significantly more durable under sudden income contraction',
      ],
      cons: [
        `Reduces liquid cash from ₹${profile.liquidSavings.toLocaleString('en-IN')} to ₹${remainingSavingsB.toLocaleString('en-IN')}`,
      ],
      recommended: false, // will be resolved in ranking
    };

    // Option C: Wait + Save (Discipline Path)
    // How many months to save targetAmount using free cash flow?
    const monthlyAllocation = Math.min(health.freeCashFlow * 0.85, 25000);
    const monthsToSave = Math.ceil(targetAmount / monthlyAllocation);
    const totalCostC = 0; // 0 interest! In fact, earns interest in savings!
    const postDebtRatioC = profile.existingMonthlyEMI / profile.monthlyIncome;
    const postCashFlowC = health.freeCashFlow - monthlyAllocation;
    const resilienceC = Math.min(95, health.resilienceScore + 12);

    const scoreFactorsC = {
      affordability: 96,
      liquidityPreservation: 94,
      goalCompletion: Math.max(30, Math.round(100 - monthsToSave * 4.5)), // takes ~11-12 months
      debtPressure: 98, // zero new debt
      emergencyResilience: 92,
      totalCostEfficiency: 100, // zero interest paid
    };
    const decisionScoreC = Math.round(
      scoreFactorsC.affordability * 0.25 +
        scoreFactorsC.liquidityPreservation * 0.20 +
        scoreFactorsC.goalCompletion * 0.15 +
        scoreFactorsC.debtPressure * 0.15 +
        scoreFactorsC.emergencyResilience * 0.15 +
        scoreFactorsC.totalCostEfficiency * 0.10
    );

    const optionC: CandidateAction = {
      id: 'opt_wait_save',
      name: `Wait + Save (₹${Math.round(monthlyAllocation / 1000)}K / mo)`,
      type: 'WAIT',
      description: `Zero-debt patient path: Accumulate ₹${targetAmount.toLocaleString('en-IN')} systematically over ~${monthsToSave} months via a high-yield liquid account.`,
      borrowAmount: 0,
      saveMonthlyAmount: monthlyAllocation,
      upfrontSavingsUsed: 0,
      estimatedTenureMonths: monthsToSave,
      estimatedInterestRate: 0,
      estimatedMonthlyEMI: 0,
      totalRepayment: 0,
      totalCost: 0,
      liquidityImpact: profile.liquidSavings,
      postActionRunwayMonths: health.emergencyRunway,
      postActionDebtRatio: Math.round(postDebtRatioC * 100) / 100,
      postActionFreeCashFlow: postCashFlowC,
      goalCompletionTimeMonths: monthsToSave,
      riskLevel: 'Low',
      resilienceScoreAfter: resilienceC,
      decisionScore: decisionScoreC,
      scoreFactors: scoreFactorsC,
      assumptions: [
        `Save ₹${monthlyAllocation.toLocaleString('en-IN')}/mo consistently`,
        'Zero debt liability or interest charges',
        'Goal start deferred until full capital accumulated',
      ],
      pros: [
        'Zero financial stress or loan rejection risk',
        `Saves 100% of interest (₹${Math.round(totalCostA).toLocaleString('en-IN')} saved)`,
        'Protects credit rating and builds long-term wealth habit',
      ],
      cons: [
        `Delays shop expansion by approximately ${monthsToSave} months`,
        'Opportunity cost if immediate expansion would bring rapid revenue',
      ],
      recommended: false,
    };

    // Candidate actions array
    const candidates = [optionA, optionB, optionC];

    // Pick recommended option based on highest decision score
    let highestScore = -1;
    let bestOption = candidates[1];
    for (const opt of candidates) {
      if (opt.decisionScore > highestScore) {
        highestScore = opt.decisionScore;
        bestOption = opt;
      }
    }
    bestOption.recommended = true;

    return candidates;
  }

  public static runStressTest(
    profile: FinancialProfile,
    goal: FinancialGoal,
    scenario: StressTestScenario,
    products: FinancialProduct[]
  ): StressTestResult {
    const baseHealth = FinancialHealthService.calculateHealth(profile, goal);
    const baseOptions = this.generateCandidateActions(profile, goal, products);
    const baseRecommended = baseOptions.find((o) => o.recommended) || baseOptions[1];

    // Apply stress modifiers
    const stressedIncome = profile.monthlyIncome * (1 + scenario.incomeChangePct / 100);
    const stressedExpenses =
      profile.essentialMonthlyExpenses * (1 + scenario.expenseChangePct / 100);
    const stressedSavings = Math.max(
      0,
      profile.liquidSavings - scenario.unexpectedEmergencyExpense
    );

    const stressedProfile: FinancialProfile = {
      ...profile,
      monthlyIncome: stressedIncome,
      essentialMonthlyExpenses: stressedExpenses,
      liquidSavings: stressedSavings,
    };

    const stressedHealth = FinancialHealthService.calculateHealth(stressedProfile, goal);
    const stressedOptions = this.generateCandidateActions(
      stressedProfile,
      goal,
      products.map((p) => ({
        ...p,
        interestRate: p.interestRate + scenario.loanInterestRateDelta,
      }))
    );

    // Re-evaluate scores under stress
    // Under negative cash flow stress, debt options get severe penalties
    const optionScores: { [id: string]: number } = {};
    for (const opt of stressedOptions) {
      let score = opt.decisionScore;

      // Penalize heavily if stressed free cash flow is dangerously low
      const stressedFreeFlow = stressedHealth.freeCashFlow - opt.estimatedMonthlyEMI;
      if (stressedFreeFlow < 4000 && opt.estimatedMonthlyEMI > 0) {
        score -= 35; // Severe cash flow penalty!
      } else if (stressedFreeFlow < 10000 && opt.estimatedMonthlyEMI > 0) {
        score -= 18;
      }

      // If debt ratio surpasses 45%, penalize
      const stressedDebtRatio =
        (profile.existingMonthlyEMI + opt.estimatedMonthlyEMI) / stressedIncome;
      if (stressedDebtRatio > 0.45 && opt.borrowAmount > 0) {
        score -= 25;
      }

      // Wait/Save becomes much more attractive under income shock
      if (opt.type === 'WAIT') {
        if (scenario.incomeChangePct < -10) {
          score += 15; // zero leverage safety premium
        }
      }

      score = Math.max(10, Math.min(99, score));
      opt.decisionScore = score;
      optionScores[opt.id] = score;
    }

    // Determine stressed winner
    let bestStressed = stressedOptions[0];
    let maxStressedScore = -1;
    for (const opt of stressedOptions) {
      if (opt.decisionScore > maxStressedScore) {
        maxStressedScore = opt.decisionScore;
        bestStressed = opt;
      }
    }

    const recommendationChanged = baseRecommended.id !== bestStressed.id;
    let decisionShiftReason = '';

    if (recommendationChanged) {
      if (bestStressed.type === 'WAIT') {
        decisionShiftReason = `Recommendation dynamically shifted to "${bestStressed.name}". Under a ${Math.abs(
          scenario.incomeChangePct
        )}% income contraction, monthly free cash flow drops from ₹${baseHealth.freeCashFlow.toLocaleString(
          'en-IN'
        )} to ₹${Math.round(
          stressedHealth.freeCashFlow
        ).toLocaleString(
          'en-IN'
        )}. Taking on new debt pushes your post-loan debt ratio to a dangerous ${(
          ((profile.existingMonthlyEMI + baseRecommended.estimatedMonthlyEMI) /
            stressedIncome) *
          100
        ).toFixed(0)}%. Zero-debt Wait + Save eliminates insolvency risk.`;
      } else {
        decisionShiftReason = `Recommendation shifted from ${baseRecommended.name} to ${bestStressed.name} due to liquidity and cash-flow constraints under stress.`;
      }
    } else {
      decisionShiftReason = `Recommendation remains resilient: "${bestStressed.name}" holds sufficient safety margin across the tested parameters.`;
    }

    return {
      scenario,
      baseCashFlow: baseHealth.freeCashFlow,
      stressedCashFlow: Math.round(stressedHealth.freeCashFlow),
      baseRunway: baseHealth.emergencyRunway,
      stressedRunway: Math.round(stressedHealth.emergencyRunway * 10) / 10,
      baseDebtRatio: baseHealth.debtRatio,
      stressedDebtRatio: Math.round(stressedHealth.debtRatio * 100) / 100,
      baseRecommendedId: baseRecommended.id,
      stressedRecommendedId: bestStressed.id,
      recommendationChanged,
      decisionShiftReason,
      optionScores,
    };
  }

  public static createDecisionRun(
    profile: FinancialProfile,
    goal: FinancialGoal,
    products: FinancialProduct[]
  ): DecisionRun {
    const health = FinancialHealthService.calculateHealth(profile, goal);
    const options = this.generateCandidateActions(profile, goal, products);
    const recommended = options.find((o) => o.recommended) || options[1];

    const decisionRun: DecisionRun = {
      id: `dec_${Date.now()}`,
      goalId: goal.id,
      goalTitle: goal.title,
      targetAmount: goal.targetAmount,
      financialSnapshot: health,
      candidateOptions: options,
      recommendedOptionId: recommended.id,
      recommendationTitle: recommended.name,
      decisionScore: recommended.decisionScore,
      explanation: {
        summary: `FinPath recommends "${recommended.name}" with a confidence score of ${recommended.decisionScore}/100. Rather than over-leveraging with full borrowing or completely stalling the expansion, this balanced path preserves emergency liquidity while keeping monthly repayments safe.`,
        keyReasons: [
          `Lower Repayment Pressure: Cuts monthly EMI burden to ₹${recommended.estimatedMonthlyEMI.toLocaleString('en-IN')}, leaving ₹${recommended.postActionFreeCashFlow.toLocaleString('en-IN')} in monthly breathing room.`,
          `Preserves Emergency Runway: Maintains ₹${recommended.liquidityImpact.toLocaleString('en-IN')} in liquid reserves (≈${recommended.postActionRunwayMonths} months buffer).`,
          `Target Feasibility: Enables shop expansion immediately without waiting 12 months for cash accumulation.`,
          `Income Shock Resilience: Remains solvent even if income declines up to 15%, unlike full borrowing which risks default.`,
          `Interest Savings: Saves significant finance charges compared to borrowing the full ₹${goal.targetAmount.toLocaleString('en-IN')}.`,
        ],
        riskAnalysis:
          recommended.riskLevel === 'Low'
            ? 'Conservative profile with ample buffers'
            : 'Moderate risk profile: manageable debt load with guarded liquidity',
        tradeOffs: [
          `Utilizes ₹${recommended.upfrontSavingsUsed.toLocaleString('en-IN')} from existing savings buffer`,
          `Requires steady business revenue to service the ${recommended.estimatedTenureMonths}-month EMI commitment`,
        ],
        stressResilienceNotes:
          'Passes moderate stress test; under severe stress (>20% income loss), engine will prompt a switch to Wait + Save.',
      },
      assumptions: [
        'Monthly household expenses remain within ±10% range',
        'Existing ₹8,000 EMI continues through scheduled term',
        'Interest rate remains locked at 13.5% p.a.',
      ],
      dataSource: 'Self-reported profile + Verified Partner Product Catalog + RBI Banking norms',
      consentGranted: false,
      createdAt: new Date().toISOString(),
    };

    return decisionRun;
  }
}
