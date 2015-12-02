var utils = require("../wakanda-extension-mobile-core/utils");
var Base64 = require("base64");

var actions = {};

// global variables
var ADB_INSTALLED = false;


function initGlobalVariables() {
    // set isAndroidInstalled variable
    utils.executeAsyncCmd({
        cmd: 'adb version',
        options: {
            consoleSilentMode: true
        },
        onmessage: function (msg) {
            ADB_INSTALLED = true;
        },
        onerror: function (msg) {
            ADB_INSTALLED = false;
        }
    });
}

function enableTools(enable) {
    "use strict";

    ['launchTest', 'browserPreview', 'studioPreview', 'androidTest', 'iosTest',
     'launchRun', 'androidRun', 'iosRun',
     'androidEmulate', 'iosEmulate',
     'launchBuild', 'androidBuild', 'iosBuild',
     'launchWebPreview', 'webStudioPreview', 'webBrowserPreview'
    ].forEach(function (elm) {
        studio.setActionEnabled(elm, !!enable);
    });

    // disable iOS for windows
    if (os.isWindows) {
        studio.setActionEnabled('iosEmulate', false);
        studio.setActionEnabled('iosRun', false);
        studio.setActionEnabled('iosBuild', false);
    }
}

function setDefaultConfig() {
    "use strict";

     if (os.isWindows) {
        studio.checkMenuItem('androidEmulate', true);
        studio.checkMenuItem('androidBuild', true);
    }


    if (!os.isWindows) {
	
        studio.checkMenuItem('iosEmulate', true);
        studio.checkMenuItem('iosBuild', true);
        studio.checkMenuItem('androidEmulate', false);
        studio.checkMenuItem('androidBuild', false);
    }

    studio.checkMenuItem('studioPreview', true);
    studio.checkMenuItem('browserPreview', false);
    studio.checkMenuItem('androidTest', true);
    studio.checkMenuItem('iosTest', true);

    studio.checkMenuItem('webStudioPreview', true);
}

function initEnvironnement() {
    // start adb service for mobile project if adb installed and, if a project is a ionic project
    if (!ADB_INSTALLED) {
        return;
    }

    var file = File(utils.getMobileProjectPath() + '/ionic.project');
    if (file.exists) {
        utils.executeAsyncCmd({ 
            cmd: 'adb start-server'
        });
    }
}

function loadPreferences() {
    "use strict";

    ['browserPreview', 'studioPreview', 'androidTest', 'iosTest',
     'androidEmulate', 'iosEmulate',
     'androidBuild', 'iosBuild',
     'webStudioPreview', 'webBrowserPreview'
    ].forEach(function (elm) {
        if (os.isWindows && (elm === 'iosEmulate' || elm === 'iosBuild')) {
            studio.checkMenuItem(elm, false);
            return;
        }

        var elmSetting = studio.extension.getSolutionSetting(elm);
        if (elmSetting && (elmSetting === 'true' || elmSetting === 'false')) {
            studio.checkMenuItem(elm, elmSetting === 'true');
        }
    });
}


function savePreferences() {
    "use strict";

    ['browserPreview', 'studioPreview', 'androidTest', 'iosTest',
     'androidEmulate', 'iosEmulate',
     'androidBuild', 'iosBuild',
     'webStudioPreview', 'webBrowserPreview'
    ].forEach(function (elm) {
        studio.extension.setSolutionSetting(elm, studio.isMenuItemChecked(elm));
    });
}

actions.studioPreview = function () {
    "use strict";

    var checked = studio.isMenuItemChecked('studioPreview');
    studio.checkMenuItem('studioPreview', !checked);
    studio.checkMenuItem('browserPreview', checked);
    savePreferences();
};

actions.browserPreview = function () {
    "use strict";

    var checked = studio.isMenuItemChecked('browserPreview');
    studio.checkMenuItem('browserPreview', !checked);
    studio.checkMenuItem('studioPreview', checked);
    savePreferences();
};

actions.webStudioPreview = function () {
    "use strict";

    var checked = studio.isMenuItemChecked('webStudioPreview');
    studio.checkMenuItem('webStudioPreview', !checked);
    studio.checkMenuItem('webBrowserPreview', checked);
    savePreferences();
};

actions.webBrowserPreview = function () {
    "use strict";
  
    var checked = studio.isMenuItemChecked('webBrowserPreview');
    studio.checkMenuItem('webBrowserPreview', !checked);
    studio.checkMenuItem('webStudioPreview', checked);
    savePreferences();
};

