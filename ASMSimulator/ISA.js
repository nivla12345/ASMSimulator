/**
 * Created by Alvin on 11/13/2014.
 */
/**********************************************************************************************************************/
/********************************************** CONSTANT VALUES *******************************************************/
/**********************************************************************************************************************/
const MEM_SIZE = 512;
const MAX_ADDRESS = MEM_SIZE - 1; // Must be a (power of 2) - 1
const BIT_MASK_16 = 0xFFFF;
const BIT_MASK_SIGN = 0x8000;
const DECIMAL_LENGTH = 10;
const HEX_LENGTH = 16;

// HTML Globals
const PC_TRACKING_COLOR = "pink";
const SP_TRACKING_COLOR = "lightgreen";
const HALF_TABLE_LENGTH = 6 * 31; // 6 is # of rows in table/2; 31 is the pixel length of row

// Code syntax
const COMMENT = ";";
const LABEL_INDICATOR = ".";
const LINE2MEM = "line2mem"; // Cookie name mapping text area lines to main memory address.
const MEM2LINE = "mem2line";

/**********************************************************************************************************************/
/*********************************************** MALLEABLE STATE VALUES ***********************************************/
/**********************************************************************************************************************/
// Indicates what base I'm in, gets changed by the select tag
var BASE_VERSION = 10;
// Indicates clock rate
var CLOCK_PERIOD = 0;
var COOKIE_LIFE_SPAN = 100;
var LABELS2LINES = {};

/**********************************************************************************************************************/
/********************************************** ERROR MESSAGES ********************************************************/
/**********************************************************************************************************************/
const ERROR_INCORRECT_ARGS = "ERROR: Based off of the number of commas which are used to delimit arguments, you have" +
    " too many arguments.";
const ERROR_INCORRECT_SPACING = "ERROR: The number of tokens differs from your first instruction and your first" +
    " argument.";
const ERROR_INCORRECT_INS = "ERROR: The instruction does not exist.";
const ERROR_INCORRECT_NUM_ARGS = "ERROR: The number of arguments does not match the instruction.";
const ERROR_INCORRECT_ARG_TYPE = "ERROR: There is something wrong with the argument provided.";
const ERROR_INSUFFICIENT_MEMORY = "ERROR: Memory size is too small for the entered program.";
const ERROR_ADDRESS_OUT_OF_BOUNDS = "ERROR: the address you are trying to input is out of bounds";
const ERROR_STACK_OVERFLOW = "ERROR: The PC is now greater than the SP. Stack overflow has occurred.";

/**********************************************************************************************************************/
/************************************************ Dictionaries ********************************************************/
/**********************************************************************************************************************/
const LIST_REG_NAMES = {"R0": true, "R1": true, "R2": true, "R3": true};
const NUM_REGS = Object.keys(LIST_REG_NAMES).length;

const LEGAL_BASE_10_NUMBERS = {"0": true, "1": true, "2": true, "3": true, "4": true, "5": true, "6": true, "7": true,
    "8": true, "9": true};
const LEGAL_BASE_16_NUMBERS = {"A": true, "B": true, "C": true, "D": true, "E": true, "F": true};
const CHECK_ARGS = {"I": checkI, "R": checkR, "M": checkM, "L": checkL};
const ZCNO_MAPPINGS = {"Z": 0, "C": 1, "N": 2, "O": 3};

/*
 * IRM stands for immediate, register, memory
 * I - delimited by a "$" sign, must be less than 0x10000
 * R - must be: R0, R1, R2, R3
 * M - stands for memory and may be de-referenced with square brackets: "["
 *     M must also be bound as: [0 < M < MAX_ADDRESS]
 * L - stands for labels which are synonymous with M
 */
const INS_DESCRIPTION = {
    "SET": {"nargs": 2, "arg0": "IRM", "arg1": "R", "f": do_set},
    "MOV": {"nargs": 2, "arg0": "IRM", "arg1": "M", "f": do_mov},
    "ADD": {"nargs": 2, "arg0": "R", "arg1": "R", "f": do_add},
    "SUB": {"nargs": 2, "arg0": "R", "arg1": "R", "f": do_sub},
    "MUL": {"nargs": 2, "arg0": "R", "arg1": "R", "f": do_mul},
    "DIV": {"nargs": 2, "arg0": "R", "arg1": "R", "f": do_div},
    "RSH": {"nargs": 1, "arg0": "R", "arg1": "", "f": do_rsh},
    "LSH": {"nargs": 1, "arg0": "R", "arg1": "", "f": do_lsh},
    "AND": {"nargs": 2, "arg0": "R", "arg1": "R", "f": do_and},
    "OR" : {"nargs": 2, "arg0": "R", "arg1": "R", "f": do_or},
    "CMP": {"nargs": 2, "arg0": "IRM", "arg1": "IRM", "f": do_cmp},
    "BRN": {"nargs": 1, "arg0": "ML", "arg1": "", "f": do_brn},
    "BRA": {"nargs": 1, "arg0": "ML", "arg1": "", "f": do_bra},
    "BRZ": {"nargs": 1, "arg0": "ML", "arg1": "", "f": do_brz},
    "BRG": {"nargs": 1, "arg0": "ML", "arg1": "", "f": do_brg},
    "JSR": {"nargs": 1, "arg0": "ML", "arg1": "", "f": do_jsr},
    "RTN": {"nargs": 0, "arg0": "", "arg1": "", "f": do_rtn},
    "POP": {"nargs": 1, "arg0": "R", "arg1": "", "f": do_pop},
    "PSH": {"nargs": 1, "arg0": "R", "arg1": "", "f": do_psh},
    "CCL": {"nargs": 0, "arg0": "", "arg1": "", "f": do_ccl},
    "STP": {"nargs": 0, "arg0": "", "arg1": "", "f": do_stp},
};

