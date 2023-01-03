import puppeteer from "puppeteer";

const uri = "https://translate.google.com/";

export const langs = [
  "af",
  "sq",
  "am",
  "ar",
  "hy",
  "az",
  "eu",
  "be",
  "bn",
  "bs",
  "bg",
  "ca",
  "ceb",
  "ny",
  "zh-CN",
  "zh-TW",
  "co",
  "hr",
  "cs",
  "da",
  "nl",
  "en",
  "eo",
  "et",
  "fi",
  "fr",
  "fy",
  "gl",
  "ka",
  "de",
  "el",
  "gu",
  "ht",
  "ha",
  "haw",
  "iw",
  "he",
  "hi",
  "hmn",
  "hu",
  "is",
  "ig",
  "id",
  "ga",
  "it",
  "ja",
  "jw",
  "kn",
  "kk",
  "km",
  "rw",
  "ko",
  "ku",
  "ky",
  "lo",
  "la",
  "lv",
  "lt",
  "lb",
  "mk",
  "mg",
  "ms",
  "ml",
  "mt",
  "mi",
  "mr",
  "mn",
  "my",
  "ne",
  "no",
  "or",
  "ps",
  "fa",
  "pl",
  "pt",
  "pa",
  "ro",
  "ru",
  "sm",
  "gd",
  "sr",
  "st",
  "sn",
  "sd",
  "si",
  "sk",
  "sl",
  "so",
  "es",
  "su",
  "sw",
  "sv",
  "tl",
  "tg",
  "ta",
  "te",
  "th",
  "tr",
  "uk",
  "ur",
  "uz",
  "vi",
  "cy",
  "xh",
  "yi",
  "yo",
  "zu",
];

export const translate = async (
  text: string,
  options?: {
    from?: string;
    to?: string;
  }
) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const from = options?.from || "en";
  const to = options?.to || "es";

  const urlText = text
    .replace(/ /g, "+")
    .replace(/,/g, "%2C")
    .replace(/:/g, "%3A")
    .replace(/;/g, "%3B")
    .replace(/!/g, "%21")
    .replace(/¡/g, "%A1")
    .replace(/'/g, "%27");

  const url = `${uri}?sl=${from}&tl=${to}&text=${urlText}&op=translate`;
  await page.goto(url, { waitUntil: "networkidle2" });
  const result = await page.evaluate(() => {
    const element = document.querySelector("span.ryNqvb");
    return element?.textContent;
  });
  await browser.close();

  return result?.toString().toLowerCase() || "💀";
};
