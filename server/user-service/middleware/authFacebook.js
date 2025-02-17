const FacebookStrategy = require("passport-facebook").Strategy;
const passport = require("passport");
require("dotenv").config();

const { loginWithFacebook } = require("../utils/userUtils");

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/users/auth/facebook/callback`,
      profileFields: ["id", "displayName", "photos", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const response = await loginWithFacebook(profile);
        if (response.success) {
          return done(null, response.data);
        } else {
          return done(null, false, { message: response.message });
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
