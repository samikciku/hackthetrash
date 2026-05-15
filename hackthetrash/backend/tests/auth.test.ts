import request from "supertest";
import { createApp } from "../src/app";

describe("/api/auth", () => {
  const app = createApp();

  it("rejects login without credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it("rejects login with bad password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hackthetrash.org", password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("logs in default admin user and returns a JWT", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hackthetrash.org", password: "TestAdmin!2026" });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.role).toBe("admin");
  });

  it("rejects /me without an Authorization header", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user from /me with a valid token", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hackthetrash.org", password: "TestAdmin!2026" });
    expect(login.status).toBe(200);

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe("admin@hackthetrash.org");
    expect(me.body.role).toBe("admin");
  });
});
