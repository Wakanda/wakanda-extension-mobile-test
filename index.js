var Base64 = require("../lib/base64").Base64;
var utils = require("../lib/utils");

var actions = {};

function enableTools(enable) {
    "use strict";

    ['launchTest', 'chromePreview', 'studioPreview', 'androidTest', 'iosTest', 
     'launchRun', 'androidRun', 'iosRun'].forEach(function(elm) {
        studio.setActionEnabled(elm, !! enable);
     });

     // disable run iOS for windows
     if(os.isWindows) {
        studio.setActionEnabled('iosRun', false);
     }
}

function setDefaultConfig() {
    if(os.isWindows) {
        studio.checkMenuItem('androidRun', true);
    }

    studio.checkMenuItem('studioPreview', true);
    studio.checkMenuItem('androidTest', true);
    studio.checkMenuItem('iosTest', true);
}


actions.studioPreview = function() {
    "use strict";
    var checked = studio.isMenuItemChecked('studioPreview');
    studio.checkMenuItem('studioPreview', ! checked);
    studio.checkMenuItem('chromePreview', false);
};

actions.chromePreview = function() {
    "use strict";
    var checked = studio.isMenuItemChecked('chromePreview');
    studio.checkMenuItem('chromePreview', ! checked);
    studio.checkMenuItem('studioPreview', false);
};

actions.androidRun = function() {
    studio.checkMenuItem('androidRun', ! studio.isMenuItemChecked('androidRun'));
};

actions.iosRun = function() {
    studio.checkMenuItem('iosRun', ! studio.isMenuItemChecked('iosRun'));
};

actions.androidTest = function() {
    "use strict";
    studio.checkMenuItem('androidTest', ! studio.isMenuItemChecked('androidTest'));
};

actions.iosTest = function() {
    "use strict";
    studio.checkMenuItem('iosTest', ! studio.isMenuItemChecked('iosTest'));
};


actions.studioStartHandler = function() {
    "use strict";
    
    enableTools(false);
    setDefaultConfig();
};

actions.solutionOpenedHandler = function() {
    "use strict";
    enableTools(true);
};

actions.solutionClosedHandler = function() {
    "use strict";
    enableTools(false);
};


exports.handleMessage = function handleMessage(message) {
	"use strict";

	var actionName = message.action;

	if (!actions.hasOwnProperty(actionName)) {
		return false;
	}
	actions[actionName](message);
};

actions.launchTest = function() {
	"use strict";

    var config = {};

    if(studio.isMenuItemChecked('androidTest') && studio.isMenuItemChecked('iosTest')) {
        config.selected = 'android-ios';

    } else if(studio.isMenuItemChecked('androidTest')) {
        config.selected = 'android';

    } else if(studio.isMenuItemChecked('iosTest')) {
        config.selected = 'ios';

    } else {
        config.selected = 'app';
    }
    
    config.chromePreview = studio.isMenuItemChecked('chromePreview');

    studio.sendCommand('MobileCore.launchTest.' + Base64.encode(JSON.stringify(config)));
};

actions.launchRun = function() {
	"use strict";

    var config = {
        android: studio.isMenuItemChecked('androidRun'),
        ios: studio.isMenuItemChecked('iosRun')
    };

    if(! config.android && ! config.ios) {
        studio.alert('You must select Android or iOs to launch Run emulator.');
        return;
    } 
    studio.sendCommand('MobileCore.launchRun.' + Base64.encode(JSON.stringify( config )));
};

