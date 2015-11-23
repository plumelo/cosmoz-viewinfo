/*global Cosmoz, Polymer, ResizeSensor, window */

if (typeof Cosmoz === 'undefined') {
	var Cosmoz = {};
}

(function () {

	"use strict";

	var
		viewInfoInstances = [],
		sharedViewInfo = {
			desktop: false,
			effects: 10,
			height: 0,
			landscape: false,
			mobile: false,
			portrait: true,
			tablet: false,
			width: 0
		};

	/**
	 * Behavior to inherit the viewInfo property with device and viewport info
	 @polymerBehavior
	 */
	Cosmoz.ViewInfoBehavior = {
		properties: {
			/**
			 * viewInfo object
			 * {
			 * 	desktop: Boolean,
			 * 	effects: Number (1-10),
			 * 	height: Number,
			 * 	landscape: Boolean,
			 * 	mobile: Boolean,
			 * 	portrait: Boolean,
			 * 	tablet: Boolean,
			 * 	width: Number
			 * }
			 */
			viewInfo: {
				type: Object,
				notify: true
			}
		},

		attached: function () {
			viewInfoInstances.push(this);
			// Needed to make template views trigger on load and not only on resize
			this.viewInfo = sharedViewInfo;
		},

		detached: function () {
			var i = viewInfoInstances.indexOf(this);
			if (i >= 0) {
				viewInfoInstances.splice(i, 1);
			}
		}
	};

	Polymer({
		is: 'cosmoz-viewinfo',
		properties: {
			/**
			 * Level of effects to use (0-10)<br/>
			 * NOT_IN_USE
			 */
			effects: {
				type: Number,
				value: 10,
				observer: '_effectsChanged'
			},
			/**
			 * Width breakpoint for mobile<br/>
			 * https://www.google.com/design/spec/layout/adaptive-ui.html#adaptive-ui-breakpoints
			 */
			mobileBreakpoint: {
				type: Number,
				value: 600
			},
			/**
			 * Width breakpoint for tablet<br/>
			 * https://www.google.com/design/spec/layout/adaptive-ui.html#adaptive-ui-breakpoints
			 */
			tabletBreakpoint: {
				type: Number,
				value: 960
			},
			/**
			 * Minimum delay between each viewinfo-resize event (ms)
			 */
			throttleTimeout: {
				type: Number,
				value: 250
			},
			/**
			 * Placeholder for ResizeSensor
			 */
			_sensor: {
				type: Object
			},
			/**
			 * Whether we're currently throttling resize-events
			 */
			_throttling: {
				type: Boolean,
				value: false
			}
		},
		attached: function () {
			this._sensor = new ResizeSensor(this, this._onResize.bind(this));
			this._onResize();
		},
		_effectsChanged: function () {
			sharedViewInfo.effects = this.effects;
			this._notifyInstances();
		},
		/**
		 * Loop over registered ViewInfoBehavior components and notify of changes<br/>
		 * TODO: Don't reset the viewInfo property, but rather notify specific properties
		 */
		_notifyInstances: function () {
			viewInfoInstances.forEach(function (instance) {
				if (!instance) {
					return;
				}
				instance.set('viewInfo', {});
				instance.set('viewInfo', sharedViewInfo);
			});
		},
		/**
		 * Called when ResizeSensor detects a resize, throttles `viewinfo-resize` events
		 */
		_onResize: function () {
			var
				update = this._updateViewSize(),
				throttleFunction;

			if (update === undefined) {
				return;
			}

			throttleFunction = function () {
				viewInfoInstances.forEach(function (element) {
					// Only fire on visible elements, offsetParent should be null for hidden
					// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
					if (element.offsetParent !== null) {
						element.fire('viewinfo-resize', {
							bigger: update
						});
					}
				});
				this._throttling = false;
			}.bind(this);

			if (!this._throttling) {
				window.setTimeout(throttleFunction, this.throttleTimeout);
				this._throttling = true;
			}
		},
		/**
		 * Recalculate viewInfo and updated sharedViewInfo accordingly
		 */
		_updateViewSize: function () {
			var
				oldWidth = sharedViewInfo.width,
				width = this.clientWidth || this.offsetWidth || this.scrollWidth;

			sharedViewInfo.height = this.clientHeight || this.offsetHeight || this.scrollHeight;

			sharedViewInfo.portrait = sharedViewInfo.height > width;
			sharedViewInfo.landscape = !sharedViewInfo.portrait;

			if (oldWidth === width) {
				return;
			}

			if (width <= this.mobileBreakpoint) {
				sharedViewInfo.mobile = true;
				sharedViewInfo.tablet = false;
			} else if (width <= this.tabletBreakpoint) {
				sharedViewInfo.mobile = false;
				sharedViewInfo.tablet = true;
			} else {
				sharedViewInfo.mobile = false;
				sharedViewInfo.tablet = false;
			}

			sharedViewInfo.desktop = !sharedViewInfo.mobile && !sharedViewInfo.tablet;
			sharedViewInfo.width = width;

			this._notifyInstances();

			return oldWidth < width;
		}
	});
}());