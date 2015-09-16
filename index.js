var Base64 = require("base64").Base64;

var actions = {};

function enableTools(enable) {
    "use strict";

    ['launchTest', 'chromePreview', 'studioPreview', 'androidTest', 'iosTest', 
     'launchRun', 'androidRun', 'iosRun',
     'launchBuild', 'androidBuild', 'iosBuild'
    ].forEach(function(elm) {
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


function loadPreferences() {
    "use strict";

    ['chromePreview', 'studioPreview', 'androidTest', 'iosTest', 
     'androidRun', 'iosRun',
     'androidBuild', 'iosBuild'
    ].forEach(function(elm) {
        var elmSetting = studio.extension.getSolutionSetting(elm);
        if(elmSetting && (elmSetting === 'true' || elmSetting === 'false')) {
            studio.checkMenuItem(elm, elmSetting === 'true');
        }
     });
}


function savePreferences() {
    "use strict";

    ['chromePreview', 'studioPreview', 'androidTest', 'iosTest', 
     'androidRun', 'iosRun',
     'androidBuild', 'iosBuild'
    ].forEach(function(elm) {
        studio.extension.setSolutionSetting(elm, studio.isMenuItemChecked(elm));
     });
}

actions.studioPreview = function() {
    "use strict";

    var checked = studio.isMenuItemChecked('studioPreview');
    studio.checkMenuItem('studioPreview', ! checked);
    studio.checkMenuItem('chromePreview', checked);
    savePreferences();
};

actions.chromePreview = function() {
    "use strict";

    var checked = studio.isMenuItemChecked('chromePreview');
    studio.checkMenuItem('chromePreview', ! checked);
    studio.checkMenuItem('studioPreview', checked);
    savePreferences();
};

['androidTest', 'iosTest', 
 'androidRun', 'iosRun',
 'androidBuild', 'iosBuild'].forEach(function(elm) {
    actions[elm] = function() {
        studio.checkMenuItem(elm, ! studio.isMenuItemChecked(elm));
        savePreferences();
    };
});

actions.studioStartHandler = function() {
    "use strict";
    
    enableTools(false);
    setDefaultConfig();
};

actions.solutionOpenedHandler = function() {
    "use strict";

    enableTools(true);

    setDefaultConfig();
    loadPreferences();
};

actions.solutionClosedHandler = function() {
    "use strict";

    enableTools(false);
    setDefaultConfig();
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

    studio.sendCommand('MobileCore.launchRun.' + Base64.encode(JSON.stringify( config )));
};

actions.launchBuild = function() {
	"use strict";

    var config = {
        android: studio.isMenuItemChecked('androidBuild'),
        ios: studio.isMenuItemChecked('iosBuild'),
        origin: 'MobileTest'
    };

    studio.sendCommand('MobileCore.launchBuild.' + Base64.encode(JSON.stringify( config )));
};


actions.solutionBeforeClosingHandler = function() {
    "use strict";

    studio.sendCommand('MobileCore.stopProjectIonicSerices');
};

actions.enableAction = function(message) {
    "use strict";

    studio.setActionEnabled(message.params.action, message.params.enable);
};

