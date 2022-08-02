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
	BodyDom.prototype.closeTopNav = function(menuContainer) {
		menuContainer.addClass('hidden');
		$('.JStV').removeClass('active');
	};
	BodyDom.prototype.getBody = function() {
		return this.elBody;
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
	BodyDom.prototype.showSidePanel = function(elem) {
		jQuery('.side-panel.open').removeClass('open');
		elem.css('width', '').addClass('open');
		if(this.elBody.hasClass('work-in-progress') && window.innerWidth > 930) this.elWorkArea.css('width', 'calc(100% - 277px)');
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
	BodyDom.prototype.isAction = function(action) {
		return this.elBody.hasClass(action);
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
