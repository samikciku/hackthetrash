import { NextRequest, NextResponse } from "next/server";
import { authenticateBearerFromHeader } from "../../../../../../backend/src/middleware/auth";
import { Users, Role } from "../../../../../../backend/src/services/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const VALID_ROLES: Role[] = ["citizen", "moderator", "authority", "admin"];

// GET /api/admin/users
export async function GET(request: NextRequest) {
  const auth = await authenticateBearerFromHeader(
    request.headers.get("authorization") ?? undefined,
    request.headers.get("cookie")
  );
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (auth.auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  try {
    const all = await Users.list();
    return NextResponse.json({
      users: all.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        region: u.region
      }))
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "list failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/users
export async function POST(request: NextRequest) {
  const auth = await authenticateBearerFromHeader(
    request.headers.get("authorization") ?? undefined,
    request.headers.get("cookie")
  );
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (auth.auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string | null;
      role?: Role;
      region?: string;
    };
    const { email, password, name, role, region } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
    }
    const desiredRole: Role = VALID_ROLES.includes(role!) ? role! : "moderator";

    const existing = await Users.findByEmail(String(email));
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const u = await Users.create({
      email: String(email),
      password: String(password),
      name: name ? String(name) : undefined,
      role: desiredRole,
      region: region ? String(region) : undefined
    });
    return NextResponse.json(
      { id: u.id, email: u.email, name: u.name, role: u.role, region: u.region },
      { status: 201 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "create failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
