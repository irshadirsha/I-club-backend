const userCollection =require ('../model/userModel')
const jwt = require('jsonwebtoken');
const bcrypt =require('bcrypt')
const nodemailer = require("nodemailer");
require('dotenv').config();
// const { ObjectId } = require('mongodb');
// const cloudinary = require('cloudinary').v2;

const  ImageUpdate=async(req,res,next)=>{
  const { imageUrl } = req.body;
  const user=req.userId
  console.log("url",imageUrl,user);
  await userCollection.updateOne({_id:user},{$set:{image:imageUrl}})
  console.log("image updated successfully");
  return res.json({status:true,message:"image updated successfully"})
}

const userHome = (req,res)=>{
}

const userSignup = async (req,res,next)=>{
   try {
    console.log("signup------------");
   
    const isGoogleSignup = req.body.isGoogleSignup;
    // google signup
    if (isGoogleSignup) {
      const {username,email,password}=req.body
      
      const existemail=await userCollection.findOne({email:email})
      console.log("Google",existemail);
       if(existemail){
        console.log("",existemail);
        const token = jwt.sign({ sub: existemail._id }, process.env.jwtSecretKey, { expiresIn: '3d' });
        console.log(token,"---------------------------");
        res.json({ user:existemail,token, created: true });
       }else{
        const hashedPassword = await bcrypt.hash(password, 10);
      const data= await userCollection.create({username,email,password:hashedPassword})
      console.log("inserted succesfully",data);
       const token = jwt.sign({ sub: data._id }, process.env.jwtSecretKey, { expiresIn: '3d' });
      return res.json({user:data,token,created:true})
       }        

    }else{
          //form signup
    const {username,email,password}=req.body
    console.log("else case",username,email,password);
    const existemail=await userCollection.find({email:email})
   console.log(existemail);

    if(existemail.length>0){
        const errors={email:"email is already exists"}
        return res.json({errors,created:false})
    }
    console.log(username,email,password);
     
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!usernameRegex.test(username)) {
        const errors = { username: 'Enter a valid username' };
        return res.json({ errors, created: false });
      }
      if (!emailRegex.test(email)) {
        const errors = { email: 'Enter a valid email' };
        return res.json({ errors, created: false });
      }
      if (!passwordRegex.test(password)) {
        const errors = { password: 'Enter a valid password' };
        return res.json({ errors, created: false });
      }else{     
      
        const hashedPassword = await bcrypt.hash(password, 10);
      const data= await userCollection.create({username,email,password:hashedPassword})
       const token = jwt.sign({ sub: data._id }, process.env.jwtSecretKey, { expiresIn: '3d' });
       res.json({data,token,created:true})
      console.log(token);
      }  
    
    }
    
   } catch (error) {
    res.json({ error, created: false });
   }
}


const userLogin = async (req, res, next) => {
  try {
    console.log("llllllllllllllllllooooooogin");
    const { email, password } = req.body; 
    console.log(email);
    console.log(password);

    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const errors = { email: 'Enter a valid email' };
      return res.json({ errors, created: false });
    }
    if (!passwordRegex.test(password)) {
      const errors = { password: 'Enter Uppercase with special char'};
      return res.json({ errors, created: false });
    } else {
      const user = await userCollection.findOne({ email: email });
      if (user) {
        if(user.isBlock==true){
          const errors = { Block: 'You are blocked by Admin'};
          return res.json({ errors, created: false });
        }
        console.log("nowwwwww",user);
        if (await bcrypt.compare(password, user.password)) {
          console.log("logged successfully");
          const token = jwt.sign({ sub: user._id }, process.env.jwtSecretKey, { expiresIn: '3d' });
          res.json({userData: user,token, user: true});
        } else {
          console.log("password wrong");
          const errors = { password: "Password wrong" };
          res.json({ errors, user: false });
        }
      } else {
        console.log("email not exist");
        const errors = { email: "Email does not exist" };
        res.json({ errors, user: false });
      }
    }
  } catch (error) {
    console.log("error:", error.message);
    res.json({ error: "An error occurred" });
  }
};


const SendEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log("Email to be sent:", email);

    // Check if the email exists in the database
    const oldUser = await userCollection.findOne({ email: email });
    if (!oldUser) {
      return res.json({ errors: "User does not exist" });
    }
    
     const token=oldUser.password
    console.log(token);
    
   
    
    const link=`http://localhost:5173/reset-password?userId=${oldUser._id}&token=${token}`;
    console.log(link);
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

      console.log("Email sent successfully.");
      return res.json({ status:true,success: "Email sent successfully." });
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ errors: "An error occurred while processing the request." });
  }
};
const ResetPassword = async (req, res, next) => {
  console.log('reset');
  console.log(req.query);
  const { userId: id, token } = req.query;
  console.log("reset dfdfdfv", id, token);
  const oldUser = await userCollection.findOne({ _id: id });
  console.log("finall", oldUser);
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
  console.log(email,password)
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  if (!passwordRegex.test(password)) {
    const errors = { password: 'Enter a valid password' };
    return res.json({ errors, created: false });
  }
  const check=await userCollection.findOne({email:email})
  if(check){
    const hashedPassword = await bcrypt.hash(password, 10);
    await userCollection.updateOne({ email: email }, { $set: { password: hashedPassword } });
    console.log("updated")
      res.json({status:true, success: "updation successful." });
      console.log("jjjjjjjjj");
  }else{
    res.json({status:false,errors:"updation failed"}) 
  } 
 } catch (error) {
  console.log(error)
 }
}

