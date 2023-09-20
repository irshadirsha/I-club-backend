const userCollection = require('../model/userModel')
const clubCollection =require('../model/clubModel')
const notificationCollection = require ('../model/notificationModel')
const jwt = require('jsonwebtoken');
const sendEmail = require('../sendEmail/emailSend')

const SendNote = async (req, res, next) => {
    try {
        const { note, clubName } = req.body;
        const club = await clubCollection.findOne({ clubName: clubName })
            .populate('president').populate('secretory').populate('treasurer');

        if (!club) {
            return res.json({ errors: "Club not found" });
        }

        const presidentEmail = club.president?.email;
        const secretoryEmail = club.secretory?.email;
        const treasurerEmail = club.treasurer?.email;

        // Send emails to president, secretory, and treasurer if their emails exist
        if (presidentEmail) {
            sendEmail(presidentEmail, `Notification from I-club : ${clubName}`, note);
        }
        if (secretoryEmail) {
            sendEmail(secretoryEmail, `Notification from I-club : ${clubName}`, note);
        }
        if (treasurerEmail) {
            sendEmail(treasurerEmail, `Notification from I-club : ${clubName}`, note);
        }

        const clubId = club._id;
        console.log(clubId);

        const notification = new notificationCollection({
            clubId: club._id,
            message: note
        });
        await notification.save();

        const populatedMembers = await clubCollection.findById(clubId)
            .populate({
                path: 'members',
                select: 'email -_id'
            });

        if (populatedMembers) {
            const memberEmails = populatedMembers.members.map((member) => member.email);

            // Sending notifications to all club members
            memberEmails.forEach((memberEmail) => {
                sendEmail(memberEmail, `Notification from I-club : ${clubName}`, note);
            });
        }

        res.json({ message: `Notification sent to all Members of ${clubName} ` });
    } catch (error) {
        console.log("error occur in add note");
    }
};




const GetNote=async(req,res,next)=>{
    const { clubName } = req.query;
    const userId = req.userId;
    const club=await clubCollection.findOne({clubName:clubName})
    if (!club) {
        return res.json({ error: "Club not found" });
    }
    const user = await userCollection.findOne({ _id: userId });
    if (!user) {
        return res.json({ error: "User not found" });
    }
    // const userRole = user.clubs.find(club => club.club.toString() === club._id.toString())?.role;
    const userRole = user.clubs.find(clubItem => clubItem.club.toString() === club._id.toString())?.role;
    if (!userRole) {
        return res.json({ error: "User role not found for the club" });
    }
    const note=await notificationCollection.find({clubId:club._id}).sort({_id:-1})
    res.json({status:true,note,userRole})
}

const DeleteNote= async(req,res,next)=>{
    try {
        const {deleteid}=req.body
        let deleted = await notificationCollection.deleteOne({_id:deleteid})
        res.json({deleted,message:"Notification deleted Successfully"})
    } catch (error) {
      console.log("error occur in note deletion")  
    }
}
module.exports={SendNote,GetNote,DeleteNote}

