/**
 * Created by jack8 on 2015/11/21.
 */
var Fetcher = require('./fetcher.js'),
    mongoose = require('mongoose'),
    Parser = require('./parsers/parser.js'),
    newRequest = require('./newRequest.js'),
    Project = require('./models/project.js').Project,
    WorkItem = require('./models/workitem.js').Workitem,
    Comment = require('./models/comment.js').Comment,
    User = require('./models/user.js').User,
    async = require('async');


function Updater(rootUrl, username, password) {
    this.rootUrl = rootUrl;
    this.request = newRequest();
    this.username = username;
    this.password = password;
    this.fetcher = new Fetcher(this.request, rootUrl, username, password);
}

module.exports = Updater;

/**
 * Using basic form authentication.
 * */
Updater.prototype.authenticate = function (callback) {
    this.fetcher.auth(callback);
};

/**
 * Update all projects for the current User @username.
 * */
Updater.prototype.updateProjects = function (callback) {
    var self = this;
    var fetcher = this.fetcher;
    if (!fetcher.hasAuthed) {
        return callback('Has not been authenticated, please auth first!');
    }
    async.waterfall([
        function (callback) {
            fetcher.getProjects(function (err, projectsXml) {
                if (err)
                    return callback("Can't get projectsXml: " + err);
                callback(null, projectsXml);
            })
        },
        function (projectsXml, callback) {
            Parser.parseProjectsXml(projectsXml, function (err, projects) {
                if (err)
                    return callback("Parsed projectsXml Error: " + err);
                callback(null, projects);
            })
        },
        function (projects, callback) {
            async.forEachLimit(projects, 5, function (project, callback) {
                var update = { title: project.title, details: project.details,
                    services: project.services, workitemUrl: project.workitemUrl };
                Project.findOneAndUpdate({ uuid: project.uuid }, update, { upsert: true }, function (err) {
                    if (err)
                        return callback("Update or Insert project into DB Error: " + err);
                    callback(null);
                });
            }, function (err) {
               if (err)
                   return callback(err);
               callback(null, projects);
            });
        },
        function (projects, callback) {
            if (projects.length <= 0) {
                callback(null);
            }
            var projectUuids = [];
            for (var i = 0; i < projects.length; ++i) {
                projectUuids.push(projects[i].uuid);
            }
            User.findOneAndUpdate( { username: self.username }, { projectUuids: projectUuids }, function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null, projects);
            });
        }
    ], function (err, projects) {
        if (err) {
            return callback(err);
        } else {
            console.log("update projects successfully");
            callback(null, projects);
        }
    });
};

/**
 * Update all workitems for all projects in db.
 * */
Updater.prototype.updateAllWorkitems = function (callback) {
    var self = this;
    Project.find({ }, 'uuid', function (err, results) {
        if (err) {
            return callback(err);
        }

        async.forEachLimit(results, 5, function (project, callback) {
            self.updateWorkitems(project.uuid, function (err) {
                if (err)
                    return callback(err);
                callback(null);
            });
        }, function (err) {
            if (err)
                return callback(err);
            callback(null);
        });
    });
};

Updater.prototype.parseAndStoreWorkitems = function (json, callback) {
    async.waterfall([
        //parse the workitems json
        function (workitemsJson, callback) {
            Parser.parseWorkitemsJson(workitemsJson, fetcher, function (err, workitems) {
                if (err)
                    return callback(err);
                callback(null, workitems);
            })
        },
        //save the parsed workitems to db
        function (workitems, callback) {
            async.forEachLimit(workitems, 10, function (workitem, callback) {
                var conditions = { projectUuid: workitem.projectUuid, id: workitem.id };
                var updates = {
                    projectUuid: workitem.projectUuid,
                    id: workitem.id,
                    tags: workitem.tags,
                    type: workitem.type,
                    filedAgainst: workitem.filedAgainst,
                    ownedBy: workitem.ownedBy,
                    createdBy: workitem.createdBy,
                    createdTime: workitem.createdTime,
                    lastModifiedTime: workitem.lastModifiedTime,
                    title: workitem.title,
                    description: workitem.description,
                    priority: workitem.priority,
                    severity: workitem.severity,
                    commentsUrl: workitem.commentsUrl,
                    subscribersUrl: workitem.subscribersUrl,
                    plannedFor: workitem.plannedFor,
                    dueDate: workitem.dueDate,
                    foundIn: workitem.foundIn,
                    estimate: workitem.estimate,
                    timeSpent: workitem.timeSpent,
                    businessValue: workitem.businessValue,
                    risk: workitem.risk,
                    impact: workitem.impact,
                    storyPoint: workitem.storyPoint
                };
                WorkItem.findOneAndUpdate(conditions, updates, { upsert: true }, function (err) {
                    if (err)
                        return callback(err);
                    callback(null);
                });
            }, function (err) {
                if (err)
                    return callback(err);
                callback(null);
            });
        }
    ], function (err) {
        if (err)
            return callback(err);
        callback(null);
    });
};

/**
 * Update all workitems of the specified project.
 * @param projectUuid, the project id which needs to update workitems.
 * */
