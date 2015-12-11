/**
 * Created by Alvin on 11/30/2014.
 *
 * This first three functions of this code was taken from:
 * http://www.quirksmode.org/js/cookies.html
 * I take no credit for writing it.
 */

function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

function createCookieObject(name, value, days) {
    createCookie(name, JSON.stringify(value), days);
}

function readCookieObject(name) {
    return JSON.parse(readCookie(name));
}

/*
 * Breakpoint handlers
 */
function addBreakpoint(value) {
    var bp = readCookie("breakpoint");
    if (bp == null) {
        createCookie("breakpoint", "," + value, 100);
        return;
    }
    createCookie("breakpoint", bp + "," + value, 100);
}

function deleteBreakpoint(value) {
    createCookie("breakpoint", readCookie("breakpoint").replace("," + value, ""), 100);
}

function deleteAllBreakpoints() {
    var bps = getBreakpoints();
    for (var i = 0; i < bps.length; i++) {
        deleteBreakpoint(bps[i]);
    }
}

// Gets the breakpoint line numbers
function getBreakpoints() {
    var bp = readCookie("breakpoint");
    if (bp == "") {
        return [];
    }
    return bp.split(",").slice(1);
}

function pcAtBP(bps, pc, line2mem) {
    for (var i = 0; i < bps.length; i++) {
        if (line2mem[parseInt(bps[i])] == pc) {
            return true;
        }
    }
    return false;
}