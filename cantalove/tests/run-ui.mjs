// Self-contained runner: server and browser share the same network namespace.
import next from "next";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
const host = "127.0.0.1",
  port = 3106;
const dev = process.env.PW_DEV === "true";
const app = next({
  dev,
  ...(dev ? { webpack: true } : {}),
  hostname: host,
  port,
});
await app.prepare();
const server = createServer(app.getRequestHandler());
await new Promise((resolve) => server.listen(port, host, resolve));
const runner = spawn(
  process.execPath,
  [
    "node_modules/@playwright/test/cli.js",
    "test",
    "--config",
    "tests/playwright.config.ts",
  ],
  {
    stdio: "inherit",
    env: { ...process.env, PW_BASE_URL: `http://${host}:${port}` },
  },
);
const exitCode = await new Promise((resolve) => runner.on("exit", resolve));
await new Promise((resolve) => server.close(resolve));
await app.close();
process.exit(exitCode ?? 1);