Updater.prototype.updateWorkitems = function (projectUuid, callback) {
    var fetcher = this.fetcher;
    var self = this;
    if (!fetcher.hasAuthed) {
        return callback('Has not been authenticated, please auth first!');
    }

    async.waterfall([
        //get workitems json from the server
        function (callback) {
            fetcher.getWorkitemsJson(projectUuid, function (err, workitemsJson) {
                if (err)
                    return callback(err);
                callback(null, workitemsJson);
            });
        },
        //parse the workitems json
        function (workitemsJson, callback) {
            Parser.parseWorkitemsJson(workitemsJson, fetcher, function (err, workitems) {
                if (err)
                    return callback(err);
                callback(null, workitems);
            })
        },
        //save the parsed workitems to db
        function (workitems, callback) {
            async.forEachLimit(workitems, 10, function (workitem, callback) {
                self.saveOrUpdateWorkitem(workitem, callback);
            }, function (err) {
                if (err)
                    return callback(err);
                callback(null);
            });
        }
    ], function (err) {
        if (err)
            return callback(err);
        callback(null);
    });
};

/**
 * Get the modified Time of the workitem specified by workitemUrl.
 * */
Updater.prototype.getModifiedTimeOfWorkitem = function (workitemUrl, callback) {
    var fecther = this.fetcher;
    var query = "?oslc_cm.properties=dc:modified";
    fecther.getJson(workitemUrl + query, function (err, resBody) {
        if (err) {
            return callback(err);
        }
        var json = JSON.parse(resBody);
        var date = new Date(json["dc:modified"]);
        callback(null, date);
    })
};

/**
 * Update a single workitem.
 * @param workitemUrl, the url of workitem.
 * */
Updater.prototype.updateSingleWorkitem = function (workitemUrl, callback) {
    var fetcher = this.fetcher;
    var self = this;
    if (!fetcher.hasAuthed) {
        return callback('Has not been authenticated, please auth first!');
    }

    async.waterfall([
        //get the workitem json.
        function (workitemUrl, callback) {
            fetcher.getJson(workitemUrl, function (err, responseBody) {
                if (err) {
                    return callback(err);
                }
                var workitemsJson = workitemsJson.push(JSON.parse(responseBody));
                callback(null, workitemsJson);
            })
        },
        function (workitemsJson, callback) {
            self.parseAndStoreWorkitems(workitemsJson, function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null);
            })
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }
        callback(null);
    })
};


/**
 * Update comments for the workitem whose id is @param workitemId.
 * @param projectUuid, and the
 * @param workitemId together to identify comments
 * */
Updater.prototype.updateComments = function (projectUuid, workitemId, commentsUrl, callback) {
    var fetcher = this.fetcher;
    if (!fetcher.hasAuthed) {
        return callback('Has not been authenticated, please auth first!');
    }

    async.waterfall([
        //get the comments
        function (callback) {
            fetcher.getJson(commentsUrl, function (err, json) {
                if (err)
                    return callback(err);
                callback(null, json);
            })
        },
        //parse the comment
        function (json, callback) {
            Parser.parseCommentsJson(json, function (err, comments) {
                if (err)
                    return callback(err);
                callback(null, comments);
            })
        },
        //save the parsed comments to db
        function (comments, callback) {
            async.forEachLimit(comments, 10, function (comment, callback) {
                var conditions = {
                    projectUuid: projectUuid,
                    workitemId: workitemId,
                    createdTime: comment.createdTime };
                var updates = {
                    projectUuid: projectUuid,
                    workitemId: workitemId,
                    description: comment.description,
                    creator: comment.creator,
                    createdTime: comment.createdTime
                };
                Comment.findOneAndUpdate(conditions, updates, { upsert: true }, function (err) {
                    if (err)
                        return callback(err);
                    callback(null);
                })
            }, function (err) {
                if (err)
                    return callback(err);
                callback(null);
            });
        }
    ], function (err) {
        if (err)
            return callback(err);
        callback(null);
    });
};

/**
 * Save or Update the workitem which is well parsed.
 * */
Updater.prototype.saveOrUpdateWorkitem = function (workitem, callback) {
    var conditions = { projectUuid: workitem.projectUuid, id: workitem.id };
    var updates = {
        projectUuid: workitem.projectUuid,
        id: workitem.id,
        tags: workitem.tags,
        type: workitem.type,
        filedAgainst: workitem.filedAgainst,
        ownedBy: workitem.ownedBy,
        createdBy: workitem.createdBy,
        createdTime: workitem.createdTime,
        lastModifiedTime: workitem.lastModifiedTime,
        title: workitem.title,
        description: workitem.description,
        priority: workitem.priority,
        severity: workitem.severity,
        commentsUrl: workitem.commentsUrl,
        subscribersUrl: workitem.subscribersUrl,
        plannedFor: workitem.plannedFor,
        dueDate: workitem.dueDate,
        foundIn: workitem.foundIn,
        estimate: workitem.estimate,
        timeSpent: workitem.timeSpent,
        businessValue: workitem.businessValue,
        risk: workitem.risk,
        impact: workitem.impact,
        storyPoint: workitem.storyPoint
    };
    WorkItem.findOneAndUpdate(conditions, updates, { upsert: true }, function (err) {
        if (err)
            return callback(err);
        callback(null);
    });
};

/**
 * Update all workitem's comments.
 * */
Updater.prototype.updateAllComments = function (callback) {
    var self = this;
    //select workitem id from db.
    WorkItem.find({ }, 'projectUuid id commentsUrl', function (err, workitems) {
        if (err) {
            return callback(err);
        }
        //for each workitem, get its comment.
        async.forEachLimit(workitems, 4, function (workitem, callback) {
            //filter the illegal commentsUrl.
            if (workitem.commentsUrl != null && workitem.commentsUrl != undefined) {
                self.updateComments(workitem.projectUuid, workitem.id, workitem.commentsUrl, function (err) {
                    if (err)
                        return callback(err);
                    callback(null);
                })
            } else {
                callback(null);
            }

        }, function (err) {
            if (err)
                return callback(err);
            callback(null);
        });
    });
};