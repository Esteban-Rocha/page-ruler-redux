"use strict";

window.__PageRuler = {
    active: false,
    el: {},
    elements: {
        toolbar: null,
        mask: null,
        ruler: null,
        guides: null
    },
    enable: function() {
        var _this = this;
        var styles = this.El.createEl("link", {
            id: "styles",
            rel: "stylesheet",
            href: chrome.extension.getURL("content.css") + "?" + this.version
        });
        this.El.appendEl(document.head || document.body || document.documentElement, styles);
        this.elements.toolbar = new this.el.Toolbar();
        this.elements.mask = new this.el.Mask();
        this.elements.guides = new this.el.Guides();
        this.elements.ruler = new this.el.Ruler(this.elements.toolbar, this.elements.guides);
        this.El.registerListener(window, "resize", function() {
            var rect = document.body.getBoundingClientRect();
            var width = rect.width;
            var height = rect.height;
            _this.Dimensions.update(width, height);
        });
        this.El.registerListener(window, "keydown", function(e) {
            if (_this.elements.ruler.keyMoving) {
                var modifier = e.shiftKey && 10 || 1;
                var action = e.ctrlKey || e.metaKey ? e.altKey ? "shrink" : "expand" : "move";
                var ruler = _this.elements.ruler;
                var actions = {
                    up: {
                        move: function() {
                            ruler.setTop(ruler.top - modifier, true);
                        },
                        expand: function() {
                            ruler.setTop(ruler.top - modifier);
                            ruler.setHeight(ruler.height + modifier);
                        },
                        shrink: function() {
                            if (ruler.height > 0) {
                                ruler.setHeight(ruler.height - modifier);
                            }
                        }
                    },
                    down: {
                        move: function() {
                            ruler.setTop(ruler.top + modifier, true);
                        },
                        expand: function() {
                            ruler.setBottom(_this.elements.ruler.bottom + modifier);
                            ruler.setHeight(_this.elements.ruler.height + modifier);
                        },
                        shrink: function() {
                            if (ruler.height > 0) {
                                ruler.setTop(ruler.top + modifier);
                                ruler.setHeight(ruler.height - modifier);
                            }
                        }
                    },
                    left: {
                        move: function() {
                            ruler.setLeft(_this.elements.ruler.left - modifier, true);
                        },
                        expand: function() {
                            ruler.setLeft(ruler.left - modifier);
                            ruler.setWidth(ruler.width + modifier);
                        },
                        shrink: function() {
                            if (ruler.width > 0) {
                                ruler.setWidth(ruler.width - modifier);
                            }
                        }
                    },
                    right: {
                        move: function() {
                            ruler.setLeft(ruler.left + modifier, true);
                        },
                        expand: function() {
                            ruler.setRight(ruler.right + modifier);
                            ruler.setWidth(ruler.width + modifier);
                        },
                        shrink: function() {
                            if (ruler.width > 0) {
                                ruler.setLeft(ruler.left + modifier);
                                ruler.setWidth(ruler.width - modifier);
                            }
                        }
                    }
                };
                var keyMap = {
                    "38": "up",
                    "40": "down",
                    "37": "left",
                    "39": "right"
                };
                if (keyMap.hasOwnProperty(String(e.keyCode))) {
                    e.preventDefault();
                    var key = keyMap[e.keyCode];
                    actions[key][action]();
                }
            }
        });
        this.active = true;
    },
    disable: function() {
        this.elements.toolbar.unshiftPage();
        this.El.removeListeners();
        this.El.removeElements();
        this.Dimensions.removeUpdateCallbacks();
        this.elements.toolbar = null;
        this.elements.mask = null;
        this.elements.ruler = null;
        this.active = false;
    },
    cls: function(constructor, prototype) {
        constructor.prototype = prototype;
        return constructor;
    }
};

(function(pr) {
    pr.Dimensions = {
        pageLeft: 0,
        pageRight: document.body.scrollWidth,
        pageTop: 0,
        pageBottom: document.body.scrollHeight,
        offsetTop: function() {
            return document.body.getBoundingClientRect().top + window.pageYOffset - document.documentElement.clientTop;
        },
        offsetLeft: function() {
            return document.body.getBoundingClientRect().left + window.pageXOffset - document.documentElement.clientLeft;
        },
        updateCallbacks: [],
        addUpdateCallback: function(callback) {
            this.updateCallbacks.push(callback);
        },
        update: function(pageWidth, pageHeight) {
            this.pageRight = pageWidth;
            this.pageBottom = pageHeight;
            for (var i = 0, ilen = this.updateCallbacks.length; i < ilen; i++) {
                this.updateCallbacks[i](this.pageRight, this.pageBottom);
            }
        },
        removeUpdateCallbacks: function() {
            for (var i = 0, ilen = this.updateCallbacks.length; i < ilen; i++) {
                this.updateCallbacks[i] = null;
            }
            this.updateCallbacks = [];
        }
    };
})(__PageRuler);

(function(pr) {
    pr.El = {
        elements: [],
        listeners: [],
        createEl: function(tag, attrs, listeners, text) {
            attrs = attrs || {};
            attrs.id = !!attrs.id && "page-ruler-" + attrs.id || "page-ruler";
            var el = document.createElement(tag);
            for (var attr in attrs) {
                if (attrs.hasOwnProperty(attr)) {
                    var attrVal = attrs[attr];
                    if (attr === "cls") {
                        attr = "class";
                    }
                    if (attr === "class") {
                        if (attrVal instanceof Array) {
                            attrVal = "page-ruler-" + attrVal.join(" page-ruler-");
                        } else {
                            attrVal = "page-ruler-" + attrVal;
                        }
                    }
                    if (attr === "for") {
                        attrVal = "page-ruler-" + attrVal;
                    }
                    el.setAttribute(attr, attrVal);
                }
            }
            listeners = listeners || {};
            for (var type in listeners) {
                this.registerListener(el, type, listeners[type]);
            }
            if (!!text) {
                el.innerText = text;
            }
            this.elements.push(el);
            return el;
        },
        appendEl: function(parent, children) {
            if (!(children instanceof Array)) {
                children = [ children ];
            }
            for (var i = 0; i < children.length; i++) {
                parent.appendChild(children[i]);
            }
        },
        registerListener: function(el, type, func) {
            el.addEventListener(type, func, false);
            this.listeners.push({
                el: el,
                type: type,
                func: func
            });
        },
        removeListeners: function() {
            while (this.listeners.length > 0) {
                var listener = this.listeners.pop();
                listener.el.removeEventListener(listener.type, listener.func, false);
                listener = null;
            }
        },
        removeElements: function() {
            while (this.elements.length > 0) {
                var el = this.elements.pop();
                if (el instanceof HTMLElement) {
                    el.parentNode.removeChild(el);
                }
                el = null;
            }
            this.elements = [];
        },
        hasClass: function(el, cls) {
            return el.classList.contains(cls);
        },
        addClass: function(el, cls) {
            el.classList.add(cls);
        },
        removeClass: function(el, cls) {
            el.classList.remove(cls);
        },
        getLeft: function(el) {
            var boundingRect = el.getBoundingClientRect();
            var left = boundingRect.left || 0;
            var documentOffsetLeft = document.body.ownerDocument.defaultView.pageXOffset;
            var offsetLeft = pr.Dimensions.offsetLeft();
            return left + documentOffsetLeft - offsetLeft;
        },
        getTop: function(el) {
            var boundingRect = el.getBoundingClientRect();
            var top = boundingRect.top || 0;
            var documentOffsetTop = document.body.ownerDocument.defaultView.pageYOffset;
            var offsetTop = pr.Dimensions.offsetTop();
            return top + documentOffsetTop - offsetTop;
        },
        getWidth: function(el) {
            var boundingRect = el.getBoundingClientRect();
            return boundingRect.width || 0;
        },
        getHeight: function(el) {
            var boundingRect = el.getBoundingClientRect();
            return boundingRect.height || 0;
        },
        getDescription: function(el, asParts) {
            if (!el.tagName) {
                throw "tagName does not exist";
            }
            var parts = {
                tag: el.tagName.toLowerCase(),
                id: "",
                cls: ""
            };
            var desc = el.tagName.toLowerCase();
            parts.tag = desc;
            if (!!el.id) {
                desc += "#" + el.id;
                parts.id = "#" + el.id;
            }
            if (el.classList.length > 0) {
                desc += "." + Array.prototype.slice.call(el.classList).join(".");
                parts.cls = "." + Array.prototype.slice.call(el.classList).join(".");
            }
            return asParts && parts || desc;
        },
        getParentNode: function(el) {
            return el.parentNode;
        },
        isIllegal: function(el) {
            var illegalTags = [ "head", "script", "noscript" ];
            return el.nodeType !== 1 || illegalTags.indexOf(el.tagName.toLowerCase()) >= 0;
        },
        getChildNode: function(el) {
            var childNode = null;
            if (el.childNodes) {
                childNode = el.firstChild;
                while (childNode && this.isIllegal(childNode)) {
                    childNode = childNode.nextSibling;
                }
            }
            if (childNode && childNode.tagName.toLowerCase() === "head") {
                childNode = document.body;
            }
            return childNode;
        },
        getPreviousSibling: function(el) {
            var prevNode = el.previousElementSibling;
            while (prevNode && this.isIllegal(prevNode)) {
                prevNode = prevNode.previousElementSibling;
            }
            return prevNode;
        },
        getNextSibling: function(el) {
            var nextNode = el.nextElementSibling;
            while (nextNode && this.isIllegal(nextNode)) {
                nextNode = nextNode.nextElementSibling;
            }
            return nextNode;
        },
        inElement: function(el, parent) {
            var inParent = false;
            var parentNode = el.parentNode;
            while (parentNode) {
                if (parentNode === parent) {
                    inParent = true;
                    break;
                }
                parentNode = parentNode.parentNode;
            }
            return inParent;
        }
    };
})(__PageRuler);

