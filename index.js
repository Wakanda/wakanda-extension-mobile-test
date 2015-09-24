var utils = require("../wakanda-extension-mobile-core/utils");
var Base64 = require("base64");

var actions = {};

function enableTools(enable) {
    "use strict";

    ['launchTest', 'chromePreview', 'studioPreview', 'androidTest', 'iosTest', 
     'launchRun', 'androidRun', 'iosRun',
     'androidEmulate', 'iosEmulate',
     'launchBuild', 'androidBuild', 'iosBuild'
    ].forEach(function(elm) {
        studio.setActionEnabled(elm, !! enable);
     });

     // disable run iOS for windows
     if(os.isWindows) {
        studio.setActionEnabled('iosRun', false);
        studio.setActionEnabled('iosBuild', false);
     }
}

function setDefaultConfig() {
    "use strict";

    if(os.isWindows) {
        studio.checkMenuItem('androidEmulate', true);
        studio.checkMenuItem('androidBuild', true);
    }

    studio.checkMenuItem('studioPreview', true);
    studio.checkMenuItem('chromePreview', false);
    studio.checkMenuItem('androidTest', true);
    studio.checkMenuItem('iosTest', true);
}


function loadPreferences() {
    "use strict";

    ['chromePreview', 'studioPreview', 'androidTest', 'iosTest', 
     'androidRun', 'iosRun',
     'androidEmulate', 'iosEmulate',
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
     'androidEmulate', 'iosEmulate',
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
 'androidEmulate', 'iosEmulate',
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
    studio.sendCommand('wakanda-extension-mobile-core.launchTest.' + Base64.encode(JSON.stringify(config)));
};

actions.launchRun = function() {
	"use strict";

    var config = {
        emulator: {
            android: studio.isMenuItemChecked('androidEmulate'),
            ios: studio.isMenuItemChecked('iosEmulate')
        },
        device: {
            android: studio.isMenuItemChecked('androidRun'),
            ios: studio.isMenuItemChecked('iosRun')
        }
    };
    
    studio.sendCommand('wakanda-extension-mobile-core.launchRun.' + Base64.encode(JSON.stringify( config )));
};

actions.launchBuild = function() {
	"use strict";

    var config = {
        android: studio.isMenuItemChecked('androidBuild'),
        ios: studio.isMenuItemChecked('iosBuild'),
        origin: 'wakanda-extension-mobile-test'
    };

    studio.sendCommand('wakanda-extension-mobile-core.launchBuild.' + Base64.encode(JSON.stringify( config )));
};


actions.solutionBeforeClosingHandler = function() {
    "use strict";

    studio.sendCommand('wakanda-extension-mobile-core.stopProjectIonicSerices');
};

actions.enableAction = function(message) {
    "use strict";

    studio.setActionEnabled(message.params.action, message.params.enable);
};

actions.menuRunOpened = function() {
    var devices = utils.getConnectedDevices();

    ['android', 'ios'].forEach(function(platform) {
        studio.setActionEnabled(platform + 'Run', !! devices[platform].connected);
        studio.checkMenuItem(platform + 'Run', !! devices[platform].connected);


        studio.checkMenuItem(platform + 'Emulate', ! devices[platform].connected);
    });
};

actions.listenEvent = function(message) {

    switch(message.params.eventName) {
        case 'run':
            studio.setActionEnabled('launchRun', false);
            break;
        case 'runFinished':
            studio.setActionEnabled('launchRun', true);
            break;
        case 'build': 
            studio.setActionEnabled('launchBuild', false);
            break;
        case 'buildFinished':
            studio.setActionEnabled('launchBuild', true);
            break;
    }
};
