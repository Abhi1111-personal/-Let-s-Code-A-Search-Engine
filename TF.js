const fs = require("fs");
const N = 3023;
// const W = 37641;
let tf = new Array(N);

for (let i = 0; i < N; i++) {
  tf[i] = new Array(0);
}

const TF = fs.readFileSync("TF.txt").toString();

const temp = TF.split("\n");
for (let k = 0; k < temp.length; k++) {
  const arr = temp[k].split(" ");
  const i = Number(arr[0]);
  const j = Number(arr[1]);
  const val = Number(arr[2]);
  // console.log(i);
  tf[i].push({
    id: j,
    val: val,
  });
  // tf[i][j] = val;
}

module.exports = tf;
