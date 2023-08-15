const mongoose=require('mongoose');
const { ObjectId } = require("mongodb");
const eventSchema=new mongoose.Schema({
    clubName:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "clubdata",
        required: true,
      },
    event:{
        type:String,
        required: true,
    },
    auther:{
        type:String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
      },
      time:{
        type:String,
        default:null
      },
      location:{
        type:String,
        default:null
      }
});

module.exports=mongoose.model("Event",eventSchema);