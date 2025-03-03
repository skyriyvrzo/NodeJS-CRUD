const mongoose = require('mongoose')

let categorySchema = new mongoose.Schema({
    name: String,
    owner: {type: mongoose.Schema.Types.ObjectId, ref: "Member"}
})

module.exports = mongoose.model("Category", categorySchema);

module.exports.saveCategory = function(model, data){
    model.save(data);
}