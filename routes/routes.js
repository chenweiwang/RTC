/**
 * Created by v-wajie on 2015/11/30.
 */

var Project = require('../models/project.js').Project;

module.exports = function (app, passport) {

    app.post('/login', passport.authenticate('login'), function (req, res) {
        res.json({ authenticated: true });
    });

    app.get('/projects', isLoggedIn, function (req, res) {
        Project.find({ }, function (err, projects) {
            if (err)
                return res.json(err);
            res.json(projects);
        })
    });
};



// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    res.json({ authenticated: false });
}