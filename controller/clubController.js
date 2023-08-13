const userCollection = require('../model/userModel')
const clubCollection = require('../model/clubModel')
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const sendEmail = require('../sendEmail/emailSend')
const { BulkWriteOperation } = require('mongodb');
const bcrypt = require('bcrypt');

const regclub = async (req, res, next) => {
  try {
    console.log("reached");
    const userId = req.userId;
    const president=userId
    const { clubName, registerNo, address, category, securityCode, secretory, treasurer } = req.body
    console.log(clubName, registerNo, address, category, securityCode, secretory, treasurer, president)
    const bulkUpdateOperations = [];
    const clubexist = await clubCollection.findOne({ clubName: clubName })
    if (clubexist) {
      return res.json({ errors: "This club is already exist" })
    }
    

    let presidentIsIn = await userCollection.findOne({ _id: userId })
    let secretoryIsIn = await userCollection.findOne({ email: secretory })
    let treasurerIsIn = await userCollection.findOne({ email: treasurer })
    if (!presidentIsIn) {
      return res.json({
        errors: "President not available"
      })
    }
    if (!secretoryIsIn) {
      return res.json({
        errors: "secretory not available"
      })
    }
    if (!treasurerIsIn) {
      return res.json({
        errors: "treasurer not available"
      })
    }
    if (presidentIsIn.email === secretory || presidentIsIn.email === treasurer) {
      return res.json({
        errors: "You will get a president role, so you cant be a treasurer or secretory!"
      })
    }
    
      const saltRounds = await bcrypt.genSalt(10)
      const hashedcode = await bcrypt.hash(securityCode, saltRounds)
    const newclubs = new clubCollection({
      clubName: clubName,
      registerNo: registerNo,
      address: address,
      category: category,
      securityCode: hashedcode,
      secretory: secretoryIsIn._id,
      treasurer: treasurerIsIn._id,
      president: presidentIsIn._id
    })
    await newclubs.save();
     
    bulkUpdateOperations.push({
      updateOne: {
        filter: { _id: secretoryIsIn._id, 'clubs.clubName': { $ne: clubName }, 'clubs.password': { $ne: securityCode } },
        update: { $addToSet: { clubs: { $each: [{ clubName: clubName, password: securityCode, club: newclubs._id,role:"secretory" }] } } }
      }
    });

    bulkUpdateOperations.push({
      updateOne: {
        filter: { _id: presidentIsIn._id, 'clubs.clubName': { $ne: clubName }, 'clubs.password': { $ne: securityCode } },
        update: { $addToSet: { clubs: { $each: [{ clubName: clubName, password: securityCode, club: newclubs._id,role:"president" }] } } }
      }
    });

    bulkUpdateOperations.push({
      updateOne: {
        filter: { _id: treasurerIsIn._id, 'clubs.clubName': { $ne: clubName }, 'clubs.password': { $ne: securityCode } },
        update: { $addToSet: { clubs: { $each: [{ clubName: clubName, password: securityCode, club: newclubs._id,role:"treasurer" }] } } }
      }
    });
    await userCollection.bulkWrite(bulkUpdateOperations);
      
    await sendEmail(
      secretoryIsIn.email,
      `I-club Registration`,
      `Hi Dear,\n\nSubject: Invitation to become a Secretary - ${clubName}\n\n
      I hope this email finds you well. On behalf of ${clubName}, invite you to join our club as the new Secretory.\n\n\n\nWarm regards,\n\n${presidentIsIn.username}\n${presidentIsIn.email}`
    );
    await sendEmail(
      treasurerIsIn.email,
      `I-club Registration`,
      `Hi Dear,\n\nSubject: Invitation to become a Treasurer - ${clubName}\n\n
      I hope this email finds you well. On behalf of ${clubName}, invite you to join our club as the new Secretory.\n\n\n\nWarm regards,\n\n${presidentIsIn.username}\n${presidentIsIn.email}`
    );

    return res.json({ created:true, message: "Your club Is registered Successfully",newclubs })
  } catch (error) {
    res.json({ errors: "club creation failed" })
  }
}
const joinClub = async (req, res, next) => {
  const userId = req.userId;
  const { clubName, securityCode,} = req.body;

  try {
    let clubExist = await clubCollection.findOne({ clubName: clubName });

    if (!clubExist) {
      return res.json({ message: "There is no such club" });
    }

    if (!await bcrypt.compare(securityCode, clubExist.securityCode)) {
      return res.json({ message: "Security code is not matching" });
    }

    let userExist = await userCollection.findOne({_id:userId ,clubs: {$elemMatch: {
          clubName: clubExist.clubName,password: clubExist.securityCode,club: clubExist._id,
        },
      },
  });

    if (!userExist) {
      await userCollection.updateOne({ _id: userId },{$addToSet: {clubs: {$each: [ {
        clubName: clubExist.clubName,password: clubExist.securityCode,club: clubExist._id,role: "member",
     }]}}});
      console.log("Inserted into user's clubs array");
    }

    const userCheck = await userCollection.findOne({ _id: userId });

    // Check if the user is not a president, secretary, treasurer, or member
    if (
      clubExist.president.toString() !== userCheck._id.toString() &&
      clubExist.secretory.toString() !== userCheck._id.toString() &&
      clubExist.treasurer.toString() !== userCheck._id.toString() &&
      !clubExist.members.includes(userCheck._id.toString())
    ) {
      await clubCollection.updateOne(
        { _id: clubExist._id },
        { $addToSet: { members: userCheck._id } }
      );
    }

    // Fetch the updated club data
    clubExist = await clubCollection.findOne({ clubName: clubName });

    let userRole = "member";
    const userIdString = userCheck._id.toString();

    if (
      clubExist.president.toString() === userIdString ||
      clubExist.secretory.toString() === userIdString ||
      clubExist.treasurer.toString() === userIdString ||
      clubExist.members.includes(userIdString)
    ) {
      if (clubExist.president.toString() === userIdString) {
        userRole = "president";
      } else if (clubExist.secretory.toString() === userIdString) {
        userRole = "secretory";
      } else if (clubExist.treasurer.toString() === userIdString) {
        userRole = "treasurer";
      }

      return res.json({
        auth: true,userRole: userRole,id: userIdString,updatedClubData: clubExist});
    } else {
      return res.json({ notallow: true });
    }
  } catch (error) {
    console.error(error);
    res.json({ error, message: "An error occurred" });
  }
};

