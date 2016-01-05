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
const MAX_POSITIVE = BIT_MASK_16 >> 1;
const MIN_NEGATIVE = BIT_MASK_SIGN;

// HTML Globals
const PC_TRACKING_COLOR = "pink";
const SP_TRACKING_COLOR = "lightgreen";
const HALF_TABLE_LENGTH = 6 * 31; // 6 is # of rows in table/2; 31 is the pixel length of row

// Code syntax
const COMMENT = ";";
const LABEL_INDICATOR = ".";

// ISA Constants
const OP_CODES = "OP_CODES";
const N_ARGS = "N_ARGS";
const ARG0 = "ARG0";
const ARG1 = "ARG1";
const ZCNO = "ZCNO";
const INS_PC = "INS_PC";
const INS_SP = "INS_SP";
const INS_DESCRIPTION = "INS_DESCRIPTION";
const INS_TYPE = "INS_TYPE";
const INS_TYPE_MEM_ACCESS = "memory_access";
const INS_TYPE_LOGICAL = "logical";
const INS_TYPE_ARITHMETIC = "arithmetic";
const INS_TYPE_BRANCHING = "branching";

/**********************************************************************************************************************/
/*********************************************** MUTABLE STATE VALUES *************************************************/
/**********************************************************************************************************************/
// Indicates what base I'm in, gets changed by the select tag
var BASE_VERSION = 10;
// Indicates clock rate
var CLOCK_PERIOD = 0;
var IGNORE_BREAKPOINTS = false;
var LINE2MEM = {};
var MEM2LINE = {};
var LABELS2LINES = {};
var RUNNING = false;
var PROGRAM_INTERVAL_ID;
//var EDITOR_CHANGED = false;

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
const INSTRUCTIONS = {
    SET: {
        N_ARGS: 2, ARG0: "IMR", ARG1: "R", "f": do_set, OP_CODES: [1, 2, 3], INS_TYPE: INS_TYPE_MEM_ACCESS,
        ZCNO: "----", INS_PC: "+3", INS_SP: "+0",
        INS_DESCRIPTION: "Sets register specified by arg1 to the value in arg0. If arg0 is a memory value it takes the " +
        "value at arg0 and places it into the register in arg1."
    },
    MOV: {
        N_ARGS: 2, ARG0: "IMR", ARG1: "M", "f": do_mov, OP_CODES: [4, 5, 6], INS_TYPE: INS_TYPE_MEM_ACCESS,
        ZCNO: "----", INS_PC: "+3", INS_SP: "+0",
        INS_DESCRIPTION: "Sets memory location specified by arg1 to the value in arg0. If arg0 is a memory value it " +
        "takes the value at arg0 and places it into the register in arg1."
    },
    POP: {
        N_ARGS: 1, ARG0: "R", ARG1: "-", "f": do_pop, OP_CODES: [7], INS_TYPE: INS_TYPE_MEM_ACCESS, ZCNO: "----"
        , INS_PC: "+2", INS_SP: "+1",
        INS_DESCRIPTION: "Pops the value located at SP - 1 off the stack and places this value into register " +
        "specified in arg0. Note that this operation doesn't clear the stack value hence the old stack value is " +
        "still present. This is how deleting on a computer generally occurs; a pointer is deleted or changed to " +
        "another location."
    },
    PSH: {
        N_ARGS: 1, ARG0: "R", ARG1: "-", "f": do_psh, OP_CODES: [8], INS_TYPE: INS_TYPE_MEM_ACCESS, ZCNO: "----"
        , INS_PC: "+2", INS_SP: "-1",
        INS_DESCRIPTION: "Pushes value specified in arg0 into memory location of SP."
    },
    CCL: {
        N_ARGS: 0, ARG0: "-", ARG1: "-", "f": do_ccl, OP_CODES: [9], INS_TYPE: INS_TYPE_MEM_ACCESS, ZCNO: "0000"
        , INS_PC: "+1", INS_SP: "+0",
        INS_DESCRIPTION: "Zeros out all conditions in the condition register."
    },
    RSH: {
        N_ARGS: 1, ARG0: "R", ARG1: "-", "f": do_rsh, OP_CODES: [10], INS_TYPE: INS_TYPE_LOGICAL, ZCNO: "?---"
        , INS_PC: "+2", INS_SP: "+0",
        INS_DESCRIPTION: "Performs " + "logical right shift".link("https://en.wikipedia.org/wiki/Logical_shift") +
        " on the register specified in arg0. If result is 0 sets 0 flag."
    },
    LSH: {
        N_ARGS: 1, ARG0: "R", ARG1: "-", "f": do_lsh, OP_CODES: [11], INS_TYPE: INS_TYPE_LOGICAL, ZCNO: "-?-?"
        , INS_PC: "+2", INS_SP: "+0",
        INS_DESCRIPTION: "Performs " + "logical left shift".link("https://en.wikipedia.org/wiki/Logical_shift") +
        " on the register specified in arg0. If the most significant bit in arg0 is asserted then the C and " +
        "O bit get asserted."
    },
    AND: {
        N_ARGS: 2, ARG0: "R", ARG1: "R", "f": do_and, OP_CODES: [12], INS_TYPE: INS_TYPE_LOGICAL, ZCNO: "?0?0"
        , INS_PC: "+2", INS_SP: "+0",
        INS_DESCRIPTION: "Performs a logical " + "and".link("https://en.wikipedia.org/wiki/Logical_conjunction") +
        " between arg0 and arg1 and places the result into arg1. The Z bit is set if the result is 0, the " +
        "N bit is set if the resulting most significant bit is 1, and the C and O bit are always set to 0."
    },
    OR: {
        N_ARGS: 2, ARG0: "R", ARG1: "R", "f": do_or, OP_CODES: [13], INS_TYPE: INS_TYPE_LOGICAL, ZCNO: "?0?0"
        , INS_PC: "+3", INS_SP: "+0",
        INS_DESCRIPTION: "Performs a logical " + "or".link("https://en.wikipedia.org/wiki/Logical_disjunction") +
        " between arg0 and arg1 and places the result into arg1. The Z bit is set if the result is 0, the " +
        "N bit is set if the resulting most significant bit is 1, and the C and O bit are always set to 0."
    },
    ADD: {
        N_ARGS: 2, ARG0: "R", ARG1: "R", "f": do_add, OP_CODES: [14], INS_TYPE: INS_TYPE_ARITHMETIC, ZCNO: "????"
        , INS_PC: "+3", INS_SP: "+0",
        INS_DESCRIPTION: "Performs " +
        "2's complement addition".link("https://en.wikipedia.org/wiki/Two's_complement#Addition") +
        " between arg0 and arg1 and places the result into arg1. The Z bit is set if the result is 0, the " +
        "N bit is set if the resulting most significant bit is 1, and the C and O bit are set when the result should" +
        " be greater than 0x7FFF or if the negative result should be less than 0x8000."
    },
    SUB: {
        N_ARGS: 2, ARG0: "R", ARG1: "R", "f": do_sub, OP_CODES: [15], INS_TYPE: INS_TYPE_ARITHMETIC, ZCNO: "????"
        , INS_PC: "+3", INS_SP: "+0",
        INS_DESCRIPTION: "Performs " +
        "2's complement subtraction".link("https://en.wikipedia.org/wiki/Two's_complement#Subtraction") +
        " between arg0 and arg1 and places the result into arg1. The Z bit is set if the result is 0, the " +
        "N bit is set if the resulting most significant bit is 1, and the C and O bit are set when the result should" +
        " be greater than 0x7FFF or if the negative result should be less than 0x8000."
    },
    MUL: {
        N_ARGS: 2, ARG0: "R", ARG1: "R", "f": do_mul, OP_CODES: [16], INS_TYPE: INS_TYPE_ARITHMETIC, ZCNO: "?-?-"
        , INS_PC: "+3", INS_SP: "+0",
        INS_DESCRIPTION: "Performs " +
        "2's complement multiplication".link("https://en.wikipedia.org/wiki/Two's_complement#Multiplication") +
        " between arg0 and arg1 and places the result into arg1. The Z bit is set if the result is 0, the " +
        "N bit is set if the resulting most significant bit is 1, and the C and O bit are set when the result should" +
        " be greater than 0x7FFF or if the negative result should be less than 0x8000."
    },
    DIV: {
        N_ARGS: 2, ARG0: "R", ARG1: "R", "f": do_div, OP_CODES: [17], INS_TYPE: INS_TYPE_ARITHMETIC, ZCNO: "?-?-"
        , INS_PC: "+3", INS_SP: "+0",
        INS_DESCRIPTION: "Performs signed division between arg0 and arg1 and places result in arg1. If arg1 is 0, the " +
        "result is 0. The result will be returned in 2's complement form."
    },
    CMP: {
        N_ARGS: 2, ARG0: "IMR", ARG1: "IMR", "f": do_cmp, OP_CODES: [18, 19, 20, 21, 22, 23, 24, 25, 26]
        , INS_TYPE: INS_TYPE_BRANCHING, ZCNO: "????", INS_PC: "+3", INS_SP: "+0",
        INS_DESCRIPTION: "Performs that same operation as subtract except it doesn't fill arg1 with the result. The" +
        " purpose of this instruction is to fill the condition flags."
    },
    BRN: {
        N_ARGS: 1, ARG0: "LM", ARG1: "-", "f": do_brn, OP_CODES: [27], INS_TYPE: INS_TYPE_BRANCHING, ZCNO: "----"
        , INS_PC: "arg0", INS_SP: "+0",
        INS_DESCRIPTION: "Branches to address in arg0 if N flag is set."
    },
    BRA: {
        N_ARGS: 1, ARG0: "LM", ARG1: "-", "f": do_bra, OP_CODES: [28], INS_TYPE: INS_TYPE_BRANCHING, ZCNO: "----"
        , INS_PC: "arg0", INS_SP: "+0",
        INS_DESCRIPTION: "Branch unconditionally to address in arg0."
    },
    BRZ: {
        N_ARGS: 1, ARG0: "LM", ARG1: "-", "f": do_brz, OP_CODES: [29], INS_TYPE: INS_TYPE_BRANCHING, ZCNO: "----"
        , INS_PC: "arg0", INS_SP: "+0",
        INS_DESCRIPTION: "Branches to address in arg0 if Z flag is set."
    },
    BRG: {
        N_ARGS: 1, ARG0: "LM", ARG1: "-", "f": do_brg, OP_CODES: [30], INS_TYPE: INS_TYPE_BRANCHING, ZCNO: "----"
        , INS_PC: "arg0", INS_SP: "+0",
        INS_DESCRIPTION: "Branches if greater than or if both Z and N flag aren't set."
    },
    JSR: {
        N_ARGS: 1, ARG0: "LM", ARG1: "-", "f": do_jsr, OP_CODES: [31], INS_TYPE: INS_TYPE_BRANCHING, ZCNO: "----"
        , INS_PC: "arg0", INS_SP: "-1",
        INS_DESCRIPTION: "Pushes the next instruction address onto the stack and jumps to address in arg0."
    },
    RTN: {
        N_ARGS: 0, ARG0: "-", ARG1: "-", "f": do_rtn, OP_CODES: [32], INS_TYPE: INS_TYPE_BRANCHING, ZCNO: "----"
        , INS_PC: "?", INS_SP: "+1",
        INS_DESCRIPTION: "Jumps to the address at the top entry of the stack."
    },
    STP: {
        N_ARGS: 0, ARG0: "-", ARG1: "-", "f": do_stp, OP_CODES: [33], INS_TYPE: INS_TYPE_BRANCHING, ZCNO: "----"
        , INS_PC: "+0", INS_SP: "+0",
        INS_DESCRIPTION: "Halts the program execution. Call this when the program has completed running."
    }
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
    write_op_code(arg1);
    setPC(getPC() + 3);
}

