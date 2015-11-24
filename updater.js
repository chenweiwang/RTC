/**
 * Created by jack8 on 2015/11/21.
 */
var Fetcher = require('./fetcher.js'),
    mongoose = require('mongoose'),
    Parser = require('./parsers/parser.js'),
    Project = require('./models/project.js').Project;


function Updater(request, rootUrl, username, password) {
    this.rootUrl = rootUrl;
    this.request = request;
    this.username = username;
    this.password = password;
    this.fetcher = new Fetcher(request, rootUrl, username, password);
}

module.exports = Updater;

Updater.prototype.authenticate = function(callback) {
    this.fetcher.auth(callback);
};

Updater.prototype.updateProjects = function(callback) {
    var fetcher = this.fetcher;
    if (fetcher.hasAuthed) {
        return callback('Has not been authenticated, please auth first!');
    }
    fetcher.getProjects(function(err, projectsXml) {
        if (err) {
            callback("Fetch projectsXml failed!");
        } else {
            console.log(projectsXml);
            Parser.parseProjectsXml(projectsXml, function (err, projects) {
                if (err) {
                    console.log("Parse Project xml error: " + err);
                    callback("Parse Project xml error: " + err);
                } else {
                    for (var i = 0; i < projects.length; ++i) {
                        //pay attention to the loop variable i, fix the bug!
                        //when the findOne callback func be called, the i will have changed!.
                        var curProject = projects[i];
                        var projectServiceUrl = curProject.services;
                        fetcher.getXml(projectServiceUrl, function(err, res) {
                           if (err) {
                                callback("get ProjectServiceXml error: " + err);
                           } else {
                               Parser.parseServiceXml(res.body, function(err, workitemUrl) {
                                   if (err) {
                                       callback("Parse service xml error: " + err);
                                   } else {
                                       curProject.workitemUrl = workitemUrl;
                                       Project.findOne({uuid: curProject["uuid"]}, function (err, result) {
                                           if (!err && !result) {
                                               curProject.save(function (err) {
                                                   if (err) {
                                                       console.log(err);
                                                   } else {
                                                       console.log(curProject);
                                                   }
                                               });
                                           } else {
                                               console.log(err);
                                           }
                                       });

                                   }
                               });
                           }
                        });
                    }
                }
            });
        }
    });
};