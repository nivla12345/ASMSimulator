/**
 * Created by Alvin on 12/9/15.
 */

// TODO
// The things that my languages is composed of:
// - Labels, \.\w+\b
// - Comments, ;\w+\b
    // - Instructions, \b(SET|...)\b
    // - Registers, \b(SET|...)\b
// - Immediate values, \$\w+\b


// 1. an almost complete asm grammar in simple JSON format
var asm_grammar = {

// prefix ID for regular expressions, represented as strings, used in the grammar
    "RegExpID"                  : "RE::",

    "Extra"                     : {

        "fold"                  : "indent"
    },

// Style model
    "Style"                     : {

        "comment"               : "comment"
        ,"decorator"            : "meta"
        ,"Instruction"          : "keyword"
        ,"Registers"            : "builtin"
        ,"operator"             : "operator"
        ,"identifier"           : "variable"
        ,"number"               : "number"
        ,"label"               : "string"
    },

// Lexical model
    "Lex"                       : {

         "comment:comment"      : [";", null]
        ,"label"                : "RE::/[\.][_A-Za-z0-9]+/"
        ,"identifier"           : [
            // hex
            "RE::/[\$]0x[0-9a-fA-F]+/",
            // decimal
            "RE::/[\$][0-9]+/"
            ]
        ,"number"               : [
            // integers
            // hex
            "RE::/0x[0-9a-fA-F]+/",
            // decimal
            "RE::/[0-9]+/",
            // just zero
            "RE::/0(?![\\dx])/"
        ]
        ,"Instruction"          : {"autocomplete":true,"tokens":[
            "STP", "CCL", "PSH", "POP", "RTN", "JSR", "BRG", "BRZ", "BRA", "BRN", "CMP",
            "OR" , "AND", "LSH", "RSH", "DIV", "MUL", "SUB", "ADD", "MOV", "SET"
        ]}
        ,"Registers"            : {"autocomplete":true,"tokens":[
            "R0", "R1", "R2", "R3"
        ]}

    },

// Syntax model (optional)
    "Syntax"                    : {

        "asm": "comment | number | label | decorator | Instruction | Registers | identifier"

    },

// what to parse and in what order
// an array i.e ["asm"], instead of single token i.e "asm", is a shorthand for an "ngram"-type syntax token (for parser use)
    "Parser"                    : [ ["asm"] ]

};

// 2. parse the grammar into a Codemirror syntax-highlight mode
var asm_mode = CodeMirrorGrammar.getMode( asm_grammar );


// 3. use it with Codemirror
CodeMirror.defineMode("asm", asm_mode);

// enable syntax lint-like validation in the grammar
asm_mode.supportGrammarAnnotations = true;
CodeMirror.registerHelper("lint", "asm", asm_mode.validator);

// enable user-defined autocompletion (if defined)
asm_mode.supportAutoCompletion = true;
CodeMirror.commands['my_autocompletion'] = function( cm ) {
    CodeMirror.showHint(cm, asm_mode.autocompleter, {prefixMatch:true, caseInsensitiveMatch:true});
};
// this also works (takes priority if set)
asm_mode.autocompleter.options = {prefixMatch:true, caseInsensitiveMatch:true};

<!-- TODO Create my own autocomplete for this ISA -->
var editor = CodeMirror.fromTextArea(document.getElementById("editor_box"), {
    //mode: "asm",
    lineNumbers: true,
    indentUnit: 4,
    indentWithTabs: false,
    lineWrapping: true,
    styleActiveLine: true,
    theme: "blackboard",
    extraKeys: {"Ctrl-Space": 'my_autocompletion', "Ctrl-K": "toggleComment"},

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