/**********************************************************************************************************************/
/**************************************** ASSEMBLY INSTRUCTION FUNCTIONS **********************************************/
/**********************************************************************************************************************/
function do_set(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    setR(arg1[1], arg0_val);
    setPC(getPC() + 3);
}

function do_mov(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    write_memory(arg1, arg0_val);
    setPC(getPC() + 3);
}

function do_add(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    var arg1_val = get_arg_val(arg1);
    var sum = arg0_val + arg1_val;

    if (check_overflow(arg0, arg1, "+", sum)) {
        setCCF("O", 1);
        setCCF("C", 1);
    }
    else {
        setCCF("O", 0);
        setCCF("C", 0);
    }
    if ((sum & BIT_MASK_16) == 0)
        setCCF("Z", 1);
    else
        setCCF("Z", 0);
    if (sum & BIT_MASK_SIGN)
        setCCF("N", 1);
    else
        setCCF("N", 0);
    setR(arg1[1], (sum & BIT_MASK_16));
    setPC(getPC() + 3);
}

function do_sub(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    var arg1_val = get_arg_val(arg1);
    var dif = arg0_val - arg1_val;
    if (check_overflow(arg0, arg1, "-", dif)) {
        setCCF("O", 1);
        setCCF("C", 1);
    }
    else {
        setCCF("O", 0);
        setCCF("C", 0);
    }
    if ((dif & BIT_MASK_16) == 0)
        setCCF("Z", 1);
    else
        setCCF("Z", 0);
    if (dif & BIT_MASK_SIGN)
        setCCF("N", 1);
    else
        setCCF("N", 0);
    setR(arg1[1], (dif & BIT_MASK_16));
    setPC(getPC() + 3);
}

function do_mul(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    var arg1_val = get_arg_val(arg1);
    var prod = arg0_val * arg1_val;
    if ((prod & BIT_MASK_16) == 0)
        setCCF("Z", 1);
    else
        setCCF("Z", 0);
    if ((prod & BIT_MASK_16) & BIT_MASK_SIGN)
        setCCF("N", 1);
    else
        setCCF("N", 0);
    setR(arg1[1], (prod & BIT_MASK_16));
    setPC(getPC() + 3);
}

// Division by zero puts a 0 into arg1
function do_div(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    var arg1_val = get_arg_val(arg1);
    if (arg1_val == 0) {
        setPC(getPC() + 3);
        return;
    }
    var div = Math.floor(arg0_val / arg1_val);
    if ((div & BIT_MASK_16) == 0)
        setCCF("Z", 1);
    else
        setCCF("Z", 0);
    if ((div & BIT_MASK_16) & BIT_MASK_SIGN)
        setCCF("N", 1);
    else
        setCCF("N", 0);
    setR(arg1[1], (div & BIT_MASK_16));
    setPC(getPC() + 3);
}

function do_rsh(arg0) {
    var arg0_val = get_arg_val(arg0);
    var rshed = arg0_val >> 1;
    setR(arg0[1], rshed);
    setCCF("Z", ((rshed & BIT_MASK_SIGN) > 0) & 1);
    setCCF("Z", ((rshed & BIT_MASK_SIGN) > 0) & 1);
    setPC(getPC() + 2);
}

function do_lsh(arg0) {
    var arg0_val = get_arg_val(arg0);
    var lshed = arg0_val << 1;
    setR(arg0[1], lshed);
    setCCF("O", ((lshed & BIT_MASK_SIGN) > 0) & 1);
    setCCF("C", ((lshed & BIT_MASK_SIGN) > 0) & 1);
    setPC(getPC() + 2);
}

function do_and(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    var arg1_val = get_arg_val(arg1);
    var anded = arg0_val & arg1_val;
    setCCF("O", 0);
    setCCF("C", 0);
    if ((anded & BIT_MASK_16) == 0)
        setCCF("Z", 1);
    else
        setCCF("Z", 0);
    if (anded & BIT_MASK_SIGN)
        setCCF("N", 1);
    else
        setCCF("N", 0);
    setR(arg1[1], (anded & BIT_MASK_16));
    setPC(getPC() + 3);
}

function do_or(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    var arg1_val = get_arg_val(arg1);
    var ored = arg0_val | arg1_val;
    setCCF("O", 0);
    setCCF("C", 0);
    if ((ored & BIT_MASK_16) == 0)
        setCCF("Z", 1);
    else
        setCCF("Z", 0);
    if (ored & BIT_MASK_SIGN)
        setCCF("N", 1);
    else
        setCCF("N", 0);
    setR(arg1[1], (ored & BIT_MASK_16));
    setPC(getPC() + 3);
}

