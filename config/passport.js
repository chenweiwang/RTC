/**
 * Created by v-wajie on 2015/11/30.
 */
var LocalStrategy = require('passport-local').Strategy,
    User = require('../models/user.js').User,
    settings = require('./settings.js'),
    request = require('../newRequest.js')(),
    Updater = require('../updater.js');


var configPassport = function(passport) {

    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('login', new LocalStrategy(
        function (username, password, done) {
            var updater = new Updater(settings.rootUrl, username, password);
            updater.authenticate(function (err) {
                if (err) {
                    return done(err);
                }

                User.findOne({ username: username }, function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    if (user) {
                        if (user.password != password) {
                            User.Update({ username: username }, { password: password }, function (err) {
                                if (err)
                                    console.log('Update password of user(' + username +') failed');
                            });
                            user.password = password;
                        }
                        done(null, user);
                    } else {
                        var newUser = new User();
                        newUser.username = username;
                        newUser.password = password;
                        newUser.save(function (err) {
                            if (err)
                                console.log('Save new user(' + username + ') failed');
                        });
                        done(null, newUser);
                    }
                });
            });
        }
    ));
};
module.exports = configPassport;