function do_add(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    var arg1_val = get_arg_val(arg1);
    var sum = arg0_val + arg1_val;
    arithmetic_flag_setting(arg0_val, arg1_val, sum);
    setR(arg1[1], (sum & BIT_MASK_16));
}

function do_sub(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    // Changes the arg1 to its 2's complement equivalent.
    // Basically transform: a - b to a + (-b) in order to use the same consistent check_overflow.
    var arg1_val = twos_invert_sign(get_arg_val(arg1));
    var dif = arg0_val + arg1_val;
    arithmetic_flag_setting(arg0_val, arg1_val, dif);
    setR(arg1[1], (dif & BIT_MASK_16));
}

function do_mul(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    var arg1_val = get_arg_val(arg1);
    var prod = arg0_val * arg1_val;
    arithmetic_flag_setting(arg0_val, arg1_val, prod);
    setR(arg1[1], (prod & BIT_MASK_16));
}

function zero_and_negative_flag_setting(result) {
    if ((result & BIT_MASK_16) == 0)
        setCCF("Z", 1);
    else
        setCCF("Z", 0);
    if ((result & BIT_MASK_16) & BIT_MASK_SIGN)
        setCCF("N", 1);
    else
        setCCF("N", 0);
}

function overflow_and_carry_flag_setting(arg0, arg1, result) {
    if (check_overflow(arg0, arg1, result)) {
        setCCF("O", 1);
        setCCF("C", 1);
    }
    else {
        setCCF("O", 0);
        setCCF("C", 0);
    }
}

