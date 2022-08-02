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
var UserDom = (function(_super) {
	__extends(UserDom, _super);

	function UserDom(bodyDom) {
		var _this = _super.call(this) || this;
		_this.bodyDom = bodyDom;
		var elBody = _this.bodyDom.getBody();
		_this.elNagSignup = elBody.find(".nag-signup");
		_this.elNagWait = elBody.find(".nag-wait");
		_this.elSignInForm = elBody.find("#signin-form");
		_this.elForgotPasswordForm = elBody.find("#forgotten-password-form");
		_this.elGetPremiumPanel = elBody.find('#get-premium');
		_this.elWaitPanel = elBody.find('#nag-wait');
		_this.elSignInForm.on('submit', function(e) {
			return _this.signIn(e);
		});
		_this.elForgotPasswordForm.on('submit', function(e) {
			return _this.forgotPassword(e);
		});
		return _this;
	}
	UserDom.prototype.updateUser = function(userData) {
		if(userData.authenticated && !userData.active) this.showNagSignup(this.bodyDom.labelSuspended);
	};
	UserDom.prototype.signIn = function(e) {
		e.preventDefault();
		var validationError = this.elSignInForm.find('.validation-error');
		validationError.addClass('hidden');
		jQuery.ajax({
			type: "POST",
			url: this.bodyDom.getSignInPath(),
			data: this.elSignInForm.serializeArray(),
			success: function(data, textStatus, jqXHR) {
				if(data.success) window.location.href = data.returnUrl;
				else validationError.removeClass('hidden').text(data.message);
			}
		});
	};
	UserDom.prototype.forgotPassword = function(e) {
		e.preventDefault();
		var validationError = this.elForgotPasswordForm.find('.validation-error');
		var globalFns = this;
		validationError.addClass('hidden');
		jQuery.ajax({
			type: "POST",
			url: this.bodyDom.getForgotPasswordPath(),
			data: this.elForgotPasswordForm.serializeArray(),
			success: function(data, textStatus, jqXHR) {
				if(data.success) {
					globalFns.elForgotPasswordForm.trigger("reset");
					globalFns.bodyDom.showToast(data.message, "success");
					jQuery('#forgotpassword').find('.js-close-modal').click();
				} else validationError.removeClass('hidden').text(data.message);
			}
		});
	};
	UserDom.prototype.showNagSignup = function(msg) {
		if(this.bodyDom.getBody().hasClass('converter')) {
			var elMessage = this.elGetPremiumPanel.find('.js-message');
			if(msg) elMessage.removeClass('hidden').find('span').html(msg);
			this.bodyDom.showSidePanel(this.elGetPremiumPanel);
		}
	};
	UserDom.prototype.toggleWait = function(show, expiredMessage, delay, fileName) {
		if(!this.bodyDom.isSidePanelOpen(this.elGetPremiumPanel) === show) {
			var elMessage = this.elWaitPanel.find('.js-message');
			if(expiredMessage) elMessage.removeClass('hidden').find('span').html(expiredMessage);
			this.elNagWait.find(".file-item").attr("title", fileName).find(".file-name").html(fileName);
			this.elNagWait.find('.js-clock').html("<time class=\"membership-wait-time\" data-min=\"" + delay + "\">" + delay + ":00</time>");
			show ? this.bodyDom.showSidePanel(this.elWaitPanel) : this.bodyDom.closeSidePanel(this.elWaitPanel);
			this.bodyDom.getBody().toggleClass("wait-in-progress", show);
			var elTime_1 = $(".membership-wait-time");
			var timer = elTime_1.prop("timer");
			if(timer) clearInterval(timer);
			if(show) {
				timer = setInterval(function() {
					var remain = (elTime_1.prop("remain") || Number(elTime_1.data("min")) * 60) - 1;
					if(remain > 0) {
						elTime_1.prop("remain", remain);
						var t = new Date(null);
						t.setSeconds(remain);
						var min = t.getMinutes().toString();
						if(min.length < 2) min = "0" + min;
						var sec = t.getSeconds().toString();
						if(sec.length < 2) sec = "0" + sec;
						elTime_1.html(min + ":" + sec);
					} else {
						Utils.reloadPage();
					}
				}, 1000);
				elTime_1.prop("timer", timer);
			}
		}
	};
	UserDom.prototype.hideNags = function() {
		this.bodyDom.closeSidePanel(this.elGetPremiumPanel);
		this.bodyDom.closeSidePanel(this.elWaitPanel);
	};
	return UserDom;
}(Dom));
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
var currency_symbols = {
	'USD': '$',
	'EUR': 'â‚¬',
	'CRC': 'â‚¡',
	'GBP': 'Â£',
	'ILS': 'â‚ª',
	'INR': 'â‚¹',
	'JPY': 'Â¥',
	'KRW': 'â‚©',
	'NGN': 'â‚¦',
	'PHP': 'â‚±',
	'PYG': 'â‚²',
	'VND': 'â‚«',
	'AUD': 'A$',
	'CAD': 'C$',
	'DKK': 'Dkr',
	'TRY': 'TL',
	'TWD': 'NT$',
	'BRL': 'R$',
	'CNY': 'CNÂ¥',
	'HKD': 'HK$',
	'NZD': 'NZ$',
	'MXN ': 'MX$'
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
	Utils.argsToArr = function() {
		return [].slice.call(arguments);
	};
	Utils.flatten = function(arr) {
		return [].concat.apply([], arr);
	};
	Utils.getMetas = function(conversionInfoPath, srcFormats, filter, id) {
		var filterParam = filter ? "&filter=" + filter : "";
		filterParam += id ? "&id=" + id : '';
		return $.getJSON(conversionInfoPath + "?srcFormat=" + srcFormats.join(",") + filterParam);
	};
	Utils.getMeta = function(conversionInfoPath, id) {
		return $.getJSON(conversionInfoPath + "?id=" + id);
	};
	Utils.elIsInViewport = function(el) {
		var docViewTop = $(window).scrollTop();
		var docViewBottom = docViewTop + $(window).height();
		var elTop = $(el).offset().top;
		return((elTop <= docViewBottom) && (elTop >= docViewTop));
	};
	Utils.getSrcFormats = function(meta) {
		var result = [];
		if(meta && meta.prepareRule && meta.prepareRule.steps && meta.prepareRule.steps.length > 0) {
			result = meta.prepareRule.steps[0].converters.map(function(c) {
				return c.sourceFormat.toLowerCase();
			});
			result = Utils.flatten(result);
		}
		return result;
	};
	Utils.getTransformConverter = function(srcFormat, formats) {
		return formats.filter(function(f) {
			return f.sourceFormat.toLowerCase() === srcFormat.toLowerCase();
		}).shift() || formats.filter(function(f) {
			return !f.sourceFormat;
		}).shift();
	};
	Utils.setIndex = function(obj, idx, parent) {
		if(parent === void 0) {
			parent = null;
		}
		obj["idx"] = parent && parent["idx"] ? parent["idx"].slice(0) : [];
		obj["idx"].push(idx);
	};
	Utils.insertByIdx = function(arr, obj) {
		var compArr = arr.map(function(t) {
			return Utils.compareIdx(t["idx"], obj["idx"]);
		});
		var pos = compArr.indexOf(1);
		if(pos === -1) {
			pos = arr.push(obj) - 1;
		} else {
			arr.splice(pos, 0, obj);
		}
		return pos > -1 ? pos : arr.length - 1;
	};
	Utils.compareIdx = function(a, b) {
		var result;
		var i = 0;
		var lengthA = a ? a.length : 0;
		var lengthB = b ? b.length : 0;
		do {
			var valA = lengthA > i ? a[i] : -1;
			var valB = lengthB > i ? b[i] : -1;
			result = valA === valB ? 0 : valA > valB ? 1 : -1;
			i++;
		} while (result === 0 && Math.max(lengthA, lengthB) > i);
		return result;
	};
	Utils.preloadImage = function(url) {
		return $.Deferred(function(def) {
			var image = new Image();
			image.onload = function() {
				return def.resolve(url);
			};
			image.onerror = function() {
				return def.reject();
			};
			image.src = url;
		}).promise();
	};
	Utils.insertElement = function(container, child, pos) {
		if(typeof pos === 'object') pos = pos[3];
		child.prop("pos", pos);
		var nextEl = container.children().filter(function(idx, el) {
			return $(el).prop("pos") >= pos;
		}).first();
		if(nextEl.length === 0) nextEl = container.children().filter(".fixed-item");
		if(nextEl.length > 0) {
			child.insertBefore(nextEl[0]);
		} else {
			container.append(child);
		}
	};
	Utils.showAsDialog = function(elContent, dialogTitle) {
		return $.Deferred(function(def) {
			elContent.removeClass("hidden");
			var elCloseBtn = $("<div class=\"modal-header\">\n" + "            <h1>" + dialogTitle + "</h1>\n" + "<svg class=\"js-close-modal\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\"><defs/><path stroke=\"#313131\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 22a10 10 0 100-20 10 10 0 000 20zM15 9l-6 6M9 9l6 6\"/></svg>\n" + "        </div>");
			if(!elContent.parent().hasClass("modal-body")) {
				elContent.wrap("<div class='modal-overlay scale-in'></div>");
				elContent.wrap("<div class='modal-content'></div>");
				elContent.wrap("<div class='modal-body'></div>");
				elContent.parent().prepend(elCloseBtn);
			}
			var elBody = $("body");
			$(".js-close-modal").on("click", function(e) {
				def.reject();
			});
			elBody.keyup(function(e) {
				if(e.keyCode === 27) def.reject();
			});
			elBody.on('click', ('.modal-overlay'), function(event) {
				if(!$(event.target).hasClass('modal-body') && $(event.target).parents('.modal-body').length === 0) {
					def.reject();
				}
			});
			def.always(function() {
				elCloseBtn.remove();
				if(elContent.parent().hasClass("modal-body")) {
					elContent.unwrap();
					elContent.unwrap();
					elContent.unwrap();
				}
				elContent.elHide();
			});
			var id = elContent.attr("id") || Math.random().toString(36).substring(2);
			elContent.attr("id", id);
			elContent.data("history-back", function() {
				return def.reject();
			});
			window.history.replaceState({
				targetId: id
			}, "Dialog");
			window.history.pushState(null, "");
		});
	};
	Utils.passDlgShow = function(fileName, password) {
		var elForm = $(".password-input-form");
		var elPasswordCaption = elForm.find(".caption");
		var elPasswordInput = elForm.find(".password-input");
		var def = Utils.showAsDialog(elForm, 'Enter password');
		elForm.on("submit", function() {
			if(elPasswordInput[0]["checkValidity"]()) {
				def.resolve(elPasswordInput.val());
			}
			return false;
		});
		var caption = elPasswordCaption.data(password ? "text-bad" : "text-req").replace(/{{fileName}}/g, fileName);
		elPasswordCaption.text(caption);
		elPasswordInput.val(password);
		elPasswordInput[0].focus();
		return def;
	};
	Utils.isMsFormat = function(format) {
		return jQuery.inArray(format.toLowerCase(), ["docx", "doc", "rtf", "xlsx", "xls", "pptx", "ppt"]) !== -1;
	};
	Utils.formatBytes = function(bytes) {
		if(bytes < 1024) return bytes + " Bytes";
		else if(bytes < 1048576) return Math.round(bytes / 1024) + " KB";
		else if(bytes < 1073741824) return(bytes / 1048576).toFixed(1) + " MB";
		else return(bytes / 1073741824).toFixed(2) + " GB";
	};;
	Utils.parseRanges = function(rangesStr) {
		var tmpArr = rangesStr.replace(/[^0-9,\-,\,]/g, "").split(",").map(function(s) {
			var arr = s.split("-");
			if(arr.length === 1) {
				return parseInt(arr[0]);
			} else if(arr.length > 1) {
				var a = parseInt(arr[0]);
				var b = parseInt(arr[1]);
				if(a !== NaN && b !== NaN) {
					var rangeArr = [];
					for(; a <= b; a++) rangeArr.push(a);
					return rangeArr;
				}
			}
			return NaN;
		});
		tmpArr = [].concat.apply([], tmpArr).sort(function(a, b) {
			return a - b;
		});
		return tmpArr.filter(function(n, i) {
			return n > 0 && (i === 0 || tmpArr[i - 1] !== n);
		});
	};
	Utils.buildRanges = function(items) {
		return items.reduce(function(acc, cur, i) {
			if(i === items.length - 1 && acc.last === cur - 1) {
				acc.val += acc.range > 1 ? "-" : acc.val ? ", " : "";
				acc.val += cur.toString();
			} else if(acc.last !== cur - 1) {
				acc.val += acc.range > 2 ? "-" + acc.last : acc.range > 1 ? ", " + acc.last : "";
				acc.val += acc.val ? ", " : "";
				acc.val += cur.toString();
				acc.range = 0;
			}
			acc.last = cur;
			acc.range++;
			return acc;
		}, {
			val: "",
			last: -1,
			range: 0
		}).val;
	};
	Utils.arrContains = function(base, a) {
		var baseLower = base.map(function(f) {
			return f.toLocaleLowerCase();
		});
		var aLower = a.map(function(f) {
			return f.toLocaleLowerCase();
		});
		return aLower.every(function(f) {
			return baseLower.indexOf(f) > -1;
		});
	};
	Utils.persist = function(model, caraDomainName) {
		return $.ajax({
			method: "POST",
			url: caraDomainName + "/upload?filename=files.json",
			data: JSON.stringify(model),
			contentType: "application/json"
		}).then(function(data) {
			return data.FileId;
		});
	};
	Utils.retrieve = function(id, caraDomainName) {
		return $.get(caraDomainName + "/d/" + id).then(function(data) {
			return data;
		});
	};
	Utils.reloadPage = function(removeHash) {
		if(removeHash === void 0) {
			removeHash = true;
		}
		if(removeHash) location.hash = "";
		location.reload();
	};
	Utils.getParameterByName = function(name) {
		var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
		return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
	};
	Utils.getLocationParameter = function(name, hash) {
		var searchString = hash ? hash.replace('#', '?') : window.location.hash.replace('#', '?');
		var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(searchString);
		if(results == null) {
			return null;
		} else {
			return decodeURI(results[1]) || 0;
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
var DropboxIntegration = (function() {
	function DropboxIntegration() {}
	DropboxIntegration.registerEvents = function(dom) {
		var _this = this;
		dom.bind("dropboxChooseShow", function() {
			Dropbox.choose({
				success: function(files) {
					var remoteFiles = files.map(function(f) {
						return {
							url: f.link,
							fileName: f.name,
							headerName: null,
							headerValue: null
						};
					});
					dom.trigger("dropboxFilesSelected", remoteFiles);
					DataLayerPush.fileSelectRemote("Dropbox");
				},
				linkType: "direct",
				multiselect: _this.multiselect
			});
		});
	};
	DropboxIntegration.loadLib = function() {
		return $.getScript("https://www.dropbox.com/static/api/2/dropins.js");
	};
	DropboxIntegration.multiselect = true;
	return DropboxIntegration;
}());
var Google = (function() {
	function Google() {}
	Google.loadLib = function() {
		this.loadDef = this.loadDef || $.Deferred(function(def) {
			if(gapi && gapi.load) return def.resolve().promise();
			window["gapi_onload"] = function() {
				return def.resolve();
			};
		}).promise();
		return this.loadDef;
	};
	Google.loadModule = function(name) {
		var _this = this;
		return $.Deferred(function(def) {
			_this.loadLib().done(function() {
				return gapi.load(name, {
					callback: function() {
						return def.resolve();
					},
					onerror: function() {
						return def.reject("Error while loading Google " + name + " library");
					},
					timeout: 10000,
					ontimeout: function() {
						return def.reject("Timeout while loading Google " + name + " library");
					}
				});
			});
		}).promise();
	};
	return Google;
}());
var GooglePicker = (function() {
	function GooglePicker() {}
	GooglePicker.registerEvents = function(dom, developerKey, clientId, locale) {
		dom.bind("googlePickerShow", function() {
			GooglePicker.getPicker(developerKey, clientId, locale).done(function(files) {
				var remoteFiles = files.map(function(f) {
					return {
						url: f.link,
						fileName: f.name,
						headerName: f.headerName,
						headerValue: f.headerValue
					};
				});
				dom.trigger("gdriveFilesSelected", remoteFiles);
				DataLayerPush.fileSelectRemote("Gdrive");
			});
		});
	};
	GooglePicker.getPicker = function(developerKey, clientId, locale) {
		var _this = this;
		if(this.picker && this.picker["multiselect"] !== this.multiselect) {
			this.picker["dispose"]();
			this.picker = null;
		}
		var pickerDef = this.picker ? $.Deferred().resolve(this.picker) : $.when(this.auth(clientId), Google.loadModule("picker")).then(function(oauthToken) {
			return _this.buildPicker(locale, oauthToken, developerKey);
		});
		var fileDef = $.Deferred();
		pickerDef.done(function(p) {
			_this.picker = p;
			p.setCallback(function(data) {
				return _this.pickerCallback(data, p["oauthToken"], fileDef);
			});
			p.setVisible(true);
		});
		return fileDef.promise();
	};
	GooglePicker.pickerCallback = function(data, oauthToken, def) {
		if(data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
			var docs = data[google.picker.Response.DOCUMENTS];
			var files = docs.map(function(f) {
				return({
					link: "https://www.googleapis.com/drive/v3/files/" + f.id + "?alt=media",
					name: f.name,
					headerName: "Authorization",
					headerValue: "Bearer " + oauthToken
				});
			});
			def.resolve(files);
		} else if(data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
			def.reject("No files selected");
		}
	};
	GooglePicker.auth = function(clientId) {
		var def = $.Deferred();
		gapi.auth.authorize({
			client_id: clientId,
			scope: ['https://www.googleapis.com/auth/drive.readonly'],
			immediate: false
		}, function(authResult) {
			if(authResult && !authResult.error) {
				def.resolve(authResult.access_token);
			} else {
				def.reject("Authentication error");
			}
		});
		return def.promise();
	};
	GooglePicker.buildPicker = function(locale, oauthToken, developerKey) {
		var picker = new google.picker.PickerBuilder().addView(google.picker.ViewId.DOCS).enableFeature(this.multiselect ? google.picker.Feature.MULTISELECT_ENABLED : null).setLocale(locale).setOAuthToken(oauthToken).setDeveloperKey(developerKey).build();
		picker["oauthToken"] = oauthToken;
		picker["multiselect"] = this.multiselect;
		return picker;
	};
	GooglePicker.multiselect = true;
	return GooglePicker;
}());
var BodyDom = (function(_super) {
	__extends(BodyDom, _super);

	function BodyDom() {
		var _this_1 = _super.call(this) || this;
		var _this = _this_1;
		_this_1.locale = $("html").attr("lang");
		_this_1.elBody = $("body");
		_this_1.caraDomainName = _this_1.elBody.data("cara-domain-name");
		_this_1.caraConvertPath = _this_1.elBody.data("cara-convert-path");
		_this_1.caraApiKey = _this_1.elBody.data("cara-api-key");
		_this_1.authStatusPath = _this_1.elBody.data("auth-status-path");
		_this_1.tokenConvertedPath = _this_1.elBody.data("token-converted-path");
		_this_1.tokenCreatePath = _this_1.elBody.data("token-create-path");
		_this_1.remoteFileInfoPath = _this_1.elBody.data("remote-file-info-path");
		_this_1.signInPath = _this_1.elBody.data("sign-in-path");
		_this_1.forgotPasswordPath = _this_1.elBody.data("forgot-password-path");
		_this_1.converterName = _this_1.elBody.data("converter-name");
		_this_1.conversionInfoPath = _this_1.elBody.data("conversion-info-path");
		_this_1.chainingInfoPath = _this_1.elBody.data("chaining-info-path");
		_this_1.canconvertInfoPath = _this_1.elBody.data("canconvert-info-path");
		_this_1.defaultConverterMeta = $("#default-converter").html();
		_this_1.GoogleClientId = _this_1.elBody.data("google-clientid");
		_this_1.GoogleDeveloperKey = _this_1.elBody.data("google-developerkey");
		_this_1.DropboxAppKey = _this_1.elBody.data("dropbox-app-key");
		_this_1.paddleVendorId = _this_1.elBody.data("paddle-vendorid");
		_this_1.elPricesContainer = _this_1.elBody.find(".prices-container");
		_this_1.elTrialWaitMessage = _this_1.elPricesContainer.find(".trial-wait-message");
		_this_1.elSignupMessagePanel = _this_1.elPricesContainer.find(".signup-message-panel");
		_this_1.elWorkArea = _this_1.elBody.find(".work-area");
		_this_1.elGrayOverlay = _this_1.elBody.find(".gray-overlay");
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
		_this_1.elGooglePickerBtn = _this_1.elBody.find(".JSgP");
		_this_1.elDropboxChooseBtn = _this_1.elBody.find(".js-dropbox-choose-btn");
		_this_1.elErrorContainer = _this_1.elBody.find(".error-container");
		_this_1.labelEnterFileLocation = _this_1.elBody.data('js-label-enter-file-location');
		_this_1.labelRotateAll = _this_1.elBody.data('js-label-rotate-all');
		_this_1.labelConversionError = _this_1.elBody.data('js-label-conversion-error');
		_this_1.labelRotateSelected = _this_1.elBody.data('js-label-rotate-selected');
		_this_1.labelUnableToAdd = _this_1.elBody.data('js-label-unable-to-add');
		_this_1.labelConversionFailed = _this_1.elBody.data('js-label-conversion-failed');
		_this_1.labelUnableToAccess = _this_1.elBody.data('js-label-unable-to-access');
		_this_1.labelSuspended = _this_1.elBody.data('js-label-suspended');
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
		_this_1.brandColor = jQuery('.BbC').css('background-color');
		var dragCounter = 0;
		_this_1.elDropZone.on('dragenter', function() {
			_this.elDropZone.css({
				'border-color': _this.brandColor
			});
			dragCounter++;
		});
		_this_1.elDropZone.on('dragleave drop', function() {
			dragCounter--;
			if(dragCounter === 0) {
				_this.elDropZone.css({
					'border-color': '#DEDEDE'
				});
			}
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
var DragAndDropDom = (function(_super) {
	__extends(DragAndDropDom, _super);

	function DragAndDropDom(bodyDom) {
		var _this = _super.call(this) || this;
		_this.bodyDom = bodyDom;
		$(document).on("dragover", function(e) {
			e.preventDefault();
			e.stopPropagation();
		});
		$(document).on("dragleave", function(e) {
			e.preventDefault();
			e.stopPropagation();
		});
		$(document).on("drop", _this.fileDrop.bind(_this));
		return _this;
	}
	DragAndDropDom.prototype.isDraggingFiles = function(e) {
		var types = e.originalEvent.dataTransfer.types;
		if(types.contains) {
			return types.contains("Files");
		}
		return e.originalEvent.dataTransfer.types.indexOf("Files") > -1;
	};
	DragAndDropDom.prototype.fileDrop = function(e) {
		if(this.isDraggingFiles(e)) {
			var originalEvent = e.originalEvent;
			e.stopPropagation();
			e.preventDefault();
			var files = originalEvent.dataTransfer.files;
			this.bodyDom.trigger("dragDropFilesSelected", files);
			DataLayerPush.fileSelectLocal("DragDrop");
		}
	};
	return DragAndDropDom;
}(Dom));
var Fle = (function() {
	function Fle(fileIdDef, caraDomainName, cancelDef) {
		var _this = this;
		if(cancelDef === void 0) {
			cancelDef = null;
		}
		this.uploadedSize = 0;
		this.imgFormats = ["jpg", "jpeg", "png", "bmp", "gif", "svg", "ico", "webp", "tiff"];
		this.id = Math.random().toString(36).substring(2);
		this.fileIdDef = fileIdDef;
		this.caraDomainName = caraDomainName;
		this.cancelDef = cancelDef || $.Deferred();
		this.fileIdDef.progress(function(total, loaded) {
			return _this.uploadedSize = loaded;
		});
	}
	Fle.prototype.getId = function() {
		return this.id;
	};
	Fle.prototype.getUrlPro = function() {
		var _this = this;
		return this.getFileIdDef().then(function(id) {
			return _this.caraDomainName + "/d/" + id;
		}).promise();
	};
	Fle.prototype.getFileIdDef = function() {
		return this.fileIdDef;
	};
	Fle.prototype.cancel = function(message) {
		this.cancelDef.reject(message);
		this.fileIdDef.reject(message);
	};
	Fle.prototype.getCancelPro = function() {
		return this.cancelDef.promise();
	};
	Fle.prototype.isCancelled = function() {
		return this.cancelDef.state() !== "pending";
	};
	Fle.prototype.delete = function() {
		var _this = this;
		this.cancel("Deleting file");
		return this.getFormatPro().then(function(format) {
			return format === "web" ? null : _this.getUrlPro().then(function(path) {
				return $.ajax({
					method: "DELETE",
					url: path
				});
			}).then(function() {}, function() {});
		});
	};
	Fle.prototype.getFormatPro = function() {
		return this.getNamePro().then(function(n) {
			return n.getFileExtension().toLowerCase();
		});
	};
	Fle.prototype.getUploadedSize = function() {
		return this.uploadedSize;
	};
	Fle.prototype.isImagePro = function() {
		var _this = this;
		return this.getFormatPro().then(function(f) {
			return _this.imgFormats.indexOf(f) > -1;
		});
	};
	Fle.getUploadProgressXhr = function(def) {
		var xhr = $.ajaxSettings.xhr();
		xhr.upload.addEventListener("progress", function(event) {
			return def.notify(event.total, event.loaded);
		});
		return xhr;
	};
	Fle.uploadRequest = function(def, options, cancelPro) {
		var xhr = $.ajax(options);
		xhr.done(function(data) {
			ErrorLogger.debugLogAdd("Uploaded " + data.FileName + " -> " + data.FileId);
			return def.resolve(data.FileId);
		});
		xhr.fail(function(xhr, textStatus, errorThrown) {
			return def.reject(jQuery('body').data('js-label-unable-to-upload'));
		});
		if(cancelPro) cancelPro.fail(function() {
			return xhr.abort();
		});
		return xhr;
	};
	Fle.prototype.getThumbnailUrlPro = function() {
		var _this = this;
		return this.getFormatPro().then(function(f) {
			if(_this.imgFormats.concat("pdf").indexOf(f) > -1) {
				return _this.getFileIdDef().then(function(fileId) {
					var filePath = _this.caraDomainName + "/d/" + fileId;
					var imgWidth = 236;
					var imgHeight = 305;
					if(f.toLowerCase().localeCompare('pdf') === 0) {
						if(typeof(pdfjsLib) === 'undefined' || !pdfjsLib) {} else {
							pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.7.570/pdf.worker.min.js';
							if(window["PDFWorker"] === undefined) {
								window["PDFWorker"] = new pdfjsLib.PDFWorker();
							}
							return pdfjsLib.getDocument({
								url: filePath,
								worker: window["PDFWorker"]
							}).promise.then(function(pdf) {
								return pdf.getPage(1).then(function(page) {
									var canvas = document.createElement("canvas");
									var viewport = page.getViewport({
										scale: 1.0
									});
									var context = canvas.getContext('2d');
									if(imgWidth) {
										viewport = page.getViewport({
											scale: imgWidth / viewport.width
										});
									} else if(imgHeight) {
										viewport = page.getViewport({
											scale: imgHeight / viewport.height
										});
									}
									canvas.height = viewport.height;
									canvas.width = viewport.width;
									return page.render({
										canvasContext: context,
										viewport: viewport
									}).promise.then(function() {
										return canvas.toDataURL();
									});
								}).catch(function() {
									return filePath;
								});
							}).catch(function() {
								return filePath;
							});
						}
					} else {
						return filePath;
					}
				});
			} else return $.Deferred().reject();
		});
	};
	return Fle;
}());
var FleLocal = (function(_super) {
	__extends(FleLocal, _super);

	function FleLocal(caraDomainName, file) {
		var _this = this;
		var cancelDef = $.Deferred();
		var fileIdDef = FleLocal.upload(caraDomainName, cancelDef.promise(), file);
		_this = _super.call(this, fileIdDef, caraDomainName, cancelDef) || this;
		_this.file = file;
		return _this;
	}
	FleLocal.prototype.getSizePro = function() {
		return $.Deferred().resolve(this.file.size).promise();
	};
	FleLocal.prototype.getNamePro = function() {
		return $.Deferred().resolve(this.file.name).promise();
	};
	FleLocal.prototype.getDataUrlPro = function() {
		var def = $.Deferred();
		var fileReader = new FileReader();
		this.getCancelPro().fail(function() {
			return fileReader.abort();
		});
		fileReader.onload = function() {
			return def.resolve(fileReader.result);
		};
		fileReader.readAsDataURL(this.file);
		return def.promise();
	};
	FleLocal.upload = function(caraDomainName, cancelPro, file) {
		var _this = this;
		return $.Deferred(function(def) {
			var options = {
				xhr: function() {
					return _this.getUploadProgressXhr(def);
				},
				method: "POST",
				url: caraDomainName + "/upload",
				data: file,
				contentType: false,
				processData: false,
				beforeSend: function(request) {
					return request.setRequestHeader("Content-Disposition", "attachment; filename*=" + _this.encode(file.name));
				}
			};
			DataLayerPush.fileUploadStart("local");
			ErrorLogger.debugLogAdd("Uploading local file: " + file.name);
			_this.uploadRequest(def, options, cancelPro).done(function() {
				return DataLayerPush.fileUploadSuccess("local");
			}).fail(function() {
				return DataLayerPush.fileUploadFail("local");
			});
		});
	};
	FleLocal.encode = function(str) {
		return "UTF-8''" + encodeURIComponent(str).replace(/['()]/g, function(match) {
			return '%' + match.charCodeAt(0).toString(16);
		}).replace(/\*/g, '%2A').replace(/%(7C|60|5E)/g, function(_, match) {
			return String.fromCharCode(parseInt(match, 16));
		});
	};
	FleLocal.prototype.getThumbnailUrlPro = function() {
		var _this = this;
		return this.isImagePro().then(function(isImage) {
			return isImage ? _this.getDataUrlPro() : _super.prototype.getThumbnailUrlPro.call(_this);
		});
	};
	return FleLocal;
}(Fle));
var FleRemote = (function(_super) {
	__extends(FleRemote, _super);

	function FleRemote(caraDomainName, remoteUrl, remoteFileInfoPath, fileName, headerName, headerValue) {
		if(fileName === void 0) {
			fileName = null;
		}
		if(headerName === void 0) {
			headerName = null;
		}
		if(headerValue === void 0) {
			headerValue = null;
		}
		var _this = this;
		var cancelDef = $.Deferred();
		var urlDef = FleRemote.upload(caraDomainName, cancelDef.promise(), remoteUrl, remoteFileInfoPath, fileName, headerName, headerValue);
		_this = _super.call(this, urlDef, caraDomainName, cancelDef) || this;
		_this.remoteUrl = remoteUrl;
		_this.remoteFileInfoPath = remoteFileInfoPath;
		if(fileName) _this.fileNamePro = $.Deferred().resolve(fileName).promise();
		_this.startFakeProgress();
		return _this;
	}
	FleRemote.prototype.getNamePro = function() {
		this.fileNamePro = this.fileNamePro || FleRemote.getRemoteFileNamePro(this.remoteUrl, this.remoteFileInfoPath);
		return this.fileNamePro;
	};
	FleRemote.prototype.getSizePro = function() {
		this.fileSizePro = this.fileSizePro || $.getJSON(this.remoteFileInfoPath + "?url=" + encodeURIComponent(this.remoteUrl)).then(function(info) {
			return info.length;
		}, function() {
			return 1000000;
		});
		return this.fileSizePro;
	};
	FleRemote.prototype.startFakeProgress = function() {
		var _this = this;
		var timer = setInterval(function() {
			if(_this.getFileIdDef() && _this.getFileIdDef().state() === "pending") {
				_this.getSizePro().done(function(totalSize) {
					var uploaded = _this.getUploadedSize() + 200000;
					uploaded = uploaded > totalSize ? totalSize : uploaded;
					_this.getFileIdDef().notify(totalSize, uploaded);
				});
			}
		}, 500);
		this.getFileIdDef().always(function() {
			clearInterval(timer);
		});
	};
	FleRemote.upload = function(domainName, cancelPro, url, remoteFileInfoPath, fileName, headerName, headerValue) {
		var _this = this;
		if(fileName === void 0) {
			fileName = null;
		}
		if(headerName === void 0) {
			headerName = null;
		}
		if(headerValue === void 0) {
			headerValue = null;
		}
		var fileNamePro = fileName ? $.Deferred().resolve(fileName) : FleRemote.getRemoteFileNamePro(url, remoteFileInfoPath);
		ErrorLogger.debugLogAdd("Uploading remote file: " + remoteFileInfoPath + " file name: " + fileName + " header: " + headerName + " " + headerValue);
		return $.Deferred(function(def) {
			fileNamePro.done(function(fileName) {
				if(fileName.getFileExtension() === "web") {
					def.resolve(url);
				} else {
					fileName = fileName ? "&fileName=" + encodeURIComponent(fileName) : "";
					headerName = headerName ? "&headerName=" + encodeURIComponent(headerName) : "";
					headerValue = headerValue ? "&headerValue=" + encodeURIComponent(headerValue) : "";
					var options = {
						method: "POST",
						url: domainName + "/upload?url=" + encodeURIComponent(url) + fileName + headerName + headerValue
					};
					DataLayerPush.fileUploadStart("remote");
					_this.uploadRequest(def, options, cancelPro).done(function() {
						return DataLayerPush.fileUploadSuccess("remote");
					}).fail(function() {
						return DataLayerPush.fileUploadFail("remote");
					});
				}
			}).fail(function() {
				return def.reject();
			});
		});
	};
	FleRemote.getRemoteFileNamePro = function(url, remoteFileInfoPath) {
		return $.getJSON(remoteFileInfoPath + "?url=" + encodeURIComponent(url)).then(function(info) {
			if(info.extension === "html") return "site.web";
			if(!info.name && info.extension) return "file." + info.extension;
			return info.name;
		});
	};
	return FleRemote;
}(Fle));
var FleResult = (function(_super) {
	__extends(FleResult, _super);

	function FleResult(resultFile, caraDomainName, srcFleSize) {
		if(srcFleSize === void 0) {
			srcFleSize = null;
		}
		var _this = this;
		var cancelDef = $.Deferred();
		var fileIdDef = $.Deferred().resolve(resultFile.FileId);
		_this = _super.call(this, fileIdDef, caraDomainName, cancelDef) || this;
		_this.resultFile = resultFile;
		_this.srcFleSize = srcFleSize;
		return _this;
	}
	FleResult.prototype.getNamePro = function() {
		return $.Deferred().resolve(this.resultFile.FileName).promise();
	};
	FleResult.prototype.getSizePro = function() {
		return $.Deferred().resolve(this.resultFile.FileSize).promise();
	};
	FleResult.prototype.getSrcSize = function() {
		return this.srcFleSize;
	};
	return FleResult;
}(Fle));
var Context = (function(_super) {
	__extends(Context, _super);

	function Context(caraInfo, convMeta, rules) {
		var _this = _super.call(this) || this;
		_this.tfles = [];
		_this.groups = [];
		_this.userParams = {};
		_this.addingDef = $.Deferred();
		_this.jobCnt = 0;
		_this.convCnt = 0;
		_this.caraInfo = caraInfo;
		_this.cancelDef = $.Deferred();
		_this.convMeta = convMeta;
		_this.rules = rules;
		_this.labelNotConverted = jQuery('body').data('js-label-not-converted');
		return _this;
	}
	Context.prototype.getTfles = function() {
		return this.tfles;
	};
	Context.prototype.getConvMeta = function() {
		return this.convMeta;
	};
	Context.prototype.getFlesPros = function() {
		return this.tfles.map(function(f) {
			return f.getFlesPro();
		});
	};
	Context.prototype.getGroupFlesPros = function() {
		var _this = this;
		var groups = [0].concat(this.groups);
		return groups.map(function(from, i) {
			var to = i < groups.length - 1 ? groups[i + 1] : null;
			return _this.getFlesPro(from, to);
		});
	};
	Context.prototype.getJobCnt = function() {
		return this.jobCnt;
	};
	Context.prototype.getConvCnt = function() {
		return this.convCnt;
	};
	Context.prototype.incConvCnt = function() {
		if(this.convCnt === 0) this.trigger("convStart");
		this.convCnt++;
	};
	Context.prototype.decConvCnt = function() {
		if(this.convCnt > 0) {
			this.convCnt--;
			if(this.convCnt === 0) this.trigger("convFinish");
		}
	};
	Context.prototype.getFlesPro = function(from, to) {
		if(from === void 0) {
			from = null;
		}
		if(to === void 0) {
			to = null;
		}
		from = from || 0;
		to = to || this.tfles.length;
		return $.when.apply(null, this.getFlesPros()).then(Utils.argsToArr).then(Utils.flatten).then(function(fs) {
			return fs.slice(from, to);
		});
	};
	Context.prototype.getSuccessFlesPro = function() {
		var _this = this;
		return $.Deferred(function(def) {
			if(_this.getFlesPros().length === 0) def.resolve([]);
			else $.when.apply(null, _this.getFlesPros()).then(Utils.argsToArr).then(Utils.flatten).always(function(fles) {
				if(fles.length > 0) {
					def.resolve(fles);
				} else {
					def.reject();
				}
			});
		});
	};
	Context.prototype.getAddingPro = function() {
		return this.addingDef.promise();
	};
	Context.prototype.getCancelPro = function() {
		return this.cancelDef.promise();
	};
	Context.prototype.cancel = function(message, deleteFiles) {
		if(deleteFiles === void 0) {
			deleteFiles = true;
		}
		this.cancelDef.reject(message);
		var pros = deleteFiles ? this.tfles.map(function(tfle) {
			return tfle.delete();
		}) : [];
		return $.when.apply(null, pros);
	};
	Context.prototype.getUploadedSize = function() {
		var allUploadedSizePros = this.getFlesPro().then(function(fles) {
			return fles.map(function(fle) {
				return fle.getUploadedSize();
			});
		});
		return $.when.apply(null, allUploadedSizePros).then(Utils.argsToArr).then(function(sizes) {
			return sizes.reduce(function(sum, curr) {
				return sum + curr;
			}, 0);
		});
	};
	Context.prototype.addFlesPro = function(flesPro) {
		var _this = this;
		var _a;
		if(flesPro.state() === "rejected") {
			flesPro.fail(function(message) {
				return _this.trigger("fileNotAccepted", message);
			});
		} else {
			var actions = this.convMeta ? this.convMeta.actions : null;
			var tFle = new TransformFle(flesPro, actions, this.caraInfo);
			var tfles = this.getTfles();
			tFle["idx"] = (_a = flesPro["idx"]) !== null && _a !== void 0 ? _a : [this.tfles.length];
			var pos = Utils.insertByIdx(tfles, tFle);
			this.tfles = tfles;
			this.trigger("fileAdded", tFle, pos);
			this.incConvCnt();
			flesPro.always(function() {
				return _this.decConvCnt();
			});
		}
	};
	Context.prototype.insertFles = function(flesPro, pos, showPageNumber) {
		if(showPageNumber === void 0) {
			showPageNumber = false;
		}
		var actions = this.convMeta ? this.convMeta.actions : null;
		var tFle = new TransformFle(flesPro, actions, this.caraInfo);
		var tfles = this.getTfles();
		this.tfles = tfles.slice(0, pos).concat([tFle], tfles.slice(pos));
		this.trigger("fileAdded", tFle, pos, true);
	};
	Context.prototype.insertFlesSeparated = function(fles, pos) {
		var _this = this;
		fles.forEach(function(fle, i) {
			var flesPro = $.Deferred().resolve([fle]).promise();
			_this.insertFles(flesPro, pos + i, true);
		});
	};
	Context.prototype.prepAndAddFles = function(flesPros) {
		var _this = this;
		if(this.rules) {
			this.jobCnt++;
			this.incConvCnt();
			var decCnt = function() {
				_this.decConvCnt();
				_this.jobCnt--;
			};
			var jobPro = Transform.do(flesPros, this.rules, this.cancelDef, this.caraInfo, this.addFlesPro.bind(this), this.userParams).then(decCnt, decCnt);
			this.addingDef.notify(jobPro);
		} else {
			flesPros.forEach(function(flesPro) {
				return _this.addFlesPro(flesPro);
			});
		}
		return this;
	};
	Context.prototype.addLocalFiles = function(fileList) {
		var fles = [];
		for(var i = 0; i < fileList.length; i++) {
			if(this.canConvert(fileList[i].name.getFileExtension())) {
				var fle = new FleLocal(this.caraInfo.domain, fileList[i]);
				this.registerUploadEvets(fle);
				fles.push(fle);
			} else {
				this.trigger("fileNotAccepted", fileList[i].name);
			}
		}
		if(fles.length > 0) {
			var flesPro = $.Deferred().resolve(fles).promise();
			this.prepAndAddFles([flesPro]);
		}
		return this;
	};
	Context.prototype.addRemoteFile = function(remoteFiles, remoteFileInfoPath) {
		var _this = this;
		remoteFiles.forEach(function(remoteFile) {
			var fileNamePro = remoteFile.fileName ? $.Deferred().resolve(remoteFile.fileName).promise() : FleRemote.getRemoteFileNamePro(remoteFile.url, remoteFileInfoPath);
			fileNamePro.done(function(name) {
				if(_this.canConvert(name.getFileExtension())) {
					var fle = new FleRemote(_this.caraInfo.domain, remoteFile.url, remoteFileInfoPath, name, remoteFile.headerName, remoteFile.headerValue);
					_this.registerUploadEvets(fle);
					var flesPro = $.Deferred().resolve([fle]).promise();
					_this.prepAndAddFles([flesPro]);
				} else {
					_this.trigger("fileNotAccepted", name);
				}
			}).fail(function() {
				return _this.trigger("unableAccessRemoteFile", remoteFile.url);
			});
		});
	};
	Context.prototype.addStateFiles = function(dto) {
		var _this = this;
		dto.map(function(rf) {
			return new FleResult(rf, _this.caraInfo.domain);
		}).forEach(function(fle) {
			var resultFlesPro = $.Deferred().resolve([fle]);
			_this.addFlesPro(resultFlesPro);
		});
		this.firstJobPro = $.Deferred().resolve().promise();
	};
	Context.prototype.getFirstJobPro = function() {
		var _this = this;
		this.firstJobPro = this.firstJobPro || $.Deferred(function(def) {
			_this.getAddingPro().progress(function(jobPro) {
				jobPro.done(function() {
					return def.resolve();
				});
			});
		}).promise();
		return this.firstJobPro;
	};
	Context.prototype.removeFile = function(tfle) {
		tfle.delete();
		this.tfles = $.grep(this.tfles, function(f) {
			return f !== tfle;
		});
		$(this).triggerHandler("fileRemoved", tfle);
	};
	Context.prototype.deleteAll = function() {
		var deletePros = this.tfles.map(function(f) {
			return f.delete();
		});
		if(this.downloadPro) {
			var pro = this.downloadPro.then(function(f) {
				return f.delete();
			});
			deletePros.push(pro);
		}
		return $.when.apply(null, deletePros);
	};
	Context.prototype.filterFiles = function(range) {
		var _this = this;
		if(range) {
			var keepFlesIdxs_1 = Utils.parseRanges(range);
			this.tfles.filter(function(tfle, i) {
				return keepFlesIdxs_1.indexOf(i + 1) === -1;
			}).forEach(function(tfle) {
				return _this.removeFile(tfle);
			});
		}
	};
	Context.prototype.cancelThumbnails = function() {
		this.tfles.forEach(function(f) {
			return f.cancelThumbnail();
		});
	};
	Context.prototype.getTfleById = function(tFleId) {
		return this.tfles.filter(function(f) {
			return f.getId() === tFleId;
		}).shift();
	};
	Context.prototype.getFleCount = function() {
		var _this = this;
		return this.getFirstJobPro().then(function() {
			return _this.getSuccessFlesPro().then(function(fles) {
				return fles.length;
			});
		});
	};
	Context.prototype.getFirstFle = function() {
		var _this = this;
		return this.getFirstJobPro().then(function() {
			return _this.getSuccessFlesPro().then(function(fles) {
				return fles.length > 0 ? fles[0] : $.Deferred().reject(_this.labelNotConverted).promise();
			});
		});
	};
	Context.prototype.reorder = function(ids) {
		var _this = this;
		this.tfles = ids.map(function(id) {
			return _this.getTfleById(id);
		});
	};
	Context.prototype.canConvert = function(srcFormat) {
		return !this.rules || this.rules.steps[0] && this.rules.steps[0].converters && this.rules.steps[0].converters.some(function(f) {
			return !f.sourceFormat || f.sourceFormat.toLowerCase() === srcFormat.toLowerCase();
		});
	};
	Context.prototype.getFormatsPro = function() {
		var _this = this;
		return $.Deferred(function(def) {
			var flesPros = _this.tfles.map(function(tfle) {
				return tfle.getFlesPro();
			});
			$.when.apply(null, flesPros).then(Utils.argsToArr).then(Utils.flatten).then(function(fles) {
				var formatsPros = fles.map(function(fle) {
					return fle.getFormatPro();
				});
				$.when.apply(null, formatsPros).then(Utils.argsToArr).then(Utils.flatten).then(function(fle) {
					return def.resolve(fle).promise();
				});
			});
		});
	};
	Context.prototype.registerUploadEvets = function(fle) {
		var _this = this;
		$.when(fle.getSizePro(), fle.getUploadedSize()).done(function(size, uploaded) {
			if(size > uploaded) {
				fle.getFileIdDef().progress(function(total, loaded) {
					return _this.trigger("uploadProgress", fle.getId(), total, loaded);
				});
				fle.getFileIdDef().always(function() {
					return _this.trigger("uploadProgress", fle.getId(), 0, 0);
				});
			}
		});
	};
	Context.prototype.splitTfle = function(id) {
		var _this = this;
		var tFle = this.getTfleById(id);
		var flesPro = tFle.split();
		return flesPro.then(function(fles) {
			if(_this.cancelDef.state() === "pending") {
				_this.insertFlesSeparated(fles, _this.getTfles().indexOf(tFle));
				_this.removeFile(tFle);
				return fles;
			}
			return $.Deferred().reject();
		});
	};
	return Context;
}(Eventable));
var TransformFle = (function() {
	function TransformFle(flesPro, actions, caraInfo) {
		this.rotated = 0;
		this.pendingRotations = 0;
		this.thumbnailCancelDef = $.Deferred();
		this.actionCancelDef = $.Deferred();
		this.selected = false;
		this.id = Math.random().toString(36).substring(2);
		this.initialFlesPro = flesPro;
		this.flesPro = this.initialFlesPro;
		this.actions = actions;
		this.caraInfo = caraInfo;
	}
	TransformFle.prototype.getId = function() {
		return this.id;
	};
	TransformFle.prototype.getFlesPro = function() {
		this.requestRotation();
		return this.flesPro;
	};
	TransformFle.prototype.rotate = function() {
		var _this = this;
		this.pendingRotations++;
		clearTimeout(this.rotationTimeout);
		this.rotationTimeout = setTimeout(function() {
			return _this.requestRotation();
		}, 3000);
	};
	TransformFle.prototype.requestRotation = function() {
		if(this.pendingRotations > 0) {
			clearTimeout(this.rotationTimeout);
			var angle = TransformFle.getRotationsToAngle(this.pendingRotations).toString();
			if(angle !== "0") {
				this.flesPro = TransformFle.doAction(this.flesPro, this.actionCancelDef, this.caraInfo, this.actions.rotate, [angle]);
			}
			this.rotated += this.pendingRotations;
			this.pendingRotations = 0;
		}
	};
	TransformFle.prototype.getRotationAngle = function() {
		return TransformFle.getRotationsToAngle(this.rotated + this.pendingRotations);
	};
	TransformFle.getRotationsToAngle = function(rotations) {
		return(rotations % 4) * 90;
	};
	TransformFle.prototype.getThumbnailUrlPro = function() {
		return this.flesPro.then(function(fles) {
			return fles[0].getThumbnailUrlPro();
		});
	};
	TransformFle.prototype.cancelThumbnail = function() {
		this.thumbnailCancelDef.reject("Canceled");
	};
	TransformFle.prototype.deleteThumbnail = function() {
		this.cancelThumbnail();
		return this.thumbnailPro ? this.thumbnailPro.then(function(fles) {
			return fles.forEach(function(f) {
				return f.delete();
			});
		}, function() {}) : $.Deferred().resolve();
	};
	TransformFle.prototype.delete = function() {
		var deletePro = this.flesPro.then(function(fles) {
			return fles.forEach(function(fle) {
				return fle.delete();
			});
		});
		return $.when(deletePro, this.deleteThumbnail());
	};
	TransformFle.prototype.split = function() {
		var _this = this;
		return TransformFle.doAction(this.getFlesPro(), this.actionCancelDef, this.caraInfo, this.actions.split).always(function() {
			return _this.delete();
		});
	};
	TransformFle.getAction = function(srcFormat, actions) {
		var converters = actions.map(function(a) {
			return a.converter;
		});
		var converter = Utils.getTransformConverter(srcFormat, converters);
		return actions.filter(function(a) {
			return a.converter === converter;
		}).shift();
	};
	TransformFle.doAction = function(flesPro, cancelDef, caraInfo, actions, paramVals, thumbnailQueue) {
		var _this = this;
		if(paramVals === void 0) {
			paramVals = [];
		}
		if(thumbnailQueue === void 0) {
			thumbnailQueue = false;
		}
		return flesPro.then(function(fles) {
			var jobs = fles.map(function(fle) {
				return fle.getFormatPro().then(function(srcFormat) {
					var action = _this.getAction(srcFormat, actions);
					if(action) {
						var conv = action.converter;
						var convParams = conv.parameters || {};
						var params = paramVals.reduce(function(sum, val, idx) {
							sum[action.inputParams[idx]] = val;
							return sum;
						}, convParams);
						return Cara.convert(fles, false, cancelDef, conv.destinationFormat, caraInfo, params, thumbnailQueue);
					}
					return $.Deferred().reject().promise();
				});
			});
			return $.when.apply(null, jobs).then(Utils.flatten);
		});
	};
	return TransformFle;
}());
var ContextEvents = (function() {
	function ContextEvents() {}
	ContextEvents.bind = function(dom, context, allowMultipleFiles) {
		var eventsOffPro = context.getCancelPro();
		dom.bind("localFilesSelected", function(e, files) {
			if(allowMultipleFiles || files.length === 1) {
				context.addLocalFiles(files);
			} else {
				dom.trigger("multiFileViolation");
			}
		}, eventsOffPro);
		dom.bind("remoteFilesSelected", function(e, remoteFiles) {
			if(allowMultipleFiles || remoteFiles.length === 1) {
				context.addRemoteFile(remoteFiles, dom.getRemoteFileInfoPath());
			} else {
				dom.trigger("multiFileViolation");
			}
		}, eventsOffPro);
		context.bind("fileNotAccepted", function(e, file) {
			dom.showToast(dom.labelUnableToAdd.replace('${file}', file));
		}, eventsOffPro);
		context.bind("unableAccessRemoteFile", function(e, url) {
			dom.showToast(dom.labelUnableToAccess.replace('${url}', url));
		}, eventsOffPro);
		context.bind("uploadProgress", function(e, fleId, total, loaded) {
			UploadProgress.event(dom, fleId, total, loaded);
		});
		var showUnloadPopup = function() {
			return $(window).on("beforeunload", function(e) {
				return(e.preventDefault(), "");
			});
		};
		context.bind("convStart", showUnloadPopup);
		context.bind("convFinish", function() {
			return $(window).off("beforeunload");
		});
		if(context.getConvCnt() > 0) showUnloadPopup();
	};
	return ContextEvents;
}());
var UploadProgress = (function() {
	function UploadProgress() {}
	UploadProgress.event = function(dom, fleId, total, loaded) {
		if(total > loaded) {
			this.state[fleId] = {
				total: total,
				loaded: loaded
			};
		} else {
			if(this.state[fleId]) delete this.state[fleId];
		}
		var sumTotal = 0;
		var sumLoaded = 0;
		for(var id in this.state) {
			sumTotal += this.state[id].total;
			sumLoaded += this.state[id].loaded;
		}
		var perc = sumTotal > 0 ? Math.round(sumLoaded / sumTotal * 1000) / 10 : 0;
		dom.globalProgress(perc);
	};
	UploadProgress.state = {};
	return UploadProgress;
}());
var FileInputDom = (function(_super) {
	__extends(FileInputDom, _super);

	function FileInputDom(bodyDom) {
		var _this = _super.call(this) || this;
		_this.bodyDom = bodyDom;
		var elBody = _this.bodyDom.getBody();
		_this.elFileInputContainer = elBody.find(".FiC");
		_this.elUrlInputForm = _this.bodyDom.getBody().find(".url-input-form");
		_this.elUrlInput = _this.bodyDom.getBody().find(".url-input");
		_this.elUploadSrcThumbnails = elBody.find(".upload-src-thumbnails");
		_this.elUploadSrc = elBody.find(".upload-src");
		_this.elUrlInputBtn = elBody.find(".JSuI");
		_this.elFileInput = elBody.find(".file-upload-input");
		_this.bindEvents();
		return _this;
	}
	FileInputDom.prototype.bindEvents = function() {
		var _this = this;
		this.elFileInput.on("change", this.onFileInputChange.bind(this));
		this.bodyDom.elGooglePickerBtn.on("click", function() {
			_this.trigger("googlePickerChooseBtnClick");
			return false;
		});
		this.bodyDom.elDropboxChooseBtn.on("click", function() {
			_this.trigger("dropboxChooseBtnClick");
			return false;
		});
		this.elUrlInputBtn.on("click", function(e) {
			e.preventDefault();
			var def = Utils.showAsDialog(_this.elUrlInputForm, _this.bodyDom.labelEnterFileLocation);
			_this.elUrlInputForm.on("submit", function() {
				if(_this.elUrlInput[0]["checkValidity"]()) def.resolve(_this.elUrlInput.val());
				return false;
			});
			def.done(function(url) {
				return _this.bodyDom.trigger("urlFileSelected", url);
			});
		});
	};
	FileInputDom.prototype.onFileInputChange = function(e) {
		var files = $(e.currentTarget).prop("files");
		if(files.length > 0) {
			this.bodyDom.trigger("inputFilesSelected", files);
			DataLayerPush.fileSelectLocal("Button");
			this.clearFileInput();
		}
	};
	FileInputDom.prototype.clearFileInput = function() {
		this.elFileInput.val(null);
	};
	FileInputDom.prototype.multiselect = function(multiselect) {
		if(multiselect) {
			this.elFileInput.attr("multiple", "");
		} else {
			this.elFileInput.removeAttr("multiple");
		}
	};
	FileInputDom.prototype.srcFormats = function(srcFormats) {
		if(srcFormats) {
			this.elFileInput.attr("accept", srcFormats.map(function(f) {
				return "." + f;
			}).join(", "));
		} else {
			this.elFileInput.removeAttr("accept");
		}
	};
	FileInputDom.prototype.hide = function() {
		this.elFileInputContainer.addClass("hidden");
	};
	FileInputDom.prototype.toggleUploadSrc = function() {
		this.elUploadSrcThumbnails.addClass("hidden");
		Utils.toggleFadeEl(this.elUploadSrc);
	};
	return FileInputDom;
}(Dom));
var FileInput = (function() {
	function FileInput() {}
	FileInput.show = function(dom) {
		var _this = this;
		dom.bind("googlePickerChooseBtnClick", function() {
			return dom.bodyDom.trigger("googlePickerShow");
		});
		dom.bind("dropboxChooseBtnClick", function() {
			return dom.bodyDom.trigger("dropboxChooseShow");
		});
		dom.bodyDom.bind("fileInputSetSrcFormats", function(e, formats) {
			return dom.srcFormats(formats);
		});
		dom.bodyDom.bind("fileInputSetMultiselect", function(e, multi) {
			return dom.multiselect(multi);
		});
		dom.bodyDom.bind("inputFilesSelected dragDropFilesSelected", function(e, files) {
			return _this.localFilesSelected(dom, files);
		});
		dom.bodyDom.bind("gdriveFilesSelected dropboxFilesSelected", function(e, files) {
			return _this.remoteFilesSelected(dom, files);
		});
		dom.bodyDom.bind("urlFileSelected", function(e, url) {
			return _this.remoteFilesSelected(dom, [{
				url: url
			}]);
		});
		dom.bind("restartBtnClick", function() {
			return Utils.reloadPage();
		});
	};
	FileInput.localFilesSelected = function(dom, files) {
		User.dataPro().done(function(userData) {
			if(userData.conversionDelay === 0) {
				dom.bodyDom.trigger("localFilesSelected", files);
			} else {
				dom.bodyDom.trigger("conversionDelay", userData.conversionDelay, files[0].name);
			}
		});
	};
	FileInput.remoteFilesSelected = function(dom, files) {
		User.dataPro().done(function(userData) {
			if(userData.conversionDelay === 0) {
				dom.bodyDom.trigger("remoteFilesSelected", files);
			} else {
				dom.bodyDom.trigger("conversionDelay", userData.conversionDelay, files[0].fileName);
			}
		});
	};
	return FileInput;
}());
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
var Token = (function() {
	function Token() {}
	Token.createFn = function(token) {
		return function() {
			return $.Deferred().resolve(token).promise();
		};
	};
	return Token;
}());
var Cara = (function() {
	function Cara() {}
	Cara.convert = function(fles, multi, cancelPro, dstFormat, caraInfo, params, thumbnailQueue, retryCount) {
		var _this_1 = this;
		if(params === void 0) {
			params = null;
		}
		if(thumbnailQueue === void 0) {
			thumbnailQueue = false;
		}
		if(retryCount === void 0) {
			retryCount = 0;
		}
		params = jQuery.extend({}, params);
		return $.when(fles[0].getFormatPro(), caraInfo.tokenProFn()).then(function(srcFormat, token) {
			DataLayerPush.conversionStart(srcFormat, dstFormat);
			return _this_1.request(fles, multi, cancelPro, caraInfo.domain, caraInfo.convertPath, srcFormat, dstFormat, caraInfo.apiKey, token, null, params, thumbnailQueue).then(null, function(fileName, errXhr) {
				if(cancelPro.state() === "pending" && errXhr.status >= 500) {
					if(srcFormat === "pdf") {
						DataLayerPush.conversionFixPdf(srcFormat, dstFormat);
						return _this_1.request(fles, multi, cancelPro, caraInfo.domain, caraInfo.convertPath, srcFormat, "repair", caraInfo.apiKey, token, null, params, thumbnailQueue).then(function(f) {
							return _this_1.request(f, multi, cancelPro, caraInfo.domain, caraInfo.convertPath, srcFormat, dstFormat, caraInfo.apiKey, token, null, params, thumbnailQueue);
						}, function(fileName, errXhr) {
							if(errXhr.responseJSON && errXhr.responseJSON["Code"] === 5003) {
								return _this_1.pass(fileName, fles, multi, cancelPro, dstFormat, caraInfo, params, thumbnailQueue);
							}
							return $.Deferred().reject(fileName, errXhr).promise();
						});
					} else if(errXhr.responseJSON && errXhr.responseJSON["Code"] === 5003) {
						return _this_1.pass(fileName, fles, multi, cancelPro, dstFormat, caraInfo, params, thumbnailQueue);
					} else if(errXhr.status === 503 && retryCount < 3) {
						var d_1 = $.Deferred();
						var _this_2 = _this_1;
						retryCount++;
						setTimeout(function() {
							d_1.resolve(_this_2.convert(fles, multi, cancelPro, dstFormat, caraInfo, params, thumbnailQueue, retryCount));
						}, retryCount < 3 ? 5000 : 10000);
						return d_1.promise();
					} else if(Utils.isMsFormat(srcFormat)) {
						DataLayerPush.conversionFixOo(srcFormat, dstFormat);
						return _this_1.request(fles, multi, cancelPro, caraInfo.domain, caraInfo.convertPath, srcFormat, dstFormat, caraInfo.apiKey, token, "OpenOfficeToPdf", params, thumbnailQueue);
					}
				}
				return $.Deferred().reject(fileName).promise();
			});
		});
	};
	Cara.pass = function(fileName, fles, multi, cancelPro, dstFormat, caraInfo, params, thumbnailQueue) {
		var _this_1 = this;
		if(params === void 0) {
			params = null;
		}
		if(thumbnailQueue === void 0) {
			thumbnailQueue = false;
		}
		return Utils.passDlgShow(fileName, params["Password"]).then(function(pass) {
			params["Password"] = pass;
			return _this_1.convert(fles, multi, cancelPro, dstFormat, caraInfo, params, thumbnailQueue);
		}, function() {
			return $.Deferred().reject(fileName).promise();
		});
	};
	Cara.request = function(fles, multi, cancelPro, caraDomainName, convertPath, srcFormat, dstFormat, apiKey, token, converter, params, thumbnailQueue) {
		var _this_1 = this;
		if(converter === void 0) {
			converter = null;
		}
		return User.dataPro().then(function(authStatus) {
			if(authStatus.stamp) {
				params = params || {};
				params["stamp"] = "true";
			}
			var job = function() {
				return Cara.createRequestDto(fles, multi, cancelPro, srcFormat).then(function(reqDto) {
					var xhr = $.ajax({
						method: "POST",
						url: "" + caraDomainName + convertPath + srcFormat + "/to/" + dstFormat + (converter ? "/converter/" + converter : "") + "?ApiKey=" + apiKey + "&Token=" + token + "&StoreFile=true" + (params ? "&" + $.param(params) : ""),
						data: JSON.stringify(reqDto),
						contentType: "application/json"
					});
					cancelPro.fail(function(m) {
						return xhr.abort(m);
					});
					return xhr;
				}).then(function(dto) {
					return fles[0].getSizePro().then(function(srcSize) {
						return dto.Files.map(function(f) {
							return new FleResult(f, caraDomainName, srcSize);
						});
					});
				}, function(errXhr) {
					var reqXhr = _this_1;
					DataLayerPush.conversionFail(srcFormat, dstFormat);
					return $.Deferred(function(def) {
						fles[0].getNamePro().done(function(fileName) {
							return def.reject(fileName, errXhr, reqXhr);
						});
					});
				});
			};
			_this_1.thumbnailQueues = _this_1.thumbnailQueues || [$.when(), $.when(), $.when(), $.when()];
			_this_1.conversionQueues = _this_1.conversionQueues || [$.when(), $.when(), $.when(), $.when()];
			var queue = thumbnailQueue ? _this_1.thumbnailQueues : _this_1.conversionQueues;
			return Cara.enqueueJob(job, cancelPro, queue).promise();
		});
	};
	Cara.createRequestDto = function(fles, multi, cancelPro, srcFormat) {
		return $.when.apply(null, fles.map(function(f) {
			return f.getFileIdDef();
		})).then(Utils.argsToArr).then(function(ids) {
			if(cancelPro.state() !== "pending") return $.Deferred().reject("Canceled");
			var params;
			if(srcFormat === "web") {
				params = [{
					Name: "Url",
					Value: ids[0]
				}, {
					Name: "ConversionDelay",
					Value: 5
				}, {
					Name: "LoadLazyContent",
					Value: "true"
				}, {
					Name: "ViewportWidth",
					Value: 1280
				}];
			} else {
				var dtoFileArr = ids.map(function(u) {
					return({
						Name: null,
						Data: null,
						Id: u
					});
				});
				params = [{
					Name: multi ? "Files" : "File",
					FileValues: multi ? dtoFileArr : null,
					FileValue: multi ? null : dtoFileArr[0],
					Value: null
				}];
			}
			return {
				Parameters: params
			};
		});
	};
	Cara.enqueueJob = function(job, cancelPro, queues) {
		return $.Deferred(function(def) {
			var readyPro = queues.filter(function(q) {
				return q.state() !== "pending";
			}).shift();
			var idx = readyPro ? queues.indexOf(readyPro) : 0;
			var oldPro = queues.splice(idx, 1)[0];
			oldPro.always(function() {
				if(cancelPro.state() === "pending") {
					job().done(function() {
						def.resolve.apply(null, arguments);
					}).fail(function() {
						def.reject.apply(null, arguments);
					});
				} else {
					def.reject("Canceled");
				}
			});
			queues.push(def.promise());
		}).promise();
	};
	return Cara;
}());
var Transform = (function() {
	function Transform() {}
	Transform.do = function(flesPros, rules, cancelPro, caraInfo, cb, userParams) {
		var _this = this;
		return $.Deferred(function(jobDef) {
			var chainStartDef = $.Deferred();
			var pro = chainStartDef.promise();
			if(rules) {
				rules.steps.filter(function(step) {
					return step.conditions.indexOf("default") >= 0 || step.conditions.indexOf(userParams["condition"]) >= 0;
				}).forEach(function(step) {
					return pro = Transform.convertStep(pro, step, cancelPro, caraInfo, userParams);
				});
			}
			pro.progress(function(flesPro, tcs) {
				if(rules.splitResult) {
					flesPro.done(function(fles) {
						fles.forEach(function(fle, idx) {
							var newFlesPro = $.Deferred().resolve([fle]).promise();
							Utils.setIndex(newFlesPro, idx, flesPro);
							cb(newFlesPro);
						});
					});
					flesPro.fail(function() {
						return cb(flesPro);
					});
					flesPro.always(function() {
						if(--tcs.jobCnt < 1) jobDef.resolve();
					});
				} else {
					cb(flesPro);
					if(--tcs.jobCnt < 1) jobDef.resolve();
				}
			});
			var tcs = {
				jobCnt: flesPros.length
			};
			Utils.setIndex(flesPros, _this.transformId++);
			flesPros.forEach(function(flesPro, idx) {
				Utils.setIndex(flesPro, idx, flesPros);
				return chainStartDef.notify(flesPro, tcs);
			});
		});
	};
	Transform.convertStep = function(pro, rulesStep, cancelPro, caraInfo, userParams) {
		return rulesStep.useAll ? Transform.convertMulti(pro, rulesStep, cancelPro, caraInfo, userParams) : Transform.convertSingle(pro, rulesStep, cancelPro, caraInfo, userParams);
	};
	Transform.groupFleByFormat = function(fles) {
		var formatPros = fles.map(function(f) {
			return f.getFormatPro();
		});
		return $.when.apply(null, formatPros).then(Utils.argsToArr).then(function(formats) {
			return formats.reduce(function(groups, format, idx) {
				if(!groups[format]) groups[format] = [];
				groups[format].push(fles[idx]);
				return groups;
			}, {});
		});
	};
	Transform.convertMulti = function(pro, rulesStep, cancelPro, caraInfo, userParams) {
		return $.Deferred(function(newPro) {
			var allFlesPros = [];
			pro.progress(function(flesPro, tcs) {
				Utils.insertByIdx(allFlesPros, flesPro);
				if(allFlesPros.length >= tcs.jobCnt) {
					$.when.apply(null, allFlesPros).then(Utils.argsToArr).then(Utils.flatten).then(function(fles) {
						Transform.groupFleByFormat(fles).done(function(groups) {
							tcs.jobCnt = Object.keys(groups).length;
							var idx = 0;
							for(var format in groups) {
								var groupFles = groups[format];
								var converter = Utils.getTransformConverter(format, rulesStep.converters);
								var newFlesPro = void 0;
								if(converter) {
									if(!converter.bypass) {
										var params = $.extend(converter.parameters, userParams);
										newFlesPro = Cara.convert(groupFles, true, cancelPro, converter.destinationFormat, caraInfo, params);
									} else {
										newFlesPro = $.Deferred().resolve(groupFles).promise();
									}
								} else {
									newFlesPro = groupFles[0].getNamePro().then(function(name) {
										return $.Deferred().reject(name).promise();
									});
								}
								newFlesPro["idx"] = [flesPro["idx"][0], idx++];
								newPro.notify(newFlesPro, tcs);
							}
						});
					}, function(message) {
						var failedPro = $.Deferred().reject(message).promise();
						newPro.notify(failedPro, tcs);
					});
				}
			});
		}).promise();
	};
	Transform.convertSingle = function(pro, rulesStep, cancelPro, caraInfo, userParams) {
		return $.Deferred(function(newDef) {
			pro.progress(function(flesPro, tcs) {
				flesPro.done(function(fles) {
					tcs.jobCnt += fles.length - 1;
					fles.forEach(function(fle, idx) {
						var newFlesPro = Transform.convertFlesPro([fle], rulesStep, cancelPro, caraInfo, userParams);
						Utils.setIndex(newFlesPro, idx, flesPro);
						newDef.notify(newFlesPro, tcs);
					});
				});
				flesPro.fail(function() {
					newDef.notify(flesPro, tcs);
				});
			});
		}).promise();
	};
	Transform.convertFlesPro = function(fles, rulesStep, cancelPro, caraInfo, userParams) {
		return fles[0].getFormatPro().then(function(format) {
			var converter = Utils.getTransformConverter(format, rulesStep.converters);
			if(converter) {
				if(!converter.bypass) {
					var params = $.extend(converter.parameters, userParams);
					return Cara.convert(fles, false, cancelPro, converter.destinationFormat, caraInfo, params);
				}
				return $.Deferred().resolve(fles).promise();
			} else {
				fles.forEach(function(fle) {
					return fle.cancel(jQuery('body').data('js-label-unable-to-find-converter'));
				});
				return fles[0].getNamePro().then(function(name) {
					return $.Deferred().reject(name).promise();
				});
			}
		});
	};
	Transform.transformId = 0;
	return Transform;
}());
var ResultDom = (function(_super) {
	__extends(ResultDom, _super);

	function ResultDom(bodyDom) {
		var _this = _super.call(this) || this;
		_this.bodyDom = bodyDom;
		_this.elResultContainer = _this.bodyDom.getBody().find(".result-container");
		_this.elDownloadContainer = _this.bodyDom.getBody().find(".download-container");
		_this.elDownloadBtn = _this.elDownloadContainer.find(".download-btn");
		_this.elSaveToDropboxBtn = _this.elDownloadContainer.find(".js-save-to-dropbox-btn");
		_this.elSaveToGdriveBtn = _this.elDownloadContainer.find(".js-save-to-gdrive-btn");
		_this.elRemoveBtn = _this.elDownloadContainer.find(".js-remove-btn");
		_this.elChainBtn = _this.elDownloadContainer.find(".chain-btn");
		_this.elChain = _this.elDownloadContainer.find(".chain");
		_this.elChain.parent().hide();
		_this.elFiles = _this.elResultContainer.find(".files");
		_this.elFiles.on('click', '.file-item', function() {
			return _this.showSidePanelIfUnauthorized();
		});
		_this.elDownloadBtn.on("click", function() {
			_this.trigger("downloadBtnClick");
			_this.showSidePanelIfUnauthorized();
		});
		_this.elSaveToDropboxBtn.on("click", function() {
			return _this.trigger("saveToDropboxBtnClick");
		});
		_this.elRemoveBtn.on("click", function() {
			return _this.trigger("removeBtnClick");
		});
		_this.elChainBtn.on("click", function() {
			return _this.trigger("chainBtnClick");
		});
		$(window).add(_this.bodyDom.elWorkArea).on("scroll resize fileCntChange", function() {
			return _this.getFirstVisibleFileIds().forEach(function(id) {
				return _this.trigger("newVisibleFile", id);
			});
		});
		return _this;
	}
	ResultDom.prototype.showSidePanelIfUnauthorized = function() {
		if(!this.bodyDom.isAuth()) {
			var premiumPanel = jQuery('#get-premium');
			premiumPanel.find('.js-message').addClass('hidden').find('span').html();
			this.bodyDom.showSidePanel(premiumPanel);
		}
	};
	ResultDom.prototype.show = function(showAddFile) {
		this.bodyDom.getBody().addClass('display-result');
		this.elResultContainer.removeClass("hidden");
		if(!showAddFile) jQuery(".FiC").fadeOut();
	};
	ResultDom.prototype.toggleJobSpinner = function(show) {
		this.elFiles.find(".job-spinner").toggleClass("hidden", !show);
	};
	ResultDom.prototype.removeSpinner = function(id) {
		$("#" + id).remove();
	};
	ResultDom.prototype.toggleDownloadContainer = function(visible) {
		this.elDownloadContainer.toggleClass("hidden", !visible);
	};
	ResultDom.prototype.setDownloadUrl = function(url, fileName) {
		var _this = this;
		this.elDownloadContainer.removeClass("hidden");
		this.bodyDom.animateManagerContainer(this.elDownloadContainer, true);
		this.elDownloadBtn.attr("href", url);
		if(gapi) {
			gapi.savetodrive.render("gdrive-btn", {
				src: url,
				filename: fileName,
				sitename: "freepdfconvert.com"
			});
			this.elSaveToGdriveBtn.removeClass("disabled");
		}
		if(typeof Dropbox !== 'undefined') this.configureDropbox(url, fileName);
		else DropboxIntegration.loadLib().done(function() {
			return _this.configureDropbox(url, fileName);
		});
	};
	ResultDom.prototype.configureDropbox = function(url, fileName) {
		this.bind("saveToDropboxBtnClick", function() {
			return Dropbox.save(url, fileName, {});
		});
		this.elSaveToDropboxBtn.removeClass("disabled");
	};
	ResultDom.prototype.showAd = function() {
		$(".result-container-ad").removeClass("hidden");
	};
	ResultDom.prototype.addFile = function(tFleId, pos) {
		this.elFiles.removeClass("hidden");
		var elFile = $(this.elFiles.data("template-file"));
		elFile.attr("id", tFleId);
		Utils.insertElement(this.elFiles, elFile, pos);
		$(window).trigger("fileCntChange");
	};
	ResultDom.prototype.setFileInfo = function(tFleId, url, name, info) {
		var _this = this;
		var elTFle = this.elFiles.find("#" + tFleId);
		elTFle.attr("href", url);
		elTFle.attr("title", name);
		elTFle.find(".file-name").text(name);
		elTFle.find(".file-info").html(info);
		elTFle.on("click", function() {
			return _this.trigger("downloadThumbClick");
		});
		elTFle.find(".download-icon").removeClass("hidden");
		elTFle.addClass("done");
	};
	ResultDom.prototype.setFileError = function(tFleId, name, info) {
		if(info === void 0) {
			info = null;
		}
		this.hideSpinnerPlaceholder(tFleId);
		var elTFle = this.elFiles.find("#" + tFleId);
		elTFle.addClass("error");
		elTFle.find(".placeholder .spinner").addClass("hidden");
		elTFle.find(".placeholder").addClass("img-failure");
		elTFle.attr("title", name);
		elTFle.find(".file-name").text(name);
		elTFle.find(".file-info").text(info);
	};
	ResultDom.prototype.setFileThumbnail = function(tFleId, url) {
		this.hideSpinnerPlaceholder(tFleId);
		var els = this.elFiles.find("#" + tFleId + " .file-item-main").children();
		var elImg = els.find(".thumbnail");
		elImg.attr("src", url);
		elImg.attr("onerror", "this.src='" + url + "';");
		els.not('.download-icon').addClass("hidden");
		elImg.removeClass("hidden").parent().removeClass("hidden");
	};
	ResultDom.prototype.hideSpinnerPlaceholder = function(tFleId) {
		var elTFle = this.elFiles.find("#" + tFleId);
		elTFle.find(".placeholder .spinner").addClass("hidden");
		elTFle.find(".placeholder").addClass("ready");
	};
	ResultDom.prototype.setFileDefaultThumbnail = function(tFleId, format) {
		this.hideSpinnerPlaceholder(tFleId);
		this.elFiles.find("#" + tFleId + " .file-item-main").children().addClass("hidden").filter(".placeholder, .download-icon").removeClass("hidden").filter(".placeholder").addClass("img-file-" + format);
	};
	ResultDom.prototype.getFirstVisibleFileIds = function() {
		return this.elFiles.find(".file-item:not(.error)").filter(function(i, e) {
			return !$(e).prop("thumbnailGenerated") && Utils.elIsInViewport(e);
		}).map(function(i, e) {
			$(e).prop("thumbnailGenerated", true);
			return $(e).attr("id");
		}).get();
	};
	ResultDom.prototype.addChainFormat = function(format, url, cssClass) {
		var elConverter = $(this.elChain.data("template-converter")).attr("href", url).attr("title", format);
		elConverter.find('.icon').addClass("img-" + cssClass);
		elConverter.find('.text').text(format);
		this.elChain.append(elConverter);
		this.elChain.parent().show();
	};
	ResultDom.prototype.clearChainFormats = function() {
		this.elChain.empty().parent().hide();
	};
	return ResultDom;
}(Dom));
var Result = (function() {
	function Result() {}
	Result.show = function(dom, context, stateId) {
		var _this = this;
		dom.show(!context.convMeta.editor.visible);
		dom.bodyDom.trigger("fileInputSetSrcFormats", Utils.getSrcFormats(context.convMeta));
		dom.bodyDom.trigger("fileInputSetMultiselect", true);
		this.stateId = stateId;
		dom.bind("removeBtnClick", function() {
			return context.deleteAll().then(function() {
				if(_this.stateId) $.ajax({
					method: "DELETE",
					url: dom.bodyDom.getCaraDomainName() + "/d/" + _this.stateId
				}).always(function() {
					Utils.reloadPage();
				});
				else Utils.reloadPage();
			});
		});
		dom.bind("newVisibleFile", function(e, fileId) {
			var tFle = context.getTfleById(fileId);
			if(tFle) {
				tFle.getThumbnailUrlPro().then(function(url) {
					return Utils.preloadImage(url);
				}).then(function(url) {
					return dom.setFileThumbnail(fileId, url);
				}, function() {
					return tFle.getFlesPro().then(function(fles) {
						return fles[0].getFormatPro();
					}).then(function(ext) {
						return dom.setFileDefaultThumbnail(fileId, ext);
					});
				});
			}
		});
		context.getTfles().forEach(function(tFle, pos) {
			dom.addFile(tFle.getId(), pos);
			tFle.getFlesPro().then(function(fles) {
				$.when(fles[0].getUrlPro(), fles[0].getNamePro(), _this.fileInfo(fles[0], context.getConvMeta().fileInfo)).done(function(url, name, info) {
					return dom.setFileInfo(tFle.getId(), url, name, info);
				});
			}).fail(function(name) {
				return _this.addFailedFile(dom, name, tFle.getId());
			});
		});
		context.getAddingPro().progress(function(jobPro) {
			if(jobPro.state() === "pending") {
				dom.toggleJobSpinner(true);
				var jobFinished = function() {
					dom.toggleJobSpinner(context.getJobCnt() > 0);
					if(context.getFlesPros().length === 0 && !context.convMeta.editor.addFiles) {
						dom.bodyDom.showError();
					}
					_this.filesChanged(dom, context);
				};
				jobPro.then(jobFinished, jobFinished);
			} else _this.filesChanged(dom, context);
		});
		context.bind("fileAdded", function(e, tFle, pos) {
			dom.addFile(tFle.getId(), pos);
			tFle.getFlesPro().done(function(fles) {
				$.when(fles[0].getUrlPro(), fles[0].getNamePro(), _this.fileInfo(fles[0], context.getConvMeta().fileInfo)).done(function(url, name, info) {
					return dom.setFileInfo(tFle.getId(), url, name, info);
				});
			}).fail(function(name) {
				return _this.addFailedFile(dom, name, tFle.getId());
			});
		});
		context.bind("fileNotAccepted", function(e, name) {
			return _this.addFailedFile(dom, name);
		});
		if(stateId) this.filesChanged(dom, context, stateId);
	};
	Result.addFailedFile = function(dom, name, tFleId) {
		if(tFleId === void 0) {
			tFleId = null;
		}
		if(!tFleId) {
			tFleId = Math.random().toString(36).substring(2);
			dom.addFile(tFleId, 1);
		}
		dom.setFileError(tFleId, name, dom.bodyDom.labelConversionFailed);
	};
	Result.fileInfo = function(fle, text) {
		var srcSize = fle["getSrcSize"]();
		return(text && srcSize) ? fle.getSizePro().then(function(size) {
			var dif = srcSize - size;
			var reducePerc = Math.round(dif * 100 / (srcSize ? srcSize : 1));
			return text.replace("{{reducePerc}}", reducePerc.toString()).replace("{{srcSize}}", Utils.formatBytes(srcSize)).replace("{{size}}", Utils.formatBytes(size));
		}) : $.Deferred().resolve(null).promise();
	};
	Result.persistCtx = function(ctx) {
		return ctx.getSuccessFlesPro().then(function(fles) {
			if(Array.isArray(fles)) {
				return fles.map(function(fle) {
					return $.when(fle.getFileIdDef(), fle.getNamePro(), fle.getSizePro()).then(function(fileId, name, size) {
						return {
							FileId: fileId,
							FileName: name,
							FileSize: size
						};
					});
				});
			}
		}).then(function(proArr) {
			var idPro = $.when.apply(null, proArr).then(Utils.argsToArr).then(function(files) {
				return Utils.persist({
					convMeta: ctx.convMeta,
					files: files
				}, ctx.caraInfo.domain);
			});
			idPro.done(function(id) {
				return window.history.pushState(null, null, "#cid=" + id);
			});
			return idPro;
		});
	};
	Result.setChainFormats = function(dom, context, stateId) {
		context.getFormatsPro().then(function(srcFormats) {
			if(srcFormats.length) {
				Utils.getMetas(dom.bodyDom.getChainingInfoPath(), srcFormats, "chain", context.convMeta.id).then(function(metas) {
					dom.clearChainFormats();
					var otherActionsContainer = jQuery('.download-container .other-actions .js-chain-actions');
					if(!metas.length) otherActionsContainer.hide();
					else {
						metas.forEach(function(meta) {
							return dom.addChainFormat(meta.name, dom.bodyDom.getLocalizationPrefix() + "/" + meta.id + "#cid=" + stateId + "&statePanel=chain", meta.cssClass);
						});
						otherActionsContainer.show();
					}
				});
			}
		});
	};
	Result.filesChanged = function(dom, context, stateId) {
		var _this = this;
		var def;
		if(!this.zipPro || this.zipPro.state() !== 'pending') {
			def = $.Deferred();
			this.zipPro = def.promise();
		}
		this.zipPro = this.zipPro.then(function() {
			return(stateId ? $.Deferred().resolve(stateId) : _this.persistCtx(context));
		}).then(function(sid) {
			_this.stateId = sid;
			_this.setChainFormats(dom, context, sid);
			context.getFleCount().then(function(cnt) {
				if(cnt === 1) {
					context.getFirstFle().then(function(f) {
						return $.when(f.getUrlPro(), f.getNamePro());
					}).done(function(url, fileName) {
						return dom.setDownloadUrl(url, fileName);
					});
				} else {
					dom.setDownloadUrl(dom.bodyDom.getCaraDomainName() + "/z?id=" + sid, "result.zip");
				}
				jQuery('.start-over').addClass('show');
				if(!dom.bodyDom.isAuth()) dom.showAd();
			});
			$.post(dom.bodyDom.getTokenConvertedPath()).always(function() {
				return User.refresh();
			});
			DataLayerPush.conversionSuccess();
			return sid;
		});
		def === null || def === void 0 ? void 0 : def.resolve(null);
	};
	return Result;
}());
var Prices = (function() {
	function Prices() {}
	Prices.show = function(dom, vendorId, popup) {
		if(popup === void 0) {
			popup = false;
		}
		if(dom.bodyDom.isAction("membership") && !dom.pricesLoaded) {
			this.initPrices(dom, vendorId);
		}
		if(jQuery('.execute-checkout').length && Utils.getParameterByName('checkout_hash')) {
			orderCompleted(dom, Utils.getParameterByName('checkout_hash'));
		}
		window["auth"] = function(payment, retry) {
			if(retry === void 0) {
				retry = 0;
			}
			orderCompleted(dom, payment.checkout.id);
		};
	};
	Prices.initPrices = function(dom, vendorId) {
		var productIds = [];
		jQuery('.js-price').each(function() {
			productIds.push(jQuery(this).data('product-id'));
		});
		$.ajax({
			url: "https://" + dom.paddlePrefix + "checkout.paddle.com/api/2.0/prices",
			dataType: 'jsonp',
			data: {
				product_ids: productIds.join()
			},
			success: function(data) {
				var currencySymbol;
				var lowestPrice;
				data.response.products.forEach(function(product) {
					currencySymbol = product.currency;
					var currentElPrice = dom.elPrice.filter("[data-product-id=\"" + product.product_id + "\"]");
					if(currency_symbols[product.currency] !== undefined) currencySymbol = currency_symbols[product.currency];
					var price = product.price.net;
					if(product.subscription && product.subscription.interval == 'year') {
						lowestPrice = currencySymbol + Math.round((price / 12 * 100) / 100);
						currentElPrice.find('.amount').text(currencySymbol + price);
						var regularPrice = data.response.products.find(function(x) {
							return x.subscription && x.subscription.interval == 'month';
						}).price.net * 12;
						currentElPrice.find('.amount').append("<span class=\"discount\">" + currencySymbol + Math.round((regularPrice * 100) / 100) + "</span>");
					} else currentElPrice.find('.amount').text(currencySymbol + price);
				});
				dom.elLowestPriceText.html(dom.elLowestPriceText.data('text').replace('${amount}', lowestPrice));
			}
		});
		$.getScript("https://cdn.paddle.com/paddle/paddle.js").done(function() {
			if(dom.paddlePrefix.indexOf('sandbox') > -1) Paddle.Environment.set('sandbox');
			Paddle.Setup({
				vendor: vendorId,
				eventCallback: function(eventData) {
					DataLayerPush.orders.checkoutEvent(eventData.event.toString(), eventData.eventData.product.id);
				}
			});
			dom.bind("priceClick", function(e, productId, url) {
				var authStatus = window["userData"];
				if(url.indexOf("?") === -1) url = url + "?";
				if(authStatus && authStatus.email) url = url + ("&guest_email=" + authStatus.email);
				var passthrough = "ProductId=" + productId;
				if(authStatus && authStatus.userid) passthrough = passthrough + ";UserId=" + authStatus.userid;
				url = url + "&" + encodeURIComponent("passthrough=" + passthrough);
				DataLayerPush.orders.orderClick(productId);
				Paddle.Checkout.open({
					override: url,
					successCallback: "auth"
				});
			});
		});
	};
	Prices.setPriceWithDiscount = function(dom) {
		var productId = dom.elDiscountedPrice.data('product-id');
		$.ajax({
			url: "https://" + dom.paddlePrefix + "checkout.paddle.com/api/2.0/prices",
			dataType: 'jsonp',
			data: {
				product_ids: productId
			},
			success: function(data) {
				data.response.products.forEach(function(product) {
					var currencySymbol = product.currency;
					if(currency_symbols[product.currency] !== undefined) currencySymbol = currency_symbols[product.currency];
					dom.elDiscountedPrice.text(currencySymbol + Math.round((product.price.net - (product.price.net * 0.3)) * 100) / 100);
				});
			}
		});
	};
	return Prices;
}());

function orderCompleted(dom, hash, retry) {
	if(retry === void 0) {
		retry = 0;
	}
	if(retry < 100) {
		retry == 0 ? dom.bodyDom.showToast(dom.processingLabel, "warning", -1) : null;
		var body = jQuery('body');
		var checkoutExistPath_1 = body.data('checkout-exist-path');
		var checkoutCompletePath_1 = body.data('checkout-complete-path');
		var transactionId = hash;
		checkoutCompletePath_1 = checkoutCompletePath_1 + ("?id=" + transactionId);
		setTimeout(function() {
			$.get(checkoutExistPath_1 + ("?id=" + hash)).then(function(payment) {
				console.log(payment);
				if(window.dataLayer) window.dataLayer.push({
					"event": "Purchase",
					"transactionId": payment.id,
					"transactionAffiliation": payment.storeType,
					"transactionTotal": payment.price,
					"transactionTax": 0,
					"transactionShipping": 0,
					"transactionProducts": [{
						"sku": payment.userId,
						"name": payment.productName,
						"category": payment.productType,
						"price": payment.price,
						"quantity": 1
					}],
					"eventCallback": completeCheckout(dom, checkoutCompletePath_1)
				});
				completeCheckout(dom, checkoutCompletePath_1);
			}, function() {
				return setTimeout(function() {
					console.log("RETRY!!!!!!!!!!!!");
					orderCompleted(dom, hash, ++retry);
				}, 1000);
			});
		}, 5000);
	}
}

function completeCheckout(dom, path) {
	window.location.href = path;
}
var PricesDom = (function(_super) {
	__extends(PricesDom, _super);

	function PricesDom(bodyDom) {
		var _this = _super.call(this) || this;
		_this.pricesLoaded = false;
		_this.bodyDom = bodyDom;
		_this.paddlePrefix = _this.bodyDom.getBody().data("paddle-prefix");
		_this.elPricesContainer = _this.bodyDom.getBody().find(".prices-container");
		_this.elPrice = _this.elPricesContainer.find(".js-price");
		_this.processingLabel = _this.bodyDom.getBody().data("js-label-processing");
		_this.elDiscountedPrice = _this.bodyDom.getBody().find('.js-discounted-price');
		_this.elLowestPriceText = _this.bodyDom.getBody().find('.js-lowest-price-text');
		if(_this.elPrice.find('.amount').text().length > 0) {
			_this.pricesLoaded = true;
		}
		return _this;
	}
	PricesDom.prototype.getProductId = function() {
		return this.elPrice.map(function(i, e) {
			return $(e).data("product");
		}).get();
	};
	PricesDom.prototype.setPrice = function(product, price) {
		this.elPrice.filter("[data-product='" + product + "']").find(".ammount").text(price);
	};
	return PricesDom;
}(Dom));
var ConverterSelectorDom = (function(_super) {
	__extends(ConverterSelectorDom, _super);

	function ConverterSelectorDom(bodyDom) {
		var _this = _super.call(this) || this;
		_this.bodyDom = bodyDom;
		_this.elDstFormatContainer = _this.bodyDom.getBody().find(".converter-selector-container");
		_this.elConverterPanelContainer = _this.bodyDom.getBody().find(".converter-panel-container");
		_this.elFiles = _this.elDstFormatContainer.find(".files");
		_this.elConverters = _this.elDstFormatContainer.find(".converters");
		_this.elDropDownMenu = _this.elDstFormatContainer.find(".menu-dropdown");
		_this.elDstFormatContainer.on("click", ".converter-btn", function(e) {
			return _this.trigger("formatSelected", $(e.currentTarget).data("id"));
		});
		_this.elStickyPanel = _this.elDstFormatContainer.find('.sticky-panel');
		return _this;
	}
	ConverterSelectorDom.prototype.show = function() {
		this.elDstFormatContainer.removeClass("hidden");
		this.elConverterPanelContainer.removeClass("hidden");
		this.elStickyPanel.removeClass('hidden');
		this.bodyDom.animateManagerContainer(this.elStickyPanel, true);
		this.bodyDom.elGrayOverlay.removeClass('hidden');
	};
	ConverterSelectorDom.prototype.hide = function() {
		var _this = this;
		this.bodyDom.animateManagerContainer(this.elStickyPanel, false);
		this.bodyDom.elGrayOverlay.addClass('hidden');
		this.elFiles.hide();
		setTimeout(function() {
			_this.elConverterPanelContainer.addClass("hidden");
			_this.elDstFormatContainer.addClass("hidden");
			_this.elStickyPanel.addClass('hidden');
		}, 500);
	};
	ConverterSelectorDom.prototype.addFile = function(tFleId, fileName) {
		var elFile = $(this.elFiles.data("template-file"));
		elFile.attr("id", tFleId);
		elFile.find(".file-name").text(fileName);
		this.elFiles.append(elFile);
	};
	ConverterSelectorDom.prototype.setFileThumbnail = function(tFleId, url) {
		var els = this.elFiles.find("#" + tFleId + " .file-item-main").children();
		var elImg = els.find(".thumbnail");
		elImg.attr("src", url);
		els.addClass("hidden");
		elImg.removeClass("hidden").parent().removeClass("hidden");
	};
	ConverterSelectorDom.prototype.toggleFileSpinner = function(tFleId, visible) {
		var elPlaceholder = this.elFiles.find("#" + tFleId + " .file-item-main .placeholder");
		elPlaceholder.toggleClass("img-file", !visible);
		elPlaceholder.children(".spinner").toggleClass("hidden", !visible);
	};
	ConverterSelectorDom.prototype.empty = function() {
		this.elConverters.empty();
	};
	ConverterSelectorDom.prototype.addFormat = function(id, name, cssClass) {
		if(this.elConverters.children().length < 4) {
			var btnHtml = this.elConverters.data("template-btn").replace(/{{id}}/g, id).replace(/{{name}}/g, name).replace(/{{class}}/g, cssClass ? cssClass : "file");
			this.elConverters.append(btnHtml);
		} else {
			var btnHtml = this.elDropDownMenu.data("template-btn").replace(/{{id}}/g, id).replace(/{{name}}/g, name).replace(/{{class}}/g, cssClass ? cssClass : "file");
			this.elDropDownMenu.append(btnHtml);
		}
	};
	return ConverterSelectorDom;
}(Dom));
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
