const Listing=require("./models/listing");
const Review=require("./models/review")

module.exports.isLoggedIn = (req, res, next) => {

    if (!req.isAuthenticated()) {

        if (req.method === "GET" || req.method==="PATCH" || req.method==="PUT" || req.method==="POST") {
            req.session.redirectUrl = req.originalUrl;
        }

        req.flash(
            "error",
            "You must be logged in!"
        );

        return res.redirect("/login");
    }

    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  // owner authorization check
  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You do not have permission!");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

module.exports.isReviewAuthor=async(req,res,next)=>{
  let { id, revid } = req.params;
  let review=await Review.findById(revid);
 if (!review) {
    req.flash("error", "Review not found!");
    return res.redirect(`/listings/${id}`);
  }

  // owner authorization check
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You are not author of this Review");
    return res.redirect(`/listings/${id}`);
  }

  next(); 
}