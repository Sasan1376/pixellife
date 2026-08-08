const express = require("express");
const router = express.Router();

const Product = require("../models/Product");

// تبدیل متن به HTML امن
function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// صفحه محصول با Slug
router.get("/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
    });

    // محصول پیدا نشد
    if (!product) {
      return res.status(404).send(`
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex, follow">
  <title>محصول پیدا نشد | PixelLife</title>
</head>
<body>
  <h1>محصول پیدا نشد</h1>
  <a href="/">بازگشت به فروشگاه</a>
</body>
</html>
      `);
    }

    const name = product.name || "محصول";
    const brand = product.brand || "نامشخص";
    const description =
      product.description || `خرید ${name} از فروشگاه PixelLife`;

    const price = Number(product.price) || 0;

    const canonical = `https://pixellife.ir/product/${encodeURIComponent(product.slug)}`;

    // تصاویر
    const images = Array.isArray(product.images)
      ? product.images.filter(Boolean)
      : [];

    const imageUrls = images.map((image) => {
      if (image.startsWith("http")) {
        return image;
      }

      return `https://pixellife.ir${image.startsWith("/") ? "" : "/"}${image}`;
    });

    // موجودی
    const inStock = Number(product.stock) > 0 && product.availability !== "out";

    const availability = inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

    // Product Schema
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: name,
      description: description,
      sku: String(product._id),
      url: canonical,
      brand: {
        "@type": "Brand",
        name: brand,
      },
      image: imageUrls,
      offers: {
        "@type": "Offer",
        url: canonical,
        priceCurrency: "IRR",
        price: price,
        availability: availability,
        itemCondition: "https://schema.org/NewCondition",
      },
    };

    // تصاویر صفحه
    const imagesHtml = imageUrls
      .map(
        (image) => `
        <img
          src="${escapeHtml(image)}"
          alt="${escapeHtml(name)}"
          loading="lazy"
          style="max-width:300px;margin:10px;border-radius:10px;"
        >
      `,
      )
      .join("");

    // مشخصات
    let specificationsHtml = "";

    if (product.specifications && typeof product.specifications === "object") {
      specificationsHtml = Object.entries(product.specifications)
        .map(
          ([key, value]) => `
            <li>
              <strong>${escapeHtml(key)}:</strong>
              ${escapeHtml(value)}
            </li>
          `,
        )
        .join("");
    }

    res.status(200).send(`
<!DOCTYPE html>
<html lang="fa" dir="rtl">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    ${escapeHtml(name)} | ${escapeHtml(brand)} | PixelLife
  </title>

  <meta
    name="description"
    content="${escapeHtml(description)}"
  >

  <meta
    name="robots"
    content="index, follow"
  >

  <link
    rel="canonical"
    href="${canonical}"
  >

  <!-- Open Graph -->

  <meta
    property="og:type"
    content="product"
  >

  <meta
    property="og:title"
    content="${escapeHtml(name)} | PixelLife"
  >

  <meta
    property="og:description"
    content="${escapeHtml(description)}"
  >

  <meta
    property="og:url"
    content="${canonical}"
  >

  ${
    imageUrls.length > 0
      ? `
  <meta
    property="og:image"
    content="${escapeHtml(imageUrls[0])}"
  >
  `
      : ""
  }

  <!-- Product Schema -->

  <script type="application/ld+json">
${JSON.stringify(productSchema)}
  </script>

</head>

<body>

  <main>

    <p>
      <a href="/">خانه</a>
      /
      ${escapeHtml(product.category || "محصولات")}
      /
      ${escapeHtml(name)}
    </p>

    <h1>
      ${escapeHtml(name)}
    </h1>

    <p>
      برند:
      <strong>${escapeHtml(brand)}</strong>
    </p>

    ${
      imagesHtml
        ? `
    <section>
      ${imagesHtml}
    </section>
    `
        : ""
    }

    <h2>
      قیمت:
      ${price.toLocaleString("fa-IR")}
      تومان
    </h2>

    <p>
      ${inStock ? `موجود - ${product.stock} عدد` : "ناموجود"}
    </p>

    ${
      description
        ? `
    <section>
      <h2>توضیحات محصول</h2>
      <p>${escapeHtml(description)}</p>
    </section>
    `
        : ""
    }

    ${
      specificationsHtml
        ? `
    <section>
      <h2>مشخصات محصول</h2>
      <ul>
        ${specificationsHtml}
      </ul>
    </section>
    `
        : ""
    }

  </main>

</body>

</html>
    `);
  } catch (error) {
    console.error("Product Page Error:", error);

    res.status(500).send("خطا در نمایش صفحه محصول");
  }
});

module.exports = router;
