const userCollection = require('../model/userModel')
const clubCollection = require('../model/clubModel')
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const sendEmail = require('../sendEmail/emailSend')
const { BulkWriteOperation } = require('mongodb');
const postCollection = require('../model/clubPostModel')
const chatCollection = require('../model/chatModel');
const bcrypt = require('bcrypt');
const axios = require('axios');
const regclub = async (req, res, next) => {
  try {
    console.log("reached");
    const userId = req.userId;
    const president=userId
    const { clubName, registerNo, address, category, securityCode, secretory, treasurer } = req.body
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
    // if (presidentIsIn.email === secretory || presidentIsIn.email === treasurer) {
    //   return res.json({
    //     errors: "You will get a president role, so you cant be a treasurer or secretory!"
    //   })
    // }
    if (presidentIsIn.email === secretory) {
      return res.json({
        errors: "You will get a president role, so you cant be a secretory!"
      })
    }
    if (presidentIsIn.email === treasurer) {
      return res.json({
        errors: "You will get a president role, so you cant be a treasurer!"
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
     const userdata=await userCollection.findOne({_id:userId})
     const getclubdata=await clubCollection.findOne({clubName:clubName})
     .populate('president').populate('secretory').populate('treasurer')
     let clubdatas=getclubdata
     let user=userdata._id
     const userRole = userdata.clubs.find(club => club.club.toString() === getclubdata._id.toString())?.role;
     if (!userRole) {
         return res.json({ error: "User role not found for the club" });
     }
     res.json({data:clubdatas,user:user,userRole:userRole})
  } catch (error) {
    next(error);
  }
};

const GetClubAuthority = async (req, res, next) => {
  try {
    const { clubName } = req.query;
    const userId = req.userId;
    const userExist=await userCollection.findOne({_id:userId})
      const clubExist=await clubCollection.findOne({clubName:clubName})
      .populate('president').populate('secretory').populate('treasurer')
    console.log(clubExist);
    // const userRole = userExist.clubs.find(clubItem => clubItem.club.toString() === clubExist._id.toString())?.role;
    // if (!userRole) {
    //     return res.json({ error: "User role not found for the club" });
    // }
    res.json({ data: clubExist });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
};

const AddMember=async(req,res,next)=>{
  try {
    const { clubName, adduser } = req.body;
    const userId=req.userId;
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
        { 
          $addToSet: { members: user._id },
          $pull: { newmember: user.email },
         }
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
    const userExist=await userCollection.findOne({_id:userId})
    const clubExist=await clubCollection.findOne({clubName:clubName}).populate('members')
    const userRole = userExist.clubs.find(clubItem => clubItem.club.toString() === clubExist._id.toString())?.role;
    if (!userRole) {
        return res.json({ error: "User role not found for the club" });
    }
    res.json({clubExist,userRole})
  } catch (error) {
  }
}
const DeleteMember=async(req,res,next)=>{
  try {
    const {id,clubName}=req.body
    const userId=req.userId
    const user=await userCollection.findOne({_id:userId})
    const memberdlt=await userCollection.findOne({_id:id})
    const club = await clubCollection.updateOne({clubName:clubName},{$pull:{members:id}})
  
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

const AddClubProfile=async (req,res,next)=>{
  try {
    const {clubName,imageUrl}=req.body
   await clubCollection.updateOne({clubName:clubName},{$set:{clubimg:imageUrl}})
   return res.json({status:true,message:"Image added successfully"})
  } catch (error) {
  }
}

const AddClubPost = async (req,res,next)=>{
  try {
    const {clubName,postimageUrl,description}=req.body
     const club = await clubCollection.findOne({clubName:clubName})
    if (!club) {
      return res.json({ message: "Club not found" });
    }
    const newPost = new postCollection({
      clubName:club._id,
      postimg:postimageUrl,
      desc:description
    })
    await newPost.save()
    res.json({message:"club post added successfully"})
  } catch (error) {
  }

}

const GetClubProfile = async (req,res,next)=>{
  try {
    const { clubName } = req.query;
    const userId = req.userId;
    const user=await userCollection.findOne({_id:userId})
    const clubExist=await clubCollection.findOne({clubName:clubName}).populate('members')
    console.log(clubExist)
    const userRole = user.clubs.find(clubItem => clubItem.club.toString() === clubExist._id.toString())?.role;
      if (!userRole) {
          return res.json({ errors: "User role not found for the club" });
      }
      const postdata=await postCollection.find({clubName:clubExist._id})
      res.json({clubExist,userRole,postdata})   
  } catch (error) {
  }
}

const DeletePost = async (req, res, next) => {
  try {
    const { postId } = req.body;
    const result = await postCollection.deleteOne({ _id: postId });
    if (result.deletedCount === 1) {
      res.status(200).json({ message: "Post deleted successfully" });
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "An error occurred while deleting the post" });
  }
};

const UpdateClub = async (req, res, next) => {
  try {
    const { category, registerNo, address, about, clubName, club } = req.body;
    const clubExist = await clubCollection.findOne({ clubName: club });
    const clubnameFound = await clubCollection.findOne({ clubName: clubName });
    if (clubnameFound) {
      if (
        club === clubnameFound.clubName &&
        clubExist.president.toString() === clubnameFound.president.toString() &&
        clubExist.secretory.toString() === clubnameFound.secretory.toString() &&
        clubExist.registerNo.toString() === clubnameFound.registerNo
      ) {
        await clubCollection.updateOne(
          { _id: clubExist._id },
          {
            $set: {
              clubName: clubName,
              about: about,
              address: address,
              category: category,
              registerNo: registerNo,
            },
          }
        );
        await userCollection.updateMany(
          { "clubs.club": clubExist._id  },
          {$set: {"clubs.$.clubName": clubName},
          }
        );

        await userCollection.updateOne(
          { _id: clubExist.president, "clubs.club": clubExist._id  },
          {$set: {"clubs.$.clubName": clubName},
          }
        );

        await userCollection.updateOne(
          { _id: clubExist.secretory, "clubs.club": clubExist._id },
          {$set: {"clubs.$.clubName": clubName},
          }
        );

        await userCollection.updateOne(
          { _id: clubExist.treasurer, "clubs.club": clubExist._id },
          {$set: {"clubs.$.clubName": clubName},
          }
        );
      } else {
        return res.json({ message: "Club name is not available" });
      }
    } else {
      await clubCollection.updateOne(
        { _id: clubExist._id },
        {
          $set: {
            clubName:clubName,
            about: about,
            address: address,
            category: category,
            registerNo: registerNo,
          },
        }
      );
      
      await userCollection.updateMany(
        { "clubs.club": clubExist._id  },
        {$set: {"clubs.$.clubName": clubName},
        }
      );
      
      await userCollection.updateOne(
        { _id: clubExist.president, "clubs.club": clubExist._id },
        {$set: {"clubs.$.clubName": clubName},
        }
      );

      // Update secretary's club data
      await userCollection.updateOne(
        { _id: clubExist.secretory, "clubs.club": clubExist._id },
        {
          $set: {"clubs.$.clubName": clubName},
        }
      );

      // Update treasurer's club data
      await userCollection.updateOne(
        { _id: clubExist.treasurer, "clubs.club": clubExist._id },
        {$set: {"clubs.$.clubName": clubName},
        }
      );
    }
    
    const getclub = await clubCollection.findOne({ _id: clubExist._id });
    res.json({ getclub, message: "successfully updated" });
  } catch (error) {
    res.json({ message: "An error occurred during club update" });
  }
};

const GetClubForm=async(req,res,next)=>{
  try {
    const {clubName}=req.query
    const club=await clubCollection.findOne({clubName:clubName})
    res.json({club})
  } catch (error) {
  }
}

const ChangeCommitte=async(req,res,next)=>{
  try {
    const {clubName,president,secretory,treasurer}=req.body
    const userId=req.userId
    const user=await userCollection.findOne({_id:userId})
    let presidentExist = await userCollection.findOne({ email: president });
    if (!presidentExist) {
      return res.json({
        errors: "There is no such person for being president"
      });
    }
    let secretoryExist = await userCollection.findOne({ email: secretory });
    if (!secretoryExist) {
      return res.json({
        errors: "There is no such person for being secretory"
      });
    }
    let treasurerExist = await userCollection.findOne({ email: treasurer });
    if (!treasurerExist) {
      return res.json({
        errors: "There is no such person for being treasurer"
      });
    }
    let club = await clubCollection.findOne({clubName:clubName});
    let data = new Set();
    data.add(club.president.toString())
    data.add(club.secretory.toString())
    data.add(club.treasurer.toString())
    club.members.forEach((member)=>{
      data.add(member.toString())
    })  
    if(!data.has(presidentExist._id.toString())||!data.has(secretoryExist._id.toString())||!data.has(treasurerExist._id.toString())){
      res.json({errors: "Club admins can't be new joiners"})
    }
    if (!(presidentExist._id.toString() === club.president.toString() || secretoryExist._id.toString() === club.president.toString() || treasurerExist._id.toString() === club.president.toString())) {
      await clubCollection.updateOne({ _id: club._id }, { $push: { members: club.president } });
      await userCollection.updateOne(
        { _id: club.president._id, 'clubs.club': club._id },
        { $set: { 'clubs.$.role': 'member' } }
      );
    }
    if (!(secretoryExist._id.toString() === club.secretory.toString() || secretoryExist._id.toString() === club.secretory.toString() || secretoryExist._id.toString() === club.secretory.toString())) {
      await clubCollection.updateOne({ _id: club._id }, { $push: { members: club.secretory } });
      await userCollection.updateOne(
        { _id: club.secretory._id, 'clubs.club': club._id },
        { $set: { 'clubs.$.role': 'member' } }
      );
    }
    if (!(treasurerExist._id.toString() === club.treasurer.toString() || treasurerExist._id.toString() === club.treasurer.toString() || treasurerExist._id.toString() === club.treasurer.toString())) {
      await clubCollection.updateOne({ _id: club._id }, { $push: { members: club.treasurer } });
      await userCollection.updateOne(
        { _id: club.treasurer._id, 'clubs.club': club._id },
        { $set: { 'clubs.$.role': 'member' } }
      );
    }
    
    let update = await clubCollection.updateOne({ _id:club._id }, { $set: { president: presidentExist._id, secretory: secretoryExist._id, treasurer: treasurerExist._id } });
     // Find the updated club details
     let clubDetails = await clubCollection.findOne({ _id: club._id });

     if (clubDetails.members.includes(presidentExist._id)) {
      await clubCollection.updateOne({ _id: club._id }, { $pull: { members: presidentExist._id } });
      await userCollection.updateOne(
        { _id: presidentExist._id, 'clubs.club': club._id },
        { $set: { 'clubs.$.role': 'president' } }
      );
    }
    if (clubDetails.members.includes(secretoryExist._id)) {
      await clubCollection.updateOne({ _id:club._id }, { $pull: { members: secretoryExist._id } });
      await userCollection.updateOne(
        { _id: secretoryExist._id, 'clubs.club': club._id },
        { $set: { 'clubs.$.role': 'secretory' } }
      );
    }
    if (clubDetails.members.includes(treasurerExist._id)) {
      await clubCollection.updateOne({ _id:club._id }, { $pull: { members: treasurerExist._id } });
      await userCollection.updateOne(
        { _id: treasurerExist._id, 'clubs.club': club._id },
        { $set: { 'clubs.$.role': 'treasurer' } }
      );
    }
    sendEmail(presidentExist.email, `I-club Commitee Change",'Hello,\n\nSubject: Invitation to Join as President - ${clubDetails.clubName}\n\nI hope this email finds you in good spirits. On behalf of ${clubDetails.clubName},  warmest congratulations and invite you to join our club as the new President.\n\n\n\nBest regards,\n\n${user.username}\n${user.email}`)
    sendEmail(secretoryExist.email, `I-club Commitee Change",'Hello,\n\nSubject: Invitation to Join as Secretory - ${clubDetails.clubName}\n\nI hope this email finds you in good spirits. On behalf of ${clubDetails.clubName},  warmest congratulations and invite you to join our club as the new Secretory.\n\n\n\nBest regards,\n\n${user.username}\n${user.email}`)
    sendEmail(treasurerExist.email, `I-club Commitee Change",'Hello,\n\nSubject: Invitation to Join as Treasurer - ${clubDetails.clubName}\n\nI hope this email finds you in good spirits. On behalf of ${clubDetails.clubName},  warmest congratulations and invite you to join our club as the new TReasurer.\n\n\n\nBest regards,\n\n${user.username}\n${user.email}`)
    res.json({update,message:`Successfully created ${club.clubName} new  committe`})
  } catch (error) {
  }
}

const SearchClubs = async (req, res, next) => {
  try {
    const userId = req.userId; // Assuming you have userId available
    const user = await userCollection.findOne({ _id: userId });
    const { q } = req.query;
    const regex = new RegExp(q, 'i');
    
    // Find clubs that match the search query
    const clubs = await clubCollection.find({ clubName: regex });

    const clubsWithUserRole = clubs.map(club => {
      const userClub = user.clubs.find(userClub => userClub.club.toString() === club._id.toString());
      if (userClub) {
        return { ...club._doc, userRole: userClub.role };
      } else {
        return club._doc;
      }
    });

    res.json(clubsWithUserRole);
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};

const MakeRequest = async (req,res,next)=>{
  try {
    const userId=req.userId
    const {clubId}=req.body
    const user=await userCollection.findOne({_id:userId})
    const email=user.email
    await clubCollection.updateOne(
      { _id: clubId },
      { $addToSet: { newmember: email } }
    );
    return res.json({message:"request done"})
  } catch (error) {
  }

}

const FetchCount = async (req, res, next) => {
  const { clubName } = req.query;
  try {
    const club = await clubCollection.findOne({ clubName: clubName });
    if (!club) {
      return res.json({ error: "Club not found" });
    }
    const newMemberCount = club.newmember.length;
    res.json({ newMemberCount });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};


const LeaveClub=async(req,res,next)=>{
  try {
    const {clubName}=req.body
    const userId=req.userId
    const club=await clubCollection.findOne({clubName:clubName})
    await userCollection.updateOne(
      { _id: userId },
      { $pull: { clubs: { club: club._id } } }
    );
    await clubCollection.updateOne({_id:club._id},
      {$pull:{members:userId}})
    console.log("removed from both club and user collection ");
    res.json({message:`You left from ${clubName}`})
  } catch (error) {
    
  }
}

 const PostLike = async (req,res,next)=>{
  const userId=req.userId
  const {clubName,postId}=req.body
  const data = await postCollection.updateOne({_id:postId},{$addToSet:{likes:userId}})
  console.log(data);
  res.json({message:"setttt"})
 }

 const GetNews =async (req,res,next)=>{
  try {
 
    const apiKey = '1c58477c8f25464b99f032ff79cfb601'
    const apiUrl = `https://newsapi.org/v2/top-headlines?country=in&category=sports&apiKey=${apiKey}`
    const response = await axios.get(apiUrl);
    const newsData = response.data.articles;
    console.log(newsData)
    res.json(newsData);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'An error occurred while fetching news.' });
  }
 }
module.exports = { regclub,
                   joinClub,
                   ClubHome,
                   GetClubAuthority,
                   AddMember,
                   GetMember,
                   DeleteMember,
                   AddClubProfile,
                   AddClubPost,
                   GetClubProfile,
                   UpdateClub,
                   GetClubForm,
                   ChangeCommitte,
                   SearchClubs,
                   MakeRequest,
                   FetchCount,
                   DeletePost,
                   LeaveClub,
                   PostLike,
                   GetNews}







