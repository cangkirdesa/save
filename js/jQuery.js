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
