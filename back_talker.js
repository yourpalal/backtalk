'use strict';

var ast = require('./ast');


var BackTalker = function() {
};

module.exports = BackTalker;


BackTalker.eval = function(string, scope) {
    var parsed = ast.fromSource();
    return parsed.eval(scope);
};


BackTalker.Scope = function(parent) {
    this.parent = parent || null;
    if (this.parent !== null) {
        this.names = Object.create(parent.names);
    } else {
        this.names = new Object();
    }
};


BackTalker.Scope.prototype.createSubScope = function() {
    return new BackTalker.Scope(this);
};


BackTalker.Scope.prototype.set = function(name, val) {
    this.names[name] = val;
};


BackTalker.Scope.prototype.get = function(name) {
    return this.names[name];
};
