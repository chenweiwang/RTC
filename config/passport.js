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

                User.findOneAndUpdate({ username: username }, { password: password },
                    { upsert: true }, function (err) {
                    if (err) {
                        return done(err);
                    }
                    var user = { username: username, password:password };
                    done(null, user);
                });
            });
        }
    ));
};
module.exports = configPassport;