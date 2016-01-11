/**
 * Created by Alvin on 12/9/15.
 */

// enable user-defined autocompletion (if defined)
asm_mode.supportAutoCompletion = true;
CodeMirror.commands['my_autocompletion'] = function (cm) {
    CodeMirror.showHint(cm, asm_mode.autocompleter, {prefixMatch: true, caseInsensitiveMatch: true});
};
// this also works (takes priority if set)
asm_mode.autocompleter.options = {prefixMatch: true, caseInsensitiveMatch: true};

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

editor.on("gutterClick", function (cm, n) {
    var info = cm.lineInfo(n);
    // Placing the clearing checkpoint here because if placed together with the line status check, this would get
    // skipped.
    if (info.gutterMarkers) {
        cm.setGutterMarker(n, "breakpoints", null);
        return;
    }
    // Perform some checking to see if the attempted line to breakpoint is whitespace, comment, or address declaration.
    if (strip_label_definition(strip_whitespace_and_comment(editor.getValue().split("\n")[n])) == "")
        return;
    cm.setGutterMarker(n, "breakpoints", info.gutterMarkers ? null : makeMarker());
});

editor.setSize("100%", 610);

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