console.log("Script started...");

require("dotenv").config();

const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
const mongoose = require("mongoose");

const connectDB = require("./src/db");
const Product = require("./src/models/Product");
const slugify = require("slugify");

const updateSlugs = async () => {
  try {
    await connectDB();

    const products = await Product.find({
      slug: { $exists: false },
    });

    console.log("Products found:", products.length);

    for (const product of products) {
      product.slug = slugify(
        `${product.name}-${product._id.toString().slice(-4)}`,
        {
          lower: true,
          strict: true,
        },
      );

      await product.save();

      console.log("Updated:", product.name, "=>", product.slug);
    }

    console.log("✅ Slugs updated successfully");

    process.exit();
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
};

updateSlugs();
