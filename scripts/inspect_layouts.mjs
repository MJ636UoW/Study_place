import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const viewports = [
  { name: "mobile_360", width: 360, height: 740 },
  { name: "mobile_390", width: 390, height: 844 },
  { name: "tablet_768", width: 768, height: 1024 },
  { name: "desktop_1440", width: 1440, height: 900 },
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

const screenshotsDir = "C:\\Users\\manda\\.gemini\\antigravity\\brain\\7d943c45-aa36-4c36-8f3c-3bf5d5595467\\screenshots";
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const results = [];

  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
    });

    for (const route of routes) {
      const url = `http://localhost:3000${route}`;
      await page.goto(url, { waitUntil: "networkidle" });

      // Measure layout overflow
      const overflowMetrics = await page.evaluate(() => {
        const root = document.documentElement;
        const body = document.body;
        const windowWidth = window.innerWidth;
        const scrollWidth = Math.max(root.scrollWidth, body.scrollWidth);
        const hasHorizontalOverflow = scrollWidth > windowWidth;

        // Find any offending element causing overflow
        const overflowingElements = [];
        const allElements = document.querySelectorAll("*");
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > windowWidth + 1) {
            overflowingElements.push({
              tag: el.tagName,
              id: el.id,
              className: el.className ? String(el.className).slice(0, 50) : "",
              right: rect.right,
              width: rect.width,
            });
          }
        }

        return {
          windowWidth,
          scrollWidth,
          hasHorizontalOverflow,
          overflowDiff: scrollWidth - windowWidth,
          topOverflowing: overflowingElements.slice(0, 3),
        };
      });

      // Capture screenshot for key pages
      const safeName = route === "/" ? "home" : route.replace(/\//g, "_").replace(/^_/, "");
      const screenshotFile = path.join(screenshotsDir, `${safeName}_${vp.name}.png`);
      await page.screenshot({ path: screenshotFile, fullPage: false });

      results.push({
        viewport: vp.name,
        width: vp.width,
        route,
        ...overflowMetrics,
      });
    }

    await page.close();
  }

  await browser.close();

  console.log("INSPECTION_RESULTS_JSON:" + JSON.stringify(results, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
