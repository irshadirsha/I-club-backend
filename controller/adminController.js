
const adminCollection = require('../model/adminModel');
const userCollection = require('../model/userModel')
const clubCollection  =require('../model/clubModel')
const postCollection = require('../model/clubPostModel')
const jwt = require('jsonwebtoken')
require('dotenv').config();

const adminsingin = async (req, res) => {
  
  try {
    let {username,password}=req.body
    console.log(username)
    console.log(password)
    let admin=await adminCollection.findOne({username:username})
    if(admin){
        if(admin.password===password){
            console.log("succefully logged")
            const token=jwt.sign({sub:admin._id},process.env.jwtSecretKey,{expiresIn:'3d'})
            console.log(token,"---------------------------");
            return res.json({admin:admin,token,created:true})

        }else{
            console.log("username not exist");
            const errors={password:"Please Enter correct password"}
            res.json({errors,admin:false})
        }
    }else{
        console.log("username not exist");
        const errors={username:"Please Enter correct Username"}
        res.json({errors,admin:false})
    }
  } catch (error) {
    console.log("Error occur");
  }
};


const adminDashboard = async (req, res, next) => {
  try {
    const blockedUserCount = await userCollection.countDocuments({ isBlock: true });
    const activeUserCount = await userCollection.countDocuments();
    const blacklisted = await clubCollection.countDocuments({isblacklisted:true});
    const clubs = await clubCollection.countDocuments();
    
    console.log("Blocked User Count:", blockedUserCount);
    console.log("Active User Count:", activeUserCount);
    console.log("Blocked club Count:", clubs);
    console.log("Active club Count:", blacklisted);
   res.json({blockedUserCount,activeUserCount,clubs,blacklisted})
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred");
  }
};


const UserManage = async (req, res, next) => {
  try {
    const userdata = await userCollection.find();
    console.log(userdata);
    if (userdata && userdata.length > 0) {
      console.log("check");
      res.json({userdata, status: 'success' });
    } else {
      res.status(204).json({ errors: "No user Found" });
    }
  } catch (error) {
    res.status(500).json({ errors: "An error occurred" });
  }
};

const BlockUser = async (req, res, next) => {
  try {
    const { blockid } = req.body;
    console.log(blockid);

    const checkuser = await userCollection.findOne({ _id: blockid });
    if (checkuser) {
      console.log(checkuser);
      await userCollection.findOneAndUpdate({ _id: blockid }, { $set: { isBlock: true } });
      res.json({ status: true, message: "Successfully Blocked the User" });
    } else {
      res.json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: "Internal server error" });
  }
};

const UnBlockUser=async(req,res,next)=>{
  try {
    const { Unblockid } = req.body;
    console.log("Request Body:", req.body);
    console.log(Unblockid);
    const checkuser = await userCollection.findOne({ _id: Unblockid });
    if (checkuser) {
      console.log(checkuser);
      await userCollection.findOneAndUpdate({ _id: Unblockid }, { $set: { isBlock: false } });
      res.json({ status: true, message: "Successfully UnBlocked the User" });
    } else {
      res.json({ status: false, message: "User not found" });
    }
  } catch (error) {
    
  }
}
const GetClubdata=async(req,res,next)=>{
  try {
    const clubs=await clubCollection.find({})
    console.log(clubs)
    res.json({club:clubs})
  } catch (error) {
    console.log("error occur")
  }
}

const SetBlacklist = async (req,res,next)=>{
  try {
     const {id}=req.body
     console.log(id) 
     console.log('qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq') 
     await clubCollection.updateOne({_id:id},{$set:{isblacklisted:true
     }})
     const clubs=await clubCollection.find({})
     res.json({clubs,message:"blacklisted successfully"})
  } catch (error) {
    console.log("error occur")
  }
}
const GetBlacklisted = async (req, res, next) => {
  try {
    const clubs = await clubCollection.find({ isblacklisted: true });
    res.json({club:clubs});
  } catch (error) {
    console.error('Error fetching blacklisted clubs:', error);
    res.status(500).json({ error: 'Error fetching blacklisted clubs' });
  }
};

const RemoveFromBlacklist = async (req, res, next) => {
  try {
    const { id } = req.body;
    await clubCollection.findOneAndUpdate(
      { _id: id },
      { $set: { isblacklisted: false } }
    );
    res.json({ message: 'Club removed from blacklist' });
  } catch (error) {
    console.error('Error removing club from blacklist:', error);
    res.status(500).json({ error: 'Error removing club from blacklist' });
  }
};


const ViewClubData = async (req,res,next)=>{
  try {
    const id = req.query.id;
    console.log(id)
    const clubdetails= await clubCollection.findOne({_id:id})
    .populate('president').populate('secretory').populate('treasurer').populate('members')  
    console.log(clubdetails);
    const post=await postCollection.find({clubName:clubdetails._id})
    console.log("pppppppppp",post);
    res.json({data:clubdetails,post})
  } catch (error) {
   console.log("error occured") 
  }
}


module.exports = { adminsingin,
                   adminDashboard,
                   UserManage,
                   BlockUser,
                   UnBlockUser,
                   GetClubdata,
                   SetBlacklist,
                   ViewClubData,
                   GetBlacklisted,
                   RemoveFromBlacklist};









