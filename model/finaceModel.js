const mongoose=require('mongoose');
const { ObjectId } = require("mongodb");
const financeSchema=new mongoose.Schema({
    clubName:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "clubdata",
        required: true,
      },
    name:{
        type:String,
        required:true
      },
      reason:{
        type:String,
        required:true
      },
      amount:{
        type:Number,
        required:true
      },
      date:{
        type:Date,
        required:true
      },   
      status:{
        type:Boolean,
        required:true
      },
      paymentMethod:{
        type:String,
        default:"cash"
      },
      paypalId:{
        type:String,
        default:null
      } 
});

module.exports=mongoose.model("Finance",financeSchema);