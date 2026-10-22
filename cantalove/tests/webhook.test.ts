// Isolated route contract tests. Every database, payment provider, email and
// analytics dependency is a test double. These are NOT sandbox E2E evidence.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { paymentMatchesOrder } from "../src/lib/mercadopago";

const require = createRequire(import.meta.url);
function load(
  file: string,
  imports: Record<string, unknown>,
  fetchMock: typeof fetch = async () => {
    throw new Error("Unexpected network access in isolated test");
  },
) {
  const source = readFileSync(file, "utf8").replace(
    'import "server-only";',
    "",
  );
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports: Record<string, unknown> = {};
  new Function("require", "exports", "fetch", js)(
    (name: string) => imports[name] || require(name),
    exports,
    fetchMock,
  );
  return exports;
}
type Row = Record<string, unknown>;
type Result = { data: Row | null; error: null };
function harness(status = "approved") {
  process.env.MP_SELLER_ID = "123";
  delete process.env.MP_ENVIRONMENT;
  const state = {
    order: {
      id: "order",
      brand: "love",
      status: "preview",
      amount: 44900,
      tier: "premium",
      mp_payment_id: null,
      mp_preference_id: "pref",
      contact_email: "verified@example.test",
      delivery_email_sent_at: null,
      delivery_claimed_at: null,
      delivery_email_first_attempt_at: null,
      payment_status: "none",
    } as Row,
    payment: {
      id: 456,
      status,
      external_reference: "order",
      transaction_amount: 449,
      currency_id: "MXN",
      collector_id: 123,
      live_mode: false,
    },
    emailCount: 0,
    signature: true,
    preferenceMatches: true,
    emailFails: false,
    created: 0,
    recovered: 0,
  };
  const db = {
    from(table: string) {
      let changes: Row | null = null;
      const conditions: ((row: Row) => boolean)[] = [];
      async function finish(): Promise<Result> {
        const data =
          table === "orders"
            ? state.order
            : table === "songs"
              ? {
                  order_id: "order",
                  status: "ready",
                  full_url: "private/0.mp3",
                  track_paths: ["private/0.mp3", "private/1.mp3"],
                }
              : { order_id: "order", names: "José y María" };
        if (!conditions.every((condition) => condition(data)))
          return { data: null, error: null };
        if (changes) Object.assign(data, changes);
        return { data: { ...data }, error: null };
      }
      const query = {
        select() {
          return query;
        },
        update(value: Row) {
          changes = value;
          return query;
        },
        eq(key: string, value: unknown) {
          conditions.push((row) => row[key] === value);
          return query;
        },
        is(key: string, value: unknown) {
          conditions.push((row) => row[key] === value);
          return query;
        },
        or(filter: string) {
          if (filter.startsWith("mp_payment_id"))
            conditions.push(
              (row) => !row.mp_payment_id || row.mp_payment_id === "456",
            );
          else
            conditions.push(
              (row) =>
                !row.delivery_claimed_at ||
                Date.parse(String(row.delivery_claimed_at)) <
                  Date.now() - 5 * 60 * 1000,
            );
          return query;
        },
        not(key: string, operator: string, values: string) {
          assert.equal(operator, "in");
          conditions.push(
            (row) => !values.slice(1, -1).split(",").includes(String(row[key])),
          );
          return query;
        },
        single: finish,
        maybeSingle: finish,
        then(resolve: (result: Result) => unknown) {
          return finish().then(resolve);
        },
      };
      return query;
    },
  };
  const imports = {
    "next/server": { NextResponse: { json: Response.json } },
    "@/lib/supabase-admin": { supabaseAdmin: () => db },
    "@/lib/telemetry": {
      recordEvent: async () => {},
      recordOrderEvent: async () => {},
    },
    "@/lib/mercadopago": {
      verifyWebhookSignature: () => state.signature,
      fetchPayment: async () => state.payment,
      paymentMatchesOrder,
      paymentMatchesPreference: async () => state.preferenceMatches,
    },
    "@/lib/resend": {
      sendDeliveryEmail: async () => {
        state.emailCount++;
        if (state.emailFails) throw new Error("Mock email unavailable");
      },
    },
  };
  const route = load("src/app/api/mercadopago/webhook/route.ts", imports) as {
    POST: (request: Request) => Promise<Response>;
  };
  const call = (bodyId = "456") =>
    route.POST(
      new Request(
        "https://example.test/api/mercadopago/webhook?type=payment&data.id=456",
        {
          method: "POST",
          body: JSON.stringify({ type: "payment", data: { id: bodyId } }),
          headers: { "content-type": "application/json" },
        },
      ),
    );
  return { state, db, call };
}

