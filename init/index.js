const mongoose = require("mongoose");

const { sampleListings } = require("./data.js");

const Listing = require("../models/listing.js");

main()
    .then(() => {
        console.log("connection successful");
    })
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect(
        "mongodb://127.0.0.1:27017/bookmystay"
    );
}

const mydb = async () => {

    await Listing.deleteMany({});

    const listingsWithOwner = sampleListings.map((obj) => ({
        ...obj,
        owner: "6ab81121f82100452260faaa"
    }));

    await Listing.insertMany(listingsWithOwner);

    console.log("data successfully initialized");
};

mydb();