(function(pr) {
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        switch (message.type) {
          case "enable":
            pr.enable();
            break;

          case "disable":
            pr.disable();
            break;
        }
        sendResponse({
            success: true
        });
    });
})(__PageRuler);

(function(pr) {
    pr.Mouse = {
        getXY: function(e, noOffset) {
            var x = e.pageX;
            var y = e.pageY;
            if (!noOffset) {
                var offsetX = pr.Dimensions.offsetLeft();
                x -= offsetX;
                var offsetY = pr.Dimensions.offsetTop();
                y -= offsetY;
            }
            return {
                x: x,
                y: y
            };
        },
        getX: function(e) {
            return this.getXY(e).x;
        },
        getY: function(e, noOffset) {
            return this.getXY(e, noOffset).y;
        },
        getClientXY: function(e, noOffset) {
            var x = e.clientX;
            var y = e.clientY;
            if (!noOffset) {
                y -= pr.elements.toolbar.height;
                if (pr.elements.toolbar.elementMode) {
                    y -= pr.elements.toolbar.elementToolbar.height;
                }
            }
            return {
                x: x,
                y: y
            };
        },
        getClientX: function(e) {
            return this.getClientXY(e).x;
        },
        getClientY: function(e, noOffset) {
            return this.getClientXY(e, noOffset).y;
        }
    };
})(__PageRuler);

(function(pr) {
    pr.Util = {
        px: function(num) {
            return num + "px";
        },
        locale: function(message, options) {
            var text = chrome.i18n.getMessage(message);
            switch (options) {
              case "lowercase":
                text = text.toLocaleLowerCase();
                break;

              case "uppercase":
                text = text.toLocaleUpperCase();
                break;
            }
            return text;
        },
        hexToRGB: function(hex, alpha) {
            alpha = alpha || 1;
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            var r = parseInt(result[1], 16);
            var g = parseInt(result[2], 16);
            var b = parseInt(result[3], 16);
            return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
        }
    };
})(__PageRuler);

(function(pr) {
    pr.el.BorderSearch = pr.cls(function(ruler, positionDir, leftOrRight, topOrBottom, cls) {
        var id = "bordersearch-" + positionDir + "-" + leftOrRight + "-" + topOrBottom;
        var attrs = {
            id: id,
            "class": [ cls, id ]
        };
        this.dom = pr.El.createEl("div", attrs);
        pr.El.registerListener(this.dom, "click", function(e) {
            e.stopPropagation();
            e.preventDefault();
            ruler.borderSearch(positionDir, leftOrRight, topOrBottom);
        });
    }, {
        dom: null,
        setColor: function(hex) {
            this.dom.style.setProperty("border-color", hex, "important");
        }
    });
})(__PageRuler);

(function(pr) {
    pr.el.Element = pr.cls(function(dom) {
        this.dom = dom;
        var config = {
            width: pr.El.getWidth(dom),
            height: pr.El.getHeight(dom),
            top: pr.El.getTop(dom),
            left: pr.El.getLeft(dom)
        };
        pr.elements.ruler.reset(config);
    }, {
        dom: null
    });
})(__PageRuler);

