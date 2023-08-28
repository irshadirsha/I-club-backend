const mongoose = require('mongoose');

const bannerSchema= new mongoose.Schema({
    bannerimage:{
        type:String,
        default:null
    },
    about:{
        type:String,
        default:null  
    },
    imageId:{
        type:String,
        default:null   
    }
})

module.exports=mongoose.model('Banner',bannerSchema)