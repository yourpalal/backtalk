'use strict';

var BackTalker = {
    AST: require('./ast'),
    StdLib: require('./standard_lib'),
    Evaluator: function(scope) {
        this.scope = scope || BackTalker.StdLib.inScope(new BackTalker.Scope());
        this.newSubEval = false;
    },
    Scope: function(parent) {
        this.parent = parent || null;
        if (this.parent !== null) {
            this.names = Object.create(parent.names);
            this.funcs = Object.create(parent.funcs);
        } else {
            this.names = new Object();
            this.funcs = new Object();
        }
    },
    AutoVar: function(name, scope, value) {
        this.name = name;
        this.scope = scope;
        this.value = value;
        this.defined = (typeof value !== 'undefined');
    },
    parse: function(source, inspector) {
        this._parser = this._parser || new BackTalker.AST.Parser();
        return this._parser.fromSource(source, inspector);
    },
    eval: function(source, scope) {
        var parsed;
        if (typeof(source) === 'string') {
            parsed = BackTalker.parse(source);
        } else {
            parsed = source; // hopefuly this is the AST
        }
        return (new BackTalker.Evaluator(scope)).eval(parsed);
    },

    VIVIFY: {
        ALWAYS: 1
        ,NEVER: 0
        ,AUTO: 2
    }
};

for (var key in BackTalker) {
    module.exports[key] = BackTalker[key];
}


BackTalker.Evaluator.prototype.evalString = function(source) {
    return this.eval(BackTalker.parse(source));
};

BackTalker.Evaluator.prototype.eval = function(node) {
    this.body = node;
    return node.accept(this);
};


BackTalker.Evaluator.prototype.makeSubEvaluator = function() {
    var subEval = new BackTalker.Evaluator(new BackTalker.Scope(this.scope));
    subEval.newSubEval = true;
    return subEval;
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

BackTalker.Evaluator.prototype.visitCompoundExpression = function(node) {
    var result;
    node.parts.forEach(function(part) {
        result = part.accept(this);
    }, this);
    return result;
};

// ArgsEvaluator is an AST Visitor that returns AutoVar for all RefNodes
BackTalker.Evaluator.ArgsEvaluator = function(subEval) {
    this.subEval = subEval;
};

BackTalker.AST.makeVisitor(BackTalker.Evaluator.ArgsEvaluator.prototype,
    function(name) {
        var name = 'visit' + name;
        return function(a, b) {
            return this.subEval[name](a, b);
        }
    }
);

BackTalker.Evaluator.ArgsEvaluator.prototype.visitRef = function(node) {
    return this.subEval.scope.getVivifiable(node.name);
};

BackTalker.Evaluator.prototype.callFunc = function(subEval, name, args) {
    var i = 0
        ,f = this.scope.findFunc(name)
        ,argsGetter = new BackTalker.Evaluator.ArgsEvaluator(this);

    if ((f || 0) === 0) {
        throw Error("function called but undefined " + name);
    }

    args = args.map(function(arg) {
        return arg.accept(argsGetter);
    }, this);

    for (; i < f.vivification.length; i++) {
        var viv = f.vivification[i]
            ,defined = args[i].defined
            ,isAuto = (args[i] instanceof BackTalker.AutoVar);

        if (viv === BackTalker.VIVIFY.ALWAYS) {
            if (isAuto) {
                continue;
            } else {
                throw Error("value used in place of variable in call to '" + name + "'");
            }
        }

        if (!isAuto) {
            continue;
        }

        if (defined) {
            args[i] = args[i].value;
            continue;
        }

        if (viv === BackTalker.NEVER) {
            throw Error("undefined variable $" + args[i].name + " used in place of defined variable in call to '" + name + "'");
        }
    }

    return f.impl.apply(subEval, args);
};

BackTalker.Evaluator.prototype.visitHangingCall = function(node) {
    var subEval = this.makeSubEvaluator();
    subEval.body = node.body;
    return this.callFunc(subEval, node.name, node.args);
};


BackTalker.Evaluator.prototype.visitFuncCall = function(node) {
    this.newSubEval = false;
    return this.callFunc(this, node.name, node.args);
};


BackTalker.Scope.prototype.findFunc = function(name) {
    return this.funcs['0' + name];
};

BackTalker.Scope.prototype.addFunc = function(deets) {
    // $ = variable
    // <bare|words> = bare options
    // $!! = just get the name of the var
    // $! = auto-vivifiable variable this is good for placeholders, for instance
    //          you will get an instance of BackTalker.AutoVar if an argument is
    //          auto-vivified.
    //
    // deets = {
    //  patterns: ["bare with $! arguments $", "dynamic with <bare|words> arguments $"]
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
        // ["singleton"], and ["patterns", "are", "not"].
        // We want to turn that into
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

        // now we can register a wrapper for all of the specified functions
        // that will append the dynamic parts of the pattern as arguments
        patterns.forEach(function(pattern) {
            var vivifiable = [];
            pattern.val.forEach(function(piece, i) {
                if (piece === '$')  {
                    vivifiable.push(BackTalker.VIVIFY.NEVER);
                } else if (piece === '$!!') {
                    vivifiable.push(BackTalker.VIVIFY.ALWAYS);
                    pattern.val[i] = '$';
                } else if (piece === '$!') {
                    vivifiable.push(BackTalker.VIVIFY.AUTO);
                    pattern.val[i] = '$';
                }
            });

            this.funcs['0' + pattern.val.join(" ")] = {
                vivification: vivifiable,
                impl: function() {
                    var args = Array.prototype.slice.call(arguments).concat(pattern.dyn);
                    return deets.impl.apply(this, args);
                }
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

BackTalker.Scope.prototype.getVivifiable = function(name) {
    return new BackTalker.AutoVar(name, this, this.names[name]);
};
