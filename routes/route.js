const express = require('express');
const r = express.Router();
const file = require('../util/file')
const Member = require('../models/members')
const bcrypt = require("bcryptjs");
const connect = require('../database/db')

const Category = require('../models/categorys')

r.get('/', async (req, res) => {
    const category = await Category.find()
    res.render('index', {user: req.session.user, category});
})

r.get('/login', (req, res) => {
    res.render('user/login' );
})

r.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

r.get('/register', (req, res) => {
    res.render('user/register');
})

r.get('/manage/category/addCategory', (req, res) => {
  res.render('manage/category/addCategory');
})

r.post("/login", async (req, res) => {
    const {email, password} = req.body;
    const user = await Member.findOne({email});

    if (!user || !(await user.comparePassword(password))) {
        req.session.message = "Invalid email or password!";
        return res.render("user/login", {email, message: req.session.message});
    }

    req.session.user = user;
    req.session.login = true;
    req.session.cookie.maxAge = 60000 * 5;
    res.redirect("/");
});

r.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    const existingUser = await Member.findOne({ email });

    if (existingUser) {
        return res.render('user/register', { error: "Email already exists. Try another one.", username, email});
    }

    if(password !== confirmPassword) {
        return res.render('user/register', {error: 'Password does not match', username, email})
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10)

        const newMember =  new Member({
            username,
            email,
            password: hashedPassword
        })

        await newMember.save()
        res.redirect('/login')

    } catch (e) {
        console.error(e)
        res.render('user/register', {error: 'Error registering user because: ', e})
    }
})

module.exports = r;