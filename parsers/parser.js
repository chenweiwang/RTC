/**
 * Created by jack8 on 2015/11/15.
 */
var parseString = require('xml2js').parseString,
    Project = require('../models/project.js').Project;

exports.parseProjectsXml = function(xml, callback) {
    parseString(xml, function(err, result) {
        if (err) {
            console.log("Parse projects xml error");
            return callback(err);
        } else {
            var projects = [];
            var projectArray = result["oslc_disc:ServiceProviderCatalog"]["oslc_disc:entry"];
                for (var i = 0; i < projectArray.length; ++i) {
                    var cur = projectArray[i]["oslc_disc:ServiceProvider"][0];
                    var details = cur["oslc_disc:details"][0]["$"]["rdf:resource"];
                    var uuid = details.substr(details.lastIndexOf('/') + 1);
                    projects.push(new Project({
                        uuid: uuid,
                        title: cur["dc:title"][0],
                        details: details,
                        services: cur["oslc_disc:services"][0]["$"]["rdf:resource"]
                    }));
            }
            callback(null, projects);
        }
    });
};

exports.parseServiceXml = function(xml, callback) {
    //for defect, task and simpleQuery are the same, so we just find the workitems url.
    var descRegExp = /<.*description>(.*)<\/.*description>/;
    var description = descRegExp.exec(xml);
    var workItemUrlRegExp = /<.*simpleQuery>.*<oslc_cm:url>(.*)<\/oslc_cm:url>/;

};