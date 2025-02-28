const express = require('express');
const r = express.Router();
const file = require('../util/file')
const Member = require('../models/members')
const bcrypt = require("bcryptjs");
const connect = require('../database/db')

const Category = require('../models/categorys')

//========================== Main (Get) ==============================
r.get('/', async (req, res) => {
    const categories = await Category.find()
    res.render('index', {user: req.session.user, categories});
})
//=====================================================================


//========================== Register Login Logut (Get) ==============
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
//=====================================================================


//=========================== Category (Get) ==========================
r.get('/manage/category', async (req, res) => {
    const categories = await Category.find()
    res.render('manage/category/category', {categories})
})
r.get('/manage/category/add', (req, res) => {
    res.render('manage/category/add');
})
r.get('/manage/category/delete/:id', async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id, {useFindAndModify: false}).exec();
        res.redirect('/manage/category');
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message});
    }
})
//=====================================================================


//=========================== Product (Get) ===========================
r.get('/manage/product', (req, res) => {
    res.render('manage/product/product')
})
r.get('/manage/product/add', (req, res) => {
    res.render('manage/product/add')
})
//=====================================================================


//=========================== Register Login (Post) ===================
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
//=====================================================================


//============================ Category (Post) ========================
r.post('/manage/category/add', async (req, res) => {
    const { categoryName } = req.body;

    if(await Category.findOne({name: categoryName})) {
        return res.json({error: "Duplicated category name"})
    }

    const newCat = new Category({
        name: categoryName
    })

    await newCat.save()
    res.redirect('/manage/category')
})
r.post('/manage/category/edit', async (req, res) => {
    try {
        const edit_id = req.body.id;
        const cat = await Category.findOne({_id: edit_id}).exec();
        res.render('manage/category/edit', {target: cat});

    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message});
    }
})
r.post('/manage/category/update', async (req, res) => {
    try {
        const name = req.body.categoryName
        const id = req.body.id
        const target = await Category.findOne({name})
        if(target && name === target.name) return res.json({error: "Duplicated category name"})

        await Category.findByIdAndUpdate(id, {name: name}, {useFindAndModify: false}).exec();
        await res.redirect('/manage/category');

    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message});
    }
})
//=====================================================================

module.exports = r;