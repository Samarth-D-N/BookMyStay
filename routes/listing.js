const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schemaJoi.js");
const Listing = require("../models/listing");
const { isLoggedIn, isOwner } = require("../middleware.js");
const multer  = require('multer');
const {storage}= require("../cloudConfig.js")
const upload = multer({storage});
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    let allerr = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, allerr);
  } else {
    next();
  }
};

//home.ejs route
router.get(
  "/",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/home.ejs", { allListings });
  }),
);

//new.ejs route
router.get("/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});

//new.ejs post route
router.post(
  "/",
  isLoggedIn,
  validateListing,upload.single("listing[image]"),
  wrapAsync(async (req, res, next) => {
    let response=await geocodingClient.forwardGeocode({
  query: req.body.listing.location,
  limit: 1
})
  .send();

    let { listing } = req.body;
    listing.owner = req.user._id;
  listing.image = {
    url: req.file.path,
    filename: req.file.filename
};
listing.geometry=response.body.features[0].geometry;
    let saved=await Listing.insertOne(listing);
    console.log(saved);
    req.flash("success", "New listing Created Successfully");
    res.redirect("/listings");
  }),
);

//show.ejs route
router.get(
  "/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const detailListing = await Listing.findById(id)
      .populate({
        path: "review",
        populate: {
          path: "author",
        },
      })
      .populate("owner");

    res.render("listings/show.ejs", { data: detailListing });
  }),
);

//edit.ejs route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let editlist = await Listing.findById(id);
    res.render("listings/edit.ejs", { editlist });
  }),
);

//edit patch path
router.patch(
  "/:id",
  isLoggedIn,
  isOwner,
  validateListing,upload.single("listing[image]"),
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let { listing } = req.body;
    if(req.file){
    listing.image = {
    url: req.file.path,
    filename: req.file.filename
    }
  };
    await Listing.findByIdAndUpdate(id, listing);
    req.flash("success", "Listing Updated");
    res.redirect("/listings");
     
  }),
);

//delete route
router.delete(
  "/:id",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted");

    res.redirect("/listings");
  }),
);

module.exports = router;