const updateProfile=async(req,res,next)=>{
  try {
    const userId = req.userId;
    const {username,gender,phone,address}=req.body
    console.log(username,gender,phone,address);
    const userExist=await userCollection.findOne({_id:userId})
    console.log(userExist)
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
      // .populate({
      //   path: 'clubs.club',   // Use dot notation to access the club field within clubs array
      //   model: 'clubdata',    // Specify the model to populate from
      //   select: '-members'    // Exclude the members field from clubdata
      // })
      // .exec();
    console.log("get profile-------", userdata);
    res.json({ userdata });
  } catch (error) {
    console.log("Error occurred:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};



// const GetProfile=async(req,res,next)=>{
    
//     try {
//       const userId = req.userId;
//     console.log("USERIDDDDDDDDDDDDD",userId);
//       const userdata=await userCollection.findOne({_id:userId}).populate('club')
//       console.log("get profile-------",userdata);
//           const clubss=userdata.clubs.map(club=>club.club)
//          console.log(clubss);
//        const clubdata=await clubCollection.find() 
//       console.log(clubdata);
//       res.json({userdata})
//     } catch (error) {
//       console.log("error occur")
//     }
// }


const googleoAuth =async (req,res,next)=>{
     const {datas}=req.body
     console.log("newwwwwwwww");
     console.log(datas);
}



module.exports={ImageUpdate,
                userHome,
                userSignup,
                userLogin,
                googleoAuth,
                SendEmail,
                ResetPassword,
                SetNewPass,
                updateProfile,
                GetProfile}



// LINK IN OTP

// const SendEmail=async (req,res,next)=>{
//   try {
//     const {email}=req.body
//   console.log("otppppp",email);
//   const oldUser=await userCollection.findOne({email:email})
//   if(!oldUser){
//     return res.json(errors,"user not exist")
//   }else{
//     console.log(oldUser);
//     // const token=jwt.sign({email:oldUser.email, id:oldUser._id},"Key",{expiresIn: '3d'})
    // const token = jwt.sign({ sub: oldUser._id }, 'Key', { expiresIn: '3d' });
    // const link=`http://localhost:5173/reset-password/${oldUser._id}/${token}'`;
    // console.log(link);
//   }
//   } catch (error) {
    
//   }
  
// }

// const ResetPassword=async (req,res,next)=>{
//       const {id,token}=req.params;
//       console.log("reset v",req.params);
//       console.log(id,token);
//       res.json("done")

// }





// const SendEmail=async (req,res,next)=>{
//   try {
//     const {email}=req.body
//   console.log("otppppp",email);
//   const oldUser=await userCollection.findOne({email:email})
//   if(!oldUser){
//     return res.json(errors,"user not exist")
//   }else{
//     console.log(oldUser);
//     // const token=jwt.sign({email:oldUser.email, id:oldUser._id},"Key",{expiresIn: '3d'})
//     const token = jwt.sign({ sub: oldUser._id }, 'Key', { expiresIn: '3d' });
//     console.log("nodemaileeere")
//     console.log("Token",token)
//     console.log("ID",oldUser._id)
//     const link=`http://localhost:4000/reset-password/${oldUser._id}/${token}`;
//     console.log(link);
//     const transporter = nodemailer.createTransport({
//       host: "smtp.forwardemail.net",
//       port: 465,
//       secure: true,
//       auth: {
//         user: 'irshadalike11@gmail.com',
//         pass: 'trlvooxiijvfoyzj'
//       }
//     });
//     async function main() {
//       const info = await transporter.sendMail({
//         from: 'I-Club', // sender address
//         to: oldUser.email, // list of receivers
//         subject: "Your click the Link", // Subject line
//         text: `link`, // plain text body
//         //  html: "<b>Hello world?</b>",
//       });
    
//       console.log("Message sent: %s", info.messageId);
      
//     }
    
//     main()
//   }
//   } catch (error) {
    
//   }
  
// }


// passemail=req.body.useremail
// console.log("llllllllllllllllllllllllllll");
// if(passemail!=""){
//   console.log(passemail);  
// let checkmail = await userdata.findOne({ useremail:passemail })
// let OtpCode = Math.floor(100000 + Math.random() * 900000)
// otp = OtpCode
// otpEmail = checkmail.useremail
// let mailTransporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "fammsstore11@gmail.com",
//     pass: "paiteegvfdjqecwk"
//   }
// })
// let docs = {
//   from: "fammsstore11@gmail.com",
//   to: otpEmail,
//   subject: "Famms Varification",
//   text: OtpCode + " Famms Verfication Code,Do not share with others"
// }
// mailTransporter.sendMail(docs, (err) => {
//   if (err) {
//     console.log(err)
//   }
// })
// res.redirect('/user-otp')
// }else{
//   req.session.erremail="Invalid Email"
//   res.redirect('/user-otpemail')
// }

// } catch (error) {
// console.log(error);
// next()
// }

// }



// const SendEmail=async (req,res,next)=>{
//   try {
//     const {email}=req.body
//   console.log("otppppp",email);
//   const oldUser=await userCollection.findOne({email:email})
//   if(!oldUser){
//     return res.json({ errors: "user not exist" });
//   }else{
//     console.log(oldUser);
      
// const transporter = nodemailer.createTransport({
//   host: "smtp.forwardemail.net",
//   port: 465,
//   secure: true,
//   auth: {
//     user: 'irshadalike11@gmail.com',
//     pass: 'trlvooxiijvfoyzj'
//   }
// });
// // Function to generate a random OTP
// function generateOTP() {
//   const digits = '0123456789';
//   let OTP = '';
//   for (let i = 0; i < 6; i++) {
//     OTP += digits[Math.floor(Math.random() * 10)];
//   }
//   console.log(OTP);
//   return OTP;
// }


// async function main() {
 
//   const otp = generateOTP();
//   const info = await transporter.sendMail({
//     from: 'I-Club', // sender address
//     to: oldUser.email, // list of receivers
//     subject: "Your One-Time Password (OTP)", // Subject line
//     text: `Your OTP is: ${otp}`, // plain text body
//      html: "<b>Hello world?</b>",
//   });

//   console.log("Message sent: %s", info.messageId);
  
// }

// main()
// .catch(console.error);
//   }
//   } catch (error) {
    
//   }
  
// }

 // Function to generate a random OTP
//  function generateOTP() {
//   const digits = '0123456789';
//   let OTP = '';
//   for (let i = 0; i < 6; i++) {
//     OTP += digits[Math.floor(Math.random() * 10)];
//   }
//   console.log("Generated OTP:", OTP);
//   return OTP;
// }
