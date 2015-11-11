/**
 * Created by jack8 on 2015/11/9.
 */
var fs = require('fs');

function Updater(request, rootUrl) {
    this.rootUrl = rootUrl;
    this.request = request;
    this.rootServicesUrl = rootUrl + "/rootservices";
}

module.exports = Updater;

//get the projects
Updater.prototype.getProjects = function(callback) {
    var request = this.request;
    var options = {
        url: this.rootServicesUrl,
        headers: {
            'Accept': 'application/json'
        }
    };
    request.get(options, function(err, res) {
        if (err) {
            return callback(err);
        }
        var rootServices = JSON.parse(res.body);
        var projectsUrl = rootServices["https://opentechtest.chinacloudapp.cn:9443/jazz/rootservices"]
            ["http://open-services.net/xmlns/cm/1.0/cmServiceProviders"][0].value;
        console.log("Projects Url: " + projectsUrl);
        options.url = projectsUrl;
        options.headers.Accept = '*/*';
        request.get(projectsUrl, function(err, res) {
            if (err) {
                return callback(err);
            }
            return callback(null, res.body);
        }).pipe(fs.createWriteStream('projects.xml'));
    });
}

