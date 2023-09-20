var express = require('express');
var router = express.Router();
const adminController = require ('../controller/adminController')
const adminVerify= require('../middleware/adminAuth')

router.post('/adminLogin',adminController.adminsingin)
router.get('/get-dashboad',adminVerify,adminController.adminDashboard)
router.get('/admin-usermanage',adminVerify,adminController.UserManage)
router.post('/block-user',adminVerify,adminController.BlockUser)
router.post('/unblock-user',adminVerify,adminController.UnBlockUser)
router.post('/get-clubdata',adminVerify,adminController.GetClubdata)
router.post('/set-blacklist',adminVerify,adminController.SetBlacklist)
router.get('/get-blacklisted',adminVerify,adminController.GetBlacklisted)
router.post('/removeblacklist',adminVerify,adminController.RemoveFromBlacklist)
router.get('/club-details',adminVerify,adminController.ViewClubData)
router.post('/add-banner',adminVerify,adminController.AddBanner)
router.get('/get-bannerdata',adminVerify,adminController.GetBanner)
router.post('/delete-banner',adminVerify,adminController.DeleteBanner)
module.exports = router;