test("mock webhook: approved delivery, repeated and concurrent notifications", async () => {
  const { state, call } = harness();
  const responses = await Promise.all([call(), call()]);
  assert.ok(responses.some((response) => response.status === 200));
  assert.equal(state.order.status, "delivered");
  assert.equal(state.order.payment_status, "approved");
  assert.equal(state.emailCount, 1);
  assert.equal(state.order.contact_email, "verified@example.test");
  assert.equal((await call()).status, 200);
  assert.equal(state.emailCount, 1);
});
for (const status of ["pending", "in_process", "rejected"]) {
  test(`mock webhook: ${status} never grants download or sends email`, async () => {
    const { state, call } = harness(status);
    assert.equal((await call()).status, 200);
    assert.equal(state.order.payment_status, status);
    assert.equal(state.order.status, "preview");
    assert.equal(state.order.mp_payment_id, null);
    assert.equal(state.emailCount, 0);
  });
}
test("mock webhook: invalid signature, body mismatch, price and preference mismatch denied", async () => {
  for (const invalid of ["signature", "body", "price", "preference"]) {
    const { state, call } = harness();
    if (invalid === "signature") state.signature = false;
    if (invalid === "price") state.payment.transaction_amount = 249;
    if (invalid === "preference") state.preferenceMatches = false;
    assert.equal(
      (await call(invalid === "body" ? "999" : "456")).status,
      ["price", "preference"].includes(invalid) ? 409 : 401,
    );
    assert.equal(state.emailCount, 0);
    assert.equal(state.order.status, "preview");
  }
});
test("mock webhook: refund revokes authorization; stale approved handler cannot redeliver", async () => {
  const { state, call } = harness();
  await call();
  state.payment.status = "refunded";
  assert.equal((await call()).status, 200);
  assert.equal(state.order.payment_status, "refunded");
  state.order.delivery_email_sent_at = null;
  state.payment.status = "approved"; // Deliberately stale mocked provider snapshot.
  assert.equal((await call()).status, 200);
  assert.equal(state.emailCount, 1);
  assert.equal(state.order.payment_status, "refunded");
});
test("mock webhook: refund before first approval binds payment and prevents resurrection", async () => {
  const { state, call } = harness("refunded");
  assert.equal((await call()).status, 200);
  assert.equal(state.order.payment_status, "refunded");
  assert.equal(state.order.mp_payment_id, "456");
  state.payment.status = "approved";
  assert.equal((await call()).status, 200);
  assert.equal(state.order.payment_status, "refunded");
  assert.equal(state.emailCount, 0);
});
test("mock webhook: uncertain email retries retain first attempt and quarantine after 23h", async () => {
  const { state, call } = harness();
  state.emailFails = true;
  assert.equal((await call()).status, 503);
  assert.ok(state.order.delivery_email_first_attempt_at);
  assert.equal(state.order.delivery_claimed_at, null);
  assert.equal(state.order.delivery_email_sent_at, null);
  const firstAttempt = state.order.delivery_email_first_attempt_at;
  assert.equal((await call()).status, 503);
  assert.equal(state.order.delivery_email_first_attempt_at, firstAttempt);
  const callsBeforeQuarantine = state.emailCount;
  state.order.delivery_email_first_attempt_at = new Date(
    Date.now() - 23 * 60 * 60 * 1000 - 1000,
  ).toISOString();
  state.emailFails = false;
  assert.equal((await call()).status, 503);
  assert.equal(state.emailCount, callsBeforeQuarantine);
  assert.equal(state.order.status, "paid");
});

