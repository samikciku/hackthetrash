import request from "supertest";
import { createApp } from "../src/app";

describe("health endpoints", () => {
  const app = createApp();

  it("GET / returns service identity", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe("HackTheTrash API");
  });

  it("GET /health returns healthy", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.checks).toBeUndefined();
  });

  it("sets hardening headers", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("DENY");
  });
});
