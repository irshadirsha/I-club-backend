const mongoose = require('mongoose');
const chatSchema = new mongoose.Schema({
 
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
      room:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "clubdata",
        required: true,
      },
      message:{
        type:String,
        required:true
      },
      time:{
        type:Date,
        default:null
      },
      
},{
  timestamps: true
});

module.exports=mongoose.model("Chat",chatSchema);

