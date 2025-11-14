import request from "supertest";
jest.mock("../src/lib/supabase", () => {
  const authAdmin = { createUser: jest.fn() };
  const auth = { admin: authAdmin, getUser: jest.fn() };
  const from = jest.fn(() => ({ insert: jest.fn() }));
  return { supabaseService: { auth, from } };
});
import app from "../src/server";
import { supabaseService } from "../src/lib/supabase";

describe("POST /api/auth/signup", () => {
  it("returns 400 on invalid body", async () => {
    const res = await request(app).post("/api/auth/signup").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("creates user and inserts profile", async () => {
    const createUserSpy = jest
      .spyOn(supabaseService.auth.admin, "createUser")
      .mockResolvedValue({
        data: { user: { id: "test-user-id", email: "tester@example.com" } },
        error: null as any,
      } as any);

    const insertSpy = jest.spyOn(supabaseService, "from");
    (supabaseService.from as any).mockReturnValue({
      insert: () => Promise.resolve({ data: null, error: null }),
    });

    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "tester@example.com", password: "secret", full_name: "Tester" });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(createUserSpy).toHaveBeenCalled();
    expect(insertSpy).toHaveBeenCalled();

    createUserSpy.mockRestore();
    insertSpy.mockRestore();
  });
});
