require('dotenv').config()


const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const port = 8080;
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");
const listingsRoute=require("./routes/listing");
const reviewsRoute=require("./routes/review");
const userRoute=require("./routes/user");
const session=require("express-session");
const {MongoStore} = require("connect-mongo");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user");

app.engine("ejs", ejsMate);
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.listen(port, () => {
  console.log("Listening on port 8080");
});
const dbUrl=process.env.ATLASDB_URL;
main()
  .then(() => {
    console.log("Connection successful");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
}


const store = MongoStore.create({
  mongoUrl: process.env.ATLASDB_URL,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(passport.session());

app.use((req,res,next)=>{
  res.locals.success=req.flash("success");
  res.locals.error=req.flash("error");
  res.locals.currentUser=req.user;
  next();
})


// app.get("/userReg",async (req,res)=>{
//   let fakeUser=new User({
// email:"samarthnimbalkar108@gmail.com",
// username:"samuNimbu"
//   });
//   let registerdUser=await User.register(fakeUser,"samarth!@#1123");
//   res.send(registerdUser);
// })


app.use("/listings",listingsRoute);
app.use("/listings/:id/reviews",reviewsRoute);
app.use("/",userRoute);


app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found Here"));
});

// Global Error Handler
app.use((err, req, res, next) => {
  const { status = 500, message = "Something went wrong!" } = err;
  console.log(err);
  res.status(status).render("error.ejs", { message });
});
