require("dotenv").config();

const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const connectDB = require("./src/db");
const Product = require("./src/models/Product");

async function fixSlugs() {
  try {
    await connectDB();

    const products = await Product.find({
      name: "iPhone 17 Pro Max",
    });

    console.log("Found:", products.length);

    for (let i = 0; i < products.length; i++) {
      products[i].slug =
        i === 0 ? "iphone-17-pro-max" : `iphone-17-pro-max-${i + 1}`;

      await products[i].save();

      console.log("Updated:", products[i].slug);
    }

    console.log("✅ Duplicate slugs fixed");

    process.exit();
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
}

fixSlugs();
