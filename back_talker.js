'use strict';

var BackTalker = {
    AST: require('./ast'),
    Evaluator: function(scope, context) {
        this.scope = scope || new BackTalker.Scope();
        this.context = context || new BackTalker.Context();
    },
    Context: function() {
        this.funcs = {};
    },
    Scope: function(parent) {
        this.parent = parent || null;
        if (this.parent !== null) {
            this.names = Object.create(parent.names);
        } else {
            this.names = new Object();
        }
    },

    parse: function(source) {
        this._parser = this._parser || new BackTalker.AST.Parser();
        return this._parser.fromSource(source);
    },
    eval: function(source, scope, context) {
        var parsed;
        if (typeof(source) === 'string') {
            parsed = BackTalker.parse(source);
        } else {
            parsed = source; // hopefuly this is the AST
        }
        return (new BackTalker.Evaluator(scope, context)).eval(parsed);
    }
};

for (var key in BackTalker) {
    module.exports[key] = BackTalker[key];
}


BackTalker.Evaluator.prototype.evalString = function(source) {
    return this.eval(BackTalker.parse(source));
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

BackTalker.Evaluator.prototype.visitFuncCall = function(node) {
    var f = this.context.findFunc(node.name);
    if ((f || 0) === 0) {
        throw Error("function called but undefined " + node.name);
    }
    return f.apply(this, node.args.map(function(arg) {
        return arg.accept(this);
    }, this));
};


BackTalker.Context.prototype.findFunc = function(name) {
    return this.funcs['0' + name];
};

BackTalker.Context.prototype.addFunc = function(deets) {
    deets.patterns.map(function(pattern) { 
        this.funcs['0' + pattern] = deets.impl;
    }, this);
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
