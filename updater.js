/**
 * Created by jack8 on 2015/11/21.
 */
var Fetcher = require('./fetcher.js'),
    mongoose = require('mongoose'),
    Parser = require('./parsers/parser.js'),
    Project = require('./models/project.js').Project,
    WorkItem = require('./models/workitem.js').Workitem,
    async = require('async');


function Updater(request, rootUrl, username, password) {
    this.rootUrl = rootUrl;
    this.request = request;
    this.username = username;
    this.password = password;
    this.fetcher = new Fetcher(request, rootUrl, username, password);
}

module.exports = Updater;

Updater.prototype.authenticate = function (callback) {
    this.fetcher.auth(callback);
};

Updater.prototype.updateProjects = function (callback) {
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
               callback(null);
            });
        }
    ], function (err) {
        if (err)
            console.log(err);
        else
            console.log("update projects successfully");
    });
};

Updater.prototype.updateWorkitems = function (projectUuid, callback) {
    var fetcher = this.fetcher;
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
                var conditions = { projectUuid: workitem.projectUuid, id: workitem.id };
                WorkItem.findOneAndUpdate(conditions, workitem, { upsert: true }, function (err) {
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