// require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const port = 3000;
const mongoose = require("mongoose");
const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;
// const encrypt = require("mongoose-encryption");

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

// userSchema.plugin(encrypt, {
//     secret: process.env.SECRET,
//     encryptedFields: ['password']
// });

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home")
});

app.get("/login", (req, res) => {
    res.render("login")
});

app.post("/login", (req, res) => {
    User.findOne({ email: req.body.username })
        .then((foundUser) => {
            if (!foundUser) {
                console.log("No user found.");
                res.render("error");
            } else {
                bcrypt.compare(req.body.password, foundUser.password)
                    .then((result) => {
                        if (result) {
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
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

//refactor above code with async/await and catch block to handle errors
// app.post("/login", async (req, res) => {
//     try {
//       const foundUser = await User.findOne({ email: req.body.username });
//       if (!foundUser) {
//         console.log("No user found.");
//         return res.render("error");
//       }
//       const result = await bcrypt.compare(req.body.password, foundUser.password);
//       if (result) {
//         console.log("User was successfully logged in.");
//         return res.render("secrets");
//       } else {
//         console.log("Incorrect password.");
//         return res.render("error_password");
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   });

app.get("/register", (req, res) => {
    res.render("register")
});
//with Promises
app.post("/register", (req, res) => {
    bcrypt.hash(req.body.password, saltRounds)
        .then((hash) => {
            const newUser = new User({
                email: req.body.username,
                password: hash
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
        })
        .catch((err) => {
            console.log(err);
        });
});

//refactor above code with async/await and catch block to handle errors
// app.post("/register", async (req, res) => {
//     try {
//         const hash = await bcrypt.hash(req.body.password, saltRounds);
//         const newUser = new User({
//             email: req.body.username,
//             password: hash
//         });
//         const existingUser = await User.findOne({ email: req.body.username });
//         if (existingUser) {
//             console.log(`User already exist with email: ${req.body.username}`);
//             res.render("exist")
//         } else {
//             await newUser.save();
//             console.log("Successfully added a new user.");
//             res.render("secrets");
//         }
//     } catch (err) {
//         console.log(err);
//     }
// });

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
})