function arithmetic_flag_setting(arg0, arg1, result) {
    overflow_and_carry_flag_setting(arg0, arg1, result);
    zero_and_negative_flag_setting(result);
    setPC(getPC() + 3);
}

/*
 * Performs 2's complement division. Division by zero puts a 0 into arg1.
 */
function do_div(arg0, arg1) {
    var arg0_val = convert_to_js_integer(get_arg_val(arg0));
    var arg1_val = convert_to_js_integer(get_arg_val(arg1));
    if (arg1_val === 0) {
        setR(arg1[1], 0);
        setPC(getPC() + 3);
        return;
    }
    var div = Math.floor(arg0_val / arg1_val);
    if (div < 0) {
        div = twos_invert_sign(Math.abs(div));
    }
    zero_and_negative_flag_setting(div);
    setR(arg1[1], (div & BIT_MASK_16));
    setPC(getPC() + 3);
}

function do_rsh(arg0) {
    var arg0_val = get_arg_val(arg0);
    var rshed = arg0_val >> 1;
    setR(arg0[1], rshed);
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
    zero_and_negative_flag_setting(anded);
    setR(arg1[1], (anded & BIT_MASK_16));
    setPC(getPC() + 3);
}

function do_or(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    var arg1_val = get_arg_val(arg1);
    var ored = arg0_val | arg1_val;
    setCCF("O", 0);
    setCCF("C", 0);
    zero_and_negative_flag_setting(ored);
    setR(arg1[1], (ored & BIT_MASK_16));
    setPC(getPC() + 3);
}

