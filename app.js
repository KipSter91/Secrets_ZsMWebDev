require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const port = 3000;
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');


mongoose.connect("mongodb://127.0.0.1:27017/usersDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt, {
    secret: process.env.SECRET,
    encryptedFields: ['password']
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home")
});

app.get("/login", (req, res) => {
    res.render("login")
});

app.post("/login", (req, res) => {
    User.findOne({ email: req.body.username })
        .then(foundUser => {
            if (!foundUser) {
                console.log("No user found.");
                res.render("error");
            } else if (foundUser.password === req.body.password) {
                console.log("User was successfully logged in.");
                res.render("secrets");
            } else {
                console.log("Incorrect password.");
                res.render("error_password");
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/register", (req, res) => {
    res.render("register")
});

app.post("/register", (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })
    User.findOne({ email: req.body.username })
        .then((existingUser) => {
            if (existingUser) {
                console.log(`User already exist with email: ${req.body.username}`);
                res.render("exist")
            } else {
                newUser.save()
                    .then(() => {
                        console.log("Succesfully added a new user.");
                        res.render("secrets");
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
})

