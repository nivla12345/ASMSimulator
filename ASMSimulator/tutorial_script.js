/**
 * Created by alvin on 1/1/16.
 */
$('[data-toggle="tooltip"]').tooltip();

// Adds all the instruction definitions to the DOM.
function initialize_tutorial() {
    var ins_stack = [];
    var key;
    for (key in INSTRUCTIONS) {
        if (INSTRUCTIONS.hasOwnProperty(key)) {
            ins_stack.push(key);
        }
    }
    while (ins_stack.length) {
        key = ins_stack.pop();
        var value = INSTRUCTIONS[key];
        var params = [value.ARG0, value.ARG1, value.ZCNO, value.INS_PC, value.INS_SP];
        var param_description = ["arg0", "arg1", "ZCNO", "PC", "SP"];
        var param_length = params.length;
        var net_columns = (param_length << 1).toString();
        var opcode = value.OP_CODES;
        var description = value.INS_DESCRIPTION.replace(/arg0/g, "arg0".bold()).replace(/arg1/g, "arg1".bold());
        var section_to_add_to = $("#" + value.INS_TYPE);
        var table = $("<table></table>").attr("class", "table table-bordered table-condensed");
        var row0 = $("<tr></tr>").append($("<td></td>").attr({class: "active", colspan: net_columns}).html(key.bold()));
        var row1 = $("<tr></tr>");
        for (var i = 0; i < param_length; i++) {
            row1.append($("<td></td>").attr({class: "ins_row2"}).html(param_description[i].bold()));
            row1.append($("<td></td>").attr({class: "ins_row2 ins_row2_c"}).html(params[i]));
        }
        var row2 = $("<tr></tr>")
            .append($("<td></td>").attr({colspan: "1"}).html("BC".bold()))
            .append($("<td></td>").attr({colspan: net_columns}).html(opcode.join(", ")));
        var row3 = $("<tr></tr>")
            .append($("<td></td>").attr({colspan: net_columns}).html(description)
                .prepend($("<p></p>").html("Description".bold()))
            );
        table.append(row0).append(row1).append(row2).append(row3);
        section_to_add_to.after(table);
    }
}

var EXAMPLE_EDITORS = [["#plus_minus_example_box", "#plus_minus_example_btn", 730],
    ["#times_div_example_box", "#times_div_example_btn", 710],
    ["#jsr_rtn_example_box", "#jsr_rtn_example_btn", 310],
    ["#cmi_br_example_box", "#cmi_br_example_btn", 290],
    ["#set_example_box", "#set_example_btn", 170],
    ["#mov_example_box", "#mov_example_btn", 170],
    ["#logical_example_box", "#logical_example_btn", 100]
];

for (var example_editor_count = 0; example_editor_count < EXAMPLE_EDITORS.length; example_editor_count++) {
    function GENERATE_SAMPLE_CMS(id) {
        CodeMirror.fromTextArea($(id)[0], {
            lineNumbers: true,
            indentUnit: 4,
            indentWithTabs: false,
            lineWrapping: true,
            styleActiveLine: true,
            readOnly: true
        }).setSize("100%", EXAMPLE_EDITORS[example_editor_count][2]);
    }

    GENERATE_SAMPLE_CMS(EXAMPLE_EDITORS[example_editor_count][0]);
}

new Clipboard(EXAMPLE_EDITORS[0][1], {
    text: function (trigger) {
        return $(EXAMPLE_EDITORS[0][0]).html();
    }
});

new Clipboard(EXAMPLE_EDITORS[1][1], {
    text: function (trigger) {
        return $(EXAMPLE_EDITORS[1][0]).html();
    }
});

new Clipboard(EXAMPLE_EDITORS[2][1], {
    text: function (trigger) {
        return $(EXAMPLE_EDITORS[2][0]).html();
    }
});

new Clipboard(EXAMPLE_EDITORS[3][1], {
    text: function (trigger) {
        return $(EXAMPLE_EDITORS[3][0]).html();
    }
});

new Clipboard(EXAMPLE_EDITORS[4][1], {
    text: function (trigger) {
        return $(EXAMPLE_EDITORS[4][0]).html();
    }
});

new Clipboard(EXAMPLE_EDITORS[5][1], {
    text: function (trigger) {
        return $(EXAMPLE_EDITORS[5][0]).html();
    }
});

new Clipboard(EXAMPLE_EDITORS[6][1], {
    text: function (trigger) {
        return $(EXAMPLE_EDITORS[6][0]).html();
    }
});