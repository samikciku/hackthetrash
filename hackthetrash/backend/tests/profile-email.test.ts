import request from "supertest";
import { createApp } from "../src/app";

describe("profile + email subscription endpoints", () => {
  const app = createApp();

  it("returns the badge catalog", async () => {
    const res = await request(app).get("/api/profile/badges");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.badges)).toBe(true);
    expect(res.body.badges.find((b: any) => b.code === "first_report")).toBeTruthy();
  });

  it("returns the admin's own profile", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hackthetrash.org", password: "TestAdmin!2026" });
    const token = login.body.token;

    const me = await request(app)
      .get("/api/profile/me")
      .set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe("admin@hackthetrash.org");
    expect(typeof me.body.stats.totalReports).toBe("number");
    expect(Array.isArray(me.body.badges)).toBe(true);
  });

  it("rejects an obviously invalid email subscription", async () => {
    const res = await request(app)
      .post("/api/email-subscriptions")
      .send({ email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("subscribes and unsubscribes via token", async () => {
    const sub = await request(app)
      .post("/api/email-subscriptions")
      .send({ email: "citizen@example.com", region: "Prishtina" });
    expect(sub.status).toBe(201);
    const url: string = sub.body.unsubscribe_url;
    expect(url).toContain("/api/email-subscriptions/unsubscribe/");

    const unsub = await request(app).get(url);
    expect(unsub.status).toBe(200);
      expect(unsub.text.toLowerCase()).toContain("unsubscribed");
  });
});
