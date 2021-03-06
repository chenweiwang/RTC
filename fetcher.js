/**
 * Created by jack8 on 2015/11/9.
 * Fetch resources from the RTC server
 */
var fs = require('fs'),
    authenticate = require('./authenticate.js'),
    Project = require('./models/project.js').Project;

function Fetcher(request, rootUrl, username, password) {
    this.rootUrl = rootUrl;
    this.request = request;
    this.username = username;
    this.password = password;
    this.rootServicesUrl = rootUrl + "/rootservices";
    this.hasAuthed = false;
}

module.exports = Fetcher;

/**
 * The auth function, delegate the actual authentication to authenticate.js
 * */
Fetcher.prototype.auth = function (callback) {
    if (!this.hasAuthed) {
        var self = this;
        authenticate(this.request, this.rootUrl, this.username, this.password, function (err) {
            if (err) {
                self.hasAuthed = false;
                console.log("Login failed!");
                callback(err);
            } else {
                self.hasAuthed = true;
                callback(null);
            }
        });
    } else {
        callback(null);
    }
};

/**
 * A simple function to get xml from the provided url.
 */
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
            return callback(null, res.body);
        }
    });
};

/**
 * A simple function to get json from the provided url.
 * */
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
            return callback(null, res.body);
        }
    });
};

/***
 *Get projects Xml.
 */
Fetcher.prototype.getProjects = function (callback) {
    var self = this;
    this.getJson(this.rootServicesUrl, function (err, res) {
        if (err) {
            return callback(err);
        }
        var rootServices = JSON.parse(res);
        var projectsUrl = rootServices[self.rootServicesUrl]
            ["http://open-services.net/xmlns/cm/1.0/cmServiceProviders"][0].value;
        //console.log("Projects Url: " + projectsUrl);
        //this dose not point to Fetcher obj;
        //instead we save this to self.
        self.getXml(projectsUrl, function (err, res) {
            if (err) {
                return callback(err);
            }
            return callback(null, res);
        });
    });
};

/**
 * Get the workitems json. First query the project collection from db to
 * obtain the workitemUrl. second, get the workitems json according to that
 * url.
 * */
Fetcher.prototype.getWorkitemsJson = function (projectUuid, callback) {
    var self = this;
    Project.findOne({ uuid: projectUuid }, 'workitemUrl', function (err, project) {
        if (err)
            return callback("GetWorkitemsJson error: " + err);
        if (!project)
            return callback("Error: the Project " + projectUuid + " did not exist");
        self.getJson(project.workitemUrl, function (err, res) {
            if (err)
                return callback("GetWorkitemsJson error: " + err);
            callback(null, res);
        });
    });
};




