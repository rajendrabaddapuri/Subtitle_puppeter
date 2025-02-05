const executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const puppeteer = require('puppeteer');

(async () => {
try {


let options = {
headless: false,
args: [
'--kiosk-printing',
'--ignore-certificate-errors',
'--disable-background-timer-throttling',
'--disable-backgrounding-occluded-windows',
'--disable-renderer-backgrounding',
'--disable-dev-shm-usage',
'--disable-features=site-per-process',
'--disable-infobars',
'--no-sandbox',
'--enable-extensions',
'--no-zygote',
'--disable-setuid-sandbox',
'--start-maximized',
'--disable-blink-features=AutomationControlled'
],
executablePath: executablePath,
defaultViewport: null
};
const browser = await puppeteer.launch(options);
const page = await browser.newPage();
await page.goto('https://2captcha.com/demo/normal');
const captchaelement = await page.$$eval('code.hljs', elements =>


elements.map(el => el.innerText).filter(text => text.includes('OK|'))
);

const secondMatch = captchaelement[1].substring(3);
await page.waitForSelector('input[type="text"]');
 await page.waitForNavigation({ waitUntil: "networkidle0" });
    await new Promise((resolve) => setTimeout(resolve, 2000));
await page.focus('input[type="text"]');
await page.keyboard.type(secondMatch);
await page.click('button[type="submit"]');

} catch (e) {
console.error(e);
}
})();
