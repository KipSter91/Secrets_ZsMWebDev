const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const port = 3000;
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');



app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
})