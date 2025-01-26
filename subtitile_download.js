import puppeteer from "puppeteer";
import fs from "fs";
import path, { resolve } from "path";
import { fileURLToPath } from "url";
import { writeToFile } from "./Utils/util_func.js";
import { setTimeout } from "timers/promises";

async function downloadsub(url, searchquery) {
  // Define download path
  const downloadPath = path.resolve("./downloads");

  // Ensure the directory exists
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disable-popup-blocking"], // Disable popup blocking
  });

  const page = await browser.newPage();
  const fullHeight = await page.evaluate(
    () => document.documentElement.scrollHeight
  );
  await page.setViewport({ width: 1280, height: fullHeight });
  try {
    // Set download behavior
    const client = await page.createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath, // Set download directory
    });

    await page.goto(url);

    await page.focus("input[name=search]");
    await page.keyboard.type(searchquery);

    await page.keyboard.press("Enter");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    const movienames = await page.$$eval("a", (elements) => {
      return elements
        .filter((e) => e.href && e.textContent.trim())
        .map((e) => {
          return { url: e.href, text: e.textContent.trim() };
        });
    });

    const entries = Object.entries(movienames);
    //console.log(entries);
    const slicedEntries = entries.slice(10);

    // Convert the sliced array back to an object
    const newmovienames = Object.fromEntries(slicedEntries);
    const firstKey = Object.keys(newmovienames)[2];

    // Access the `url` of the first object
    const firstUrl = newmovienames[firstKey].url;
    console.log(firstUrl);

    writeToFile("movienames.json", newmovienames);

    process.stdout.write(JSON.stringify(newmovienames, null, 2));

    await page.goto(firstUrl);

    await page.waitForSelector("#download_en");

    // Listen for new tabs (ads or popups)
    const [newPage] = await Promise.all([
      browser
        .waitForTarget((target) => target.opener() === page.target())
        .then((target) => target.page()),
      page.click("#download_en"), // Trigger the click
    ]);

    if (newPage) {
      console.log("Ad or new tab detected. Closing it...");
      await newPage.close(); // Close the ad tab
      console.log("Retrying download click...");
      await page.click("#download_en"); // Retry the download
      await page.waitForNetworkIdle();
      await page.goto(url);
      await browser.close();
    }

    console.log("Download initiated. Check the downloads folder.");
    setTimeout(() => {
      browser.close();
    }, 3000);
  } catch (error) {
    console.error("Navigation failed:", error);
    await browser.close();
  }
}
const args = process.argv.slice(2); // Get command line arguments
if (args.length !== 2) {
  console.error("Usage: node script.js <url> <searchquery>");
  process.exit(1);
}
const [url, searchquery] = args; // Extract URL and search query from arguments

// Call the function with command-line arguments
downloadsub(url, searchquery);
// node .\subtitile_download.js "https://www.subtitlecat.com/", "Harry potter"
