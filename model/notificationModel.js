const mongoose=require('mongoose');

const notificationSchema=new mongoose.Schema({
 
    clubId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
     message:{
        type:String,
        required:true
      },
      date:{
        type:Date,
        default:Date.now()
      }
});

module.exports=mongoose.model("Notification",notificationSchema);