(function(pr) {
    pr.el.ElementToolbar = pr.cls(function(toolbar) {
        var _this = this;
        this.toolbar = toolbar;
        this.dom = pr.El.createEl("div", {
            id: "element-toolbar"
        }, {
            click: function(e) {
                e.stopPropagation();
            },
            mousedown: function(e) {
                e.stopPropagation();
            }
        });
        this.els.helpContainer = this.generateHelpContainer();
        this.els.elementContainer = this.generateElementContainer();
        this.els.navigationContainer = this.generateNavigationContainer();
        var trackingModeContainer = this.generateTrackingModeContainer();
        pr.El.appendEl(this.dom, [ this.els.helpContainer, this.els.elementContainer, this.els.navigationContainer, trackingModeContainer ]);
        pr.El.registerListener(document, "click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (_this.tracking && e.target.tagName.toLowerCase() !== "html") {
                _this.setTracking(false, true);
                chrome.runtime.sendMessage({
                    action: "trackEvent",
                    args: [ "Action", "Element Mode Click" ]
                });
            }
        });
    }, {
        dom: null,
        els: {
            helpContainer: null,
            elementContainer: null,
            element: null,
            upContainer: null,
            up: null,
            downContainer: null,
            down: null,
            previousContainer: null,
            previous: null,
            nextContainer: null,
            next: null,
            navigationContainer: null,
            trackingContainer: null,
            trackingInput: null
        },
        height: 30,
        toolbar: null,
        tracking: false,
        element: null,
        show: function() {
            this.dom.style.setProperty("display", "flex", "important");
            var height = this.height + this.toolbar.height;
            this.toolbar.dom.style.setProperty("height", pr.Util.px(height), "important");
            this.toolbar.shiftPage(height);
            this.setTracking(true, true);
            chrome.runtime.sendMessage({
                action: "trackEvent",
                args: [ "Action", "Element Toolbar", "Show" ]
            });
        },
        hide: function() {
            this.dom.style.removeProperty("display");
            this.toolbar.dom.style.removeProperty("height");
            this.toolbar.shiftPage(this.toolbar.height);
            this.setTracking(false, true);
            this.element = null;
            this.els.helpContainer.style.removeProperty("display");
            this.els.elementContainer.style.setProperty("display", "none", "important");
            this.els.navigationContainer.style.setProperty("display", "none", "important");
            chrome.runtime.sendMessage({
                action: "trackEvent",
                args: [ "Action", "Element Toolbar", "Hide" ]
            });
        },
        generateHelpContainer: function() {
            var container = pr.El.createEl("div", {
                id: "element-toolbar-help-container",
                cls: [ "help-container", "container" ]
            }, {}, pr.Util.locale("elementToolbarHelp"));
            return container;
        },
        generateTagContainer: function(id) {
            var container = pr.El.createEl("div", {
                id: "element-toolbar-" + id
            });
            var elementTag = pr.El.createEl("span", {
                id: "element-toolbar-" + id + "-tag",
                cls: "tag"
            });
            var elementId = pr.El.createEl("span", {
                id: "element-toolbar-" + id + "-id",
                cls: "id"
            });
            var elementCls = pr.El.createEl("span", {
                id: "element-toolbar-" + id + "-cls",
                cls: "cls"
            });
            pr.El.appendEl(container, [ elementTag, elementId, elementCls ]);
            return container;
        },
        generateElementContainer: function() {
            var _this = this;
            var container = pr.El.createEl("div", {
                id: "element-toolbar-element-container",
                cls: [ "container", "nav-container" ],
                style: "display:none !important;"
            }, {
                click: function(e) {
                    _this.setElement(_this.element.dom);
                    chrome.runtime.sendMessage({
                        action: "trackEvent",
                        args: [ "Action", "Element Click", "Element" ]
                    });
                }
            });
            this.els.element = this.generateTagContainer("element");
            pr.El.appendEl(container, [ this.els.element ]);
            return container;
        },
        generateNavigationContainer: function() {
            var _this = this;
            var container = pr.El.createEl("div", {
                id: "element-toolbar-navigate-container",
                cls: "container",
                style: "display:none !important;"
            });
            this.els.upContainer = pr.El.createEl("div", {
                id: "element-toolbar-navigate-up-container",
                cls: "nav-container"
            }, {
                click: function(e) {
                    _this.setElement(pr.El.getParentNode(_this.element.dom));
                    chrome.runtime.sendMessage({
                        action: "trackEvent",
                        args: [ "Action", "Element Click", "Parent" ]
                    });
                }
            });
            var upImg = pr.El.createEl("img", {
                id: "element-toolbar-navigate-up-img",
                src: chrome.extension.getURL("images/arrow-up.png")
            });
            this.els.up = this.generateTagContainer("up");
            pr.El.appendEl(this.els.upContainer, [ upImg, this.els.up ]);
            this.els.downContainer = pr.El.createEl("div", {
                id: "element-toolbar-navigate-down-container",
                cls: "nav-container"
            }, {
                click: function(e) {
                    _this.setElement(pr.El.getChildNode(_this.element.dom));
                    chrome.runtime.sendMessage({
                        action: "trackEvent",
                        args: [ "Action", "Element Click", "Child" ]
                    });
                }
            });
            var downImg = pr.El.createEl("img", {
                id: "element-toolbar-navigate-down-img",
                src: chrome.extension.getURL("images/arrow-down.png")
            });
            this.els.down = this.generateTagContainer("down");
            pr.El.appendEl(this.els.downContainer, [ downImg, this.els.down ]);
            this.els.previousContainer = pr.El.createEl("div", {
                id: "element-toolbar-navigate-previous-container",
                cls: "nav-container"
            }, {
                click: function(e) {
                    _this.setElement(pr.El.getPreviousSibling(_this.element.dom));
                    chrome.runtime.sendMessage({
                        action: "trackEvent",
                        args: [ "Action", "Element Click", "Previous" ]
                    });
                }
            });
            var previousImg = pr.El.createEl("img", {
                id: "element-toolbar-navigate-previous-img",
                src: chrome.extension.getURL("images/arrow-left.png")
            });
            this.els.previous = this.generateTagContainer("previous");
            pr.El.appendEl(this.els.previousContainer, [ previousImg, this.els.previous ]);
            this.els.nextContainer = pr.El.createEl("div", {
                id: "element-toolbar-navigate-next-container",
                cls: "nav-container"
            }, {
                click: function(e) {
                    _this.setElement(pr.El.getNextSibling(_this.element.dom));
                    chrome.runtime.sendMessage({
                        action: "trackEvent",
                        args: [ "Action", "Element Click", "Next" ]
                    });
                }
            });
            var nextImg = pr.El.createEl("img", {
                id: "element-toolbar-navigate-next-img",
                src: chrome.extension.getURL("images/arrow-right.png")
            });
            this.els.next = this.generateTagContainer("next");
            pr.El.appendEl(this.els.nextContainer, [ nextImg, this.els.next ]);
            pr.El.appendEl(container, [ this.els.upContainer, this.els.downContainer, this.els.previousContainer, this.els.nextContainer ]);
            return container;
        },
        generateTrackingModeContainer: function() {
            var _this = this;
            this.els.trackingContainer = pr.El.createEl("div", {
                id: "element-toolbar-tracking-mode-container",
                cls: "container"
            });
            var label = pr.El.createEl("label", {
                id: "element-toolbar-tracking-mode-label",
                "for": "element-toolbar-tracking-mode-input"
            }, {}, pr.Util.locale("elementToolbarTrackingMode"));
            var lang = (navigator.language || "").split("-")[0];
            if (!!lang) {
                lang = "lang_" + lang;
            }
            var toggle = pr.El.createEl("div", {
                id: "element-toolbar-tracking-mode-toggle",
                cls: "checkbox-toggle " + lang
            });
            var input = pr.El.createEl("input", {
                id: "element-toolbar-tracking-mode-input",
                type: "checkbox",
                checked: true
            }, {
                change: function(e) {
                    _this.setTracking(this.checked, false);
                    chrome.runtime.sendMessage({
                        action: "trackEvent",
                        args: [ "Action", "Tracking Mode Element", this.checked && "On" || "Off" ]
                    });
                }
            });
            this.els.trackingInput = input;
            var toggleLabel = pr.El.createEl("label", {
                id: "element-toolbar-tracking-mode-toggle-label",
                "for": "element-toolbar-tracking-mode-input"
            });
            var labelInner = pr.El.createEl("div", {
                id: "element-toolbar-tracking-mode-label-inner",
                "class": "inner"
            });
            var labelSwitch = pr.El.createEl("div", {
                id: "element-toolbar-tracking-mode-label-switch",
                "class": "switch " + lang
            });
            pr.El.appendEl(toggleLabel, [ labelInner, labelSwitch ]);
            pr.El.appendEl(toggle, [ input, toggleLabel ]);
            pr.El.appendEl(this.els.trackingContainer, [ label, toggle ]);
            return this.els.trackingContainer;
        },
        setTracking: function(tracking, toggleInput) {
            this.tracking = tracking;
            if (!!tracking) {
                this.toolbar.ruler.ruler.classList.add("tracking");
            } else {
                this.toolbar.ruler.ruler.classList.remove("tracking");
            }
            chrome.runtime.sendMessage({
                action: "trackEvent",
                args: [ "Action", "Tracking Mode", tracking && "On" || "Off" ]
            });
            if (!!toggleInput) {
                this.els.trackingInput.checked = tracking;
            }
        },
        setElementDescription: function(container, element, title) {
            try {
                var descParts = pr.El.getDescription(element, true);
                container.querySelector(".page-ruler-tag").innerText = descParts.tag;
                container.querySelector(".page-ruler-id").innerText = descParts.id;
                container.querySelector(".page-ruler-cls").innerText = descParts.cls;
                container.title = title + ": " + descParts.tag + descParts.id + descParts.cls;
            } catch (e) {}
        },
        setNavigation: function(direction, target) {
            var element, container, title;
            switch (direction) {
              case "up":
                container = this.els.upContainer;
                element = pr.El.getParentNode(target);
                title = pr.Util.locale("elementToolbarParentNode");
                break;

              case "down":
                container = this.els.downContainer;
                element = pr.El.getChildNode(target);
                title = pr.Util.locale("elementToolbarChildNode");
                break;

              case "previous":
                container = this.els.previousContainer;
                element = pr.El.getPreviousSibling(target);
                title = pr.Util.locale("elementToolbarPreviousSibling");
                break;

              case "next":
                container = this.els.nextContainer;
                element = pr.El.getNextSibling(target);
                title = pr.Util.locale("elementToolbarNextSibling");
                break;
            }
            if (!!element && element !== document.documentElement && !(element.id && element.id.match(/^page\-ruler/))) {
                container.style.removeProperty("display");
                this.setElementDescription(container, element, title);
            } else {
                container.style.setProperty("display", "none", "important");
            }
        },
        setElement: function(target) {
            if (this.element === null) {
                this.els.helpContainer.style.setProperty("display", "none", "important");
                this.els.elementContainer.style.removeProperty("display");
                this.els.navigationContainer.style.removeProperty("display");
            }
            this.element = new pr.el.Element(target);
            this.setElementDescription(this.els.element, this.element.dom, pr.Util.locale("elementToolbarHighlightedElement"));
            this.setNavigation("up", target);
            this.setNavigation("down", target);
            this.setNavigation("previous", target);
            this.setNavigation("next", target);
            pr.elements.guides.setSizes();
            pr.elements.ruler.show();
        }
    });
})(__PageRuler);

