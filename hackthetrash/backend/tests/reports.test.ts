import request from "supertest";
import { createApp } from "../src/app";

describe("/api/reports", () => {
  const app = createApp();

  it("lists demo reports from the in-memory store", async () => {
    const res = await request(app).get("/api/reports");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.reports)).toBe(true);
    expect(res.body.reports.length).toBeGreaterThan(0);
  });

  it("returns 404 for an unknown report id", async () => {
    const res = await request(app).get("/api/reports/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("/api/admin/reports auth gate", () => {
  const app = createApp();

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/admin/reports");
    expect(res.status).toBe(401);
  });

  it("admin token can list and filter reports", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hackthetrash.org", password: "TestAdmin!2026" });
    const token = login.body.token;

    const all = await request(app)
      .get("/api/admin/reports")
      .set("Authorization", `Bearer ${token}`);
    expect(all.status).toBe(200);
    expect(Array.isArray(all.body.reports)).toBe(true);

    const stats = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(stats.status).toBe(200);
    expect(typeof stats.body.total).toBe("number");
    expect(typeof stats.body.byStatus).toBe("object");
  });
});