function do_cmp(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    var arg1_val = get_arg_val(arg1);
    var dif = arg0_val - arg1_val;
    if (check_overflow(arg0, arg1, "-", dif)) {
        setCCF("O", 1);
        setCCF("C", 1);
    }
    else {
        setCCF("O", 0);
        setCCF("C", 0);
    }
    if ((dif & BIT_MASK_16) == 0)
        setCCF("Z", 1);
    else
        setCCF("Z", 0);
    if (dif & BIT_MASK_SIGN)
        setCCF("N", 1);
    else
        setCCF("N", 0);
    setPC(getPC() + 3);
}

function do_brn(arg0) {
    if (getCCF("N") == 1)
        setPC(arg0);
    else
        setPC(getPC() + 2);
}

function do_bra(arg0) {
    setPC(arg0);
}

function do_brz(arg0) {
    if (getCCF("Z") == 1)
        setPC(arg0);
    else
        setPC(getPC() + 2);
}

function do_brg(arg0) {
    if (!(getCCF("N") == 1))
        setPC(arg0);
    else
        setPC(getPC() + 2);
}

function do_jsr(arg0) {
    var sp = getSP();
    var pc = getPC();
    write_memory(sp, pc + 2);
    setSP(sp - 1);
    setPC(arg0);
}

function do_rtn() {
    var sp = getSP();
    if (sp >= MAX_ADDRESS) {
        write_error_to_console("ERROR: The sp is already at top of stack.");
        return;
    }
    setPC(get_memory(sp + 1));
    setSP(sp + 1);
}

function do_pop(arg0) {
    var sp = getSP();
    if (sp >= MAX_ADDRESS) {
        write_error_to_console("ERROR: The sp is already at top of stack.");
        return;
    }
    setR(arg0[1], get_memory(sp + 1));
    setPC(getPC() + 2);
    setSP(sp + 1);
}

// No need to do stack overflow checks given they are already implemented in the setSP/PC commands.
function do_psh(arg0) {
    var sp = getSP();
    var pc = getPC();
    write_memory(sp, getR(arg0[1]));
    setSP(sp - 1);
    setPC(pc + 2);
}

function do_ccl() {
    setCCF("O", 0);
    setCCF("C", 0);
    setCCF("Z", 0);
    setCCF("N", 0);
    setPC(getPC() + 1);
}

// Stops the program execution.
function do_stp() {
}

/**********************************************************************************************************************/
/********************************************** FORMATTING FOR APPEARANCE *********************************************/
/**********************************************************************************************************************/
/*
 * Takes an address and fills in with 0's if needed.
 * ie. n = 10, returns 0010
 */
function format_addr(n) {
    n &= MAX_ADDRESS;
    var str_n = convert_to_proper_string_base(n);
    if (n < BASE_VERSION) {
        return "00" + str_n.toUpperCase();
    }
    else if (n < BASE_VERSION * BASE_VERSION) {
        return "0" + str_n.toUpperCase();
    }
    return str_n.toUpperCase();
}

/*
 * Same function as above except formats with 4 digits
 */
function format_numbers(n) {
    n &= BIT_MASK_16;
    var str_n = convert_to_proper_string_base(n);
    if (n < BASE_VERSION) {
        return "000" + str_n.toUpperCase();
    }
    else if (n < BASE_VERSION * BASE_VERSION) {
        return "00" + str_n.toUpperCase();
    }
    else if (n < BASE_VERSION * BASE_VERSION * BASE_VERSION) {
        return "0" + str_n.toUpperCase();
    }
    return str_n.toUpperCase();
}

/*
 * This function converts to the new base. The contract is that it only gets invoked when a change of base occurs.
 */
function convert_to_proper_string_base(n) {
    if (BASE_VERSION === 10) {
        return n.toString(DECIMAL_LENGTH);
    }
    else {
        return n.toString(HEX_LENGTH);
    }
}

/**********************************************************************************************************************/
/**************************************** ISA GETTERS AND SETTERS *****************************************************/
/**********************************************************************************************************************/
/*
 * Returns the numeric value of the arg.
 */
function get_arg_val(arg) {
    if (arg[0] == "$") {
        return parseInt(arg.substr(1, arg.length));
    }
    else if (arg[0] == "R") {
        return getR(arg[1]);
    }
    // Value is an address
    else {
        var ref = get_memory(arg);
        return parseInt(ref.substring(1, ref.length));
    }
}

/*
 * Performs a write to the address with the given value.
 */
function write_memory(address, value) {
    // error checking
    if (address > MAX_ADDRESS || address < 0) {
        write_error_to_console(ERROR_ADDRESS_OUT_OF_BOUNDS);
        return;
    }
    var element = document.getElementById("addr" + address);
    element.innerHTML = value;
}

/*
 * Gets the value stored at the address in memory.
 */
function get_memory(address) {
    // error checking
    if (address > MAX_ADDRESS || address < 0) {
        console.error(ERROR_ADDRESS_OUT_OF_BOUNDS);
        return -1;
    }
    var element = document.getElementById("addr" + address);
    return element.innerHTML;
}

/*
 * Gets the register content in integer format. rNum is bound to [0:3]
 */
