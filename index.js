const express = require('express');
const app = express();
const path = require('path');
const route = require('./routes/route');
const port = 80

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(route)

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})