['androidTest', 'iosTest',
 'androidEmulate', 'iosEmulate',
 'androidBuild', 'iosBuild'
].forEach(function (elm) {
    actions[elm] = function () {
        studio.checkMenuItem(elm, !studio.isMenuItemChecked(elm));
        savePreferences();
    };
});

['androidRun', 'iosRun'].forEach(function (elm) {
    actions[elm] = function () {
        studio.checkMenuItem(elm, !studio.isMenuItemChecked(elm));
    };
});

actions.studioStartHandler = function () {
    "use strict";

    enableTools(false);
    setDefaultConfig();

    initGlobalVariables();
};

actions.solutionOpenedHandler = function () {
    "use strict";

    enableTools(true);

    setDefaultConfig();
    loadPreferences();

    initEnvironnement();
};

actions.solutionClosedHandler = function () {
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

actions.launchTest = function () {
    "use strict";

    var config = {};

    if (studio.isMenuItemChecked('androidTest') && studio.isMenuItemChecked('iosTest')) {
        config.selected = 'android-ios';

    } else if (studio.isMenuItemChecked('androidTest')) {
        config.selected = 'android';

    } else if (studio.isMenuItemChecked('iosTest')) {
        config.selected = 'ios';

    } else {
        config.selected = 'app';
    }

    config.browserPreview = studio.isMenuItemChecked('browserPreview');
    studio.sendCommand('wakanda-extension-mobile-core.launchTest.' + Base64.encode(JSON.stringify(config)));
};

actions.launchRun = function () {
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

    studio.sendCommand('wakanda-extension-mobile-core.launchRun.' + Base64.encode(JSON.stringify(config)));
};

actions.launchBuild = function () {
    "use strict";

    var config = {
        android: studio.isMenuItemChecked('androidBuild'),
        ios: studio.isMenuItemChecked('iosBuild'),
        origin: 'wakanda-extension-mobile-test'
    };

    studio.sendCommand('wakanda-extension-mobile-core.launchBuild.' + Base64.encode(JSON.stringify(config)));
};


actions.solutionBeforeClosingHandler = function () {
    "use strict";

    studio.sendCommand('wakanda-extension-mobile-core.stopProjectIonicSerices');

    studio.sendCommand('wakanda-extension-mobile-core.stopProjectGulpServices');
};

actions.enableAction = function (message) {
    "use strict";

    studio.setActionEnabled(message.params.action, message.params.enable);
};

actions.menuOpened = function (message) {
    var menuId = message.source.data.length && message.source.data[0];

    if (menuId === 'wakanda-extension-mobile-test.configRun') {
        var devices = utils.getConnectedDevices();

        ['android', 'ios'].forEach(function (platform) {
            studio.setActionEnabled(platform + 'Run', !!devices[platform].connected);
            if (!devices[platform].connected) {
                studio.checkMenuItem(platform + 'Run', false);
            }
        });
    }
};

actions.listenEvent = function (message) {

    switch (message.params.eventName) {
    case 'run':
    case 'mobileRunWaitConnectToServer':
        studio.setActionEnabled('launchRun', false);
        break;
    case 'runFinished':
    case 'mobileRunConnectedToServer':
        studio.setActionEnabled('launchRun', true);
        break;
    case 'mobileTestWaitConnectToServer':
        studio.setActionEnabled('launchTest', false);
        break;
    case 'mobileTestConnectedToServer':
        studio.setActionEnabled('launchTest', true);
        break;
    case 'build':
        studio.setActionEnabled('launchBuild', false);
        break;
    case 'buildFinished':
        studio.sendExtensionWebZoneCommand('wakanda-extension-mobile-console', 'changeTab', ['build']);
        // enable build button
        studio.setActionEnabled('launchBuild', true);
        break;
    case 'webRunWaitConnectToServer':
    case 'webInstallingNpmModules':
        studio.setActionEnabled('launchWebPreview', false);
        break;        
    case 'webInstallingNpmModulesFinished':
    case 'webRunConnectedToServer':
        studio.setActionEnabled('launchWebPreview', true);
        break;
    case 'startServerAborted':
        studio.setActionEnabled('launchWebPreview', true);
        studio.setActionEnabled('launchTest', true);
        studio.setActionEnabled('launchRun', true);
        break;

    }
};

actions.launchWebPreview = function (message) {

    var config = {
        webBrowserPreview: studio.isMenuItemChecked('webBrowserPreview'),
        webStudioPreview: studio.isMenuItemChecked('webStudioPreview')
    };
   
    studio.sendCommand('wakanda-extension-mobile-core.launchWebPreview.' + Base64.encode(JSON.stringify(config)));
};