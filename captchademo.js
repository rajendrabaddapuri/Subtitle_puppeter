import puppeteer from "puppeteer";
import { createWorker } from "tesseract.js";

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

    const worker = await createWorker();
    // FOR BETTER RECOGNITION
    await worker.load("eng");
    await worker.reinitialize("eng");
    await worker.setParameters({
      tessedit_char_whitelist:
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      preserve_interword_spaces: "1",
      tessjs_create_pdf: "0",
      tessjs_create_hocr: "0",
      tessjs_create_tsv: "0",
    });

    const { data } = await worker.recognize("captcha.png");
    console.log("Result:", data.text);
    await worker.terminate();

    await page.waitForSelector('input[type="text"]');

    await page.focus('input[type="text"]');
    await page.keyboard.type(data.text);
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
