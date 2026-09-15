import crypto from 'crypto';
import {
  getUsersCollection,
  getOtpCollection,
  getSessionsCollection,
  UserDocument,
  OTPVerificationDocument,
  UserSessionDocument,
} from '../db/mongodb.js';
import { getSmsProvider } from '../sms/SmsProvider.js';

const OTP_SECRET = process.env.OTP_SECRET || 'finpath_super_secure_otp_secret_2026_paytm_hackathon';
const MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 5;
const RATE_LIMIT_WINDOW_HOURS = 1;
const MAX_OTP_PER_HOUR = 5;

// In-memory rate limiting map: phone -> array of request timestamps
const rateLimitMap: Map<string, number[]> = new Map();

/**
 * Normalizes and validates Indian phone numbers.
 * Supports:
 * - 10-digit numbers (e.g. 9876543210)
 * - Numbers with country code (e.g. +91 9876543210, 919876543210, 09876543210)
 */
export function normalizeIndianPhoneNumber(input: string): string {
  if (!input) throw new Error('Enter a valid 10-digit mobile number.');
  const digitsOnly = input.replace(/\D/g, '');

  let tenDigits = '';
  if (digitsOnly.length === 10) {
    tenDigits = digitsOnly;
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    tenDigits = digitsOnly.substring(2);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    tenDigits = digitsOnly.substring(1);
  } else {
    throw new Error('Enter a valid 10-digit mobile number.');
  }

  // Validate standard Indian mobile prefix (starts with 6, 7, 8, or 9)
  if (!/^[6-9]\d{9}$/.test(tenDigits)) {
    throw new Error('Enter a valid 10-digit mobile number.');
  }

  return `+91${tenDigits}`;
}

/**
 * Securely hashes the OTP using HMAC-SHA256 with OTP_SECRET
 */
export function hashOtp(phone: string, otp: string): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${phone}:${otp}`)
    .digest('hex');
}

/**
 * Timing-safe hash comparison
 */
export function verifyOtpHash(phone: string, candidateOtp: string, storedHash: string): boolean {
  try {
    const candidateHash = hashOtp(phone, candidateOtp);
    const candBuf = Buffer.from(candidateHash, 'hex');
    const storBuf = Buffer.from(storedHash, 'hex');
    if (candBuf.length !== storBuf.length) return false;
    return crypto.timingSafeEqual(candBuf, storBuf);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 * NEVER uses Math.random().
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Generates a cryptographically secure session ID.
 */
export function generateSecureSessionId(): string {
  return `finpath_sess_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Checks rate limits (Max 5 requests/hour/phone)
 */
function checkRateLimit(phone: string) {
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000;
  const history = rateLimitMap.get(phone) || [];

  // Filter out timestamps older than window
  const activeTimestamps = history.filter((ts) => now - ts < windowMs);

  if (activeTimestamps.length >= MAX_OTP_PER_HOUR) {
    throw new Error('Too many requests. Please try again later.');
  }

  activeTimestamps.push(now);
  rateLimitMap.set(phone, activeTimestamps);
}

/**
 * Sends or resends an OTP to the given phone number.
 */
export async function sendOtpToPhone(rawPhone: string): Promise<{
  success: boolean;
  message: string;
  phone: string;
  expiresInSeconds: number;
}> {
  const phone = normalizeIndianPhoneNumber(rawPhone);

  // Rate limiting check
  checkRateLimit(phone);

  const otpCollection = await getOtpCollection();

  // Invalidate any unverified active OTPs for this phone
  await otpCollection.deleteMany({ phone, verified: false });

  // Generate cryptographically secure OTP
  const otp = generateSecureOtp();
  const hashed = hashOtp(phone, otp);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const otpRecord: OTPVerificationDocument = {
    phone,
    otpHash: hashed,
    expiresAt,
    attempts: 0,
    verified: false,
    createdAt: now,
  };

  await otpCollection.insertOne(otpRecord);

  // Dispatch via SMS Provider (Mock or Production)
  const smsProvider = getSmsProvider();
  await smsProvider.sendOtp(phone, otp);

  return {
    success: true,
    message: 'OTP sent successfully',
    phone,
    expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
  };
}

/**
 * Verifies submitted OTP against MongoDB record and establishes user session
 */
