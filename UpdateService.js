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
    this.timeThreshold = new Date(0);
}

module.exports = UpdateService;


/**
 * Start the UpdateService, it will invoke the
 * update method at the specified interval.
 * */
UpdateService.prototype.start = function () {
    var self = this;
    var sched = later.parse.recur()
                    .every(this.interval).second();

    var timer = later.setInterval(function () {
        self.update(function (err) {
            var now = new Date();
            var timeStr = now.toLocaleDateString() + " " + now.toLocaleTimeString();
            if (err) {
                console.log("UpdateService failed at time: " +  timeStr + "\n");
            }
            console.log("UpdateService succeeded at time: " + timeStr + "\n");
        });
    }, sched);

};


/**
 * update for all user.
 * */
UpdateService.prototype.update = function (callback) {
    var self = this;
    self.startTime = new Date();
    self.timeThreshold = self.startTime.valueOf() - self.interval * 1000;
    console.log("Time threshold: " + self.timeThreshold);
    console.log("\n************************UpdateService**********************");
    console.log("Starting update at: " + self.startTime.toLocaleDateString()
        +  " " + self.startTime.toLocaleTimeString());
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
            async.each(users, function (user, cb) {
                self.updateSingleUser(user, cb);
            }, function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        }
    ], function (err) {
        self.updatedProjectUuids.clear();
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
    console.log("Updating user: " + user.username);
    updater.authenticate(function (err) {
        if (err) {
            return callback(err);
        }
        //get all projects of the user.
        updater.updateProjects(function (err, projects) {
            if (err) {
                return callback('Get projects for user: ' + user.username + "error: " +err);
            }

            async.each(projects, function (project, callback) {
                if (!uuids.has(project.uuid)) {
                    console.log("Updating project: " + project.title);
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
    //query all workitem Urls of this project.
    updater.fetcher.getJson(workitemUrl + query, function (err, resBody) {
        if (err) {
            return callback(err);
        }
        var json = (JSON.parse(resBody))["oslc_cm:results"];
        var workitemUrls = [];
        for (var i = 0; i < json.length; ++i) {
            workitemUrls.push(json[i]["rdf:resource"]);
        }

        async.eachLimit(workitemUrls, 10, function (url, callback) {
            //Get the modified Time of this workitem, and judge whether the workitem has been changed.
            updater.getModifiedTimeOfWorkitem(url, function (err, date) {
                if (err) {
                    console.log("Get modified Time of workitem: " + url);
                    return callback(null);
                }
                //console.log(url + " time: " + date.valueOf());
                if (date !== undefined && date.valueOf() > self.timeThreshold) {
                    console.log("Updating workitem: " + url);
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