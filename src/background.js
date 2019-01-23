"use strict";

var PageRuler = {
    screenshot: new Image(),
    canvas: document.createElement("canvas"),
    init: function(type, previousVersion) {
        console.log("init");
        var manifest = chrome.runtime.getManifest();
        var version = manifest.version;
        switch (type) {
          case "install":
            console.log("First time install version: ", version);
            PageRuler.Analytics.trackEvent("Run", "Install", version);
            chrome.storage.sync.set({
                statistics: true,
                hide_update_tab: false
            });
            break;

          case "update":
            console.log("Update version. From: ", previousVersion, " To: ", version);
            PageRuler.Analytics.trackEvent("Run", "Update", version);
            break;

          default:
            console.log("Existing version run: ", version);
            PageRuler.Analytics.trackEvent("Run", "Open", version);
            break;
        }
    },
    image: function(file) {
        return {
            "19": "images/19/" + file,
            "38": "images/38/" + file
        };
    },
    load: function(tabId) {
        console.log("loading content script");
        chrome.tabs.executeScript(tabId, {
            file: "content.js"
        }, function() {
            console.log("content script for tab #" + tabId + " has loaded");
            PageRuler.enable(tabId);
        });
    },
    enable: function(tabId) {
        chrome.tabs.sendMessage(tabId, {
            type: "enable"
        }, function(success) {
            console.log("enable message for tab #" + tabId + " was sent");
            PageRuler.Analytics.trackEvent("Action", "Enable");
            chrome.browserAction.setIcon({
                path: PageRuler.image("browser_action_on.png"),
                tabId: tabId
            });
        });
    },
    disable: function(tabId) {
        chrome.tabs.sendMessage(tabId, {
            type: "disable"
        }, function(success) {
            console.log("disable message for tab #" + tabId + " was sent");
            PageRuler.Analytics.trackEvent("Action", "Disable");
            chrome.browserAction.setIcon({
                path: PageRuler.image("browser_action.png"),
                tabId: tabId
            });
        });
    },
    browserAction: function(tab) {
        var tabId = tab.id;
        var args = "'action': 'loadtest'," + "'loaded': window.hasOwnProperty('__PageRuler')," + "'active': window.hasOwnProperty('__PageRuler') && window.__PageRuler.active";
        chrome.tabs.executeScript(tabId, {
            code: "chrome.runtime.sendMessage({ " + args + " });"
        });
    },
    openUpdateTab: function(type) {
        chrome.storage.sync.get("hide_update_tab", function(items) {
            if (!items.hide_update_tab) {
                chrome.tabs.create({
                    url: "update.html#" + type
                });
            }
        });
    },
    setPopup: function(tabId, changeInfo, tab) {
        var url = changeInfo.url || tab.url || false;
        if (!!url) {
            if (/^chrome\-extension:\/\//.test(url) || /^chrome:\/\//.test(url)) {
                chrome.browserAction.setPopup({
                    tabId: tabId,
                    popup: "popup.html#local"
                });
            }
            if (/^https:\/\/chrome\.google\.com\/webstore\//.test(url)) {
                chrome.browserAction.setPopup({
                    tabId: tabId,
                    popup: "popup.html#webstore"
                });
            }
        }
    },
    greyscaleConvert: function(imgData) {
        var grey = new Int16Array(imgData.length / 4);
        for (var i = 0, n = 0; i < imgData.length; i += 4, n++) {
            var r = imgData[i], g = imgData[i + 1], b = imgData[i + 2];
            grey[n] = Math.round(r * .2126 + g * .7152 + b * .0722);
        }
        return grey;
    }
};

chrome.browserAction.onClicked.addListener(PageRuler.browserAction);

chrome.tabs.onUpdated.addListener(PageRuler.setPopup);

chrome.runtime.onStartup.addListener(function() {
    console.log("onStartup");
    PageRuler.init();
});

