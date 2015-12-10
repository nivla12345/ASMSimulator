/**
 * Created by Alvin on 11/13/2014.
 */
/**********************************************************************************************************************/
/********************************************** CONSTANT VALUES *******************************************************/
/**********************************************************************************************************************/
const MAX_ADDRESS = 511;
const BIT_MASK_16 = 0xFFFF;
const BIT_MASK_SIGN = 0x8000;
const HEX_LENGTH = 16;

// Colors
const MAIN_MEMORY_BACKGROUND_COLOR = "rgba(0, 0, 0, 0)";
const BREAKPOINT_COLOR = "red";
const PC_TRACKING_COLOR = "red";

// Code syntax
const COMMENT = ";";

/**********************************************************************************************************************/
/********************************************** ERROR MESSAGES ********************************************************/
/**********************************************************************************************************************/
const ERROR_INCORRECT_ARGS = "ERROR: Based off of the number of commas which are used to delimit arguments, you have" +
    " too many arguments.";
const ERROR_INCORRECT_SPACING = "ERROR: The number of tokens differs from your first instruction and your first" +
    " argument.";
const ERROR_INCORRECT_INS = "ERROR: The instruction does not exist.";
const ERROR_INCORRECT_NUM_ARGS = "ERROR: The number of arguments does not match the instruction.";
const ERROR_INCORRECT_ARG_TYPE = "ERROR: The argument type provided is incorrect.";
const ERROR_INSUFFICIENT_MEMORY = "ERROR: Memory size is too small for the entered program. Upgrade to premium for " +
    "more memory.";
const ERROR_ADDRESS_OUT_OF_BOUNDS = "ERROR: the address you are trying to input is out of bounds";
const ERROR_STACK_OVERFLOW = "ERROR: The PC is now greater than the SP. Stack overflow has occurred.";

/**********************************************************************************************************************/
/************************************************ Dictionaries ********************************************************/
/**********************************************************************************************************************/
const LIST_REG_NAMES = {"R0": true, "R1": true, "R2": true, "R3": true};
const LEGAL_BASE_10_NUMBERS = {"0": true, "1": true, "2": true, "3": true, "4": true, "5": true, "6": true, "7": true,
    "8": true, "9": true};
const LEGAL_BASE_16_NUMBERS = {"A": true, "B": true, "C": true, "D": true, "E": true, "F": true};
const CHECK_ARGS = {"I": checkI, "R": checkR, "M": checkM};
const ZCNO_MAPPINGS = {"Z": 0, "C": 1, "N": 2, "O": 3};

/*
 * IRM stands for immediate, register, memory
 * I - delimited by a "$" sign, must be less than 0x10000
 * R - must be: R0, R1, R2, R3
 * M - stands for memory and may be dereferenced with square brackets: "["
 *     M must also be bound as: [0 < M < MAX_ADDRESS]
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
    "OR": {"nargs": 2, "arg0": "R", "arg1": "R", "f": do_or},
    "CMP": {"nargs": 2, "arg0": "IRM", "arg1": "IRM", "f": do_cmp},
    "BRN": {"nargs": 1, "arg0": "M", "arg1": "", "f": do_brn},
    "BRA": {"nargs": 1, "arg0": "M", "arg1": "", "f": do_bra},
    "BRZ": {"nargs": 1, "arg0": "M", "arg1": "", "f": do_brz},
    "BRG": {"nargs": 1, "arg0": "M", "arg1": "", "f": do_brg},
    "JSR": {"nargs": 1, "arg0": "M", "arg1": "", "f": do_jsr},
    "RTN": {"nargs": 0, "arg0": "", "arg1": "", "f": do_rtn},
    "POP": {"nargs": 1, "arg0": "R", "arg1": "", "f": do_pop},
    "PSH": {"nargs": 1, "arg0": "R", "arg1": "", "f": do_psh},
    "CCL": {"nargs": 0, "arg0": "", "arg1": "", "f": do_ccl}
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

// TODO Complete when line labeling has taken place.
// TODO Allow arguments to be passed.
function do_jsr(arg0) {
    setPC(getPC() + 2);
    console.log("JSR instruction called.");
}

function do_rtn() {
    setPC(getPC() + 1);
    console.log("RTN instruction called.");
}

function do_pop(arg0) {
    var sp = getSP();
    if (sp >= 511) {
        console.log("ERROR: The sp is already at top of stack.");
        return;
    }
    setR(arg0[1], get_memory(sp + 1));
    setPC(getPC() + 2);
    setSP(sp + 1);
}

function do_psh(arg0) {
    var sp = getSP();
    var pc = getPC();
    if (sp <= pc) {
        console.log("ERROR: Stack overflow is about to occur as sp is about to enter SP region.");
        return;
    }
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

/**********************************************************************************************************************/
/********************************************** FORMATTING FOR APPEARANCE *********************************************/
/**********************************************************************************************************************/
/*
 * Takes an address and fills in with 0's if needed.
 * ie. n = 10, returns 0010
 */
