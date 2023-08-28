const userCollection =require ('../model/userModel')
const bannerCollection = require ('../model/bannerModel')
const jwt = require('jsonwebtoken');


const GetBannerHome= async (req,res,next)=>{
    try {
        console.log("calling.......");
        const homedata=await bannerCollection.find()
        res.json({data:homedata})
    } catch (error) {
        
    }
}

module.exports={GetBannerHome}