function getR(rNum) {
    return parseInt(document.getElementById("R" + rNum + "content").innerHTML);
}

function setR(rNum, rIn) {
    var element = document.getElementById("R" + rNum + "content");
    element.innerHTML = ((BASE_VERSION == HEX_LENGTH) ? "0x" : "") + format_numbers(rIn);
}

function getPC() {
    return parseInt(document.getElementById("PCcontent").innerHTML);
}

function setPC(rIn) {
    uncolor_pc();
    if (rIn > MAX_ADDRESS || rIn < 0) {
        write_error_to_console(ERROR_ADDRESS_OUT_OF_BOUNDS);
        return;
    }
    if (getPC() > getSP()) {
        write_error_to_console(ERROR_STACK_OVERFLOW);
        return;
    }
    var element = document.getElementById("PCcontent");
    element.innerHTML = ((BASE_VERSION == HEX_LENGTH) ? "0x" : "") + format_numbers(rIn);
    color_pc();
    jump2pc_in_mm();
}

function getSP() {
    return parseInt(document.getElementById("SPcontent").innerHTML);
}

function setSP(rIn) {
    uncolor_sp();
    if (rIn > MAX_ADDRESS || rIn < 0) {
        write_error_to_console(ERROR_ADDRESS_OUT_OF_BOUNDS);
        return;
    }
    if (getPC() > getSP()) {
        write_error_to_console(ERROR_STACK_OVERFLOW);
        return;
    }
    var element = document.getElementById("SPcontent");
    element.innerHTML = ((BASE_VERSION == HEX_LENGTH) ? "0x" : "") + format_numbers(rIn);
    color_sp();
}

function getCCF(flag) {
    return document.getElementById("CCcontent").innerHTML[ZCNO_MAPPINGS[flag]];
}

/*
 * flag - ["Z" - "O"]
 */
function setCCF(flag, set_to) {
    var element = document.getElementById("CCcontent");
    var status = element.innerHTML;
    status = status.substring(0, ZCNO_MAPPINGS[flag]) + set_to + status.substring(ZCNO_MAPPINGS[flag] + 1, HEX_LENGTH);
    element.innerHTML = status;
}

/**********************************************************************************************************************/
/*********************************************** ISA CHECKS ***********************************************************/
/**********************************************************************************************************************/
// All the checks return a state dictionary that indicate whether the check passed (true) and the parsed argument to put
// in MM. The key "state" indicates the check status and "arg" indicates the returned argument.

/*
 * Checks overflow. Rules for overflow: 2 positive values give a negative or 2 negatives give a positive.
 */
function check_overflow(arg0, arg1, operation, result) {
    var arg0p = arg0 & BIT_MASK_SIGN;
    var arg1p = arg1 & BIT_MASK_SIGN;
    var result_p = result & BIT_MASK_SIGN;
    if (operation == "+")
        return (arg0p == arg1p) && (result_p != arg0p);
    if (operation == "-") {
        // Overflow can only occur with different signed arguments
        if (arg0p != arg1p) {
            if (arg0p && !arg1p && !result_p)
                return true;
            if (!arg0p && arg1p && result_p)
                return true;
        }
    }
    return false;
}

/*
 * Checks that all register names are valid.
 */
function checkR(reg) {
    var state = {"state": false, "arg": 0};
    state["state"] = reg.toUpperCase() in LIST_REG_NAMES;
    if (state["state"]) {
        state["arg"] = reg.toUpperCase();
    }
    return state;
}

/*
 * Checks that the immediate value is correct. This includes in bounds and contains all the proper numeric characters.
 */
function checkI(imm) {
    var state = {"state": false, "arg": 0};
    if (imm.length < 2)
        return state;
    else {
        if (imm[0] != "$")
            return state;
        var i;
        // Immediate value may be hex
        if (imm.length > 3) {
            // Value is hex
            var immParsed;
            if (imm.substring(1, 3) == "0x") {
                // Check all digits are valid hex
                for (i = 3; i < imm.length; i++) {
                    if (!(imm[i] in LEGAL_BASE_10_NUMBERS || imm[i].toUpperCase() in LEGAL_BASE_16_NUMBERS)) {
                        return state;
                    }
                }
                // Check size constraints
                immParsed = parseInt(imm.substring(1, imm.length));
                if (immParsed > BIT_MASK_16) {
                    return state;
                }
                state["arg"] = immParsed;
            }
            // Value is decimal
            else {
                for (i = 1; i < imm.length; i++) {
                    if (!(imm[i] in LEGAL_BASE_10_NUMBERS)) {
                        return false;
                    }
                }
                immParsed = parseInt(imm.substring(1, imm.length));
                if (immParsed > BIT_MASK_16 || immParsed < 0) {
                    return state;
                }
                state["arg"] = immParsed;
            }
        }
        // Number is length 2 or 3
        else {
            for (i = 1; i < imm.length; i++) {
                if (!(imm[i] in LEGAL_BASE_10_NUMBERS)) {
                    return state;
                }
            }
            state["arg"] = imm.substring(1, 3);
        }
        state["state"] = true;
        return state;
    }
}

/*
 * Checks that the memory address is valid.
 */
