/**
 * Created by jack8 on 2015/11/15.
 */
var fs = require('fs'),
    Fetcher = require('./fetcher.js'),
    Parser = require('./parsers/parser.js'),
    mongoose = require('mongoose'),
    Project = require('./models/project.js').Project,
    User = require('./models/user.js').User,
    Updater = require('./updater.js'),
    UpdateService = require('./updateservice.js');



var rootUrl = "https://opentechtest.chinacloudapp.cn:9443/jazz";
var username = "jack";
var password = "jack";
var updater = new Updater(rootUrl, username, password);
var updateService = new UpdateService(60);

//connet to MongoDB
var connect = function() {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    mongoose.connect('mongodb://localhost/rtc', options);
};
connect();

mongoose.connection.on('error', console.log);
//try to reconnect to mongodb when disconnected
mongoose.connection.on('disconnected', connect);

User.find({ username: username }, function (err, user) {
    if (err) {
        console.log("Find user: " + username + " error.");
    }
    if (user.length <= 0) {
        var newUser = new User();
        newUser.password = password;
        newUser.username = username;
        newUser.server.host = "https://opentechtest.chinacloudapp.cn";
        newUser.server.port = 9443;
        newUser.server.context = "jazz";
        newUser.save();
    }
});

var date = new Date();
console.log(date.valueOf());

updateService.start();
/*updater.authenticate(function (err) {
    if (err) {
        console.log("Login failed!");
    } else {
        /!*var url = "https://opentechtest.chinacloudapp.cn:9443/jazz/oslc/contexts/_AaqqEpD0EeWXese5nM0f4w/workitems";
        request.get(url, function(err, res) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(res.body);
        }).pipe(fs.createWriteStream('tast_new.xml'));*!/
        /!*updater.updateProjects(function (err, result) {
            console.log(result);
        })*!/
        /!*updater.updateWorkitems('_AaqqEpD0EeWXese5nM0f4w', function (err) {
            if (err)
                console.log("update workitems failed: " + err);
            else
                console.log("successfully");
        });*!/
        /!*updater.updateAllWorkitems(function (err) {
           if (err) {
               console.log("failed: " + err);
           } else {
               console.log("successfully");
           }
        });*!/
        updater.updateProjects(function (err, projects) {
           if (err) {
               console.log("update project failed: " + err);
           } else {
               console.log("successfully : " + projects);
           }
        })
        /!*updater.updateAllComments(function (err) {
            if (err) {
                console.log("update comments failed: " + err)
            } else {
                console.log("successfully");
            }
        })*!/
    }
});*/

/*fetcher.auth(function (err) {
    if (err) {
        console.log("Login failed!");
    } else {
        console.log("Login to " + rootUrl + " success!");
        console.log("Begin to refresh resource..");
        fetcher.getProjects(function (err, projectsXml) {
            if (err) {
                console.log("Fetch projects failed!");
            } else {
                console.log(projectsXml);
               /!* parseString(projectsXml, function (err, projects) {
                    if (err) {
                        console.log("Parse xml Error");
                    } else {
                        //console.log(projects);
                        var tmp = projects["oslc_disc:ServiceProviderCatalog"]["oslc_disc:entry"][0];
                        var result = tmp["oslc_disc:ServiceProvider"][0]["oslc_disc:services"];
                        console.log(result[0]["$"]["rdf:resource"]);
                    }
                });*!/
                var url = "https://opentechtest.chinacloudapp.cn:9443/jazz/process/project-areas/_JjVPAH_uEeWbMNI6SG32dQ";
                request.get(url, function(err, res) {
                    console.log(res.body);
                }).pipe(fs.createWriteStream('projectdetail.xml'));

                Parser.parseProjectsXml(projectsXml, function (err, projects) {
                    if (err) {
                        console.log("Parse Project xml error: " + err);
                    } else {
                        for (var i = 0; i < projects.length; ++i) {
                            //pay attention to the loop variable i, fix the bug!
                            //when the findOne callback func be called, the i will have changed!.
                            var curProject = projects[i];
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
                    }
                });
            }
        })
    }
});*/





