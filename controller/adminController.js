
const adminCollection = require('../model/adminModel');
const userCollection = require('../model/userModel')
const clubCollection  =require('../model/clubModel')
const postCollection = require('../model/clubPostModel')
const jwt = require('jsonwebtoken')


const adminsingin = async (req, res) => {
  
  try {
    let {username,password}=req.body
    console.log(username)
    console.log(password)
    let admin=await adminCollection.findOne({username})
    if(admin){
        if(admin.password===password){
            console.log("succefully logged")
            const token=jwt.sign({sub:admin._id},'Key',{expiresIn:'3d'})
            res.json({token,admin:true})
        }else{
            console.log("username not exist");
            const errors={password:"password wrong"}
            res.json({errors,admin:false})
        }
    }else{
        console.log("username not exist");
        const errors={username:"username not exist"}
        res.json({errors,admin:false})
    }
  } catch (error) {
    console.log("Error occur");
  }
};


const adminDashboard=async (req,res,next)=>{
  console.log("dsashbord")
}

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
      res.json({ status: true, result: "user blocked" });
    } else {
      res.json({ status: false, result: "user not found" });
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
      res.json({ status: true, result: "user Unblocked" });
    } else {
      res.json({ status: false, result: "user not found" });
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
     res.json({clubs,status:"blacklistedsuccessfully"})
  } catch (error) {
    console.log("error occur")
  }
}

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
                   ViewClubData};









