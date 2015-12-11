/**
 * Created by Alvin on 12/9/15.
 */
<!-- TODO Create my own autocomplete for this ISA -->
var editor = CodeMirror.fromTextArea(document.getElementById("editor_box"), {
    lineNumbers: true,
    lineWrapping: true,
    extraKeys: {"Ctrl-Space": "autocomplete"},
    mode: {name: "javascript", globalVars: true}, // TODO Change from javascript to something else.
    styleActiveLine: true,
    theme: "blackboard",
    gutters: ["CodeMirror-linenumbers", "breakpoints"]
});

editor.on("gutterClick", function(cm, n) {
    var info = cm.lineInfo(n);
    if (info.gutterMarkers) {
        deleteBreakpoint(n + 1);
    }
    else {
        addBreakpoint(n + 1);
    }
    cm.setGutterMarker(n, "breakpoints", info.gutterMarkers ? null : makeMarker());
});

function makeMarker() {
    var marker = document.createElement("div");
    marker.style.color = "red";
    marker.innerHTML = "●";
    return marker;
}