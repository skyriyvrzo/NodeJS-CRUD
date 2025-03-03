const Category = require("../models/categorys");
const {raw} = require("express");

/**
 *
 * @param req
 * @param res
 * @returns {boolean}
 */
function isLogin(req, res) {
    if (!req.session.login) {
        res.redirect('/login');
        return false;
    }
    return true;
}

/**
 *
 * @returns list of category sort by asc
 */
async function getCategories() {
    return Category.find().sort({name: 1})
}

module.exports = {
    isLogin,
    getCategories
};