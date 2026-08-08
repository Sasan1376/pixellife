const express = require("express");
const router = express.Router();

const Product = require("../models/Product");

router.get("/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
    });

    if (!product) {
      return res.status(404).send("محصول پیدا نشد");
    }

    res.send(`
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">

    <head>
      <meta charset="UTF-8">
      <title>${product.name}</title>

      <meta name="description" content="${product.description}">

      <script type="application/ld+json">
      {
        "@context":"https://schema.org/",
        "@type":"Product",
        "name":"${product.name}",
        "brand":{
          "@type":"Brand",
          "name":"${product.brand}"
        },
        "offers":{
          "@type":"Offer",
          "price":"${product.price}",
          "priceCurrency":"IRR",
          "availability":"https://schema.org/InStock"
        }
      }
      </script>

    </head>


    <body>

      <h1>${product.name}</h1>

      <h3>برند: ${product.brand}</h3>

      <h2>
      قیمت: ${product.price.toLocaleString()} تومان
      </h2>


      <p>
      ${product.description}
      </p>


      <h3>مشخصات:</h3>

      <p>
      ${JSON.stringify(product.specifications)}
      </p>


    </body>

    </html>
    `);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
