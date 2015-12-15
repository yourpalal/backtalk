export {Evaluator, evalBT as eval} from "./evaluator";
export {FunctionNameError, Scope} from "./scope";
export import secure = require("./secure");
export import StdLib = require("./standard_lib");
export {AutoVar, Vivify} from "./vars";
export {BaseError} from "./errors";
export {FuncParams, FuncResult, Immediate} from "./functions";
export {Library} from "./library";


export {parse, parseOrThrow, Parser, ParseError, ParseResult} from "./parser/parser";
export import AST = require("./parser/ast");

/**
 * @module back_talker
 * @description The back_talker module provides a simplified interface
 *  for all of backtalk.
 *
 * @borrows evaluator.Evaluator as Evaluator
 * @borrows evaluator.FunctionNameError as FunctionNameError
 * @borrows evaluator.evalBT as eval
 * @borrows scope.Scope as Scope
 * @borrows syntax as Syntax
 * @borrows vars.AutoVar as AutoVar
 */
