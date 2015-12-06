$(document).on("click", ".CodeMirror-linenumber", function (event) {
    var number = event.target.innerHTML;
    if ($(event.target).css("backgroundColor") == "rgb(255, 0, 0)") {
        $(event.target).css({"backgroundColor": "rgba(0, 0, 0, 0)"});
        deleteBreakpoint(number);
        return;
    }
    $(event.target).css({"backgroundColor": "red"});
    addBreakpoint(number);
});