function do_cmp(arg0, arg1) {
    var arg0_val = get_arg_val(arg0);
    var arg1_val = twos_invert_sign(get_arg_val(arg1));
    var dif = arg0_val + arg1_val;
    arithmetic_flag_setting(arg0_val, arg1_val, dif);
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
    if (!(getCCF("N") === 1) && !(getCCF("Z") === 1))
        setPC(arg0);
    else
        setPC(getPC() + 2);
}

function do_jsr(arg0) {
    var sp = getSP();
    var pc = getPC();
    write_memory(sp, pc + 2);
    write_op_code(sp);
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
    write_op_code(sp);
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
    var suffix = (BASE_VERSION == HEX_LENGTH) ? "0x" : "";

    if (n < BASE_VERSION) {
        return suffix + "00" + str_n.toUpperCase();
    }
    else if (n < BASE_VERSION * BASE_VERSION) {
        return suffix + "0" + str_n.toUpperCase();
    }
    return suffix + str_n.toUpperCase();
}

/*
 * Same function as above except formats with 4 digits
 */
function format_numbers(n) {
    n &= BIT_MASK_16;
    var str_n = convert_to_proper_string_base(n);
    var decimal_zero = (BASE_VERSION == HEX_LENGTH) ? "" : "0";
    var suffix = (BASE_VERSION == HEX_LENGTH) ? "0x" : "";

    if (n < BASE_VERSION) {
        return suffix + "000" + decimal_zero + str_n.toUpperCase();
    }
    else if (n < BASE_VERSION * BASE_VERSION) {
        return suffix + "00" + decimal_zero  + str_n.toUpperCase();
    }
    else if (n < BASE_VERSION * BASE_VERSION * BASE_VERSION) {
        return suffix + "0" + decimal_zero  + str_n.toUpperCase();
    }
    else if (n < BASE_VERSION * BASE_VERSION * BASE_VERSION * BASE_VERSION) {
        return suffix + decimal_zero  + str_n.toUpperCase();
    }
    return suffix + str_n.toUpperCase();
}

/*
 * This function converts to the new base. The contract is that it only gets invoked when a change of base occurs.
 */
function convert_to_proper_string_base(n) {
    return (BASE_VERSION === 10) ? n.toString(DECIMAL_LENGTH) : n.toString(HEX_LENGTH);
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
            return "";
        }
    }
    return code_line;
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
    return arg_no_comment;
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

function check_if_R(val) {
    return val === "R0" || val === "R1" || val === "R2" || val === "R3";
}

function check_if_I(val) {
    return val[0] === "$";
}

// Checks if a vlaue is address by checking if the first digit is [0-9], works for hex given hex are prefixed by 0x.
function check_if_A(val) {
    return /^\d+$/.test(val[0]);
}

// This function checks if a number is immediate or address, formats accordingly and returns. Otherwise it does nothing.
function format_number_check_type(val) {
    if (check_if_A(val)) {
        return format_numbers(val);
    }
    else if (check_if_I(val)) {
        return "$" + format_numbers(val.substring(1));
    }
    return val;
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
    $("#addr" + address).html(format_number_check_type(value));
}

// Given a list of arguments, returns the index of the argument.
function index_op_codes(arg_list, arg) {
    return arg_list.indexOf(arg);
}

// Returns the argument type
function return_arg_type(value) {
    if (check_if_R(value))
        return "R";
    if (check_if_I(value))
        return "I";
    return "M";
}

