/**
 * Created by jack8 on 2015/11/15.
 */
var parseString = require('xml2js').parseString,
    Project = require('../models/project.js').Project,
    Workitem = require('../models/workitem.js').Workitem,
    async = require('async');

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
                var services = cur["oslc_disc:services"][0]["$"]["rdf:resource"];
                var workitemUrl = services.substr(0, services.lastIndexOf('/'));
                projects.push(new Project({
                    uuid: uuid,
                    title: cur["dc:title"][0],
                    details: details,
                    services: services,
                    workitemUrl: workitemUrl
                }));
            }
            callback(null, projects);
        }
    });
};

var parseWorkitemOtherContributes = function (workitem, fetcher, callback) {
    async.parallel([
        //get workitem type
        function (callback) {
            if (!workitem.type.url)
                return callback(null);
            fetcher.getJson(workitem.type.url, function (err, typeJson) {
                if (err)
                    return callback("Get workitem type: " + err);
                var type = JSON.parse(typeJson);
                workitem.type.title = type["dc:title"];
                workitem.type.identifier = type["dc:identifier"];
                callback(null);
            });
        },
        //get plannedFor title
        function (callback) {
            if (!workitem.plannedFor.url)
                return callback(null);
            fetcher.getJson(workitem.plannedFor.url, function (err, iterationJson) {
                if (err)
                    return callback("Get plannedFor title: " + err);
                var iteration = JSON.parse(iterationJson);
                workitem.plannedFor.title = iteration["dc:title"];
                callback(null);
            });
        },
        //get filedAgainst title
        function (callback) {
            if (!workitem.filedAgainst.url)
                return callback(null);
            fetcher.getJson(workitem.filedAgainst.url, function (err, categoryJson) {
                if (err)
                    return callback("Get filedAgainst title: " + err);
                var category = JSON.parse(categoryJson);
                workitem.filedAgainst.title = category["dc:title"];
                callback(null);
            });
        },
        //get priority
        function (callback) {
            if (!workitem.priority.url)
                return callback(null);
            fetcher.getJson(workitem.priority.url, function (err, priorityJson) {
                if (err)
                    return callback("Get priority: " + err);
                var priority = JSON.parse(priorityJson);
                workitem.priority.title = priority["dc:title"];
                callback(null);
            });
        },
        //get severity
        function (callback) {
            if (!workitem.severity.url)
                return callback(null);
            fetcher.getJson(workitem.severity.url, function (err, severityJson) {
                if (err)
                    return callback("Get severity: " + err);
                var severity = JSON.parse(severityJson);
                workitem.severity.title = severity["dc:title"];
                callback(null);
            });
        }
    ], function (err) {
        if (err)
            return callback(err);
        callback(null);
    });
}

exports.parseWorkitemsJson = function (json, fetcher, callback) {
    var workitemsJson = JSON.parse(json);
    var workitems = [];
    async.forEachLimit(workitemsJson["oslc_cm:results"], 10, function (workitemJson, callback) {
        var cur = workitemJson;
        var workitem = new Workitem();
        workitem.title = cur["dc:title"];
        workitem.projectUuid = cur["rtc_cm:contextId"];
        workitem.description = cur["dc:description"];
        workitem.id = cur["dc:identifier"];
        workitem.createdTime = cur["dc:created"];
        workitem.lastModifiedTime = cur["dc:modified"];
        workitem.dueDate = cur["rtc_cm:due"];

        workitem.type.url = cur["dc:type"]["rdf:resource"];
        if (cur["rtc_cm:plannedFor"]) {
            workitem.plannedFor.url = cur["rtc_cm:plannedFor"]["rdf:resource"];
        } else {
            workitem.plannedFor.url = null;
            workitem.plannedFor.title = "Unassigned";
        }

        if (cur["rtc_cm:filedAgainst"]) {
            workitem.filedAgainst.url = cur["rtc_cm:filedAgainst"]["rdf:resource"];
        } else {
            workitem.filedAgainst.url = null;
            workitem.filedAgainst.title = "Unassigned";
        }

        if (cur["oslc_cm:severity"]) {
            workitem.severity.url = cur["oslc_cm:severity"]["rdf:resource"];
        } else {
            workitem.severity.url = null;
            workitem.severity.title = "Unassigned";
        }

        if (cur["oslc_cm:priority"]) {
            workitem.priority.url = cur["oslc_cm:priority"]["rdf:resource"];
        } else {
            workitem.priority.url = null;
            workitem.severity.title = "Unassigned";
        }

        if (cur["rtc_cm:subscribers"].length > 0) {
            workitem.subscribersUrl = cur["rtc_cm:subscribers"][0]["rdf:resource"];
        } else {
            workitem.subscribersUrl = "";
        }

        for (var i = 0; i < cur["rtc_cm:comments"].length; ++i) {
            workitem.commentsUrl.push(cur["rtc_cm:comments"][0]["rdf:resource"]);
        }

        var ownedByUrl = cur["rtc_cm:ownedBy"]["rdf:resource"];
        workitem.ownedBy.url = ownedByUrl;
        workitem.ownedBy.name = ownedByUrl.substr(ownedByUrl.lastIndexOf('/') + 1);

        var createdByUrl = cur["dc:creator"]["rdf:resource"];
        workitem.createdBy.url = createdByUrl;
        workitem.createdBy.name = createdByUrl.substr(createdByUrl.lastIndexOf('/') + 1);

        parseWorkitemOtherContributes(workitem, fetcher, function (err) {
            if (err)
                return callback(err);
            workitems.push(workitem);
            callback(null);
        });
    }, function (err) {
        if (err)
            return callback(err);
        callback(null, workitems);
    });
};