(function(pr) {
    pr.el.Guides = pr.cls(function() {
        var _this = this;
        var guides = [ "top-left", "top-right", "bottom-left", "bottom-right" ];
        this.dom = pr.El.createEl("div", {
            id: "guides"
        });
        this.dom.style.setProperty("width", pr.Util.px(pr.Dimensions.pageRight), "important");
        this.dom.style.setProperty("height", pr.Util.px(pr.Dimensions.pageBottom), "important");
        for (var i = 0, ilen = guides.length; i < ilen; i++) {
            var position = guides[i];
            var attrs = {
                id: "guide-" + position,
                "class": [ "guide", "guide-" + position ]
            };
            var key = position.replace(/\-\w/, function(char) {
                return char.toUpperCase().replace("-", "");
            });
            this[key] = pr.El.createEl("div", attrs);
            pr.El.appendEl(this.dom, this[key]);
        }
        pr.El.appendEl(document.body, this.dom);
        this.setVisible(this.visible);
        pr.Dimensions.addUpdateCallback(function(width, height) {
            _this.dom.style.setProperty("width", pr.Util.px(width), "important");
            _this.dom.style.setProperty("height", pr.Util.px(height), "important");
            _this.setSizes();
        });
    }, {
        dom: null,
        visible: true,
        topLeft: null,
        topRight: null,
        bottomLeft: null,
        bottomRight: null,
        each: function(callback) {
            callback.call(this, this.topLeft);
            callback.call(this, this.topRight);
            callback.call(this, this.bottomLeft);
            callback.call(this, this.bottomRight);
        },
        setColor: function(hex) {
            this.each(function(guide) {
                guide.style.setProperty("border-color", hex, "important");
            });
        },
        setSizes: function() {
            this.setVisible(this.visible, false);
            var ruler = pr.elements.ruler;
            var leftWidth = ruler.left + 1;
            var rightWidth = pr.Dimensions.pageRight - ruler.right + 1;
            if (rightWidth < 0) {
                rightWidth = 0;
            }
            var topHeight = ruler.top + 1;
            var bottomHeight = pr.Dimensions.pageBottom - ruler.bottom + 1;
            if (bottomHeight < 0) {
                bottomHeight = 0;
            }
            this.topLeft.style.setProperty("width", pr.Util.px(leftWidth), "important");
            this.topLeft.style.setProperty("height", pr.Util.px(topHeight), "important");
            this.topRight.style.setProperty("width", pr.Util.px(rightWidth), "important");
            this.topRight.style.setProperty("height", pr.Util.px(topHeight), "important");
            this.bottomLeft.style.setProperty("width", pr.Util.px(leftWidth), "important");
            this.bottomLeft.style.setProperty("height", pr.Util.px(bottomHeight), "important");
            this.bottomRight.style.setProperty("width", pr.Util.px(rightWidth), "important");
            this.bottomRight.style.setProperty("height", pr.Util.px(bottomHeight), "important");
        },
        hide: function() {
            this.dom.style.setProperty("display", "none", "important");
        },
        show: function() {
            this.dom.style.removeProperty("display");
        },
        setVisible: function(visible, save) {
            this.visible = !!visible;
            if (this.visible === true) {
                this.show();
            } else {
                this.hide();
            }
            if (!!save) {
                chrome.runtime.sendMessage({
                    action: "setGuides",
                    visible: this.visible
                });
            }
        }
    });
})(__PageRuler);

(function(pr) {
    pr.el.Mask = pr.cls(function() {
        var _this = this;
        this.dom = pr.El.createEl("div", {
            id: "mask"
        });
        this.dom.style.setProperty("width", pr.Util.px(pr.Dimensions.pageRight), "important");
        this.dom.style.setProperty("height", pr.Util.px(pr.Dimensions.pageBottom), "important");
        pr.El.appendEl(document.body, this.dom);
        pr.Dimensions.addUpdateCallback(function(width, height) {
            _this.dom.style.setProperty("width", pr.Util.px(width), "important");
            _this.dom.style.setProperty("height", pr.Util.px(height), "important");
        });
        pr.El.registerListener(this.dom, "mousedown", function() {
            document.activeElement.blur();
        });
    }, {
        dom: null
    });
})(__PageRuler);

(function(pr) {
    pr.el.Resize = pr.cls(function(ruler, id, cls) {
        var directions = {
            top: false,
            bottom: false,
            left: false,
            right: false
        };
        var positions = id.split("-");
        for (var i = 0, ilen = positions.length; i < ilen; i++) {
            directions[positions[i]] = true;
        }
        var attrs = {
            id: "resize-" + id,
            "class": [ cls, id ]
        };
        this.dom = pr.El.createEl("div", attrs);
        pr.El.registerListener(this.dom, "mousedown", function(e) {
            var mouseX = pr.Mouse.getX(e);
            var mouseY = pr.Mouse.getY(e);
            e.stopPropagation();
            e.preventDefault();
            ruler.resizingLeft = directions.left;
            ruler.resizingTop = directions.top;
            ruler.resizingBottom = directions.bottom;
            ruler.resizingRight = directions.right;
            if (directions.left) {
                ruler.resizingOffsetLeft = mouseX - ruler.left;
            }
            if (directions.top) {
                ruler.resizingOffsetTop = mouseY - ruler.top;
            }
            if (directions.bottom) {
                ruler.resizingOffsetBottom = ruler.bottom - mouseY;
            }
            if (directions.right) {
                ruler.resizingOffsetRight = ruler.right - mouseX;
            }
        });
        pr.El.registerListener(this.dom, "mouseup", function(e) {
            ruler.resizingLeft = false;
            ruler.resizingTop = false;
            ruler.resizingBottom = false;
            ruler.resizingRight = false;
            ruler.resizingOffsetLeft = 0;
            ruler.resizingOffsetTop = 0;
            ruler.resizingOffsetBottom = 0;
            ruler.resizingOffsetRight = 0;
        });
    }, {
        dom: null,
        setColor: function(hex) {
            this.dom.style.setProperty("border-color", hex, "important");
        }
    });
})(__PageRuler);

