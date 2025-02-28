const mongoose = require('mongoose')

let productSchema = new mongoose.Schema({
    name:String,
    price:Number,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    image:String,
    description:String

})

module.exports = mongoose.model("Product", productSchema);

module.exports.saveProduct = function(model, data){
    model.save(data);
}






