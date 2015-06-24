import evaluator = require("./evaluator");
import functions = require("./functions");
import scope = require("./scope");
import stdLib = require("./standard_lib");
import syntax = require("./syntax");
import vars = require("./vars");

export var Vivify = vars.Vivify;
export var AutoVar = vars.AutoVar;
export var Scope = scope.Scope;
export var Evaluator = evaluator.Evaluator;
export var eval = evaluator.evalBT;

export var parse = syntax.parse;

export var StdLib = stdLib;
export var Syntax = syntax;