/**
 * Created by jack8 on 2015/11/9.
 * Fetch resources from the RTC server
 */
var fs = require('fs'),
    authenticate = require('./authenticate.js');

function Fetcher(request, rootUrl, username, password) {
    this.rootUrl = rootUrl;
    this.request = request;
    this.username = username;
    this.password = password;
    this.rootServicesUrl = rootUrl + "/rootservices";
    this.hasAuthed = false;
}

module.exports = Fetcher;

Fetcher.prototype.auth = function (callback) {
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
};

Fetcher.prototype.getXml = function (url, callback) {
    var requset = this.request;
    var options = {
        url: url,
        headers: {
            'Accept': 'application/xml'
        }
    };
    requset.get(options, function (err, res) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, res);
        }
    });
};

Fetcher.prototype.getJson = function (url, callback) {
    var requset = this.request;
    var options = {
        url: url,
        headers: {
            'Accept': 'application/json'
        }
    };
    requset.get(options, function (err, res) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, res);
        }
    });
};

//get the projects
Fetcher.prototype.getProjects = function (callback) {
    var that = this;
    this.getJson(this.rootServicesUrl, function (err, res) {
        if (err) {
            return callback(err);
        }
        var rootServices = JSON.parse(res.body);
        var projectsUrl = rootServices["https://opentechtest.chinacloudapp.cn:9443/jazz/rootservices"]
            ["http://open-services.net/xmlns/cm/1.0/cmServiceProviders"][0].value;
        console.log("Projects Url: " + projectsUrl);
        //this dose not point to Fetcher obj;
        //instead we save this to that.
        that.getXml(projectsUrl, function (err, res) {
            if (err) {
                return callback(err);
            }
            return callback(null, res.body);
        });
    });
};




