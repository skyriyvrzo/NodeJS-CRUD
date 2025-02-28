const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    member: { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
    quantity: Number,
    totalPrice: Number,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Sale", SaleSchema);

module.exports.saveSale = function(model, data){
    model.save(data);
}




