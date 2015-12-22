/**
 * Created by Alvin on 12/9/15.
 */

// 1. an almost complete asm grammar in simple JSON format
var asm_grammar = {

// prefix ID for regular expressions, represented as strings, used in the grammar
    "RegExpID"                  : "RE::",

    "Extra"                     : {

        "fold"                  : "indent"
    },

// Style model
    "Style"                     : {

        "comment"              : "comment"
        ,"decorator"            : "meta"
        ,"keyword"              : "keyword"
        ,"builtin"              : "builtin"
        ,"operator"             : "operator"
        ,"identifier"           : "variable"
        ,"number"               : "number"
        ,"string"               : "string"
        ,"heredoc"              : "string"

    },

// Lexical model
    "Lex"                       : {

        "comment:comment"      : ["#", null]
        ,"heredoc:block"        : [["'''"], ["\"\"\""], ["RE::/([rubRUB]|(ur)|(br)|(UR)|(BR))?('{3}|\"{3})/", 6]]
        ,"string:escaped-block" : [["RE::/(['\"])/", 1], ["RE::/([rubRUB]|(ur)|(br)|(UR)|(BR))?(['\"])/", 6]]
        ,"identifier"           : "RE::/[_A-Za-z][_A-Za-z0-9]*/"
        ,"decorator"            : "RE::/@[_A-Za-z][_A-Za-z0-9]*/"
        ,"number"               : [
            // floats
            "RE::/\\d*\\.\\d+(e[\\+\\-]?\\d+)?[jJ]?/",
            "RE::/\\d+\\.\\d*[jJ]?/",
            "RE::/\\.\\d+[jJ]?/",
            // integers
            // hex
            "RE::/0x[0-9a-fA-F]+[lL]?/",
            // binary
            "RE::/0b[01]+[lL]?/",
            // octal
            "RE::/0o[0-7]+[lL]?/",
            // decimal
            "RE::/[1-9]\\d*(e[\\+\\-]?\\d+)?[lL]?[jJ]?/",
            // just zero
            "RE::/0(?![\\dx])/"
        ]
        ,"operator"             : {"combine":false,"tokens":[
            "\\", "+", "-", "*", "/", "%", "&", "|", "^", "~", "<", ">" , "!",
            "==", "!=", "<=", ">=", "<>", "<<", ">>", "//", "**",
            "and", "or", "not", "is", "in"]}
        ,"delimiter"            : {"combine":false,"tokens":[
            "(", ")", "[", "]", "{", "}", ",", ":", "`", "=", ";", ".",
            "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=",
            ">>=", "<<=", "//=", "**=", "@"]}
        ,"keyword"              : {"autocomplete":true,"tokens":[
            "assert", "break", "class", "continue",
            "def", "del", "elif", "else", "except", "finally",
            "for", "from", "global", "if", "import",
            "lambda", "pass", "raise", "return",
            "try", "while", "with", "yield", "as"
        ]}
        ,"builtin"              : {"autocomplete":true,"tokens":[
            "abs", "all", "any", "bin", "bool", "bytearray", "callable", "chr",
            "classmethod", "compile", "complex", "delattr", "dict", "dir", "divmod",
            "enumerate", "eval", "filter", "float", "format", "frozenset",
            "getattr", "globals", "hasattr", "hash", "help", "hex", "id",
            "input", "int", "isinstance", "issubclass", "iter", "len",
            "list", "locals", "map", "max", "memoryview", "min", "next",
            "object", "oct", "open", "ord", "pow", "property", "range",
            "repr", "reversed", "round", "set", "setattr", "slice",
            "sorted", "staticmethod", "str", "sum", "super", "tuple",
            "type", "vars", "zip", "__import__", "NotImplemented",
            "Ellipsis", "__debug__"
        ]}

    },

// Syntax model (optional)
    "Syntax"                    : {

        "asm"                    : "comment | heredoc | number | string | decorator | operator | delimiter | keyword | builtin | identifier"

    },

// what to parse and in what order
// an array i.e ["asm"], instead of single token i.e "asm", is a shorthand for an "ngram"-type syntax token (for parser use)
    "Parser"                    : [ ["asm"] ]

};

// 2. parse the grammar into a Codemirror syntax-highlight mode
var asm_mode = CodeMirrorGrammar.getMode( asm_grammar );


// 3. use it with Codemirror
CodeMirror.defineMode("asm", asm_mode);

// enable user-defined code folding in the specification (new feature)
asm_mode.supportCodeFolding = true;
CodeMirror.registerHelper("fold", asm_mode.foldType, asm_mode.folder);

// enable syntax lint-like validation in the grammar
asm_mode.supportGrammarAnnotations = true;
CodeMirror.registerHelper("lint", "asm", asm_mode.validator);

// enable user-defined autocompletion (if defined)
asm_mode.supportAutoCompletion = true;
CodeMirror.commands['my_autocompletion'] = function( cm ) {
    CodeMirror.showHint(cm, asm_mode.autocompleter, {prefixMatch:true, caseInsensitiveMatch:false});
};
// this also works (takes priority if set)
asm_mode.autocompleter.options = {prefixMatch:true, caseInsensitiveMatch:false};

<!-- TODO Create my own autocomplete for this ISA -->
var editor = CodeMirror.fromTextArea(document.getElementById("editor_box"), {
    //mode: "asm",
    lineNumbers: true,
    indentUnit: 4,
    indentWithTabs: false,
    lineWrapping: true,
    styleActiveLine: true,
    theme: "blackboard",
    extraKeys: {"Ctrl-Space": 'my_autocompletion'},

    //mode: {name: "javascript", globalVars: true},
    //extraKeys: {"Ctrl-Space": "autocomplete"},

    gutters: ["CodeMirror-linenumbers", "breakpoints"]
});

editor.on("gutterClick", function(cm, n) {
    var info = cm.lineInfo(n);
    // Placing the clearing checkpoint here because if placed together with the line status check, this would get
    // skipped.
    if (info.gutterMarkers) {
        cm.setGutterMarker(n, "breakpoints", null);
        return;
    }
    // Perform some checking to see if the attempted line to breakpoint is whitespace, comment, or address declaration.
    if (strip_label(strip_whitespace_and_comment(editor.getValue().split("\n")[n])) == "")
        return;
    cm.setGutterMarker(n, "breakpoints", info.gutterMarkers ? null : makeMarker());
});

function makeMarker() {
    var marker = document.createElement("div");
    marker.style.color = "red";
    marker.innerHTML = "●";
    return marker;
}

function pcAtBP(mem2line, pc) {
    if (_.has(mem2line, pc))
        return editor.lineInfo(parseInt(mem2line[pc]) - 1).gutterMarkers != null;
    return false;
}