var newRequest = require('./newRequest.js'),
    authenticate = require('./authenticate.js'),
    Updater = require('./Updater.js');

var rootUrl = "https://opentechtest.chinacloudapp.cn:9443/jazz";
var username = "jack";
var password = "jack";
var request = newRequest();
var updater = new Updater(request, rootUrl);

authenticate(request, rootUrl, username, password, function(err) {
    if (err) {
        console.log("Login failed!");
    } else {
        console.log("Login to " + rootUrl + " success!");
        console.log("Begin to refresh resource..");
        updater.getProjects(function(err, projects) {
            if (err) {
                console.log("Fetch projects failed!");
            } else {
                console.log(projects);
            }
        })
    }

});





