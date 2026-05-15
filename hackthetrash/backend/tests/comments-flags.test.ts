import request from "supertest";
import { createApp } from "../src/app";

describe("comments + flags (in-memory)", () => {
  const app = createApp();

  it("posts and lists a comment on a demo report", async () => {
    const create = await request(app)
      .post("/api/reports/demo-1/comments")
      .send({ text: "Looks bad here.", anonymous: true, authorName: "Pedestrian" });
    expect(create.status).toBe(201);
    expect(create.body.text).toBe("Looks bad here.");

    const list = await request(app).get("/api/reports/demo-1/comments");
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.comments)).toBe(true);
    expect(list.body.comments.find((c: any) => c.id === create.body.id)).toBeTruthy();
  });

  it("rejects empty comment text", async () => {
    const res = await request(app)
      .post("/api/reports/demo-1/comments")
      .send({ text: "  " });
    expect(res.status).toBe(400);
  });

  it("rejects an unknown flag reason", async () => {
    const res = await request(app)
      .post("/api/reports/demo-1/flags")
      .send({ reason: "nonsense" });
    expect(res.status).toBe(400);
  });

  it("creates a flag with a known reason", async () => {
    const res = await request(app)
      .post("/api/reports/demo-1/flags")
      .send({ reason: "duplicate", note: "Already reported nearby" });
    expect(res.status).toBe(201);
    expect(res.body.reason).toBe("duplicate");
    expect(res.body.resolved).toBe(false);
  });

  it("admin can list and resolve flags", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hackthetrash.org", password: "TestAdmin!2026" });
    const token = login.body.token;

    const create = await request(app)
      .post("/api/reports/demo-2/flags")
      .send({ reason: "spam" });
    expect(create.status).toBe(201);
    const flagId = create.body.id;

    const list = await request(app)
      .get("/api/admin/flags?resolved=false")
      .set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.flags.find((f: any) => f.id === flagId)).toBeTruthy();

    const resolve = await request(app)
      .patch(`/api/admin/flags/${flagId}/resolve`)
      .set("Authorization", `Bearer ${token}`);
    expect(resolve.status).toBe(200);
    expect(resolve.body.ok).toBe(true);
  });
});
