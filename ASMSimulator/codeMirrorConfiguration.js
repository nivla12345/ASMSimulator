/**
 * Created by Alvin on 12/9/15.
 */

<!-- TODO Create my own autocomplete for this ISA -->
var editor = CodeMirror.fromTextArea(document.getElementById("editor_box"), {
    lineNumbers: true,
    lineWrapping: true,
    //extraKeys: {"Ctrl-Space": "autocomplete"}, // TODO Change from javascript to something else.
    mode: {name: "javascript"}, // TODO Change from javascript to something else.
    //mode: "simplemode",
    styleActiveLine: true,
    theme: "blackboard",
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