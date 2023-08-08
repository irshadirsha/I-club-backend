const mongoose= require('mongoose')

const userSchema = new mongoose.Schema({
      username: {type:String,require: true},
      password :{type:String,required:true},
      email:{type:String},
      phone:{type:Number},
      address:{type:String},
      gender:{type:String},
      image:{type:String},
      isBlock:{type:Boolean,default:false},
      clubs:[
            {
              clubName:{
                type:String,
                default:null
              },
              password:{
                type:String,
                default:null
              },
              club:{
                type: mongoose.Schema.Types.ObjectId,
                ref: "clubdata",
                required: true,
              },
              role:{
                type:String,
                default:null
              }
            }
          ]
})

module.exports = mongoose.model ('user', userSchema)