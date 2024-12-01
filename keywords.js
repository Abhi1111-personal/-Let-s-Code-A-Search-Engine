const fs = require("fs");
const keywordsstr = fs.readFileSync("keywords.txt").toString();
const keywords = keywordsstr.split("\n");
module.exports = keywords;
