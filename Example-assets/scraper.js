const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const OUTPUT = path.resolve("./game-assets");

if (!fs.existsSync(OUTPUT)) {
    fs.mkdirSync(OUTPUT, { recursive: true });
}

function safePath(urlString) {
    const url = new URL(urlString);

    let filePath = url.pathname;

    if (filePath.endsWith("/")) {
        filePath += "index.html";
    }

    // Remove leading slash
    filePath = filePath.replace(/^\/+/, "");

    // Remove unsafe characters
    filePath = filePath.replace(/[<>:"|?*]/g, "_");

    return path.join(OUTPUT, filePath);
}

(async () => {

    const browser = await chromium.launch({
        headless: false
    });

    const context = await browser.newContext();

    context.on("response", async response => {

        const url = response.url();

        try {

            const parsed = new URL(url);

            // ONLY capture the actual game host
            if (!parsed.hostname.endsWith(".gdn.poki.com")) {
                return;
            }

            if (response.status() !== 200) {
                return;
            }

            const destination = safePath(url);

            fs.mkdirSync(path.dirname(destination), {
                recursive: true
            });

            const body = await response.body();

            fs.writeFileSync(destination, body);

            console.log(
                `[SAVED] ${response.status()} ${url}`
            );

        } catch (err) {

            console.log(
                `[ERROR] ${url}`,
                err.message
            );

        }
    });

    const page = await context.newPage();

    console.log("Opening Poki...");

    await page.goto(
        "https://poki.com/en/g/bubble-shooter-lak",
        {
            waitUntil: "domcontentloaded"
        }
    );

    console.log("Waiting for page...");

    await page.waitForTimeout(5000);

    console.log("Clicking Play...");

    // Try common play buttons
    const buttons = [
        "text=Play",
        "[aria-label='Play']",
        "button"
    ];

    for (const selector of buttons) {

        try {

            const element = page.locator(selector).first();

            if (await element.isVisible({ timeout: 1000 })) {

                await element.click();

                console.log(
                    `Clicked: ${selector}`
                );

                break;
            }

        } catch {}
    }

    console.log("Waiting for game resources...");

    await page.waitForTimeout(20000);

    console.log("");
    console.log("Scraping finished.");
    console.log("Files saved to:");
    console.log(OUTPUT);

    await browser.close();

})();
