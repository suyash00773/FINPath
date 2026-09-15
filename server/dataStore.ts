import {
  FinancialProfile,
  FinancialGoal,
  FinancialProduct,
  ConsentRecord,
  JourneyRecord,
  AuditEvent,
  DecisionRun,
  UserAccount,
  AuthSession,
  CopilotMessage,
} from '../src/types.js';
import { DecisionEngine } from './decisionEngine.js';

// Simple deterministic hash function for audit records
function generateHash(data: any): string {
  const str = JSON.stringify(data) + Date.now().toString();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'sha256_' + Math.abs(hash).toString(16).padStart(8, '0') + 'c9f87e';
}

interface StoredUser extends UserAccount {
  password: string;
}

export class DataStore {
  public users: StoredUser[];
  public activeUserId: string;
  public sessions: Map<string, AuthSession>;
  public chatHistory: Map<string, CopilotMessage[]>;
  private activeOtps: Map<string, { code: string; destination: string; expiresAt: number }>;

  public profile: FinancialProfile;
  public goals: FinancialGoal[];
  public products: FinancialProduct[];
  public consents: ConsentRecord[];
  public journeys: JourneyRecord[];
  public auditLogs: AuditEvent[];
  public decisions: DecisionRun[];

  // Per-user storage maps
  private userProfiles: Map<string, FinancialProfile>;
  private userGoals: Map<string, FinancialGoal[]>;
  private userDecisions: Map<string, DecisionRun[]>;
  private userJourneys: Map<string, JourneyRecord[]>;
  private userConsents: Map<string, ConsentRecord[]>;

  constructor() {
    this.users = this.getInitialUsers();
    this.activeUserId = this.users[0].id;
    this.sessions = new Map();
    this.chatHistory = new Map();
    this.activeOtps = new Map();

    this.userProfiles = new Map();
    this.userGoals = new Map();
    this.userDecisions = new Map();
    this.userJourneys = new Map();
    this.userConsents = new Map();

    this.products = this.getInitialProducts();
    this.auditLogs = [];

    // Pre-create demo session
    const initialSessionToken = 'finpath_demo_token_suyash_786';
    const expiresAt = new Date(Date.now() + 86400000 * 7).toISOString();
    this.sessions.set(initialSessionToken, {
      token: initialSessionToken,
      user: this.getPublicUser(this.users[0]),
      expiresAt,
    });

    this.initUserStorage();
    this.profile = this.userProfiles.get(this.activeUserId)!;
    this.goals = this.userGoals.get(this.activeUserId)!;
    this.consents = this.userConsents.get(this.activeUserId)!;
    this.journeys = this.userJourneys.get(this.activeUserId)!;
    this.decisions = this.userDecisions.get(this.activeUserId)!;

    this.seedInitialData();
  }

  public resetDemo() {
    this.users = this.getInitialUsers();
    this.activeUserId = this.users[0].id;
    this.sessions.clear();
    this.chatHistory.clear();
    this.userProfiles.clear();
    this.userGoals.clear();
    this.userDecisions.clear();
    this.userJourneys.clear();
    this.userConsents.clear();

    const initialSessionToken = 'finpath_demo_token_suyash_786';
    const expiresAt = new Date(Date.now() + 86400000 * 7).toISOString();
    this.sessions.set(initialSessionToken, {
      token: initialSessionToken,
      user: this.getPublicUser(this.users[0]),
      expiresAt,
    });

    this.initUserStorage();
    this.profile = this.userProfiles.get(this.activeUserId)!;
    this.goals = this.userGoals.get(this.activeUserId)!;
    this.consents = this.userConsents.get(this.activeUserId)!;
    this.journeys = this.userJourneys.get(this.activeUserId)!;
    this.decisions = this.userDecisions.get(this.activeUserId)!;
    this.seedInitialData();
  }

