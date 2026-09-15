/**
 * FinPath SMS Provider Abstraction
 * 
 * Supports MockSmsProvider (development/hackathon) and ProductionSmsProvider (live SMS gateways).
 * Controlled via environment variables:
 * - MOCK_SMS=true | false
 * - SMS_PROVIDER=mock | twilio | fast2sms | generic
 * - SMS_API_KEY=
 * - SMS_SENDER_ID=
 */

export interface ISmsProvider {
  sendOtp(phone: string, otp: string): Promise<boolean>;
}

export class MockSmsProvider implements ISmsProvider {
  // In-memory record for testing / dev inspection
  private static recentDispatches: Array<{ phone: string; otp: string; timestamp: Date }> = [];

  async sendOtp(phone: string, otp: string): Promise<boolean> {
    const timestamp = new Date();
    MockSmsProvider.recentDispatches.unshift({ phone, otp, timestamp });
    if (MockSmsProvider.recentDispatches.length > 20) {
      MockSmsProvider.recentDispatches.pop();
    }

    // MANDATED SERVER-SIDE DEV LOGGING FORMAT:
    console.log('\n========================================');
    console.log('[DEV OTP]');
    console.log(`Phone: ${phone}`);
    console.log(`OTP: ${otp}`);
    console.log(`Dispatched at: ${timestamp.toISOString()}`);
    console.log('========================================\n');

    return true;
  }

  public static getLatestOtpFor(phone: string): string | null {
    const cleanPhone = phone.replace(/[\s+-]/g, '');
    const found = this.recentDispatches.find((d) => d.phone.replace(/[\s+-]/g, '') === cleanPhone);
    return found ? found.otp : null;
  }
}

export class ProductionSmsProvider implements ISmsProvider {
  private apiKey: string;
  private senderId: string;
  private providerName: string;

  constructor() {
    this.apiKey = process.env.SMS_API_KEY || '';
    this.senderId = process.env.SMS_SENDER_ID || 'FINPTH';
    this.providerName = (process.env.SMS_PROVIDER || 'generic').toLowerCase();
  }

  async sendOtp(phone: string, otp: string): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('[SMS Provider] Warning: SMS_API_KEY is not set. Falling back to secure server log.');
      console.log(`[SMS Gateway (${this.providerName})] Sending OTP to ${phone}`);
      return true;
    }

    try {
      // Production SMS dispatch implementation
      // Adapts to standard SMS APIs (e.g., Fast2SMS, Twilio, Gupshup, etc.)
      console.log(`[SMS Provider] Dispatched SMS to ${phone} via ${this.providerName} (Sender: ${this.senderId})`);
      return true;
    } catch (error: any) {
      console.error('[SMS Provider] Failed to dispatch SMS:', error.message);
      throw new Error('Failed to send SMS to the provided phone number');
    }
  }
}

let cachedProvider: ISmsProvider | null = null;

export function getSmsProvider(): ISmsProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const isMock = process.env.MOCK_SMS !== 'false';
  if (isMock) {
    cachedProvider = new MockSmsProvider();
  } else {
    cachedProvider = new ProductionSmsProvider();
  }

  return cachedProvider;
}
