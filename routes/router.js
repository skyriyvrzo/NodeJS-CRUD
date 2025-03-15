//============================================================================
// Name        : router.js
// Author      : Thewa Laokasikan
// Version     : 2025.3.3.3
// Copyright   : MIT
// Description : Main router
//============================================================================
const express = require('express');
const r = express.Router();
const Member = require('../models/members')
const bcrypt = require("bcryptjs");
const connect = require('../database/db')
const multer = require('multer')
const Common = require('../utils/Common');

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

let filter = {
    target: "",
    min: "",
    max: "",
}

//========================== Main (Get) ==============================
r.get('/', async (req, res) => {
    const categories = await Common.getCategories()
    const products = await Product.find().populate('category').exec()
    filter = {
        target: "",
        min: "",
        max: "",
    }
    res.render('index', {user: req.session.user, categories, products, filter: filter});
})
r.get('/search', async (req, res) => {
    try {
        filter = {
            target: req.query.target,
            min: req.query.min,
            max: req.query.max,
        }

        let query = {};

        if (filter.target) {
            query.name = { $eq: filter.target };
        }
        if (filter.min) {
            query.price = { ...query.price, $gte: parseInt(filter.min) };
        }
        if (filter.max) {
            query.price = { ...query.price, $lte: parseInt(filter.max) };
        }

        console.log(query.name)
        console.log(query.price)
        const products = await Product.find(query).populate('category').exec();
        const categories = await Common.getCategories()

        res.render("index", { products, user: req.session.user, categories, filter: filter});

    } catch (error) {
        res.redirect('/')
    }
})
//=====================================================================


//========================== Chrome-Dino (Get) ========================
r.get('/chrome-dino', (req, res) => {
    res.render('chrome-dino', {user: req.session.user})
})
//=====================================================================


//================== Register Login Logout Account (Get) ==============
r.get('/login', async (req, res) => {

    if(req.session.login) return res.redirect(req.get('Referer') || '/')
    res.render('user/login', {user: req.session.user, categories: await Common.getCategories()});
})
r.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});
r.get('/register', async (req, res) => {
    if(req.session.login) return res.redirect(req.get('Referer') || '/');
    res.render('user/register', {user: req.session.user, categories: await Common.getCategories()});
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
    if (!Common.isLogin(req, res)) return;

    const categories = await Common.getCategories()
    res.render('manage/category/category', {categories, user: req.session.user})
})
r.get('/manage/category/add', (req, res) => {
    if (!Common.isLogin(req, res)) return;

    res.render('manage/category/add', {user: req.session.user});
})
r.get('/manage/category/delete/:id', async (req, res) => {
    if (!Common.isLogin(req, res)) return;

    try {
        await Category.findByIdAndDelete(req.params.id, {useFindAndModify: false}).exec();
        res.redirect('/manage/category', {user: req.session.user});
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message});
    }
})
//=====================================================================


//=========================== Product (Get) ===========================
r.get('/products/:target', async (req, res) => {
    const cateTarget = await Category.findOne({name: req.params.target})
    const products = await Product.find({category: cateTarget})

    filter = {
        target: "",
        min: "",
        max: "",
        category: ""
    }

    res.render('product/productsList', {products, user: req.session.user, categories: await Common.getCategories(), target: cateTarget.name, filter})
})
r.get('/manage/product', async (req, res) => {
    if (!Common.isLogin(req, res)) return;

    const products = await Product.find().populate('category').exec();
    res.render('manage/product/product', {products, categories: await Common.getCategories(), user: req.session.user})
})
r.get('/manage/product/add', async (req, res) => {
    if (!Common.isLogin(req, res)) return;

    const cats = await Common.getCategories()
    res.render('manage/product/add', {categories: cats, user: req.session.user})
})
r.get('/manage/product/delete/:id', async (req, res) => {
    if (!Common.isLogin(req, res)) return;

    try {
        await Product.findByIdAndDelete(req.params.id, {useFindAndModify: false}).exec();
        res.redirect('/manage/product');
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message});
    }
})
r.get('/products/:category/search', async (req, res) => {
    try {
        filter = {
            target: req.query.target,
            min: req.query.min,
            max: req.query.max,
            category: req.query.category
        }

        let query = {};

        if (filter.target) {
            query.name = { $eq: filter.target };
        }
        if (filter.min) {
            query.price = { ...query.price, $gte: parseInt(filter.min) };
        }
        if (filter.max) {
            query.price = { ...query.price, $lte: parseInt(filter.max) };
        }
        query.category = await Category.findOne({name: filter.category});
        console.log(query)

        const products = await Product.find(query).populate('category').exec();
        console.log(products)

        res.render('product/productsList', {products, user: req.session.user, categories: await Common.getCategories(), target: filter.category, filter})


    } catch (error) {
        res.redirect('/')
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
    if (!Common.isLogin(req, res)) return;

    const id = req.body.id
    let whatChange = req.body.whatChange
    const type = req.body.type

    if(type === 'username') {
        const target = await Member.findOne({username: whatChange})
        if(target && target.username === whatChange) return res.json({error: "Duplicated username"})
    }

    if(type === 'email') {
        const target = await Member.findOne({email: whatChange})
        if(target && target.email === whatChange) return res.json({error: "Duplicated email"})
    }

    if(type === 'password') {
        const newPass = req.body.newPassword
        const confirmNewPass = req.body.confirmNewPassword

        if(newPass !== confirmNewPass) return res.json({error: "Password does not match"})
        whatChange = await bcrypt.hash(newPass, 10)
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
    if (!Common.isLogin(req, res)) return;

    try {
        const edit_id = req.body.id;
        const cat = await Category.findOne({_id: edit_id}).exec();
        res.render('manage/category/edit', {target: cat, user: req.session.user});

    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message});
    }
})
r.post('/manage/category/update', async (req, res) => {
    try {
        const name = req.body.categoryName
        const id = req.body.id

        const old = await Category.findOne({_id: id});
        if(name === old.name) {
            return res.redirect(`/manage/category`);
        }

        const target = await Category.findOne({name})
        if(target && name === target.name) return res.json({error: "Duplicated category name"})

        await Category.findByIdAndUpdate(id, {name: name}, {useFindAndModify: false}).exec();
        res.redirect('/manage/category');

    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message});
    }
})
//=====================================================================


//============================ Product (Post) =========================
r.post('/manage/product/add', upload.single('productImage'), async (req, res) => {
    const { productName, productPrice, productAmount, productCategory, productDescription } = req.body;

    if(await Product.findOne({productName})) {
        return res.json({error: "Duplicated product name"})
    }

    const newProduct = new Product({
        name: productName,
        price: productPrice,
        amount: productAmount,
        category: await Category.findOne({name: productCategory}),
        image: req.file.filename,
        description: productDescription
    })
    await newProduct.save()
    res.redirect('/manage/product')
})
r.post('/manage/product/edit', async (req, res) => {
    if (!Common.isLogin(req, res)) return;

    try {
        const edit_id = req.body.id;
        const target = await Product.findOne({_id: edit_id}).populate('category').exec();
        const categories = await Common.getCategories()
        res.render('manage/product/edit', {target, categories, user: req.session.user});
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
            amount: req.body.productAmount,
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

module.exports = r;