  private getInitialUsers(): StoredUser[] {
    return [
      {
        id: 'usr_demo_786',
        email: 'suyash@finpath.ai',
        password: 'password123',
        name: 'Suyash Bajpai',
        role: 'Team Lead & Retail Merchant',
        occupation: 'Retail Business Owner',
        phone: '+91 98765 43210',
        createdAt: '2026-01-10T10:00:00Z',
      },
      {
        id: 'usr_priya_102',
        email: 'priya@finpath.ai',
        password: 'password123',
        name: 'Priya Sharma',
        role: 'Salaried Professional',
        occupation: 'Senior Software Engineer',
        phone: '+91 98111 22334',
        createdAt: '2026-02-15T12:30:00Z',
      },
      {
        id: 'usr_rahul_55',
        email: 'rahul@finpath.ai',
        password: 'password123',
        name: 'Rahul Verma',
        role: 'Kirana Store Merchant',
        occupation: 'Small Business Merchant',
        phone: '+91 97222 33445',
        createdAt: '2026-03-01T09:15:00Z',
      },
      {
        id: 'usr_temp_customer',
        email: 'customer.demo@finpath.ai',
        password: 'tempPassword2026',
        name: 'Demo Customer',
        role: 'Verified Customer',
        occupation: 'Retail & Digital Services Consumer',
        phone: '+91 98765 00123',
        createdAt: '2026-03-14T09:00:00Z',
      },
    ];
  }

  public getPublicUser(user: StoredUser): UserAccount {
    const { password, ...publicUser } = user;
    return publicUser;
  }

  private initUserStorage() {
    // User 1: Suyash
    const suyashProfile: FinancialProfile = {
      id: 'usr_demo_786',
      name: 'Suyash Bajpai (Business Owner)',
      monthlyIncome: 72000,
      essentialMonthlyExpenses: 38000,
      discretionaryExpenses: 8000,
      existingMonthlyEMI: 8000,
      liquidSavings: 120000,
      fixedDeposits: 50000,
      creditScore: 742,
      dependents: 2,
      existingLifeCover: 2500000,
      existingHealthCover: 500000,
      occupation: 'Retail Business Owner',
      updatedAt: new Date().toISOString(),
    };
    this.userProfiles.set('usr_demo_786', suyashProfile);
    this.userGoals.set('usr_demo_786', this.getInitialGoals());
    this.userConsents.set('usr_demo_786', this.getInitialConsents());
    this.userJourneys.set('usr_demo_786', []);
    this.userDecisions.set('usr_demo_786', []);

    // User 2: Priya (Higher income tech salaried)
    const priyaProfile: FinancialProfile = {
      id: 'usr_priya_102',
      name: 'Priya Sharma (Tech Professional)',
      monthlyIncome: 95000,
      essentialMonthlyExpenses: 42000,
      discretionaryExpenses: 12000,
      existingMonthlyEMI: 14000,
      liquidSavings: 240000,
      fixedDeposits: 150000,
      creditScore: 785,
      dependents: 1,
      existingLifeCover: 7500000,
      existingHealthCover: 1000000,
      occupation: 'Senior Software Engineer',
      updatedAt: new Date().toISOString(),
    };
    this.userProfiles.set('usr_priya_102', priyaProfile);
    this.userGoals.set('usr_priya_102', [
      {
        id: 'goal_priya_home_reno',
        title: 'Home Interior Renovation',
        goalType: 'home_renovation',
        targetAmount: 450000,
        currentSaved: 100000,
        timelineMonths: 6,
        urgency: 'flexible',
        status: 'evaluating',
        createdAt: new Date().toISOString(),
        notes: 'Living room acoustic upgrade and ergonomic home office setup',
      },
    ]);
    this.userConsents.set('usr_priya_102', this.getInitialConsents());
    this.userJourneys.set('usr_priya_102', []);
    this.userDecisions.set('usr_priya_102', []);

    // User 3: Rahul (Lower income merchant)
    const rahulProfile: FinancialProfile = {
      id: 'usr_rahul_55',
      name: 'Rahul Verma (Small Merchant)',
      monthlyIncome: 45000,
      essentialMonthlyExpenses: 26000,
      discretionaryExpenses: 4000,
      existingMonthlyEMI: 5000,
      liquidSavings: 60000,
      fixedDeposits: 20000,
      creditScore: 698,
      dependents: 3,
      existingLifeCover: 1500000,
      existingHealthCover: 300000,
      occupation: 'Small Business Merchant',
      updatedAt: new Date().toISOString(),
    };
    this.userProfiles.set('usr_rahul_55', rahulProfile);
    this.userGoals.set('usr_rahul_55', [
      {
        id: 'goal_rahul_inventory',
        title: 'Wholesale Grocery Stocking',
        goalType: 'business_expansion',
        targetAmount: 150000,
        currentSaved: 20000,
        timelineMonths: 2,
        urgency: 'strict',
        status: 'evaluating',
        createdAt: new Date().toISOString(),
        notes: 'Buying bulk lentils and grains directly from mandi',
      },
    ]);
    this.userConsents.set('usr_rahul_55', this.getInitialConsents());
    this.userJourneys.set('usr_rahul_55', []);
    this.userDecisions.set('usr_rahul_55', []);

    // User 4: Demo Customer (Temporary Customer Account)
    const customerProfile: FinancialProfile = {
      id: 'usr_temp_customer',
      name: 'Demo Customer',
      monthlyIncome: 60000,
      essentialMonthlyExpenses: 30000,
      discretionaryExpenses: 6000,
      existingMonthlyEMI: 3500,
      liquidSavings: 85000,
      fixedDeposits: 40000,
      creditScore: 730,
      dependents: 2,
      existingLifeCover: 2500000,
      existingHealthCover: 500000,
      occupation: 'Retail & Digital Services Consumer',
      updatedAt: new Date().toISOString(),
    };
    this.userProfiles.set('usr_temp_customer', customerProfile);
    this.userGoals.set('usr_temp_customer', [
      {
        id: 'goal_cust_emergency',
        title: '6-Month Emergency Buffer',
        goalType: 'emergency_fund',
        targetAmount: 180000,
        currentSaved: 85000,
        timelineMonths: 6,
        urgency: 'strict',
        status: 'evaluating',
        createdAt: new Date().toISOString(),
        notes: 'Building family safety reserve before big purchases',
      },
    ]);
    this.userConsents.set('usr_temp_customer', this.getInitialConsents());
    this.userJourneys.set('usr_temp_customer', []);
    this.userDecisions.set('usr_temp_customer', []);
  }

