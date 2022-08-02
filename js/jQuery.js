var ErrorLogger = (function() {
	function ErrorLogger() {}
	ErrorLogger.init = function() {
		var _this = this;
		$.Deferred["exceptionHook"] = function(e) {
			if(e && !e.status) {
				if(e.stack !== _this.prevErrStack) _this.deferredErrorHandler(e);
				_this.prevErrStack = e.stack;
			}
		};
		$(document).ajaxError(function(event, respXhr, reqXhr, thrownError) {
			var dropboxFailedToLoad = reqXhr.url == 'https://www.dropbox.com/static/api/2/dropins.js' && respXhr.status == 404;
			if(respXhr.status !== 0 && !dropboxFailedToLoad) {
				var body = reqXhr.data ? reqXhr.data.substring ? reqXhr.data.substring(0, 1000) : reqXhr.data.name : "EMPTY";
				var message = "AJAX " + respXhr.status + " " + thrownError + "\nRequest URL: " + reqXhr.method + " " + reqXhr.url + "\n\nRequest body: " + body + "\n\nResponse: " + respXhr.responseText;
				window["logJsError"](message);
			}
		});
	};
	ErrorLogger.deferredErrorHandler = function(e) {
		var message = e.toString();
		message = e.message ? e.message : message;
		message += e.stack ? "\n" + e.stack : "";
		window["logJsError"](message);
	};
	ErrorLogger.debugLogAdd = function(entry) {
		window["debugLog"] = window["debugLog"] || [];
		var date = new Date();
		window["debugLog"].push(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "." + date.getMilliseconds() + " - " + entry + ":");
	};
	return ErrorLogger;
}());
var Eventable = (function() {
	function Eventable() {
		this.handlers = {};
	}
	Eventable.prototype.bind = function(event, handler, offPro) {
		var _this = this;
		if(offPro === void 0) {
			offPro = null;
		}
		$(this).on(event, handler);
		this.handlers[event] = this.handlers[event] ? this.handlers[event] + 1 : 1;
		if(offPro) offPro.always(function() {
			return $(_this).off(event, handler);
		});
	};
	Eventable.prototype.one = function(event, handler, offPro) {
		var _this = this;
		if(offPro === void 0) {
			offPro = null;
		}
		$(this).one(event, handler);
		this.handlers[event] = this.handlers[event] ? this.handlers[event] + 1 : 1;
		if(offPro) offPro.always(function() {
			return $(_this).off(event, handler);
		});
	};
	Eventable.prototype.unbind = function(event, handler) {
		$(this).off(event, handler);
		this.handlers[event] = this.handlers[event] ? this.handlers[event] - 1 : 0;
	};
	Eventable.prototype.hasHandlers = function(event) {
		return this.handlers[event] && this.handlers[event] > 0;
	};
	Eventable.prototype.trigger = function(eventType) {
		var _this = this;
		var args = [];
		for(var _i = 1; _i < arguments.length; _i++) {
			args[_i - 1] = arguments[_i];
		}
		eventType.split(" ").forEach(function(e) {
			return $(_this).triggerHandler(e, args);
		});
	};
	return Eventable;
}());
var __extends = (this && this.__extends) || (function() {
	var extendStatics = function(d, b) {
		extendStatics = Object.setPrototypeOf || ({
				__proto__: []
			}
			instanceof Array && function(d, b) {
				d.__proto__ = b;
			}) || function(d, b) {
			for(var p in b)
				if(Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
		};
		return extendStatics(d, b);
	};
	return function(d, b) {
		if(typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
		extendStatics(d, b);

		function __() {
			this.constructor = d;
		}
		d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
})();
var Dom = (function(_super) {
	__extends(Dom, _super);

	function Dom() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	Dom.prototype.getLogJsErrorPath = function() {
		return $("body").data("log-js-error-path");
	};
	return Dom;
}(Eventable));
var User = (function() {
	function User() {}
	User.init = function(dom) {
		var _this = this;
		this.dom = dom;
		setInterval(function() {
			return _this.refresh();
		}, 30000);
		this.dom.bodyDom.bind("multiFileViolation", function() {
			return _this.dom.showNagSignup(_this.dom.bodyDom.labelMultifileViolation);
		});
		this.dom.bodyDom.bind("userStatusChanged", function(e, userData) {
			return _this.dom.updateUser(userData);
		});
		this.dom.bodyDom.bind("panelHide", function(e) {
			return _this.dom.hideNags();
		});
		this.dom.bodyDom.bind("conversionDelay", function(e, delay, fileName) {
			return _this.dom.toggleWait(true, "", delay, fileName);
		});
		this.dataPro().done(function(a) {
			return dom.updateUser(a);
		});
	};
	User.dataPro = function(refresh) {
		if(refresh === void 0) {
			refresh = false;
		}
		if(refresh) this.refresh();
		return $.Deferred(function(def) {
			var authStatus = window["userData"];
			if(authStatus) {
				def.resolve(authStatus);
			} else {
				$("#user-data").on("load", function() {
					return def.resolve(window["userData"]);
				});
			}
		}).promise();
	};
	User.refresh = function() {
		var _this = this;
		$.getScript(this.dom.bodyDom.getAuthStatusPath() + "?v=" + this.statusReqVer++).done(function() {
			return _this.dom.trigger("userStatusChanged", window["userData"]);
		});
	};
	User.statusReqVer = Date.now();
	return User;
}());
String.prototype.getFileExtension = function() {
	return this.split(".").pop().toLowerCase();
};
String.prototype.isUrl = function() {
	return this.toLowerCase().indexOf("http") === 0;
};
String.prototype.isDataUrl = function() {
	return this.toLowerCase().indexOf("data:") === 0;
};
String.prototype.passwordStrength = function() {
	var score = 0;
	if(!this) return score;
	var letters = new Object();
	for(var i = 0; i < this.length; i++) {
		letters[this[i]] = (letters[this[i]] || 0) + 1;
		score += 5.0 / letters[this[i]];
	}
	var variations = {
		digits: /\d/.test(this),
		lower: /[a-z]/.test(this),
		upper: /[A-Z]/.test(this),
		nonWords: /\W/.test(this),
	};
	var variationCount = 0;
	for(var check in variations) {
		variationCount += (variations[check] == true) ? 1 : 0;
	}
	score += (variationCount - 1) * 10;
	score = Math.min(score, 100);
	return Math.round(score);
};
var Utils = (function() {
	function Utils() {}
	Utils.toggleSlideEl = function(el) {
		if(el.hasClass("hidden")) {
			el.hide().removeClass("hidden").slideDown();
		} else {
			el.slideUp("fast", function() {
				return el.addClass("hidden");
			});
		}
	};
	Utils.showSlideEl = function(el) {
		el.hide().removeClass("hidden").slideDown();
	};
	Utils.hideSlideEl = function(el) {
		el.slideUp("fast", function() {
			return el.addClass("hidden");
		});
	};
	Utils.toggleFadeEl = function(el) {
		if(el.hasClass("hidden")) {
			el.hide().removeClass("hidden").fadeIn();
		} else {
			el.fadeOut("fast", function() {
				return el.addClass("hidden");
			});
		}
	};
	return Utils;
}());
(function sortableModule(factory) {
	"use strict";
	if(typeof define === "function" && define.amd) {
		define(factory);
	} else if(typeof module != "undefined" && typeof module.exports != "undefined") {
		module.exports = factory();
	} else {
		window["Sortable"] = factory();
	}
})(function sortableFactory() {
	"use strict";
	if(typeof window === "undefined" || !window.document) {
		return function sortableError() {
			throw new Error("Sortable.js requires a window with a document");
		};
	}
	var dragEl, parentEl, ghostEl, cloneEl, rootEl, nextEl, lastDownEl, scrollEl, scrollParentEl, scrollCustomFn, lastEl, lastCSS, lastParentCSS, oldIndex, newIndex, activeGroup, putSortable, autoScroll = {},
		tapEvt, touchEvt, moved, forRepaintDummy, R_SPACE = /\s+/g,
		R_FLOAT = /left|right|inline/,
		expando = 'Sortable' + (new Date).getTime(),
		win = window,
		document = win.document,
		parseInt = win.parseInt,
		setTimeout = win.setTimeout,
		$ = win.jQuery || win.Zepto,
		Polymer = win.Polymer,
		captureMode = false,
		passiveMode = false,
		supportDraggable = ('draggable' in document.createElement('div')),
		supportCssPointerEvents = (function(el) {
			if(!!navigator.userAgent.match(/(?:Trident.*rv[ :]?11\.|msie)/i)) {
				return false;
			}
			el = document.createElement('x');
			el.style.cssText = 'pointer-events:auto';
			return el.style.pointerEvents === 'auto';
		})(),
		_silent = false,
		abs = Math.abs,
		min = Math.min,
		savedInputChecked = [],
		touchDragOverListeners = [],
		alwaysFalse = function() {
			return false;
		},
		_autoScroll = _throttle(function(evt, options, rootEl) {
			if(rootEl && options.scroll) {
				var _this = rootEl[expando],
					el, rect, sens = options.scrollSensitivity,
					speed = options.scrollSpeed,
					x = evt.clientX,
					y = evt.clientY,
					winWidth = window.innerWidth,
					winHeight = window.innerHeight,
					vx, vy, scrollOffsetX, scrollOffsetY;
				if(scrollParentEl !== rootEl) {
					scrollEl = options.scroll;
					scrollParentEl = rootEl;
					scrollCustomFn = options.scrollFn;
					if(scrollEl === true) {
						scrollEl = rootEl;
						do {
							if((scrollEl.offsetWidth < scrollEl.scrollWidth) || (scrollEl.offsetHeight < scrollEl.scrollHeight)) {
								break;
							}
						} while (scrollEl = scrollEl.parentNode);
					}
				}
				if(scrollEl) {
					el = scrollEl;
					rect = scrollEl.getBoundingClientRect();
					vx = (abs(rect.right - x) <= sens) - (abs(rect.left - x) <= sens);
					vy = (abs(rect.bottom - y) <= sens) - (abs(rect.top - y) <= sens);
				}
				if(!(vx || vy)) {
					vx = (winWidth - x <= sens) - (x <= sens);
					vy = (winHeight - y <= sens) - (y <= sens);
					(vx || vy) && (el = win);
				}
				if(autoScroll.vx !== vx || autoScroll.vy !== vy || autoScroll.el !== el) {
					autoScroll.el = el;
					autoScroll.vx = vx;
					autoScroll.vy = vy;
					clearInterval(autoScroll.pid);
					if(el) {
						autoScroll.pid = setInterval(function() {
							scrollOffsetY = vy ? vy * speed : 0;
							scrollOffsetX = vx ? vx * speed : 0;
							if('function' === typeof(scrollCustomFn)) {
								if(scrollCustomFn.call(_this, scrollOffsetX, scrollOffsetY, evt, touchEvt, el) !== 'continue') {
									return;
								}
							}
							if(el === win) {
								win.scrollTo(win.pageXOffset + scrollOffsetX, win.pageYOffset + scrollOffsetY);
							} else {
								el.scrollTop += scrollOffsetY;
								el.scrollLeft += scrollOffsetX;
							}
						}, 24);
					}
				}
			}
		}, 30),
		_prepareGroup = function(options) {
			function toFn(value, pull) {
				if(value == null || value === true) {
					value = group.name;
					if(value == null) {
						return alwaysFalse;
					}
				}
				if(typeof value === 'function') {
					return value;
				} else {
					return function(to, from) {
						var fromGroup = from.options.group.name;
						return pull ? value : value && (value.join ? value.indexOf(fromGroup) > -1 : (fromGroup == value));
					};
				}
			}
			var group = {};
			var originalGroup = options.group;
			if(!originalGroup || typeof originalGroup != 'object') {
				originalGroup = {
					name: originalGroup
				};
			}
			group.name = originalGroup.name;
			group.checkPull = toFn(originalGroup.pull, true);
			group.checkPut = toFn(originalGroup.put);
			group.revertClone = originalGroup.revertClone;
			options.group = group;
		};
	try {
		window.addEventListener('test', null, Object.defineProperty({}, 'passive', {
			get: function() {
				passiveMode = false;
				captureMode = {
					capture: false,
					passive: passiveMode
				};
			}
		}));
	} catch(err) {}

	function Sortable(el, options) {
		if(!(el && el.nodeType && el.nodeType === 1)) {
			throw 'Sortable: `el` must be HTMLElement, and not ' + {}.toString.call(el);
		}
		this.el = el;
		this.options = options = _extend({}, options);
		el[expando] = this;
		var defaults = {
			group: null,
			sort: true,
			disabled: false,
			store: null,
			handle: null,
			scroll: true,
			scrollSensitivity: 30,
			scrollSpeed: 10,
			draggable: /[uo]l/i.test(el.nodeName) ? 'li' : '>*',
			ghostClass: 'sortable-ghost',
			chosenClass: 'sortable-chosen',
			dragClass: 'sortable-drag',
			ignore: 'a, img',
			filter: null,
			preventOnFilter: true,
			animation: 0,
			setData: function(dataTransfer, dragEl) {
				dataTransfer.setData('Text', dragEl.textContent);
			},
			dropBubble: false,
			dragoverBubble: false,
			dataIdAttr: 'data-id',
			delay: 0,
			touchStartThreshold: parseInt(window.devicePixelRatio, 10) || 1,
			forceFallback: false,
			fallbackClass: 'sortable-fallback',
			fallbackOnBody: false,
			fallbackTolerance: 0,
			fallbackOffset: {
				x: 0,
				y: 0
			},
			supportPointer: Sortable.supportPointer !== false
		};
		for(var name in defaults) {
			!(name in options) && (options[name] = defaults[name]);
		}
		_prepareGroup(options);
		for(var fn in this) {
			if(fn.charAt(0) === '_' && typeof this[fn] === 'function') {
				this[fn] = this[fn].bind(this);
			}
		}
		this.nativeDraggable = options.forceFallback ? false : supportDraggable;
		_on(el, 'mousedown', this._onTapStart);
		_on(el, 'touchstart', this._onTapStart);
		options.supportPointer && _on(el, 'pointerdown', this._onTapStart);
		if(this.nativeDraggable) {
			_on(el, 'dragover', this);
			_on(el, 'dragenter', this);
		}
		touchDragOverListeners.push(this._onDragOver);
		options.store && this.sort(options.store.get(this));
	}
	Sortable.prototype = {
		constructor: Sortable,
		_onTapStart: function(evt) {
			var _this = this,
				el = this.el,
				options = this.options,
				preventOnFilter = options.preventOnFilter,
				type = evt.type,
				touch = evt.touches && evt.touches[0],
				target = (touch || evt).target,
				originalTarget = evt.target.shadowRoot && (evt.path && evt.path[0]) || target,
				filter = options.filter,
				startIndex;
			_saveInputCheckedState(el);
			if(dragEl) {
				return;
			}
			if(/mousedown|pointerdown/.test(type) && evt.button !== 0 || options.disabled) {
				return;
			}
			if(originalTarget.isContentEditable) {
				return;
			}
			target = _closest(target, options.draggable, el);
			if(!target) {
				return;
			}
			if(lastDownEl === target) {
				return;
			}
			startIndex = _index(target, options.draggable);
			if(typeof filter === 'function') {
				if(filter.call(this, evt, target, this)) {
					_dispatchEvent(_this, originalTarget, 'filter', target, el, el, startIndex);
					preventOnFilter && evt.preventDefault();
					return;
				}
			} else if(filter) {
				filter = filter.split(',').some(function(criteria) {
					criteria = _closest(originalTarget, criteria.trim(), el);
					if(criteria) {
						_dispatchEvent(_this, criteria, 'filter', target, el, el, startIndex);
						return true;
					}
				});
				if(filter) {
					preventOnFilter && evt.preventDefault();
					return;
				}
			}
			if(options.handle && !_closest(originalTarget, options.handle, el)) {
				return;
			}
			this._prepareDragStart(evt, touch, target, startIndex);
		},
		_prepareDragStart: function(evt, touch, target, startIndex) {
			var _this = this,
				el = _this.el,
				options = _this.options,
				ownerDocument = el.ownerDocument,
				dragStartFn;
			if(target && !dragEl && (target.parentNode === el)) {
				tapEvt = evt;
				rootEl = el;
				dragEl = target;
				parentEl = dragEl.parentNode;
				nextEl = dragEl.nextSibling;
				lastDownEl = target;
				activeGroup = options.group;
				oldIndex = startIndex;
				this._lastX = (touch || evt).clientX;
				this._lastY = (touch || evt).clientY;
				dragEl.style['will-change'] = 'all';
				dragStartFn = function() {
					_this._disableDelayedDrag();
					dragEl.draggable = _this.nativeDraggable;
					_toggleClass(dragEl, options.chosenClass, true);
					_this._triggerDragStart(evt, touch);
					_dispatchEvent(_this, rootEl, 'choose', dragEl, rootEl, rootEl, oldIndex);
				};
				options.ignore.split(',').forEach(function(criteria) {
					_find(dragEl, criteria.trim(), _disableDraggable);
				});
				_on(ownerDocument, 'mouseup', _this._onDrop);
				_on(ownerDocument, 'touchend', _this._onDrop);
				_on(ownerDocument, 'touchcancel', _this._onDrop);
				_on(ownerDocument, 'selectstart', _this);
				options.supportPointer && _on(ownerDocument, 'pointercancel', _this._onDrop);
				if(options.delay) {
					_on(ownerDocument, 'mouseup', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchend', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchcancel', _this._disableDelayedDrag);
					_on(ownerDocument, 'mousemove', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchmove', _this._delayedDragTouchMoveHandler);
					options.supportPointer && _on(ownerDocument, 'pointermove', _this._delayedDragTouchMoveHandler);
					_this._dragStartTimer = setTimeout(dragStartFn, options.delay);
				} else {
					dragStartFn();
				}
			}
		},
		_delayedDragTouchMoveHandler: function(e) {
			if(min(abs(e.clientX - this._lastX), abs(e.clientY - this._lastY)) >= this.options.touchStartThreshold) {
				this._disableDelayedDrag();
			}
		},
		_disableDelayedDrag: function() {
			var ownerDocument = this.el.ownerDocument;
			clearTimeout(this._dragStartTimer);
			_off(ownerDocument, 'mouseup', this._disableDelayedDrag);
			_off(ownerDocument, 'touchend', this._disableDelayedDrag);
			_off(ownerDocument, 'touchcancel', this._disableDelayedDrag);
			_off(ownerDocument, 'mousemove', this._disableDelayedDrag);
			_off(ownerDocument, 'touchmove', this._disableDelayedDrag);
			_off(ownerDocument, 'pointermove', this._disableDelayedDrag);
		},
		_triggerDragStart: function(evt, touch) {
			touch = touch || (evt.pointerType == 'touch' ? evt : null);
			if(touch) {
				tapEvt = {
					target: dragEl,
					clientX: touch.clientX,
					clientY: touch.clientY
				};
				this._onDragStart(tapEvt, 'touch');
			} else if(!this.nativeDraggable) {
				this._onDragStart(tapEvt, true);
			} else {
				_on(dragEl, 'dragend', this);
				_on(rootEl, 'dragstart', this._onDragStart);
			}
			try {
				if(document.selection) {
					_nextTick(function() {
						document.selection.empty();
					});
				} else {
					window.getSelection().removeAllRanges();
				}
			} catch(err) {}
		},
		_dragStarted: function() {
			if(rootEl && dragEl) {
				var options = this.options;
				_toggleClass(dragEl, options.ghostClass, true);
				_toggleClass(dragEl, options.dragClass, false);
				Sortable.active = this;
				_dispatchEvent(this, rootEl, 'start', dragEl, rootEl, rootEl, oldIndex);
			} else {
				this._nulling();
			}
		},
		_emulateDragOver: function() {
			if(touchEvt) {
				if(this._lastX === touchEvt.clientX && this._lastY === touchEvt.clientY) {
					return;
				}
				this._lastX = touchEvt.clientX;
				this._lastY = touchEvt.clientY;
				if(!supportCssPointerEvents) {
					_css(ghostEl, 'display', 'none');
				}
				var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
				var parent = target;
				var i = touchDragOverListeners.length;
				while(target && target.shadowRoot) {
					target = target.shadowRoot.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
					parent = target;
				}
				if(parent) {
					do {
						if(parent[expando]) {
							while(i--) {
								touchDragOverListeners[i]({
									clientX: touchEvt.clientX,
									clientY: touchEvt.clientY,
									target: target,
									rootEl: parent
								});
							}
							break;
						}
						target = parent;
					} while (parent = parent.parentNode);
				}
				if(!supportCssPointerEvents) {
					_css(ghostEl, 'display', '');
				}
			}
		},
		_onTouchMove: function(evt) {
			if(tapEvt) {
				var options = this.options,
					fallbackTolerance = options.fallbackTolerance,
					fallbackOffset = options.fallbackOffset,
					touch = evt.touches ? evt.touches[0] : evt,
					dx = (touch.clientX - tapEvt.clientX) + fallbackOffset.x,
					dy = (touch.clientY - tapEvt.clientY) + fallbackOffset.y,
					translate3d = evt.touches ? 'translate3d(' + dx + 'px,' + dy + 'px,0)' : 'translate(' + dx + 'px,' + dy + 'px)';
				if(!Sortable.active) {
					if(fallbackTolerance && min(abs(touch.clientX - this._lastX), abs(touch.clientY - this._lastY)) < fallbackTolerance) {
						return;
					}
					this._dragStarted();
				}
				this._appendGhost();
				moved = true;
				touchEvt = touch;
				_css(ghostEl, 'webkitTransform', translate3d);
				_css(ghostEl, 'mozTransform', translate3d);
				_css(ghostEl, 'msTransform', translate3d);
				_css(ghostEl, 'transform', translate3d);
				evt.preventDefault();
			}
		},
		_appendGhost: function() {
			if(!ghostEl) {
				var rect = dragEl.getBoundingClientRect(),
					css = _css(dragEl),
					options = this.options,
					ghostRect;
				ghostEl = dragEl.cloneNode(true);
				_toggleClass(ghostEl, options.ghostClass, false);
				_toggleClass(ghostEl, options.fallbackClass, true);
				_toggleClass(ghostEl, options.dragClass, true);
				_css(ghostEl, 'top', rect.top - parseInt(css.marginTop, 10));
				_css(ghostEl, 'left', rect.left - parseInt(css.marginLeft, 10));
				_css(ghostEl, 'width', rect.width);
				_css(ghostEl, 'height', rect.height);
				_css(ghostEl, 'opacity', '0.8');
				_css(ghostEl, 'position', 'fixed');
				_css(ghostEl, 'zIndex', '100000');
				_css(ghostEl, 'pointerEvents', 'none');
				options.fallbackOnBody && document.body.appendChild(ghostEl) || rootEl.appendChild(ghostEl);
				ghostRect = ghostEl.getBoundingClientRect();
				_css(ghostEl, 'width', rect.width * 2 - ghostRect.width);
				_css(ghostEl, 'height', rect.height * 2 - ghostRect.height);
			}
		},
		_onDragStart: function(evt, useFallback) {
			var _this = this;
			var dataTransfer = evt.dataTransfer;
			var options = _this.options;
			_this._offUpEvents();
			if(activeGroup.checkPull(_this, _this, dragEl, evt)) {
				cloneEl = _clone(dragEl);
				cloneEl.draggable = false;
				cloneEl.style['will-change'] = '';
				_css(cloneEl, 'display', 'none');
				_toggleClass(cloneEl, _this.options.chosenClass, false);
				_this._cloneId = _nextTick(function() {
					rootEl.insertBefore(cloneEl, dragEl);
					_dispatchEvent(_this, rootEl, 'clone', dragEl);
				});
			}
			_toggleClass(dragEl, options.dragClass, true);
			if(useFallback) {
				if(useFallback === 'touch') {
					_on(document, 'touchmove', _this._onTouchMove);
					_on(document, 'touchend', _this._onDrop);
					_on(document, 'touchcancel', _this._onDrop);
					if(options.supportPointer) {
						_on(document, 'pointermove', _this._onTouchMove);
						_on(document, 'pointerup', _this._onDrop);
					}
				} else {
					_on(document, 'mousemove', _this._onTouchMove);
					_on(document, 'mouseup', _this._onDrop);
				}
				_this._loopId = setInterval(_this._emulateDragOver, 50);
			} else {
				if(dataTransfer) {
					dataTransfer.effectAllowed = 'move';
					options.setData && options.setData.call(_this, dataTransfer, dragEl);
				}
				_on(document, 'drop', _this);
				_this._dragStartId = _nextTick(_this._dragStarted);
			}
		},
		_onDragOver: function(evt) {
			var el = this.el,
				target, dragRect, targetRect, revert, options = this.options,
				group = options.group,
				activeSortable = Sortable.active,
				isOwner = (activeGroup === group),
				isMovingBetweenSortable = false,
				canSort = options.sort;
			if(evt.preventDefault !== void 0) {
				evt.preventDefault();
				!options.dragoverBubble && evt.stopPropagation();
			}
			if(dragEl.animated) {
				return;
			}
			moved = true;
			if(activeSortable && !options.disabled && (isOwner ? canSort || (revert = !rootEl.contains(dragEl)) : (putSortable === this || ((activeSortable.lastPullMode = activeGroup.checkPull(this, activeSortable, dragEl, evt)) && group.checkPut(this, activeSortable, dragEl, evt)))) && (evt.rootEl === void 0 || evt.rootEl === this.el)) {
				_autoScroll(evt, options, this.el);
				if(_silent) {
					return;
				}
				target = _closest(evt.target, options.draggable, el);
				dragRect = dragEl.getBoundingClientRect();
				if(putSortable !== this) {
					putSortable = this;
					isMovingBetweenSortable = true;
				}
				if(revert) {
					_cloneHide(activeSortable, true);
					parentEl = rootEl;
					if(cloneEl || nextEl) {
						rootEl.insertBefore(dragEl, cloneEl || nextEl);
					} else if(!canSort) {
						rootEl.appendChild(dragEl);
					}
					return;
				}
				if((el.children.length === 0) || (el.children[0] === ghostEl) || (el === evt.target) && (_ghostIsLast(el, evt))) {
					if(el.children.length !== 0 && el.children[0] !== ghostEl && el === evt.target) {
						target = el.lastElementChild;
					}
					if(target) {
						if(target.animated) {
							return;
						}
						targetRect = target.getBoundingClientRect();
					}
					_cloneHide(activeSortable, isOwner);
					if(_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt) !== false) {
						if(!dragEl.contains(el)) {
							el.appendChild(dragEl);
							parentEl = el;
						}
						this._animate(dragRect, dragEl);
						target && this._animate(targetRect, target);
					}
				} else if(target && !target.animated && target !== dragEl && (target.parentNode[expando] !== void 0)) {
					if(lastEl !== target) {
						lastEl = target;
						lastCSS = _css(target);
						lastParentCSS = _css(target.parentNode);
					}
					targetRect = target.getBoundingClientRect();
					var width = targetRect.right - targetRect.left,
						height = targetRect.bottom - targetRect.top,
						floating = R_FLOAT.test(lastCSS.cssFloat + lastCSS.display) || (lastParentCSS.display == 'flex' && lastParentCSS['flex-direction'].indexOf('row') === 0),
						isWide = (target.offsetWidth > dragEl.offsetWidth),
						isLong = (target.offsetHeight > dragEl.offsetHeight),
						halfway = (floating ? (evt.clientX - targetRect.left) / width : (evt.clientY - targetRect.top) / height) > 0.5,
						nextSibling = target.nextElementSibling,
						after = false;
					if(floating) {
						var elTop = dragEl.offsetTop,
							tgTop = target.offsetTop;
						if(elTop === tgTop) {
							after = (target.previousElementSibling === dragEl) && !isWide || halfway && isWide;
						} else if(target.previousElementSibling === dragEl || dragEl.previousElementSibling === target) {
							after = (evt.clientY - targetRect.top) / height > 0.5;
						} else {
							after = tgTop > elTop;
						}
					} else if(!isMovingBetweenSortable) {
						after = (nextSibling !== dragEl) && !isLong || halfway && isLong;
					}
					var moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, after);
					if(moveVector !== false) {
						if(moveVector === 1 || moveVector === -1) {
							after = (moveVector === 1);
						}
						_silent = true;
						setTimeout(_unsilent, 30);
						_cloneHide(activeSortable, isOwner);
						if(!dragEl.contains(el)) {
							if(after && !nextSibling) {
								el.appendChild(dragEl);
							} else {
								target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
							}
						}
						parentEl = dragEl.parentNode;
						this._animate(dragRect, dragEl);
						this._animate(targetRect, target);
					}
				}
			}
		},
		_animate: function(prevRect, target) {
			var ms = this.options.animation;
			if(ms) {
				var currentRect = target.getBoundingClientRect();
				if(prevRect.nodeType === 1) {
					prevRect = prevRect.getBoundingClientRect();
				}
				_css(target, 'transition', 'none');
				_css(target, 'transform', 'translate3d(' + (prevRect.left - currentRect.left) + 'px,' + (prevRect.top - currentRect.top) + 'px,0)');
				forRepaintDummy = target.offsetWidth;
				_css(target, 'transition', 'all ' + ms + 'ms');
				_css(target, 'transform', 'translate3d(0,0,0)');
				clearTimeout(target.animated);
				target.animated = setTimeout(function() {
					_css(target, 'transition', '');
					_css(target, 'transform', '');
					target.animated = false;
				}, ms);
			}
		},
		_offUpEvents: function() {
			var ownerDocument = this.el.ownerDocument;
			_off(document, 'touchmove', this._onTouchMove);
			_off(document, 'pointermove', this._onTouchMove);
			_off(ownerDocument, 'mouseup', this._onDrop);
			_off(ownerDocument, 'touchend', this._onDrop);
			_off(ownerDocument, 'pointerup', this._onDrop);
			_off(ownerDocument, 'touchcancel', this._onDrop);
			_off(ownerDocument, 'pointercancel', this._onDrop);
			_off(ownerDocument, 'selectstart', this);
		},
		_onDrop: function(evt) {
			var el = this.el,
				options = this.options;
			clearInterval(this._loopId);
			clearInterval(autoScroll.pid);
			clearTimeout(this._dragStartTimer);
			_cancelNextTick(this._cloneId);
			_cancelNextTick(this._dragStartId);
			_off(document, 'mouseover', this);
			_off(document, 'mousemove', this._onTouchMove);
			if(this.nativeDraggable) {
				_off(document, 'drop', this);
				_off(el, 'dragstart', this._onDragStart);
			}
			this._offUpEvents();
			if(evt) {
				if(moved) {
					evt.preventDefault();
					!options.dropBubble && evt.stopPropagation();
				}
				ghostEl && ghostEl.parentNode && ghostEl.parentNode.removeChild(ghostEl);
				if(rootEl === parentEl || Sortable.active.lastPullMode !== 'clone') {
					cloneEl && cloneEl.parentNode && cloneEl.parentNode.removeChild(cloneEl);
				}
				if(dragEl) {
					if(this.nativeDraggable) {
						_off(dragEl, 'dragend', this);
					}
					_disableDraggable(dragEl);
					dragEl.style['will-change'] = '';
					_toggleClass(dragEl, this.options.ghostClass, false);
					_toggleClass(dragEl, this.options.chosenClass, false);
					_dispatchEvent(this, rootEl, 'unchoose', dragEl, parentEl, rootEl, oldIndex, null, evt);
					if(rootEl !== parentEl) {
						newIndex = _index(dragEl, options.draggable);
						if(newIndex >= 0) {
							_dispatchEvent(null, parentEl, 'add', dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
							_dispatchEvent(this, rootEl, 'remove', dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
							_dispatchEvent(null, parentEl, 'sort', dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
							_dispatchEvent(this, rootEl, 'sort', dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
						}
					} else {
						if(dragEl.nextSibling !== nextEl) {
							newIndex = _index(dragEl, options.draggable);
							if(newIndex >= 0) {
								_dispatchEvent(this, rootEl, 'update', dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
								_dispatchEvent(this, rootEl, 'sort', dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
							}
						}
					}
					if(Sortable.active) {
						if(newIndex == null || newIndex === -1) {
							newIndex = oldIndex;
						}
						_dispatchEvent(this, rootEl, 'end', dragEl, parentEl, rootEl, oldIndex, newIndex, evt);
						this.save();
					}
				}
			}
			this._nulling();
		},
		_nulling: function() {
			rootEl = dragEl = parentEl = ghostEl = nextEl = cloneEl = lastDownEl = scrollEl = scrollParentEl = tapEvt = touchEvt = moved = newIndex = lastEl = lastCSS = putSortable = activeGroup = Sortable.active = null;
			savedInputChecked.forEach(function(el) {
				el.checked = true;
			});
			savedInputChecked.length = 0;
		},
		handleEvent: function(evt) {
			switch(evt.type) {
				case 'drop':
				case 'dragend':
					this._onDrop(evt);
					break;
				case 'dragover':
				case 'dragenter':
					if(dragEl) {
						this._onDragOver(evt);
						_globalDragOver(evt);
					}
					break;
				case 'mouseover':
					this._onDrop(evt);
					break;
				case 'selectstart':
					evt.preventDefault();
					break;
			}
		},
		toArray: function() {
			var order = [],
				el, children = this.el.children,
				i = 0,
				n = children.length,
				options = this.options;
			for(; i < n; i++) {
				el = children[i];
				if(_closest(el, options.draggable, this.el)) {
					order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
				}
			}
			return order;
		},
		sort: function(order) {
			var items = {},
				rootEl = this.el;
			this.toArray().forEach(function(id, i) {
				var el = rootEl.children[i];
				if(_closest(el, this.options.draggable, rootEl)) {
					items[id] = el;
				}
			}, this);
			order.forEach(function(id) {
				if(items[id]) {
					rootEl.removeChild(items[id]);
					rootEl.appendChild(items[id]);
				}
			});
		},
		save: function() {
			var store = this.options.store;
			store && store.set(this);
		},
		closest: function(el, selector) {
			return _closest(el, selector || this.options.draggable, this.el);
		},
		option: function(name, value) {
			var options = this.options;
			if(value === void 0) {
				return options[name];
			} else {
				options[name] = value;
				if(name === 'group') {
					_prepareGroup(options);
				}
			}
		},
		destroy: function() {
			var el = this.el;
			el[expando] = null;
			_off(el, 'mousedown', this._onTapStart);
			_off(el, 'touchstart', this._onTapStart);
			_off(el, 'pointerdown', this._onTapStart);
			if(this.nativeDraggable) {
				_off(el, 'dragover', this);
				_off(el, 'dragenter', this);
			}
			Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function(el) {
				el.removeAttribute('draggable');
			});
			touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);
			this._onDrop();
			this.el = el = null;
		}
	};

	function _cloneHide(sortable, state) {
		if(sortable.lastPullMode !== 'clone') {
			state = true;
		}
		if(cloneEl && (cloneEl.state !== state)) {
			_css(cloneEl, 'display', state ? 'none' : '');
			if(!state) {
				if(cloneEl.state) {
					if(sortable.options.group.revertClone) {
						rootEl.insertBefore(cloneEl, nextEl);
						sortable._animate(dragEl, cloneEl);
					} else {
						rootEl.insertBefore(cloneEl, dragEl);
					}
				}
			}
			cloneEl.state = state;
		}
	}

	function _closest(el, selector, ctx) {
		if(el) {
			ctx = ctx || document;
			do {
				if((selector === '>*' && el.parentNode === ctx) || _matches(el, selector)) {
					return el;
				}
			} while (el = _getParentOrHost(el));
		}
		return null;
	}

	function _getParentOrHost(el) {
		var parent = el.host;
		return(parent && parent.nodeType) ? parent : el.parentNode;
	}

	function _globalDragOver(evt) {
		if(evt.dataTransfer) {
			evt.dataTransfer.dropEffect = 'move';
		}
		evt.preventDefault();
	}

	function _on(el, event, fn) {
		el.addEventListener(event, fn, captureMode);
	}

	function _off(el, event, fn) {
		el.removeEventListener(event, fn, captureMode);
	}

	function _toggleClass(el, name, state) {
		if(el) {
			if(el.classList) {
				el.classList[state ? 'add' : 'remove'](name);
			} else {
				var className = (' ' + el.className + ' ').replace(R_SPACE, ' ').replace(' ' + name + ' ', ' ');
				el.className = (className + (state ? ' ' + name : '')).replace(R_SPACE, ' ');
			}
		}
	}

	function _css(el, prop, val) {
		var style = el && el.style;
		if(style) {
			if(val === void 0) {
				if(document.defaultView && document.defaultView.getComputedStyle) {
					val = document.defaultView.getComputedStyle(el, '');
				} else if(el.currentStyle) {
					val = el.currentStyle;
				}
				return prop === void 0 ? val : val[prop];
			} else {
				if(!(prop in style)) {
					prop = '-webkit-' + prop;
				}
				style[prop] = val + (typeof val === 'string' ? '' : 'px');
			}
		}
	}

	function _find(ctx, tagName, iterator) {
		if(ctx) {
			var list = ctx.getElementsByTagName(tagName),
				i = 0,
				n = list.length;
			if(iterator) {
				for(; i < n; i++) {
					iterator(list[i], i);
				}
			}
			return list;
		}
		return [];
	}

	function _dispatchEvent(sortable, rootEl, name, targetEl, toEl, fromEl, startIndex, newIndex, originalEvt) {
		sortable = (sortable || rootEl[expando]);
		var evt = document.createEvent('Event'),
			options = sortable.options,
			onName = 'on' + name.charAt(0).toUpperCase() + name.substr(1);
		evt.initEvent(name, true, true);
		evt.to = toEl || rootEl;
		evt.from = fromEl || rootEl;
		evt.item = targetEl || rootEl;
		evt.clone = cloneEl;
		evt.oldIndex = startIndex;
		evt.newIndex = newIndex;
		evt.originalEvent = originalEvt;
		rootEl.dispatchEvent(evt);
		if(options[onName]) {
			options[onName].call(sortable, evt);
		}
	}

	function _onMove(fromEl, toEl, dragEl, dragRect, targetEl, targetRect, originalEvt, willInsertAfter) {
		var evt, sortable = fromEl[expando],
			onMoveFn = sortable.options.onMove,
			retVal;
		evt = document.createEvent('Event');
		evt.initEvent('move', true, true);
		evt.to = toEl;
		evt.from = fromEl;
		evt.dragged = dragEl;
		evt.draggedRect = dragRect;
		evt.related = targetEl || toEl;
		evt.relatedRect = targetRect || toEl.getBoundingClientRect();
		evt.willInsertAfter = willInsertAfter;
		evt.originalEvent = originalEvt;
		fromEl.dispatchEvent(evt);
		if(onMoveFn) {
			retVal = onMoveFn.call(sortable, evt, originalEvt);
		}
		return retVal;
	}

	function _disableDraggable(el) {
		el.draggable = false;
	}

	function _unsilent() {
		_silent = false;
	}

	function _ghostIsLast(el, evt) {
		var lastEl = el.lastElementChild,
			rect = lastEl.getBoundingClientRect();
		return(evt.clientY - (rect.top + rect.height) > 5) || (evt.clientX - (rect.left + rect.width) > 5);
	}

	function _generateId(el) {
		var str = el.tagName + el.className + el.src + el.href + el.textContent,
			i = str.length,
			sum = 0;
		while(i--) {
			sum += str.charCodeAt(i);
		}
		return sum.toString(36);
	}

	function _index(el, selector) {
		var index = 0;
		if(!el || !el.parentNode) {
			return -1;
		}
		while(el && (el = el.previousElementSibling)) {
			if((el.nodeName.toUpperCase() !== 'TEMPLATE') && (selector === '>*' || _matches(el, selector))) {
				index++;
			}
		}
		return index;
	}

	function _matches(el, selector) {
		if(el) {
			try {
				if(el.matches) {
					return el.matches(selector);
				} else if(el.msMatchesSelector) {
					return el.msMatchesSelector(selector);
				}
			} catch(_) {
				return false;
			}
		}
		return false;
	}

	function _throttle(callback, ms) {
		var args, _this;
		return function() {
			if(args === void 0) {
				args = arguments;
				_this = this;
				setTimeout(function() {
					if(args.length === 1) {
						callback.call(_this, args[0]);
					} else {
						callback.apply(_this, args);
					}
					args = void 0;
				}, ms);
			}
		};
	}

	function _extend(dst, src) {
		if(dst && src) {
			for(var key in src) {
				if(src.hasOwnProperty(key)) {
					dst[key] = src[key];
				}
			}
		}
		return dst;
	}

	function _clone(el) {
		if(Polymer && Polymer.dom) {
			return Polymer.dom(el).cloneNode(true);
		} else if($) {
			return $(el).clone(true)[0];
		} else {
			return el.cloneNode(true);
		}
	}

	function _saveInputCheckedState(root) {
		savedInputChecked.length = 0;
		var inputs = root.getElementsByTagName('input');
		var idx = inputs.length;
		while(idx--) {
			var el = inputs[idx];
			el.checked && savedInputChecked.push(el);
		}
	}

	function _nextTick(fn) {
		return setTimeout(fn, 0);
	}

	function _cancelNextTick(id) {
		return clearTimeout(id);
	}
	_on(document, 'touchmove', function(evt) {
		if(Sortable.active) {
			evt.preventDefault();
		}
	});
	Sortable.utils = {
		on: _on,
		off: _off,
		css: _css,
		find: _find,
		is: function(el, selector) {
			return !!_closest(el, selector, el);
		},
		extend: _extend,
		throttle: _throttle,
		closest: _closest,
		toggleClass: _toggleClass,
		clone: _clone,
		index: _index,
		nextTick: _nextTick,
		cancelNextTick: _cancelNextTick
	};
	Sortable.create = function(el, options) {
		return new Sortable(el, options);
	};
	Sortable.version = '1.7.0';
	return Sortable;
});
var BodyDom = (function(_super) {
	__extends(BodyDom, _super);

	function BodyDom() {
		var _this_1 = _super.call(this) || this;
		var _this = _this_1;
		_this_1.locale = $("html").attr("lang");
		_this_1.elBody = $("body");
		_this_1.elBody.find(".language-button").on("click", function() {
			return Utils.showAsDialog($(".language-dialog"));
		});
		_this_1.elBody.find(".SgU").on("click", function() {
			return DataLayerPush.orders.signUpClick();
		});
		_this_1.elToastTemplate = _this_1.elBody.find("#js-toast");
		_this_1.elServerSideToast = _this_1.elBody.find(".js-show-toast");
		_this_1.elDropZone = _this_1.elBody.find('.JSdR, .JSdR .StP');
		_this_1.elCloseToast = _this_1.elBody.find('.js-close-toast');
		_this_1.elHeader = _this_1.elBody.find('.layout-header');
		_this_1.labelMultifileViolation = _this_1.elBody.data('js-label-multifile-violation');
		_this_1.configureDropbox();
		_this_1.initUi();
		_this_1.bind("userStatusChanged", function(e, userData) {
			return _this_1.setAuth(userData);
		});
		User.dataPro().done(function(userData) {
			return _this_1.setAuth(userData);
		});
		$(".expandable .header").on("click", function(e) {
			return $(e.currentTarget).toggleClass("img-close").toggleClass("img-arrow-down-rose").siblings(".content").toggleClass("hidden");
		});
		_this_1.elCloseToast.on('click', function() {
			return _this_1.closeToast();
		});
		jQuery('.js-show-all-converters').click(function() {
			var button = jQuery(this);
			button.parent().find('.hidden').removeClass('hidden');
			button.addClass('hidden');
		});
		_this_1.elTopNavContainer = $('.TmC');
		$('.JStV').click(function() {
			$('.img-AtS.JStV').toggleClass('active');
			_this.elTopNavContainer.toggleClass('hidden');
		});
		$('body').on('click', function(event) {
			if(!$(event.target).hasClass('JStV') && $(event.target).parents('.TmC, .JStV').length === 0 && !_this.elTopNavContainer.hasClass('hidden')) {
				_this.closeTopNav(_this.elTopNavContainer);
			}
		});
		$('.JScMM, .UsM .MnI').click(function() {
			return _this_1.closeTopNav(_this.elTopNavContainer);
		});
		_this_1.elBody.on('click', ('.modal-overlay'), function(event) {
			if(!$(event.target).hasClass('modal-body') && $(event.target).parents('.modal-body').length === 0) {
				_this.closeModal();
			}
		});
		$(document).keyup(function(e) {
			if(e.key === "Escape") {
				$('.modal-overlay:not(.hidden)').addClass('hidden');
				if(!_this.elTopNavContainer.hasClass('hidden')) {
					_this.elTopNavContainer.addClass('hidden');
				}
			}
		});
		_this_1.elBody.on('click', '.js-toggle-password', function(e) {
			_this.togglePasswordView(e);
		});
		jQuery('.GrT').click(function() {
			$(this).parent().toggleClass('open');
		});
		_this_1.elZoomSlider = _this_1.elBody.find("#slider");
		_this_1.currentZoom = _this_1.elZoomSlider.val();
		_this_1.initializeZoomSlider();
		_this_1.initializeRangeSlider();
		window.addEventListener('resize', function() {
			_this_1.animateManagerContainer(jQuery('.sticky-panel:not(.hidden)').first(), true);
			_this_1.resizeWorkArea();
		});
		if(_this_1.elServerSideToast.length) _this_1.showToast(_this_1.elServerSideToast.data('message'), _this_1.elServerSideToast.data('type'), _this_1.elServerSideToast.data('duration'));
		$(document).scroll(function() {
			if(!_this.elBody.hasClass('work-in-progress')) _this.stickSidePanel($(document).scrollTop() > 0);
		});
		return _this_1;
	}
	BodyDom.prototype.removeHash = function() {
		history.replaceState("", document.title, window.location.pathname + window.location.search);
	};
	BodyDom.prototype.initializeZoomSlider = function() {
		var _this = this;
		this.elZoomSlider.on('input change', function(e, animateManager) {
			if(animateManager === void 0) {
				animateManager = true;
			}
			_this.currentZoom = this.value;
			_this.elWorkArea.removeClass('size-0').removeClass('size-1').removeClass('size-2').removeClass('size-3').addClass("size-" + _this.currentZoom);
			if(animateManager) setTimeout(function() {
				return _this.animateManagerContainer(jQuery('.sticky-panel.actions-container:not(.hidden)').first(), true);
			}, 200);
			_this.setSliderControlsState();
		});
		this.elZoomSlider.trigger('change', false);
		var minValue = parseInt(_this.elZoomSlider.attr('min'));
		var maxValue = parseInt(_this.elZoomSlider.attr('max'));
		jQuery('.zoom-in').click(function() {
			if(_this.currentZoom < maxValue) {
				_this.currentZoom++;
				_this.elZoomSlider.val(_this.currentZoom++).trigger('change', true);
			}
		});
		jQuery('.zoom-out').click(function() {
			if(_this.currentZoom > minValue) _this.currentZoom--;
			_this.elZoomSlider.val(_this.currentZoom--).trigger('change', true);
		});
	};
	BodyDom.prototype.setSliderControlsState = function() {
		var minValue = parseInt(this.elZoomSlider.attr('min'));
		var maxValue = parseInt(this.elZoomSlider.attr('max'));
		if(this.currentZoom < maxValue) this.elWorkArea.find('.zoom-in').removeClass('disabled');
		else this.elWorkArea.find('.zoom-in').addClass('disabled');
		if(this.currentZoom > minValue) this.elWorkArea.find('.zoom-out').removeClass('disabled');
		else this.elWorkArea.find('.zoom-out').addClass('disabled');
	};
	BodyDom.prototype.closeTopNav = function(menuContainer) {
		menuContainer.addClass('hidden');
		$('.JStV').removeClass('active');
	};
	BodyDom.prototype.togglePasswordView = function(e) {
		var icon = $(e.currentTarget);
		var passwordInput = icon.parent().find('input');
		icon.toggleClass('active');
		if(passwordInput.attr('type') === 'password') {
			passwordInput.attr('type', 'text');
		} else passwordInput.attr('type', 'password');
	};
	BodyDom.prototype.getBody = function() {
		return this.elBody;
	};
	BodyDom.prototype.getCaraInfo = function() {
		return {
			domain: this.caraDomainName,
			convertPath: this.caraConvertPath,
			apiKey: this.caraApiKey
		};
	};
	BodyDom.prototype.getCaraDomainName = function() {
		return this.caraDomainName;
	};
	BodyDom.prototype.getCaraConvertpath = function() {
		return this.caraConvertPath;
	};
	BodyDom.prototype.getSignInPath = function() {
		return this.signInPath;
	};
	BodyDom.prototype.getForgotPasswordPath = function() {
		return this.forgotPasswordPath;
	};
	BodyDom.prototype.getGoogleClientId = function() {
		return this.GoogleClientId;
	};
	BodyDom.prototype.getGoogleDeveloperKey = function() {
		return this.GoogleDeveloperKey;
	};
	BodyDom.prototype.getAuthStatusPath = function() {
		return this.authStatusPath;
	};
	BodyDom.prototype.getTokenCreatePath = function() {
		return this.tokenCreatePath;
	};
	BodyDom.prototype.getTokenConvertedPath = function() {
		return this.tokenConvertedPath;
	};
	BodyDom.prototype.getCaraApiKey = function() {
		return this.caraApiKey;
	};
	BodyDom.prototype.getDropboxAppKey = function() {
		return this.DropboxAppKey;
	};
	BodyDom.prototype.getPaddleVendorId = function() {
		return this.paddleVendorId;
	};
	BodyDom.prototype.getLocale = function() {
		return this.locale;
	};
	BodyDom.prototype.getLocalizationPrefix = function() {
		return this.locale == 'en' ? '' : "/" + this.locale.toLowerCase();
	};
	BodyDom.prototype.showError = function(fileName) {
		if(fileName === void 0) {
			fileName = "";
		}
		this.showToast(this.labelConversionError.replace("{{fileName}}", fileName), 'error', -1);
		this.elErrorContainer.removeClass("hidden");
		DataLayerPush.fileSelectFail(fileName);
	};
	BodyDom.prototype.getDefaultConverterMeta = function() {
		return this.defaultConverterMeta ? this.defaultConverterMeta.trim() : "";
	};
	BodyDom.prototype.setAuth = function(userData) {
		this.elBody.removeClass("auth-unknown authenticated unauthenticated").addClass(userData.authenticated ? "authenticated" : "unauthenticated");
		$(".user-initial").text(userData.initial);
		$(".user-name").text(userData.name);
	};
	BodyDom.prototype.isAuth = function() {
		return this.elBody.hasClass("authenticated");
	};
	BodyDom.prototype.configureDropbox = function() {
		this.getBody().append("<script id=\"dropboxjs\" data-app-key=\"" + this.getDropboxAppKey() + "\"></script>");
	};
	BodyDom.prototype.initUi = function() {
		$("[data-confirm]").on("submit", function(e) {
			return confirm($(e.currentTarget).data("confirm"));
		});
		$("[data-toggle]").on("click", function(e) {
			return Utils.toggleSlideEl($("#" + $(e.currentTarget).data("toggle")));
		});
		$.fn.elShow = function() {
			$(this).removeClass("hidden");
		};
		$.fn.elHide = function() {
			$(this).addClass("hidden");
		};
		this.initModal();
	};
	BodyDom.prototype.initModal = function() {
		var _this = this;
		if(this.isModal()) {
			jQuery("#" + Utils.getLocationParameter('modal')).removeClass('hidden').addClass('scale-in');
		}
		$("body").on('click', 'a', function(event) {
			if(this.hash !== "" && _this.isModal(this.hash)) {
				event.preventDefault();
				var hash = this.hash;
				history.pushState(null, null, hash);
				var element = jQuery("#" + Utils.getLocationParameter('modal', hash));
				jQuery('.modal-overlay:not(.hidden)').addClass('hidden');
				element.removeClass('hidden').addClass('scale-in');
				_this.closeTopNav(_this.elTopNavContainer);
			}
		});
		this.elBody.on('click', '.js-close-modal', function(el) {
			_this.closeModal();
		});
	};
	BodyDom.prototype.isModal = function(hash) {
		return Utils.getLocationParameter('modal', hash) && jQuery("#" + Utils.getLocationParameter('modal', hash)).hasClass('modal-overlay');
	};
	BodyDom.prototype.closeModal = function() {
		this.removeHash();
		jQuery('.modal-overlay').addClass('hidden').removeClass('scale-in');
	};
	BodyDom.prototype.openModal = function(modalId) {
		jQuery('.modal-overlay').addClass('hidden');
		jQuery('#' + modalId).removeClass('hidden').addClass('scale-in');
	};
	BodyDom.prototype.getRemoteFileInfoPath = function() {
		return this.remoteFileInfoPath;
	};
	BodyDom.prototype.getConversionInfoPath = function() {
		return this.conversionInfoPath;
	};
	BodyDom.prototype.getChainingInfoPath = function() {
		return this.chainingInfoPath;
	};
	BodyDom.prototype.getCanconvertInfoPath = function() {
		return this.canconvertInfoPath;
	};
	BodyDom.prototype.showToast = function(message, type, duration) {
		var _this_1 = this;
		if(type === void 0) {
			type = "error";
		}
		if(duration === void 0) {
			duration = 7000;
		}
		this.closeToast();
		var allowActions = duration != -1;
		var clone = this.elToastTemplate.contents().clone(allowActions);
		if(!allowActions) clone.find('.js-close-toast').addClass('hidden');
		else clone.find('.js-close-toast').click(function() {
			_this_1.closeToast();
		});
		clone.addClass(type);
		clone.find('.content').text(message);
		this.elHeader.after(clone);
		setTimeout(function() {
			clone.removeClass('closed');
		}, 100);
		if(duration > 0) setTimeout(function() {
			_this_1.closeToast();
		}, duration);
	};
	BodyDom.prototype.showSidePanel = function(elem) {
		jQuery('.side-panel.open').removeClass('open');
		elem.css('width', '').addClass('open');
		if(this.elBody.hasClass('work-in-progress') && window.innerWidth > 930) this.elWorkArea.css('width', 'calc(100% - 277px)');
	};
	BodyDom.prototype.resizeWorkArea = function() {
		if(this.elBody.hasClass('work-in-progress') && this.isSidePanelOpen(jQuery('#actions-container'))) {
			if(window.innerWidth > 930) this.elWorkArea.css('width', 'calc(100% - 277px)');
			else this.elWorkArea.css('width', '100%');
		}
	};
	BodyDom.prototype.stickSidePanel = function(stick) {
		var panel = jQuery('#get-premium.open, #nag-wait.open');
		if(stick) panel.css('top', 0);
		else {
			if(window.innerWidth > 930) panel.css('top', 84);
			else panel.css('top', 133);
		}
	};
	BodyDom.prototype.isSidePanelOpen = function(elem) {
		return elem.is('.open');
	};
	BodyDom.prototype.closeSidePanel = function(elem) {
		elem.css('width', 0);
		this.elWorkArea.css('width', '');
		setTimeout(function() {
			elem.removeClass('open');
		}, 500);
	};
	BodyDom.prototype.setConverterMetas = function(meta) {
		this.elBody.find(".JsM").text(meta.heading1);
		jQuery('html').removeClass('.l-pdf-converter').addClass('l-' + meta.cssClass);
		meta.showPageNumbers ? this.elWorkArea.removeClass('JsPL') : this.elWorkArea.addClass('JsPL');
		meta.showSelectRange ? this.elWorkArea.addClass('file-select-enabled') : this.elWorkArea.removeClass('file-select-enabled');
	};
	BodyDom.prototype.showFileActions = function(meta) {
		var elDeleteAction = jQuery('.control-item.remove');
		var elMoveAction = jQuery('.control-item.move');
		var elRotateAction = jQuery('.control-item.rotate');
		var elSplitAction = jQuery('.control-item.split');
		meta.showDeleteButton ? elDeleteAction.removeClass('hidden') : elDeleteAction.addClass('hidden');
		meta.showMoveButton ? elMoveAction.removeClass('hidden') : elMoveAction.addClass('hidden');
		meta.showRotateButton ? elRotateAction.removeClass('hidden') : elRotateAction.addClass('hidden');
		meta.showSplitButton ? elSplitAction.removeClass('hidden') : elSplitAction.addClass('hidden');
	};
	BodyDom.prototype.globalProgress = function(perc) {
		var elProg = $(".global-progress");
		elProg.css("opacity", "1");
		var uploadFinished = perc === 0;
		if(uploadFinished) {
			elProg.css("width", "100%");
			setTimeout(function() {
				elProg.css("opacity", "0");
				setTimeout(function() {
					elProg.css("width", "0");
				}, 1000);
			}, 1000);
		} else {
			elProg.css("width", perc + "%");
		}
		$(".hide-while-uploading").toggleClass("hidden", !uploadFinished);
		$(".show-while-uploading").toggleClass("hidden", uploadFinished);
		$(".upload-progress-perc").text(Math.ceil(perc) + '%');
	};
	BodyDom.prototype.isAction = function(action) {
		return this.elBody.hasClass(action);
	};
	BodyDom.prototype.animateManagerContainer = function(element, show) {
		var workArea = jQuery('.WrAC').parent();
		if(workArea.length > 0) {
			var offset = show ? window.innerHeight - workArea.height() - workArea.offset().top - 125 : 0;
			var innerHeight_1 = element.find(' > div').height() + 50;
			if(show && innerHeight_1 > offset) offset = innerHeight_1;
			if(element.find('.other-actions').is(':visible')) offset += 40;
			if(window.innerWidth > 1170 || (!element.hasClass('converter-panel-container') && window.innerWidth > 930)) {
				element.css("height", offset + 'px');
				element.css("top", 'unset');
			} else {
				element.css("height", 'auto');
			}
		}
	};
	BodyDom.prototype.closeToast = function() {
		jQuery('.toast-wrapper').each(function(i, toast) {
			$(toast).addClass('closed');
			setTimeout(function() {
				toast.remove();
			}, 500);
		});
	};
	BodyDom.prototype.enableGoogleDrive = function() {
		this.elGooglePickerBtn.removeClass("disabled");
	};
	BodyDom.prototype.enableDropbox = function() {
		this.elDropboxChooseBtn.removeClass("disabled");
	};
	BodyDom.prototype.initializeRangeSlider = function() {
		var setValue = function(range, rangeV) {
			var newValue = Number((range.value - range.min) * 100 / (range.max - range.min)),
				newPosition = 10 - (newValue * 0.2);
			rangeV.innerHTML = jQuery(rangeV).hasClass('percent') ? "<span>" + range.value + "%</span>" : "<span>" + range.value + "</span>";
			rangeV.style.left = "calc(" + newValue + "% + (" + newPosition + "px))";
		};
		var ranges = jQuery('.js-slider-tooltip');
		ranges.each(function(i, rangeWrapper) {
			var range = jQuery(rangeWrapper).find('input[type=range]')[0];
			var rangeValue = jQuery(rangeWrapper).find('.range-value')[0];
			setValue(range, rangeValue);
			range.addEventListener('input', function() {
				return setValue(range, rangeValue);
			});
		});
	};
	return BodyDom;
}(Dom));
var StartDom = (function(_super) {
	__extends(StartDom, _super);

	function StartDom(bodyDom) {
		var _this = _super.call(this) || this;
		_this.bodyDom = bodyDom;
		var elBody = _this.bodyDom.getBody();
		_this.elStartContainer = elBody.find(".StP");
		return _this;
	}
	StartDom.prototype.show = function() {
		this.elStartContainer.removeClass("hidden");
	};
	StartDom.prototype.hide = function() {
		this.bodyDom.getBody().addClass('work-in-progress');
		this.elStartContainer.addClass("hidden");
	};
	return StartDom;
}(Dom));
var Start = (function() {
	function Start() {}
	Start.show = function(dom, context, defConvMeta) {
		return $.Deferred(function(def) {
			context.bind("fileAdded", function() {
				return def.resolve(context);
			}, def.promise());
			dom.bodyDom.trigger("fileInputSetSrcFormats", Utils.getSrcFormats(defConvMeta));
			dom.bodyDom.trigger("fileInputSetMultiselect", true);
		}).then(function(context) {
			dom.hide();
			dom.bodyDom.trigger("panelHide startPanelHide");
			return context;
		}).promise();
	};
	return Start;
}());
var Converter = (function() {
	function Converter() {}
	Converter.init = function(bodyDom, authStatus) {
		var caraInfo = bodyDom.getCaraInfo();
		caraInfo.tokenProFn = Token.createFn(authStatus.token);
		var defConvMeta = this.getDefConvMeta(bodyDom);
		var startDom = new StartDom(bodyDom);
		var fileInputDom = new FileInputDom(bodyDom);
		FileInput.show(fileInputDom);
		var context = new Context(caraInfo, null, null);
		ContextEvents.bind(bodyDom, context, bodyDom.isAuth() || (defConvMeta && defConvMeta.editor.addFiles));
		var stateId = null;
		var statePanel = null;
		if(Utils.getLocationParameter('cid')) {
			stateId = Utils.getLocationParameter('cid');
			statePanel = Utils.getLocationParameter('statePanel');
			statePanel = statePanel ? statePanel : "result";
		}
		var flowPro;
		if(stateId) {
			startDom.hide();
			flowPro = Utils.retrieve(stateId, caraInfo.domain).then(function(state) {
				context.addStateFiles(state["files"]);
				context.convMeta = state["convMeta"];
				context.rules = context.convMeta.postRule;
				return context;
			}).fail(function() {
				return Utils.reloadPage(true);
			});
		} else {
			flowPro = Start.show(startDom, context, defConvMeta);
		}
		if(!stateId || statePanel === "chain") {
			flowPro = flowPro.then(function(c) {
				history.pushState(null, "Files selected");
				var convMetaPro = ConverterSelector.getConvMeta(new ConverterSelectorDom(bodyDom), c, defConvMeta);
				convMetaPro.fail(function() {
					return c.cancel("");
				});
				return $.when(c, convMetaPro);
			}).then(function(c, meta) {
				ErrorLogger.debugLogAdd("Converter: " + meta.name);
				bodyDom.setConverterMetas(meta);
				var newC = new Context(caraInfo, meta, meta.prepareRule);
				newC.prepAndAddFles(c.getFlesPros());
				c.cancel("Removing events", false);
				return newC;
			}).then(function(c) {
				if(c.convMeta.editor.visible) {
					ErrorLogger.debugLogAdd("Showing file manager");
					ContextEvents.bind(bodyDom, c, true);
					return Manager.show(new ManagerDom(bodyDom), c);
				}
				return c;
			}).then(function(c) {
				var newC = new Context(caraInfo, c.convMeta, c.convMeta.postRule);
				newC.userParams = c.userParams;
				if(c.groups.length > 0) {
					c.getGroupFlesPros().forEach(function(g) {
						return newC.prepAndAddFles([g]);
					});
				} else {
					newC.prepAndAddFles(c.getFlesPros());
				}
				c.cancel("Removing events", false);
				ContextEvents.bind(bodyDom, newC, bodyDom.isAuth());
				return newC;
			});
		}
		flowPro.then(function(c) {
			var resultDom = new ResultDom(bodyDom);
			Result.show(resultDom, c, stateId);
			ErrorLogger.debugLogAdd("Showing results");
			if(authStatus.stamp) {
				resultDom.bind("downloadBtnClick downloadThumbClick", function() {});
			}
		}).fail(function(fileName) {
			if(stateId) {
				window.location.replace('#');
			} else {
				bodyDom.showError(fileName);
			}
		});
	};
	Converter.getDefConvMeta = function(bodyDom) {
		var defConvMetaStr = bodyDom.getDefaultConverterMeta();
		return defConvMetaStr ? JSON.parse(defConvMetaStr) : null;
	};
	return Converter;
}());
var Orders = (function() {
	function Orders() {}
	Orders.orderClick = function(product) {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Order",
			"action": "Order click",
			"label": product
		});
	};
	Orders.signUpClick = function() {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Order",
			"action": "SignUp click"
		});
	};
	Orders.checkoutEvent = function(event, product) {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Checkout",
			"action": event,
			"label": product
		});
	};
	Orders.category = "Orders";
	return Orders;
}());
var DataLayerPush = (function() {
	function DataLayerPush() {}
	DataLayerPush.send = function(any) {
		if(window["dataLayer"] && window["google_tag_manager"]) {
			dataLayer.push.apply(null, arguments);
		}
	};
	DataLayerPush.fileSelectLocal = function(type) {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Conversion",
			"action": "Conversion.Select.Local",
			"label": type
		});
	};
	DataLayerPush.fileSelectRemote = function(type) {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Conversion",
			"action": "Conversion.Select.Remote",
			"label": type
		});
	};
	DataLayerPush.fileSelectFail = function(fileName) {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Conversion",
			"action": "Conversion.Select.Fail",
			"label": fileName
		});
	};
	DataLayerPush.fileUploadStart = function(type) {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Conversion",
			"action": "Conversion.Upload.Start",
			"label": type
		});
	};
	DataLayerPush.fileUploadSuccess = function(type) {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Conversion",
			"action": "Conversion.Upload.Success",
			"label": type
		});
	};
	DataLayerPush.fileUploadFail = function(type) {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Conversion",
			"action": "Conversion.Upload.Fail",
			"label": type
		});
	};
	DataLayerPush.conversionStart = function(srcFormat, dstFormat) {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Conversion",
			"action": "Conversion.Convert.Start",
			"label": srcFormat + " -> " + dstFormat
		});
	};
	DataLayerPush.conversionSuccess = function() {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Conversion",
			"action": "Conversion.Convert.Success"
		});
	};
	DataLayerPush.conversionFail = function(srcFormat, dstFormat) {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Conversion",
			"action": "Conversion.Convert.Fail",
			"label": srcFormat + " -> " + dstFormat
		});
	};
	DataLayerPush.conversionFixPdf = function(srcFormat, dstFormat) {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Conversion",
			"action": "Conversion.Convert.Fixing.PDF",
			"label": srcFormat + " -> " + dstFormat
		});
	};
	DataLayerPush.conversionFixOo = function(srcFormat, dstFormat) {
		DataLayerPush.send({
			"event": "SendEvent",
			"category": "Conversion",
			"action": "Conversion.Convert.Fixing.OO",
			"label": srcFormat + " -> " + dstFormat
		});
	};
	DataLayerPush.orders = Orders;
	return DataLayerPush;
}());
var ConvertCounter = new function() {
	var originCount = 90000000;
	var ratePerDay = (2000000 / 30);
	this.init = function() {
		this.originDate = new Date(2013, 8, 30, 0, 0, 0, 0);
		this.calculateCount();
		this.loop();
	};
	this.loop = function() {
		var rand = Math.round(Math.random() * 3500) + 500;
		this.interval = setTimeout($.proxy(function() {
			this.calculateCount();
			this.loop();
		}, this), rand);
	};
	this.calculateCount = function() {
		this.now = new Date();
		this.elapsedDays = (this.now.getTime() - this.originDate.getTime()) / 1000 / 60 / 60 / 24;
		this.growthRate = Math.pow(1.1, this.elapsedDays / 30);
		this.count = originCount + Math.round(this.elapsedDays * ratePerDay * this.growthRate);
		this.set(this.count);
	};
	this.set = function(number) {
		var elCounter = $("#convert-counter");
		var template = elCounter.data("template");
		if(elCounter.length && template) {
			elCounter.html(template.replace("{0}", "<span class=\"count BrT\">" + number.toString().substr(0, 12) + "</span>"));
		}
	};
	this.stop = function() {
		clearInterval(this.interval);
	};
	this.insertNumberGroupSeparator = function(number) {
		number = number.toString().split("").reverse().join("");
		var chunks = [],
			i = 0,
			count = number.length;
		while(i < count) {
			chunks.push(number.slice(i, i += 3));
		}
		var numberGroupSeparator = $("body").data("number-group-separator");
		if(numberGroupSeparator === "&#160;") numberGroupSeparator = " ";
		number = chunks.join(numberGroupSeparator);
		number = number.toString().split("").reverse().join("");
		return number;
	};
};
var Navigation = (function() {
	function Navigation() {}
	Navigation.init = function() {
		window.onpopstate = function(e) {
			if(e.state && e.state.targetId) {
				var target = $("#cid=" + e.state.targetId);
				if(target.length > 0 && target.data("history-back")) {
					target.data("history-back")();
					return;
				}
			} else if(Utils.getLocationParameter('cid')) {
				Utils.reloadPage();
			}
		};
	};
	return Navigation;
}());
var Init = (function() {
	function Init() {}
	Init.domReady = function() {
		var bodyDom = new BodyDom();
		User.init(new UserDom(bodyDom));
		ConvertCounter.init();
		StarRatings.init(new StarRatingsDom(bodyDom));
		if(bodyDom.isAction("converter")) {
			User.dataPro().done(function(authStatus) {
				return Converter.init(bodyDom, authStatus);
			});
			var dragAndDropDom = new DragAndDropDom(bodyDom);
			GooglePicker.registerEvents(bodyDom, bodyDom.getGoogleDeveloperKey(), bodyDom.getGoogleClientId(), bodyDom.getLocale());
			DropboxIntegration.registerEvents(bodyDom);
			setTimeout(function() {
				if(!bodyDom.isAction('display-result')) {
					Google.loadModule("auth").done(function() {
						return bodyDom.enableGoogleDrive();
					});
					DropboxIntegration.loadLib().done(function() {
						return bodyDom.enableDropbox();
					});
				}
			}, 1500);
		} else if(bodyDom.isAction("membership") || bodyDom.isAction("ordercompleted")) {
			Prices.show(new PricesDom(bodyDom), bodyDom.getPaddleVendorId());
		} else if(bodyDom.isAction("offers")) {
			Prices.setPriceWithDiscount(new PricesDom(bodyDom));
		}
	};
	return Init;
}());
var App = (function() {
	function App() {}
	App.run = function() {
		if(typeof jQuery === "undefined") {
			document.getElementById("jquery").addEventListener("load", this.jQueryReady);
		} else {
			this.jQueryReady();
		}
	};
	App.jQueryReady = function() {
		$.ajaxSetup({
			cache: true
		});
		ErrorLogger.init();
		Navigation.init();
		$(document).ready(function() {
			return Init.domReady();
		});
	};
	return App;
}());
App.run();
