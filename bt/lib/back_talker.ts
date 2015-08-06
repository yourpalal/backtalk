export {Evaluator, FunctionNameError, evalBT as eval} from "./evaluator";
export {Scope} from "./scope";
export import StdLib = require("./standard_lib");
export import Syntax = require("./syntax");
export {AutoVar, Vivify} from "./vars";
export {BaseError} from "./errors";

export var parse = Syntax.parse;
