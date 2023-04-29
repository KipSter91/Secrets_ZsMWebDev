require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const port = 3000;
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set("view engine", "ejs");

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
    password: String,
    googleId: String,
    facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({username: profile.id, googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",
    profileFields: ['id', 'displayName', 'photos', 'email']
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({username: profile.id, facebookId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", (req, res) => {
    res.render("home")
});

app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] }
    ));

app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/error" }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/secrets");
    });

app.get("/auth/facebook",
    passport.authenticate('facebook'));

app.get("/auth/facebook/secrets",
    passport.authenticate("facebook", { failureRedirect: "/error" }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/secrets");
    });


app.get("/login", (req, res) => {
    res.render("login")
});

app.get("/logout", (req, res, next) => {
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
