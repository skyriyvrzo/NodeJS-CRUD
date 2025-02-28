const express = require('express');
const app = express();
const path = require('path');
const router = require('./routes/router');
const session = require("express-session");

const port = 80

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(session({
    secret: "mrsecretkey",
    resave: false,
    saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(router)

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})