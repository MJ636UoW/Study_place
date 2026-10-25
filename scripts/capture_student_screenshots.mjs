import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const targetDir = "C:\\Users\\manda\\.gemini\\antigravity\\brain\\7d943c45-aa36-4c36-8f3c-3bf5d5595467";

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
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("CDP debugger did not become ready in time.");
}

async function main() {
  const profileDir = path.join(process.env.LOCALAPPDATA || "C:\\Temp", "chrome_cdp_profile_student");
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
    const browserClient = new CDPClient(browserWs);
    await browserClient.connect();

    const { targetId } = await browserClient.send("Target.createTarget", { url: "about:blank" });
    const tabWs = `ws://127.0.0.1:9222/devtools/page/${targetId}`;

    const client = new CDPClient(tabWs);
    await client.connect();

    await client.send("Page.enable");
    await client.send("DOM.enable");
    await client.send("Network.enable");

    const pages = [
      { url: "http://localhost:3000/dashboard", filename: "dashboard_student_actions.png" },
      { url: "http://localhost:3000/reviews", filename: "reviews_member_ratings.png" },
      { url: "http://localhost:3000/contact", filename: "contact_honest_form.png" },
      { url: "http://localhost:3000/conduct", filename: "conduct_house_rules.png" },
    ];

    for (const p of pages) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: 1440,
        height: 1000,
        deviceScaleFactor: 1,
        mobile: false,
      });

      console.log(`Navigating to ${p.url}...`);
      await client.send("Page.navigate", { url: p.url });
      await new Promise((r) => setTimeout(r, 2000));

      const screenshot = await client.send("Page.captureScreenshot", { format: "png" });
      const destPath = path.join(targetDir, p.filename);
      fs.writeFileSync(destPath, Buffer.from(screenshot.data, "base64"));
      console.log(`Saved ${p.filename}`);
    }

    client.close();
    browserClient.close();
  } finally {
    chromeProcess.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
