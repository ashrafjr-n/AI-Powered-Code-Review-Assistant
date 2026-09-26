// MOCK (frontend-only phase). Source files for the sample projects, so the workspace
// has real code to show. In C3 files come from uploaded ZIPs via the files API.
import type { ProjectFile } from "@/lib/types";

function file(path: string, content: string): ProjectFile {
  const text = content.replace(/^\n/, "");
  return { path, size: new TextEncoder().encode(text).length, content: text };
}

export const crmFiles: ProjectFile[] = [
  file(
    "package.json",
    `
{
  "name": "crm-backend",
  "version": "1.4.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.16.0",
    "stripe": "^18.2.0"
  }
}
`,
  ),
  file(
    "README.md",
    `
# CRM Backend

REST API for contacts, deals and invoices.

## Run

    npm install
    npm run dev

Needs a PostgreSQL database in DATABASE_URL.
`,
  ),
  file(
    "src/index.ts",
    `
import express from "express";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { errorHandler } from "./middleware/errors.js";

const app = express();
app.use(express.json());

app.use("/auth", authRouter);
app.use("/users", usersRouter);

app.use(errorHandler);

app.listen(process.env.PORT ?? 3000, () => {
  console.log("CRM API ready");
});
`,
  ),
  file(
    "src/config/payments.ts",
    `
import Stripe from "stripe";

export const stripe = new Stripe(
  "sk_live_51Hx9TzLkq2mPq8Zt4vB7nR1cW3yE6uJ0aD5fG8hK2lM",
  { apiVersion: "2025-01-27" },
);
`,
  ),
  file(
    "src/db/pool.ts",
    `
import pg from "pg";

// One shared pool for the whole app.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

export async function query<T>(text: string, params: unknown[] = []) {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
`,
  ),
  file(
    "src/routes/users.ts",
    `
import { Router } from "express";
import { query } from "../db/pool.js";

export const usersRouter = Router();

interface UserRow {
  id: number;
  name: string;
  email: string;
}

usersRouter.get("/:id", async (req, res) => {
  const rows = await query<UserRow>(
    "SELECT id, name, email FROM users WHERE id = $1",
    [req.params.id],
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(rows[0]);
});

usersRouter.get("/", async (req, res) => {
  const search = String(req.query.search ?? "");
  const rows = await query<UserRow>(
    "SELECT id, name, email FROM users WHERE name LIKE '%" + search + "%'",
  );
  res.json(rows);
});
`,
  ),
  file(
    "src/routes/auth.ts",
    `
import { Router } from "express";
import jwt from "jsonwebtoken";
import { query } from "../db/pool.js";
import { verifyPassword } from "../auth/passwords.js";

export const authRouter = Router();

interface LoginRow {
  id: number;
  password_hash: string;
}

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const [user] = await query<LoginRow>(
    "SELECT id, password_hash FROM users WHERE email = $1",
    [email],
  );
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });
  res.json({ token });
});
`,
  ),
  file(
    "src/auth/reset-password.ts",
    `
import { randomBytes } from "node:crypto";
import { query } from "../db/pool.js";
import { hashPassword } from "./passwords.js";

interface ResetRow {
  user_id: number;
}

export async function createResetToken(userId: number) {
  const token = randomBytes(32).toString("hex");
  await query("INSERT INTO reset_tokens (user_id, token) VALUES ($1, $2)", [
    userId,
    token,
  ]);
  return token;
}

export async function resetPassword(token: string, newPassword: string) {
  const [row] = await query<ResetRow>(
    "SELECT user_id FROM reset_tokens WHERE token = $1",
    [token],
  );
  if (!row) {
    throw new Error("Invalid token");
  }
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    await hashPassword(newPassword),
    row.user_id,
  ]);
}
`,
  ),
  file(
    "src/middleware/errors.ts",
    `
import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message, stack: err.stack });
};
`,
  ),
  file(
    "src/services/invoices.ts",
    `
import { query } from "../db/pool.js";

interface Invoice {
  id: number;
  customer_id: number;
  total: number;
}

interface Customer {
  id: number;
  name: string;
}

export async function listInvoicesWithCustomers() {
  const invoices = await query<Invoice>("SELECT * FROM invoices");
  const result = [];
  for (const invoice of invoices) {
    const [customer] = await query<Customer>(
      "SELECT id, name FROM customers WHERE id = $1",
      [invoice.customer_id],
    );
    result.push({ ...invoice, customer });
  }
  return result;
}
`,
  ),
];

export const portfolioFiles: ProjectFile[] = [
  file(
    "package.json",
    `
{
  "name": "portfolio",
  "private": true,
  "scripts": { "dev": "next dev", "build": "next build" },
  "dependencies": { "next": "16.3.6", "react": "19.2.8" }
}
`,
  ),
  file(
    "src/app/page.tsx",
    `
import { Header } from "@/components/header";
import { posts } from "@/content/posts";

export default function HomePage() {
  return (
    <main>
      <Header />
      <h1>Hi, I build web apps.</h1>
      <ul>
        {posts
          .filter((post) => post.published)
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((post, index) => (
            <li key={index}>{post.title}</li>
          ))}
      </ul>
    </main>
  );
}
`,
  ),
  file(
    "src/app/contact/actions.ts",
    `
"use server";

export async function sendMessage(formData: FormData) {
  const email = formData.get("email");
  const message = formData.get("message");
  await fetch("https://api.mailer.dev/send", {
    method: "POST",
    body: JSON.stringify({ to: "me@example.com", email, message }),
  });
}
`,
  ),
  file(
    "src/components/header.tsx",
    `
import Link from "next/link";

export function Header() {
  return (
    <header>
      <Link href="/">Home</Link>
      <Link href="/blog">Blog</Link>
      <Link href="/contact">Contact</Link>
    </header>
  );
}
`,
  ),
  file(
    "src/content/posts.ts",
    `
export const posts = [
  { title: "Shipping side projects", date: "2026-08-01", published: true },
  { title: "Notes on caching", date: "2026-09-10", published: true },
  { title: "Draft: my setup", date: "2026-09-20", published: false },
];
`,
  ),
];

/** 1-based line number of the first line that contains `text`. */
export function lineOf(files: ProjectFile[], path: string, text: string) {
  const file = files.find((candidate) => candidate.path === path);
  const index = file?.content
    .split("\n")
    .findIndex((line) => line.includes(text));
  return index === undefined || index < 0 ? undefined : index + 1;
}
