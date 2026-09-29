const express=require("express");
const router=express.Router({mergeParams:true});
const wrapAsync=require("../utils/wrapAsync.js");
const ExpressError=require("../utils/ExpressError.js");
const Listing = require("../models/listing");
const Review = require("../models/review");
const {reviewSchema}=require("../schemaJoi.js");
const { isLoggedIn ,isReviewAuthor} = require("../middleware.js");



const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);

  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  }

  next();
};


router.post(
  "/",
  isLoggedIn,
  validateReview,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    let { review } = req.body;
    let result = await Review.insertOne(review);
    result.author=req.user._id;
    listing.review.push(result);
    console.log(result);
    await result.save();
    await listing.save();
        req.flash("success","New Review Added ");

    res.redirect(`/listings/${id}`);
  }),
);

router.delete(
  "/:revid",isLoggedIn,isReviewAuthor,
  wrapAsync(async (req, res) => {
    let { id, revid } = req.params;
    await Review.findByIdAndDelete(revid);
    await Listing.findByIdAndUpdate(id,{$pull:{review:revid}});
        req.flash("success","Review deleted");

    res.redirect(`/listings/${id}`);
  }),
);

module.exports=router;