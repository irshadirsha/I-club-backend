const mongoose=require('mongoose');
const { ObjectId } = require("mongodb");
const otpSchema=new mongoose.Schema({
      users:{
        type:String,
        required: true,
      },
      otp:{
        type:String,
        default:null
      },
});

module.exports=mongoose.model("Otp",otpSchema);