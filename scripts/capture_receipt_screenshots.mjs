import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const targetDir = "C:\\Users\\manda\\.gemini\\antigravity\\brain\\7d943c45-aa36-4c36-8f3c-3bf5d5595467\\screenshots";
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

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
  throw new Error("Could not connect to Chrome CDP within timeout");
}

async function run() {
  const profileDir = path.join(process.env.LOCALAPPDATA || "C:\\Temp", "chrome_cdp_profile_payment");
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

    // Set viewport
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const targets = [
      {
        url: "http://localhost:3000/dashboard/bookings/b-01",
        filename: "dashboard_booking_with_payment.png",
      },
      {
        url: "http://localhost:3000/dashboard/bookings/b-01/receipt",
        filename: "tax_receipt_editorial_view.png",
      },
      {
        url: "http://localhost:3000/book",
        filename: "book_page_with_razorpay.png",
      },
    ];

    for (const target of targets) {
      console.log(`Navigating to ${target.url}...`);
      await client.send("Page.navigate", { url: target.url });
      await new Promise((r) => setTimeout(r, 2000));

      const screenshot = await client.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });

      const buffer = Buffer.from(screenshot.data, "base64");
      const outPath = path.join(targetDir, target.filename);
      fs.writeFileSync(outPath, buffer);
      console.log(`Saved screenshot: ${outPath} (${buffer.length} bytes)`);
    }

    client.close();
    browserClient.close();
  } finally {
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