test("mock provider: checkout recovery validates preference, seller, items, price and sandbox URL", async () => {
  process.env.MP_ACCESS_TOKEN = "isolated-test-placeholder";
  process.env.MP_SELLER_ID = "123";
  delete process.env.MP_ENVIRONMENT;
  const preference = {
    id: "pref",
    external_reference: "order",
    collector_id: 123,
    items: [{ id: "order", currency_id: "MXN", quantity: 1, unit_price: 449 }],
    sandbox_init_point: "https://sandbox.mercadopago.com.mx/checkout/pref",
  };
  let changed: Row = {};
  const provider = load("src/lib/mercadopago.ts", {}, async (input) => {
    const url = String(input);
    if (url.endsWith("/users/me"))
      return Response.json({ id: 123, tags: ["test_user"] });
    assert.equal(url, "https://api.mercadopago.com/checkout/preferences/pref");
    return Response.json({ ...preference, ...changed });
  }) as {
    recoverCheckoutPreference: (
      preference: string,
      order: string,
      cents: number,
    ) => Promise<{ checkoutUrl: string }>;
  };
  const recover = () =>
    provider.recoverCheckoutPreference("pref", "order", 44900);
  assert.equal((await recover()).checkoutUrl, preference.sandbox_init_point);
  for (const patch of [
    { external_reference: "other" },
    { collector_id: 999 },
    { items: [{ ...preference.items[0], unit_price: 249 }] },
    { sandbox_init_point: "https://evil.example/checkout" },
    { sandbox_init_point: "https://www.mercadopago.com.mx/checkout" },
    { expires: true, expiration_date_to: "2020-01-01" },
  ]) {
    changed = patch;
    await assert.rejects(recover);
  }
  await assert.rejects(() =>
    provider.recoverCheckoutPreference("creating", "order", 44900),
  );
});

test("mock checkout: interrupted navigation reuses existing preference; ambiguous creation stays blocked", async () => {
  const { state, db } = harness();
  state.order.mp_preference_id = null;
  process.env.CHECKOUT_ENABLED = "true";
  process.env.LEGAL_APPROVED = "true";
  class HttpError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  }
  const route = load("src/app/api/checkout/route.ts", {
    "next/server": { NextResponse: { json: Response.json } },
    "@/lib/supabase-admin": { supabaseAdmin: () => db },
    "@/lib/access": { authorizedOrder: async () => true },
    "@/lib/telemetry": {
      recordEvent: async () => {},
      recordOrderEvent: async () => {},
    },
    "@/lib/pricing": {
      TIERS: { premium: { amountCents: 44900, name: "Premium" } },
    },
    "@/lib/http": {
      HttpError,
      jsonBody: (request: Request) => request.json(),
      failure: (error: unknown) =>
        Response.json(
          { error: "test" },
          { status: error instanceof HttpError ? error.status : 503 },
        ),
    },
    "@/lib/mercadopago": {
      createCheckoutPreference: async () => {
        state.created++;
        return {
          preferenceId: "pref",
          checkoutUrl: "https://sandbox.mercadopago.com.mx/checkout/pref",
        };
      },
      recoverCheckoutPreference: async (
        id: string,
        order: string,
        cents: number,
      ) => {
        state.recovered++;
        assert.equal(id, "pref");
        assert.equal(order, "order");
        assert.equal(cents, 44900);
        return {
          checkoutUrl: "https://sandbox.mercadopago.com.mx/checkout/pref",
        };
      },
    },
  }) as { POST: (request: Request) => Promise<Response> };
  const call = () =>
    route.POST(
      new Request("https://example.test/api/checkout", {
        method: "POST",
        body: JSON.stringify({ orderId: "order", tier: "premium", amount: 1 }),
        headers: { "content-type": "application/json" },
      }),
    );
  assert.equal((await call()).status, 200);
  assert.equal(state.created, 1);
  assert.equal((await call()).status, 200);
  assert.equal(state.created, 1);
  assert.equal(state.recovered, 1);
  state.order.mp_preference_id = "creating";
  assert.equal((await call()).status, 409);
  assert.equal(state.created, 1);
  delete process.env.CHECKOUT_ENABLED;
  delete process.env.LEGAL_APPROVED;
});