function write_op_code(address) {
    address = parseInt(address);
    var opcode = $("#opCode" + address);
    var str_value = get_memory(address);
    // Immediate
    if (check_if_I(str_value)) {
        opcode.html(format_numbers(str_value.substring(1)));
    }
    // Register
    else if (check_if_R(str_value)) {
        opcode.html(format_numbers(str_value[1]));
    }
    // Address
    else if (check_if_A(str_value)) {
        opcode.html(format_numbers(str_value));
    }
    // Instruction
    else {
        var ins = INSTRUCTIONS[str_value];
        var op_codes = ins[OP_CODES];
        var op_code_length = op_codes.length;
        if (op_code_length < 2) {
            opcode.html(format_numbers(op_codes[0]));
            return;
        }
        var n_args = ins[N_ARGS];
        var arg0_value = get_memory(address + 1);
        var arg0_type = return_arg_type(arg0_value);
        var arg0_op_index = index_op_codes(ins[ARG0], arg0_type);
        if (n_args === 1) {
            opcode.html(format_numbers(op_codes[arg0_op_index]));
            return;
        }
        var arg0_options = ins[ARG0].length;
        var arg1_value = get_memory(address + 2);
        var arg1_type = return_arg_type(arg1_value);
        var arg1_op_index = index_op_codes(ins[ARG1], arg1_type);
        var arg1_options = ins[ARG1].length;
        if (arg0_options === 1) {
            opcode.html(format_numbers(op_codes[arg1_op_index]));
            return;
        }
        if (arg1_options === 1) {
            opcode.html(format_numbers(op_codes[arg0_op_index]));
            return;
        }
        opcode.html(format_numbers(op_codes[arg0_op_index * arg0_options + arg1_op_index]));
    }
}

/*
 * Gets the value stored at the address in memory.
 */
function get_memory(address) {
    address = parseInt(address);
    // error checking
    if (address > MAX_ADDRESS || address < 0) {
        write_error_to_console(ERROR_ADDRESS_OUT_OF_BOUNDS);
        stop_program_running();
        return -1;
    }
    return $("#addr" + address).html();

}

/*
 * Gets the register content in integer format. rNum is bound to [0:3]
 */
function getR(rNum) {
    return parseInt($("#R" + rNum + "content").html());
}

function setR(rNum, rIn) {
    $("#R" + rNum + "content").html(format_numbers(rIn));
}

function getPC() {
    return parseInt($("#PCcontent").html());
}

function setPC_no_jump(rIn) {
    uncolor_pc();
    if (rIn > MAX_ADDRESS || rIn < 0) {
        write_error_to_console(ERROR_ADDRESS_OUT_OF_BOUNDS);
        stop_program_running();
        return;
    }
    if (getPC() > getSP()) {
        write_error_to_console(ERROR_STACK_OVERFLOW);
        stop_program_running();
        return;
    }
    $("#PCcontent").html(format_numbers(rIn));
    color_pc();
}

function setPC(rIn) {
    setPC_no_jump(rIn);
    jump2pc_in_mm();
}

function getSP() {
    return parseInt($("#SPcontent").html());
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
    $("#SPcontent").html(format_numbers(rIn));
    color_sp();
}

function getCCF(flag) {
    return $("#CCcontent").html()[ZCNO_MAPPINGS[flag]];
}

/*
 * flag - ["Z" - "O"]
 */
function setCCF(flag, set_to) {
    var element = $("#CCcontent");
    var status = element.html();
    status = status.substring(0, ZCNO_MAPPINGS[flag]) + set_to + status.substring(ZCNO_MAPPINGS[flag] + 1, HEX_LENGTH);
    element.html(status);
}

/**********************************************************************************************************************/
/*********************************************** ISA CHECKS ***********************************************************/
/**********************************************************************************************************************/
// All the checks return a state dictionary that indicate whether the check passed (true) and the parsed argument to put
// in MM. The key "state" indicates the check status and "arg" indicates the returned argument.

/*
 * Returns whether a number is 2's complement 16 bit negative.
 */
function is_negative(value) {
    return (value & BIT_MASK_SIGN) > 0;
}

function is_positive(value) {
    return !is_negative(value) && value != 0;
}

/*
 * Returns whether the value is an acceptable 16 bit 2's complement sign value.
 */
function is_2s_positive(value) {
    return value > 0 && value <= MAX_POSITIVE;
}

function is_2s_negative(value) {
    return value >= MIN_NEGATIVE && value <= BIT_MASK_16;
}

function convert_to_js_integer(value) {
    return (is_positive(value)) ? value : -twos_invert_sign(value);
}

/*
 * Returns the 2's complement of value. Note: that this fails for minimum integer, 0x8000.
 */
function twos_invert_sign(value) {
    return (~value + 1) & BIT_MASK_16;
}

/*
 * Returns whether overflow has occurred.
 */
