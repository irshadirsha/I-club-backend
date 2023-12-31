const userCollection =require ('../model/userModel')
const clubCollection = require('../model/clubModel')
const otpCollection = require ('../model/otpModel')
const jwt = require('jsonwebtoken');
const bcrypt =require('bcrypt')
const nodemailer = require("nodemailer");
require('dotenv').config();

const  ImageUpdate=async(req,res,next)=>{
  const { imageUrl } = req.body;
  const user=req.userId
  await userCollection.updateOne({_id:user},{$set:{image:imageUrl}})
  console.log("image updated successfully");
  return res.json({status:true,message:"image updated successfully"})
}

const userHome = (req,res)=>{
}

const userSignup = async (req,res,next)=>{
   try {
    const isGoogleSignup = req.body.isGoogleSignup;
    // google signup
    if (isGoogleSignup) {
      const {username,email,password}=req.body
      
      const existemail=await userCollection.findOne({email:email})
       if(existemail){
        const token = jwt.sign({ sub: existemail._id ,  Role:existemail.Role}, process.env.jwtSecretKey, { expiresIn: '3d' });
        res.json({ user:existemail,token, created: true });
       }else{
        const hashedPassword = await bcrypt.hash(password, 10);
      const data= await userCollection.create({username,email,password:hashedPassword})
      const Role=data.Role
       const token = jwt.sign({ sub: data._id, Role:Role}, process.env.jwtSecretKey, { expiresIn: '3d' });
      return res.json({user:data,token,created:true})
       }        

    }else{
          //form signup
    const {username,email,password}=req.body
    const existemail=await userCollection.find({email:email})
    if(existemail.length>0){
        const errors={email:"email is already exists"}
        return res.json({errors,created:false})
    }
    console.log(username,email,password);    
        const hashedPassword = await bcrypt.hash(password, 10);
      const data= await userCollection.create({username,email,password:hashedPassword})
      function generateOTP () {
        const digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < 6; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }
        return OTP;
      }
      let mailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user:process.env.EMAIL_ADDRESS,
          pass:process.env.PASSWORD
        }   
      });
      const otp = generateOTP();
      await otpCollection.create({users:data.email,otp:otp})
      let mailOptions = {
        from: "I-club",
        to: email,
        subject: "I-club Verification",
        html: `
                <p>Your OTP for I-club verification: <strong>${otp}</strong></p>
            `,   
      };
  
      mailTransporter.sendMail(mailOptions, (err) => {
        if (err) {
            return res.json({ errors: 'Error sending the OTP email.' });
        }
        return res.json({ message: 'Check Your Mail for OTP Verification' });
    });
      }  
   } catch (error) {
    res.json({ error, created: false });
   }
}

const GetAllClub=async(req,res,next)=>{
      try {
        const data=await clubCollection.find()
        console.log("latest...",data)
        res.json(data)
      } catch (error) {
        console.error(error);
        return res.status(500).json({ errors: 'Internal server error' });
      }
}

const VerifyOtp = async (req, res, next) => {
  const { otp, email } = req.body;
  try {
      const matchedOtp = await otpCollection.findOne({ users: email, otp: otp });
      if (matchedOtp) {
          const data=await userCollection.findOne({email:email})
          const Role=data.Role
          const token = jwt.sign({ sub: data._id, Role:Role }, process.env.jwtSecretKey, { expiresIn: '3d' });
          // return res.json({ message: 'Matching OTP  found' });
          res.json({data,token,created:true})
      } else {
          return res.json({ errors: 'Invalid OTP ' });
      }
  } catch (error) {
      console.error(error);
      return res.status(500).json({ errors: 'Internal server error' });
  }
};



const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body; 
      const user = await userCollection.findOne({ email: email });
      if (user) {
        if(user.isBlock==true){
          const errors = { email: 'You are blocked by Admin'};
          return res.json({ errors, created: false });
        }
        const Role=user.Role
        if (await bcrypt.compare(password, user.password)) {
          const token = jwt.sign({ sub: user._id, Role:Role }, process.env.jwtSecretKey, { expiresIn: '3d' });
          res.json({userData: user,token, user: true});
        } else {
          const errors = { password: "Password is wrong.." };
          res.json({ errors, user: false });
        }
      } else {
        const errors = { email: "Email does not exist.." };
        res.json({ errors, user: false });
      } 
  } catch (error) {
    res.json({ error: "An error occurred" });
  }
};


const SendEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if the email exists in the database
    const oldUser = await userCollection.findOne({ email: email });
    if (!oldUser) {
      return res.json({ errors: "User does not exist" });
    }
    
     const token=oldUser.password   
    //  const url=process.env.Client_Side_URL
    const link=`${process.env.Client_Side_URL}/reset-password?userId=${oldUser._id}&token=${token}`;
   
    let mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user:process.env.EMAIL_ADDRESS,
        pass:process.env.PASSWORD
      }   
    });

    let mailOptions = {
      from: "I-club",
      to: oldUser.email,
      subject: "I-club Verification",
      html: `
      <p>Click on the following link to reset your password:</p>
      <a href="${link}">${link}</a>`
      
    };

    mailTransporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.log("Error sending email:", err);
        return res.json({ errors: "Error sending the verification email." });
      }

      return res.json({ status:true,success: "Email sent successfully." });
    });
  } catch (error) {
    return res.status(500).json({ errors: "An error occurred while processing the request." });
  }
};
const ResetPassword = async (req, res, next) => {

  console.log(req.query);
  const { userId: id, token } = req.query;
  const oldUser = await userCollection.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ errors: "User does not exist" });
  }
  try {
    
    if(oldUser.password===token){
       res.json({status:true,email:oldUser.email, success: "Verification successful." });
    }else{
      res.json({status:false,  errors: "Not verifiedddd" });
    }
  } catch (error) {
    console.error("Error during verification:", error);
    
  }
};

const SetNewPass=async(req,res,next)=>{
 try {
  const { email } = req.body;
  const {password}=req.body;
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  if (!passwordRegex.test(password)) {
    const errors = { password: 'Enter a valid password' };
    return res.json({ errors, created: false });
  }
  const check=await userCollection.findOne({email:email})
  if(check){
    const hashedPassword = await bcrypt.hash(password, 10);
    await userCollection.updateOne({ email: email }, { $set: { password: hashedPassword } });
      res.json({status:true, success: "updation successful." });
  }else{
    res.json({status:false,errors:"updation failed"}) 
  } 
 } catch (error) {
  console.log("error")
 }
}

const updateProfile=async(req,res,next)=>{
  try {
    const userId = req.userId;
    const {username,gender,phone,address}=req.body
    const userExist=await userCollection.findOne({_id:userId})
    if(userExist){
      await userCollection.updateOne({email:userExist.email},
        {$set:{username:username,gender:gender,phone:phone,address:address}})

        return res.json({status:true,message:"updated successfully"})
    }else{
      return res.json({errors:"user not found"})
    }
  } catch (error) {
    console.log("error")
  }
}


const GetProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userdata = await userCollection.findOne({ _id: userId }).populate('clubs.club')
    res.json({ userdata });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};



const googleoAuth =async (req,res,next)=>{
     const {datas}=req.body
}



module.exports={ImageUpdate,
                userHome,
                userSignup,
                VerifyOtp,
                userLogin,
                googleoAuth,
                SendEmail,
                ResetPassword,
                SetNewPass,
                updateProfile,
                GetProfile,
                GetAllClub}







