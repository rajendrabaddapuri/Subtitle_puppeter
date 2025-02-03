import puppeteer from "puppeteer";
import { writeToFile } from "./Utils/util_func.js";

try {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ["--disable-popup-blocking"],
  });

  const page = await browser.newPage();

  await page.goto("https://realpython.github.io/fake-jobs/");

  const jobListings = await page.evaluate(() => {
    try {
      const titles = Array.from(document.querySelectorAll(".title.is-5")).map(
        (el) => el.innerText.trim()
      );
      const companies = Array.from(
        document.querySelectorAll(".subtitle.is-6.company")
      ).map((el) => el.innerText.trim());
      const locations = Array.from(document.querySelectorAll(".location")).map(
        (el) => el.innerText.trim()
      );
      const times = Array.from(document.querySelectorAll("time")).map((el) =>
        el.innerText.trim()
      );

      const applyUrls = Array.from(
        document.querySelectorAll(".card-footer-item")
      ).map((item) => item.href);

      return titles.map((title, index) => ({
        title: title,
        company: companies[index],
        location: locations[index],
        postedTime: times[index],
        applyUrl: applyUrls[index],
      }));
    } catch (error) {
      console.error("Error during page evaluation:", error);
      return [];
    }
  });

  async function scrapeJobListingsParallel(array, chunkSize) {
    const allResults = [];
    try {
      for (let i = 0; i < array.length; i += chunkSize) {
        console.log(
          `Processing jobs ${i + 1} to ${Math.min(i + chunkSize, array.length)}`
        );

        const chunk = array.slice(i, i + chunkSize);
        const arrayofpromises = chunk.map(async (item) => {
          let page;
          try {
            page = await browser.newPage();
            if (item.applyUrl.includes("realpython.com")) {
              console.log("Skipping realpython.com page");
              return {
                ...item,
                jobDescription: "Description not available",
              };
            }
            await page.goto(item.applyUrl);

            const jobDescription = await page.evaluate(
              () => document.querySelector(".content p").innerText
            );
            return {
              ...item,
              jobDescription,
            };
          } catch (error) {
            console.error(`Error processing job listing: ${item.title}`, error);
            return {
              ...item,
              jobDescription: "Error fetching description",
            };
          } finally {
            if (page) {
              await page.close();
            }
          }
        });

        const results = await Promise.all(arrayofpromises);
        allResults.push(...results);
        console.log(`Completed processing ${results.length} jobs`);
        if (i + chunkSize < array.length) {
          console.log("Waiting before processing next chunk...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      console.error("Error in scraping job listings:", error);
    }
    return allResults;
  }

  const endResults = await scrapeJobListingsParallel(jobListings, 10);
  writeToFile("job_listings.json", endResults);

  await browser.close();
} catch (error) {
  console.error("Fatal error:", error);
} finally {
  if (typeof browser !== "undefined") {
    await browser.close();
  }
}
