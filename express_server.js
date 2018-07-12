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
var templateVars = {
      urls: urlDatabase
//   username: req.cookies["username"]
  };
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
   },
 "user3RandomID": {
    id: "user3RandomID",
    email: "a@b.c",
    password: "abc"
  }
}

// update URLs if logged in
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  if (Object.keys(urlDatabase).includes(shortURL)) {
    urlDatabase[shortURL] = req.body.longURL;
  }
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  if (Object.keys(urlDatabase).includes(shortURL)) {
    delete urlDatabase[shortURL];
  }
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let user;
  for (let id in users) {
    if (users[id].email === req.body.email) {
      user = users[id];
    }
  }
  if (!user) {
    res.status(403).send("You don't have permission for access (email).");
    return
  }
  if (user.password !== req.body.password) {
    res.status(403).send("You don't have permission for access (password).");
    return
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  if (req.body.email.length === 0) {
    res.status(400).send('Bad Request with blank email');
    return;
  }
  if (req.body.password.length === 0) {
    res.status(400).send('Bad Request with blank password');
    return;
  }
  for (let id in users) {
    if (users[id].email === req.body.email) {
      res.status(400).send('Bad Request with duplicate email');
      return;
    }
  }
  let newKey = generateRandomUserID();
  users[newKey] = {
    "id": newKey,
    "email": req.body.email,
    "password": req.body.password
  };
  res.cookie("user_id", newKey);
  res.redirect("/");
});

// update long URL, assign random generated ID
app.post("/urls", (req, res) => {
  urlDatabase[generateRandomString()] = req.body.longURL;
  res.redirect("/urls");
});


app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login", getTemplateVars(req));
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", getTemplateVars(req));
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let params = getTemplateVars(req);
  if(Object.keys(urlDatabase).includes(shortURL)) {
    params["shortURL"] = shortURL;
    params["longURL"] = urlDatabase[shortURL];
    res.render("urls_show", params);
    return
  }
  res.render("error404NotFound");
});

app.get("/urls", (req, res) => {
  res.render("urls_index", getTemplateVars(req));
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if((longURL.slice(0, 8) !== "https") && (longURL.slice(0, 7) !== "http://")) {
    longURL = "http://" + longURL;
  }
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  res.render("register", getTemplateVars(req));
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// genereate a random string of length 6
function generateRandomString() {
  let result = Math.random().toString(36).slice(6);
  return Object.keys(urlDatabase).includes(result) ? generateRandomString : result;
}

function getTemplateVars(req) {
  return {...templateVars, user_id: req.cookies["user_id"], user: users[req.cookies["user_id"]] };
}

function generateRandomUserID() {
  let newID = generateRandomString();
  return Object.keys(users).includes(newID) ? generateRandomUserID() : newID;
}
