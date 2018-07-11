var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res, next) => {
  let templateVars = getURLs(req.params.id);
  if (templateVars !== null) {
    res.render("urls_show", templateVars);
  } else {
    res.end("Error Message 404: Referencing a non-existing shortURL!");
  }
});

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
  console.log(req.route);
});

app.post("/urls", (req, res) => {
  urlDatabase[generateRandomString()] = req.body.longURL;
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if((longURL.slice(0, 8) !== "https") && (longURL.slice(0, 7) !== "http://")) {
    longURL = "http://" + longURL;
  }
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// genereate a random string of length 6
function generateRandomString() {
  let result = Math.random().toString(36).slice(-6);
  console.log(urlDatabase.keys);
  return Object.keys(urlDatabase).includes(result) ? generateRandomString : result;
}

// get shortURL and longURL if exists from given shortURL
function getURLs(shortURL) {
  return (Object.keys(urlDatabase).includes(shortURL)) ?
    { shortURL: shortURL, longURL: urlDatabase[shortURL] } :
      null
}
