/**
 * Created by jack8 on 2015/11/15.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var projectSchema = new Schema({
    uuid: { type: String, require: true, trim: true, index: { unique: true } },
    title: { type: String, require: true, trim: true },
    details: { type: String },
    services: { type: String },
    workitemUrl: { type: String }
});

var project = mongoose.model('project', projectSchema);

module.exports = {
    Project: project
};