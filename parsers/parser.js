/**
 * Created by jack8 on 2015/11/15.
 */
var parseString = require('xml2js').parseString,
    Project = require('../models/project.js').Project,
    Workitem = require('../models/workitem.js').Workitem,
    Comment = require('../models/comment.js').Comment,
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
        },
        //get foundin
        function (callback) {
            if (!workitem.foundIn.url)
                return callback(null);
            fetcher.getJson(workitem.foundIn.url, function (err, json) {
                if (err)
                    return callback("Get foundin: " + err);
                var foundIn = JSON.parse(json);
                workitem.foundIn.title = foundIn["dc:title"];
                callback(null);
            });
        },
        //get business value
        function (callback) {
            if (!workitem.businessValue.url)
                return callback(null);
            fetcher.getJson(workitem.businessValue.url, function (err, json) {
                if (err)
                    return callback("Get businessValue: " + err);
                var value = JSON.parse(json);
                workitem.businessValue.title = value["dc:title"];
                callback(null);
            });
        },
        //get risk
        function (callback) {
            if (!workitem.risk.url)
                return callback(null);
            fetcher.getJson(workitem.risk.url, function (err, json) {
                if (err)
                    return callback("Get risk: " + err);
                var value = JSON.parse(json);
                workitem.risk.title = value["dc:title"];
                callback(null);
            });
        },
        //get storyPoint
        function (callback) {
            if (!workitem.storyPoint.url)
                return callback(null);
            fetcher.getJson(workitem.storyPoint.url, function (err, json) {
                if (err)
                    return callback("Get storyPoint: " + err);
                var value = JSON.parse(json);
                workitem.storyPoint.title = value["dc:title"];
                callback(null);
            });
        },
        //get impact
        function (callback) {
            if (!workitem.impact.url)
                return callback(null);
            fetcher.getJson(workitem.impact.url, function (err, json) {
                if (err)
                    return callback("Get impact: " + err);
                var value = JSON.parse(json);
                workitem.impact.title = value["dc:title"];
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
    var self = this;
    var workitemsJson = JSON.parse(json);
    var workitems = [];
    async.forEachLimit(workitemsJson["oslc_cm:results"], 10, function (workitemJson, callback) {
        self.parseWorkitemJson(workitemJson, fetcher, function (err, workitem) {
            if (err) {
                return callback(err);
            }
            workitems.push(workitem);
            callback(null);
        })
    }, function (err) {
        if (err)
            return callback(err);
        callback(null, workitems);
    });
};

exports.parseWorkitemJson = function (json, fetcher, callback) {
    var cur = json;
    var workitem = new Workitem();
    workitem.title = cur["dc:title"];
    workitem.projectUuid = cur["rtc_cm:contextId"];
    workitem.description = cur["dc:description"];
    workitem.id = cur["dc:identifier"];
    workitem.createdTime = cur["dc:created"];
    workitem.lastModifiedTime = cur["dc:modified"];
    workitem.dueDate = cur["rtc_cm:due"];
    workitem.timeSpent = cur["rtc_cm:timeSpent"];
    workitem.estimate = cur["rtc_cm:estimate"];
    workitem.tags = cur["dc:subject"];
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

    if (cur["rtc_cm:foundIn"]) {
        workitem.foundIn.url = cur["rtc_cm:foundIn"]["rdf:resource"];
    } else {
        workitem.foundIn.url = null;
        workitem.foundIn.title = null;
    }

    if (cur["rtc_cm:businessvalue"]) {
        workitem.businessValue.url = cur["rtc_cm:businessvalue"]["rdf:resource"];
    } else {
        workitem.businessValue.url = null;
        workitem.businessValue.title = null;
    }

    if (cur["rtc_cm:rtc_cm:com.ibm.team.apt.attribute.complexity"]) {
        workitem.storyPoint.url = cur["rtc_cm:com.ibm.team.apt.attribute.complexity"]["rdf:resource"];
    } else {
        workitem.storyPoint.url = null;
        workitem.storyPoint.title = null;
    }

    if (cur["rtc_cm:com.ibm.team.rtc.attribute.impact"]) {
        workitem.impact.url = cur["rtc_cm:com.ibm.team.rtc.attribute.impact"]["rdf:resource"];
    } else {
        workitem.impact.url = null;
        workitem.impact.title = null;
    }

    if (cur["rtc_cm:risk"]) {
        workitem.risk.url = cur["rtc_cm:risk"]["rdf:resource"];
    } else {
        workitem.risk.url = null;
        workitem.risk.title = null;
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

    for (var i = 0; i < cur["rtc_cm:subscribers"].length; ++i) {
        workitem.subscribersUrl.push(cur["rtc_cm:subscribers"][i]["rdf:resource"]);
    }

    if (cur["rtc_cm:comments"].length > 0) {
        var firstCommentUrl = cur["rtc_cm:comments"][0]["rdf:resource"];
        workitem.commentsUrl = firstCommentUrl.substr(0, firstCommentUrl.lastIndexOf('/'));
    } else {
        workitem.commentsUrl = null;
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
        callback(null, workitem);
    });
};


exports.parseCommentsJson = function (json, callback) {
    var commentsJson = JSON.parse(json);
    var comments = [];
    async.forEachLimit(commentsJson, 5, function (commentJson, callback) {
        var comment = new Comment();
        comment.description = commentJson["dc:description"];
        comment.createdTime = commentJson["dc:created"];
        var userUrl = commentJson["dc:creator"]["rdf:resource"];
        comment.creator = userUrl.substr(userUrl.lastIndexOf('/') + 1);
        comments.push(comment);
        callback(null);
    }, function (err) {
        if (err)
            return callback(err);
        callback(null, comments);
    })
};