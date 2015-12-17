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