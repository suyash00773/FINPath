import express, { Request, Response } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { dataStore } from './server/dataStore.js';
import { DecisionEngine, FinancialHealthService } from './server/decisionEngine.js';
import { AIOrchestrator } from './server/aiOrchestrator.js';
import {
  sendOtpToPhone,
  verifyOtpCode,
  createDemoSession,
  validateSessionId,
  destroySession,
} from './lib/auth/otpService.js';

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cookieParser());

async function startServer() {

  // Log API requests
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'FinPath Decision Engine', timestamp: new Date().toISOString() });
  });

  // Auth endpoints (Real Backend Authentication & Session Management)
  app.get('/api/auth/users', (req: Request, res: Response) => {
    const publicUsers = dataStore.users.map((u) => dataStore.getPublicUser(u));
    res.json({ users: publicUsers, activeUserId: dataStore.activeUserId });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const authResult = dataStore.authenticate(email, password);
      if (!authResult) {
        return res.status(401).json({ error: 'Invalid email address or password' });
      }

      const health = FinancialHealthService.calculateHealth(authResult.profile);
      res.json({
        session: authResult.session,
        profile: authResult.profile,
        health,
        activeUserId: authResult.session.user.id,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  // Send OTP to customer phone (MongoDB backed, crypto OTP, SMS Provider)
  app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
    try {
      const phoneInput = req.body.phone || req.body.destination || req.body.mobile;
      if (!phoneInput) {
        return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
      }

      const result = await sendOtpToPhone(phoneInput);

      dataStore.addAuditEvent({
        eventType: 'CONSENT_GRANTED' as any,
        description: `OTP dispatched to mobile number ${result.phone}`,
        dataSnapshot: { phone: result.phone, method: 'MOBILE_OTP' },
        userAction: 'Customer requested 6-digit OTP',
      });

      // Never return plaintext OTP in production response!
      res.json({
        success: true,
        message: result.message,
        phone: result.phone,
        expiresInSeconds: result.expiresInSeconds,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to send OTP' });
    }
  });

  // Resend OTP endpoint with rate-limiting and audit log
  app.post('/api/auth/resend-otp', async (req: Request, res: Response) => {
    try {
      const phoneInput = req.body.phone || req.body.destination || req.body.mobile;
      if (!phoneInput) {
        return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
      }

      const result = await sendOtpToPhone(phoneInput);

      dataStore.addAuditEvent({
        eventType: 'CONSENT_GRANTED' as any,
        description: `OTP resent to mobile number ${result.phone}`,
        dataSnapshot: { phone: result.phone, method: 'MOBILE_OTP_RESEND' },
        userAction: 'Customer requested OTP resend',
      });

      res.json({
        success: true,
        message: 'OTP resent successfully',
        phone: result.phone,
        expiresInSeconds: result.expiresInSeconds,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to resend OTP' });
    }
  });

  // Verify OTP and authenticate customer (Secure HTTP-Only Cookie + MongoDB session)
  app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
    try {
      const phoneInput = req.body.phone || req.body.destination || req.body.mobile;
      const otpInput = req.body.otp || req.body.code;

      if (!phoneInput || !otpInput) {
        return res.status(400).json({ error: 'Mobile number and 6-digit OTP code are required.' });
      }

      let verifiedResult;
      try {
        verifiedResult = await verifyOtpCode(phoneInput, String(otpInput).trim());
      } catch (verifyErr: any) {
        dataStore.addAuditEvent({
          eventType: 'USER_LOGGED_IN' as any,
          description: `Failed OTP attempt for ${phoneInput}: ${verifyErr.message}`,
          dataSnapshot: { phone: phoneInput },
          userAction: 'Customer submitted invalid or expired OTP',
        });
        return res.status(400).json({ error: verifyErr.message });
      }

      // Sync user to dataStore so financial calculations, goals, and decisions work seamlessly
      const user = dataStore.ensureUserForPhone(
        verifiedResult.user.phone,
        verifiedResult.user.name,
        verifiedResult.user.role
      );
      dataStore.switchActiveUser(user.id);

      // Establish secure HTTP-only session cookie
      res.cookie('finpath_session', verifiedResult.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      dataStore.addAuditEvent({
        eventType: 'USER_LOGGED_IN' as any,
        description: `OTP successfully verified for ${verifiedResult.user.phone}. Session established.`,
        dataSnapshot: { userId: verifiedResult.user.id, phone: verifiedResult.user.phone, method: 'MOBILE_OTP' },
        userAction: 'Customer successfully validated 6-digit OTP',
      });

      const health = FinancialHealthService.calculateHealth(dataStore.profile);

      res.json({
        success: true,
        authenticated: true,
        sessionId: verifiedResult.sessionId,
        user: verifiedResult.user,
        profile: dataStore.profile,
        health,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'OTP verification failed' });
    }
  });

  // Demo Login (One-click synthetic user login without SMS)
  app.post('/api/auth/demo-login', async (_req: Request, res: Response) => {
    try {
      const demo = await createDemoSession();

      // Switch to Suyash Bajpai (Primary Kirana demo merchant with Income ₹72K, Shop Expansion Goal ₹3L)
      dataStore.switchActiveUser('usr_demo_786');

      res.cookie('finpath_session', demo.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      dataStore.addAuditEvent({
        eventType: 'USER_LOGGED_IN' as any,
        description: 'User entered Demo Mode with synthetic merchant profile (+919999999999)',
        dataSnapshot: { userId: 'usr_demo_786', phone: '+919999999999', method: 'DEMO_BYPASS' },
        userAction: 'Demonstration user bypassed SMS with synthetic test profile',
      });

      const health = FinancialHealthService.calculateHealth(dataStore.profile);

      res.json({
        success: true,
        authenticated: true,
        sessionId: demo.sessionId,
        user: {
          id: demo.user.id,
          phone: demo.user.phone,
          name: demo.user.name,
          role: demo.user.role,
        },
        isDemo: true,
        profile: dataStore.profile,
        health,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Demo login failed' });
    }
  });

  // Demo & Temporary Credentials info endpoint
  app.get('/api/auth/temp-credentials', (_req: Request, res: Response) => {
    res.json({
      customer: {
        email: 'customer.demo@finpath.ai',
        password: 'tempPassword2026',
        phone: '+91 98765 00123',
        name: 'Demo Customer',
        role: 'Verified Customer',
        occupation: 'Retail & Digital Services Consumer',
        monthlyIncome: 60000,
      },
      merchant: {
        email: 'suyash@finpath.ai',
        password: 'password123',
        phone: '+91 98765 43210',
        name: 'Suyash Bajpai',
        role: 'Retail Merchant (Kirana)',
        occupation: 'Retail Business Owner',
        monthlyIncome: 72000,
      },
      salaried: {
        email: 'priya@finpath.ai',
        password: 'password123',
        phone: '+91 98111 22334',
        name: 'Priya Sharma',
        role: 'Salaried Professional',
        occupation: 'Senior Software Engineer',
        monthlyIncome: 95000,
      },
    });
  });

  // Logout endpoint (clears cookie & deletes session)
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      const cookieSession = req.cookies?.finpath_session;
      const authHeader = req.headers.authorization;
      const token =
        cookieSession ||
        (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.body.token as string));

      if (token) {
        await destroySession(token);
        dataStore.logout(token);
      }

      res.clearCookie('finpath_session', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });

      dataStore.addAuditEvent({
        eventType: 'USER_LOGGED_IN' as any,
        description: 'User logged out and session terminated',
        dataSnapshot: {},
        userAction: 'User cleared session cookie',
      });

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Logout failed' });
    }
  });

  // Session verification endpoint (Supports HTTP-only cookie and Bearer token)
  app.get('/api/auth/session', async (req: Request, res: Response) => {
    try {
      const cookieSession = req.cookies?.finpath_session;
      const authHeader = req.headers.authorization;
      const token =
        cookieSession ||
        (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

      if (!token) {
        return res.json({ authenticated: false, user: null });
      }

      // Check MongoDB session first
      const mongoSession = await validateSessionId(token);
      if (mongoSession) {
        if (mongoSession.isDemo) {
          dataStore.switchActiveUser('usr_demo_786');
        } else {
          const user = dataStore.users.find((u) => u.phone === mongoSession.phone || u.id === mongoSession.userId);
          if (user) {
            dataStore.switchActiveUser(user.id);
          }
        }

        const health = FinancialHealthService.calculateHealth(dataStore.profile);
        return res.json({
          authenticated: true,
          user: {
            id: mongoSession.userId,
            phone: mongoSession.phone,
            name: mongoSession.name,
            role: mongoSession.role,
          },
          isDemo: !!mongoSession.isDemo,
          profile: dataStore.profile,
          health,
        });
      }

      // Check in-memory store fallback
      const storeSession = dataStore.validateSession(token);
      if (storeSession) {
        const health = FinancialHealthService.calculateHealth(dataStore.profile);
        return res.json({
          authenticated: true,
          user: storeSession.user,
          isDemo: storeSession.user.id === 'usr_demo_786',
          profile: dataStore.profile,
          health,
        });
      }

      return res.json({ authenticated: false, user: null });
    } catch (err: any) {
      res.json({ authenticated: false, error: err.message });
    }
  });

  // Compatibility endpoint for existing /api/auth/me
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const cookieSession = req.cookies?.finpath_session;
      const authHeader = req.headers.authorization;
      const token =
        cookieSession ||
        (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

      if (!token) {
        const health = FinancialHealthService.calculateHealth(dataStore.profile);
        return res.json({
          authenticated: false,
          user: null,
          profile: dataStore.profile,
          health,
        });
      }

      const mongoSession = await validateSessionId(token);
      if (mongoSession) {
        const health = FinancialHealthService.calculateHealth(dataStore.profile);
        return res.json({
          authenticated: true,
          user: {
            id: mongoSession.userId,
            phone: mongoSession.phone,
            name: mongoSession.name,
            role: mongoSession.role,
          },
          isDemo: !!mongoSession.isDemo,
          profile: dataStore.profile,
          health,
        });
      }

      const storeSession = dataStore.validateSession(token);
      if (storeSession) {
        const health = FinancialHealthService.calculateHealth(dataStore.profile);
        return res.json({
          authenticated: true,
          user: storeSession.user,
          profile: dataStore.profile,
          health,
        });
      }

      const health = FinancialHealthService.calculateHealth(dataStore.profile);
      return res.json({
        authenticated: false,
        user: null,
        profile: dataStore.profile,
        health,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to verify session' });
    }
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { name, email, password, occupation, monthlyIncome } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      const result = dataStore.registerUser({
        name,
        email,
        password,
        occupation,
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
      });

      const health = FinancialHealthService.calculateHealth(result.profile);
      res.status(201).json({
        session: result.session,
        profile: result.profile,
        health,
        user: result.session.user,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/switch-user', (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      let targetId = userId;
      if (userId === 'usr_suyash_01') targetId = 'usr_demo_786';
      if (userId === 'usr_priya_02') targetId = 'usr_priya_102';
      if (userId === 'usr_rahul_03') targetId = 'usr_rahul_55';

      const user = dataStore.users.find((u) => u.id === targetId);
      if (!user) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      dataStore.switchActiveUser(targetId);

      const token = `finpath_token_${user.id}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 86400000 * 7).toISOString();
      const session = {
        token,
        user: dataStore.getPublicUser(user),
        expiresAt,
      };
      dataStore.sessions.set(token, session);

      const health = FinancialHealthService.calculateHealth(dataStore.profile);

      dataStore.addAuditEvent({
        eventType: 'USER_LOGGED_IN',
        description: `Switched active demo profile to ${user.name} (${user.occupation})`,
        dataSnapshot: { userId: user.id, name: user.name },
        userAction: 'Switched profile in UI switcher',
      });

      res.json({
        session,
        user: session.user,
        profile: dataStore.profile,
        health,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to switch profile' });
    }
  });

  // Profile endpoints
  app.get('/api/profile', (req: Request, res: Response) => {
    try {
      const health = FinancialHealthService.calculateHealth(dataStore.profile);
      res.json({ profile: dataStore.profile, health });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch profile' });
    }
  });

  app.post('/api/profile', (req: Request, res: Response) => {
    try {
      const updates = req.body;
      dataStore.profile = {
        ...dataStore.profile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      const health = FinancialHealthService.calculateHealth(dataStore.profile);
      dataStore.addAuditEvent({
        eventType: 'PROFILE_VIEWED',
        description: 'Financial profile parameters updated by user',
        dataSnapshot: { profile: dataStore.profile },
        userAction: 'Updated profile settings in UI',
      });
      res.json({ profile: dataStore.profile, health });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update profile' });
    }
  });

  // Financial Health calculation
  app.post('/api/financial-health', (req: Request, res: Response) => {
    try {
      const { goal, profileOverrides } = req.body;
      const currentProfile = profileOverrides
        ? { ...dataStore.profile, ...profileOverrides }
        : dataStore.profile;
      const health = FinancialHealthService.calculateHealth(currentProfile, goal);
      res.json({ health });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to calculate health' });
    }
  });

  // Goals endpoints
  app.get('/api/goals', (req: Request, res: Response) => {
    res.json({ goals: dataStore.goals });
  });

  app.post('/api/goals', (req: Request, res: Response) => {
    try {
      const { title, goalType, targetAmount, timelineMonths, urgency, notes } = req.body;
      if (!title || !targetAmount) {
        return res.status(400).json({ error: 'Title and targetAmount are required' });
      }

      const newGoal = {
        id: `goal_${Date.now()}`,
        title,
        goalType: goalType || 'other',
        targetAmount: Number(targetAmount),
        currentSaved: 0,
        timelineMonths: Number(timelineMonths) || 6,
        urgency: urgency || 'moderate',
        status: 'evaluating' as const,
        createdAt: new Date().toISOString(),
        notes,
      };

      dataStore.goals.unshift(newGoal);

      dataStore.addAuditEvent({
        eventType: 'GOAL_CREATED',
        description: `New goal registered: "${newGoal.title}" (₹${newGoal.targetAmount.toLocaleString('en-IN')})`,
        dataSnapshot: { goal: newGoal },
        userAction: 'Created new goal via Goals tab',
      });

      // Automatically generate a decision run for this goal
      const decisionRun = DecisionEngine.createDecisionRun(
        dataStore.profile,
        newGoal,
        dataStore.products
      );
      dataStore.decisions.unshift(decisionRun);

      res.status(201).json({ goal: newGoal, decisionRun });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create goal' });
    }
  });

  // Decisions endpoints
  app.get('/api/decisions', (req: Request, res: Response) => {
    res.json({ decisions: dataStore.decisions });
  });

  app.get('/api/decisions/:id', (req: Request, res: Response) => {
    const decision = dataStore.decisions.find((d) => d.id === req.params.id);
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    res.json({ decision });
  });

  app.post('/api/decisions', (req: Request, res: Response) => {
    try {
      const { goalId } = req.body;
      let targetGoal = dataStore.goals.find((g) => g.id === goalId);
      if (!targetGoal) {
        targetGoal = dataStore.goals[0];
      }

      const decisionRun = DecisionEngine.createDecisionRun(
        dataStore.profile,
        targetGoal,
        dataStore.products
      );
      dataStore.decisions.unshift(decisionRun);

      dataStore.addAuditEvent({
        eventType: 'DECISION_GENERATED',
        description: `Decision Engine evaluated candidate options for "${targetGoal.title}". Recommended: ${decisionRun.recommendationTitle}`,
        dataSnapshot: {
          decisionId: decisionRun.id,
          score: decisionRun.decisionScore,
          optionsCount: decisionRun.candidateOptions.length,
        },
        userAction: 'Requested fresh decision run',
      });

      res.json({ decision: decisionRun });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to run decision engine' });
    }
  });

  app.post('/api/decisions/:id/explain', (req: Request, res: Response) => {
    const decision = dataStore.decisions.find((d) => d.id === req.params.id);
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    res.json({
      decisionId: decision.id,
      goalTitle: decision.goalTitle,
      recommendation: decision.recommendationTitle,
      explanation: decision.explanation,
      assumptions: decision.assumptions,
      dataSource: decision.dataSource,
      candidateOptions: decision.candidateOptions,
      mathematicalFormulas: {
        freeCashFlow: 'income - essentialExpenses - existingEMI',
        debtRatio: 'totalMonthlyEMI / monthlyIncome',
        emergencyRunway: 'liquidSavings / essentialMonthlyExpenses',
        emiFormula: 'P * r * (1+r)^n / ((1+r)^n - 1)',
        resilienceWeighting: 'Liquidity 25% + Debt 25% + Savings 20% + Protection 15% + Goal 15%',
      },
    });
  });

  // What-If Scenario Lab
  app.post('/api/scenarios', (req: Request, res: Response) => {
    try {
      const { scenario, goalId } = req.body;
      const targetGoal = dataStore.goals.find((g) => g.id === goalId) || dataStore.goals[0];

      const defaultScenario = {
        id: 'scen_user_' + Date.now(),
        name: scenario?.name || 'Custom Stress Test',
        incomeChangePct: scenario?.incomeChangePct ?? 0,
        expenseChangePct: scenario?.expenseChangePct ?? 0,
        unexpectedEmergencyExpense: scenario?.unexpectedEmergencyExpense ?? 0,
        loanInterestRateDelta: scenario?.loanInterestRateDelta ?? 0,
      };

      const result = DecisionEngine.runStressTest(
        dataStore.profile,
        targetGoal,
        defaultScenario,
        dataStore.products
      );

      dataStore.addAuditEvent({
        eventType: 'SCENARIO_RUN',
        description: `What-If Stress Scenario executed: Income Δ: ${defaultScenario.incomeChangePct}%, Expense Δ: ${defaultScenario.expenseChangePct}%. Shift: ${result.recommendationChanged ? 'YES' : 'NO'}`,
        dataSnapshot: {
          scenario: defaultScenario,
          recommendationChanged: result.recommendationChanged,
          stressedRecommendedId: result.stressedRecommendedId,
        },
        userAction: 'Adjusted scenario parameters in What-if Lab',
      });

      res.json({ result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to simulate scenario' });
    }
  });

  // Consent Center endpoints
  app.get('/api/consent', (req: Request, res: Response) => {
    res.json({ consents: dataStore.consents });
  });

  app.post('/api/consent', (req: Request, res: Response) => {
    try {
      const { id, category, status } = req.body;
      let record = dataStore.consents.find((c) => c.id === id || c.category === category);
      if (record) {
        record.status = status || 'granted';
        record.grantedAt = new Date().toISOString();
        record.expiresAt = new Date(Date.now() + 86400000 * 90).toISOString();
      } else {
        record = {
          id: `cst_${Date.now()}`,
          category: category || 'General Financial Data',
          purpose: 'Decision engine accuracy & partner eligibility',
          dataItems: ['Financial statement records'],
          status: status || 'granted',
          grantedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000 * 90).toISOString(),
          accountAggregatorReady: true,
        };
        dataStore.consents.push(record);
      }

      dataStore.addAuditEvent({
        eventType: 'CONSENT_GRANTED',
        description: `Consent granted for ${record.category} (Purpose: ${record.purpose})`,
        dataSnapshot: { consentId: record.id, category: record.category },
        userAction: 'Authorized consent via Consent Center',
      });

      res.json({ consent: record, consents: dataStore.consents });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to grant consent' });
    }
  });

  app.delete('/api/consent/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const record = dataStore.consents.find((c) => c.id === id);
      if (record) {
        record.status = 'revoked';
        dataStore.addAuditEvent({
          eventType: 'CONSENT_REVOKED',
          description: `Access revoked for category: ${record.category}`,
          dataSnapshot: { consentId: record.id, category: record.category },
          userAction: 'Revoked consent in Consent Center',
        });
      }
      res.json({ success: true, consents: dataStore.consents });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to revoke consent' });
    }
  });

  // Journey Tracker endpoints
  app.get('/api/journey', (req: Request, res: Response) => {
    res.json({ journeys: dataStore.journeys, activeJourney: dataStore.journeys[0] });
  });

  app.post('/api/journey', (req: Request, res: Response) => {
    try {
      const { goalId, decisionId, actionTitle } = req.body;
      const goal = dataStore.goals.find((g) => g.id === goalId) || dataStore.goals[0];

      const newJourney = {
        id: `jrn_${Date.now()}`,
        goalId: goal.id,
        goalTitle: goal.title,
        decisionId: decisionId || 'dec_active',
        recommendedAction: actionTitle || 'Borrow ₹2.5L + Save ₹50K',
        status: 'in_progress' as const,
        currentStepIndex: 3,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedPartner: 'Paytm Lending Partner (Aditya Birla Capital)',
        steps: [
          {
            id: 'step_goal',
            title: 'Goal Definition',
            description: `${goal.title} (₹${goal.targetAmount.toLocaleString('en-IN')}) registered`,
            status: 'completed' as const,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'step_health',
            title: 'Financial Health Check',
            description: 'Calculated Resilience Score & Cash Flow',
            status: 'completed' as const,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'step_decision',
            title: 'Decision Engine Analysis',
            description: `Selected: ${actionTitle || 'Borrow ₹2.5L + Save ₹50K'}`,
            status: 'completed' as const,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'step_consent',
            title: 'Consent & Authorization',
            description: 'Verify account data and credit records with partner',
            status: 'active' as const,
            actionRequired: 'Confirm consent permissions',
          },
          {
            id: 'step_handoff',
            title: 'Paytm Partner Handoff',
            description: 'Direct secure dispatch to Aditya Birla Capital with preset term',
            status: 'upcoming' as const,
          },
          {
            id: 'step_application',
            title: 'Digital Application',
            description: 'Aadhaar e-KYC and digital mandate creation',
            status: 'upcoming' as const,
          },
          {
            id: 'step_verification',
            title: 'Automated Sanction',
            description: 'Underwriting decision and digital agreement execution',
            status: 'upcoming' as const,
          },
          {
            id: 'step_completion',
            title: 'Disbursement & Goal Execution',
            description: 'Funds credited to merchant account + auto-allocation of ₹50K buffer',
            status: 'upcoming' as const,
          },
        ],
      };

      dataStore.journeys.unshift(newJourney);

      dataStore.addAuditEvent({
        eventType: 'JOURNEY_STARTED',
        description: `Journey started for "${goal.title}" based on decision: ${newJourney.recommendedAction}`,
        dataSnapshot: { journeyId: newJourney.id },
        userAction: 'Started execution journey from Decision Card',
      });

      res.status(201).json({ journey: newJourney });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to start journey' });
    }
  });

  app.patch('/api/journey/:id', (req: Request, res: Response) => {
    try {
      const journey = dataStore.journeys.find((j) => j.id === req.params.id) || dataStore.journeys[0];
      const { stepIndex, stepStatus } = req.body;

      if (typeof stepIndex === 'number' && stepIndex >= 0 && stepIndex < journey.steps.length) {
        journey.currentStepIndex = stepIndex;
        if (stepStatus) {
          journey.steps[stepIndex].status = stepStatus;
        } else {
          journey.steps[stepIndex].status = 'completed';
          if (stepIndex + 1 < journey.steps.length) {
            journey.steps[stepIndex + 1].status = 'active';
            journey.currentStepIndex = stepIndex + 1;
          }
        }
        journey.updatedAt = new Date().toISOString();

        dataStore.addAuditEvent({
          eventType: 'JOURNEY_UPDATED',
          description: `Journey "${journey.goalTitle}" advanced to step: ${journey.steps[journey.currentStepIndex].title}`,
          dataSnapshot: { stepIndex: journey.currentStepIndex, stepTitle: journey.steps[journey.currentStepIndex].title },
          userAction: 'Advanced journey step',
        });
      }

      res.json({ journey });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update journey' });
    }
  });

  // Audit Log endpoints
  app.get('/api/audit', (req: Request, res: Response) => {
    res.json({ auditLogs: dataStore.auditLogs });
  });

  app.post('/api/audit', (req: Request, res: Response) => {
    try {
      const { eventType, description, dataSnapshot, userAction } = req.body;
      const event = dataStore.addAuditEvent({
        eventType: eventType || 'FINANCIAL_CALCULATION',
        description: description || 'Audit event logged',
        dataSnapshot: dataSnapshot || {},
        userAction: userAction || 'User interaction',
      });
      res.status(201).json({ event });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to log audit event' });
    }
  });

  // Product Catalog
  app.get('/api/products', (req: Request, res: Response) => {
    res.json({ products: dataStore.products });
  });

  // Copilot conversational endpoint
  app.post('/api/copilot', async (req: Request, res: Response) => {
    try {
      const { message, language } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const result = await AIOrchestrator.processMessage(message, language || 'hinglish');
      res.json(result);
    } catch (err: any) {
      console.error('Copilot error:', err);
      res.status(500).json({
        reply: 'AI explanation is temporarily unavailable. Your deterministic financial calculations remain fully active and verified.',
        fallbackMode: true,
        toolsInvoked: ['calculate_financial_health'],
        suggestedActions: [],
      });
    }
  });

  app.get('/api/copilot/history', (req: Request, res: Response) => {
    const history = dataStore.getChatHistory();
    res.json({ history });
  });

  app.delete('/api/copilot/history', (req: Request, res: Response) => {
    if (dataStore.chatHistory.has(dataStore.activeUserId)) {
      dataStore.chatHistory.set(dataStore.activeUserId, []);
    }
    res.json({ success: true, message: 'Chat history cleared' });
  });

  // Reset Demo
  app.post('/api/reset-demo', (req: Request, res: Response) => {
    dataStore.resetDemo();
    res.json({ success: true, message: 'Demo reset to original ₹72K income / Shop expansion state' });
  });

  // Vite middleware for development vs static files for production
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[FinPath] Server running on port ${PORT}`);
    });
  }
}

startServer();

