const express = require("express");

// Template Engine
const ejs = require("ejs");

// Module to remove the stopwords (is, an, the ....)
const { removeStopwords } = require("stopword");

// Module to remove the Punctuations (. , !)
const removePunc = require("remove-punctuation");

// Module for spell-check
const natural = require("natural");

// Module to remove grammer (add / adding == add)
const lemmatizer = require("wink-lemmatizer");

// Module to convert number to words
var converter = require("number-to-words");

// Modules to read file and set directory path
const fs = require("fs");
const path = require("path");

// Module to calculate Title Similarity
const stringSimilarity = require("string-similarity");

// Module to convert word to numbers
const { wordsToNumbers } = require("words-to-numbers");

/**
 * Reading Required Arrays
 */

//Reading the IDF Array
const IDF = require("./idf");

// Reading the keywords array
const keywords = require("./keywords");

// Reading the length array
const length = require("./length");

//Reading the TF Array
let TF = require("./TF");

// Reading the titles array
const titles = require("./titles");

// Reading the urls array
const urls = require("./urls");

const N = 3023;
const W = 27602;
const avgdl = 138.27125372146875;

// Starting the Server
const app = express();

// Function to capitalize the string

Object.defineProperty(String.prototype, "capitalize", {
  value: function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  },
  enumerable: false,
});

// Setting EJS as our view engine
app.set("view engine", "ejs");

// Path to our Public Assets Folder
app.use(express.static(path.join(__dirname, "/public")));

// Making a dictionary with all our keywords
const spellcheck = new natural.Spellcheck(keywords);

// GET Route to home page
app.get("/", (req, res) => {
  res.render("index");
});

