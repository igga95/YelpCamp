require('dotenv').config();

const mongoose = require('mongoose');
const campground = require('../models/campground');
const Campground = require('../models/campground');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelper');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected')
});

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 500; i++) {
        const rand1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20 + 10);
        const camp = new Campground({
            author: '605281ecd61601ba8ea737fb',
            location: `${cities[rand1000].city}, ${cities[rand1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            images: [{
                url: 'https://res.cloudinary.com/dr0nzbfe1/image/upload/v1614039512/YelpCamp/lake_wpi4p4.jpg',
                filename: 'YelpCamp/lake_wpi4p4'
            },
            {
                url: 'https://res.cloudinary.com/dr0nzbfe1/image/upload/v1614039506/YelpCamp/tent_su6sqr.jpg',
                filename: 'YelpCamp/tent_su6sqr'
            }],
            geometry: {
                type: "Point",
                coordinates: [
                    cities[rand1000].longitude,
                    cities[rand1000].latitude,
                ]
            },
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia deserunt excepturi est nostrum. Iste animi, eaque nulla mollitia, nemo voluptas quaerat nostrum aperiam quis minus, accusantium id tempora doloremque reiciendis.',
            price
        });
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
});
