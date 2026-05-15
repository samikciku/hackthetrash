// Make sure tests run against the in-memory store (no DATABASE_URL)
// and use deterministic admin credentials.
delete process.env.DATABASE_URL;
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-please-change";
process.env.ADMIN_EMAIL = "admin@hackthetrash.org";
process.env.ADMIN_PASSWORD = "TestAdmin!2026";
process.env.AI_PROVIDER = "mock";
process.env.SMTP_TRANSPORT = "console";
process.env.CORS_ORIGINS = "*";