function format_addr(n) {
    n = n & 0x1FF;
    if (n < 10) {
        return "00" + n;
    }
    else if (n < 100) {
        return "0" + n;
    }
    return n;
}

/*
 * Same function as above except formats with 4 digits
 */
function format_numbers(n) {
    n = n & BIT_MASK_16;
    if (n < 10) {
        return "000" + n;
    }
    else if (n < 100) {
        return "00" + n;
    }
    else if (n < 1000) {
        return "0" + n;
    }
    return n;
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
        return ref.substring(1, ref.length);
    }
}

/*
 * Performs a write to the address with the given value.
 */
function write_memory(address, value) {
    // error checking
    if (address > MAX_ADDRESS || address < 0) {
        console.log(ERROR_ADDRESS_OUT_OF_BOUNDS);
        return;
    }
    var element = document.getElementById("addr" + address);
    var new_element = document.createElement("span");
    new_element.setAttribute("id", "addr" + address);
    new_element.innerHTML = "0d0" + format_addr(address) + "   " + value;
    element.parentNode.replaceChild(new_element, element);
}

/*
 * Gets the value stored at the address in memory.
 */
function get_memory(address) {
    // error checking
    if (address > MAX_ADDRESS || address < 0) {
        console.error(ERROR_ADDRESS_OUT_OF_BOUNDS);
        return 0xBEAFBEAF;
    }

    var element = document.getElementById("addr" + address);
    return element.innerHTML.split(/\s+/g)[1];
}

/*
 * Gets the register content in integer format. rNum is bound to [0:3]
 */
function getR(rNum) {
    return parseInt(document.getElementById("R" + rNum + "content").innerHTML);
}

function setR(rNum, rIn) {
    var element = document.getElementById("R" + rNum + "content");
    var new_element = document.createElement("span");
    new_element.setAttribute("id", "R" + rNum + "content");
    new_element.innerHTML = format_numbers(rIn);
    element.parentNode.replaceChild(new_element, element);
}

function getPC() {
    return parseInt(document.getElementById("PCcontent").innerHTML);
}

function setPC(rIn) {
    if (rIn > MAX_ADDRESS || rIn < 0) {
        console.log(ERROR_ADDRESS_OUT_OF_BOUNDS);
        return;
    }
    if (getPC() > getSP()) {
        console.log(ERROR_STACK_OVERFLOW);
        return;
    }
    var element = document.getElementById("PCcontent");
    var new_element = document.createElement("span");
    new_element.setAttribute("id", "PCcontent");
    new_element.innerHTML = format_numbers(rIn);
    element.parentNode.replaceChild(new_element, element);
}

function getSP() {
    return parseInt(document.getElementById("SPcontent").innerHTML);
}

