export type GoalType = 'business_expansion' | 'emergency_fund' | 'home_renovation' | 'education' | 'vehicle' | 'debt_consolidation' | 'other';

export type LanguageMode = 'english' | 'hindi' | 'hinglish';

export interface FinancialProfile {
  id: string;
  name: string;
  monthlyIncome: number;
  essentialMonthlyExpenses: number;
  discretionaryExpenses: number;
  existingMonthlyEMI: number;
  liquidSavings: number;
  fixedDeposits: number;
  creditScore: number;
  dependents: number;
  existingLifeCover: number;
  existingHealthCover: number;
  occupation: string;
  updatedAt: string;
}

export interface FinancialHealth {
  monthlyIncome: number;
  essentialExpenses: number;
  existingEMI: number;
  freeCashFlow: number;
  debtRatio: number; // monthlyEMI / income
  emergencyRunway: number; // savings / essentialExpenses (in months)
  savingsRate: number; // (income - totalExpenses) / income
  resilienceScore: number; // 0 - 100
  scoreBreakdown: {
    liquidity: number; // 0-25
    debtLoad: number; // 0-25
    savings: number; // 0-20
    protection: number; // 0-15
    goalReadiness: number; // 0-15
  };
  riskLevel: 'Low' | 'Moderate' | 'Elevated' | 'Critical';
  statusLabel: 'Excellent' | 'Healthy' | 'Moderate' | 'At Risk' | 'Critical';
  flags: string[];
  inDebtRescueMode: boolean;
  indicativeProtectionGap: number;
}

export interface FinancialGoal {
  id: string;
  title: string;
  goalType: GoalType;
  targetAmount: number;
  currentSaved: number;
  timelineMonths: number;
  urgency: 'flexible' | 'moderate' | 'strict';
  status: 'active' | 'evaluating' | 'decided' | 'in_progress' | 'achieved';
  createdAt: string;
  notes?: string;
}

export type ActionType = 'BORROW' | 'SAVE' | 'PROTECT' | 'WAIT' | 'HYBRID_BORROW_SAVE';

export interface CandidateAction {
  id: string;
  name: string;
  type: ActionType;
  description: string;
  borrowAmount: number;
  saveMonthlyAmount: number;
  upfrontSavingsUsed: number;
  estimatedTenureMonths: number;
  estimatedInterestRate: number;
  estimatedMonthlyEMI: number;
  totalRepayment: number;
  totalCost: number; // interest + fees
  liquidityImpact: number; // remaining savings after initial move
  postActionRunwayMonths: number;
  postActionDebtRatio: number;
  postActionFreeCashFlow: number;
  goalCompletionTimeMonths: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  resilienceScoreAfter: number;
  decisionScore: number; // 0 - 100
  scoreFactors: {
    affordability: number;
    liquidityPreservation: number;
    goalCompletion: number;
    debtPressure: number;
    emergencyResilience: number;
    totalCostEfficiency: number;
  };
  assumptions: string[];
  pros: string[];
  cons: string[];
  recommended: boolean;
}

export interface DecisionRun {
  id: string;
  goalId: string;
  goalTitle: string;
  targetAmount: number;
  financialSnapshot: FinancialHealth;
  candidateOptions: CandidateAction[];
  recommendedOptionId: string;
  recommendationTitle: string;
  decisionScore: number;
  explanation: {
    summary: string;
    keyReasons: string[];
    riskAnalysis: string;
    tradeOffs: string[];
    stressResilienceNotes: string;
  };
  assumptions: string[];
  dataSource: string;
  consentGranted: boolean;
  journeyState?: string;
  createdAt: string;
}

export interface StressTestScenario {
  id: string;
  name: string;
  incomeChangePct: number; // e.g. -20 for -20%
  expenseChangePct: number; // e.g. +15 for +15%
  unexpectedEmergencyExpense: number; // e.g. 50000
  loanInterestRateDelta: number; // e.g. +2 for +2%
}

export interface StressTestResult {
  scenario: StressTestScenario;
  baseCashFlow: number;
  stressedCashFlow: number;
  baseRunway: number;
  stressedRunway: number;
  baseDebtRatio: number;
  stressedDebtRatio: number;
  baseRecommendedId: string;
  stressedRecommendedId: string;
  recommendationChanged: boolean;
  decisionShiftReason: string;
  optionScores: { [optionId: string]: number };
}

export interface FinancialProduct {
  id: string;
  provider: string;
  providerLogo?: string;
  name: string;
  type: 'loan' | 'savings' | 'insurance';
  interestRate: number; // p.a.
  apr: number;
  processingFee: number;
  minAmount: number;
  maxAmount: number;
  tenureMonthsMin: number;
  tenureMonthsMax: number;
  eligibility: string;
  features: string[];
  lastVerifiedAt: string;
  partnerEcosystem: 'Paytm Verified' | 'Direct Bank' | 'NBFC Partner';
}

export interface ConsentRecord {
  id: string;
  category: 'Bank Accounts' | 'Transactions' | 'Loans & Credit' | 'Insurance' | 'Income & Tax' | 'Credit Bureau';
  purpose: string;
  dataItems: string[];
  status: 'granted' | 'revoked' | 'pending';
  grantedAt?: string;
  expiresAt?: string;
  accountAggregatorReady: boolean;
}

export interface JourneyStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'upcoming';
  timestamp?: string;
  actionRequired?: string;
  meta?: Record<string, any>;
}

export interface JourneyRecord {
  id: string;
  goalId: string;
  goalTitle: string;
  decisionId: string;
  recommendedAction: string;
  status: 'in_progress' | 'completed' | 'paused';
  currentStepIndex: number;
  steps: JourneyStep[];
  startedAt: string;
  updatedAt: string;
  assignedPartner?: string;
}

export type AuditEventType =
  | 'GOAL_CREATED'
  | 'PROFILE_VIEWED'
  | 'FINANCIAL_CALCULATION'
  | 'SCENARIO_RUN'
  | 'DECISION_GENERATED'
  | 'DECISION_ACCEPTED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'JOURNEY_STARTED'
  | 'JOURNEY_UPDATED'
  | 'SAFETY_ALERT_TRIGGERED'
  | 'USER_LOGGED_IN'
  | 'USER_LOGGED_OUT'
  | 'USER_REGISTERED';

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  description: string;
  dataSnapshot: Record<string, any>;
  userAction: string;
  immutableHash: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  occupation: string;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: UserAccount;
  expiresAt: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  toolsUsed?: string[];
  extractedGoal?: Partial<FinancialGoal>;
  decisionResult?: DecisionRun;
  stressResult?: StressTestResult;
  suggestedActions?: { label: string; action: string }[];
}
