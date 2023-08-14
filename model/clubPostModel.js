const mongoose=require('mongoose');
const { ObjectId } = require("mongodb");
const postSchema=new mongoose.Schema({
      clubName:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "clubdata",
        required: true,
      },
      postimg:{
        type:String,
        default:null
      },
      desc:{
        type:String,
        default:null
      },
});

module.exports=mongoose.model("Post",postSchema);