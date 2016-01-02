/**
 * Created by alvin on 1/1/16.
 */

//<table class="table table-bordered table-condensed fixed">
//    <tr>
//    <td class="active" colspan="0"><b>SET</b></td>
//    </tr>
//    <tr>
//    <td class="ins_row2"><b>arg0</b></td>
//    <td class="ins_row2 ins_row2_c">A</td>
//    <td class="ins_row2"><b>arg1</b></td>
//    <td class="ins_row2 ins_row2_c">B</td>
//    <td class="ins_row2"><b>ZCNO</b></td>
//    <td class="ins_row2 ins_row2_c">Z</td>
//    <td class="ins_row2"><b>PC</b></td>
//    <td class="ins_row2 ins_row2_c">+1</td>
//    <td class="ins_row2"><b>SP</b></td>
//    <td class="ins_row2 ins_row2_c">+0</td>
//    </tr>
//    <tr>
//    <td colspan="1"><b>BC</b></td>
//    <td colspan="0">21, 22, 23</td>
//</tr>
//<tr>
//<td colspan="0">
//    <p><b>Description</b></p>
//    Sets the value in arg0 to the register value in arg1. If arg0 is a memory value it takes the
//value at arg0 and places it into the register in arg1.
//</td>
//</tr>
//</table>

function initialize_tutorial() {
    var ins_stack = [];
    var key;
    for (key in INSTRUCTIONS) {
        if (INSTRUCTIONS.hasOwnProperty(key)) {
            ins_stack.push(key);
        }
    }
    while (ins_stack) {
        key = ins_stack.pop();
        var value = INSTRUCTIONS[key];
        var params = [value[ARG0], value[ARG1], value[ZCNO], value[INS_PC], value[INS_SP]];
        var param_description = ["arg0", "arg1", "ZCNO", "PC", "SP"];
        var param_length = params.length;
        var opcode = value[OP_CODES];
        var description = value[INS_DESCRIPTION];
        var section_to_add_to = $("#" + value[INS_TYPE]);
        var table = $("<table></table>").attr("class", "table table-bordered table-condensed fixed");
        var row0 = $("<tr></tr>").append($("<td></td>").attr({class: "active", colspan: "0"}).html(key.bold()));
        var row1 = $("<tr></tr>");
        for (var i = 0; i < param_length; i++) {
            row1.append($("<td></td>").attr({class: "ins_row2"}).html(param_description[i].bold()));
            row1.append($("<td></td>").attr({class: "ins_row2 ins_row2_c"}).html(params[i]));
        }
        var row2 = $("<tr></tr>")
            .append($("<td></td>").attr({colspan: "1"}).html("BC".bold()))
            .append($("<td></td>").attr({colspan: "0"}).html(opcode.join(", ")));
        var row3 = $("<tr></tr>")
            .append($("<td></td>").attr({colspan: "0"}).html(description)
                .prepend($("<p></p>").html("Description".bold()))
            );
        table.append(row0).append(row1).append(row2).append(row3);
        section_to_add_to.after(table);
    }
}
