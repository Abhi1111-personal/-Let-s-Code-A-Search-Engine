const fs = require("fs");
const titlesstr = fs.readFileSync("problem-titles.txt").toString();
const titles = titlesstr.split("\n");

module.exports = titles;
