/**
 * Created by jack8 on 2015/11/15.
 */
var newRequest = require('./newRequest.js'),
    Updater = require('./Updater.js'),
    Paser = require('./pasers/parser.js'),
    mongoose = require('mongoose'),
    Project = require('./models/project.js').Project;

var rootUrl = "https://opentechtest.chinacloudapp.cn:9443/jazz";
var username = "jack";
var password = "jack";
var request = newRequest();
var updater = new Updater(request, rootUrl, username, password);

//connet to MongoDB
var connect = function() {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    mongoose.connect('mongodb://localhost/rtc', options);
};
connect();

mongoose.connection.on('error', console.log);
//try to reconnect to mongodb when disconnected
mongoose.connection.on('disconnected', connect);



updater.auth(function (err) {
    if (err) {
        console.log("Login failed!");
    } else {
        console.log("Login to " + rootUrl + " success!");
        console.log("Begin to refresh resource..");
        updater.getProjects(function (err, projectsXml) {
            if (err) {
                console.log("Fetch projects failed!");
            } else {
                console.log(projectsXml);
               /* parseString(projectsXml, function (err, projects) {
                    if (err) {
                        console.log("Parse xml Error");
                    } else {
                        //console.log(projects);
                        var tmp = projects["oslc_disc:ServiceProviderCatalog"]["oslc_disc:entry"][0];
                        var result = tmp["oslc_disc:ServiceProvider"][0]["oslc_disc:services"];
                        console.log(result[0]["$"]["rdf:resource"]);
                    }
                });*/
                Paser.parseProjectsXml(projectsXml, function(projects) {
                    for (var i = 0; i < projects.length; ++i) {
                        Project.findOne({ title: projects[i]["title"] }, function(err, result) {
                            if (!err && !result) {
                                projects[i].save(function(err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log('OK');
                                    }
                                });
                            } else {
                                console.log(err);
                            }
                        })

                        console.log(projects[i]);
                    }

                })
            }
        })
    }
});





