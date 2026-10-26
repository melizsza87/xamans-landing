import assert from "node:assert/strict";
import test from "node:test";
import { createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { normalizeEmail, validateBrief } from "../src/lib/validation";
import {
  paymentMode,
  paymentMatchesOrder,
  verifyWebhookSignature,
  type VerifiedPayment,
} from "../src/lib/mercadopago";

const brief = {
  occasion: "Aniversario",
  names: "  José y María ",
  story: "Nos conocimos en Monterrey; ésta es nuestra canción.",
  genre: "Bolero",
  voice: "Dueto",
  duration: "2:00 min",
  brand: "love",
  email: "  JOSE@example.com ",
  requestId: randomUUID(),
  consent: true,
};

test("normalizes email and preserves Spanish names and stories", () => {
  assert.equal(normalizeEmail(brief.email), "jose@example.com");
  const result = validateBrief(brief);
  assert.ok(result);
  assert.equal(result.names, "José y María");
  assert.equal(result.story, brief.story);
});
for (const [name, patch] of Object.entries({
  blankName: { names: " " },
  longName: { names: "a".repeat(91) },
  shortStory: { story: "hola" },
  longStory: { story: "a".repeat(1801) },
  invalidEmail: { email: "not-an-email" },
  missingConsent: { consent: false },
  invalidGenre: { genre: "arbitrary" },
  invalidVoice: { voice: "robot" },
  invalidDuration: { duration: "forever" },
  invalidBrand: { brand: "other" },
  invalidRequest: { requestId: "1" },
  arrayOccasion: { occasion: ["Aniversario"] },
  arrayGenre: { genre: ["Bolero"] },
  arrayVoice: { voice: ["Dueto"] },
  arrayDuration: { duration: ["2:00 min"] },
})) {
  test(`rejects invalid brief: ${name}`, () =>
    assert.equal(validateBrief({ ...brief, ...patch }), null));
}
test("rejects null, scalar, malformed email values", () => {
  for (const v of [null, undefined, 3, "string", []])
    assert.equal(validateBrief(v), null);
  for (const v of [
    null,
    3,
    "a@b",
    "a @b.com",
    "a@b. com",
    "a".repeat(255) + "@b.com",
  ])
    assert.equal(normalizeEmail(v), null);
});

test("sandbox is default; live requires explicit additional opt-in", () => {
  delete process.env.MP_ENVIRONMENT;
  delete process.env.MP_ENABLE_LIVE_PAYMENTS;
  assert.equal(paymentMode(), "sandbox");
  process.env.MP_ENVIRONMENT = "live";
  assert.throws(() => paymentMode(), /disabled/);
  process.env.MP_ENABLE_LIVE_PAYMENTS = "true";
  assert.equal(paymentMode(), "live");
  delete process.env.MP_ENVIRONMENT;
  delete process.env.MP_ENABLE_LIVE_PAYMENTS;
});
test("HMAC authenticates request id, payment id and fresh timestamp", () => {
  process.env.MP_WEBHOOK_SECRET =
    "local-test-secret-never-a-provider-credential";
  const dataId = "123456",
    xRequestId = "request-123",
    ts = String(Math.floor(Date.now() / 1000));
  const signature = (timestamp: string) =>
    `ts=${timestamp},v1=${createHmac("sha256", process.env.MP_WEBHOOK_SECRET!).update(`id:${dataId};request-id:${xRequestId};ts:${timestamp};`).digest("hex")}`;
  const valid = { dataId, xRequestId, xSignature: signature(ts) };
  assert.equal(verifyWebhookSignature(valid), true);
  assert.equal(verifyWebhookSignature({ ...valid, dataId: "123457" }), false);
  assert.equal(
    verifyWebhookSignature({ ...valid, xRequestId: "altered" }),
    false,
  );
  assert.equal(
    verifyWebhookSignature({
      ...valid,
      xSignature: signature(String(Math.floor(Date.now() / 1000) - 601)),
    }),
    false,
  );
  for (const xSignature of [
    null,
    "ts=x,v1=aa",
    "ts=" + ts + ",v1=zz",
    "ts=" + ts + ",v1=" + "a".repeat(63),
  ])
    assert.equal(verifyWebhookSignature({ ...valid, xSignature }), false);
  delete process.env.MP_WEBHOOK_SECRET;
  assert.equal(verifyWebhookSignature(valid), false);
});
test("payment binding rejects underpayment, wrong currency, seller, mode and replay to another order", () => {
  process.env.MP_SELLER_ID = "42";
  delete process.env.MP_ENVIRONMENT;
  const order = { id: randomUUID(), amount: 44900, mp_payment_id: null };
  const payment: VerifiedPayment = {
    id: 123,
    status: "approved",
    external_reference: order.id,
    transaction_amount: 449,
    currency_id: "MXN",
    collector_id: 42,
    live_mode: false,
  };
  assert.equal(paymentMatchesOrder(payment, order, "123"), true);
  for (const patch of [
    { id: 999 },
    { external_reference: randomUUID() },
    { transaction_amount: 249 },
    { transaction_amount: NaN },
    { currency_id: "USD" },
    { collector_id: 43 },
    { live_mode: true },
  ])
    assert.equal(
      paymentMatchesOrder({ ...payment, ...patch }, order, "123"),
      false,
    );
  assert.equal(
    paymentMatchesOrder(payment, { ...order, amount: null }, "123"),
    false,
  );
  assert.equal(
    paymentMatchesOrder(payment, { ...order, mp_payment_id: "other" }, "123"),
    false,
  );
  assert.equal(
    paymentMatchesOrder(payment, { ...order, mp_payment_id: "123" }, "123"),
    true,
  );
});

test("Postgres schema: atomic quota, OTP replay/attempt limits, RLS and permissions", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon; create role authenticated; create role service_role; create schema storage; create table storage.buckets(id text primary key,name text,public boolean);`,
    );
    const base = (await readFile("supabase/schema.sql", "utf8")).replace(
      'create extension if not exists "pgcrypto";',
      "",
    );
    await db.exec(base);
    await db.exec(await readFile("supabase/hardening.sql", "utf8"));
    await t.test("bucket stays private even when hardened again", async () => {
      await db.exec(`update storage.buckets set public=true;`);
      await db.exec(await readFile("supabase/hardening.sql", "utf8"));
      assert.equal(
        (
          await db.query<{ public: boolean }>(
            `select public from storage.buckets where id='tracks'`,
          )
        ).rows[0].public,
        false,
      );
    });
    await t.test(
      "OTP is single-use, expires and locks after five wrong attempts",
      async () => {
        await db.exec(
          `insert into email_challenges values('otp@example.com','right',now()+interval '10 minutes',0);`,
        );
        for (let i = 0; i < 5; i++)
          assert.equal(
            (
              await db.query<{ ok: boolean }>(
                `select verify_email_code('otp@example.com','wrong') as ok`,
              )
            ).rows[0].ok,
            false,
          );
        assert.equal(
          (
            await db.query<{ ok: boolean }>(
              `select verify_email_code('otp@example.com','right') as ok`,
            )
          ).rows[0].ok,
          false,
        );
        await db.exec(
          `update email_challenges set attempts=0,expires_at=now()-interval '1 second';`,
        );
        assert.equal(
          (
            await db.query<{ ok: boolean }>(
              `select verify_email_code('otp@example.com','right') as ok`,
            )
          ).rows[0].ok,
          false,
        );
        await db.exec(
          `update email_challenges set expires_at=now()+interval '10 minutes';`,
        );
        assert.equal(
          (
            await db.query<{ ok: boolean }>(
              `select verify_email_code('otp@example.com','right') as ok`,
            )
          ).rows[0].ok,
          true,
        );
        assert.equal(
          (
            await db.query<{ ok: boolean }>(
              `select verify_email_code('otp@example.com','right') as ok`,
            )
          ).rows[0].ok,
          false,
        );
      },
    );
    await t.test(
      "rate counter rejects hits beyond limit and resets only after expiry",
      async () => {
        for (const expected of [true, true, false, false])
          assert.equal(
            (
              await db.query<{ ok: boolean }>(
                `select consume_rate_limit('local-test',2,60) as ok`,
              )
            ).rows[0].ok,
            expected,
          );
        await db.exec(
          `update rate_limits set expires_at=now()-interval '1 second' where key='local-test'`,
        );
        assert.equal(
          (
            await db.query<{ ok: boolean }>(
              `select consume_rate_limit('local-test',2,60) as ok`,
            )
          ).rows[0].ok,
          true,
        );
      },
    );
    await t.test(
      "same email/new request key returns same free order and song",
      async () => {
        const input = JSON.stringify(brief);
        const reserve = async (email: string) =>
          (
            await db.query<{ result: { id: string; created: boolean } }>(
              `select reserve_free_order($1,$2,$3::jsonb) as result`,
              [email, randomUUID(), input],
            )
          ).rows[0].result;
        const first = await reserve("unique@example.com");
        assert.equal(first.created, true);
        const second = await reserve("unique@example.com");
        assert.equal(second.created, false);
        assert.equal(second.id, first.id);
        const count = (
          await db.query<{ n: number }>(
            `select count(*)::int n from songs where order_id=$1`,
            [first.id],
          )
        ).rows[0].n;
        assert.equal(count, 1);
        const saved = (
          await db.query<{ names: string; story: string }>(
            `select names,story from personalizations where order_id=$1`,
            [first.id],
          )
        ).rows[0];
        assert.equal(saved.names, brief.names);
        assert.equal(saved.story, brief.story);
      },
    );
    await t.test(
      "global 50-per-day cap blocks new order without partial rows",
      async () => {
        await db.exec(
          `update rate_limits set hits=50 where key='generation-global-day'`,
        );
        const result = (
          await db.query<{ result: { limited: boolean } }>(
            `select reserve_free_order($1,$2,$3::jsonb) result`,
            ["cap@example.com", randomUUID(), JSON.stringify(brief)],
          )
        ).rows[0].result;
        assert.equal(result.limited, true);
        assert.equal(
          (
            await db.query<{ n: number }>(
              `select count(*)::int n from orders where contact_email='cap@example.com'`,
            )
          ).rows[0].n,
          0,
        );
      },
    );
    await t.test(
      "public roles cannot invoke privileged RPC or read protected tables",
      async () => {
        for (const role of ["anon", "authenticated"]) {
          assert.equal(
            (
              await db.query<{ ok: boolean }>(
                `select has_function_privilege($1,'reserve_free_order(text,uuid,jsonb)','EXECUTE') ok`,
                [role],
              )
            ).rows[0].ok,
            false,
          );
          assert.equal(
            (
              await db.query<{ ok: boolean }>(
                `select has_table_privilege($1,'customer_sessions','SELECT') ok`,
                [role],
              )
            ).rows[0].ok,
            false,
          );
        }
        const rows = await db.query<{
          tablename: string;
          rowsecurity: boolean;
        }>(
          `select tablename,rowsecurity from pg_tables where schemaname='public'`,
        );
        for (const row of rows.rows)
          assert.equal(row.rowsecurity, true, row.tablename);
      },
    );
  } finally {
    await db.close();
  }
});