function check_overflow(arg0, arg1, result) {
    // Get should be positive cases
    if ((is_positive(arg0) && is_positive(arg1)) || (is_negative(arg0) && is_negative(arg1))) {
        return !is_2s_positive(result);
    }
    else if (arg0 == 0 || arg1 == 0) {
        return false;
    }
    else {
        return !is_2s_negative(result);
    }

}

/*
 * Checks that all register names are valid.
 */
function checkR(reg) {
    return reg.toUpperCase() in LIST_REG_NAMES;
}

/*
 * Checks that the immediate value is correct. This includes in bounds and contains all the proper numeric characters.
 */
function checkI(imm) {
    if (imm.length < 2 || imm[0] != "$")
        return false;
    var i;
    // Immediate value may be hex
    if (imm.length > 3) {
        // Value is hex
        var immParsed;
        if (imm.substring(1, 3) == "0x") {
            // Check all digits are valid hex
            for (i = 3; i < imm.length; i++) {
                if (!(imm[i] in LEGAL_BASE_10_NUMBERS || imm[i].toUpperCase() in LEGAL_BASE_16_NUMBERS)) {
                    return false;
                }
            }
        }
        // Value is decimal
        else {
            for (i = 1; i < imm.length; i++) {
                if (!(imm[i] in LEGAL_BASE_10_NUMBERS)) {
                    return false;
                }
            }
        }
        // Check size constraints
        immParsed = parseInt(imm.substring(1, imm.length));
        if (immParsed > BIT_MASK_16 || immParsed < 0) {
            return false;
        }
    }
    // Number is length 2 or 3
    else {
        for (i = 1; i < imm.length; i++) {
            if (!(imm[i] in LEGAL_BASE_10_NUMBERS)) {
                return false;
            }
        }
    }
    return true;
}

/*
 * Checks that the memory address is valid.
 */
function checkM(mem) {
    if (mem.length < 1)
        return false;
    var i;
    // Immediate value may be hex
    if (mem.length > 2) {
        // Value is hex
        if (mem.substring(0, 2) == "0x") {
            for (i = 2; i < mem.length; i++) {
                if (!(mem[i] in LEGAL_BASE_10_NUMBERS || mem[i].toUpperCase() in LEGAL_BASE_16_NUMBERS)) {
                    return false;
                }
            }
        }
        // Value is decimal
        else {
            for (i = 0; i < mem.length; i++) {
                if (!(mem[i] in LEGAL_BASE_10_NUMBERS)) {
                    return false;
                }
            }
        }
        if (mem > MAX_ADDRESS || mem < 0) {
            return false;
        }
    }
    // Number is length 1 or 2
    else {
        for (i = 0; i < mem.length; i++) {
            if (!(mem[i] in LEGAL_BASE_10_NUMBERS)) {
                return false;
            }
        }
    }
    return true;
}

function checkL(label) {
    return label in LABELS2LINES;
}

/*
 * Checks that a single argument matches the required type of argument. arg_allowable refers to the allowed arguments
 * and comes in a string form of either: I, R, or M. The moment a match for an argument type in arg_allowable has been
 * found it means that the argument is of that type.
 */
