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
      date: {
        type: Date,
        default: Date.now,
        required: true
      },
      desc:{
        type:String,
        default:null
      },
      likes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user"
        }
      ]
});

module.exports=mongoose.model("Post",postSchema);