function checkM(mem) {
    var state = {"state": false, "arg": 0};
    if (mem.length < 1)
        return state;
    else {
        var i;
        // Immediate value may be hex
        if (mem.length > 2) {
            // Value is hex
            if (mem.substring(0, 2) == "0x") {
                for (i = 2; i < mem.length; i++) {
                    if (!(mem[i] in LEGAL_BASE_10_NUMBERS || mem[i].toUpperCase() in LEGAL_BASE_16_NUMBERS)) {
                        return state;
                    }
                }
                if (mem > MAX_ADDRESS || mem < 0) {
                    return state;
                }
                state["arg"] = mem;
            }
            // Value is decimal
            else {
                for (i = 0; i < mem.length; i++) {
                    if (!(mem[i] in LEGAL_BASE_10_NUMBERS)) {
                        return state;
                    }
                }
                if (mem > 0x1FF || mem < 0) {
                    return state;
                }
                state["arg"] = mem;
            }
        }
        // Number is length 1 or 2
        else {
            for (i = 0; i < mem.length; i++) {
                if (!(mem[i] in LEGAL_BASE_10_NUMBERS)) {
                    return state;
                }
            }
            state["arg"] = mem;
        }
        state["state"] = true;
        return state;
    }
}

function checkL(label) {
    if (label in LABELS2LINES) {
        return {"state": true, "arg": label};
    }
    else {
        return {"state": false, "arg": 0};
    }
}

/*
 * Checks that a single argument matches the required type of argument. arg_allowable refers to the allowed arguments
 * and comes in a string form of either: I, R, or M. The moment a match for an argument type in arg_allowable has been
 * found it means that the argument is of that type.
 */
function check_individual_args(arg_allowable, arg, state) {
    for (var i = 0; i < arg_allowable.length; i++) {
        if (CHECK_ARGS[arg_allowable[i]](arg)["state"]) {
            return state;
        }
    }
    return {"state": false, "error": ERROR_INCORRECT_ARG_TYPE};
}

/*
 * Could be either:
 * - R0-R3
 * - 0 <= value <= BIT_MASK_16
 * - Dereference values and check that the dereferenced values are valid.
 */
function check_instruction(ins, arg0, arg1, n_args) {
    var state = {"state": true, "error": ""};
    // Instruction is not recognized
    if (!(ins in INS_DESCRIPTION)) {
        state["state"] = false;
        state["error"] = ERROR_INCORRECT_INS;
        return state;
    }
    // The number of arguments is incorrect
    if (INS_DESCRIPTION[ins]["nargs"] != n_args) {
        state["state"] = false;
        state["error"] = ERROR_INCORRECT_NUM_ARGS;
        return state;
    }
    var arg0allowable;
    // Check the argument state
    if (n_args == 2) {
        arg0allowable = INS_DESCRIPTION[ins]["arg0"];
        var arg1allowable = INS_DESCRIPTION[ins]["arg1"];
        state = check_individual_args(arg0allowable, arg0, state);
        if (!state["state"])
            return state;
        state = check_individual_args(arg1allowable, arg1, state);
        if (!state["state"])
            return state;
    }
    else if (n_args == 1) {
        arg0allowable = INS_DESCRIPTION[ins]["arg0"];
        state = check_individual_args(arg0allowable, arg0, state);
        if (!state["state"])
            return state;
    }
    return state;
}

/**********************************************************************************************************************/
/**************************************** ASSEMBLE, INIT, AND RUN *****************************************************/
/**********************************************************************************************************************/
/*
 * Initializes main memory with all zeros.
 */
function init_mm() {
    var main_memory = document.getElementById("main_memory");
    for (var i = 0; i < MEM_SIZE; i++) {
        var table_row = document.createElement("tr");
        var addr_col = document.createElement("td");
        var value_col = document.createElement("td");
        var label_col = document.createElement("td");
        addr_col.setAttribute("id", "address" + i);
        value_col.setAttribute("id", "addr" + i);
        label_col.setAttribute("id", "label" + i);
        addr_col.innerHTML = ((BASE_VERSION == HEX_LENGTH) ? "0x" : "") + format_addr(i);
        value_col.innerHTML = format_numbers(0);
        $(table_row).append(addr_col);
        $(table_row).append(value_col);
        $(table_row).append(label_col);
        $(main_memory).append(table_row);
    }
}

function strip_label(code_line) {
    if (code_line[0] == LABEL_INDICATOR) {
        var label_arg_split = code_line.split(/\s+/g);

        // There is some code or something after the label
        if (label_arg_split.length > 1) {
            var arg_no_comment_no_label = label_arg_split[1];
            for (var j = 2; j < label_arg_split.length; j++) {
                arg_no_comment_no_label += (" " + label_arg_split[j]);
            }
            return arg_no_comment_no_label;
        }
        // There is just the label in this line
        else {
            return ""
        }
    }
    return code_line
}

function strip_whitespace_and_comment(code_line) {
    // Checks if line is blank or whitespace
    if (code_line == "" || /^\s+$/.test(code_line)) {
        return "";
    }

    // Remove starting and ending whitespace and keep only first part of line of comment
    var arg_no_comment = code_line.split(COMMENT)[0].trim();

    // Remove if line is a whitespace
    if (arg_no_comment == "" || /^\s+$/.test(arg_no_comment)) {
        return "";
    }
    return arg_no_comment
}

