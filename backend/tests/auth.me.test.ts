import request from "supertest";
jest.mock("../src/lib/supabase", () => {
  const auth = { getUser: jest.fn() };
  return { supabaseService: { auth } };
});
import app from "../src/server";
import { supabaseService } from "../src/lib/supabase";

describe("GET /api/auth/me", () => {
  it("returns 401 when missing bearer token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it("returns current user when token is valid", async () => {
    (supabaseService.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "u1", email: "u@example.com" } },
      error: null,
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer testtoken");

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: "u1", email: "u@example.com" });
  });
});
