const mongoose = require('mongoose')
const bcrypt = require("bcryptjs");

const MemberSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false },
    password: { type: String, required: true },
    role: { type: String, required: false, default: "member" },
});

MemberSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Member", MemberSchema);

module.exports.saveMember = function(model, data){
    model.save(data);
}








