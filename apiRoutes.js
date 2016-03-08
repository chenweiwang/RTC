var express = require('express'),
    Updater = require('./updater.js'),
    jwt = require('jsonwebtoken'),
    User = require('./models/user.js').User,
    Project = require('./models/project.js').Project,
    Workitem = require('./models/workitem.js').Workitem,
    Comment = require('./models/comment.js').Comment,
    settings = require('./settings.js');


var apiRoutes = express.Router();


/**
 * Authentication Api.
 * host:port/api/authenticate
 * */
apiRoutes.post('/authenticate', function (req, res) {

    var username = req.body.username;
    var password = req.body.password;

    var updater = new Updater(settings.rootUrl, username, password);
    updater.authenticate(function (err) {
        if (err) {
            res.json( { success: false, message: 'Authentication failed. ' +
                'Wrong password or Sever can not reach' });
            return;
        }

        User.findOne({ username: username }, function (err, user) {
            if (err) {
                res.json({ success: false, message: 'Server internal error.' });
            } else {
                //user already in db, just update the password.
                if (user && (user.password !== password)) {
                    User.Update({username: username}, {password: password}, function (err) {
                        if (err) {
                            console.log('Update password of user(' + username + ') failed');
                        }
                    });
                } else if (!user) {
                    var newUser = new User();
                    newUser.username = username;
                    newUser.password = password;
                    newUser.save(function (err) {
                        if (err)
                            console.log('Save new user(' + username + ') failed');
                    });
                }

                var token = jwt.sign(username, settings.secret, {
                    expiresIn: '150d'
                });

                res.json({
                    success: true,
                    message: 'Authentication successful.',
                    token: token
                });
            }
        });

    });

});

/**
 * Route middleware to authenticate and check token.
 * */
apiRoutes.use(function (req, res, next) {

    //check header, url parameters or post parameters for token.
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    //verify and decode token
    if (token) {
        //use jwt to decode.
        jwt.verify(token, settings.secret, function (err, username) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                req.username = username;
                next();
            }
        })
    } else {
        //if there is no token, return an error.
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});

/*====================================
    Routes needed to be authenticated.
=======================================*/

/**
 * query for all projects.
 * */
apiRoutes.get('/projects', function (req, res) {
    //TODO 只返回特定用户req.username的所有的porject.
    Project.find({ }, function (err, projects) {
        if (err) {
            return res.json(err);
        }
        res.json(projects);
    });
});

/**
 * query for all workitems, support condition filtering.
 * */
apiRoutes.get('/workitems', function (req, res) {
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

/**
 * query for comments specified with workitem Id.
 * */
apiRoutes.get('/comments/:workitemId', function (req, res) {
    var conditions = { };
    var workitemId = req.params.workitemId || req.query.workitemId;
    if (workitemId) {
        conditions.workitemId = workitemId;
    } else {
        return res.json({ error: true, message: 'please provide the workitem id!'});
    }

    Comment.find(conditions, function (err, comments) {
        if (err)
            return res.json(err);
        res.json(comments);
    });
});


module.exports = apiRoutes;