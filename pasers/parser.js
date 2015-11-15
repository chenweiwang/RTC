/**
 * Created by jack8 on 2015/11/15.
 */
var parseString = require('xml2js').parseString,
    Project = require('../models/project.js').Project;

exports.parseProjectsXml = function(xml, callback) {
    parseString(xml, function(err, result) {
        if (err) {
            console.log("Parse projects xml error");
        } else {
            var projects = [];
            var projectArray = result["oslc_disc:ServiceProviderCatalog"]["oslc_disc:entry"];
            for (var i = 0; i < projectArray.length; ++i) {
                var cur = projectArray[i]["oslc_disc:ServiceProvider"][0];
                projects.push(new Project({
                    title: cur["dc:title"][0],
                    details: cur["oslc_disc:details"][0]["$"]["rdf:resource"],
                    services: cur["oslc_disc:services"][0]["$"]["rdf:resource"]
                }));
            }
            callback(projects);
        }
    })
}