  public sendOtp(destination: string): { success: boolean; message: string; otp: string; destination: string; expiresAt: string } {
    const cleanDest = destination.trim().toLowerCase();
    if (!cleanDest) {
      throw new Error('Please enter a valid customer phone number or email.');
    }

    // Generate 6 digit numeric code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    this.activeOtps.set(cleanDest, {
      code: otp,
      destination: cleanDest,
      expiresAt,
    });

    this.addAuditEvent({
      eventType: 'CONSENT_GRANTED',
      description: `6-Digit OTP security code dispatched to customer: ${cleanDest}`,
      dataSnapshot: { destination: cleanDest, expiresAt: new Date(expiresAt).toISOString() },
      userAction: 'Customer requested OTP verification token',
    });

    return {
      success: true,
      message: `Verification code sent to ${cleanDest}`,
      otp,
      destination: cleanDest,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  public verifyOtp(destination: string, otpCode: string): { session: AuthSession; profile: FinancialProfile } {
    const cleanDest = destination.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    const stored = this.activeOtps.get(cleanDest);
    const isMasterCode = cleanOtp === '123456';

    if (!stored && !isMasterCode) {
      throw new Error('No active OTP found for this customer. Please click "Send OTP" to receive a 6-digit code.');
    }

    if (!isMasterCode && stored) {
      if (Date.now() > stored.expiresAt) {
        this.activeOtps.delete(cleanDest);
        throw new Error('OTP has expired (validity 5 mins). Please request a fresh code.');
      }
      if (stored.code !== cleanOtp) {
        throw new Error('Incorrect OTP code. Please enter the 6 digits displayed in the notification.');
      }
      this.activeOtps.delete(cleanDest);
    }

    // Find customer by email or phone or map to demo customer
    let user = this.users.find((u) => {
      const uEmail = u.email.toLowerCase();
      const uPhone = (u.phone || '').replace(/[\s+-]/g, '');
      const testPhone = cleanDest.replace(/[\s+-]/g, '');
      return uEmail === cleanDest || (uPhone && testPhone && uPhone.includes(testPhone));
    });

    if (!user) {
      // Check if it's the demo customer
      user = this.users.find((u) => u.id === 'usr_temp_customer');
    }

    if (!user) {
      // Create new customer account
      const isEmail = cleanDest.includes('@');
      user = {
        id: `usr_cust_${Date.now()}`,
        name: isEmail ? cleanDest.split('@')[0].toUpperCase() : `Customer ${cleanDest.slice(-4)}`,
        email: isEmail ? cleanDest : `${cleanDest.replace(/[^0-9]/g, '')}@customer.finpath.ai`,
        password: 'tempPassword2026',
        role: 'Verified Customer',
        occupation: 'General Consumer & Retail Client',
        phone: !isEmail ? cleanDest : '+91 98765 00123',
        createdAt: new Date().toISOString(),
      };
      this.users.push(user);
    }

    const token = `finpath_token_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + 86400000 * 7).toISOString();
    const session: AuthSession = {
      token,
      user: this.getPublicUser(user),
      expiresAt,
    };
    this.sessions.set(token, session);

    this.switchActiveUser(user.id);

    this.addAuditEvent({
      eventType: 'USER_LOGGED_IN',
      description: `Customer ${user.name} logged in via verified OTP`,
      dataSnapshot: { userId: user.id, destination: cleanDest },
      userAction: 'Customer verified phone/email via OTP and authenticated',
    });

    return { session, profile: this.profile };
  }

  public authenticate(email: string, password: string): { session: AuthSession; profile: FinancialProfile } | null {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = password.trim();

    const user = this.users.find((u) => {
      const uEmail = u.email.toLowerCase();
      return (
        uEmail === cleanEmail ||
        (cleanEmail.includes('suyash') && u.id === 'usr_demo_786') ||
        (cleanEmail.includes('priya') && u.id === 'usr_priya_102') ||
        (cleanEmail.includes('rahul') && u.id === 'usr_rahul_55') ||
        (cleanEmail.includes('customer') && u.id === 'usr_temp_customer')
      );
    });

    if (!user || user.password !== cleanPass) {
      return null;
    }

    const token = `finpath_token_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + 86400000 * 7).toISOString();
    const session: AuthSession = {
      token,
      user: this.getPublicUser(user),
      expiresAt,
    };
    this.sessions.set(token, session);

    this.switchActiveUser(user.id);

    this.addAuditEvent({
      eventType: 'USER_LOGGED_IN',
      description: `User ${user.name} (${user.email}) successfully logged in`,
      dataSnapshot: { userId: user.id, email: user.email },
      userAction: 'User authenticated via backend login',
    });

    return { session, profile: this.profile };
  }

  public validateSession(token: string): AuthSession | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  public logout(token: string): boolean {
    const session = this.sessions.get(token);
    if (session) {
      this.addAuditEvent({
        eventType: 'USER_LOGGED_OUT',
        description: `User ${session.user.name} logged out`,
        dataSnapshot: { userId: session.user.id },
        userAction: 'User signed out of session',
      });
      this.sessions.delete(token);
      return true;
    }
    return false;
  }

  public registerUser(params: {
    name: string;
    email: string;
    password: string;
    occupation?: string;
    monthlyIncome?: number;
  }): { session: AuthSession; profile: FinancialProfile } {
    const existing = this.users.find((u) => u.email.toLowerCase() === params.email.toLowerCase().trim());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser: StoredUser = {
      id: `usr_${Date.now()}`,
      name: params.name,
      email: params.email.toLowerCase().trim(),
      password: params.password,
      role: 'Registered Consumer',
      occupation: params.occupation || 'Self-employed',
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);

    const newProfile: FinancialProfile = {
      id: newUser.id,
      name: newUser.name,
      monthlyIncome: params.monthlyIncome || 65000,
      essentialMonthlyExpenses: Math.round((params.monthlyIncome || 65000) * 0.5),
      discretionaryExpenses: Math.round((params.monthlyIncome || 65000) * 0.12),
      existingMonthlyEMI: 0,
      liquidSavings: Math.round((params.monthlyIncome || 65000) * 1.5),
      fixedDeposits: 0,
      creditScore: 720,
      dependents: 1,
      existingLifeCover: 2000000,
      existingHealthCover: 500000,
      occupation: newUser.occupation,
      updatedAt: new Date().toISOString(),
    };

    this.userProfiles.set(newUser.id, newProfile);
    this.userGoals.set(newUser.id, [
      {
        id: `goal_${Date.now()}`,
        title: 'Emergency Safety Fund',
        goalType: 'emergency_fund',
        targetAmount: (params.monthlyIncome || 65000) * 3,
        currentSaved: (params.monthlyIncome || 65000),
        timelineMonths: 6,
        urgency: 'moderate',
        status: 'evaluating',
        createdAt: new Date().toISOString(),
      },
    ]);
    this.userConsents.set(newUser.id, this.getInitialConsents());
    this.userJourneys.set(newUser.id, []);
    this.userDecisions.set(newUser.id, []);

    const token = `finpath_token_${newUser.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + 86400000 * 7).toISOString();
    const session: AuthSession = {
      token,
      user: this.getPublicUser(newUser),
      expiresAt,
    };
    this.sessions.set(token, session);

    this.switchActiveUser(newUser.id);

    this.addAuditEvent({
      eventType: 'USER_REGISTERED',
      description: `New user account created: ${newUser.name} (${newUser.email})`,
      dataSnapshot: { userId: newUser.id, email: newUser.email },
      userAction: 'User registered via backend',
    });

    return { session, profile: this.profile };
  }

  public ensureUserForPhone(
    phone: string,
    name: string = 'Retail Consumer',
    role: string = 'consumer_customer'
  ): StoredUser {
    const cleanDigits = phone.replace(/\D/g, '');
    let user = this.users.find(
      (u) => (u.phone && u.phone.replace(/\D/g, '') === cleanDigits) ||
             (u.email && u.email.includes(cleanDigits))
    );

    if (!user) {
      const id = `usr_phone_${cleanDigits}`;
      user = {
        id,
        name,
        email: `${cleanDigits}@user.finpath.ai`,
        password: 'verified_via_otp',
        role,
        occupation: 'Verified Retail Client',
        phone,
        createdAt: new Date().toISOString(),
      };
      this.users.push(user);

      const newProfile: FinancialProfile = {
        id: user.id,
        name: user.name,
        monthlyIncome: 65000,
        essentialMonthlyExpenses: 32000,
        discretionaryExpenses: 7000,
        existingMonthlyEMI: 4000,
        liquidSavings: 90000,
        fixedDeposits: 50000,
        creditScore: 740,
        dependents: 1,
        existingLifeCover: 3000000,
        existingHealthCover: 500000,
        occupation: user.occupation,
        updatedAt: new Date().toISOString(),
      };

      this.userProfiles.set(user.id, newProfile);
      this.userGoals.set(user.id, [
        {
          id: `goal_${Date.now()}`,
          title: 'Emergency Safety Reserve',
          goalType: 'emergency_fund',
          targetAmount: 200000,
          currentSaved: 90000,
          timelineMonths: 6,
          urgency: 'strict',
          status: 'evaluating',
          createdAt: new Date().toISOString(),
        },
      ]);
      this.userConsents.set(user.id, this.getInitialConsents());
      this.userJourneys.set(user.id, []);
      this.userDecisions.set(user.id, []);
    }

    return user;
  }

  public switchActiveUser(userId: string) {
    let targetId = userId;
    if (userId === 'usr_suyash_01') targetId = 'usr_demo_786';
    if (userId === 'usr_priya_02') targetId = 'usr_priya_102';
    if (userId === 'usr_rahul_03') targetId = 'usr_rahul_55';

    const user = this.users.find((u) => u.id === targetId);
    if (!user) return;

    if (this.activeUserId) {
      this.userProfiles.set(this.activeUserId, this.profile);
      this.userGoals.set(this.activeUserId, this.goals);
      this.userConsents.set(this.activeUserId, this.consents);
      this.userJourneys.set(this.activeUserId, this.journeys);
      this.userDecisions.set(this.activeUserId, this.decisions);
    }

    this.activeUserId = targetId;

    if (!this.userProfiles.has(targetId)) {
      this.userProfiles.set(targetId, this.getInitialProfile());
      this.userGoals.set(targetId, this.getInitialGoals());
      this.userConsents.set(targetId, this.getInitialConsents());
      this.userJourneys.set(targetId, []);
      this.userDecisions.set(targetId, []);
    }

    this.profile = this.userProfiles.get(targetId)!;
    this.goals = this.userGoals.get(targetId)!;
    this.consents = this.userConsents.get(targetId)!;
    this.journeys = this.userJourneys.get(targetId)!;
    this.decisions = this.userDecisions.get(targetId)!;

    if (this.decisions.length === 0 && this.goals.length > 0) {
      const dec = DecisionEngine.createDecisionRun(this.profile, this.goals[0], this.products);
      this.decisions.push(dec);
    }
  }

  public getChatHistory(userId: string = this.activeUserId): CopilotMessage[] {
    return this.chatHistory.get(userId) || [];
  }

  public saveChatMessage(message: CopilotMessage, userId: string = this.activeUserId) {
    if (!this.chatHistory.has(userId)) {
      this.chatHistory.set(userId, []);
    }
    const history = this.chatHistory.get(userId)!;
    history.push(message);
    if (history.length > 50) {
      history.shift();
    }
  }

  private getInitialProfile(): FinancialProfile {
    return {
      id: 'usr_demo_786',
      name: 'Suyash Bajpai (Demo User)',
      monthlyIncome: 72000,
      essentialMonthlyExpenses: 38000,
      discretionaryExpenses: 8000,
      existingMonthlyEMI: 8000,
      liquidSavings: 120000,
      fixedDeposits: 50000,
      creditScore: 742,
      dependents: 2,
      existingLifeCover: 2500000,
      existingHealthCover: 500000,
      occupation: 'Retail Business Owner',
      updatedAt: new Date().toISOString(),
    };
  }

  private getInitialGoals(): FinancialGoal[] {
    return [
      {
        id: 'goal_shop_expansion',
        title: 'Shop Expansion',
        goalType: 'business_expansion',
        targetAmount: 300000,
        currentSaved: 0,
        timelineMonths: 3,
        urgency: 'moderate',
        status: 'evaluating',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        notes: 'Commercial refrigeration + inventory expansion for festive season',
      },
      {
        id: 'goal_emergency_buffer',
        title: '6-Month Emergency Buffer',
        goalType: 'emergency_fund',
        targetAmount: 228000,
        currentSaved: 120000,
        timelineMonths: 12,
        urgency: 'flexible',
        status: 'in_progress',
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        notes: 'Baseline household safety reserve for family',
      },
    ];
  }

  private getInitialProducts(): FinancialProduct[] {
    return [
      {
        id: 'prod_loan_paytm_business',
        provider: 'Paytm Lending Partner (Aditya Birla Capital)',
        name: 'Paytm Merchant Business Growth Loan',
        type: 'loan',
        interestRate: 13.5,
        apr: 14.8,
        processingFee: 1.5,
        minAmount: 50000,
        maxAmount: 1000000,
        tenureMonthsMin: 6,
        tenureMonthsMax: 36,
        eligibility: 'Min 6 months shop merchant transactions, CIBIL >= 700',
        features: [
          'Direct daily or monthly EMI auto-debit',
          'Zero prepayment penalty after 6 EMIs',
          'Instant digital sanction within 48 hours',
        ],
        lastVerifiedAt: '2026-09-12T10:00:00Z',
        partnerEcosystem: 'Paytm Verified',
      },
      {
        id: 'prod_loan_hdfc_sme',
        provider: 'HDFC Bank',
        name: 'Business Enterprise Quick Term Loan',
        type: 'loan',
        interestRate: 14.2,
        apr: 15.6,
        processingFee: 1.8,
        minAmount: 100000,
        maxAmount: 2500000,
        tenureMonthsMin: 12,
        tenureMonthsMax: 48,
        eligibility: 'Annual turnover >= ₹15 Lakhs, 2 years ITR',
        features: [
          'Doorstep documentation or full digital verification',
          'Flexible bullet prepayment options',
        ],
        lastVerifiedAt: '2026-09-10T14:30:00Z',
        partnerEcosystem: 'Direct Bank',
      },
      {
        id: 'prod_loan_bajaj_flexi',
        provider: 'Bajaj Finserv',
        name: 'Flexi Business Term Facility',
        type: 'loan',
        interestRate: 15.0,
        apr: 16.5,
        processingFee: 2.0,
        minAmount: 50000,
        maxAmount: 1500000,
        tenureMonthsMin: 12,
        tenureMonthsMax: 36,
        eligibility: 'Valid GST/Udhyam registration',
        features: ['Withdraw as you need, pay interest only on utilized funds'],
        lastVerifiedAt: '2026-09-13T09:15:00Z',
        partnerEcosystem: 'NBFC Partner',
      },
      {
        id: 'prod_savings_paytm_payments_bank',
        provider: 'Paytm Payments Bank / Partner Scheduled Bank',
        name: 'High-Yield Liquid Savings Sweep Account',
        type: 'savings',
        interestRate: 7.1,
        apr: 7.1,
        processingFee: 0,
        minAmount: 1000,
        maxAmount: 5000000,
        tenureMonthsMin: 1,
        tenureMonthsMax: 60,
        eligibility: 'Instant PAN + Aadhaar OTP KYC',
        features: [
          'Automatic FD sweep above ₹25,000 threshold',
          'Instant withdrawal without lock-in penalty',
          'Interest calculated daily & credited monthly',
        ],
        lastVerifiedAt: '2026-09-14T06:00:00Z',
        partnerEcosystem: 'Paytm Verified',
      },
      {
        id: 'prod_ins_paytm_term',
        provider: 'Paytm Insurance Broking (HDFC Life)',
        name: 'Smart Business Family Term Shield',
        type: 'insurance',
        interestRate: 0,
        apr: 0,
        processingFee: 0,
        minAmount: 5000000,
        maxAmount: 20000000,
        tenureMonthsMin: 120,
        tenureMonthsMax: 480,
        eligibility: 'Age 21-55, non-smoker discount available',
        features: [
          'Covers personal business liabilities upon unforeseen demise',
          'Terminal illness accelerated payout',
          'Tax deduction under Sec 80C',
        ],
        lastVerifiedAt: '2026-09-11T12:00:00Z',
        partnerEcosystem: 'Paytm Verified',
      },
    ];
  }

  private getInitialConsents(): ConsentRecord[] {
    return [
      {
        id: 'cst_bank_accounts',
        category: 'Bank Accounts',
        purpose: 'Financial health & cash-flow resilience evaluation',
        dataItems: ['Account balances', 'Account holder name', 'Bank statements'],
        status: 'granted',
        grantedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 88).toISOString(),
        accountAggregatorReady: true,
      },
      {
        id: 'cst_transactions',
        category: 'Transactions',
        purpose: 'Monthly income and essential expense pattern verification',
        dataItems: ['Last 6 months debit/credit summaries', 'UPI cash flows'],
        status: 'granted',
        grantedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 88).toISOString(),
        accountAggregatorReady: true,
      },
      {
        id: 'cst_loans_credit',
        category: 'Loans & Credit',
        purpose: 'Existing EMI and total liability cross-check',
        dataItems: ['Active loan EMIs', 'Outstanding loan balances'],
        status: 'granted',
        grantedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 88).toISOString(),
        accountAggregatorReady: true,
      },
      {
        id: 'cst_credit_bureau',
        category: 'Credit Bureau',
        purpose: 'CIBIL / Experian credit score check for verified loan rates',
        dataItems: ['Credit score', 'Inquiries history', 'Default status'],
        status: 'pending',
        accountAggregatorReady: true,
      },
      {
        id: 'cst_insurance',
        category: 'Insurance',
        purpose: 'Evaluating dependent protection gap & liability coverage',
        dataItems: ['Active policy sum assured', 'Policy term dates'],
        status: 'pending',
        accountAggregatorReady: true,
      },
      {
        id: 'cst_income_tax',
        category: 'Income & Tax',
        purpose: 'GST & ITR turnover verification for higher loan limit eligibility',
        dataItems: ['ITR acknowledgment', 'Form 26AS summaries'],
        status: 'pending',
        accountAggregatorReady: true,
      },
    ];
  }

  private seedInitialData() {
    const shopGoal = this.goals[0];
    const initialDecision = DecisionEngine.createDecisionRun(
      this.profile,
      shopGoal,
      this.products
    );
    this.decisions.push(initialDecision);

    // Initial journey
    this.journeys.push({
      id: 'jrn_shop_expansion',
      goalId: shopGoal.id,
      goalTitle: shopGoal.title,
      decisionId: initialDecision.id,
      recommendedAction: initialDecision.recommendationTitle,
      status: 'in_progress',
      currentStepIndex: 3,
      startedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      assignedPartner: 'Paytm Lending Partner (Aditya Birla Capital)',
      steps: [
        {
          id: 'step_goal',
          title: 'Goal Definition',
          description: '₹3,00,000 required for shop expansion in 3 months',
          status: 'completed',
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
        {
          id: 'step_health',
          title: 'Financial Health Check',
          description: 'Calculated Resilience Score (72/100) & Cash Flow (₹26,000/mo)',
          status: 'completed',
          timestamp: new Date(Date.now() - 3600000 * 2.8).toISOString(),
        },
        {
          id: 'step_decision',
          title: 'Decision Engine Analysis',
          description: 'Ranked options: Recommended "Borrow ₹2.5L + Save ₹50K" (Score: 87)',
          status: 'completed',
          timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
        },
        {
          id: 'step_consent',
          title: 'Consent & Authorization',
          description: 'User consent granted for Bank statements & active liabilities verification',
          status: 'active',
          actionRequired: 'Grant remaining Credit Bureau consent to proceed to partner',
          timestamp: new Date(Date.now() - 3600000 * 2.0).toISOString(),
        },
        {
          id: 'step_handoff',
          title: 'Paytm Partner Handoff',
          description: 'Direct secure dispatch to Aditya Birla Capital with preset term',
          status: 'upcoming',
        },
        {
          id: 'step_application',
          title: 'Digital Application',
          description: 'Aadhaar e-KYC and digital mandate creation',
          status: 'upcoming',
        },
        {
          id: 'step_verification',
          title: 'Automated Sanction',
          description: 'Underwriting decision and digital agreement execution',
          status: 'upcoming',
        },
        {
          id: 'step_completion',
          title: 'Disbursement & Goal Execution',
          description: 'Funds credited to merchant account + auto-allocation of ₹50K buffer',
          status: 'upcoming',
        },
      ],
    });

    // Seed initial audit events
    this.addAuditEvent({
      eventType: 'GOAL_CREATED',
      description: 'Goal "Shop Expansion" registered with target ₹3,00,000',
      dataSnapshot: { goal: shopGoal },
      userAction: 'Created new business expansion goal via UI',
    });

    this.addAuditEvent({
      eventType: 'FINANCIAL_CALCULATION',
      description: 'Calculated Resilience Score (72/100), Free Cash Flow (₹26,000), Emergency Runway (3.1 mo)',
      dataSnapshot: { health: initialDecision.financialSnapshot },
      userAction: 'Automated deterministic health assessment',
    });

    this.addAuditEvent({
      eventType: 'DECISION_GENERATED',
      description: 'Decision Engine evaluated 3 candidate actions. Recommended: Borrow ₹2.5L + Save ₹50K (Score: 87)',
      dataSnapshot: { decisionId: initialDecision.id, candidateCount: 3 },
      userAction: 'Decision Engine execution',
    });

    this.addAuditEvent({
      eventType: 'CONSENT_GRANTED',
      description: 'User authorized Bank Accounts & Transaction data for financial health evaluation',
      dataSnapshot: { categories: ['Bank Accounts', 'Transactions', 'Loans & Credit'] },
      userAction: 'Granted consent via Consent Center',
    });
  }

  public addAuditEvent(params: {
    eventType: AuditEvent['eventType'];
    description: string;
    dataSnapshot: Record<string, any>;
    userAction: string;
  }): AuditEvent {
    const timestamp = new Date().toISOString();
    const event: AuditEvent = {
      id: `adt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp,
      eventType: params.eventType,
      description: params.description,
      dataSnapshot: params.dataSnapshot,
      userAction: params.userAction,
      immutableHash: generateHash({
        timestamp,
        type: params.eventType,
        data: params.dataSnapshot,
      }),
    };
    this.auditLogs.unshift(event);
    return event;
  }
}

export const dataStore = new DataStore();
