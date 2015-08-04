/* Copyright (c) 4D, 2014
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// By default cmd.exe on windows uses code page IBM850.
// Wakanda Server configures at launch its console to use the current ANSI code page
// because most command line tools expect and outputs this code page instead of IBM850.

// You can force the use of utf-16 ("ucs2") code page.
// in that case, the shell worker will use the /u option when calling cmd.exe.

exports.encoding = os.isWindows ? "windowsANSICodePage" : "utf8";

exports.ERROR_BAD_VERSION = 1;

var version = parseInt(process.buildNumber.split(".")[0]);
if (version<10 && version>=1)
	throw {code:exports.ERROR_BAD_VERSION,message:"shellWorker requires Wakanda 10 at least."};

var prepareCommandLine = os.isWindows ?
	function (inCommand) {
	    // on windows, build one single command string,
	    // and force unicode mode if user wants utf-16
	    var cmd = (exports.encoding == "ucs2") ? "cmd /u" : "cmd"
	    return cmd + ' /s /c "' + inCommand + '"';
	}
	:
	function (inCommand) {
        // on unix, pass arguments individually
	    return ['sh', '-c', inCommand];
	};


exports.exec = function exec(inCommand, inFolder, inVariables) {

    var systemResult = SystemWorker.exec(prepareCommandLine(inCommand), {folder:inFolder, variables:inVariables});

    if (systemResult.exitStatus != 0) {
        var e = { name: "ShellError" };
        e.code = systemResult.exitStatus;
        e.message = systemResult.error.toString(exports.encoding);
        throw e;
    }

    return systemResult.output.toString(exports.encoding);
};

exports.create = function create(inCommand, inFolder, inVariables) {
    return function () {
        var worker = {};
        worker._systemWorker = new SystemWorker(prepareCommandLine(inCommand), {folder:inFolder, variables:inVariables});
        worker._systemWorker.setBinary(true);
        worker._systemWorker.onmessage = function (message) {
            if (typeof worker.onmessage == 'function') {
                worker.onmessage(message.data.toString(exports.encoding));
            }
        };
        worker._systemWorker.onerror = function (message) {
            if (typeof worker.onerror == 'function') {
                worker.onerror(message.data.toString(exports.encoding));
            }
        };
        worker._systemWorker.onterminated = function (message) {
            if (typeof worker.onterminated == 'function') {
                worker.onterminated(message);
            }
        };
        return worker;
    }();
}
