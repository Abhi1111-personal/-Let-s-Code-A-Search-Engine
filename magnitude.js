const fs = require("fs");
const magnitudestr = fs.readFileSync("Magnitude.txt").toString();
const magnitude = magnitudestr.split("\n");
// console.log(magnitude);
for (let i = 0; i < magnitude.length; i++) {
  magnitude[i] = Number(magnitude[i]);
}

// console.log(magnitude);

module.exports = magnitude;
