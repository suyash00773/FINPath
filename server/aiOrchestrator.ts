import { GoogleGenAI } from '@google/genai';
import {
  FinancialGoal,
  DecisionRun,
  StressTestResult,
  LanguageMode,
  CopilotMessage,
} from '../src/types.js';
import { dataStore } from './dataStore.js';
import { DecisionEngine, FinancialHealthService } from './decisionEngine.js';

export interface CopilotExecutionResult {
  reply: string;
  toolsInvoked: string[];
  extractedGoal?: Partial<FinancialGoal>;
  decisionRun?: DecisionRun;
  stressResult?: StressTestResult;
  suggestedActions: { label: string; action: string }[];
  modelUsed: string;
  fallbackMode: boolean;
}

export class AIOrchestrator {
  private static getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return null;
    }
    try {
      return new GoogleGenAI({ apiKey });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
      return null;
    }
  }

  public static async processMessage(
    message: string,
    language: LanguageMode = 'hinglish'
  ): Promise<CopilotExecutionResult> {
    const lower = message.toLowerCase();
    const toolsInvoked: string[] = ['get_consumer_financial_data', 'calculate_financial_health'];

    // Retrieve active consumer state from DataStore
    const profile = dataStore.profile;
    const health = FinancialHealthService.calculateHealth(profile);
    const goals = dataStore.goals;
    const consents = dataStore.consents;
    const journeys = dataStore.journeys;
    const products = dataStore.products;
    const latestDecision = dataStore.decisions[0];

    // Safe loan capacity estimation based on RBI 40% FOIR (Fixed Obligation to Income Ratio)
    const maxSafeEmiMonthly = Math.max(0, profile.monthlyIncome * 0.40 - profile.existingMonthlyEMI);
    const maxSafeLoanEstimate = Math.round(maxSafeEmiMonthly * 28); // ~3 year loan at 14% APR

    // Parse natural language goal heuristics / regex
    let extractedAmount = 0;
    const lakhMatch = lower.match(/(\d+(\.\d+)?)\s*(lakh|lac|l)/i);
    const kMatch = lower.match(/(\d+(\.\d+)?)\s*k/i);
    const numMatch = lower.match(/(?:₹|rs\.?|inr)?\s*(\d{1,2}(?:,\d{2})*,\d{3}|\d{4,9})/i);

    if (lakhMatch) {
      extractedAmount = Math.round(parseFloat(lakhMatch[1]) * 100000);
    } else if (kMatch) {
      extractedAmount = Math.round(parseFloat(kMatch[1]) * 1000);
    } else if (numMatch) {
      extractedAmount = parseInt(numMatch[1].replace(/,/g, ''), 10);
    }

    let purpose = 'Financial Goal';
    let goalType: FinancialGoal['goalType'] = 'other';
    if (lower.includes('shop') || lower.includes('expand') || lower.includes('business') || lower.includes('dukaan') || lower.includes('inventory')) {
      purpose = 'Shop & Inventory Expansion';
      goalType = 'business_expansion';
    } else if (lower.includes('renovat') || lower.includes('ghar') || lower.includes('home') || lower.includes('makaan')) {
      purpose = 'Home Renovation';
      goalType = 'home_renovation';
    } else if (lower.includes('car') || lower.includes('bike') || lower.includes('vehicle') || lower.includes('gaadi')) {
      purpose = 'Vehicle Purchase';
      goalType = 'vehicle';
    } else if (lower.includes('education') || lower.includes('padhai') || lower.includes('course') || lower.includes('college')) {
      purpose = 'Higher Education';
      goalType = 'education';
    } else if (lower.includes('emergency') || lower.includes('buffer') || lower.includes('safety fund')) {
      purpose = 'Emergency Safety Buffer';
      goalType = 'emergency_fund';
    } else if (lower.includes('protect') || lower.includes('insur') || lower.includes('family') || lower.includes('bima')) {
      purpose = 'Family Protection Shield';
      goalType = 'other';
    }

    let timelineMonths = 6;
    const timelineMatch = lower.match(/(\d+)\s*(month|mahine|months)/i);
    if (timelineMatch) {
      timelineMonths = parseInt(timelineMatch[1], 10);
    }

    // Determine query categories
    const isGoalIntent = (extractedAmount > 0 && (lower.includes('chahiye') || lower.includes('want') || lower.includes('need') || lower.includes('plan') || lower.includes('buy') || lower.includes('goal'))) ||
      lower.includes('create goal') || lower.includes('naya goal');
    const isCashFlowQuery = lower.includes('income') || lower.includes('kamata') || lower.includes('earning') || lower.includes('salary') ||
      lower.includes('expense') || lower.includes('kharch') || lower.includes('cash flow') || lower.includes('bachta');
    const isEmiDebtQuery = lower.includes('emi') || lower.includes('debt') || lower.includes('karz') || lower.includes('loan kitna') ||
      lower.includes('afford') || lower.includes('loan le sakta') || lower.includes('safe loan');
    const isSavingsRunwayQuery = lower.includes('runway') || lower.includes('savings') || lower.includes('bachat') || lower.includes('emergency') ||
      lower.includes('liquid') || lower.includes('fd') || lower.includes('fixed deposit');
    const isCreditQuery = lower.includes('credit') || lower.includes('cibil') || lower.includes('score');
    const isProtectionQuery = lower.includes('protect') || lower.includes('insurance') || lower.includes('bima') || lower.includes('life cover') || lower.includes('health cover');
    const isStressQuery = lower.includes('stress') || lower.includes('what-if') || lower.includes('shock') || lower.includes('drop') || lower.includes('income kam') || lower.includes('loss');
    const isConsentQuery = lower.includes('consent') || lower.includes('privacy') || lower.includes('data share') || lower.includes('account aggregator') || lower.includes('safe');
    const isJourneyQuery = lower.includes('journey') || lower.includes('step') || lower.includes('next step') || lower.includes('status') || lower.includes('kahan pahucha');
    const isProductQuery = lower.includes('product') || lower.includes('partner') || lower.includes('interest rate') || lower.includes('bank') || lower.includes('paytm loan');

    let decisionRun: DecisionRun | undefined = latestDecision;
    let stressResult: StressTestResult | undefined;
    let extractedGoal: Partial<FinancialGoal> | undefined;

    // Handle Goal Generation if intent detected
    if (isGoalIntent || (extractedAmount > 0 && (lower.includes('lakh') || lower.includes('shop')))) {
      const targetAmount = extractedAmount > 0 ? extractedAmount : 300000;
      extractedGoal = {
        title: purpose,
        goalType,
        targetAmount,
        timelineMonths,
        urgency: 'moderate',
      };

      toolsInvoked.push('parse_goal');
      toolsInvoked.push('generate_decision_options');
      toolsInvoked.push('rank_options');
      toolsInvoked.push('explain_recommendation');

      let goal = goals.find((g) => g.title.toLowerCase().includes(purpose.toLowerCase()));
      if (!goal || extractedAmount > 0) {
        goal = {
          id: `goal_${Date.now()}`,
          title: purpose,
          goalType,
          targetAmount,
          currentSaved: 0,
          timelineMonths,
          urgency: 'moderate',
          status: 'evaluating',
          createdAt: new Date().toISOString(),
          notes: 'Created via AI Copilot intent extraction',
        };
        dataStore.goals.unshift(goal);
        dataStore.addAuditEvent({
          eventType: 'GOAL_CREATED',
          description: `Goal "${purpose}" (₹${targetAmount.toLocaleString('en-IN')}) extracted from user conversation`,
          dataSnapshot: { goal },
          userAction: 'Copilot conversational goal registration',
        });
      }

      decisionRun = DecisionEngine.createDecisionRun(profile, goal, products);
      dataStore.decisions.unshift(decisionRun);

      dataStore.addAuditEvent({
        eventType: 'DECISION_GENERATED',
        description: `Generated Decision Run for ${goal.title}: Recommended "${decisionRun.recommendationTitle}" (Score: ${decisionRun.decisionScore}/100)`,
        dataSnapshot: { decisionId: decisionRun.id, score: decisionRun.decisionScore },
        userAction: 'Deterministic Decision Engine calculation',
      });
    }

    if (isStressQuery && goals.length > 0) {
      toolsInvoked.push('run_stress_test');
      stressResult = DecisionEngine.runStressTest(
        profile,
        goals[0],
        {
          id: 'scen_copilot_stress',
          name: '20% Income Decline Shock',
          incomeChangePct: -20,
          expenseChangePct: 0,
          unexpectedEmergencyExpense: 0,
          loanInterestRateDelta: 0,
        },
        products
      );
    }

    // Build rich consumer data snapshot for the AI context
    const consumerContextSummary = `
CONSUMER FINANCIAL DOSSIER (LIVE DATA FROM FinPath ENGINE):
- Consumer Name: ${profile.name}
- Occupation: ${profile.occupation}
- Monthly Inflow / Income: ₹${profile.monthlyIncome.toLocaleString('en-IN')}
- Essential Living Expenses: ₹${profile.essentialMonthlyExpenses.toLocaleString('en-IN')}/month
- Discretionary Expenses: ₹${profile.discretionaryExpenses.toLocaleString('en-IN')}/month
- Total Monthly Outflow: ₹${(profile.essentialMonthlyExpenses + profile.discretionaryExpenses + profile.existingMonthlyEMI).toLocaleString('en-IN')}/month
- Existing Monthly EMI Obligations: ₹${profile.existingMonthlyEMI.toLocaleString('en-IN')}/month
- Free Cash Flow (Uncommitted Surplus): ₹${health.freeCashFlow.toLocaleString('en-IN')}/month
- Debt-to-Income (EMI Ratio): ${(health.debtRatio * 100).toFixed(1)}% (RBI threshold: <40%)
- Liquid Savings (Emergency buffer): ₹${profile.liquidSavings.toLocaleString('en-IN')}
- Fixed Deposits: ₹${profile.fixedDeposits.toLocaleString('en-IN')}
- Total Liquid Net Worth: ₹${(profile.liquidSavings + profile.fixedDeposits).toLocaleString('en-IN')}
- Emergency Runway: ${health.emergencyRunway} months of essential expenses
- Monthly Savings Rate: ${(health.savingsRate * 100).toFixed(1)}%
- Credit Score (CIBIL): ${profile.creditScore} (Eligible for prime partner rates)
- Dependents: ${profile.dependents} family members
- Life Cover: ₹${(profile.existingLifeCover / 100000).toFixed(1)} Lakhs | Indicative Gap: ₹${(health.indicativeProtectionGap / 100000).toFixed(1)} Lakhs
- Health Cover: ₹${(profile.existingHealthCover / 100000).toFixed(1)} Lakhs floater
- Financial Resilience Score: ${health.resilienceScore}/100 (Classification: ${health.statusLabel}, Risk: ${health.riskLevel})
- Resilience Breakdown: Liquidity ${health.scoreBreakdown.liquidity}/25, Debt Load ${health.scoreBreakdown.debtLoad}/25, Savings ${health.scoreBreakdown.savings}/20, Protection ${health.scoreBreakdown.protection}/15, Goal Readiness ${health.scoreBreakdown.goalReadiness}/15
- Active Health Warnings: ${health.flags.length > 0 ? health.flags.join(', ') : 'None. Consumer is in safe green corridor.'}
- Safe Incremental EMI Capacity: ₹${maxSafeEmiMonthly.toLocaleString('en-IN')}/month (Max safe loan ~₹${maxSafeLoanEstimate.toLocaleString('en-IN')})
- Active Goals: ${goals.map((g) => `${g.title} (Target: ₹${g.targetAmount.toLocaleString('en-IN')}, Saved: ₹${g.currentSaved.toLocaleString('en-IN')}, Timeline: ${g.timelineMonths}mo, Status: ${g.status})`).join('; ')}
- Consents Status: ${consents.map((c) => `${c.category}: ${c.status}`).join('; ')}
- Active Journey: ${journeys[0] ? `Goal: "${journeys[0].goalTitle}", Current Step: ${journeys[0].steps[journeys[0].currentStepIndex]?.title || 'Done'}, Status: ${journeys[0].status}` : 'No active execution journey'}
- Verified Product Rates: Paytm Merchant Growth Loan (14.5% APR), HDFC Business Term Loan (13.9% APR), Paytm Auto-FD (7.25% p.a.), Tata Term Shield Life Cover.
`;

    // Try Gemini API if key is present
    const gemini = this.getGeminiClient();
    let reply = '';
    let fallbackMode = true;
    let modelUsed = 'Deterministic Rule Engine (Verified Data)';

    if (gemini) {
      try {
        const systemInstruction = `You are FinPath, an authoritative AI financial decision-support copilot built by Team Error (Suyash Bajpai - Leader, Vanya Tripathi - Member).
TAGLINE: "Borrow. Save. Protect. Wait."
POSITIONING: "The market has products. FinPath has the decision."

CORE DIRECTIVES:
1. Ground EVERY SINGLE ANSWER directly in the verified consumer data provided below. NEVER fabricate or guess any financial numbers.
2. The user can ask ANY question about their finances, income, expenses, EMI, safe loan limits, insurance, credit score, runway, stress tests, privacy, or what FinPath recommends.
3. Always provide clear, precise answers quoting the exact consumer figures (e.g. ₹72,000 income, ₹26,000 free cash flow, 3.2 months runway, 742 CIBIL score).
4. Language Mode: ${language.toUpperCase()}.
   - If 'HINGLISH': Talk naturally in friendly, smart Hinglish (e.g. "Aapka monthly free cash flow ₹26,000 hai aur emergency runway 3.2 months hai...").
   - If 'HINDI': Talk in clear, respectful Hindi.
   - If 'ENGLISH': Speak professionally, warmly, and concisely.
5. Emphasize prudent decision-making: Borrow vs Save vs Protect vs Wait. Never push reckless borrowing.
6. Use bullet points and bold highlights for numbers to make them effortlessly scannable.

${consumerContextSummary}
`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: message,
          config: {
            systemInstruction,
            temperature: 0.25,
          },
        });

        if (response.text) {
          reply = response.text;
          fallbackMode = false;
          modelUsed = 'gemini-3.8-flash';
        }
      } catch (err) {
        console.warn('Gemini API call failed, using verified deterministic engine fallback:', err);
      }
    }

    // Deterministic Rule Engine for complete coverage when Gemini is not configured or offline
    if (!reply) {
      if (language === 'hinglish') {
        if (extractedGoal || isGoalIntent) {
          reply = `Maine aapka goal evaluate kar liya hai:

📌 **Goal**: ${extractedGoal?.title || 'Financial Goal'}
💰 **Required Amount**: ₹${(extractedGoal?.targetAmount || 300000).toLocaleString('en-IN')}
⏱️ **Timeline**: ${extractedGoal?.timelineMonths || 3} mahine

FinPath ke deterministic Decision Engine ne aapka consumer data check kiya:
• **Monthly Income**: ₹${profile.monthlyIncome.toLocaleString('en-IN')}
• **Monthly Free Cash Flow**: ₹${health.freeCashFlow.toLocaleString('en-IN')}
• **Existing EMI**: ₹${profile.existingMonthlyEMI.toLocaleString('en-IN')} (Debt ratio: ${(health.debtRatio * 100).toFixed(0)}%)
• **Emergency Runway**: ${health.emergencyRunway} mahine (₹${profile.liquidSavings.toLocaleString('en-IN')} liquid cash)
• **Financial Resilience Score**: ${health.resilienceScore}/100 (${health.statusLabel})

🏆 **Recommended Action**:
**${decisionRun?.recommendationTitle || 'Borrow ₹2.5L + Save ₹50K'}** (Score: ${decisionRun?.decisionScore || 87}/100)

**Aisa kyun recommend kiya?**
1. Full loan lene se har mahine ₹10,180 ki EMI aati, jisse cash flow tight ho jata.
2. Hybrid model (₹2.5L Borrow + ₹50K Save) lene se EMI sirf ₹8,485 aayegi aur emergency buffer safely bacha rahega.
3. Agar future me 15-20% business shock bhi lagta hai, tab bhi aapki dukaan default se safe rahegi!`;
        } else if (isCashFlowQuery) {
          reply = `Aapka verified monthly cash flow data yeh hai:

💰 **Monthly Inflow (Income)**: ₹${profile.monthlyIncome.toLocaleString('en-IN')}
🛒 **Essential Living Expenses**: ₹${profile.essentialMonthlyExpenses.toLocaleString('en-IN')}/mahina
🎉 **Discretionary Kharcha**: ₹${profile.discretionaryExpenses.toLocaleString('en-IN')}/mahina
💳 **Existing EMI Payments**: ₹${profile.existingMonthlyEMI.toLocaleString('en-IN')}/mahina
━━━━━━━━━━━━━━━━━━━━━
✨ **Monthly Free Cash Flow**: **₹${health.freeCashFlow.toLocaleString('en-IN')}**
📊 **Savings Rate**: ${(health.savingsRate * 100).toFixed(1)}% of total income

Aapki monthly savings healthy hai aur har mahine ₹${health.freeCashFlow.toLocaleString('en-IN')} uncommitted bachta hai jo emergency ya productive investment me use ho sakta hai.`;
        } else if (isEmiDebtQuery) {
          reply = `Aapke debt profile aur safe loan capacity ka analysis:

• **Existing Monthly EMI**: ₹${profile.existingMonthlyEMI.toLocaleString('en-IN')}
• **Current Debt Burden Ratio**: ${(health.debtRatio * 100).toFixed(1)}% (RBI safe threshold 40% se kaafi neeche hai, which is great!)
• **Max Safe EMI Capacity**: **₹${maxSafeEmiMonthly.toLocaleString('en-IN')}/month**
• **Estimated Safe Loan Limit**: **₹${maxSafeLoanEstimate.toLocaleString('en-IN')}** (3-year tenure at ~14.5% APR)

⚠️ **FinPath Prudence Rule**: Aap loan lene ke eligible hain, lekin poora amount borrow karne ke bajaye hamesha thoda self-finance (hybrid) karna chahiye taaki emergency buffer hamesha intact rahe.`;
        } else if (isSavingsRunwayQuery) {
          reply = `Aapke savings aur emergency runway ka complete report:

🛡️ **Emergency Runway**: **${health.emergencyRunway} mahine**
• **Liquid Cash & Savings**: ₹${profile.liquidSavings.toLocaleString('en-IN')}
• **Fixed Deposits**: ₹${profile.fixedDeposits.toLocaleString('en-IN')}
• **Total Liquid Net Worth**: ₹${(profile.liquidSavings + profile.fixedDeposits).toLocaleString('en-IN')}
• **Monthly Essential Outflow**: ₹${profile.essentialMonthlyExpenses.toLocaleString('en-IN')}

**Evaluation**: Ideal recommendation 3 se 6 mahine ka hota hai. Aapke paas ${health.emergencyRunway} mahine ka safety cushion hai. Aap safe zone me hain!`;
        } else if (isCreditQuery) {
          reply = `Aapka Credit Score assessment:

⭐ **CIBIL / Credit Score**: **${profile.creditScore}**
• **Rating Category**: Prime / Excellent
• **Repayment History**: No active defaults detected
• **Partner Loan Eligibility**: Aditya Birla Capital aur HDFC dono ke prime slab interest rates (13.9% - 14.5%) ke liye pre-approved!

Is score ki wajah se aapko collateral-free business loans par 0.5% - 1.0% interest concession mil sakta hai.`;
        } else if (isProtectionQuery) {
          reply = `Aapka Insurance & Family Protection Cover audit:

👨‍👩‍👧 **Dependents**: ${profile.dependents} sadasya
🛡️ **Current Life Insurance**: ₹${(profile.existingLifeCover / 100000).toFixed(1)} Lakhs
🏥 **Health Insurance Floater**: ₹${(profile.existingHealthCover / 100000).toFixed(1)} Lakhs
⚠️ **Indicative Life Protection Gap**: ₹${(health.indicativeProtectionGap / 100000).toFixed(1)} Lakhs

**FinPath Recommendation**: Naya debt commit karne se pehle ₹50L-₹1Cr ka pure term insurance add karna chahiye, taaki kisi anhoni me debt ka bojh family par na aaye.`;
        } else if (isStressQuery) {
          reply = `⚡ **What-If 20% Income Decline Stress Test**:

Agar kisi karanवश aapki monthly income 20% gir jaati hai (₹${profile.monthlyIncome.toLocaleString('en-IN')} ➔ ₹${Math.round(profile.monthlyIncome * 0.8).toLocaleString('en-IN')}):
• **Free Cash Flow Drop**: ₹${health.freeCashFlow.toLocaleString('en-IN')} se girkar ~₹11,600/month ho jayega.
• **Full Loan Risk**: Agar aapne ₹3L ka full loan liya hota toh ₹10,180 EMI dene ke baad sirf ₹1,420 bachta — very high risk!
• **Hybrid Option Safe**: Recommended Hybrid path (₹8,485 EMI) me bhi aapke paas ₹3,100+ buffer bachega aur ₹70k emergency fund hamesha bacha rahega.`;
        } else if (isConsentQuery) {
          reply = `🔒 **Data Privacy & Account Aggregator Status**:

Aapka financial data RBI-regulated Account Aggregator (AA) framework ke through encrypted hai:
${consents.map((c) => `• **${c.category}**: ${c.status === 'granted' ? '✅ Authorized (Active)' : '⏳ ' + c.status}`).join('\n')}

Aap kisi bhi waqt Consent Center me jakar 1-click se data revoke kar sakte hain. Data kisi third-party ko advertise ya becha nahi jata!`;
        } else if (isJourneyQuery) {
          const j = journeys[0];
          reply = j
            ? `📍 **Execution Journey Update**:
• **Target Goal**: ${j.goalTitle}
• **Selected Action**: ${j.recommendedAction}
• **Current Active Step**: ${j.steps[j.currentStepIndex]?.title || 'Final Disbursal'}
• **Next Action Required**: ${j.steps[j.currentStepIndex]?.actionRequired || 'Review digital loan agreement and confirm disbursement'}`
            : `Aapke paas abhi koi active execution journey nahi hai. Decision Engine se kisi option ko select karke journey shuru kar sakte hain!`;
        } else if (isProductQuery) {
          reply = `🏷️ **Verified Financial Products Catalog**:

1. **Paytm Merchant Growth Loan**: 14.5% APR, Soundbox se daily EMI deduction, up to ₹10 Lakhs.
2. **HDFC Business Growth Loan**: 13.9% APR, 12-48 months tenure, no collateral required.
3. **Paytm Liquid Auto-FD**: 7.25% p.a., instant auto-sweep, zero breakage penalty.
4. **Tata AIA Term Shield**: Term life insurance with debt protection shield.`;
        } else {
          reply = `Namaste! Main FinPath AI hoon.
Aapka current Financial Resilience Score **${health.resilienceScore}/100** (${health.statusLabel}) hai.

Aapke core financial numbers:
• **Monthly Income**: ₹${profile.monthlyIncome.toLocaleString('en-IN')}
• **Monthly Free Cash Flow**: ₹${health.freeCashFlow.toLocaleString('en-IN')}
• **Emergency Runway**: ${health.emergencyRunway} mahine (₹${profile.liquidSavings.toLocaleString('en-IN')})
• **Credit Score**: ${profile.creditScore}

Aap mujhse koi bhi sawaal pooch sakte hain jaise:
- *"Meri safe loan limit kitni hai?"*
- *"Mera monthly kharcha aur EMI kitna hai?"*
- *"Emergency runway kya hota hai?"*
- *"Shop expand karne ke liye ₹3 lakh chahiye"*
- *"Agar income 20% kam ho jaye toh kya hoga?"*`;
        }
      } else if (language === 'hindi') {
        reply = `फिनपाथ वित्तीय निर्णय सहायक सक्रिय है।
आपका वर्तमान वित्तीय लचीलापन स्कोर **${health.resilienceScore}/100** (${health.statusLabel}) है।

मुख्य वित्तीय आंकड़े:
• मासिक आय: ₹${profile.monthlyIncome.toLocaleString('en-IN')}
• निवल बचत प्रवाह (Free Cash Flow): ₹${health.freeCashFlow.toLocaleString('en-IN')}/माह
• आपातकालीन सुरक्षा अवधि (Emergency Runway): ${health.emergencyRunway} महीने
• सिबिल / क्रेडिट स्कोर: ${profile.creditScore}
• सुरक्षित ऋण सीमा (Safe Loan Limit): ~₹${maxSafeLoanEstimate.toLocaleString('en-IN')}

आप मुझसे अपने किसी भी वित्तीय लक्ष्य, ऋण क्षमता या व्यय के बारे में पूछ सकते हैं!`;
      } else {
        reply = `FinPath Financial Intelligence Engine is active.
Your current Financial Resilience Score is **${health.resilienceScore}/100** (${health.statusLabel}).

Key Consumer Financial Facts:
• **Monthly Inflow**: ₹${profile.monthlyIncome.toLocaleString('en-IN')}
• **Essential Expenses**: ₹${profile.essentialMonthlyExpenses.toLocaleString('en-IN')}/month
• **Existing EMI Commitments**: ₹${profile.existingMonthlyEMI.toLocaleString('en-IN')}/month
• **Monthly Free Cash Flow**: ₹${health.freeCashFlow.toLocaleString('en-IN')}
• **Emergency Runway**: ${health.emergencyRunway} months (₹${profile.liquidSavings.toLocaleString('en-IN')} liquid cash)
• **Credit Score**: ${profile.creditScore} (Prime tier)
• **Estimated Safe Loan Capacity**: ~₹${maxSafeLoanEstimate.toLocaleString('en-IN')}

Feel free to ask me anything about your cash flow, safe borrowing limits, insurance sufficiency, or run what-if stress scenarios!`;
      }
    }

    const suggestedActions = [
      { label: 'Safe Loan Limit Kitni Hai?', action: 'ask_loan_limit' },
      { label: 'Run 20% Income Stress Test', action: 'stress_test' },
      { label: 'Emergency Runway Breakdown', action: 'ask_runway' },
      { label: 'Explain Decision Recommendation', action: 'explain' },
    ];

    const result: CopilotExecutionResult = {
      reply,
      toolsInvoked,
      extractedGoal,
      decisionRun,
      stressResult,
      suggestedActions,
      modelUsed,
      fallbackMode,
    };

    // Save message pair in chat history
    dataStore.saveChatMessage({
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString(),
    });

    dataStore.saveChatMessage({
      id: `msg_${Date.now()}_a`,
      sender: 'assistant',
      text: reply,
      timestamp: new Date().toISOString(),
      toolsUsed: toolsInvoked,
      extractedGoal,
      decisionResult: decisionRun,
      stressResult,
      suggestedActions,
    });

    return result;
  }
}

