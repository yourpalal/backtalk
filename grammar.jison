/* JISON grammar for use with jison */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
"--"[^\n]*\n          /* ignore comments */

[0-9]+("."[0-9]+)?\b  return 'NUMBER'
"*"                   return '*'
"/"                   return '/'
"-"                   return '-'
"+"                   return '+'
"^"                   return '^'
"!"                   return '!'
"%"                   return '%'
"("                   return '('
")"                   return ')'
"$[a-z]+[a-z0-9]*"    return 'REF'
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%left '+' '-'
%left '*' '/'
%left '^'
%right '!'
%right '%'
%left UMINUS

%start expressions

%% /* language grammar */

assign
    : WITH REF AS e
        {$$ = new AST.AssignOp(

e
    : e '+' e
        {$$ = new AST.PlusOp($1, $3);}
    | e '-' e
        {$$ = new AST.MinusOp($1, $3);}
    | e '*' e
        {$$ = new AST.MultOp($1, $3);}
    | e '/' e
        {$$ = new AST.DivOp($1, $3);}
    | '-' e %prec UMINUS
        {$$ = new AST.UnaryMinus($2);}
    | '(' e ')'
        {$$ = $2;}
    | NUMBER
        {$$ = AST.Literal(Number(yytext));}
    | REF
        {$$ = AST.Ref(yytext);}
    ;

