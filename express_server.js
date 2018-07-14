var express = require("express");
var cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");

var app = express();
app.use(cookieParser())
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: "session",
  keys: [process.env.SESSION_SECRET || "secret-string"]
}));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": { shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    user_id: "userRandomID",
    creationDate: "Sun Jul 01 2018",
    visitCount: 10,
    uniqueCount: 100},
  "9sm5xK": { shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    user_id: "user2RandomID",
    creationDate: "Sun May 01 2016",
    visitCount: 18,
    uniqueCount: 50},
  "803m5xK" : { shortURL: "803m5xK",
    longURL: "http://www.google.com",
    user_id: "user2RandomID",
    creationDate: "Wed Nov 01 2017",
    visitCount: 34,
    uniqueCount: 86}
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2b$10$SLgdH2vhyllkzVi2FON1VeANjAF7zoM32tG5tZbmcc0osrhxQqmAq"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$kOaKk14BsFAeSY8ouNkIRuojjBgPkh.esQjRZQ5J0C9Sek9JM0r.y"
   },
 "user3RandomID": {
    id: "user3RandomID",
    email: "a@b.c",
    password: "$2b$10$f6hc3RiiLLNx32o2VabP4OSVRSUC3nxem6pOP0Pvhzd4Mjh6Tbepu"
  }
}

// update URLs if logged in
app.post("/urls/:id", (req, res) => {
  if (!verifyLogin(req)) {
    res.render("errors", res.status(401));
    return;
  }
  let shortURL = req.params.id;
  let urls = urlRecordFor(req, shortURL);
  if (urls) {
    urls.longURL = urlStringFor(req.body.longURL);
    res.redirect("/urls");
  } else {
    res.render("error404NotFound");
  }
});

// delete url record from database
app.post("/urls/:id/delete", (req, res) => {
  if (!verifyLogin(req)) {
    res.render("errors", res.status(401));
    return;
  }
  let shortURL = req.params.id;
  let urls = urlRecordFor(req, shortURL);
  if (urls) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
    return;
  }
  res.render("error404NotFound");
});

// user login
app.post("/login", (req, res) => {
  if (verifyLogin(req)) {
    res.redirect("/urls");
  }
  let user;
  for (let id in users) {
    if (users[id].email === req.body.email) {
      user = users[id];
    }
  }
  // Verify valid email associated with our user records
  if (!user) {
    res.status(403).send("You don't have permission for access.");
    return
  }
  // Verify password matches password in user record.  Same error message by design.
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    res.status(403).send("You don't have permission for access.");
    return
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session.user_id = undefined;
  res.redirect("/");
});

app.post("/register", (req, res) => {
  if (verifyLogin(req)) {
    res.redirect("/urls");
    return;
  } 
  if ((req.body.email.length === 0) || (req.body.password.length === 0)) {
    res.status(400).send("Bad Request with incorrect email or password");
    return;
  }
  for (let id in users) {
    if (users[id].email === req.body.email) {
      res.status(400).send("Email already exists with another user.");
      return;
    }
  }
  let newKey = generateRandomUserID();
  users[newKey] = {
    "id": newKey,
    "email": req.body.email,
    "password": bcrypt.hashSync(req.body.password, 10)
  };
  req.session.user_id = newKey;
  res.redirect("/");
});

// update long URL, assign random generated ID
app.post("/urls", (req, res) => {
  if (verifyLogin(req)) {
    addLongURL(urlStringFor(req.body.longURL), req);
    res.redirect("/urls");
  } else {
    res.redirect("errors", res.status(401));
  }
});

app.get("/", (req, res) => {
  if (verifyLogin(req)) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  if (verifyLogin(req)) {
    res.redirect("/urls");
  } else {
    res.render("login", getTemplateVars(req));
  }
});

app.get("/urls/new", (req, res) => {
  if (verifyLogin(req)) {
    res.render("urls_new", getTemplateVars(req));
  } else {
    res.redirect("/login");
  }
});

// Read URL record
app.get("/urls/:id", (req, res) => {
  if (!verifyLogin(req)) {
    res.render("errors", res.status(401));
    return;
  }
  let shortURL = req.params.id;
  let params = getTemplateVars(req);
  let urlRec = urlRecordFor(req, shortURL);
  if(urlRec) {
    params["shortURL"] = urlRec.shortURL;
    params["longURL"] = urlRec.longURL;
    res.render("urls_show", params);
    return
  }
  res.render("error404NotFound");
});

// Send all applicable URLs for user
app.get("/urls", (req, res) => {
  if (verifyLogin(req)) {
    res.render("urls_index", getTemplateVars(req));
  } else {
    res.render("errors", res.status(401));
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// redirect to Long URL from given short URL
app.get("/u/:shortURL", (req, res) => {
  shortURL = req.params.shortURL;
  let urlRec = urlRecordFor(req, shortURL);
  if (urlRec) {
    res.redirect(urlRec.longURL);
  } else {
    res.render("error404NotFound");
  }
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

// get template variables necesary for headers of each page
function getTemplateVars(req) {
  return {
    urls: urlDatabaseWith(req),
    user_id: req.session.user_id,
    user: users[req.session.user_id]};
}

function generateRandomUserID() {
  let newID = generateRandomString();
  return Object.keys(users).includes(newID) ? generateRandomUserID() : newID;
}

function verifyLogin(req) {
  return req.session.user_id && Object.keys(users).includes(req.session.user_id);
}

function urlDatabaseWith(req) {
  return Object.values(urlDatabase).filter(each => each.user_id === req.session.user_id);
}

function addLongURL(longURL, req) {
  let shortURL = generateRandomString();
  let newURL = longURL;

  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL, longURL,
    user_id: req.session.user_id,
    creationDate: new Date().toDateString(),
    visitCount: 0,
    uniqueCount: 0
  }
}

// prefix long URL string with http:// where prefix is missing
function urlStringFor(url) {
  if((url.slice(0, 8) !== "https://") && (url.slice(0, 7) !== "http://")) {
    return "http://" + url;
  } else {
    return url;
  }
}

// filter database records for ones applicable to user
function urlRecordFor(req, shortURL) {
  return urlDatabaseWith(req).find(each => each.shortURL === shortURL);
}