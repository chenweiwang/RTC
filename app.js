var newRequest = require('./newRequest.js'),
    authenticate = require('./authenticate.js'),
    Updater = require('./Updater.js'),
    parseString = require('xml2js').parseString;

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
        updater.getProjects(function(err, projectsXml) {
            if (err) {
                console.log("Fetch projects failed!");
            } else {
                console.log(projectsXml);
                parseString(projectsXml, function(err, projects) {
                    if (err) {
                        console.log("Parse xml Error");
                    } else {
                        //console.log(projects);
                        var tmp = projects["oslc_disc:ServiceProviderCatalog"]["oslc_disc:entry"][0];
                        var result = tmp["oslc_disc:ServiceProvider"][0]["oslc_disc:services"];
                        console.log(result[0]["$"]["rdf:resource"]);
                    }
                })
            }
        })
    }
});