function check_individual_args(arg_allowable, arg, state) {
    for (var i = 0; i < arg_allowable.length; i++) {
        if (CHECK_ARGS[arg_allowable[i]](arg)) {
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
    if (!(ins in INSTRUCTIONS)) {
        state["state"] = false;
        state["error"] = ERROR_INCORRECT_INS;
        return state;
    }
    // The number of arguments is incorrect
    if (INSTRUCTIONS[ins][N_ARGS] != n_args) {
        state["state"] = false;
        state["error"] = ERROR_INCORRECT_NUM_ARGS;
        return state;
    }
    var arg0allowable;
    // Check the argument state
    if (n_args == 2) {
        arg0allowable = INSTRUCTIONS[ins][ARG0];
        var arg1allowable = INSTRUCTIONS[ins][ARG1];
        state = check_individual_args(arg0allowable, arg0, state);
        if (!state["state"])
            return state;
        state = check_individual_args(arg1allowable, arg1, state);
        if (!state["state"])
            return state;
    }
    else if (n_args == 1) {
        arg0allowable = INSTRUCTIONS[ins][ARG0];
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
    var main_memory = $("#main_memory");
    for (var i = 0; i < MEM_SIZE; i++) {
        var table_row = $("<tr></tr>");
        var addr_col = $("<td></td>").attr("id", "address" + i).html(format_addr(i));
        var value_col = $("<td></td>").attr("id", "addr" + i).html(format_numbers(0));
        var opcode_col = $("<td></td>").attr("id", "opCode" + i).html(format_numbers(0));
        var label_col = $("<td></td>").attr("id", "label" + i);
        main_memory.append(table_row.append(addr_col).append(value_col).append(opcode_col).append(label_col));
    }
}

/*
 * Gets the assigned labels throughout the text editor and maps them to their respective address.
 */
function get_labels(lines, errors) {
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
            // This is assuming that either the label is on the current line, or it is specified in the current line.
            if (split_label_line.length > 1) {
                //var potential_address = split_label_line[1];
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
    write_to_console("Assembling has begun...");

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
    get_labels(lines, errors);

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
        return false;
    }
    // Assembled successfully
    else {
        var arg_length = args.length;
        // Write the program to main memory
        for (i = 0; i < arg_length; i++) {
            var arg = args[i];
            if (arg[0] === ".") {
                arg = line2args[LABELS2LINES[arg]];
            }
            write_memory(i, arg);
        }

        for (i = 0; i < arg_length; i++) {
            write_op_code(i);
        }

        LINE2MEM = jQuery.extend(true, {}, line2args);
        MEM2LINE = _.invert(line2args);

        // Write labels to main memory table
        for (var label in LABELS2LINES) {
            if (LABELS2LINES.hasOwnProperty(label)) {
                var address = LINE2MEM[LABELS2LINES[label]];
                // error checking
                if (address > MAX_ADDRESS || address < 0) {
                    write_error_to_console(ERROR_ADDRESS_OUT_OF_BOUNDS);
                    return;
                }
                $("#label" + address).html(label.slice(1));
            }
        }
        write_to_console("Assembled successfully. Data now stored in main memory.");
    }
    return true;
}

/**
 * Performs a single assembly instruction step.
 */
function step() {
    var pc = getPC();
    var work_ins = get_memory(pc);
    // Checks that first instruction makes sense
    if (!(work_ins in INSTRUCTIONS) || (work_ins === "STP")) {
        write_to_console("Stepped to end of program.");
        return;
    }
    var n_args = INSTRUCTIONS[work_ins][N_ARGS];
    var arg0;
    // No args
    if (n_args == 0) {
        INSTRUCTIONS[work_ins]["f"]();
    }
    // 1 arg
    else if (n_args == 1) {
        arg0 = get_memory(pc + 1);
        INSTRUCTIONS[work_ins]["f"](arg0);
    }
    // 2 args
    else if (n_args == 2) {
        arg0 = get_memory(pc + 1);
        var arg1 = get_memory(pc + 2);
        INSTRUCTIONS[work_ins]["f"](arg0, arg1);
    }
    pc = getPC();
    write_to_console("End step at address " + pc);
}

/*
 * The run function is basically the processor and will do the actual running of the program that is stored in main
 * memory. The contract we have at this point is that the values in main memory are valid hence we do not need to
 * perform any checks.
 *
 * If there is an error, we need to check the checks section.
 */
function run_program_noBP() {
    write_to_console("Program started running...");
    IGNORE_BREAKPOINTS = true;
    resume_program_running();
}

function load_and_run() {
    if (assemble())
        run_program();
}

function load_and_run_noBP() {
    if (assemble())
        run_program_noBP();
}

function run_program() {
    write_to_console("Program started running...");
    resume_program_running();
}

/*
 * The objective of this program is to be a generic function that executes an assembly program from PC to an
 * end point.
 *
 * This program either executes to STP, program completion or to breakpoint.
 *
 * The setInterval is there to enable having various clock rates.
 */
function execute_program() {
    PROGRAM_INTERVAL_ID = setInterval(function() {
        var pc = getPC();
        var work_ins = get_memory(pc);

        // While a pc is pointing at an instruction to be executed this means that there is a program to be executed.
        if (!(work_ins in INSTRUCTIONS) || (work_ins === "STP")) {
            write_to_console("Finished running program.");
            stop_program_running();
            return;
        }

        var n_args = INSTRUCTIONS[work_ins][N_ARGS];
        var arg0;
        // No args
        if (n_args == 0) {
            INSTRUCTIONS[work_ins]["f"]();
            pc += 1;
        }
        // 1 arg
        else if (n_args == 1) {
            arg0 = get_memory(pc + 1);
            INSTRUCTIONS[work_ins]["f"](arg0);
            pc += 2;
        }
        // 2 args
        else if (n_args == 2) {
            arg0 = get_memory(pc + 1);
            var arg1 = get_memory(pc + 2);
            INSTRUCTIONS[work_ins]["f"](arg0, arg1);
            pc += 3;
        }
        if (!IGNORE_BREAKPOINTS && pcAtBP(MEM2LINE, pc)) {
            write_to_console("Breakpoint hit, main memory address: " + pc);
            stop_program_running();
        }
    }, CLOCK_PERIOD);
}

function stop_program_running() {
    if (RUNNING) {
        enable_buttons_when_run();
        clearInterval(PROGRAM_INTERVAL_ID);
        RUNNING = false;
        IGNORE_BREAKPOINTS = false;
    }
}

function resume_program_running() {
    disable_buttons_when_run();
    RUNNING = true;
    execute_program();
}

function clear_memory_image() {
    stop_program_running();
    var i;
    for (i = 0; i < MEM_SIZE; i++) {
        write_memory(i, "0000");
        $("#label" + i).html("");
        write_op_code(i);
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
    clear_console();
}

/**********************************************************************************************************************/
/**************************************** JAVASCRIPT HTML INTERACTION *************************************************/
/**********************************************************************************************************************/
function disable_buttons_when_run() {
    $("#load_button").prop("disabled", true);
    $("#step_button").prop("disabled", true);
    $("#assemble_button").prop("disabled", true);
    $("#run_button").prop("disabled", true);
    $("#run_ignore_bp_button").prop("disabled", true);
    $("#pause_button").prop("disabled", false);
}

function enable_buttons_when_run() {
    $("#run_button").prop("disabled", false);
    $("#step_button").prop("disabled", false);
    $("#assemble_button").prop("disabled", false);
    $("#run_ignore_bp_button").prop("disabled", false);
    $("#pause_button").prop("disabled", true);
}

function write_to_console(string) {
    var console_out = $("#console");
    console_out.append($("<p></p>").html(string)).scrollTop(console_out.prop("scrollHeight"));
}

function write_error_to_console(string) {
    var console_out = $("#console");
    console_out.append($("<p></p>").html(string).css("color", "red")).scrollTop(console_out.prop("scrollHeight"));
}

// Scrolls to the PC in the main memory table. Always scrolls to the midpoint.
function jump2pc_in_mm() {
    var row_pos = $('#address' + getPC()).parent().position();
    $('#div_main_memory').scrollTop(Math.max(0, row_pos.top - HALF_TABLE_LENGTH));
}

// Scrolls to the SP in the main memory table. Always scrolls to the midpoint.
function jump2sp_in_mm() {
    var row_pos = $('#address' + getSP()).parent().position();
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
    var hz = parseInt($("#program_speed").val());
    CLOCK_PERIOD = (isNaN(hz) || hz === 0) ? 0 : (1000 / hz);

    stop_program_running();
    if (RUNNING) {
        resume_program_running();
    }
}

// Changed the base displayed for main memory and registers
function change_base() {
    if ($("#base_value").val() == "decimal_input") {
        BASE_VERSION = DECIMAL_LENGTH;
    }
    else {
        BASE_VERSION = HEX_LENGTH;
    }
    var i;
    // Rewrite main memory
    for (i = 0; i < MEM_SIZE; i++) {
        // Format the address label
        $("#address" + i).html(format_addr(i));
        // Format the opcodes
        var opCode_dom = $("#opCode" + i);
        var opCode = opCode_dom.html();
        opCode_dom.html(format_numbers(opCode));
        // Format the address value
        write_memory(i, $("#addr" + i).html());
    }

    // Rewrite registers
    for (i = 0; i < NUM_REGS; i++) {
        setR(i, getR(i));
    }

    // Rewrite PC and SP
    setPC_no_jump(getPC());
    setSP(getSP());
}

function save_file() {
    var program_text = editor.getValue();
    var blob = new Blob([program_text], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "assembly_program.asm");
}

function load_file() {
    var fileInput = $("#load_button");

    fileInput.on('change', function (e) {
        var file = fileInput[0].files[0];
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

// Un-colors pc in main memory
function uncolor_pc() {
    // Its important to remove the attr otherwise the hover stops working.
    $("#addr" + getPC()).parent().removeAttr("style");
}

// Colors pc in main memory
function color_sp() {
    $("#addr" + getSP()).parent().css({"backgroundColor": SP_TRACKING_COLOR});
}

// Un-colors pc in main memory
function uncolor_sp() {
    // Its important to remove the attr otherwise the hover stops working.
    $("#addr" + getSP()).parent().removeAttr("style");
}

function remove_line2mem_mem2line() {
    LINE2MEM = {};
    MEM2LINE = {};
}

// Functions to call on page load
function init() {
    init_mm();
    remove_line2mem_mem2line();
    color_pc();
    color_sp();
}

function clear_console() {
    $("#console").html("");
}

$("#init_memory_button").on("click", clear_memory_image);
$("#assemble_button").on("click", assemble);
$("#run_button").on("click", run_program);
$("#save_button").on("click", save_file);
$("#load_button").on("click", load_file);
$("#clear_console_button").on("click", clear_console);
$("#step_button").on("click", step);
$("#pause_button").on("click", stop_program_running);

$("td[rowspan]").addClass('hasRowSpan');