chrome.runtime.onInstalled.addListener(function(details) {
    console.log("onInstalled");
    PageRuler.init(details.reason, details.previousVersion);
    switch (details.reason) {
      case "install":
        PageRuler.openUpdateTab("install");
        break;

      case "update":
        PageRuler.openUpdateTab("update");
        break;
    }
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    var tabId = sender.tab && sender.tab.id;
    console.group("message received from tab #" + tabId);
    console.log("message: ", message);
    console.log("sender: ", sender);
    switch (message.action) {
      case "borderSearch":
        chrome.tabs.captureVisibleTab({
            format: "png"
        }, function(dataUrl) {
            PageRuler.screenshot.onload = function() {
                var ctx = PageRuler.canvas.getContext("2d");
                PageRuler.canvas.width = sender.tab.width;
                PageRuler.canvas.height = sender.tab.height;
                ctx.drawImage(PageRuler.screenshot, 0, 0, PageRuler.canvas.width, PageRuler.canvas.height);
                var startX = Math.floor(message.x * message.devicePixelRatio);
                var startY = Math.floor(message.y * message.devicePixelRatio + message.yOffset * message.devicePixelRatio);
                var imageLine;
                if (message.xDir > 0) {
                    imageLine = ctx.getImageData(startX, startY, PageRuler.canvas.width - startX, 1).data;
                } else if (message.xDir < 0) {
                    imageLine = ctx.getImageData(0, startY, startX + 1, 1).data;
                } else if (message.yDir > 0) {
                    imageLine = ctx.getImageData(startX, startY, 1, PageRuler.canvas.height - startY).data;
                } else {
                    imageLine = ctx.getImageData(startX, 0, 1, startY + 1).data;
                }
                var gsData = PageRuler.greyscaleConvert(imageLine);
                var startPixel;
                var index = 0;
                var direction = 1;
                var checks = 0;
                var nextPixel;
                var threshHold = 10;
                if (message.xDir < 0 || message.yDir < 0) {
                    index = gsData.length - 1;
                    direction = -1;
                }
                startPixel = gsData[index];
                index += direction;
                while (index >= 0 && index < gsData.length) {
                    nextPixel = gsData[index];
                    checks++;
                    if (Math.abs(startPixel - nextPixel) > threshHold) {
                        break;
                    }
                    index += direction;
                }
                var spotsToMove = checks <= 1 ? checks : checks - 1;
                var response = {
                    x: Math.floor((startX + spotsToMove * message.xDir) / message.devicePixelRatio),
                    y: Math.floor((startY + spotsToMove * message.yDir - message.yOffset * message.devicePixelRatio) / message.devicePixelRatio)
                };
                sendResponse(response);
            };
            PageRuler.screenshot.src = dataUrl;
        });
        break;

      case "loadtest":
        if (!message.loaded) {
            PageRuler.load(tabId);
        } else {
            if (message.active) {
                PageRuler.disable(tabId);
            } else {
                PageRuler.enable(tabId);
            }
        }
        break;

      case "disable":
        console.log("tear down");
        if (!!tabId) {
            PageRuler.disable(tabId);
        }
        break;

      case "setColor":
        console.log("saving color " + message.color);
        PageRuler.Analytics.trackEvent("Settings", "Color", message.color);
        chrome.storage.sync.set({
            color: message.color
        });
        break;

      case "getColor":
        console.log("requesting color");
        chrome.storage.sync.get("color", function(items) {
            var color = items.color || "#5b5bdc";
            console.log("color requested: " + color);
            sendResponse(color);
        });
        break;

      case "setDockPosition":
        console.log("saving dock position " + message.position);
        PageRuler.Analytics.trackEvent("Settings", "Dock", message.position);
        chrome.storage.sync.set({
            dock: message.position
        });
        break;

      case "getDockPosition":
        console.log("requesting dock position");
        chrome.storage.sync.get("dock", function(items) {
            var position = items.dock || "top";
            console.log("dock position requested: " + position);
            sendResponse(position);
        });
        break;

      case "setGuides":
        console.log("saving guides visiblity " + message.visible);
        PageRuler.Analytics.trackEvent("Settings", "Guides", message.visible && "On" || "Off");
        chrome.storage.sync.set({
            guides: message.visible
        });
        break;

      case "getGuides":
        console.log("requesting guides visibility");
        chrome.storage.sync.get("guides", function(items) {
            var visiblity = items.hasOwnProperty("guides") ? items.guides : true;
            console.log("guides visibility requested: " + visiblity);
            sendResponse(visiblity);
        });
        break;

      case "setBorderSearch":
        PageRuler.Analytics.trackEvent("Settings", "BorderSearch", message.visible && "On" || "Off");
        chrome.storage.sync.set({
            borderSearch: message.visible
        });
        break;

      case "getBorderSearch":
        chrome.storage.sync.get("borderSearch", function(items) {
            var visiblity = items.hasOwnProperty("borderSearch") ? items.borderSearch : false;
            sendResponse(visiblity);
        });
        break;

      case "trackEvent":
        console.log("track event message received: ", message.args);
        PageRuler.Analytics.trackEvent.apply(PageRuler.Analytics, message.args);
        sendResponse();
        break;

      case "trackPageview":
        console.log("track pageview message received: ", message.page);
        PageRuler.Analytics.trackPageview(message.page);
        sendResponse();
        break;

      case "openHelp":
        PageRuler.Analytics.trackEvent([ "Action", "Help Link" ]);
        chrome.tabs.create({
            url: chrome.extension.getURL("update.html") + "#help"
        });
        break;
    }
    console.groupEnd();
    return true;
});

chrome.commands.onCommand.addListener(function(command) {
    console.log("Command:", command);
});

var _gaq = _gaq || [];

_gaq.push([ "_setAccount", "UA-109739668-3" ]);

(function() {
    var ga = document.createElement("script");
    ga.type = "text/javascript";
    ga.async = true;
    ga.src = "https://ssl.google-analytics.com/ga.js";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(ga, s);
})();

(function(pr) {
    pr.Analytics = {
        checkEnabled: function(callback) {
            chrome.storage.sync.get("statistics", function(items) {
                var enabled = !!items.statistics;
                if (!enabled) {
                    console.log("statistics disabled");
                } else {
                    callback();
                }
            });
        },
        trackPageview: function(page) {
            console.log("Analytics.trackPageview: ", page);
            this.checkEnabled(function() {
                var args = [ "_trackPageview", page ];
                _gaq.push(args);
                console.log("trackPageview sent: ", args);
            });
        },
        trackEvent: function(category, action, label, value) {
            console.log("Analytics.trackEvent: ", arguments);
            this.checkEnabled(function() {
                var args = [ "_trackEvent", category, action ];
                if (!!label) {
                    args.push(label);
                    if (!!value) {
                        args.push(value);
                    }
                }
                _gaq.push(args);
                console.log("trackEvent sent: ", args);
            });
        }
    };
})(PageRuler);
