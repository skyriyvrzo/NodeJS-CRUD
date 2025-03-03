//============================================================================
// Name        : router.swift
// Author      : Thewa Laokasikan
// Version     : 2025.2.28.3
// Copyright   : MIT
// Description : Main router
//============================================================================
const express = require('express');
const r = express.Router();
const Member = require('../models/members')
const bcrypt = require("bcryptjs");
const connect = require('../database/db')
const multer = require('multer')

const Category = require('../models/categorys')
const Product = require('../models/products')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/products') //file part
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + ".jpg") //auto filename
    }
})

const upload = multer({
    storage: storage
})

//========================== Main (Get) ==============================
r.get('/', async (req, res) => {
    const categories = await Category.find().exec()
    const products = await Product.find().populate('category').exec()
    res.render('index', {user: req.session.user, categories, products});
})
//=====================================================================


//========================== Chrome-Dino (Get) ========================
r.get('/chrome-dino', (req, res) => {
    res.render('chrome-dino')
})
//=====================================================================


//================== Register Login Logout Account (Get) ==============
r.get('/login', (req, res) => {

    if(req.session.login !== undefined && req.session.login) return res.redirect('/')
    res.render('user/login' );
})
r.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});
r.get('/register', (req, res) => {
    if(req.session.login) return res.redirect(req.get('Referer') || '/');
    res.render('user/register');
})
r.get('/account', (req, res) => {
    res.render('user/account/account', {user: req.session.user})
})
r.get('/account/change/:target',  (req, res) => {
    const target = req.params.target.substring(0, 1).toUpperCase() + req.params.target.substring(1)
    const userTarget = req.session.user
    return target !== 'Password' ? res.render('user/account/change-info', {target, userTarget, user: req.session.user}) : res.render('user/account/change-password', {target, userTarget, user: req.session.user})
})
//=====================================================================


//=========================== Category (Get) ==========================
r.get('/manage/category', async (req, res) => {
    isLogin(req, res)

    const categories = await Category.find()
    res.render('manage/category/category', {categories})
})
r.get('/manage/category/add', (req, res) => {
    isLogin(req, res)

    res.render('manage/category/add');
})
r.get('/manage/category/delete/:id', async (req, res) => {
    isLogin(req, res)

    try {
        await Category.findByIdAndDelete(req.params.id, {useFindAndModify: false}).exec();
        res.redirect('/manage/category');
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message});
    }
})
//=====================================================================


//=========================== Product (Get) ===========================
r.get('/products/:target', async (req, res) => {
    const cateTarget = await Category.find({name: req.params.target})
    const products = await Product.find({category: cateTarget})

    res.render('product/productsList', {products, user: req.session.user, categories: await Category.find()})
})
r.get('/manage/product', async (req, res) => {
    console.log(isLogin(req, res))
    const products = await Product.find().populate('category').exec();
    res.render('manage/product/product', {products})
})
r.get('/manage/product/add', async (req, res) => {
    isLogin(req, res)

    const cats = await Category.find()
    res.render('manage/product/add', {categories: cats})
})
r.get('/manage/product/delete/:id', async (req, res) => {
    isLogin(req, res)

    try {
        await Product.findByIdAndDelete(req.params.id, {useFindAndModify: false}).exec();
        res.redirect('/manage/product');
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message});
    }
})
//=====================================================================


//=================== Register Login Account (Post) ===================
r.post("/login", async (req, res) => {
    const {email, password} = req.body;
    const user = await Member.findOne({email});

    if (!user || !(await user.comparePassword(password))) {
        req.session.message = "Invalid email or password!";
        return res.render("user/login", {email, message: req.session.message});
    }

    req.session.user = user;
    req.session.login = true;
    req.session.cookie.maxAge = 60000 * 30;
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
r.post('/update-profile', async (req, res) => {
    isLogin(req, res)

    const id = req.body.id
    let whatChange = req.body.whatChange
    const type = req.body.type

    if(type === 'username') {
        const target = await Member.findOne({username: whatChange})
        if(target && target.username === whatChange) return res.json({error: "Duplicated username"})
    }

    if(type == 'email') {
        const target = await Member.findOne({email: whatChange})
        if(target && target.email === whatChange) return res.json({error: "Duplicated email"})
    }

    if(type == 'password') {
        const newPass = req.body.newPassword
        const confirmNewPass = req.body.confirmNewPassword

        if(newPass !== confirmNewPass) return res.json({error: "Password does not match"})
        const hashedPassword = await bcrypt.hash(newPass, 10)
        whatChange = hashedPassword

    }

    const data = {
        [type] : whatChange
    }

    await Member.findByIdAndUpdate(id, data, {useFindAndModify: false}).exec();
    req.session.user = await Member.findOne({_id: id}).exec();

    res.redirect('/account')
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
    console.log(req.body)
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


//============================ Product (Post) =========================
r.post('/manage/product/add', upload.single('productImage'), async (req, res) => {
    const { productName, productPrice, productCategory, productDescription } = req.body;

    if(await Product.findOne({productName})) {
        return res.json({error: "Duplicated product name"})
    }

    const newProduct = new Product({
        name: productName,
        price: productPrice,
        category: await Category.findOne({name: productCategory}),
        image: req.file.filename,
        description: productDescription
    })
    await newProduct.save()
    res.redirect('/manage/product')
})
r.post('/manage/product/edit', async (req, res) => {
    try {
        const edit_id = req.body.id;
        const target = await Product.findOne({_id: edit_id}).populate('category').exec();
        const categories = await Category.find()
        res.render('manage/product/edit', {target, categories});
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message});
    }
})
r.post('/manage/product/update', upload.single('productImage'), async (req, res) => {
    try {
        const id = req.body.id;
        const data = {
            name: req.body.productName,
            price: req.body.productPrice,
            category: await Category.findOne({name: req.body.productCategory}),
            description: req.body.productDescription
        };
        if (req.file) {
            data.image = req.file.filename;
        }

        await Product.findByIdAndUpdate(id, data, {useFindAndModify: false}).exec();
        await res.redirect('/manage/product');

    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message});
    }
});
//=====================================================================

/**
 *
 * @param req
 * @param res
 * @returns true -> redirect to login page if not login
 * @returns false -> return true if login
 */
function isLogin(req, res) {
    // console.log(req.session.login != null)
    // console.log(!req.session.login)


    return !req.session.login ? res.redirect('/login') : true
}

module.exports = r;