// Gets the assigned labels throughout the text editor.
function get_labels(lines) {
    var line_number = 1;
    for (var i = 0; i < lines.length; i++) {
        // Remove starting and ending whitespace
        var arg_no_comment = strip_whitespace_and_comment(lines[i]);
        // Remove if superfluous line
        if (arg_no_comment == "") {
            line_number++;
            continue;
        }

        // Check if there is a label and filter it out.
        if (arg_no_comment[0] == LABEL_INDICATOR) {
            var split_label_line = arg_no_comment.split(/\s+/g);
            var label = split_label_line[0];
            if (split_label_line.length > 1) {
                LABELS2LINES[label] = line_number;
            }
            // Find the next line that's neither whitespace nor comment.
            else {
                var seeker = i + 1;
                for (; seeker < lines.length; seeker++) {
                    // Checks if line is blank or whitespace
                    if (lines[seeker] == "" || /^\s+$/.test(lines[seeker])) {
                        continue;
                    }

                    // Remove starting and ending whitespace
                    var line_no_comment = $.trim(lines[seeker].split(COMMENT)[0]);

                    // Remove if line is a whitespace
                    if (line_no_comment == "" || /^\s+$/.test(line_no_comment)) {
                        continue;
                    }

                    if (line_no_comment[0] == LABEL_INDICATOR) {
                        continue;
                    }

                    LABELS2LINES[label] = seeker + 1;
                    break;
                }
            }
        }
        line_number++;
    }
}

/*
 * The assembler will take the program text and either:
 * 1) print out the errors which are supposed to be directed to the console or
 * 2) assemble successfully and load the program into memory
 * This function is so long because it performs a lot of checks that verify if the instructions are valid.
 */
function assemble() {
    clear_console();
    clear_memory_image();
    write_to_console("Your program is being assembled...");

    // Gets the contents of the text box and stores the lines in a list
    var lines = editor.getValue().split("\n");
    // This holds the error messages that will be output to the console
    var errors = [];
    // This list holds what should be input to main memory
    var args = [];
    // This dict maps the instructions to their respective line numbers, this will be used for breakpoints
    // to map line numbers to their respective locations in main memory.
    var line2args = {};

    LABELS2LINES = {};
    get_labels(lines);

    // Line number refers to the line number in the editor
    var line_number = 1;
    for (i = 0; i < lines.length; i++) {
        // Remove comment and appended whitespaces.
        var arg_no_comment_no_label = strip_label(strip_whitespace_and_comment(lines[i]));
        // Jump if superfluous line.
        if (arg_no_comment_no_label == "") {
            line_number++;
            continue;
        }

        var split_args = arg_no_comment_no_label.split(",");
        var ins = "";
        var state;
        // There are 2 arguments
        if (split_args.length == 2) {
            // split by whitespace to get instruction and arg0
            var ins_arg0 = split_args[0].split(/\s+/g);
            var arg0 = "";
            var arg1 = split_args[1].trim();
            // 2 arguments
            if (ins_arg0.length == 2) {
                ins = ins_arg0[0];
                arg0 = ins_arg0[1];
                state = check_instruction(ins, arg0, arg1, 2);
                if (state["state"]) {
                    line2args[line_number] = args.length;
                    args.push(ins);
                    args.push(arg0);
                    args.push(arg1);
                }
                else {
                    errors.push("Line " + line_number + " " + state["error"]);
                    args = [];
                }
            }
            // The spacing here indicates there's some unnecessary icons here
            else {
                errors.push("Line " + line_number + " " + ERROR_INCORRECT_SPACING);
                args = [];
            }
        }
        // There are either 1 or no arguments
        else if (split_args.length == 1) {
            var ins_maybe_arg = split_args[0].split(/\s+/g);
            // No arguments
            if (ins_maybe_arg.length == 1) {
                ins = ins_maybe_arg[0];
                state = check_instruction(ins, "", "", 0);
                if (state["state"]) {
                    line2args[line_number] = args.length;
                    args.push(ins);
                }
                else {
                    errors.push(line_number + " " + state["error"]);
                    args = [];
                }
            }
            // 1 argument
            else if (ins_maybe_arg.length == 2) {
                ins = ins_maybe_arg[0];
                arg0 = ins_maybe_arg[1];
                state = check_instruction(ins, arg0, "", 1);
                if (state["state"]) {
                    line2args[line_number] = args.length;
                    args.push(ins);
                    args.push(arg0);
                }
                else {
                    errors.push("Line " + line_number + " " + state["error"]);
                    args = [];
                }
            }
            else {
                errors.push("Line " + line_number + " " + ERROR_INCORRECT_SPACING);
                args = [];
            }
        }
        else {
            // There is some error here as there cannot be more than 2 arguments per line
            errors.push("Line " + line_number + " " + ERROR_INCORRECT_ARGS);
            args = [];
        }
        line_number++;
    }

    if (args.length > MEM_SIZE) {
        args = [];
        errors.push(ERROR_INSUFFICIENT_MEMORY);
    }

    if (errors.length) {
        write_to_console("Assembled unsuccessfully. Errors:");
        for (var i = 0; i < errors.length; i++) {
            write_error_to_console(errors[i]);
        }
    }
    // Assembled successfully
    else {
        // Write the program to main memory
        for (i = 0; i < args.length; i++) {
            var arg = args[i];
            if (arg[0] === ".") {
                arg = line2args[LABELS2LINES[arg]];
            }
            write_memory(i, arg);
        }

        createCookieObject(LINE2MEM, line2args, COOKIE_LIFE_SPAN);
        createCookieObject(MEM2LINE, _.invert(line2args), COOKIE_LIFE_SPAN);

        var line2mem = readCookieObject(LINE2MEM);
        // Write labels to main memory table
        for (var label in LABELS2LINES) {
            write_label2mm(label, line2mem);
        }

        write_to_console("Assembled successfully. Data now stored in main memory.");
    }
}

