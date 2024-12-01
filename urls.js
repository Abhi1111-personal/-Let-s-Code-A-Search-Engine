const fs = require("fs");
const urlsstr = fs.readFileSync("problem-urls.txt").toString();
const urls = urlsstr.split("\n");

module.exports = urls;
