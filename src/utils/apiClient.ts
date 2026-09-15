import { UserAccount, FinancialProfile, FinancialHealth } from '../types.js';

export interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

/**
 * Robust fetch helper that safely parses JSON responses and prevents JSON.parse SyntaxErrors
 * when the server returns HTML (e.g. 404 or Vercel SPA fallbacks).
 */
export async function fetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    let data: any = null;
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.warn(`[FinPath] Invalid JSON body from ${url}:`, jsonErr);
      }
    } else {
      const text = await res.text();
      console.warn(`[FinPath] Non-JSON response from ${url} (${res.status}):`, text.slice(0, 100));
    }

    if (res.ok && data !== null) {
      return { ok: true, status: res.status, data };
    }

    const errorMessage =
      data?.error || data?.message || (!res.ok ? `Server error (${res.status})` : undefined);

    return {
      ok: res.ok && data !== null,
      status: res.status,
      data,
      error: errorMessage,
    };
  } catch (err: any) {
    console.error(`[FinPath] Network fetch failed for ${url}:`, err);
    return {
      ok: false,
      status: 0,
      data: null,
      error: err.message || 'Network connection failed',
    };
  }
}

/**
 * Creates a deterministic local demo session for resilient fallback demo login.
 */
export function createLocalDemoSession() {
  const sessionId = `finpath_demo_session_${Date.now()}`;
  localStorage.setItem('finpath_auth_token', sessionId);
  localStorage.removeItem('finpath_logged_out');

  const user: UserAccount = {
    id: 'usr_demo_786',
    email: 'suyash@finpath.ai',
    phone: '+91 99999 99999',
    name: 'Suyash Bajpai',
    role: 'Retail Merchant (Kirana)',
    occupation: 'Retail Business Owner (Kirana)',
    createdAt: new Date().toISOString(),
  };

  const profile: FinancialProfile = {
    id: 'prof_suyash_786',
    name: 'Suyash Bajpai',
    monthlyIncome: 72000,
    essentialMonthlyExpenses: 34000,
    discretionaryExpenses: 12000,
    existingMonthlyEMI: 8000,
    liquidSavings: 65000,
    fixedDeposits: 50000,
    creditScore: 742,
    dependents: 3,
    existingLifeCover: 500000,
    existingHealthCover: 300000,
    occupation: 'Retail Business Owner (Kirana)',
    updatedAt: new Date().toISOString(),
  };

  const health: FinancialHealth = {
    monthlyIncome: 72000,
    essentialExpenses: 34000,
    existingEMI: 8000,
    freeCashFlow: 18000,
    debtRatio: 0.111,
    emergencyRunway: 1.91,
    savingsRate: 0.25,
    resilienceScore: 78,
    scoreBreakdown: {
      liquidity: 20,
      debtLoad: 22,
      savings: 15,
      protection: 11,
      goalReadiness: 10,
    },
    riskLevel: 'Moderate',
    statusLabel: 'Healthy',
    flags: [
      'Strong debt-to-income ratio (11.1%)',
      'Adequate emergency liquidity buffer (1.9 months)',
      'Health & life protection active',
    ],
    inDebtRescueMode: false,
    indicativeProtectionGap: 0,
  };

  return { sessionId, user, profile, health };
}
