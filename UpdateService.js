var Updater = require('./updater.js'),
    User = require('./models/user.js').User,
    async = require('async'),
    later = require('later');

/**
 * The Service used to update DB.
 * @param intervalBySecond, is the loop interval.
 * */
function UpdateService(intervalBySecond) {
    this.interval = intervalBySecond;
    this.updatedProjectUuids = new Set();
    this.startTime = new Date(0);
}

module.exports = UpdateService;


/**
 * Start the UpdateService, it will invoke the
 * update method at specified interval.
 * */
UpdateService.prototype.start = function () {
    var sched = later.parse.recur()
                    .every(this.interval).second();

    var timer = later.setInterval(this.update( function (err) {
        if (err) {
            console.log("Update failed at time: " + new Date().toDateString());
        }
        console.log("Update successfully at time: " + new Date().toDateString());
    }), sched);

};


/**
 * update for all user.
 * */
UpdateService.prototype.update = function (callback) {
    var self = this;
    self.startTime = new Date();
    async.waterfall([
        //find users
        function (callback) {
            User.find({ }, function (err, users) {
                if (err) {
                    return callback("find user failed: " + err);
                }
                callback(null, users);
            })
        },
        function (users, callback) {
            async.eachOfLimit(users, 2, function (user, callback) {
                self.updateSingleUser(user, callback);
            }, function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        }
    ], function (err) {
        this.updatedProjectUuids.clear();
        if (err) {
            return callback(err);
        }
        callback(null);
    });

};

/**
 * For single user
 * */
UpdateService.prototype.updateSingleUser = function (user, callback) {
    var self = this;
    var uuids = this.updatedProjectUuids;
    var rootUrl = user.server.host + ":" +
        user.server.port + "/" + user.server.context;
    var updater = new Updater(rootUrl, user.username, user.password);
    updater.authenticate(function (err) {
        if (err) {
            return callback(err);
        }
        //get all projects of the user.
        updater.updateProjects(function (err, projects) {
            if (err) {
                return callback('Get projects for user: ' + user.username + "error: " +err);
            }
            async.eachOfLimit(projects, 2, function (project, callback) {
                if (!uuids.has(project.uuid)) {
                    self.updateProject(project, updater, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        uuids.add(project.uuid);
                        callback(null);
                    })
                } else {
                    callback(null);
                }
            }, function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    })
};

/**
 * Update for single project.
 * */
UpdateService.prototype.updateProject = function (project, updater, callback) {
    var self = this;
    var workitemUrl = project.workitemUrl;
    var query = "?oslc_cm.properties=oslc_cm:results";
    updater.fetcher.getJson(workitemUrl + query, function (err, resBody) {
        if (err) {
            return callback(err);
        }
        var json = (JSON.parse(resBody))["oslc_cm:results"];
        var workitemUrls = [];
        for (var i = 0; i < json.length; ++i) {
            workitemUrls.push(json[i]["rdf:resource"]);
        }

        async.eachOfLimit(workitemUrls, 5, function (url, callback) {
            updater.getModifiedTimeOfWorkitem(url, function (err, date) {
                var timeThreshold = self.startTime.valueOf() - self.interval * 1000;
                if (date.valueOf() > timeThreshold) {
                    //TODO 将变化的内容可以加入到一个变化的队列中，然后进行智能推送。
                    updater.updateSingleWorkitem(url, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            });
        }, function (err) {
            if (err) {
                return callback(err);
            }
            callback(null);
        });
    });
};