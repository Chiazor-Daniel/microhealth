// Must run BEFORE any app imports - set env vars at module level
process.env.NODE_ENV = "development";
process.env.JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
