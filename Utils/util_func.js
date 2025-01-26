import fs from "fs";

async function takescreenshot(page) {
  const fullHeight = await page.evaluate(
    () => document.documentElement.scrollHeight
  );
  await page.setViewport({ width: 1280, height: fullHeight });
  await page.screenshot({ path: "entire_page.png", fullPage: true });
}

function writeToFile(fileName, data) {
  fs.writeFile(fileName, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error(`Failed to write file ${fileName}:`, err);
    } else {
      console.log(`File ${fileName} written successfully.`);
    }
  });
}

async function getCmdfromUser(userPrompt) {
  return new Promise((resolve) => {
    console.log(userPrompt);
    process.stdin.once("data", (data) => {
      const input = data.toString().trim();
      resolve(input);
    });
  });
}

// Use named exports for multiple functions
export { takescreenshot, writeToFile, getCmdfromUser };
