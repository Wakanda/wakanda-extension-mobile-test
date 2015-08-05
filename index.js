var shell = require("./js/shellWorker.js");
include("./js/base64.js");

var actions = {};

function enableTestings(enable) {
    studio.setActionEnabled('launchPreview', !! enable);

    studio.setActionEnabled('chromePreview', !! enable);
    studio.setActionEnabled('studioPreview', !! enable);
    studio.setActionEnabled('android', !! enable);
    studio.setActionEnabled('ios', !! enable);
}


actions.studioPreview = function() {
    var checked = studio.isMenuItemChecked('studioPreview');
    studio.checkMenuItem('studioPreview', ! checked);
    studio.checkMenuItem('chromePreview', false);
};

actions.chromePreview = function() {
    var checked = studio.isMenuItemChecked('chromePreview');
    studio.checkMenuItem('chromePreview', ! checked);
    studio.checkMenuItem('studioPreview', false);
};

actions.android = function() {
    studio.checkMenuItem('android', ! studio.isMenuItemChecked('android'));
};

actions.ios = function() {
    studio.checkMenuItem('ios', ! studio.isMenuItemChecked('ios'));
};


actions.studioStartHandler = function() {
    enableTestings(false);
};

actions.solutionOpenedHandler = function() {
    enableTestings(true);

    actions.chromePreview();
};

actions.solutionClosedHandler = function() {
    enableTestings(false);
};


exports.handleMessage = function handleMessage(message) {
	"use strict";
	var actionName;

	actionName = message.action;

	if (!actions.hasOwnProperty(actionName)) {
		return false;
	}
	actions[actionName](message);
};

actions.launchPreview = function() {
	"use strict";


    var settings = {};

    if(studio.isMenuItemChecked('android') && studio.isMenuItemChecked('ios')) {
        settings.selected = 'android-ios';

    } else if(studio.isMenuItemChecked('android')) {
        settings.selected = 'android';

    } else if(studio.isMenuItemChecked('ios')) {
        settings.selected = 'ios';

    } else {
        settings.selected = 'app';
    }
    
    settings.chromePreview = studio.isMenuItemChecked('chromePreview');


    var opt = {
        'android-ios': {
            cmd_opt: '--lab',
            prefix: 'ionic-lab',
            title: 'iOS / Android',
            icon: 'iosandroid.png'
        },
        'android': {
            cmd_opt: '--platform android',
            prefix: '?ionicplatform=android#/tab/dash',
            title: 'Android',
            icon: 'android.png'
        },
        'ios': {
            cmd_opt: '--platform ios',
            prefix: '?ionicplatform=ios#/tab/dash',
            title: 'iOS',
            icon: 'ios.png'
        },
        'app': {
            cmd_opt: '',
            prefix: '#/tab/dash',
            title: 'Mobile App',
            icon: 'app.png'
        }
    }

    var cmd = {
        cmd: 'ionic serve ' + (settings.chromePreview ? opt[settings.selected].cmd_opt : '--nobrowser'),
        path: getSelectedProjectPath()
    };
    
    studio.sendCommand('MobileAPI.invokeCommand.' + Base64.encode(JSON.stringify(cmd)));

    if(! settings.chromePreview) {
        studio.extension.registerTabPage('http://127.0.0.1:8100/' + opt[settings.selected].prefix, opt[settings.selected].icon || '', opt[settings.selected].title)
	    studio.extension.openPageInTab('http://127.0.0.1:8100/' + opt[settings.selected].prefix, opt[settings.selected].title, false);
    }

	return true;
};

function getSelectedProjectPath() {
    var selectedProject = studio.currentSolution.getProjects()[0];
    var solutionPath = studio.currentSolution.getSolutionFile().parent.parent.path;

    return solutionPath + (os.isWindows ? '\\' : '/') + selectedProject + '/myApp/';
}