/*
 * The run function is basically the processor and will do the actual running of the program that is stored in main
 * memory. The contract we have at this point is that the values in main memory are valid hence we do not need to
 * perform any checks.
 *
 * If there is an error, we need to check the checks section.
 */
function run() {
    // assemble();
    clear_console();
    write_to_console("Program started running...");

    var pc = getPC();
    // Checks that first instruction makes sense
    if (!(get_memory(pc) in INS_DESCRIPTION)) {
        write_to_console("Finished running program.");
        return;
    }
    execute_program();
}

/**
 * Performs a single assembly instruction step.
 */
function step() {
    var pc = getPC();
    // Checks that first instruction makes sense
    if (!(get_memory(pc) in INS_DESCRIPTION)) {
        write_to_console("Stepped to end of program.");
        return;
    }
    var work_ins = get_memory(pc);
    if (work_ins === "STP") {
        write_to_console("Stepped to end of program.");
        return;
    }
    var nargs = INS_DESCRIPTION[work_ins]["nargs"];
    var arg0;
    // No args
    if (nargs == 0) {
        INS_DESCRIPTION[work_ins]["f"]();
    }
    // 1 arg
    else if (nargs == 1) {
        arg0 = get_memory(pc + 1);
        INS_DESCRIPTION[work_ins]["f"](arg0);
    }
    // 2 args
    else if (nargs == 2) {
        arg0 = get_memory(pc + 1);
        var arg1 = get_memory(pc + 2);
        INS_DESCRIPTION[work_ins]["f"](arg0, arg1);
    }
    else {
        console.error("ERROR: I have no idea how it got here. Basically the INS_DESCRIPTION dict got corrupted");
        return;
    }
    pc = getPC();
    write_to_console("End step at address " + pc);
}

/*
 * The objective of this program is to be a generic function that executes an assembly program from PC to an
 * end point. Endpoint is a location in main memory.
 *
 * This program either executes to end, program completion or to breakpoint
 */
function execute_program() {
    // TODO May need to add some change that updates the CLOCK_PERIOD
    var run_program_interval = setInterval(function() {
        var pc = getPC();
        var mem2line = readCookieObject(MEM2LINE);
        var work_ins = get_memory(pc);

        // While a pc is pointing at an instruction to be executed this means that there is a program to be executed.
        if (!(work_ins in INS_DESCRIPTION) || (work_ins === "STP")) {
            clearInterval(run_program_interval);
            write_to_console("Finished running program.");
        }

        var n_args = INS_DESCRIPTION[work_ins]["n_args"];
        var arg0;
        // No args
        if (n_args == 0) {
            INS_DESCRIPTION[work_ins]["f"]();
        }
        // 1 arg
        else if (n_args == 1) {
            arg0 = get_memory(pc + 1);
            INS_DESCRIPTION[work_ins]["f"](arg0);
        }
        // 2 args
        else if (n_args == 2) {
            arg0 = get_memory(pc + 1);
            var arg1 = get_memory(pc + 2);
            INS_DESCRIPTION[work_ins]["f"](arg0, arg1);
        }
        pc = getPC();
        if (pcAtBP(mem2line, pc)) {
            clearInterval(run_program_interval);
            write_to_console("Breakpoint hit, main memory address: " + pc.toString());
        }
    }, CLOCK_PERIOD);
}

function clear_memory_image() {
    var i;
    for (i = 0; i < MEM_SIZE; i++) {
        write_memory(i, "0000");
        document.getElementById("label" + i).innerHTML = "";
    }

    // Has the same effect as ccl() except no manipulation to PC.
    setCCF("O", 0);
    setCCF("C", 0);
    setCCF("Z", 0);
    setCCF("N", 0);

    for (i = 0; i < NUM_REGS; i++) {
        setR(i, 0);
    }
    setPC(0);
    setSP(MAX_ADDRESS);
}

/**********************************************************************************************************************/
/**************************************** JAVASCRIPT HTML INTERACTION *************************************************/
/**********************************************************************************************************************/
function write_label2mm(label, line2mem) {
    var address = line2mem[LABELS2LINES[label]];
    // error checking
    if (address > MAX_ADDRESS || address < 0) {
        write_error_to_console(ERROR_ADDRESS_OUT_OF_BOUNDS);
        return;
    }
    document.getElementById("label" + address).innerHTML = label.slice(1);
}

