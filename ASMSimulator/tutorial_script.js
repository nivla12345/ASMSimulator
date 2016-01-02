/**
 * Created by alvin on 1/1/16.
 */

//<table class="table table-bordered table-condensed fixed">
//    <tr>
//    <td class="active" colspan="0"><b>SET</b></td>
//    </tr>
//    <tr>
//    <td class="instruction_table_row2"><b>arg0</b></td>
//    <td class="instruction_table_row2 instruction_table_row2_c">A</td>
//    <td class="instruction_table_row2"><b>arg1</b></td>
//    <td class="instruction_table_row2 instruction_table_row2_c">B</td>
//    <td class="instruction_table_row2"><b>ZCNO</b></td>
//    <td class="instruction_table_row2 instruction_table_row2_c">Z</td>
//    <td class="instruction_table_row2"><b>PC</b></td>
//    <td class="instruction_table_row2 instruction_table_row2_c">+1</td>
//    <td class="instruction_table_row2"><b>SP</b></td>
//    <td class="instruction_table_row2 instruction_table_row2_c">+0</td>
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
    for (var key in INSTRUCTIONS) {
        if (INSTRUCTIONS.hasOwnProperty(key)) {
            var section_to_add_to = $("#" + key[INS_TYPE]);
            var table = $("<table></table>").attr("class", "table table-bordered table-condensed fixed");
            var row0 = $("<tr></tr>");
            var r0c0 = $("<td></td>").attr({class: "active", colspan: "0"}).html(key.bold());
            section_to_add_to.append(table);
        }
    }
}