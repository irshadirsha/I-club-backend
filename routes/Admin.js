var express = require('express');
var router = express.Router();
const adminController = require ('../controller/adminController')
// const verifyToken = require('../middleware/auth')
const adminVerify= require('../middleware/adminAuth')

router.post('/adminLogin',adminController.adminsingin)
router.post('/admin-dashboard',adminVerify,adminController.adminDashboard)
router.get('/admin-usermanage',adminVerify,adminController.UserManage)
router.post('/block-user',adminVerify,adminController.BlockUser)
router.post('/unblock-user',adminVerify,adminController.UnBlockUser)


router.post('/get-clubdata',adminVerify,adminController.GetClubdata)
router.post('/set-blacklist',adminVerify,adminController.SetBlacklist)
router.get('/club-details',adminVerify,adminController.ViewClubData)
module.exports = router;




/* GET home page. */
// router.get('/', function(req, res, next) {
//    res.send("hello iam backend")
// });