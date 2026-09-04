import request from 'supertest';
import app from '../app';
import { otpRepository } from '../repositories/otp.repository';
import { magicLinkRepository } from '../repositories/magicLink.repository';
import { userRepository } from '../repositories/user.repository';
import { hashToken, generateSecureToken } from '../utils/crypto';
import { env } from '../config/env';

// Helper to create mock OTP record directly
function createOtpRecord(email: string, otp: string, overrides: Partial<any> = {}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
  return {
    id: `email:${email.toLowerCase()}`,
    email: email.toLowerCase(),
    channel: 'email' as const,
    hashedOtp: hashToken(otp),
    expiresAt,
    attempts: 0,
    maxAttempts: env.OTP_MAX_ATTEMPTS,
    resendCount: 1,
    lastSentAt: now.toISOString(),
    verified: false,
    createdAt: now.toISOString(),
    ...overrides,
  };
}

describe('Auth flows', () => {
  const testEmail = 'test@example.com';
  const testOtp = '123456';

  beforeEach(() => {
    otpRepository._clearMemory();
    magicLinkRepository._clearMemory();
    userRepository._clearMemory();
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/send-otp', () => {
    it('should generate OTP and return expiresAt', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ email: testEmail });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('expiresAt');

      const stored = await otpRepository.get(testEmail, 'email');
      expect(stored).not.toBeNull();
      expect(stored!.email).toBe(testEmail.toLowerCase());
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ email: 'not-an-email' });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should enforce resend cooldown', async () => {
      await request(app).post('/api/v1/auth/send-otp').send({ email: testEmail });
      const res2 = await request(app).post('/api/v1/auth/send-otp').send({ email: testEmail });
      expect(res2.status).toBe(429);
      expect(res2.body.error.code).toBe('OTP_RESEND_COOLDOWN');
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    it('should verify correct OTP and return customToken + create user', async () => {
      await otpRepository.set(createOtpRecord(testEmail, testOtp));

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: testEmail, otp: testOtp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('customToken');
      expect(res.body.data).toHaveProperty('uid');

      const user = await userRepository.findByEmail(testEmail);
      expect(user).not.toBeNull();
      expect(user!.emailVerified).toBe(true);
    });

    it('should fail on incorrect OTP', async () => {
      await otpRepository.set(createOtpRecord(testEmail, testOtp));

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: testEmail, otp: '999999' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_OTP');
      expect(res.body.error.details).toHaveProperty('remaining');
    });

    it('should fail on expired OTP', async () => {
      const past = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      await otpRepository.set(
        createOtpRecord(testEmail, testOtp, { expiresAt: past })
      );

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: testEmail, otp: testOtp });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('OTP_EXPIRED');
    });

    it('should prevent OTP reuse', async () => {
      await otpRepository.set(createOtpRecord(testEmail, testOtp));

      const first = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: testEmail, otp: testOtp });
      expect(first.status).toBe(200);

      const second = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: testEmail, otp: testOtp });
      // After successful verification, record is deleted → OTP_NOT_FOUND
      expect([400, 404]).toContain(second.status);
      expect(['OTP_NOT_FOUND', 'OTP_ALREADY_USED', 'INVALID_OTP']).toContain(second.body.error?.code);
    });

    it('should enforce max attempts', async () => {
      await otpRepository.set(
        createOtpRecord(testEmail, testOtp, { attempts: env.OTP_MAX_ATTEMPTS })
      );

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: testEmail, otp: testOtp });

      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('OTP_MAX_ATTEMPTS_EXCEEDED');
    });

    it('should increment attempts on wrong OTP', async () => {
      await otpRepository.set(createOtpRecord(testEmail, testOtp, { attempts: 0 }));
      await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: testEmail, otp: '000000' });

      const rec = await otpRepository.get(testEmail, 'email');
      expect(rec!.attempts).toBe(1);
    });
  });

  describe('Magic link', () => {
    it('should send magic link and return link in dev', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-magic-link')
        .send({ email: testEmail });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // In non-production, link is returned
      if (process.env.NODE_ENV !== 'production') {
        expect(res.body.data.link).toMatch(/token=/);
      }
    });

    it('should verify valid magic link', async () => {
      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);
      const now = new Date();
      await magicLinkRepository.create({
        id: tokenHash,
        email: testEmail.toLowerCase(),
        tokenHash,
        expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
        used: false,
        createdAt: now.toISOString(),
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-magic-link')
        .send({ token: rawToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('customToken');

      const user = await userRepository.findByEmail(testEmail);
      expect(user).not.toBeNull();
    });

    it('should reject reuse of magic link', async () => {
      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);
      const now = new Date();
      await magicLinkRepository.create({
        id: tokenHash,
        email: testEmail.toLowerCase(),
        tokenHash,
        expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
        used: false,
        createdAt: now.toISOString(),
      });

      await request(app).post('/api/v1/auth/verify-magic-link').send({ token: rawToken });
      const second = await request(app).post('/api/v1/auth/verify-magic-link').send({ token: rawToken });
      expect(second.status).toBe(400);
      expect(second.body.error.code).toBe('MAGIC_LINK_ALREADY_USED');
    });

    it('should reject expired magic link', async () => {
      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);
      const past = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      await magicLinkRepository.create({
        id: tokenHash,
        email: testEmail.toLowerCase(),
        tokenHash,
        expiresAt: past,
        used: false,
        createdAt: past,
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-magic-link')
        .send({ token: rawToken });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MAGIC_LINK_EXPIRED');
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-magic-link')
        .send({ token: 'invalidtoken1234567890' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_MAGIC_LINK');
    });

    it('should support GET verify with query token', async () => {
      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);
      const now = new Date();
      await magicLinkRepository.create({
        id: tokenHash,
        email: testEmail.toLowerCase(),
        tokenHash,
        expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
        used: false,
        createdAt: now.toISOString(),
      });

      const res = await request(app).get(`/api/v1/auth/verify-magic-link?token=${rawToken}`);
      // JSON expected when Accept: application/json
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Authenticated endpoints', () => {
    it('should reject without token', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token-123');
      expect(res.status).toBe(401);
    });

    it('should allow with mock test-token and return user', async () => {
      // First create user via OTP verify flow to get uid
      const email = 'authuser@example.com';
      await otpRepository.set(createOtpRecord(email, testOtp));
      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email, otp: testOtp });
      const uid = verifyRes.body.data.uid as string;

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer test-token-${uid}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(email.toLowerCase());
    });

    it('should allow customToken mock to authenticate /api/v1/auth/me', async () => {
      const email = 'customtoken@example.com';
      await otpRepository.set(createOtpRecord(email, testOtp));
      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email, otp: testOtp });
      const customToken = verifyRes.body.data.customToken as string;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${customToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(email.toLowerCase());
    });

    it('should update profile when authenticated', async () => {
      const email = 'updateme@example.com';
      await otpRepository.set(createOtpRecord(email, testOtp));
      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email, otp: testOtp });
      const uid = verifyRes.body.data.uid as string;

      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer test-token-${uid}`)
        .send({ name: 'John Doe', phone: '+919876543210' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('John Doe');
      expect(res.body.data.phone).toBe('+919876543210');
    });

    it('should soft-delete account', async () => {
      const email = 'deleteme@example.com';
      await otpRepository.set(createOtpRecord(email, testOtp));
      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email, otp: testOtp });
      const uid = verifyRes.body.data.uid as string;

      const res = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer test-token-${uid}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer test-token-${uid}`);
      expect(check.status).toBe(404);
    });
  });

  describe('User creation / retrieval', () => {
    it('should create user on OTP verify if not exists', async () => {
      const email = 'newuser@example.com';
      await otpRepository.set(createOtpRecord(email, testOtp));
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email, otp: testOtp });
      expect(res.status).toBe(200);
      const stored = await userRepository.findByEmail(email);
      expect(stored).not.toBeNull();
      expect(stored!.providers).toEqual(expect.arrayContaining(['email_otp']));
    });

    it('should mark emailVerified true after OTP', async () => {
      const email = 'verified@example.com';
      await otpRepository.set(createOtpRecord(email, testOtp));
      await request(app).post('/api/v1/auth/verify-otp').send({ email, otp: testOtp });
      const u = await userRepository.findByEmail(email);
      expect(u!.emailVerified).toBe(true);
    });
  });

  describe('Password flows', () => {
    it('should allow setting password when authenticated', async () => {
      const email = 'pwduser@example.com';
      await otpRepository.set(createOtpRecord(email, testOtp));
      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email, otp: testOtp });
      const uid = verifyRes.body.data.uid as string;

      const res = await request(app)
        .post('/api/v1/auth/set-password')
        .set('Authorization', `Bearer test-token-${uid}`)
        .send({ password: 'StrongPass1!' });

      expect(res.status).toBe(200);
      const u = await userRepository.findById(uid);
      expect(u!.hasPassword).toBe(true);
    });

    it('should validate password strength', async () => {
      const email = 'weakpwd@example.com';
      await otpRepository.set(createOtpRecord(email, testOtp));
      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email, otp: testOtp });
      const uid = verifyRes.body.data.uid as string;

      const res = await request(app)
        .post('/api/v1/auth/set-password')
        .set('Authorization', `Bearer test-token-${uid}`)
        .send({ password: 'weak' });

      expect(res.status).toBe(422);
    });

    it('should handle forgot-password without revealing existence', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
