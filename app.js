require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const port = 3000;
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 5 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/usersDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render("home")
});

app.get("/login", (req, res) => {
    res.render("login")
});

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        };
        console.log("User succesfully logged out");
        res.redirect('/');
    });
});

app.get("/register", (req, res) => {
    res.render("register")
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/error", (req, res) => {
    res.render("error")
})

app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password)
        .then(() => {
            passport.authenticate("local")(req, res, () => {
                console.log("Successfully added a new user.");
                res.redirect("/secrets");
            });
        })
        .catch(err => {
            if (err.name === "UserExistsError") {
                console.log(`User already exists with email: ${req.body.username}`);
                res.render("exist");
            }
        });
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/error",
}));

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
