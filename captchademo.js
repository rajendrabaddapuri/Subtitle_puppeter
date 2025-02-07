import puppeteer from "puppeteer";
import { createWorker } from "tesseract.js";

process.env.TESSDATA_PREFIX =
  "./node_modules/tesseract.js-core/tesseract-core/";

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    await page.goto("https://2captcha.com/demo/normal", {
      waitUntil: "networkidle0",
    });

    await page.waitForSelector("img._captchaImage_rrn3u_9");

    const captchaImageUrl = await page.$eval(
      "img._captchaImage_rrn3u_9",
      (img) => img.src
    );

    const screenshotPage = await browser.newPage();
    await screenshotPage.goto(captchaImageUrl);

    await screenshotPage.screenshot({
      path: "captcha.png",
    });
    await screenshotPage.close();

    // Initialize with just the essential parameters
    const worker = await createWorker();
    await worker.reinitialize("eng");

    await worker.setParameters({
      tessedit_char_whitelist:
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      preserve_interword_spaces: "1",
    });

    const extractedTexts = new Set();
    let attempts = 0;
    const maxAttempts = 10;

    while (extractedTexts.size < 10 && attempts < maxAttempts) {
      const { data } = await worker.recognize("captcha.png");
      const recognizedText = data.text.trim();
      console.log(` results ${recognizedText}`);
      if (recognizedText && !extractedTexts.has(recognizedText)) {
        extractedTexts.add(recognizedText);
        console.log(`Unique result ${extractedTexts.size}:`, recognizedText);
      }
      attempts++;
    }

    const uniqueResults = Array.from(extractedTexts);
    console.log(
      `Found ${uniqueResults.length} unique results in ${attempts} attempts`
    );

    // Add error handling for empty results
    const bestResult = uniqueResults[0] || "";
    console.log("Selected result:", bestResult);

    await worker.terminate();

    // Add check for empty result
    if (!bestResult) {
      console.log("Failed to recognize CAPTCHA");
      await browser.close();
      return;
    }

    await page.waitForSelector('input[type="text"]');
    await page.focus('input[type="text"]');
    await page.keyboard.type(bestResult);
    await page.click('button[type="submit"]');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await browser.close();
  } catch (e) {
    console.error(e);
  } finally {
    if (typeof browser !== "undefined") {
      await browser.close();
    }
  }
})();