(function(pr) {
    pr.el.Ruler = pr.cls(function(toolbar, guides) {
        var _this = this;
        this.toolbar = toolbar;
        this.toolbar.ruler = this;
        this.guides = guides;
        this.createDom();
        this.reset();
        pr.El.registerListener(this.ruler, "mousedown", function(e) {
            e.stopPropagation();
            e.preventDefault();
            document.activeElement.blur();
            _this.movingLeft = true;
            _this.movingTop = true;
        });
        pr.El.registerListener(this.ruler, "mouseup", function(e) {
            _this.movingLeft = false;
            _this.gapLeft = null;
            _this.resizingLeft = false;
            _this.movingTop = false;
            _this.gapTop = null;
            _this.resizingTop = false;
            _this.resizingRight = false;
            _this.resizingBottom = false;
        });
        pr.El.registerListener(document, "mousedown", function(e) {
            if (!_this.toolbar.elementToolbar.tracking && e.target.tagName.toLowerCase() !== "html") {
                pr.elements.guides.hide();
                var mouseXY = pr.Mouse.getXY(e);
                var mouseX = mouseXY.x;
                var mouseY = mouseXY.y;
                e.preventDefault();
                e.stopPropagation();
                _this.reset({
                    left: mouseX,
                    top: mouseY,
                    width: 2,
                    height: 2
                });
                _this.resizingRight = true;
                _this.resizingBottom = true;
                _this.show();
            }
        });
        pr.El.registerListener(document, "mouseup", function(e) {
            _this.movingLeft = false;
            _this.movingTop = false;
            _this.movingRight = false;
            _this.movingDown = false;
            _this.resizingLeft = false;
            _this.resizingTop = false;
            _this.resizingRight = false;
            _this.resizingBottom = false;
        });
        pr.El.registerListener(document, "mousemove", function(e) {
            if (_this.toolbar.elementToolbar.tracking && !pr.El.inElement(e.target, _this.toolbar.dom)) {
                e.preventDefault();
                e.stopPropagation();
                var mouseXY = pr.Mouse.getClientXY(e, true);
                var mouseX = mouseXY.x;
                var mouseY = mouseXY.y;
                pr.elements.mask.dom.style.setProperty("display", "none", "important");
                _this.ruler.style.setProperty("display", "none", "important");
                if (_this.guides.visible) {
                    _this.guides.hide();
                }
                _this.toolbar.elementToolbar.setElement(document.elementFromPoint(mouseX, mouseY));
                pr.elements.mask.dom.style.removeProperty("display");
                _this.ruler.style.removeProperty("display");
                if (_this.guides.visible) {
                    _this.guides.show();
                }
            } else {
                _this.move(e);
                _this.resize(e);
            }
        });
    }, {
        toolbar: null,
        ruler: null,
        guides: null,
        resizeElements: {
            top: null,
            bottom: null,
            left: null,
            right: null,
            topLeft: null,
            topRight: null,
            bottomLeft: null,
            bottomRight: null
        },
        borderSearchElements: {
            udLeftTop: null,
            udRightTop: null,
            lrLeftTop: null,
            lrRightTop: null,
            lrLeftBottom: null,
            lrRightBottom: null,
            udLeftBottom: null,
            udRightBottom: null
        },
        width: 0,
        height: 0,
        left: 0,
        resizingLeft: false,
        resizingOffsetLeft: 0,
        top: 0,
        resizingTop: false,
        resizingOffsetTop: 0,
        right: 0,
        resizingRight: false,
        resizingOffsetRight: 0,
        bottom: 0,
        resizingBottom: false,
        resizingOffsetBottom: 0,
        movingLeft: false,
        movingTop: false,
        gapLeft: null,
        gapTop: null,
        keyMoving: true,
        createDom: function() {
            var _this = this;
            this.ruler = pr.El.createEl("div");
            var container = pr.El.createEl("div", {
                id: "container",
                "class": "container"
            });
            this.resizeElements.top = new pr.el.Resize(this, "top", "edge");
            this.resizeElements.bottom = new pr.el.Resize(this, "bottom", "edge");
            this.resizeElements.left = new pr.el.Resize(this, "left", "edge");
            this.resizeElements.right = new pr.el.Resize(this, "right", "edge");
            this.resizeElements.topLeft = new pr.el.Resize(this, "top-left", "corner");
            this.resizeElements.topRight = new pr.el.Resize(this, "top-right", "corner");
            this.resizeElements.bottomLeft = new pr.el.Resize(this, "bottom-left", "corner");
            this.resizeElements.bottomRight = new pr.el.Resize(this, "bottom-right", "corner");
            pr.El.appendEl(container, [ this.resizeElements.top.dom, this.resizeElements.bottom.dom, this.resizeElements.left.dom, this.resizeElements.right.dom, this.resizeElements.topLeft.dom, this.resizeElements.topRight.dom, this.resizeElements.bottomLeft.dom, this.resizeElements.bottomRight.dom ]);
            this.borderSearchElements.udLeftTop = new pr.el.BorderSearch(this, "ud", "left", "top", "corner page-ruler-bordersearch");
            this.borderSearchElements.udRightTop = new pr.el.BorderSearch(this, "ud", "right", "top", "corner page-ruler-bordersearch");
            this.borderSearchElements.lrLeftTop = new pr.el.BorderSearch(this, "lr", "left", "top", "corner page-ruler-bordersearch");
            this.borderSearchElements.lrRightTop = new pr.el.BorderSearch(this, "lr", "right", "top", "corner page-ruler-bordersearch");
            this.borderSearchElements.lrLeftBottom = new pr.el.BorderSearch(this, "lr", "left", "bottom", "corner page-ruler-bordersearch");
            this.borderSearchElements.lrRightBottom = new pr.el.BorderSearch(this, "lr", "right", "bottom", "corner page-ruler-bordersearch");
            this.borderSearchElements.udLeftBottom = new pr.el.BorderSearch(this, "ud", "left", "bottom", "corner page-ruler-bordersearch");
            this.borderSearchElements.udRightBottom = new pr.el.BorderSearch(this, "ud", "right", "bottom", "corner page-ruler-bordersearch");
            pr.El.appendEl(container, [ this.borderSearchElements.udLeftTop.dom, this.borderSearchElements.udRightTop.dom, this.borderSearchElements.lrLeftTop.dom, this.borderSearchElements.lrRightTop.dom, this.borderSearchElements.lrLeftBottom.dom, this.borderSearchElements.lrRightBottom.dom, this.borderSearchElements.udLeftBottom.dom, this.borderSearchElements.udRightBottom.dom ]);
            pr.El.appendEl(this.ruler, container);
            pr.El.appendEl(document.body, this.ruler);
            chrome.runtime.sendMessage({
                action: "getColor"
            }, function(color) {
                _this.setColor(color, false);
            });
        },
        show: function() {
            this.ruler.style.removeProperty("display");
        },
        hide: function() {
            this.ruler.style.setProperty("display", "none", "important");
        },
        borderSearch: function(positionDir, leftOrRight, topOrBottom) {
            var _this = this;
            var x = leftOrRight === "left" ? _this.left : _this.right;
            var y = topOrBottom === "top" ? _this.top : _this.bottom;
            var xDir = 0;
            var yDir = 0;
            if (positionDir === "lr") {
                xDir = leftOrRight === "left" ? -1 : 1;
            } else {
                yDir = topOrBottom === "top" ? -1 : 1;
            }
            pr.elements.mask.dom.style.setProperty("display", "none", "important");
            _this.ruler.style.setProperty("display", "none", "important");
            if (_this.guides.visible) {
                _this.guides.hide();
            }
            setTimeout(function() {
                chrome.runtime.sendMessage({
                    action: "borderSearch",
                    x: x,
                    y: y,
                    xDir: xDir,
                    yDir: yDir,
                    yOffset: _this.toolbar.height - window.pageYOffset,
                    devicePixelRatio: window.devicePixelRatio
                }, function(response) {
                    if (leftOrRight === "left") {
                        var newWidth = _this.width + (_this.left - response.x);
                        _this.setLeft(response.x);
                        _this.setWidth(newWidth);
                    } else {
                        _this.setWidth(_this.width + (response.x - _this.right));
                    }
                    if (topOrBottom === "top") {
                        var newHeight = _this.height + (_this.top - response.y);
                        _this.setTop(response.y);
                        _this.setHeight(newHeight);
                    } else {
                        _this.setHeight(_this.height + (response.y - _this.bottom));
                    }
                    pr.elements.mask.dom.style.removeProperty("display");
                    _this.ruler.style.removeProperty("display");
                    if (_this.guides.visible) {
                        _this.guides.show();
                    }
                });
            }, 1);
        },
        setColor: function(hex, save) {
            this.ruler.style.setProperty("border-color", hex, "important");
            this.ruler.style.setProperty("background-color", pr.Util.hexToRGB(hex, .2), "important");
            this.resizeElements.topLeft.setColor(hex);
            this.resizeElements.topRight.setColor(hex);
            this.resizeElements.bottomLeft.setColor(hex);
            this.resizeElements.bottomRight.setColor(hex);
            this.borderSearchElements.udLeftTop.setColor(hex);
            this.borderSearchElements.udRightTop.setColor(hex);
            this.borderSearchElements.lrLeftTop.setColor(hex);
            this.borderSearchElements.lrLeftBottom.setColor(hex);
            this.borderSearchElements.lrRightTop.setColor(hex);
            this.borderSearchElements.lrRightBottom.setColor(hex);
            this.borderSearchElements.udLeftBottom.setColor(hex);
            this.borderSearchElements.udRightBottom.setColor(hex);
            this.guides.setColor(hex);
            this.toolbar.setColor(hex);
            if (!!save) {
                chrome.runtime.sendMessage({
                    action: "setColor",
                    color: hex
                });
            }
        },
        reset: function(config) {
            config = config || {};
            this.width = config.width || 0;
            this.toolbar.setWidth(this.width);
            this.height = config.height || 0;
            this.toolbar.setHeight(this.height);
            this.left = config.left || 0;
            this.resizingLeft = false;
            this.resizingOffsetLeft = 0;
            this.toolbar.setLeft(this.left);
            this.top = config.top || 0;
            this.resizingTop = false;
            this.resizingOffsetTop = 0;
            this.toolbar.setTop(this.top);
            this.right = this.left + this.width;
            this.resizingRight = false;
            this.resizingOffsetRight = 0;
            this.toolbar.setRight(this.right);
            this.bottom = this.top + this.height;
            this.resizingBottom = false;
            this.resizingOffsetBottom = 0;
            this.toolbar.setBottom(this.bottom);
            this.movingLeft = false;
            this.movingTop = false;
            this.gapLeft = null;
            this.gapTop = null;
            this.ruler.style.width = pr.Util.px(this.width);
            this.ruler.style.height = pr.Util.px(this.height);
            this.ruler.style.top = pr.Util.px(this.top);
            this.ruler.style.left = pr.Util.px(this.left);
            this.hide();
        },
        setLeft: function(left, updateRight) {
            left = parseInt(left, 10);
            if (isNaN(left)) {
                left = this.left;
            } else if (left < 0) {
                left = 0;
            } else if (left > pr.Dimensions.pageRight - this.width) {
                left = pr.Dimensions.pageRight - this.width;
            } else if (left < pr.Dimensions.pageLeft) {
                left = pr.Dimensions.pageLeft;
            }
            this.left = left;
            this.ruler.style.setProperty("left", pr.Util.px(left), "");
            if (true === updateRight) {
                this.setRight(left + this.width);
            }
            this.toolbar.setLeft(left);
            this.guides.setSizes();
        },
        setTop: function(top, updateBottom) {
            top = parseInt(top, 10);
            if (isNaN(top)) {
                top = this.top;
            } else if (top < 0) {
                top = 0;
            } else if (top > pr.Dimensions.pageBottom + this.height) {
                top = pr.Dimensions.pageBottom - this.height;
            } else if (top < pr.Dimensions.pageTop) {
                top = pr.Dimensions.pageTop;
            }
            this.top = top;
            this.ruler.style.setProperty("top", pr.Util.px(top), "");
            if (true === updateBottom) {
                this.setBottom(top + this.height);
            }
            this.toolbar.setTop(top);
            this.guides.setSizes();
        },
        setRight: function(right, updateLeft) {
            right = parseInt(right, 10);
            if (isNaN(right)) {
                right = this.right;
            } else if (right < pr.Dimensions.pageLeft + this.width) {
                right = pr.Dimensions.pageLeft + this.width;
            } else if (right > pr.Dimensions.pageRight) {
                right = pr.Dimensions.pageRight;
            } else if (right > pr.Dimensions.pageRight) {
                right = pr.Dimensions.pageRight;
                this.setLeft(right - this.width, false);
            }
            this.right = right;
            if (true === updateLeft) {
                this.setLeft(right - this.width, false);
            }
            this.toolbar.setRight(right);
            this.guides.setSizes();
        },
        setBottom: function(bottom, updateTop) {
            bottom = parseInt(bottom, 10);
            if (isNaN(bottom)) {
                bottom = this.bottom;
            } else if (bottom < pr.Dimensions.pageTop + this.height) {
                bottom = pr.Dimensions.pageTop + this.height;
            } else if (bottom > pr.Dimensions.pageBottom) {
                bottom = pr.Dimensions.pageBottom;
                this.setTop(bottom - this.height);
            }
            this.bottom = bottom;
            if (true === updateTop) {
                this.setTop(bottom - this.height, false);
            }
            this.toolbar.setBottom(bottom);
            this.guides.setSizes();
        },
        setGapLeft: function(mouseX, onlyIfNull) {
            if (true !== onlyIfNull || this.gapLeft === null && true === onlyIfNull) {
                this.gapLeft = mouseX - this.left;
            }
        },
        setGapTop: function(mouseY, onlyIfNull) {
            if (true !== onlyIfNull || this.gapTop === null && true === onlyIfNull) {
                this.gapTop = mouseY - this.top;
            }
        },
        moveLeft: function(e) {
            if (this.movingLeft) {
                var mouseX = pr.Mouse.getX(e);
                this.setGapLeft(mouseX, true);
                if (mouseX - this.gapLeft < pr.Dimensions.pageLeft) {
                    mouseX = pr.Dimensions.pageLeft + this.gapLeft;
                } else if (mouseX - this.gapLeft + this.width > pr.Dimensions.pageRight) {
                    mouseX = pr.Dimensions.pageRight - this.width + this.gapLeft;
                }
                this.setLeft(mouseX - this.gapLeft, true);
            }
        },
        moveTop: function(e) {
            if (this.movingTop) {
                var mouseY = pr.Mouse.getY(e);
                this.setGapTop(mouseY, true);
                if (mouseY - this.gapTop < pr.Dimensions.pageTop) {
                    mouseY = pr.Dimensions.pageTop + this.gapTop;
                } else if (mouseY - this.gapTop + this.height > pr.Dimensions.pageBottom) {
                    mouseY = pr.Dimensions.pageBottom - this.height + this.gapTop;
                }
                this.setTop(mouseY - this.gapTop, true);
            }
        },
        move: function(e) {
            this.moveLeft(e);
            this.moveTop(e);
        },
        resizeLeft: function(e) {
            if (this.resizingLeft) {
                var mouseX = pr.Mouse.getX(e);
                if (mouseX <= this.right) {
                    if (mouseX < pr.Dimensions.pageLeft) {
                        mouseX = pr.Dimensions.pageLeft;
                    }
                    mouseX -= this.resizingOffsetLeft;
                    this.setLeft(mouseX);
                    this.setWidth(this.right - mouseX);
                } else {
                    this.resizingLeft = false;
                    this.resizingRight = true;
                    this.setLeft(this.right);
                }
            }
        },
        resizeRight: function(e) {
            if (this.resizingRight) {
                var mouseX = pr.Mouse.getX(e);
                if (mouseX >= this.left) {
                    if (mouseX > pr.Dimensions.pageRight) {
                        mouseX = pr.Dimensions.pageRight;
                    }
                    mouseX += this.resizingOffsetRight;
                    this.setRight(mouseX);
                    this.setWidth(mouseX - this.left);
                } else {
                    this.resizingLeft = true;
                    this.resizingRight = false;
                    this.setRight(this.left);
                }
            }
        },
        resizeTop: function(e) {
            if (this.resizingTop) {
                var mouseY = pr.Mouse.getY(e);
                if (mouseY <= this.bottom) {
                    if (mouseY < pr.Dimensions.pageTop) {
                        mouseY = pr.Dimensions.pageTop;
                    }
                    mouseY -= this.resizingOffsetTop;
                    this.setTop(mouseY);
                    this.setHeight(this.bottom - mouseY);
                } else {
                    this.resizingTop = false;
                    this.resizingBottom = true;
                    this.setTop(this.bottom);
                }
            }
        },
        resizeBottom: function(e) {
            if (this.resizingBottom) {
                var mouseY = pr.Mouse.getY(e);
                if (mouseY >= this.top) {
                    if (mouseY > pr.Dimensions.pageBottom) {
                        mouseY = pr.Dimensions.pageBottom;
                    }
                    mouseY += this.resizingOffsetBottom;
                    this.setBottom(mouseY);
                    this.setHeight(mouseY - this.top);
                } else {
                    this.resizingTop = true;
                    this.resizingBottom = false;
                    this.setBottom(this.top);
                }
            }
        },
        resize: function(e) {
            this.resizeLeft(e);
            this.resizeRight(e);
            this.resizeTop(e);
            this.resizeBottom(e);
        },
        setWidth: function(width) {
            width = parseInt(width, 10);
            if (isNaN(width)) {
                width = this.width;
            } else if (width < 0) {
                width = 0;
            } else if (width + this.left > pr.Dimensions.pageRight) {
                width = pr.Dimensions.pageRight - this.left;
            }
            this.width = width;
            this.ruler.style.setProperty("width", pr.Util.px(width), "");
            this.setRight(this.left + width);
            this.toolbar.setWidth(width);
            this.guides.setSizes();
        },
        setHeight: function(height) {
            height = parseInt(height, 10);
            if (isNaN(height)) {
                height = this.height;
            } else if (height < 0) {
                height = 0;
            } else if (height + this.top > pr.Dimensions.pageBottom) {
                height = pr.Dimensions.pageBottom - this.top;
            }
            this.height = height;
            this.ruler.style.setProperty("height", pr.Util.px(height), "");
            this.setBottom(this.top + height);
            this.toolbar.setHeight(height);
            this.guides.setSizes();
        },
        setBorderSearchVisibility: function(visible, save) {
            this.setElementVisibility(this.borderSearchElements.udLeftTop, visible);
            this.setElementVisibility(this.borderSearchElements.udRightTop, visible);
            this.setElementVisibility(this.borderSearchElements.lrLeftTop, visible);
            this.setElementVisibility(this.borderSearchElements.lrRightTop, visible);
            this.setElementVisibility(this.borderSearchElements.lrLeftBottom, visible);
            this.setElementVisibility(this.borderSearchElements.lrRightBottom, visible);
            this.setElementVisibility(this.borderSearchElements.udLeftBottom, visible);
            this.setElementVisibility(this.borderSearchElements.udRightBottom, visible);
            if (save) {
                chrome.runtime.sendMessage({
                    action: "setBorderSearch",
                    visible: visible
                });
            }
        },
        setElementVisibility: function(element, visible) {
            if (visible) {
                element.dom.style.removeProperty("display");
            } else {
                element.dom.style.setProperty("display", "none", "important");
            }
        }
    });
})(__PageRuler);