function setSP(rIn) {
    if (rIn > MAX_ADDRESS || rIn < 0) {
        console.log(ERROR_ADDRESS_OUT_OF_BOUNDS);
        return;
    }
    if (getPC() > getSP()) {
        console.log(ERROR_STACK_OVERFLOW);
        return;
    }
    var element = document.getElementById("SPcontent");
    var new_element = document.createElement("span");
    new_element.setAttribute("id", "SPcontent");
    new_element.innerHTML = format_numbers(rIn);
    element.parentNode.replaceChild(new_element, element);
}

function getCCF(flag) {
    return document.getElementById("CCcontent").innerHTML[ZCNO_MAPPINGS[flag]];
}

/*
 * flag - ["Z" - "O"]
 */
function setCCF(flag, set_to) {
    var element = document.getElementById("CCcontent");
    var new_element = document.createElement("span");
    new_element.setAttribute("id", "CCcontent");
    var status = element.innerHTML;
    status = status.substring(0, ZCNO_MAPPINGS[flag]) + set_to + status.substring(ZCNO_MAPPINGS[flag] + 1, HEX_LENGTH);
    new_element.innerHTML = status;
    element.parentNode.replaceChild(new_element, element);
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
 * TODO Enable this ISA to allow users to input negative numbers.
 */
function checkI(imm) {
    var state = {"state": false, "arg": 0};
    if (imm.length < 2)
        return state;
    else {
        if (imm[0] != "$")
            return state;
        // Immediate value may be hex
        if (imm.length > 3) {
            // Value is hex
            if (imm.substring(1, 3) == "0x") {
                // Check all digits are valid hex
                for (var i = 3; i < imm.length; i++) {
                    if (!(imm[i] in LEGAL_BASE_10_NUMBERS || imm[i].toUpperCase() in LEGAL_BASE_16_NUMBERS)) {
                        return state;
                    }
                }
                // Check size constraints
                var immParsed = parseInt(imm.substring(1, imm.length));
                if (immParsed > BIT_MASK_16) {
                    return state;
                }
                state["arg"] = immParsed;
            }
            // Value is decimal
            else {
                for (var i = 1; i < imm.length; i++) {
                    if (!(imm[i] in LEGAL_BASE_10_NUMBERS)) {
                        return false;
                    }
                }
                var immParsed = parseInt(imm.substring(1, imm.length));
                if (immParsed > BIT_MASK_16 || immParsed < 0) {
                    return state;
                }
                state["arg"] = immParsed;
            }
        }
        // Number is length 2 or 3
        else {
            for (var i = 1; i < imm.length; i++) {
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
        // Immediate value may be hex
        if (mem.length > 2) {
            // Value is hex
            if (mem.substring(0, 2) == "0x") {
                for (var i = 2; i < mem.length; i++) {
                    if (!(mem[i] in LEGAL_BASE_10_NUMBERS || mem[i].toUpperCase() in LEGAL_BASE_16_NUMBERS)) {
                        return state;
                    }
                }
                if (mem > 0x1FF || mem < 0) {
                    return state;
                }
                state["arg"] = mem;
            }
            // Value is decimal
            else {
                for (var i = 0; i < mem.length; i++) {
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
            for (var i = 0; i < mem.length; i++) {
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
 * TODO Include a way to dereference memory upon square brackets
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
    // Check the argument state
    if (n_args == 2) {
        var arg0allowable = INS_DESCRIPTION[ins]["arg0"];
        var arg1allowable = INS_DESCRIPTION[ins]["arg1"];
        state = check_individual_args(arg0allowable, arg0, state);
        if (!state["state"])
            return state;
        state = check_individual_args(arg1allowable, arg1, state);
        if (!state["state"])
            return state;
    }
    else if (n_args == 1) {
        var arg0allowable = INS_DESCRIPTION[ins]["arg0"];
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
    for (var i = 0; i < 512; i++) {
        var text = document.createElement("span");
        text.setAttribute("id", "addr" + i);
        text.innerHTML = "0d0" + format_addr(i) + "    " + format_numbers(0);
        var brk = document.createElement("br");
        main_memory.appendChild(text);
        main_memory.appendChild(brk);
    }
}

/*
 * The assembler will take the program text and either:
 * 1) print out the errors which are supposed to be directed to the console or
 * 2) assemble successfully and load the program into memory
 * This function is so long because it performs a lot of checks that verify if the instructions are valid.
 */
function assemble() {
    clear_memory_image();
    var prog_text = document.getElementById("program_text");

    var console_out = document.getElementById("console");
    var running = document.createElement("p");
    running.innerHTML = "Your program is being assembled...";
    console_out.appendChild(running);

    // Gets the contents of the text box and stores the lines in a list
    var lines = editor.getValue().split("\n");
    // This holds the error messages that will be output to the console
    var errors = [];
    // This list holds what should be input to main memory
    var args = [];
    // This dict maps the instructions to their respective line numbers, this will be used for breakpoints
    // to map line numbers to their respective locations in main memory.
    var line2args = {};
    var line_number = 1;
    for (i = 0; i < lines.length; i++) {
        // Checks if line is blank or whitespace
        if (lines[i] == "" || /^\s+$/.test(lines[i])) {
            line_number = line_number + 1;
            continue;
        }
        // Remove starting and ending whitespace
        var arg_no_comment = lines[i].split(COMMENT)[0].trim();
        // Remove if line is a whitespace
        if (arg_no_comment == "" || /^\s+$/.test(arg_no_comment)) {
            line_number = line_number + 1;
            continue;
        }
        var split_args = arg_no_comment.split(",");
        // There are 2 arguments
        if (split_args.length == 2) {
            // split by whitespace to get instruction and arg0
            var ins_arg0 = split_args[0].split(/\s+/g);
            var ins = "";
            var arg0 = "";
            var arg1 = split_args[1].trim();
            // 2 arguments
            if (ins_arg0.length == 2) {
                ins = ins_arg0[0];
                arg0 = ins_arg0[1];
                var state = check_instruction(ins, arg0, arg1, 2);
                if (state["state"]) {
                    line2args[line_number] = args.length;
                    args.push(ins);
                    args.push(arg0);
                    args.push(arg1);
                }
                else {
                    errors.push("Line " + line_number + " " + state["error"]);
                    args = [];
                    line_number = line_number + 1;
                    continue;
                }
            }
            // The spacing here indicates there's some unnecessary icons here
            else {
                errors.push("Line " + line_number + " " + ERROR_INCORRECT_SPACING);
                args = [];
                line_number = line_number + 1;
                continue;
            }
        }
        // There are either 1 or no arguments
        else if (split_args.length == 1) {
            var ins_maybe_arg = split_args[0].split(/\s+/g);
            var ins = "";
            // No arguments
            if (ins_maybe_arg.length == 1) {
                ins = ins_maybe_arg[0];
                var state = check_instruction(ins, "", "", 0);
                if (state["state"]) {
                    line2args[line_number] = args.length;
                    args.push(ins);
                }
                else {
                    errors.push(line_number + " " + state["error"]);
                    args = [];
                    line_number = line_number + 1;
                    continue;
                }
            }
            // 1 argument
            else if (ins_maybe_arg.length == 2) {
                ins = ins_maybe_arg[0];
                arg0 = ins_maybe_arg[1];
                var state = check_instruction(ins, arg0, "", 1);
                if (state["state"]) {
                    line2args[line_number] = args.length;
                    args.push(ins);
                    args.push(arg0);
                }
                else {
                    errors.push("Line " + line_number + " " + state["error"]);
                    args = [];
                    line_number = line_number + 1;
                    continue;
                }
            }
            else {
                errors.push("Line " + line_number + " " + ERROR_INCORRECT_SPACING);
                args = [];
                line_number = line_number + 1;
                continue;
            }
        }
        else {
            // There is some error here as there cannot be more than 2 arguments per line
            errors.push("Line " + line_number + " " + ERROR_INCORRECT_ARGS);
            args = [];
            line_number = line_number + 1;
            continue;
        }
        line_number = line_number + 1;
    }
    if (args.length > 512) {
        args = [];
        errors.push(ERROR_INSUFFICIENT_MEMORY);
    }
    if (!errors.length) {
        for (i = 0; i < args.length; i++)
            write_memory(i, args[i]);
    }
    if (errors.length) {
        var end_message = document.createElement("p");
        end_message.innerHTML = "Assembled unsuccessfully. Errors:";
        console_out.appendChild(end_message);
        for (var i = 0; i < errors.length; i++) {
            var error = document.createElement("p");
            error.setAttribute("style", "color:red");
            error.innerHTML = errors[i];
            console_out.appendChild(error);
        }
    }
    else {
        var end_message = document.createElement("p");
        end_message.innerHTML = "Assembled successfully. Data now stored in main memory.";
        console_out.appendChild(end_message);
        createCookieObject("line2mem", line2args, 100);
        color_pc();
    }
}

/*
 * The run function is basically the processor and will do the actual running of the program that is stored in main
 * memory. The contract we have at this point is that the values in main memory are valid hence we do not need to
 * perform any checks.
 *
 * If there is an error, we need to check the checks section.
 *
 * TODO 2) Filter breakpoints such that a breakpoint anywhere in between two instructions is accessible.
 */
function run() {
    uncolor_pc();
    var console_out = document.getElementById("console");
    var running = document.createElement("p");
    running.innerHTML = "Program started running...";
    console_out.appendChild(running);
    var pc = getPC();
    // Checks that first instruction makes sense
    if (!(get_memory(pc) in INS_DESCRIPTION)) {
        var running = document.createElement("p");
        running.innerHTML = "Finished running program successfully.";
        console_out.appendChild(running);
        color_pc();
        return;
    }
    var status = execute_program(MAX_ADDRESS + 1);

    if (status) {
        var running = document.createElement("p");
        running.innerHTML = "Finished running program successfully.";
        console_out.appendChild(running);
        color_pc();
    }
}

/**
 * Performs a single assembly instruction step.
 */
function step() {
    var console_out = document.getElementById("console");
    var running = document.createElement("p");
    var pc = getPC();
    uncolor_pc();
    running.innerHTML = "Start step from address " + pc;
    console_out.appendChild(running);
    // Checks that first instruction makes sense
    if (!(get_memory(pc) in INS_DESCRIPTION)) {
        var running = document.createElement("p");
        running.innerHTML = "End step at address " + pc;
        console_out.appendChild(running);
        color_pc();
        return;
    }
    var work_ins = get_memory(pc);
    var line2mem = readCookieObject("line2mem");
    // While a pc is pointing at an instruction to be executed this means that there is a program to be executed.
    while (work_ins in INS_DESCRIPTION && pc < MAX_ADDRESS) {
        var nargs = INS_DESCRIPTION[work_ins]["nargs"];
        // No args
        if (nargs == 0) {
            INS_DESCRIPTION[work_ins]["f"]();
        }
        // 1 arg
        else if (nargs == 1) {
            var arg0 = get_memory(pc + 1);
            INS_DESCRIPTION[work_ins]["f"](arg0);
        }
        // 2 args
        else if (nargs == 2) {
            var arg0 = get_memory(pc + 1);
            var arg1 = get_memory(pc + 2);
            INS_DESCRIPTION[work_ins]["f"](arg0, arg1);
        }
        else {
            console.error("ERROR: I have no idea how it got here. Basically the INS_DESCRIPTION dict got corrupted");
            return;
        }
        pc = getPC();
        work_ins = get_memory(pc);
        break;
    }
    var running = document.createElement("p");
    running.innerHTML = "End step at address " + pc;
    console_out.appendChild(running);
    color_pc();
}

/*
 * The objective of this program is to be a generic function that executes an assembly program from PC to an
 * end point. Endpoint is a location in main memory.
 *
 * This program either executes to end, program completion or to breakpoint
 */
function execute_program(end) {
    uncolor_pc();
    var pc = getPC();
    var work_ins = get_memory(pc);
    var bps = getBreakpoints();
    var line2mem = readCookieObject("line2mem");
    // While a pc is pointing at an instruction to be executed this means that there is a program to be executed.
    while (work_ins in INS_DESCRIPTION && pc < MAX_ADDRESS && pc != end) {
        var nargs = INS_DESCRIPTION[work_ins]["nargs"];
        // No args
        if (nargs == 0) {
            INS_DESCRIPTION[work_ins]["f"]();
        }
        // 1 arg
        else if (nargs == 1) {
            var arg0 = get_memory(pc + 1);
            INS_DESCRIPTION[work_ins]["f"](arg0);
        }
        // 2 args
        else if (nargs == 2) {
            var arg0 = get_memory(pc + 1);
            var arg1 = get_memory(pc + 2);
            INS_DESCRIPTION[work_ins]["f"](arg0, arg1);
        }
        else {
            console.log("ERROR: I have no idea how it got here. Basically the INS_DESCRIPTION dict got corrupted");
            return;
        }
        pc = getPC();
        work_ins = get_memory(pc);
        if (pcAtBP(bps, pc, line2mem)) {
            var console_out = document.getElementById("console");
            var running = document.createElement("p");
            running.innerHTML = "Breakpoint hit, main memory address: " + pc.toString();
            console_out.appendChild(running);
            color_pc();
            return false;
        }
    }
    return true;
}

function clear_memory_image() {
    for (var i = 0; i < 511; i++) {
        write_memory(i, "0000");
    }
    do_ccl();
    for (var i = 0; i < 4; i++) {
        setR(i, 0);
    }
    setPC(0);
    setSP(511);
}

/**********************************************************************************************************************/
/**************************************** JAVASCRIPT HTML INTERACTION *************************************************/
/**********************************************************************************************************************/
// Colors pc in main memory
function color_pc() {
    $("#addr" + getPC().toString()).css({"backgroundColor": PC_TRACKING_COLOR});
}

// Uncolors pc in main memory
function uncolor_pc() {
    $("#addr" + getPC().toString()).css({"backgroundColor": MAIN_MEMORY_BACKGROUND_COLOR});
}

function color_breakpoints() {
    var cln = document.getElementsByClassName("CodeMirror-linenumber");
    if (readCookie("breakpoint") == null) {
        createCookie("breakpoint", "", 100);
    }
    var bps = getBreakpoints();
    for (var i = 0; i < bps.length; i++) {
        $(cln[parseInt(bps[i]) - 1]).css({"backgroundColor": BREAKPOINT_COLOR});
    }
}

function remove_line2mem() {
    eraseCookie("line2mem");
}

// Functions to call on page load
function init() {
    init_mm();
    color_breakpoints();
    remove_line2mem();
}

/*
 * TODO The save functionality must be done via the server side and passed
 * back to the user.
 * Takes the current text area and saves it as a hidden input whenever the save button is hit.
 */
function save() {
    var program = editor.getValue();
    var program_id = $("#store").attr("data-program-id");
    $.ajax({
        type: "POST",
        url: "/simulatorApp/save-program/" + program_id,
        data: {data: program,
            csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken')[0].value},
        success: function (response) {
            var console = document.getElementById("console");
            var output = document.createElement("p");
            output.innerHTML = "Program saved.";
            console.appendChild(output);
        }
    });
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
        save();
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

document.getElementById("init_memory_button").addEventListener("click", clear_memory_image);
document.getElementById("assemble_button").addEventListener("click", assemble);
document.getElementById("run_button").addEventListener("click", run);
//document.getElementById("save_button").addEventListener("click", save);
document.getElementById("clear_console_button").addEventListener("click", clear_console);
document.getElementById("step_button").addEventListener("click", step);
