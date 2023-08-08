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
module.exports = { regclub, joinClub,ClubHome}






















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
