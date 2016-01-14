/**
 * Created by v-wajie on 2015/11/30.
 */

var Project = require('../models/project.js').Project,
    Workitem = require('../models/workitem.js').Workitem,
    Comment = require('../models/comment.js').Comment;

module.exports = function (app, passport) {

    app.post('/login', passport.authenticate('login'), function (req, res) {
        res.json({ authenticated: true });
    });

    //TODO 为了测试，关闭了登陆验证
    //app.get('/projects', isLoggedIn, function (req, res) {
    app.get('/projects', function (req, res) {
        Project.find({ }, function (err, projects) {
            if (err)
                return res.json(err);
            res.json(projects);
        })
    });

    //app.get('/workitems', isLoggedIn, function (req, res) {
    app.get('/workitems', function (req, res) {
        var conditions = { };
        var projectUuid = req.query.uuid;
        var id = req.query.id;
        if (projectUuid) {
            conditions.projectUuid = projectUuid;
        }
        if (id) {
            conditions.id = id;
        }
        Workitem.find(conditions, function (err, workitems) {
            if (err)
                return res.json(err);
            res.json(workitems);
        });
    });

    app.get('/comments/:workitemId', function (req, res) {
        var conditions = { };
        var workitemId = req.params.workitemId;
        if (workitemId) {
            conditions.workitemId = workitemId;
        }
        Comment.find(conditions, function (err, comments) {
            if (err)
                return res.json(err);
            res.json(comments);
        })
    })
};



// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    res.json({ authenticated: false });
}