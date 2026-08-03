const path = require("path");

const homeController = {
  index: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/index.html"));
  },
  mobiles: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/mobile.html"));
  },
  login: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/login.html"));
  },
  cart: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/cart.html"));
  },
  iphone: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/iphone.html"));
  },
  product: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/product.html"));
  },
  samsung: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/samsung.html"));
  },
  xiaomi: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/xiaomi.html"));
  },
  samsungtab: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/samsungtab.html"));
  },
  ipad: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/ipad.html"));
  },
  xiaomitab: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/xiaomitab.html"));
  },
  console: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/console.html"));
  },
};

module.exports = homeController;
