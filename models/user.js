/**
 * Created by v-wajie on 2015/11/30.
 */
var bcrypt = require('bcrypt-nodejs'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var userSchema = new Schema({
    username: { type: String, require: true },
    password: { type: String, require: true },
    projectUuids: { type: [String] }
});


// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};


var user = mongoose.model('user', userSchema);

module.exports = {
    User: user
};
