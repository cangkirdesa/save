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
String.prototype.getFileExtension = function() {
	return this.split(".").pop().toLowerCase();
};
String.prototype.isUrl = function() {
	return this.toLowerCase().indexOf("http") === 0;
};
String.prototype.isDataUrl = function() {
	return this.toLowerCase().indexOf("data:") === 0;
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
	Utils.reloadPage = function(removeHash) {
		if(removeHash === void 0) {
			removeHash = true;
		}
		if(removeHash) location.hash = "";
		location.reload();
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
		jQuery('.GrT').click(function() {
			$(this).parent().toggleClass('open');
		});
		$('.JScMM, .UsM .MnI').click(function() {
			return _this_1.closeTopNav(_this.elTopNavContainer);
		});
		$(document).keyup(function(e) {
			if(e.key === "Escape") {
				$('.modal-overlay:not(.hidden)').addClass('hidden');
				if(!_this.elTopNavContainer.hasClass('hidden')) {
					_this.elTopNavContainer.addClass('hidden');
				}
			}
		});
		return _this_1;
	}
	BodyDom.prototype.closeTopNav = function(menuContainer) {
		menuContainer.addClass('hidden');
		$('.JStV').removeClass('active');
	};
	return BodyDom;
}(Dom));
var Orders = (function() {
	function Orders() {}
	return Orders;
}());
var DataLayerPush = (function() {
	function DataLayerPush() {}
	DataLayerPush.orders = Orders;
	return DataLayerPush;
}());
var ConvertCounter = new function() {
	var originCount = 90000000;
	var ratePerDay = (2000000 / 30);
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
