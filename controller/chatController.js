const userCollection = require('../model/userModel')
const clubCollection = require('../model/clubModel')
const chatCollection = require('../model/chatModel')
const jwt = require('jsonwebtoken');

const SendMessage= async (req,res,next)=>{
    try {
        const userId=req.userId
        const {clubName,text}=req.body
        const user = await userCollection.findOne({_id:userId})
        const club = await clubCollection.findOne({clubName:clubName})
        const chat=new chatCollection({
            user: user._id,
            room: club._id,
            message: text,
            time:Date.now()
        })
        const chats=await chat.save()
        res.json({chats})
    } catch (error) {
        
    }
}

const GetChat= async (req,res,next)=>{
    try {
        const { clubName } = req.query;
        const userId=req.userId
        const club=await clubCollection.findOne({clubName:clubName})
        const getchat=await chatCollection.find({room:club._id}).sort({ date: 1 }).populate('user')
        const getchatWithUserId = getchat.map(message => ({
            ...message.toObject(),
            userId: userId
        }));

        res.json({ response: getchatWithUserId });

    } catch (error) {
        console.log("error occur in get chat");
    }
}

const GetMeetingData=async (req,res,next)=>{
    try {
        const{clubName}=req.query
        const userId=req.userId
        const club= await clubCollection.findOne({clubName:clubName})
        const user=await userCollection.findOne({_id:userId})
        const userRole = user.clubs.find(clubItem => clubItem.club.toString() === club._id.toString())?.role;
    if (!userRole) {
        return res.json({ error: "User role not found for the club" });
    }
    console.log(userRole);
    return res.json({data:userRole, club});
    } catch (error) {
    }
}

const SetConference =async (req,res,next)=>{
    const {link,clubName}=req.body
    const linkadded = await clubCollection.updateOne({clubName:clubName},{$set:{link:link}})
    res.json({linkadded,message:"Link Successfully Shared"})
}
const RemoveLink =async (req,res,next)=>{
    const {clubName}=req.body
    const linkremoved = await clubCollection.updateOne({clubName:clubName},{$set:{link:null}})
    res.json({linkremoved,message:"Link successfully Removed"})
}

module.exports = { SendMessage,
                   GetChat,
                   GetMeetingData,
                   SetConference,
                   RemoveLink}