(function(pr) {
    pr.el.Toolbar = pr.cls(function() {
        var _this = this;
        this.dom = pr.El.createEl("div", {
            id: "toolbar",
            cls: this.position
        }, {
            click: function(e) {
                e.stopPropagation();
            },
            mousedown: function(e) {
                e.stopPropagation();
            }
        });
        var container = pr.El.createEl("div", {
            id: "toolbar-container",
            "class": "toolbar-container"
        });
        var closeContainer = this.generateCloseContainer();
        var dockContainer = this.generateDockContainer();
        var helpContainer = this.generateHelpContainer();
        var elementModeContainer = this.generateElementModeToggleContainer();
        var dimensionsContainer = this.generateDimensionsContainer();
        var positionContainer = this.generatePositionContainer();
        var colorContainer = this.generateColorContainer();
        var guidesContainer = this.generateGuidesContainer();
        var borderSearchContainer = this.generateBorderSearchContainer();
        pr.El.appendEl(container, [ closeContainer, dockContainer, helpContainer, elementModeContainer, dimensionsContainer, positionContainer, colorContainer, guidesContainer, borderSearchContainer ]);
        this.elementToolbar = new pr.el.ElementToolbar(this);
        pr.El.appendEl(this.dom, [ container, this.elementToolbar.dom ]);
        pr.El.appendEl(document.documentElement, this.dom);
        chrome.runtime.sendMessage({
            action: "getDockPosition"
        }, function(position) {
            _this.setDockPosition(position);
        });
        chrome.runtime.sendMessage({
            action: "getGuides"
        }, function(visible) {
            pr.elements.guides.setVisible(visible, false);
            pr.elements.guides.hide();
            if (!visible) {
                _this.els.guides.checked = false;
            }
        });
        chrome.runtime.sendMessage({
            action: "getBorderSearch"
        }, function(visible) {
            pr.elements.ruler.setBorderSearchVisibility(visible, false);
            if (!visible) {
                _this.els.borderSearch.checked = false;
            }
        });
    }, {
        position: "top",
        height: 30,
        ruler: null,
        dom: null,
        els: {},
        elementMode: false,
        elementToolbar: null,
        generatePixelInput: function(id, labelText, changeListener) {
            var container = pr.El.createEl("div", {
                id: "toolbar-" + id + "-container",
                cls: "px-container"
            });
            var label = pr.El.createEl("label", {
                id: "toolbar-" + id + "-label",
                "for": "toolbar-" + id
            }, {}, labelText + ":");
            this.els[id] = pr.El.createEl("input", {
                id: "toolbar-" + id,
                type: "number",
                min: 0,
                value: 0,
                title: labelText.toLocaleLowerCase()
            });
            pr.El.registerListener(this.els[id], "change", changeListener);
            pr.El.registerListener(this.els[id], "keydown", function(e) {
                if (e.shiftKey && (e.keyCode === 38 || e.keyCode === 40)) {
                    e.preventDefault();
                    if (e.keyCode === 38) {
                        this.value = parseInt(this.value, 10) + 10;
                    } else if (e.keyCode === 40) {
                        this.value = parseInt(this.value, 10) - 10;
                    }
                    changeListener.call(this, e);
                }
                if (e.keyCode === 13) {
                    changeListener.call(this, e);
                }
            });
            pr.El.registerListener(this.els[id], "focus", function(e) {
                pr.elements.ruler.keyMoving = false;
            });
            pr.El.registerListener(this.els[id], "blur", function(e) {
                pr.elements.ruler.keyMoving = true;
            });
            pr.El.appendEl(container, [ label, this.els[id] ]);
            return container;
        },
        shiftPage: function(height) {
            this.unshiftPage();
            height = height || this.height + (this.elementMode ? this.elementToolbar.height : 0);
            if (this.position === "top") {
                var cssTransform = "transform" in document.body.style ? "transform" : "-webkit-transform";
                document.body.style.setProperty(cssTransform, "translateY(" + pr.Util.px(height) + ")", "important");
            } else {
                document.body.style.setProperty("margin-bottom", pr.Util.px(height), "important");
            }
        },
        unshiftPage: function() {
            var cssTransform = "transform" in document.body.style ? "transform" : "-webkit-transform";
            document.body.style.removeProperty(cssTransform);
            document.body.style.removeProperty("margin-bottom");
        },
        generateElementModeToggleContainer: function() {
            var _this = this;
            var label = pr.El.createEl("span", {
                id: "toolbar-element-toggle-label",
                style: "display:none !important;"
            }, {}, pr.Util.locale("toolbarEnableElementMode"));
            var img = pr.El.createEl("img", {
                id: "toolbar-element-toggle-img",
                src: chrome.extension.getURL("images/element-mode-toggle.png")
            });
            var container = pr.El.createEl("div", {
                id: "toolbar-element-toggle",
                cls: [ "container", "element-toggle-container" ]
            }, {
                mouseover: function(e) {
                    label.style.removeProperty("display");
                },
                mouseout: function(e) {
                    if (_this.elementMode === false) {
                        label.style.setProperty("display", "none", "important");
                    }
                },
                click: function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (_this.elementMode === false) {
                        _this.showElementToolbar();
                    } else {
                        _this.hideElementToolbar();
                    }
                }
            });
            pr.El.appendEl(container, [ label, img ]);
            return container;
        },
        generateDimensionsContainer: function() {
            var _this = this;
            var container = pr.El.createEl("div", {
                id: "toolbar-dimensions",
                cls: "container"
            });
            var width = this.generatePixelInput("width", pr.Util.locale("toolbarWidth"), function(e) {
                _this.ruler.setWidth(this.value);
                chrome.runtime.sendMessage({
                    action: "trackEvent",
                    args: [ "Action", "Ruler Change", "Width" ]
                });
            });
            var height = this.generatePixelInput("height", pr.Util.locale("toolbarHeight"), function(e) {
                _this.ruler.setHeight(this.value);
                chrome.runtime.sendMessage({
                    action: "trackEvent",
                    args: [ "Action", "Ruler Change", "Height" ]
                });
            });
            pr.El.appendEl(container, [ width, height ]);
            return container;
        },
        generatePositionContainer: function() {
            var _this = this;
            var container = pr.El.createEl("div", {
                id: "toolbar-positions",
                cls: "container"
            });
            var left = this.generatePixelInput("left", pr.Util.locale("toolbarLeft"), function(e) {
                _this.ruler.setLeft(this.value, true);
                chrome.runtime.sendMessage({
                    action: "trackEvent",
                    args: [ "Action", "Ruler Change", "Left" ]
                });
            });
            var top = this.generatePixelInput("top", pr.Util.locale("toolbarTop"), function(e) {
                _this.ruler.setTop(this.value, true);
                chrome.runtime.sendMessage({
                    action: "trackEvent",
                    args: [ "Action", "Ruler Change", "Top" ]
                });
            });
            var right = this.generatePixelInput("right", pr.Util.locale("toolbarRight"), function(e) {
                _this.ruler.setRight(this.value, true);
                chrome.runtime.sendMessage({
                    action: "trackEvent",
                    args: [ "Action", "Ruler Change", "Right" ]
                });
            });
            var bottom = this.generatePixelInput("bottom", pr.Util.locale("toolbarBottom"), function(e) {
                _this.ruler.setBottom(this.value, true);
                chrome.runtime.sendMessage({
                    action: "trackEvent",
                    args: [ "Action", "Ruler Change", "Bottom" ]
                });
            });
            pr.El.appendEl(container, [ left, top, right, bottom ]);
            return container;
        },
        generateColorContainer: function() {
            var _this = this;
            var container = pr.El.createEl("div", {
                id: "toolbar-color-container",
                "class": "container"
            });
            var label = pr.El.createEl("label", {
                id: "toolbar-color-label",
                "for": "toolbar-color"
            }, {}, pr.Util.locale("toolbarColor") + ":");
            this.els.color = pr.El.createEl("input", {
                id: "toolbar-color",
                type: "color"
            });
            pr.El.registerListener(this.els.color, "change", function(e) {
                _this.ruler.setColor(e.target.value, true);
            });
            pr.El.appendEl(container, [ label, this.els.color ]);
            return container;
        },
        generateGuidesContainer: function() {
            var guidesContainer = pr.El.createEl("div", {
                id: "toolbar-guides-container",
                cls: "container"
            });
            var label = pr.El.createEl("label", {
                id: "toolbar-guides-label",
                "for": "toolbar-guides-input"
            }, {}, pr.Util.locale("toolbarGuides") + ":");
            var lang = (navigator.language || "").split("-")[0];
            if (!!lang) {
                lang = "lang_" + lang;
            }
            var toggle = pr.El.createEl("div", {
                id: "toolbar-guides-toggle",
                cls: "checkbox-toggle " + lang
            });
            var input = pr.El.createEl("input", {
                id: "toolbar-guides-input",
                type: "checkbox",
                checked: true
            }, {
                change: function(e) {
                    pr.elements.guides.setVisible(this.checked, true);
                }
            });
            this.els.guides = input;
            var toggleLabel = pr.El.createEl("label", {
                id: "toolbar-guides-toggle-label",
                "for": "toolbar-guides-input"
            });
            var labelInner = pr.El.createEl("div", {
                id: "toolbar-guides-label-inner",
                "class": "inner"
            });
            var labelSwitch = pr.El.createEl("div", {
                id: "toolbar-guides-label-switch",
                "class": "switch " + lang
            });
            pr.El.appendEl(toggleLabel, [ labelInner, labelSwitch ]);
            pr.El.appendEl(toggle, [ input, toggleLabel ]);
            pr.El.appendEl(guidesContainer, [ label, toggle ]);
            return guidesContainer;
        },
        generateBorderSearchContainer: function() {
            var borderSearchContainer = pr.El.createEl("div", {
                id: "toolbar-borderSearch-container",
                cls: "container"
            });
            var label = pr.El.createEl("label", {
                id: "toolbar-borderSearch-label",
                "for": "toolbar-borderSearch-input"
            }, {}, pr.Util.locale("toolbarBorderSearch") + ":");
            var lang = (navigator.language || "").split("-")[0];
            if (!!lang) {
                lang = "lang_" + lang;
            }
            var toggle = pr.El.createEl("div", {
                id: "toolbar-borderSearch-toggle",
                cls: "checkbox-toggle " + lang
            });
            var input = pr.El.createEl("input", {
                id: "toolbar-borderSearch-input",
                type: "checkbox",
                checked: true
            }, {
                change: function(e) {
                    console.log("saving setBorderSearchVisibility");
                    pr.elements.ruler.setBorderSearchVisibility(this.checked, true);
                }
            });
            this.els.borderSearch = input;
            var toggleLabel = pr.El.createEl("label", {
                id: "toolbar-borderSearch-toggle-label",
                "for": "toolbar-borderSearch-input"
            });
            var labelInner = pr.El.createEl("div", {
                id: "toolbar-borderSearch-label-inner",
                "class": "inner"
            });
            var labelSwitch = pr.El.createEl("div", {
                id: "toolbar-borderSearch-label-switch",
                "class": "switch " + lang
            });
            pr.El.appendEl(toggleLabel, [ labelInner, labelSwitch ]);
            pr.El.appendEl(toggle, [ input, toggleLabel ]);
            pr.El.appendEl(borderSearchContainer, [ label, toggle ]);
            return borderSearchContainer;
        },
        generateCloseContainer: function() {
            var _this = this;
            var container = pr.El.createEl("div", {
                id: "toolbar-close-container",
                "class": [ "container", "close-container" ]
            });
            var img = pr.El.createEl("img", {
                id: "toolbar-close",
                src: chrome.extension.getURL("images/close.png"),
                title: pr.Util.locale("toolbarClose", "lowercase")
            }, {
                click: function(e) {
                    chrome.runtime.sendMessage({
                        action: "disable"
                    });
                }
            });
            pr.El.appendEl(container, [ img ]);
            return container;
        },
        generateHelpContainer: function() {
            var container = pr.El.createEl("div", {
                id: "toolbar-help-container",
                "class": [ "container", "help-container" ]
            });
            this.els.help = pr.El.createEl("img", {
                id: "toolbar-help",
                src: chrome.extension.getURL("images/help-white.png"),
                title: pr.Util.locale("toolbarHelp", "lowercase")
            }, {
                click: function(e) {
                    chrome.runtime.sendMessage({
                        action: "openHelp"
                    });
                }
            });
            pr.El.appendEl(container, [ this.els.help ]);
            return container;
        },
        generateDockContainer: function() {
            var _this = this;
            var container = pr.El.createEl("div", {
                id: "toolbar-dock-container",
                "class": [ "container", "dock-container" ]
            });
            this.els.dock = pr.El.createEl("img", {
                id: "toolbar-dock",
                src: chrome.extension.getURL("images/dock-bottom.png"),
                title: pr.Util.locale("toolbarDockBottom", "lowercase")
            }, {
                click: function(e) {
                    _this.setDockPosition(_this.position === "top" ? "bottom" : "top", true);
                }
            });
            pr.El.appendEl(container, [ this.els.dock ]);
            return container;
        },
        setDockPosition: function(position, save) {
            if (position !== "top" && position !== "bottom") {
                return;
            }
            var oldPosition = position === "top" ? "bottom" : "top";
            pr.El.removeClass(this.dom, "page-ruler-" + oldPosition);
            this.position = position;
            pr.El.addClass(this.dom, "page-ruler-" + position);
            this.els.dock.setAttribute("src", chrome.extension.getURL("images/dock-" + oldPosition + ".png"));
            this.els.dock.setAttribute("title", pr.Util.locale("toolbarDock" + (oldPosition === "top" ? "Top" : "Bottom"), "lowercase"));
            this.shiftPage();
            if (!!save) {
                chrome.runtime.sendMessage({
                    action: "setDockPosition",
                    position: position
                });
            }
        },
        setColor: function(color) {
            this.els.color.value = color;
        },
        setWidth: function(width) {
            this.els.width.value = parseInt(width, 10);
        },
        setHeight: function(height) {
            this.els.height.value = parseInt(height, 10);
        },
        setTop: function(top) {
            this.els.top.value = parseInt(top, 10);
        },
        setBottom: function(bottom) {
            this.els.bottom.value = parseInt(bottom, 10);
        },
        setLeft: function(left) {
            this.els.left.value = parseInt(left, 10);
        },
        setRight: function(right) {
            this.els.right.value = parseInt(right, 10);
        },
        showElementToolbar: function() {
            this.elementMode = true;
            this.elementToolbar.show();
            document.getElementById("page-ruler-toolbar-element-toggle-label").innerText = pr.Util.locale("toolbarDisableElementMode");
        },
        hideElementToolbar: function() {
            this.elementMode = false;
            this.elementToolbar.hide();
            document.getElementById("page-ruler-toolbar-element-toggle-label").innerText = pr.Util.locale("toolbarEnableElementMode");
        }
    });
})(__PageRuler);