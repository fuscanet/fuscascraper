const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

app.get("/scrap", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "URL faltante" });

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const resultado = await page.evaluate(() => {
      const limpiar = (texto) => texto?.replace(/\n|\t|\r/g, "").trim();
      const precio = document.querySelector(".skuBestPrice, .skuPrice, .price-tag-fraction");
      const precioPix = document.querySelector(".skuPriceWithDiscount, .price-tag-cents");
      const agotado = document.body.innerText.includes("produto esgotado") ||
                      document.body.innerText.includes("indisponível") ||
                      document.body.innerText.includes("sem estoque");

      return {
        precio: limpiar(precio?.innerText) || "No encontrado",
        precio_pix: limpiar(precioPix?.innerText) || null,
        disponibilidad: agotado ? "No disponible" : "Disponible"
      };
    });

    await browser.close();
    res.json(resultado);

  } catch (error) {
    if (browser) await browser.close();
    res.status(500).json({ error: error.toString() });
  }
});

app.get("/", (req, res) => res.send("Scraper Fuscanet activo"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
