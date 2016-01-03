/**
 * Created by Alvin on 12/9/15.
 */

// 1. an almost complete python grammar in simple JSON format
var asm_grammar = {

// prefix ID for regular expressions, represented as strings, used in the grammar
    "RegExpID"                  : "RE::",

// Style model
    "Style"                     : {

        "comment"               : "comment"
        ,"decorator"            : "meta"
        , "Instruction"         : "keyword"
        , "Register"            : "builtin"
        , "identifier"          : ""
        , "number"              : "number"
        , "Label": "string"
    },

// Lexical model
    "Lex"                       : {

        "comment:comment": [COMMENT, null]
        , "Label": "RE::/[\.][_A-Za-z0-9]+/" // in my case label
        , "identifier": "RE::/[_A-Za-z][_A-Za-z0-9]*/"
        , "decorator": [
            // integers
            // hex
            "RE::/[\$]0x[0-9a-fA-F]+/",
            // decimal
            "RE::/[\$][1-9]\\d*/",
            // just zero
            "RE::/[\$]0(?![\\dx])/"
        ]
        ,"number"               : [
            // integers
            // hex
            "RE::/0x[0-9a-fA-F]+/",
            // decimal
            "RE::/[1-9]\\d*/",
            // just zero
            "RE::/0(?![\\dx])/"
        ]
        , "Instruction": {
            "autocomplete": true, "tokens": Object.keys(INSTRUCTIONS)
        }
        , "Register": {
            "autocomplete": true, "tokens": Object.keys(LIST_REG_NAMES)
        }
    },

// Syntax model (optional)
    "Syntax"                    : {

        "asm": "comment | decorator | number | Label | Instruction | Register | identifier"

    },

// what to parse and in what order
// an array i.e ["asm"], instead of single token i.e "asm", is a shorthand for an "ngram"-type syntax token (for parser use)
    "Parser"                    : [ ["asm"] ]

};

// 2. parse the grammar into a Codemirror syntax-highlight mode
var asm_mode = CodeMirrorGrammar.getMode( asm_grammar );


// 3. use it with Codemirror
CodeMirror.defineMode("asm", asm_mode);

// enable user-defined autocompletion (if defined)
asm_mode.supportAutoCompletion = true;
CodeMirror.commands['my_autocompletion'] = function( cm ) {
    CodeMirror.showHint(cm, asm_mode.autocompleter, {prefixMatch:true, caseInsensitiveMatch:true});
};
// this also works (takes priority if set)
asm_mode.autocompleter.options = {prefixMatch:true, caseInsensitiveMatch:true};

var editor = CodeMirror.fromTextArea($("#editor_box")[0], {
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

//editor.on("change", function() {
//   EDITOR_CHANGED = true;
//});

function makeMarker() {
    return $("<div></div>").css("color", "red").html("●")[0];
}

function pcAtBP(mem2line, pc) {
    if (_.has(mem2line, pc))
        return editor.lineInfo(parseInt(mem2line[pc]) - 1).gutterMarkers != null;
    return false;
}