export async function verifyOtpCode(
  rawPhone: string,
  candidateOtp: string
): Promise<{
  success: boolean;
  sessionId: string;
  user: { id: string; phone: string; name: string; role: string };
  isNewUser: boolean;
}> {
  const phone = normalizeIndianPhoneNumber(rawPhone);

  if (!candidateOtp || candidateOtp.length !== 6 || !/^\d{6}$/.test(candidateOtp)) {
    throw new Error('Please enter a valid 6-digit OTP code.');
  }

  const otpCollection = await getOtpCollection();

  // Find latest active OTP record for phone
  const records = await otpCollection.find({ phone, verified: false });
  const sorted = await records.sort({ createdAt: -1 }).toArray();
  const record = sorted[0];

  if (!record) {
    throw new Error('No active OTP found. Please request a new OTP.');
  }

  // Check attempt limit
  if (record.attempts >= MAX_ATTEMPTS) {
    await otpCollection.deleteOne({ _id: record._id });
    throw new Error('Too many attempts. Please request a new OTP.');
  }

  // Check expiration
  const now = new Date();
  if (new Date(record.expiresAt) < now) {
    await otpCollection.deleteOne({ _id: record._id });
    throw new Error('This OTP has expired. Please request a new OTP.');
  }

  // Secure comparison
  const isValid = verifyOtpHash(phone, candidateOtp, record.otpHash);

  if (!isValid) {
    const updatedAttempts = (record.attempts || 0) + 1;
    await otpCollection.updateOne(
      { _id: record._id },
      { $set: { attempts: updatedAttempts } }
    );

    const remaining = MAX_ATTEMPTS - updatedAttempts;
    if (remaining <= 0) {
      await otpCollection.deleteOne({ _id: record._id });
      throw new Error('Too many attempts. Please request a new OTP.');
    }

    throw new Error(`Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
  }

  // Mark as verified
  await otpCollection.updateOne(
    { _id: record._id },
    { $set: { verified: true } }
  );

  // Find or create User
  const usersCollection = await getUsersCollection();
  let user = await usersCollection.findOne({ phone });
  let isNewUser = false;

  const nowIso = now.toISOString();

  if (!user) {
    isNewUser = true;
    const defaultName = `User ${phone.slice(-4)}`;
    user = {
      phone,
      name: defaultName,
      email: `${phone.replace(/\+/g, '')}@user.finpath.ai`,
      role: 'Verified Customer',
      profileCompleted: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: nowIso,
    };
    const res = await usersCollection.insertOne(user);
    user._id = res.insertedId;
  } else {
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: nowIso, updatedAt: nowIso } }
    );
  }

  // Generate secure session
  const sessionId = generateSecureSessionId();
  const sessionExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const sessionsCollection = await getSessionsCollection();
  const sessionDoc: UserSessionDocument = {
    sessionId,
    userId: String(user._id || user.phone),
    phone: user.phone,
    name: user.name,
    role: user.role,
    isDemo: false,
    createdAt: now,
    expiresAt: sessionExpiry,
  };

  await sessionsCollection.insertOne(sessionDoc);

  return {
    success: true,
    sessionId,
    user: {
      id: String(user._id || user.phone),
      phone: user.phone,
      name: user.name,
      role: user.role,
    },
    isNewUser,
  };
}

/**
 * Creates a synthetic demo session without SMS requirement
 */
export async function createDemoSession(): Promise<{
  sessionId: string;
  user: { id: string; phone: string; name: string; role: string; isDemo: boolean };
}> {
  const demoPhone = '+919999999999';
  const now = new Date();
  const nowIso = now.toISOString();

  const usersCollection = await getUsersCollection();
  let demoUser = await usersCollection.findOne({ phone: demoPhone });

  if (!demoUser) {
    demoUser = {
      phone: demoPhone,
      name: 'Demo User',
      email: 'demo@finpath.ai',
      role: 'Demo Merchant',
      profileCompleted: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: nowIso,
    };
    const res = await usersCollection.insertOne(demoUser);
    demoUser._id = res.insertedId;
  } else {
    await usersCollection.updateOne(
      { _id: demoUser._id },
      { $set: { lastLoginAt: nowIso } }
    );
  }

  const sessionId = generateSecureSessionId();
  const sessionExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const sessionsCollection = await getSessionsCollection();
  const sessionDoc: UserSessionDocument = {
    sessionId,
    userId: String(demoUser._id || demoPhone),
    phone: demoPhone,
    name: demoUser.name,
    role: demoUser.role,
    isDemo: true,
    createdAt: now,
    expiresAt: sessionExpiry,
  };

  await sessionsCollection.insertOne(sessionDoc);

  return {
    sessionId,
    user: {
      id: String(demoUser._id || demoPhone),
      phone: demoPhone,
      name: demoUser.name,
      role: demoUser.role,
      isDemo: true,
    },
  };
}

/**
 * Validates a session by sessionId
 */
export async function validateSessionId(sessionId: string): Promise<UserSessionDocument | null> {
  if (!sessionId) return null;
  const sessionsCollection = await getSessionsCollection();
  const session = await sessionsCollection.findOne({ sessionId });
  if (!session) return null;

  const now = new Date();
  if (new Date(session.expiresAt) < now) {
    await sessionsCollection.deleteOne({ sessionId });
    return null;
  }

  return session;
}

/**
 * Invalidates and deletes a session
 */
export async function destroySession(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  const sessionsCollection = await getSessionsCollection();
  const result = await sessionsCollection.deleteOne({ sessionId });
  return result.deletedCount > 0;
}
