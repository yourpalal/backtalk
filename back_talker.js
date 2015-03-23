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

    parse: function(source, inspector) {
        this._parser = this._parser || new BackTalker.AST.Parser();
        return this._parser.fromSource(source, inspector);
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


BackTalker.AST.makeVisitor(BackTalker.Evaluator.prototype, function(name) {
    return function() {
        console.log('BackTalker.Evaluator missing visit' + name, ' !!!!!!!');
    };
});


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

BackTalker.Evaluator.prototype.visitCompoundExpression = function(node) {
    var result;
    node.parts.forEach(function(part) {
        result = part.accept(this);
    }, this);
    return result;
};

BackTalker.Evaluator.prototype.visitHangingCall = function(node) {
    var f = this.context.findFunc(node.name)
        ,args;

    if ((f || 0) === 0) {
        throw Error("function called but undefined " + node.name);
    }

    args = node.args.map(function(arg) {
        return arg.accept(this);
    }, this);

    args.unshift(node.body);
    return f.apply(this, args);
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
    // deets = {
    //  patterns: ["bare with $ arguments $", "dynamic <bare|words> $ cool"]
    //  impl: function(a, b, c) {
    //  }
    //}
    deets.patterns.map(function(pattern) { 
        var pieces = pattern.split(" "),
            parts = pieces.map(function(piece) {
                        // match "<bare|words|like|this>"
                        var match = piece.match(/<(([a-zA-Z]+)(\|[a-zA-Z]+)*)>/);
                        if (match !== null) {
                            return match[1].split("|");
                        } else {
                            return [piece];
                        }
                    });

        // now we have an array of parts, where a normal bare word is a
        // singleton, and patterns are not. We want to turn that into
        // a bunch of strings that we will register, and lists of the dynamic
        // parts for each string
        var patterns = parts.reduce(function(strings, part) {
            var dynamic = (part.length > 1),
                result = [];

            part.forEach(function(bare) {
                strings.forEach(function(s) {
                    result.push({
                        val: s.val.concat(bare),
                        dyn: dynamic ? s.dyn.concat(bare) : s.dyn
                    });
                });
            });

            return result;
        }, [{val: [], dyn: []}]);

        // now we can register a wraper for all of the specified functions
        // that will append the dynamic parts of the pattern as arguments
        patterns.forEach(function(pattern) {
            this.funcs['0' + pattern.val.join(" ")] = function() {
                var args = Array.prototype.slice.call(arguments).concat(pattern.dyn);
                return deets.impl.apply(this, args);
            };
        }, this);
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
