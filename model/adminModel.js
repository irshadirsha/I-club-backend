const mongoose=require('mongoose')

const adminSchema= new mongoose.Schema({
    username: { type: String,
          required: [true, "Username Required"]},
    password: { type: String,
          required: [true, "Password Required"]}
})

module.exports = mongoose.model('admin', adminSchema)

