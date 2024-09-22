import puppeteer from "puppeteer";

export const POST = async (request: Request) => {
  try {
    const html = await request.text();

    if (!html) {
      return new Response("Missing HTML", { status: 400 });
    }

    const browser = await puppeteer.launch({
      // headless: 'new', // Uncomment for production
      args: ["--no-sandbox"], // Might be needed in some server environments
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" }); // Wait until content loads

    await page.setViewport({ width: 1200, height: 800 });
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    await browser.close();

    return new Response(screenshotBuffer, {
      status: 200,
      headers: { "Content-Type": "image/png" }, // Or 'image/jpeg'
    });
  } catch (error) {
    console.error("Error generating screenshot:", error);
    // @ts-ignore
    return new Response(`Screenshot generation error: ${error.message}`, {
      status: 500,
    });
  }
};
