if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

require("./mongo");
const express = require("express");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const User = require("./models/user");
const MongoStore = require("connect-mongo");

const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize());

const { MONGO_DB_URI, MONGO_DB_URI_TEST, NODE_ENV } = process.env;
const connectURI = NODE_ENV === "test" ? MONGO_DB_URI_TEST : MONGO_DB_URI;

const sessionSecret = process.env.SECRET;
const store = MongoStore.create({
    mongoUrl: connectURI,
    crypto: {
        secret: sessionSecret,
    },
    touchAfter: 60 * 60 * 24,
});
store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
    store,
    name: "session",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = ["https://api.mapbox.com/", "https://a.tiles.mapbox.com/", "https://b.tiles.mapbox.com/", "https://events.mapbox.com/"];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dr0nzbfe1/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); // passport-local-mongoose
passport.serializeUser(User.serializeUser()); // passport-local-mongoose -> Store in session
passport.deserializeUser(User.deserializeUser()); // passport-local-mongoose -> Unstore of session

app.use((req, res, next) => {
    if (req.originalUrl.includes("/campgrounds")) req.session.returnTo = req.originalUrl;
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});
app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
    res.render("home");
});

app.all("*", (req, res, next) => {
    next(new ExpressError("Page not found", 404));
});

app.use((err, req, res, next) => {
    const { status = 500 } = err;
    if (!err.message) err.message = "Oh boy! Something went wrong!";
    res.status(status).render("error", { err });
    next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serving on port ${PORT}`);
});
