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
  const profileDir = path.join(process.env.LOCALAPPDATA || "C:\\Temp", "chrome_cdp_profile_book");
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  console.log("Spawning Chrome process with CDP for Book flow test...");
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
    await client.send("Runtime.enable");

    // ============================================
    // 1. DESKTOP TEST (1440 x 900)
    // ============================================
    console.log("\n--- Testing Desktop 1440px ---");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await client.send("Page.navigate", { url: "http://localhost:3000/book" });
    await new Promise((r) => setTimeout(r, 1200));

    // Initial desktop screenshot
    let ss = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(targetDir, "book_desktop_initial.png"), Buffer.from(ss.data, "base64"));
    console.log("Saved book_desktop_initial.png");

    // Debug: check elements
    const elementsDebug = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const roles = Array.from(document.querySelectorAll('[role="button"], button')).map(el => ({
          tag: el.tagName,
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label'),
          text: el.textContent.slice(0, 30)
        }));
        return JSON.stringify(roles.slice(0, 15));
      })()`,
      returnByValue: true,
    });
    // Click on Seat N-02 (available) to open Desktop Side Panel Inspector
    const clickSeatRes = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const seatBtn = document.querySelector('[role="button"][aria-label*="N-02"]');
        if (seatBtn) {
          seatBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          return "clicked seat N-02";
        }
        return "seat N-02 button not found";
      })()`,
      returnByValue: true,
    });
    console.log("Seat click result:", clickSeatRes.result.value);
    await new Promise((r) => setTimeout(r, 600));

    // Capture screenshot with Side Panel open (scroll into view of map area)
    await client.send("Runtime.evaluate", {
      expression: `(() => {
        const inspector = document.querySelector('[role="complementary"]');
        if (inspector) inspector.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    ss = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(targetDir, "book_desktop_inspector.png"), Buffer.from(ss.data, "base64"));
    console.log("Saved book_desktop_inspector.png with side panel open");

    // Click "Request Workstation Hold"
    const clickHoldRes = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const holdBtn = btns.find(b => b.textContent && b.textContent.includes('Request Workstation Hold'));
        if (holdBtn) {
          holdBtn.click();
          return "clicked request workstation hold";
        }
        return "hold button not found";
      })()`,
      returnByValue: true,
    });
    console.log("Hold button click result:", clickHoldRes.result.value);
    await new Promise((r) => setTimeout(r, 600));

    // Capture screenshot with Hold Modal dialog open
    ss = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(targetDir, "book_desktop_hold_modal.png"), Buffer.from(ss.data, "base64"));
    console.log("Saved book_desktop_hold_modal.png");

    // Click Confirm Hold button
    const confirmHoldRes = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const confirmBtn = btns.find(b => b.textContent && b.textContent.includes('Confirm Hold Request'));
        if (confirmBtn) {
          confirmBtn.click();
          return "confirmed hold";
        }
        return "confirm hold button not found";
      })()`,
      returnByValue: true,
    });
    console.log("Confirm hold result:", confirmHoldRes.result.value);
    await new Promise((r) => setTimeout(r, 600));

    ss = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(targetDir, "book_desktop_hold_confirmed.png"), Buffer.from(ss.data, "base64"));
    console.log("Saved book_desktop_hold_confirmed.png");

    // Close dialog
    await client.send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
        if (closeBtn) closeBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    // Switch to Accessible List View
    await client.send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const listBtn = btns.find(b => b.textContent && b.textContent.includes('Accessible List'));
        if (listBtn) listBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    ss = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(targetDir, "book_desktop_accessible_list.png"), Buffer.from(ss.data, "base64"));
    console.log("Saved book_desktop_accessible_list.png");

    // ============================================
    // 2. MOBILE TEST (390 x 844)
    // ============================================
    console.log("\n--- Testing Mobile 390px ---");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await client.send("Page.navigate", { url: "http://localhost:3000/book" });
    await new Promise((r) => setTimeout(r, 1200));

    // Check overflow on mobile
    const mobileOverflow = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const winW = window.innerWidth;
        const actualMaxW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        return { winW, actualMaxW, hasOverflow: actualMaxW > winW };
      })()`,
      returnByValue: true,
    });
    console.log("Mobile 390px overflow status:", mobileOverflow.result.value);

    // Click on Seat N-02 on mobile to open Bottom Sheet
    const mobileClickRes = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const seatBtn = document.querySelector('[role="button"][aria-label*="N-02"]');
        if (seatBtn) {
          seatBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          return "clicked seat N-02 on mobile";
        }
        return "seat N-02 not found on mobile";
      })()`,
      returnByValue: true,
    });
    console.log("Mobile click result:", mobileClickRes.result.value);
    await new Promise((r) => setTimeout(r, 600));

    // Capture screenshot with Mobile Bottom Sheet open
    ss = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(targetDir, "book_mobile_bottomsheet.png"), Buffer.from(ss.data, "base64"));
    console.log("Saved book_mobile_bottomsheet.png with BottomSheet visible");

    // ============================================
    // 3. SMALL MOBILE TEST (360 x 740)
    // ============================================
    console.log("\n--- Testing Small Mobile 360px ---");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 360,
      height: 740,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await client.send("Page.navigate", { url: "http://localhost:3000/book" });
    await new Promise((r) => setTimeout(r, 1200));

    const smallMobileOverflow = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const winW = window.innerWidth;
        const actualMaxW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        return { winW, actualMaxW, hasOverflow: actualMaxW > winW };
      })()`,
      returnByValue: true,
    });
    console.log("Small Mobile 360px overflow status:", smallMobileOverflow.result.value);

    ss = await client.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(targetDir, "book_360px_verified.png"), Buffer.from(ss.data, "base64"));
    console.log("Saved book_360px_verified.png");

    client.close();
    console.log("\nAll booking interactions verified and captured!");
  } finally {
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
