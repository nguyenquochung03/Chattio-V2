const passport = require("passport");
const { loginWithGoogle } = require("../utils/userUtils");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/users/auth/google/callback`,
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        const respone = await loginWithGoogle(profile);

        if (respone.success) {
          return done(null, respone.data);
        } else {
          return done(null, false, { message: respone.message });
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
