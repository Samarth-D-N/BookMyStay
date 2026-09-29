const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const passport = require("passport");
const { isLoggedIn } = require("../middleware.js");
const {saveRedirectUrl}=require("../middleware.js");

router.get("/signup", (req, res) => {
  res.render("./users/signup.ejs");
});

router.post(
  "/signup",
  wrapAsync(async (req, res) => {
    try {
      let { username, email, password } = req.body.user;
      let userData = new User({ username, email });
      let registerdUser=await User.register(userData, password);
      req.login(registerdUser,(err)=>{
        if(err){
          return next(err);
        }
        req.flash("success", "Welcome to BookMyStay!");
      res.redirect("/listings");
      })
      
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/signup");
    }
  }),
);

router.get("/login", (req, res) => {
  res.render("./users/login.ejs");
});

router.post(
  "/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (req, res) => {
    req.flash("success", "Welcome back to BookMyStay");
    let redirectUrl=res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
  },
);


router.get("/logout",isLoggedIn,(req,res,next)=>{
    req.logout((err)=>{
        if(err){
         return next(err);
        }
        else{
            req.flash("success","You are successfuly Logged Out!");
            res.redirect("/listings");
        }
        
    })
    
})

module.exports = router;
