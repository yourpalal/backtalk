

var AST = require('./ast'),
    parser = new AST.Parser();


var BackTalker = function() {
};

module.exports = BackTalker;


BackTalker.Evaluator = function(scope) {
    this.scope = scope;
};

BackTalker.Evaluator.prototype.eval = function(node) {
    return node.accept(this);
};

BackTalker.Evaluator.prototype.visitBinOpNode = function(node) {
    var left = this.eval(node.left),
            i = 0;

        for (i = 0; i < node.ops.length; i++) {
            left = node.ops[i].accept(this, left);
        }
        return left;
};

BackTalker.Evaluator.prototype.visitAddOp = function(node, left) {
    return left + node.right.accept(this);
};

BackTalker.Evaluator.prototype.visitSubOp = function(node, left) {
    return left - node.right.accept(this);
};

BackTalker.Evaluator.prototype.visitDivideOp = function(node, left) {
    return left / node.right.accept(this);
};

BackTalker.Evaluator.prototype.visitMultOp = function(node, left) {
    return left * node.right.accept(this);
};

BackTalker.Evaluator.prototype.visitLiteral = function(node) {
    return node.val;
};

BackTalker.Evaluator.prototype.visitUnaryMinus = function(node) {
    return - node.accept(this);
};

BackTalker.Evaluator.prototype.visitRef = function(node) {
    return this.scope.get(node.name);
};

BackTalker.Evaluator.prototype.visitRefSet = function(node) {
    var rs = node.val.accept(this);
    this.scope.set(node.name, rs);
    return rs;
};

BackTalker.eval = function(source, scope) {
    var parsed;
    if (typeof(source) === 'string') {
        parsed = parser.fromSource(source);
    } else {
        parsed = source; // hopefuly this is the AST
    }
    return (new BackTalker.Evaluator(scope)).eval(parsed);
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