const ClubHome = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { clubName } = req.body;
    console.log( clubName);
     const userdata=await userCollection.findOne({_id:userId})
     const getclubdata=await clubCollection.findOne({clubName:clubName})
     .populate('president').populate('secretory').populate('treasurer')
     let clubdatas=getclubdata
     let user=userdata._id
     console.log(userdata)
     res.json({data:clubdatas,user:user})
  } catch (error) {
    next(error);
  }
};

const GetClubAuthority = async (req, res, next) => {
  try {
    const { clubName } = req.query;
    const userId = req.userId;
    console.log("authority", clubName, userId);
    const userExist=await userCollection.findOne({_id:userId})
    // Find the club by clubname and populate the specified fields
      const clubExist=await clubCollection.findOne({clubName:clubName})
      .populate('president').populate('secretory').populate('treasurer')
    console.log(clubExist);
    // const userRole = userExist.clubs.find(clubItem => clubItem.club.toString() === clubExist._id.toString())?.role;
    // if (!userRole) {
    //     return res.json({ error: "User role not found for the club" });
    // }
    res.json({ data: clubExist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

const AddMember=async(req,res,next)=>{
  try {
    const { clubName, adduser } = req.body;
    const userId=req.userId;
    console.log("ADDMEMMBERRR",clubName,userId,adduser);
    const club=await clubCollection.findOne({clubName:clubName})
    console.log(club)
    let head = await userCollection.findOne({ _id: userId });
    const user=await userCollection.findOne({email:adduser})
    if (!user) {
      return res.json({
        errors: "There is no such user"
      });
    }
    const memb=user.username
    console.log(user)
      if( club.secretory.toString() === user._id.toString() ||
          club.president.toString() === user._id.toString() ||
          club.treasurer.toString() === user._id.toString() ){
        return res.json({
          errors: "You are a main part of this club so, can't add you as a member"
        });
    }
    if (club.members.includes(user._id)) {
      return res.json({
        errors: "User is already a member of this club",
      });
    } else{
      await clubCollection.updateOne(
        { _id:club._id},
        { $addToSet: { members: user._id } }
      );
      sendEmail(
      user.email,
      `I-club Invitation`,
      `Hello,\n\nSubject: Invitation to Join as Member - ${club.clubName}\n\nI hope this email finds you in good spirits. On behalf of ${club.clubName}, our warmest congratulations and invite you to join our club as the new Member.\n\n\n\nBest regards,\n\n${head.username}\n${head.email}`
    );
    const isClubAlreadyAdded = user.clubs.some(
      (club) => club.clubName === clubName
    );

    if (isClubAlreadyAdded) {
      return res.json({
        errors: "User is already a member of this club",
      });
    }else{
      await userCollection.updateOne({ _id: user._id },
        {$addToSet: {clubs: {$each: [ {
        clubName: club.clubName,password: club.securityCode,club: club._id,role: "member",
     }]}}});
    }


    console.log("Inserted into user's clubs array");
    }
    let gettingMember = await clubCollection.findById(club._id)
          .populate('members')
      res.json({message:`Succesfully added ${memb} to club`,data:gettingMember})
  } catch (error) {
    console.log("addmember Error occur")
  }
}

const GetMember=async(req,res,next)=>{
  try {
    const { clubName } = req.query;
    const userId=req.userId
    console.log("getmember",clubName,userId);
    const userExist=await userCollection.findOne({_id:userId})
    const clubExist=await clubCollection.findOne({clubName:clubName}).populate('members')
    console.log("-------------------",clubExist)
    const userRole = userExist.clubs.find(clubItem => clubItem.club.toString() === clubExist._id.toString())?.role;
    if (!userRole) {
        return res.json({ error: "User role not found for the club" });
    }
    res.json({clubExist,userRole})
  } catch (error) {
    console.log("error occur in get member")
  }
}
const DeleteMember=async(req,res,next)=>{
  try {
    const {id,clubName}=req.body
    const userId=req.userId
    const user=await userCollection.findOne({_id:userId})
    console.log(id,clubName);
    const memberdlt=await userCollection.findOne({_id:id})
    const club = await clubCollection.updateOne({clubName:clubName},{$pull:{members:id}})
   console.log(club);
  
   const memb=memberdlt.username
    sendEmail(
      memberdlt.email,
      `I-club `,
      `Hello,\n\nSubject: Membership cancel- ${clubName}\n\n Your membership has been cancelled from ${clubName},\n\n\n\nBest regards,\n\n${user.username}\n${user.email}`
    );
    const clubs = await clubCollection.findOne({clubName:clubName})
    const clubIdAsString = clubs._id.toString();

    // Remove the specific club object from the user's clubs array
    await userCollection.updateOne(
      { _id: id },
      { $pull: { clubs: { club: clubIdAsString } } }
    );
    
    return res.json({message:`Successfully removed ${memb}  from club`})
    
    
    }catch (error) {
      console.error(error);
      res.json({ errors: 'An error occurred during member deletion' });
    }
}
module.exports = { regclub,
                   joinClub,
                   ClubHome,
                   GetClubAuthority,
                   AddMember,
                   GetMember,
                   DeleteMember}






















// const regclub =async (req, res,next) => {
//   try {
//     console.log("reached");
//     const { clubName, registerNo, address, category, securityCode, secretory, treasurer, president } = req.body;
//     console.log(clubName, registerNo, address, category, securityCode, secretory, treasurer, president);

//     // Find users based on their emails
//     let presidentIsIn = await userCollection.findOne({ email: president });
//     let secretoryIsIn = await userCollection.findOne({ email: secretory });
//     let treasurerIsIn = await userCollection.findOne({ email: treasurer });

//     if (!presidentIsIn) {
//       return res.json({ message: "President not available" });
//     }
//     if (!secretoryIsIn) {
//       return res.json({ message: "secretory not available" });
//     }
//     if (!treasurerIsIn) {
//       return res.json({ message: "treasurer not available" });
//     }
//     if (presidentIsIn.email === secretory || presidentIsIn.email === treasurer) {
//       return res.json({ message: "You will get a president role, so you cant be a treasurer or secretory!" });
//     }

//     // Create a new club instance using the Club model
//     const club = newClub({
//       clubName: clubName,
//       registerNo: registerNo,
//       address: address,
//       category: category,
//       securityCode: securityCode,
//       secretory: secretoryIsIn._id,
//       treasurer: treasurerIsIn._id,
//       president: presidentIsIn._id,
//     });

//     // Save the club instance to the database
//     await clubCollection.save();

//     res.json({ message: "Your club is registered Successfully", club });
//     console.log(club);
//   } catch (error) {
//     res.json({ errors: "club creation failed" });
//   }
// }


// const regclub = async (req, res, next) => {
//   try {
//     console.log("reached");
//     const { clubName, registerNo, address, category, securityCode, secretory, treasurer, president } = req.body
//     console.log(clubName, registerNo, address, category, securityCode, secretory, treasurer, president)
//     const bulkUpdateOperations = [];
//     const clubexist = await clubCollection.findOne({ clubName: clubName })
//     if (clubexist) {
//       return res.json({ errors: "This club is already exist" })
//     }
    

//     let presidentIsIn = await userCollection.findOne({ email: president })
//     let secretoryIsIn = await userCollection.findOne({ email: secretory })
//     let treasurerIsIn = await userCollection.findOne({ email: treasurer })
//     if (!presidentIsIn) {
//       return res.json({
//         errors: "President not available"
//       })
//     }
//     if (!secretoryIsIn) {
//       return res.json({
//         errors: "secretory not available"
//       })
//     }
//     if (!treasurerIsIn) {
//       return res.json({
//         errors: "treasurer not available"
//       })
//     }
//     if (presidentIsIn.email === secretory || presidentIsIn.email === treasurer) {
//       return res.json({
//         errors: "You will get a president role, so you cant be a treasurer or secretory!"
//       })
//     }
//     const newclubs = new clubCollection({
//       clubName: clubName,
//       registerNo: registerNo,
//       address: address,
//       category: category,
//       securityCode: securityCode,
//       secretory: secretoryIsIn._id,
//       treasurer: treasurerIsIn._id,
//       president: presidentIsIn._id
//     })
//     await newclubs.save();
    
//     await userCollection.updateOne(
//       { _id: secretoryIsIn._id, "clubs.clubName": { $ne: clubName }, "clubs.password": { $ne: securityCode } },
//       { $addToSet: { clubs: { $each: [{ clubName: clubName, password: securityCode, club: newclubs._id }] } } }
//     );

//     await userCollection.updateOne(
//       { _id: presidentIsIn._id, "clubs.clubName": { $ne: clubName }, "clubs.password": { $ne: securityCode } },
//       { $addToSet: { clubs: { $each: [{ clubName: clubName, password: securityCode, club: newclubs._id }] } } }
//     );

//     await userCollection.updateOne(
//       { _id: treasurerIsIn._id, "clubs.clubName": { $ne: clubName }, "clubs.password": { $ne: securityCode } },
//       { $addToSet: { clubs: { $each: [{ clubName: clubName, password: securityCode, club: newclubs._id }] } } }
//     );
//     await sendEmail(
//       secretoryIsIn.email,
//       `I-club Registration`,
//       `Hi Dear,\n\nSubject: Invitation to become a Secretary - ${clubName}\n\n
//       I hope this email finds you well. On behalf of ${clubName}, invite you to join our club as the new Secretory.\n\n\n\nWarm regards,\n\n${presidentIsIn.username}\n${presidentIsIn.email}`
//     );
//     await sendEmail(
//       treasurerIsIn.email,
//       `I-club Registration`,
//       `Hi Dear,\n\nSubject: Invitation to become a Treasurer - ${clubName}\n\n
//       I hope this email finds you well. On behalf of ${clubName}, invite you to join our club as the new Secretory.\n\n\n\nWarm regards,\n\n${presidentIsIn.username}\n${presidentIsIn.email}`
//     );

//     return res.json({ status: "email sended successfully", message: "Your club Is registered Successfully", newclubs })
//   } catch (error) {
//     res.json({ errors: "club creation failed" })
//   }
// }




// const joinClub = async (req, res, next) => {
//   const { clubName, securityCode, user } = req.body;

//   try {
//     let clubExist = await clubCollection.findOne({ clubName: clubName });

//     if (!clubExist) {
//       return res.json({ message: "There is no such club" });
//     }

//     if (!await bcrypt.compare(securityCode, clubExist.securityCode)) {
//       return res.json({ message: "Security code is not matching" });
//     }

//     let userExist = await userCollection.findOne({email: user,clubs: {$elemMatch: {
//           clubName: clubExist.clubName,password: clubExist.securityCode,club: clubExist._id,
//         },
//       },
//   });

//     if (!userExist) {
//       await userCollection.updateOne({ email: user },{$addToSet: {clubs: {$each: [ {
//         clubName: clubExist.clubName,password: clubExist.securityCode,club: clubExist._id,role: "member",
//      }]}}});
//       console.log("Inserted into user's clubs array");
//     }

//     const userCheck = await userCollection.findOne({ email: user });

//     await clubCollection.updateOne({ _id: clubExist._id },
//       { $addToSet: { members: userCheck._id } });

//     // Fetch the updated club data
//     clubExist = await clubCollection.findOne({ clubName: clubName });

//     let userRole = "member";
//     const userIdString = userCheck._id.toString();

//     if (
//       clubExist.president.toString() === userIdString ||
//       clubExist.secretory.toString() === userIdString ||
//       clubExist.treasurer.toString() === userIdString ||
//       clubExist.members.includes(userIdString)
//     ) {
//       if (clubExist.president.toString() === userIdString) {
//         userRole = "president";
//       } else if (clubExist.secretory.toString() === userIdString) {
//         userRole = "secretory";
//       } else if (clubExist.treasurer.toString() === userIdString) {
//         userRole = "treasurer";
//       }

//       return res.json({
//         auth: true,userRole: userRole,id: userIdString,updatedClubData: clubExist});
//     } else {
//       return res.json({ notallow: true });
//     }
//   } catch (error) {
//     console.error(error);
//     res.json({ error, message: "An error occurred" });
//   }
// };



//////ADDMEMBER///////
// const AddMember=async(req,res,next)=>{
//   try {
//     const { clubName, adduser } = req.body;
//     const userId=req.userId;
//     console.log("ADDMEMMBERRR",clubName,userId,adduser);
//     const club=await clubCollection.findOne({clubName:clubName})
//     console.log(club)
//     let head = await userCollection.findOne({ _id: userId });
//     const user=await userCollection.findOne({email:adduser})
//     const memb=user.username
//     console.log(user)
//     if (!user) {
//       return res.json({
//         errors: "There is no such user"
//       });
//     }
//       if( club.secretory.toString() === user._id.toString() ||
//           club.president.toString() === user._id.toString() ||
//           club.treasurer.toString() === user._id.toString() ){
//         return res.json({
//           errors: "You are a main part of this club so, can't add you as a member"
//         });
//     }
//     if (club.members.includes(user._id)) {
//       return res.json({
//         errors: "User is already a member of this club",
//       });
//     } else{
//       await clubCollection.updateOne(
//         { _id:club._id},
//         { $addToSet: { members: user._id } }
//       );
//       sendEmail(
//       user.email,
//       `I-club Invitation`,
//       `Hello,\n\nSubject: Invitation to Join as Member - ${club.clubName}\n\nI hope this email finds you in good spirits. On behalf of ${club.clubName}, our warmest congratulations and invite you to join our club as the new Member.\n\n\n\nBest regards,\n\n${head.username}\n${head.email}`
//     );
//     const isClubPresent = user.clubs.some(
//       (club) => club.clubName === club.clubName && club.club.toString() === club._id.toString()
//     );
//     if(!isClubPresent){
//       await userCollection.updateOne({ _id: user._id },
//         {$addToSet: {clubs: {$each: [ {
//         clubName: club.clubName,password: club.securityCode,club: club._id,role: "member",
//      }]}}});
//     }
//     console.log("Inserted into user's clubs array");
//     }
//     let gettingMember = await clubCollection.findById(club._id)
//           .populate('members')
//       res.json({message:`Succesfully added ${memb} to club`,data:gettingMember})
//   } catch (error) {
//     console.log("addmember Error occur")
//   }
// }
