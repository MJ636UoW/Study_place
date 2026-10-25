import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const targetDir = "C:\\Users\\manda\\.gemini\\antigravity\\brain\\7d943c45-aa36-4c36-8f3c-3bf5d5595467\\screenshots";
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const viewports = [
  { name: "360px", width: 360, height: 740, mobile: true },
  { name: "390px", width: 390, height: 844, mobile: true },
  { name: "768px", width: 768, height: 1024, mobile: false },
  { name: "1440px", width: 1440, height: 900, mobile: false },
];

const routes = [
  "/",
  "/plans",
  "/book",
  "/login",
  "/dashboard",
  "/dashboard/bookings/BK-8021",
  "/admin",
  "/contact",
  "/privacy",
  "/terms",
  "/refund-policy",
];

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message));
        } else {
          resolve(msg.result);
        }
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function waitForCdp(port = 9222, retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      }
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Could not connect to Chrome CDP within timeout");
}

async function run() {
  const profileDir = path.join(process.env.LOCALAPPDATA || "C:\\Temp", "chrome_cdp_profile_runner");
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  console.log("Spawning Chrome process with CDP...");
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chromeProcess = spawn(
    chromePath,
    [
      "--headless=new",
      "--remote-debugging-port=9222",
      "--remote-allow-origins=*",
      `--user-data-dir=${profileDir}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
    ],
    { stdio: "ignore" }
  );

  try {
    const browserWs = await waitForCdp(9222);
    console.log("Chrome CDP ready at:", browserWs);

    const browserClient = new CDPClient(browserWs);
    await browserClient.connect();

    const { targetId } = await browserClient.send("Target.createTarget", { url: "about:blank" });
    const tabWs = `ws://127.0.0.1:9222/devtools/page/${targetId}`;

    const client = new CDPClient(tabWs);
    await client.connect();

    await client.send("Page.enable");
    await client.send("DOM.enable");

    const results = [];

    for (const vp of viewports) {
      console.log(`\n================ Viewport Inspection: ${vp.name} (${vp.width}x${vp.height}) ================`);

      await client.send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile,
      });

      for (const route of routes) {
        const url = `http://localhost:3000${route}`;
        await client.send("Page.navigate", { url });
        await new Promise((r) => setTimeout(r, 600));

        // Evaluate overflow in the document
        const evalRes = await client.send("Runtime.evaluate", {
          expression: `(() => {
            const winW = window.innerWidth;
            const rootW = document.documentElement.scrollWidth;
            const bodyW = document.body ? document.body.scrollWidth : 0;
            const actualMaxW = Math.max(rootW, bodyW);
            const hasOverflow = actualMaxW > winW;
            
            const overflowing = [];
            const all = document.querySelectorAll('*');
            for (const el of all) {
              const r = el.getBoundingClientRect();
              if (r.right > winW + 1) {
                overflowing.push({
                  tag: el.tagName,
                  className: String(el.className || '').slice(0, 40),
                  right: Math.round(r.right),
                  width: Math.round(r.width)
                });
              }
            }
            
            return JSON.stringify({
              winW,
              actualMaxW,
              hasOverflow,
              diff: actualMaxW - winW,
              offendersCount: overflowing.length,
              offenders: overflowing.slice(0, 3)
            });
          })()`,
          returnByValue: true,
        });

        const metrics = JSON.parse(evalRes.result.value);

        // Capture screenshot for key presentation routes
        const captureRoutes = ["/", "/plans", "/book", "/dashboard"];
        if (captureRoutes.includes(route)) {
          const ss = await client.send("Page.captureScreenshot", {
            format: "png",
          });
          const safeName = route === "/" ? "home" : route.replace(/\//g, "_").replace(/^_/, "");
          const filePath = path.join(targetDir, `${safeName}_${vp.name}.png`);
          fs.writeFileSync(filePath, Buffer.from(ss.data, "base64"));
        }

        const statusStr = metrics.hasOverflow ? `FAIL (Overflow: +${metrics.diff}px)` : "PASS (No overflow)";
        console.log(`[${vp.name}] ${route.padEnd(28)} => ${statusStr}`);
        if (metrics.hasOverflow) {
          console.log(`   Offenders: ${JSON.stringify(metrics.offenders)}`);
        }

        results.push({
          viewport: vp.name,
          width: vp.width,
          route,
          ...metrics,
        });
      }
    }

    client.close();

    const total = results.length;
    const failures = results.filter((r) => r.hasOverflow);
    console.log(`\n================ SUMMARY ================`);
    console.log(`Total checks: ${total}`);
    console.log(`Passed checks: ${total - failures.length}`);
    console.log(`Failed checks: ${failures.length}`);

    if (failures.length > 0) {
      console.log("Failures:", JSON.stringify(failures, null, 2));
      process.exit(1);
    } else {
      console.log("SUCCESS: All 44 route/viewport combinations verified with ZERO horizontal overflow!");
    }
  } finally {
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
