const multer = require('multer')

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

module.exports = upload