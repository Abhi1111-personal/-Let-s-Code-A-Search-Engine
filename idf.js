const fs = require("fs");
const idfstr = fs.readFileSync("IDF.txt").toString();
const idf = idfstr.split("\n");

for (let i = 0; i < idf.length; i++) {
  idf[i] = Number(idf[i]);
}

module.exports = idf;
