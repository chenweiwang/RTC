/**
 * Created by jack8 on 2015/11/9.
 */
var fs = require('fs'),
    authenticate = require('./authenticate.js');

function Updater(request, rootUrl, username, password) {
    this.rootUrl = rootUrl;
    this.request = request;
    this.username = username;
    this.password = password;
    this.rootServicesUrl = rootUrl + "/rootservices";
    this.hasAuthed = false;
}

module.exports = Updater;

Updater.prototype.auth = function (callback) {
    if (!this.hasAuthed) {
        authenticate(this.request, this.rootUrl, this.username, this.password, function (err) {
            if (err) {
                console.log("Login failed!");
                callback(err);
            } else {
                this.hasAuthed = true;
                callback(null);
            }
        });
    }
}

//get the projects
Updater.prototype.getProjects = function (callback) {
    var request = this.request;
    var options = {
        url: this.rootServicesUrl,
        headers: {
            'Accept': 'application/json'
        }
    };
    request.get(options, function (err, res) {
        if (err) {
            return callback(err);
        }
        var rootServices = JSON.parse(res.body);
        var projectsUrl = rootServices["https://opentechtest.chinacloudapp.cn:9443/jazz/rootservices"]
            ["http://open-services.net/xmlns/cm/1.0/cmServiceProviders"][0].value;
        console.log("Projects Url: " + projectsUrl);
        options.url = projectsUrl;
        options.headers.Accept = '*/*';
        request.get(projectsUrl, function (err, res) {
            if (err) {
                return callback(err);
            }
            return callback(null, res.body);
        }).pipe(fs.createWriteStream('projects.xml'));
    });
}