// GET Route to perform our search
app.get("/search", (req, res) => {
  const query = req.query.query;
  const oldString = query.split(" ");
  const newString = removeStopwords(oldString);
  newString.sort(); // newString is an array

  let queryKeywords = [];

  // Seperates numbers from query string
  let getNum = query.match(/\d+/g);

  //Push all the numbers and their word form to query keywords
  if (getNum) {
    getNum.forEach((num) => {
      queryKeywords.push(num);
      let numStr = converter.toWords(Number(num));
      let numKeys = numStr.split("-");
      queryKeywords.push(numStr); // two-hundered-thirty-four

      numKeys.forEach((key) => {
        let spaceSplits = key.split(" ");
        if (numKeys.length > 1) queryKeywords.push(key);
        if (spaceSplits.length > 1)
          spaceSplits.forEach((key) => {
            queryKeywords.push(key);
          });
      });
    });
  }

  // twoSum => two sum

  // twojnjgk
  // 2

  for (let j = 0; j < newString.length; j++) {
    // Original Keywords
    newString[j] = newString[j].toLowerCase();
    newString[j] = removePunc(newString[j]);
    if (newString[j] !== "") queryKeywords.push(newString[j]);

    // Camelcasing
    var letr = newString[j].match(/[a-zA-Z]+/g);
    if (letr) {
      letr.forEach((w) => {
        queryKeywords.push(removePunc(w.toLowerCase()));
      });
    }

    //Word to Numbers
    let x = wordsToNumbers(newString[j]).toString();
    if (x != newString[j]) queryKeywords.push(x);
  }

  // Grammer and Spell Check

  let queryKeywordsNew = queryKeywords;
  queryKeywords.forEach((key) => {
    let key1 = key;
    let key2 = lemmatizer.verb(key1); // adds -> add
    queryKeywordsNew.push(key2);

    let spellkey1 = spellcheck.getCorrections(key1);
    let spellkey2 = spellcheck.getCorrections(key2);
    if (spellkey1.indexOf(key1) == -1) {
      spellkey1.forEach((k1) => {
        queryKeywordsNew.push(k1);
        queryKeywordsNew.push(lemmatizer.verb(k1));
      });
    }

    if (spellkey2.indexOf(key2) == -1) {
      spellkey2.forEach((k2) => {
        queryKeywordsNew.push(k2);
        queryKeywordsNew.push(lemmatizer.verb(k2));
      });
    }
  });

  // Updating the querykeywords array
  queryKeywords = queryKeywordsNew;
  console.log(queryKeywords);

  // Now we need to filter out those keywords which are present in our dataset
  let temp = [];
  for (let i = 0; i < queryKeywords.length; i++) {
    const id = keywords.indexOf(queryKeywords[i]);
    if (id !== -1) {
      temp.push(queryKeywords[i]);
    }
  }

  queryKeywords = temp;
  queryKeywords.sort();

  //Getting Unique Query Keyword
  let temp1 = [];
  queryKeywords.forEach((key) => {
    if (temp1.indexOf(key) == -1) {
      temp1.push(key);
    }
  });

  queryKeywords = temp1;

  //Getting id of every query keyword
  let qid = [];
  queryKeywords.forEach((key) => {
    qid.push(keywords.indexOf(key));
  });

  /**
   * BM25 Algorithm
   */

  // Similarity Score of each doc with query string
  const arr = [];

  for (let i = 0; i < N; i++) {
    let s = 0;
    qid.forEach((key) => {
      const idfKey = IDF[key];
      let tf = 0;
      for (let k = 0; k < TF[i].length; k++) {
        if (TF[i][k].id == key) {
          tf = TF[i][k].val / length[i];

          break;
        }
      }
      const tfkey = tf;
      const x = tfkey * (1.2 + 1);
      const y = tfkey + 1.2 * (1 - 0.75 + 0.75 * (length[i] / avgdl));
      let BM25 = (x / y) * idfKey;

      //Giving Higher weightage to Leetcode and Intterview bit Problems
      if (i < 2214) BM25 *= 2;
      s += BM25;
    });

    // Title Similarity
    const titSim = stringSimilarity.compareTwoStrings(
      titles[i],
      query.toLowerCase()
    );
    s *= titSim;

    arr.push({ id: i, sim: s });
  }

  //Sorting According to Score
  arr.sort((a, b) => b.sim - a.sim);

  let response = [];
  let nonZero = 0;

  for (let i = 0; i < 10; i++) {
    if (arr[i].sim != 0) nonZero++;
    const str = path.join(__dirname, "Problems");
    const str1 = path.join(str, `problem_text_${arr[i].id + 1}.txt`);
    let question = fs.readFileSync(str1).toString().split("\n");
    let n = question.length;
    let problem = "";

    if (arr[i].id <= 1773) {
      problem = question[0].split("ListShare")[1] + " ";
      if (n > 1) problem += question[1];
    } else {
      problem = question[0] + " ";
      if (n > 1) problem += question[1];
    }
    response.push({
      id: arr[i].id,
      title: titles[arr[i].id],
      problem: problem,
    });
  }

  console.log(response);

  // res.locals.titles = response;
  setTimeout(() => {
    if (nonZero) res.json(response);
    else res.json([]);
  }, 1000);
});

// GET route to question page

app.get("/question/:id", (req, res) => {
  const id = Number(req.params.id);
  const str = path.join(__dirname, "Problems");
  const str1 = path.join(str, `problem_text_${id + 1}.txt`);
  let text = fs.readFileSync(str1).toString();
  // console.log(text);
  if (id <= 1773) {
    text = text.split("ListShare");
    text = text[1];
  }

  var find = "\n";
  var re = new RegExp(find, "g");

  text = text.replace(re, "<br/>");

  let title = titles[id];
  title = title.split("-");
  let temp = "";
  for (let i = 0; i < title.length; i++) {
    temp += title[i] + " ";
  }
  title = temp;
  title = title.capitalize();
  let type = 0;
  if (id < 1774) type = "Leetcode";
  else if (id < 2214) type = "Interview Bit";
  else type = "Techdelight";
  const questionObject = {
    title,
    link: urls[id],
    value: text,
    type,
  };

  res.locals.questionObject = questionObject;

  res.locals.questionBody = text;
  res.locals.questionTitle = titles[id];
  res.locals.questionUrl = urls[id];
  res.render("question");
});

// Listining on Port

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server is runnning on port " + port);
});

// Binary Search Tree -> ['binary', 'search', 'tree', 'orange'] -> ['binary', 'search', 'tree']
// Keywords -> []
// const score = [];
// for(const document of documents) {
// bm25
// score.push({id: document_id, score: bm25})
// }

// O(N*W)
// score.sort((a, b) => {
//  return b.score-a.score;
// })

// for(let i=0; i< 10; i++){
// console.log(document[score[i]._id]);
//}
//
//
