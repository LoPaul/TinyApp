var express = require("express");
var cookieParser = require('cookie-parser')

var app = express();
app.use(cookieParser())
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  if (Object.keys(urlDatabase).includes(shortURL)) {
    delete urlDatabase[shortURL];
  }
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", templateVars(req));
});

app.get("/urls/:id", (req, res) => {
  let urlVars = getURLVars(req.params.id, templateVars(req));8
  if (urlVars !== null) {
    res.render("urls_show", urlVars);
  } else {
  res.render("error404NotFound");
  }
});

app.get("/urls", (req, res) => {
  res.render("urls_index", templateVars(req));
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/urls", (req, res) => {
  urlDatabase[generateRandomString()] = req.body.longURL;
  res.redirect("/urls");
});

// update URLs if logged in
app.post("/urls/:id", (req, res) => {
  let shortURL = urlDatabase[req.params.id];
  if (Object.keys(urlDatabase).includes(shortURL)) {
    urlDatabase[shortURL] = req.body.longURL;
  }
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if((longURL.slice(0, 8) !== "https") && (longURL.slice(0, 7) !== "http://")) {
    longURL = "http://" + longURL;
  }
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// genereate a random string of length 6
function generateRandomString() {
  let result = Math.random().toString(36).slice(-6);
  return Object.keys(urlDatabase).includes(result) ? generateRandomString : result;
}

// get shortURL and longURL if exists from given shortURL
function getURLVars(shortURL, otherVars) {
  return (Object.keys(urlDatabase).includes(shortURL)) ?
    { ...otherVars, shortURL: shortURL, longURL: urlDatabase[shortURL] } :
      null
}

function templateVars(req) {
  return {
    urls: urlDatabase,
    username: req.cookies["username"] };
}