function write_to_console(string) {
    var console_out = document.getElementById("console");
    var running = document.createElement("p");
    running.innerHTML = string;
    console_out.appendChild(running);
    console_out.scrollTop = console_out.scrollHeight;
}

function write_error_to_console(string) {
    var console_out = document.getElementById("console");
    var running = document.createElement("p");
    running.innerHTML = string;
    running.style.color = "red";
    console_out.appendChild(running);
    console_out.scrollTop = console_out.scrollHeight;
}

// Scrolls to the PC in the main memory table. Always scrolls to the midpoint.
function jump2pc_in_mm() {
    var row_pos = $('#address' + getPC()).parent().position();
    $('#div_main_memory').scrollTop(Math.max(0, row_pos.top - HALF_TABLE_LENGTH));
}

function scrollIntoView(element, container) {
    var containerTop = $(container).scrollTop();
    var containerBottom = containerTop + $(container).height();
    var elemTop = element.offsetTop;
    var elemBottom = elemTop + $(element).height();
    if (elemTop < containerTop) {
        $(container).scrollTop(elemTop);
    } else if (elemBottom > containerBottom) {
        $(container).scrollTop(elemBottom - $(container).height());
    }
}

function change_clock_rate() {
    var hz = document.getElementById("program_speed").value;
    switch (hz) {
        case "no_Hz":
            CLOCK_PERIOD = 0;
            break;
        case "1_Hz":
            CLOCK_PERIOD = 1000;
            break;
        case "2_Hz":
            CLOCK_PERIOD = 500;
            break;
        case "4_Hz":
            CLOCK_PERIOD = 250;
            break;
        case "8_Hz":
            CLOCK_PERIOD = 125;
            break;
        default:
            CLOCK_PERIOD = 0;
            break;
    }
}

// Changed the base displayed for main memory and registers
function change_base() {
    if (document.getElementById("base_value").value == "decimal_input") {
        BASE_VERSION = DECIMAL_LENGTH;
    }
    else {
        BASE_VERSION = HEX_LENGTH;
    }
    var i;
    // Rewrite main memory
    for (i = 0; i < MEM_SIZE; i++) {
        $("#address" + i).html(((BASE_VERSION == HEX_LENGTH) ? "0x" : "") + format_addr(i));
    }

    // Rewrite registers
    for (i = 0; i < NUM_REGS; i++) {
        setR(i, getR(i));
    }

    // Rewrite PC and SP
    setPC(getPC());
    setSP(getSP());
}

function save_file() {
    var program_text = editor.getValue();
    var blob = new Blob([program_text], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "assembly_program.asm");
}

function load_file() {
    var fileInput = document.getElementById('load_button');

    fileInput.addEventListener('change', function (e) {
        var file = fileInput.files[0];
        var reader = new FileReader();

        reader.onload = function (e) {
            editor.setValue(reader.result);
        };

        reader.readAsText(file);
    });
}

// Colors pc in main memory
function color_pc() {
    $("#addr" + getPC()).parent().css({"backgroundColor": PC_TRACKING_COLOR});
}

// Uncolors pc in main memory
function uncolor_pc() {
    // Its important to remove the attr otherwise the hover stops working.
    $("#addr" + getPC()).parent().removeAttr("style");
}

// Colors pc in main memory
function color_sp() {
    $("#addr" + getSP()).parent().css({"backgroundColor": SP_TRACKING_COLOR});
}

// Uncolors pc in main memory
function uncolor_sp() {
    // Its important to remove the attr otherwise the hover stops working.
    $("#addr" + getSP()).parent().removeAttr("style");
}


function remove_line2mem_mem2line() {
    eraseCookie(LINE2MEM);
    eraseCookie(MEM2LINE);
}

// Functions to call on page load
function init() {
    init_mm();
    remove_line2mem_mem2line();
    color_pc();
    color_sp();
}

function clear_console() {
    var console_out = document.getElementById("console");
    while (console_out.firstChild) {
        console_out.removeChild(console_out.firstChild);
    }
}

$("#init_memory_button").keyup(function (event) {
    if (event.keyCode == 13) {
        clear_memory_image();
    }
});

$("#assemble_button").keyup(function (event) {
    if (event.keyCode == 13) {
        assemble();
    }
});

$("#run_button").keyup(function (event) {
    if (event.keyCode == 13) {
        run();
    }
});

$("#save_button").keyup(function (event) {
    if (event.keyCode == 13) {
        save_file();
    }
});

$("#load_button").keyup(function (event) {
    if (event.keyCode == 13) {
        load_file();
    }
});

$("#clear_console_button").keyup(function (event) {
    if (event.keyCode == 13) {
        clear_console();
    }
});

$("#step_button").keyup(function (event) {
    if (event.keyCode == 13) {
        step();
    }
});

$('td[rowspan]').addClass('hasRowSpan');

document.getElementById("init_memory_button").addEventListener("click", clear_memory_image);
document.getElementById("assemble_button").addEventListener("click", assemble);
document.getElementById("run_button").addEventListener("click", run);
document.getElementById("save_button").addEventListener("click", save_file);
document.getElementById("load_button").addEventListener("click", load_file);
document.getElementById("clear_console_button").addEventListener("click", clear_console);
document.getElementById("step_button").addEventListener("click", step);