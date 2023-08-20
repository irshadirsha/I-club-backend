const mongoose=require('mongoose');
const clubSchema=new mongoose.Schema({
    clubName:{
        type:String,
        required:true
      },
      registerNo:{
        type:String,
        required:true
      },
      address:{
        type:String,
        required:true
      },
      category:{
        type:String,
        required:true
      },
      securityCode:{
        type:String,
        required:true
      },
      president:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
      secretory:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
      treasurer:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
       isblacklisted: {
        type:Boolean,
        default:false    
      },
      clubimg:{
        type:String,
        default:null
      },
      description:{
        type:String,
        default:null
      },
      about:{
        type:String,
        default:null
      },
      newmember: [
        {
          type: String,
          default:null
        }
      ],
      members: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user"
        }
      ]
      

});

module.exports=mongoose.model("clubdata",clubSchema);