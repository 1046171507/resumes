function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/*js/OrbitControls.js*/
var _OrbitControls_module = function () {
		/**
   * @author qiao / https://github.com/qiao
   * @author mrdoob / http://mrdoob.com
   * @author alteredq / http://alteredqualia.com/
   * @author WestLangley / http://github.com/WestLangley
   * @author erich666 / http://erichaines.com
   */

		// This set of controls performs orbiting, dollying (zooming), and panning.
		// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
		//
		//    Orbit - left mouse / touch: one-finger move
		//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
		//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move

		THREE.OrbitControls = function (object, domElement) {

				this.object = object;

				this.domElement = domElement !== undefined ? domElement : document;

				// Set to false to disable this control
				this.enabled = true;

				// "target" sets the location of focus, where the object orbits around
				this.target = new THREE.Vector3();

				// How far you can dolly in and out ( PerspectiveCamera only )
				this.minDistance = 0;
				this.maxDistance = Infinity;

				// How far you can zoom in and out ( OrthographicCamera only )
				this.minZoom = 0;
				this.maxZoom = Infinity;

				// How far you can orbit vertically, upper and lower limits.
				// Range is 0 to Math.PI radians.
				this.minPolarAngle = 0; // radians
				this.maxPolarAngle = Math.PI; // radians

				// How far you can orbit horizontally, upper and lower limits.
				// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
				this.minAzimuthAngle = -Infinity; // radians
				this.maxAzimuthAngle = Infinity; // radians

				// Set to true to enable damping (inertia)
				// If damping is enabled, you must call controls.update() in your animation loop
				this.enableDamping = false;
				this.dampingFactor = 0.25;

				// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
				// Set to false to disable zooming
				this.enableZoom = true;
				this.zoomSpeed = 1.0;

				// Set to false to disable rotating
				this.enableRotate = true;
				this.rotateSpeed = 1.0;

				// Set to false to disable panning
				this.enablePan = true;
				this.panSpeed = 1.0;
				this.screenSpacePanning = false; // if true, pan in screen-space
				this.keyPanSpeed = 7.0; // pixels moved per arrow key push

				// Set to true to automatically rotate around the target
				// If auto-rotate is enabled, you must call controls.update() in your animation loop
				this.autoRotate = false;
				this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

				// Set to false to disable use of the keys
				this.enableKeys = true;

				// The four arrow keys
				this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

				// Mouse buttons
				this.mouseButtons = { LEFT: THREE.MOUSE.LEFT, MIDDLE: THREE.MOUSE.MIDDLE, RIGHT: THREE.MOUSE.RIGHT };

				// for reset
				this.target0 = this.target.clone();
				this.position0 = this.object.position.clone();
				this.zoom0 = this.object.zoom;

				//
				// public methods
				//

				this.getPolarAngle = function () {

						return spherical.phi;
				};

				this.getAzimuthalAngle = function () {

						return spherical.theta;
				};

				this.saveState = function () {

						scope.target0.copy(scope.target);
						scope.position0.copy(scope.object.position);
						scope.zoom0 = scope.object.zoom;
				};

				this.reset = function () {

						scope.target.copy(scope.target0);
						scope.object.position.copy(scope.position0);
						scope.object.zoom = scope.zoom0;

						scope.object.updateProjectionMatrix();
						scope.dispatchEvent(changeEvent);

						scope.update();

						state = STATE.NONE;
				};

				// this method is exposed, but perhaps it would be better if we can make it private...
				this.update = function () {

						var offset = new THREE.Vector3();

						// so camera.up is the orbit axis
						var quat = new THREE.Quaternion().setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0));
						var quatInverse = quat.clone().inverse();

						var lastPosition = new THREE.Vector3();
						var lastQuaternion = new THREE.Quaternion();

						return function update() {

								var position = scope.object.position;

								offset.copy(position).sub(scope.target);

								// rotate offset to "y-axis-is-up" space
								offset.applyQuaternion(quat);

								// angle from z-axis around y-axis
								spherical.setFromVector3(offset);

								if (scope.autoRotate && state === STATE.NONE) {

										rotateLeft(getAutoRotationAngle());
								}

								spherical.theta += sphericalDelta.theta;
								spherical.phi += sphericalDelta.phi;

								// restrict theta to be between desired limits
								spherical.theta = Math.max(scope.minAzimuthAngle, Math.min(scope.maxAzimuthAngle, spherical.theta));

								// restrict phi to be between desired limits
								spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));

								spherical.makeSafe();

								spherical.radius *= scale;

								// restrict radius to be between desired limits
								spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));

								// move target to panned location
								scope.target.add(panOffset);

								offset.setFromSpherical(spherical);

								// rotate offset back to "camera-up-vector-is-up" space
								offset.applyQuaternion(quatInverse);

								position.copy(scope.target).add(offset);

								scope.object.lookAt(scope.target);

								if (scope.enableDamping === true) {

										sphericalDelta.theta *= 1 - scope.dampingFactor;
										sphericalDelta.phi *= 1 - scope.dampingFactor;

										panOffset.multiplyScalar(1 - scope.dampingFactor);
								} else {

										sphericalDelta.set(0, 0, 0);

										panOffset.set(0, 0, 0);
								}

								scale = 1;

								// update condition is:
								// min(camera displacement, camera rotation in radians)^2 > EPS
								// using small-angle approximation cos(x/2) = 1 - x^2 / 8

								if (zoomChanged || lastPosition.distanceToSquared(scope.object.position) > EPS || 8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {

										scope.dispatchEvent(changeEvent);

										lastPosition.copy(scope.object.position);
										lastQuaternion.copy(scope.object.quaternion);
										zoomChanged = false;

										return true;
								}

								return false;
						};
				}();

				this.dispose = function () {

						scope.domElement.removeEventListener('contextmenu', onContextMenu, false);
						scope.domElement.removeEventListener('mousedown', onMouseDown, false);
						scope.domElement.removeEventListener('wheel', onMouseWheel, false);

						scope.domElement.removeEventListener('touchstart', onTouchStart, false);
						scope.domElement.removeEventListener('touchend', onTouchEnd, false);
						scope.domElement.removeEventListener('touchmove', onTouchMove, false);

						document.removeEventListener('mousemove', onMouseMove, false);
						document.removeEventListener('mouseup', onMouseUp, false);

						window.removeEventListener('keydown', onKeyDown, false);

						//scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?
				};

				//
				// internals
				//

				var scope = this;

				var changeEvent = { type: 'change' };
				var startEvent = { type: 'start' };
				var endEvent = { type: 'end' };

				var STATE = { NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY_PAN: 4 };

				var state = STATE.NONE;

				var EPS = 0.000001;

				// current position in spherical coordinates
				var spherical = new THREE.Spherical();
				var sphericalDelta = new THREE.Spherical();

				var scale = 1;
				var panOffset = new THREE.Vector3();
				var zoomChanged = false;

				var rotateStart = new THREE.Vector2();
				var rotateEnd = new THREE.Vector2();
				var rotateDelta = new THREE.Vector2();

				var panStart = new THREE.Vector2();
				var panEnd = new THREE.Vector2();
				var panDelta = new THREE.Vector2();

				var dollyStart = new THREE.Vector2();
				var dollyEnd = new THREE.Vector2();
				var dollyDelta = new THREE.Vector2();

				function getAutoRotationAngle() {

						return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
				}

				function getZoomScale() {

						return Math.pow(0.95, scope.zoomSpeed);
				}

				function rotateLeft(angle) {

						sphericalDelta.theta -= angle;
				}

				function rotateUp(angle) {

						sphericalDelta.phi -= angle;
				}

				var panLeft = function () {

						var v = new THREE.Vector3();

						return function panLeft(distance, objectMatrix) {

								v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
								v.multiplyScalar(-distance);

								panOffset.add(v);
						};
				}();

				var panUp = function () {

						var v = new THREE.Vector3();

						return function panUp(distance, objectMatrix) {

								if (scope.screenSpacePanning === true) {

										v.setFromMatrixColumn(objectMatrix, 1);
								} else {

										v.setFromMatrixColumn(objectMatrix, 0);
										v.crossVectors(scope.object.up, v);
								}

								v.multiplyScalar(distance);

								panOffset.add(v);
						};
				}();

				// deltaX and deltaY are in pixels; right and down are positive
				var pan = function () {

						var offset = new THREE.Vector3();

						return function pan(deltaX, deltaY) {

								var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

								if (scope.object.isPerspectiveCamera) {

										// perspective
										var position = scope.object.position;
										offset.copy(position).sub(scope.target);
										var targetDistance = offset.length();

										// half of the fov is center to top of screen
										targetDistance *= Math.tan(scope.object.fov / 2 * Math.PI / 180.0);

										// we use only clientHeight here so aspect ratio does not distort speed
										panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix);
										panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix);
								} else if (scope.object.isOrthographicCamera) {

										// orthographic
										panLeft(deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element.clientWidth, scope.object.matrix);
										panUp(deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element.clientHeight, scope.object.matrix);
								} else {

										// camera neither orthographic nor perspective
										console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
										scope.enablePan = false;
								}
						};
				}();

				function dollyIn(dollyScale) {

						if (scope.object.isPerspectiveCamera) {

								scale /= dollyScale;
						} else if (scope.object.isOrthographicCamera) {

								scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom * dollyScale));
								scope.object.updateProjectionMatrix();
								zoomChanged = true;
						} else {

								console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
								scope.enableZoom = false;
						}
				}

				function dollyOut(dollyScale) {

						if (scope.object.isPerspectiveCamera) {

								scale *= dollyScale;
						} else if (scope.object.isOrthographicCamera) {

								scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / dollyScale));
								scope.object.updateProjectionMatrix();
								zoomChanged = true;
						} else {

								console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
								scope.enableZoom = false;
						}
				}

				//
				// event callbacks - update the object state
				//

				function handleMouseDownRotate(event) {

						//console.log( 'handleMouseDownRotate' );

						rotateStart.set(event.clientX, event.clientY);
				}

				function handleMouseDownDolly(event) {

						//console.log( 'handleMouseDownDolly' );

						dollyStart.set(event.clientX, event.clientY);
				}

				function handleMouseDownPan(event) {

						//console.log( 'handleMouseDownPan' );

						panStart.set(event.clientX, event.clientY);
				}

				function handleMouseMoveRotate(event) {

						//console.log( 'handleMouseMoveRotate' );

						rotateEnd.set(event.clientX, event.clientY);

						rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);

						var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

						rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight); // yes, height

						rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);

						rotateStart.copy(rotateEnd);

						scope.update();
				}

				function handleMouseMoveDolly(event) {

						//console.log( 'handleMouseMoveDolly' );

						dollyEnd.set(event.clientX, event.clientY);

						dollyDelta.subVectors(dollyEnd, dollyStart);

						if (dollyDelta.y > 0) {

								dollyIn(getZoomScale());
						} else if (dollyDelta.y < 0) {

								dollyOut(getZoomScale());
						}

						dollyStart.copy(dollyEnd);

						scope.update();
				}

				function handleMouseMovePan(event) {

						//console.log( 'handleMouseMovePan' );

						panEnd.set(event.clientX, event.clientY);

						panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);

						pan(panDelta.x, panDelta.y);

						panStart.copy(panEnd);

						scope.update();
				}

				function handleMouseUp(event) {

						// console.log( 'handleMouseUp' );

				}

				function handleMouseWheel(event) {

						// console.log( 'handleMouseWheel' );

						if (event.deltaY < 0) {

								dollyOut(getZoomScale());
						} else if (event.deltaY > 0) {

								dollyIn(getZoomScale());
						}

						scope.update();
				}

				function handleKeyDown(event) {

						// console.log( 'handleKeyDown' );

						var needsUpdate = false;

						switch (event.keyCode) {

								case scope.keys.UP:
										pan(0, scope.keyPanSpeed);
										needsUpdate = true;
										break;

								case scope.keys.BOTTOM:
										pan(0, -scope.keyPanSpeed);
										needsUpdate = true;
										break;

								case scope.keys.LEFT:
										pan(scope.keyPanSpeed, 0);
										needsUpdate = true;
										break;

								case scope.keys.RIGHT:
										pan(-scope.keyPanSpeed, 0);
										needsUpdate = true;
										break;

						}

						if (needsUpdate) {

								// prevent the browser from scrolling on cursor keys
								event.preventDefault();

								scope.update();
						}
				}

				function handleTouchStartRotate(event) {

						//console.log( 'handleTouchStartRotate' );

						rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
				}

				function handleTouchStartDollyPan(event) {

						//console.log( 'handleTouchStartDollyPan' );

						if (scope.enableZoom) {

								var dx = event.touches[0].pageX - event.touches[1].pageX;
								var dy = event.touches[0].pageY - event.touches[1].pageY;

								var distance = Math.sqrt(dx * dx + dy * dy);

								dollyStart.set(0, distance);
						}

						if (scope.enablePan) {

								var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
								var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

								panStart.set(x, y);
						}
				}

				function handleTouchMoveRotate(event) {

						//console.log( 'handleTouchMoveRotate' );

						rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);

						rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);

						var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

						rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight); // yes, height

						rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);

						rotateStart.copy(rotateEnd);

						scope.update();
				}

				function handleTouchMoveDollyPan(event) {

						//console.log( 'handleTouchMoveDollyPan' );

						if (scope.enableZoom) {

								var dx = event.touches[0].pageX - event.touches[1].pageX;
								var dy = event.touches[0].pageY - event.touches[1].pageY;

								var distance = Math.sqrt(dx * dx + dy * dy);

								dollyEnd.set(0, distance);

								dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed));

								dollyIn(dollyDelta.y);

								dollyStart.copy(dollyEnd);
						}

						if (scope.enablePan) {

								var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
								var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

								panEnd.set(x, y);

								panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);

								pan(panDelta.x, panDelta.y);

								panStart.copy(panEnd);
						}

						scope.update();
				}

				function handleTouchEnd(event) {}

				//console.log( 'handleTouchEnd' );

				//
				// event handlers - FSM: listen for events and reset state
				//

				function onMouseDown(event) {

						if (scope.enabled === false) return;

						// Prevent the browser from scrolling.

						event.preventDefault();

						// Manually set the focus since calling preventDefault above
						// prevents the browser from setting it automatically.

						scope.domElement.focus ? scope.domElement.focus() : window.focus();

						switch (event.button) {

								case scope.mouseButtons.LEFT:

										if (event.ctrlKey || event.metaKey || event.shiftKey) {

												if (scope.enablePan === false) return;

												handleMouseDownPan(event);

												state = STATE.PAN;
										} else {

												if (scope.enableRotate === false) return;

												handleMouseDownRotate(event);

												state = STATE.ROTATE;
										}

										break;

								case scope.mouseButtons.MIDDLE:

										if (scope.enableZoom === false) return;

										handleMouseDownDolly(event);

										state = STATE.DOLLY;

										break;

								case scope.mouseButtons.RIGHT:

										if (scope.enablePan === false) return;

										handleMouseDownPan(event);

										state = STATE.PAN;

										break;

						}

						if (state !== STATE.NONE) {

								document.addEventListener('mousemove', onMouseMove, false);
								document.addEventListener('mouseup', onMouseUp, false);

								scope.dispatchEvent(startEvent);
						}
				}

				function onMouseMove(event) {

						if (scope.enabled === false) return;

						event.preventDefault();

						switch (state) {

								case STATE.ROTATE:

										if (scope.enableRotate === false) return;

										handleMouseMoveRotate(event);

										break;

								case STATE.DOLLY:

										if (scope.enableZoom === false) return;

										handleMouseMoveDolly(event);

										break;

								case STATE.PAN:

										if (scope.enablePan === false) return;

										handleMouseMovePan(event);

										break;

						}
				}

				function onMouseUp(event) {

						if (scope.enabled === false) return;

						handleMouseUp(event);

						document.removeEventListener('mousemove', onMouseMove, false);
						document.removeEventListener('mouseup', onMouseUp, false);

						scope.dispatchEvent(endEvent);

						state = STATE.NONE;
				}

				function onMouseWheel(event) {

						if (scope.enabled === false || scope.enableZoom === false || state !== STATE.NONE && state !== STATE.ROTATE) return;

						event.preventDefault();
						event.stopPropagation();

						scope.dispatchEvent(startEvent);

						handleMouseWheel(event);

						scope.dispatchEvent(endEvent);
				}

				function onKeyDown(event) {

						if (scope.enabled === false || scope.enableKeys === false || scope.enablePan === false) return;

						handleKeyDown(event);
				}

				function onTouchStart(event) {

						if (scope.enabled === false) return;

						event.preventDefault();

						switch (event.touches.length) {

								case 1:
										// one-fingered touch: rotate

										if (scope.enableRotate === false) return;

										handleTouchStartRotate(event);

										state = STATE.TOUCH_ROTATE;

										break;

								case 2:
										// two-fingered touch: dolly-pan

										if (scope.enableZoom === false && scope.enablePan === false) return;

										handleTouchStartDollyPan(event);

										state = STATE.TOUCH_DOLLY_PAN;

										break;

								default:

										state = STATE.NONE;

						}

						if (state !== STATE.NONE) {

								scope.dispatchEvent(startEvent);
						}
				}

				function onTouchMove(event) {

						if (scope.enabled === false) return;

						event.preventDefault();
						event.stopPropagation();

						switch (event.touches.length) {

								case 1:
										// one-fingered touch: rotate

										if (scope.enableRotate === false) return;
										if (state !== STATE.TOUCH_ROTATE) return; // is this needed?

										handleTouchMoveRotate(event);

										break;

								case 2:
										// two-fingered touch: dolly-pan

										if (scope.enableZoom === false && scope.enablePan === false) return;
										if (state !== STATE.TOUCH_DOLLY_PAN) return; // is this needed?

										handleTouchMoveDollyPan(event);

										break;

								default:

										state = STATE.NONE;

						}
				}

				function onTouchEnd(event) {

						if (scope.enabled === false) return;

						handleTouchEnd(event);

						scope.dispatchEvent(endEvent);

						state = STATE.NONE;
				}

				function onContextMenu(event) {

						if (scope.enabled === false) return;

						event.preventDefault();
				}

				//

				scope.domElement.addEventListener('contextmenu', onContextMenu, false);

				scope.domElement.addEventListener('mousedown', onMouseDown, false);
				scope.domElement.addEventListener('wheel', onMouseWheel, false);

				scope.domElement.addEventListener('touchstart', onTouchStart, false);
				scope.domElement.addEventListener('touchend', onTouchEnd, false);
				scope.domElement.addEventListener('touchmove', onTouchMove, false);

				window.addEventListener('keydown', onKeyDown, false);

				// force an update at start

				this.update();
		};

		THREE.OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
		THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;

		Object.defineProperties(THREE.OrbitControls.prototype, {

				center: {

						get: function get() {

								console.warn('THREE.OrbitControls: .center has been renamed to .target');
								return this.target;
						}

				},

				// backward compatibility

				noZoom: {

						get: function get() {

								console.warn('THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
								return !this.enableZoom;
						},

						set: function set(value) {

								console.warn('THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
								this.enableZoom = !value;
						}

				},

				noRotate: {

						get: function get() {

								console.warn('THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
								return !this.enableRotate;
						},

						set: function set(value) {

								console.warn('THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
								this.enableRotate = !value;
						}

				},

				noPan: {

						get: function get() {

								console.warn('THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
								return !this.enablePan;
						},

						set: function set(value) {

								console.warn('THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
								this.enablePan = !value;
						}

				},

				noKeys: {

						get: function get() {

								console.warn('THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
								return !this.enableKeys;
						},

						set: function set(value) {

								console.warn('THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
								this.enableKeys = !value;
						}

				},

				staticMoving: {

						get: function get() {

								console.warn('THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
								return !this.enableDamping;
						},

						set: function set(value) {

								console.warn('THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
								this.enableDamping = !value;
						}

				},

				dynamicDampingFactor: {

						get: function get() {

								console.warn('THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
								return this.dampingFactor;
						},

						set: function set(value) {

								console.warn('THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
								this.dampingFactor = value;
						}

				}

		});
}();

/*js/user-defined.js*/
var _user_defined_module = function () {
		/**
   * @function promise 回调函数转promise
   * @example
   * var load_1 = promise();
   * $.get('xx.json', load_1.resolve);
   * load_1.then(function (json) {
   * console.log(json)
   * });
   */
		var promise = function promise() {
				var state = {
						v: 0
				},
				    stateV = 0,
				    retV = undefined;

				var pm = new Promise(function (resolve, reject) {
						Object.defineProperty(state, "v", {
								get: function get() {
										return stateV;
								},
								set: function set(newValue) {
										stateV = newValue;
										if (stateV > 0) {
												resolve(retV);
										} else if (stateV < 0) {
												reject(retV);
										}
								}
						});
				});
				pm.resolve = function (val) {
						retV = val;
						state.v = 1;
				};
				pm.reject = function (err) {
						retV = err;
						state.v = -1;
				};
				return pm;
		};

		/*天空合*/
		/*TODO 使用点着色器片源着色器构建*/
		var skyBoxMaterial = function skyBoxMaterial(argObj, cb) {
				if (Array.isArray(argObj.map)) {
						var skyCubeMap = new THREE.CubeTextureLoader().load(argObj.map, cb);
						//format：表示加载的图片的格式，这个参数可以取值THREE.RGBAFormat，RGBFormat等。THREE.RGBAFormat表示每个像素点要使用四个分量表示，分别是红、绿、蓝、透明来表示。RGBFormat则不使用透明，也就是说纹理不会有透明的效果。
						skyCubeMap.format = THREE.RGBFormat;
						//Mapping：是一个THREE.UVMapping()类型，它表示的是纹理坐标
						//skyCubeMap.mapping = THREE.CubeReflectionMapping;
						//skyCubeMap.encoding = THREE.sRGBEncoding;

						var shader = THREE.ShaderLib["cube"];
						shader.uniforms["tCube"].value = skyCubeMap;
				} else {
						var skyCubeMap = new THREE.TextureLoader().load(argObj.map, cb);
						//THREE.LinearFilter在纹理基层上执行线性过滤
						//THREE.LinearMipMapNearestFilter选择最临近的mip层，并执行线性过滤
						//minFilter属性：指定纹理如何缩小。默认值：THREE.LinearMipMapLinearFilter,这是OpenGL的基本概念。当您不设置的时候，它会取默认值。

						skyCubeMap.magFilter = THREE.LinearFilter;
						//magFilter属性：指定纹理如何放大。默认值：THREE.LinearFilter,这是OpenGL的基本概念。当您不设置的时候，它会取默认值。
						skyCubeMap.minFilter = THREE.LinearMipMapLinearFilter;
						//skyCubeMap.mapping = THREE.EquirectangularReflectionMapping;
						//skyCubeMap.encoding = THREE.sRGBEncoding;

						var shader = THREE.ShaderLib["equirect"];
						shader.uniforms["tEquirect"].value = skyCubeMap;
				}

				//对非内置材料启用代码注入
				Object.defineProperty(shader, "map", {
						get: function get() {
								return this.uniforms.tEquirect.value;
						}
				});

				var skyBoxMaterial = new THREE.ShaderMaterial({
						fragmentShader: shader.fragmentShader,
						vertexShader: shader.vertexShader,
						uniforms: shader.uniforms,
						depthWrite: false,
						side: THREE.BackSide /*THREE.DoubleSide*/
				});
				return skyBoxMaterial;
		};

		/*导出**/
		var save = function save(blob, filename) {
				var link = document.createElement("a");
				link.style.display = "none";
				document.body.appendChild(link);

				link.href = URL.createObjectURL(blob);
				link.download = filename;
				link.click();

				document.body.removeChild(link);
		};

		var saveString = function saveString(text, filename) {
				save(new Blob([text], {
						type: "text/plain"
				}), filename);
		};

		var saveArrayBuffer = function saveArrayBuffer(buffer, filename) {
				save(new Blob([buffer], {
						type: "application/octet-stream"
				}), filename);
		};

		/*导出gltf文件*/
		var exportGLTF = function exportGLTF(input, filename) {
				var _filename = (filename || input.name || "export") + ".gltf";

				var gltfExporter = new THREE.GLTFExporter();
				var options = {
						trs: true /*导出位置，旋转和缩放而不是每个节点的矩阵*/
						, binary: false /*以二进制（.glb）格式导出*/
						, embedImages: true /*导出嵌入glTF资产的图像*/
						, forcePowerOfTwoTextures: true /*导出图像大小调整为POT大小*/
				};
				gltfExporter.parse(input, function (result) {
						var output = JSON.stringify(result, null, 2);
						saveString(output, _filename);
				}, options);
		};
		/*导出glb文件*/
		var exportGLB = function exportGLB(input, filename) {
				var _filename = (filename || input.name || "export") + ".glb";

				var gltfExporter = new THREE.GLTFExporter();
				var options = {
						trs: true,
						binary: true,
						embedImages: true,
						forcePowerOfTwoTextures: true
				};
				gltfExporter.parse(input, function (result) {
						saveArrayBuffer(result, _filename);
				}, options);
		};
		/*导出obj文件*/
		var exportOBJ = function exportOBJ(input, filename) {
				var _filename = (filename || input.name || "export") + ".obj";

				var exporter = new THREE.OBJExporter();
				var result = exporter.parse(input);
				saveString(result, _filename);
		};
		/*导出dae文件*/
		var exportDAE = function exportDAE(input, filename) {
				var _filename = (filename || input.name || "export") + ".dae";

				var exporter = new THREE.ColladaExporter();
				var result = exporter.parse(input);
				saveString(result.data, _filename);
				result.textures.forEach(function (tex) {
						saveArrayBuffer(tex.data, tex.name + '.' + tex.ext);
				});
		};

		var y_y = { promise: promise, skyBoxMaterial: skyBoxMaterial, exportGLTF: exportGLTF, exportGLB: exportGLB, exportOBJ: exportOBJ, exportDAE: exportDAE };

		return y_y;
}();

/*js/Lensflare.js*/
var _Lensflare_module = function () {
		/**
   * @author Mugen87 / https://github.com/Mugen87
   * @author mrdoob / http://mrdoob.com/
   */

		THREE.Lensflare = function () {

				THREE.Mesh.call(this, THREE.Lensflare.Geometry, new THREE.MeshBasicMaterial({ opacity: 0, transparent: true }));

				this.type = 'Lensflare';
				this.frustumCulled = false;
				this.renderOrder = Infinity;

				//

				var positionScreen = new THREE.Vector3();
				var positionView = new THREE.Vector3();

				// textures

				var tempMap = new THREE.DataTexture(new Uint8Array(16 * 16 * 3), 16, 16, THREE.RGBFormat);
				tempMap.minFilter = THREE.NearestFilter;
				tempMap.magFilter = THREE.NearestFilter;
				tempMap.wrapS = THREE.ClampToEdgeWrapping;
				tempMap.wrapT = THREE.ClampToEdgeWrapping;
				tempMap.needsUpdate = true;

				var occlusionMap = new THREE.DataTexture(new Uint8Array(16 * 16 * 3), 16, 16, THREE.RGBFormat);
				occlusionMap.minFilter = THREE.NearestFilter;
				occlusionMap.magFilter = THREE.NearestFilter;
				occlusionMap.wrapS = THREE.ClampToEdgeWrapping;
				occlusionMap.wrapT = THREE.ClampToEdgeWrapping;
				occlusionMap.needsUpdate = true;

				// material

				var geometry = THREE.Lensflare.Geometry;

				var material1a = new THREE.RawShaderMaterial({
						uniforms: {
								'scale': { value: null },
								'screenPosition': { value: null }
						},
						vertexShader: ['precision highp float;', 'uniform vec3 screenPosition;', 'uniform vec2 scale;', 'attribute vec3 position;', 'void main() {', '	gl_Position = vec4( position.xy * scale + screenPosition.xy, screenPosition.z, 1.0 );', '}'].join('\n'),
						fragmentShader: ['precision highp float;', 'void main() {', '	gl_FragColor = vec4( 1.0, 0.0, 1.0, 1.0 );', '}'].join('\n'),
						depthTest: true,
						depthWrite: false,
						transparent: false
				});

				var material1b = new THREE.RawShaderMaterial({
						uniforms: {
								'map': { value: tempMap },
								'scale': { value: null },
								'screenPosition': { value: null }
						},
						vertexShader: ['precision highp float;', 'uniform vec3 screenPosition;', 'uniform vec2 scale;', 'attribute vec3 position;', 'attribute vec2 uv;', 'varying vec2 vUV;', 'void main() {', '	vUV = uv;', '	gl_Position = vec4( position.xy * scale + screenPosition.xy, screenPosition.z, 1.0 );', '}'].join('\n'),
						fragmentShader: ['precision highp float;', 'uniform sampler2D map;', 'varying vec2 vUV;', 'void main() {', '	gl_FragColor = texture2D( map, vUV );', '}'].join('\n'),
						depthTest: false,
						depthWrite: false,
						transparent: false
				});

				// the following object is used for occlusionMap generation

				var mesh1 = new THREE.Mesh(geometry, material1a);

				//

				var elements = [];

				var shader = THREE.LensflareElement.Shader;

				var material2 = new THREE.RawShaderMaterial({
						uniforms: {
								'map': { value: null },
								'occlusionMap': { value: occlusionMap },
								'color': { value: new THREE.Color(0xffffff) },
								'scale': { value: new THREE.Vector2() },
								'screenPosition': { value: new THREE.Vector3() }
						},
						vertexShader: shader.vertexShader,
						fragmentShader: shader.fragmentShader,
						blending: THREE.AdditiveBlending,
						transparent: true,
						depthWrite: false
				});

				var mesh2 = new THREE.Mesh(geometry, material2);

				this.addElement = function (element) {

						elements.push(element);
				};

				//

				var scale = new THREE.Vector2();
				var screenPositionPixels = new THREE.Vector2();
				var validArea = new THREE.Box2();
				var viewport = new THREE.Vector4();

				this.onBeforeRender = function (renderer, scene, camera) {

						renderer.getCurrentViewport(viewport);

						var invAspect = viewport.w / viewport.z;
						var halfViewportWidth = viewport.z / 2.0;
						var halfViewportHeight = viewport.w / 2.0;

						var size = 16 / viewport.w;
						scale.set(size * invAspect, size);

						validArea.min.set(viewport.x, viewport.y);
						validArea.max.set(viewport.x + (viewport.z - 16), viewport.y + (viewport.w - 16));

						// calculate position in screen space

						positionView.setFromMatrixPosition(this.matrixWorld);
						positionView.applyMatrix4(camera.matrixWorldInverse);

						if (positionView.z > 0) return; // lensflare is behind the camera

						positionScreen.copy(positionView).applyMatrix4(camera.projectionMatrix);

						// horizontal and vertical coordinate of the lower left corner of the pixels to copy

						screenPositionPixels.x = viewport.x + positionScreen.x * halfViewportWidth + halfViewportWidth - 8;
						screenPositionPixels.y = viewport.y + positionScreen.y * halfViewportHeight + halfViewportHeight - 8;

						// screen cull

						if (validArea.containsPoint(screenPositionPixels)) {

								// save current RGB to temp texture

								renderer.copyFramebufferToTexture(screenPositionPixels, tempMap);

								// render pink quad

								var uniforms = material1a.uniforms;
								uniforms["scale"].value = scale;
								uniforms["screenPosition"].value = positionScreen;

								renderer.renderBufferDirect(camera, null, geometry, material1a, mesh1, null);

								// copy result to occlusionMap

								renderer.copyFramebufferToTexture(screenPositionPixels, occlusionMap);

								// restore graphics

								var uniforms = material1b.uniforms;
								uniforms["scale"].value = scale;
								uniforms["screenPosition"].value = positionScreen;

								renderer.renderBufferDirect(camera, null, geometry, material1b, mesh1, null);

								// render elements

								var vecX = -positionScreen.x * 2;
								var vecY = -positionScreen.y * 2;

								for (var i = 0, l = elements.length; i < l; i++) {

										var element = elements[i];

										var uniforms = material2.uniforms;

										uniforms["color"].value.copy(element.color);
										uniforms["map"].value = element.texture;
										uniforms["screenPosition"].value.x = positionScreen.x + vecX * element.distance;
										uniforms["screenPosition"].value.y = positionScreen.y + vecY * element.distance;

										var size = element.size / viewport.w;
										var invAspect = viewport.w / viewport.z;

										uniforms["scale"].value.set(size * invAspect, size);

										material2.uniformsNeedUpdate = true;

										renderer.renderBufferDirect(camera, null, geometry, material2, mesh2, null);
								}
						}
				};

				this.dispose = function () {

						material1a.dispose();
						material1b.dispose();
						material2.dispose();

						tempMap.dispose();
						occlusionMap.dispose();

						for (var i = 0, l = elements.length; i < l; i++) {

								elements[i].texture.dispose();
						}
				};
		};

		THREE.Lensflare.prototype = Object.create(THREE.Mesh.prototype);
		THREE.Lensflare.prototype.constructor = THREE.Lensflare;
		THREE.Lensflare.prototype.isLensflare = true;

		//

		THREE.LensflareElement = function (texture, size, distance, color) {

				this.texture = texture;
				this.size = size || 1;
				this.distance = distance || 0;
				this.color = color || new THREE.Color(0xffffff);
		};

		THREE.LensflareElement.Shader = {

				uniforms: {

						'map': { value: null },
						'occlusionMap': { value: null },
						'color': { value: null },
						'scale': { value: null },
						'screenPosition': { value: null }

				},

				vertexShader: ['precision highp float;', 'uniform vec3 screenPosition;', 'uniform vec2 scale;', 'uniform sampler2D occlusionMap;', 'attribute vec3 position;', 'attribute vec2 uv;', 'varying vec2 vUV;', 'varying float vVisibility;', 'void main() {', '	vUV = uv;', '	vec2 pos = position.xy;', '	vec4 visibility = texture2D( occlusionMap, vec2( 0.1, 0.1 ) );', '	visibility += texture2D( occlusionMap, vec2( 0.5, 0.1 ) );', '	visibility += texture2D( occlusionMap, vec2( 0.9, 0.1 ) );', '	visibility += texture2D( occlusionMap, vec2( 0.9, 0.5 ) );', '	visibility += texture2D( occlusionMap, vec2( 0.9, 0.9 ) );', '	visibility += texture2D( occlusionMap, vec2( 0.5, 0.9 ) );', '	visibility += texture2D( occlusionMap, vec2( 0.1, 0.9 ) );', '	visibility += texture2D( occlusionMap, vec2( 0.1, 0.5 ) );', '	visibility += texture2D( occlusionMap, vec2( 0.5, 0.5 ) );', '	vVisibility =        visibility.r / 9.0;', '	vVisibility *= 1.0 - visibility.g / 9.0;', '	vVisibility *=       visibility.b / 9.0;', '	gl_Position = vec4( ( pos * scale + screenPosition.xy ).xy, screenPosition.z, 1.0 );', '}'].join('\n'),

				fragmentShader: ['precision highp float;', 'uniform sampler2D map;', 'uniform vec3 color;', 'varying vec2 vUV;', 'varying float vVisibility;', 'void main() {', '	vec4 texture = texture2D( map, vUV );', '	texture.a *= vVisibility;', '	gl_FragColor = texture;', '	gl_FragColor.rgb *= color;', '}'].join('\n')

		};

		THREE.Lensflare.Geometry = function () {

				var geometry = new THREE.BufferGeometry();

				var float32Array = new Float32Array([-1, -1, 0, 0, 0, 1, -1, 0, 1, 0, 1, 1, 0, 1, 1, -1, 1, 0, 0, 1]);

				var interleavedBuffer = new THREE.InterleavedBuffer(float32Array, 5);

				geometry.setIndex([0, 1, 2, 0, 2, 3]);
				geometry.addAttribute('position', new THREE.InterleavedBufferAttribute(interleavedBuffer, 3, 0, false));
				geometry.addAttribute('uv', new THREE.InterleavedBufferAttribute(interleavedBuffer, 2, 3, false));

				return geometry;
		}();
}();

/*js/content-click.js*/
var _content_click_module = function () {
		var meshes = [];
		var clickTarget = undefined;
		var raycaster,
		    mouse = new THREE.Vector2(); //鼠标拾取

		var interaction = function interaction(arg) {
				userSetName(arg.phone, 'phone');
				userSetName(arg.email, 'email');
				userSetName(arg.site, 'site');
				userSetName(arg.html, 'html');
				raycaster = new THREE.Raycaster();
				window.addEventListener('mousemove', onTouchMove);
				window.addEventListener('touchmove', onTouchMove);
				container.addEventListener('click', onClickTarget);
		};

		function onTouchMove(event) {

				var x, y;

				if (event.changedTouches) {

						x = event.changedTouches[0].pageX;
						y = event.changedTouches[0].pageY;
				} else {

						x = event.clientX;
						y = event.clientY;
				}

				mouse.x = x / window.innerWidth * 2 - 1;
				mouse.y = -(y / window.innerHeight) * 2 + 1;

				checkIntersection();
		};

		function checkIntersection() {
				if (!meshes.length) return;

				raycaster.setFromCamera(mouse, camera);

				var intersects = raycaster.intersectObjects(meshes);

				if (intersects.length > 0) {
						container.style.cursor = 'pointer';
						clickTarget = intersects[0].object.userData.name;
				} else {
						container.style.cursor = 'default';
						clickTarget = undefined;
				}
		};

		function onClickTarget(event) {
				onTouchMove(event);
				var oa = document.createElement("a");
				var ospan = document.createElement("span");
				oa.appendChild(ospan);
				body.appendChild(oa);
				switch (clickTarget) {
						case 'phone':
								oa.href = 'tel:13260539108';
								if (browserInfo.pc) {
										oa.target = "_blank";
										//oa.href = 'mqqwpa://im/chat?chat_type=wpa&uin=1046171507&version=1&src_type=web&web_src=oicqzone.com';
										oa.href = "https://wpa.qq.com/msgrd?v=3&uin=1046171507&site=qq&menu=yes";
								} else {
										oa.href = 'tel:13260539108';
								}
								break;
						case 'email':
								oa.href = 'mailto:1046171507@qq.com';
								break;
						case 'site':
								oa.target = "_blank";
								oa.href = './site2.html';
								ospan.click();
								oa.href = './site.html';
								break;
						case 'html':
								oa.target = "_blank";
								oa.href = './html-resume.html';
								break;
						default:
								break;
				};
				ospan.click();
				oa.remove();
		}

		function userSetName(mesh, name) {
				mesh.forEach(function (m) {
						meshes.push(m);
						m.userData.name = name;
				});
		};

		var y_y = interaction;
		return y_y;
}();

/*js/prologue.js*/
var _prologue_module = function () {
		//开场相关3D场景
		body = document.querySelector('body');
		video = document.querySelector('#video');
		container = document.querySelector('#three-container');

		var texture;
		var mouseX = 0;
		var mouseY = 0;

		var windowHalfX = window.innerWidth / 2;
		var windowHalfY = window.innerHeight / 2;

		var cube_count,
		    meshes = [],
		    materials = [],
		    xgrid = 20,
		    ygrid = 10;

		var raycaster,
		    mouse = new THREE.Vector2(); //鼠标拾取

		function init() {
				texture = new THREE.VideoTexture(video);
				raycaster = new THREE.Raycaster();
				//

				var i, j, ux, uy, ox, oy, geometry, xsize, ysize;

				ux = 1 / xgrid;
				uy = 1 / ygrid;

				xsize = 480 / xgrid;
				ysize = 237 / ygrid;

				var parameters = {
						color: 0xffffff,
						map: texture
				};

				cube_count = 0;

				for (i = 0; i < xgrid; i++) {
						for (j = 0; j < ygrid; j++) {

								ox = i;
								oy = j;

								geometry = new THREE.BoxBufferGeometry(xsize, ysize, xsize);

								change_uvs(geometry, ux, uy, ox, oy);

								materials[cube_count] = new THREE.MeshLambertMaterial(parameters);

								var material = materials[cube_count];

								material.hue = i / xgrid;
								material.saturation = 1 - j / ygrid;

								material.color.setHSL(material.hue, material.saturation, 0.5);

								var mesh = new THREE.Mesh(geometry, material);

								mesh.position.x = (i - xgrid / 2) * xsize;
								mesh.position.y = (j - ygrid / 2) * ysize;
								mesh.position.z = 0;

								mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;

								scene.add(mesh);

								mesh.dx = 0.001 * (0.5 - Math.random());
								mesh.dy = 0.001 * (0.5 - Math.random());

								meshes[cube_count] = mesh;

								cube_count += 1;
						}
				};

				document.addEventListener('resize', onWindowResize, false);
				document.addEventListener('mousemove', onDocumentMouseMove, false);
				document.addEventListener('touchmove', onDocumentMouseMove, false);

				document.addEventListener('mousemove', onTouchMove, false);
				document.addEventListener('touchmove', onTouchMove, false);
		};

		function onWindowResize() {

				windowHalfX = window.innerWidth / 2;
				windowHalfY = window.innerHeight / 2;

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize(window.innerWidth, window.innerHeight);
		}

		function change_uvs(geometry, unitx, unity, offsetx, offsety) {

				var uvs = geometry.attributes.uv.array;

				for (var i = 0; i < uvs.length; i += 2) {

						uvs[i] = (uvs[i] + offsetx) * unitx;
						uvs[i + 1] = (uvs[i + 1] + offsety) * unity;
				}
		};

		function onDocumentMouseMove(event) {

				mouseX = event.clientX - windowHalfX;
				mouseY = (event.clientY - windowHalfY) * 0.3;
		};

		var m = 0.2; //加快速度

		var h,
		    counter = 1;

		function animate() {
				if (counter == 2600 * m || state.msg == '开始撤出开场3D视屏') {
						animateOut();
				} else {
						requestAnimationFrame(animate);
						render();
				}
		};

		eventOne(body, 'click', startWithdraw);

		function startWithdraw() {
				if (counter > 800 * m) {
						state.msg = '开始撤出开场3D视屏';
				} else {
						eventOne(body, 'click', startWithdraw);
				}
		};

		function render() {

				var time = Date.now() * 0.00005 / m;

				camera.position.x += (mouseX - camera.position.x) * 0.05;
				camera.position.y += (-mouseY - camera.position.y) * 0.05;

				camera.lookAt(scene.position);

				for (var i = 0; i < cube_count; i++) {

						var material = materials[i];

						h = 360 * (material.hue + time) % 360 / 360;
						material.color.setHSL(h, material.saturation, 0.5);
				}

				if (counter % (1000 * m) > 200 * m) {

						for (var i = 0; i < cube_count; i++) {

								var mesh = meshes[i];

								mesh.rotation.x += 10 * mesh.dx / m;
								mesh.rotation.y += 10 * mesh.dy / m;

								mesh.position.x += 200 * mesh.dx / m;
								mesh.position.y += 200 * mesh.dy / m;
								mesh.position.z += 400 * mesh.dx / m;
						}
				}

				if (counter % (1000 * m) === 0) {

						for (var i = 0; i < cube_count; i++) {

								mesh = meshes[i];

								mesh.dx *= -1;
								mesh.dy *= -1;
						}
				}

				counter++;
		}

		var counterOut = 1;

		function animateOut() {
				if (counterOut > 400 * m) {
						renderOutEnd();
						state.msg = '撤出开场3D视屏完成';
						state.code++;
				} else {
						requestAnimationFrame(animateOut);
						renderOutIn();
				}
		};

		function renderOutIn() {
				for (var i = 0; i < cube_count; i++) {

						var mesh = meshes[i];
						mesh.position.x += 10000 * mesh.dx / m;
						mesh.position.y += 10000 * mesh.dy / m;
				}
				counterOut++;
		};

		function renderOutEnd() {
				for (var i = 0; i < cube_count; i++) {
						var mesh = meshes[i];
						scene.remove(mesh);
						mesh.geometry.dispose();
						mesh.material.dispose();
				}
				texture.dispose();
				video.remove();

				document.removeEventListener('mousemove', onDocumentMouseMove, false);
				document.removeEventListener('touchmove', onDocumentMouseMove, false);
				document.removeEventListener('mousemove', onTouchMove, false);
				document.removeEventListener('touchmove', onTouchMove, false);
		};

		var scene1 = function scene1() {
				init();
				animate();
		};

		function onTouchMove(event) {

				var x, y;

				if (event.changedTouches) {

						x = event.changedTouches[0].pageX;
						y = event.changedTouches[0].pageY;
				} else {

						x = event.clientX;
						y = event.clientY;
				}

				mouse.x = x / window.innerWidth * 2 - 1;
				mouse.y = -(y / window.innerHeight) * 2 + 1;

				checkIntersection();
		}
		var checkMesh;

		function checkIntersection() {

				if (!meshes.length) return;

				raycaster.setFromCamera(mouse, camera);

				var intersects = raycaster.intersectObjects(meshes);

				if (intersects.length > 0) {
						if (checkMesh != intersects[0].object) {
								checkMesh && checkMesh.scale.set(1, 1, 1);
								checkMesh = intersects[0].object;
								checkMesh.scale.set(2, 2, 2);
						}
				} else {
						checkMesh && checkMesh.scale.set(1, 1, 1);
						checkMesh = undefined;
				}
		}

		var y_y = scene1;
		return y_y;
}();

/*js/title.js*/
var _title_module = function () {
		/*轨道控制*/

		var skyBoxMaterial = _user_defined_module.skyBoxMaterial;


		var urls = function (path) {
				var urls = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
				var format = arguments[2];

				return [path + urls[0] + format, path + urls[1] + format, path + urls[2] + format, path + urls[3] + format, path + urls[4] + format, path + urls[5] + format];
		}("./img/", ['px', 'nx', 'py', 'ny', 'pz', 'nz'], '.jpg');
		var skyBoxInit = function skyBoxInit() {
				var skyBox = new THREE.Mesh(new THREE.BoxGeometry(2048, 2048, 2048), skyBoxMaterial({
						map: urls
				}));
				scene.add(skyBox);
		};

		//光晕
		function lensflareInit(color, positions) {
				var textureLoader = new THREE.TextureLoader();

				var textureFlare0 = textureLoader.load('./img/lensflare0.png');
				var textureFlare3 = textureLoader.load('./img/lensflare3.png');

				var light = new THREE.PointLight(color, 0.5, 0);
				light.color.set(color);
				light.position.set(positions.x, positions.y, positions.z);
				scene.add(light);
				var lensflare = new THREE.Lensflare();
				lensflare.addElement(new THREE.LensflareElement(textureFlare0, 700, 0, light.color));
				lensflare.addElement(new THREE.LensflareElement(textureFlare3, 60, 0.6));
				lensflare.addElement(new THREE.LensflareElement(textureFlare3, 70, 0.7));
				lensflare.addElement(new THREE.LensflareElement(textureFlare3, 120, 0.9));
				lensflare.addElement(new THREE.LensflareElement(textureFlare3, 70, 1));
				light.add(lensflare);
		};

		var init = function init() {
				/*TODO 鼠标滚轮控制*/
				var mouseControls = new THREE.OrbitControls(camera, renderer.domElement);
				mouseControls.target.copy(scene.position);
				mouseControls.maxDistance = 1600;
				mouseControls.update();
				/*鼠标滚轮控制END*/

				youzikuFontLoader({
						accessKey: '251359cd40c648f0a307e011db03b9f1',
						apikey: 'bfe88d45fcebd2f7483f758336f1ea6f',
						content: '个人简历'
				}, function (font) {
						// console.log(font);
						var text = "个人简历";
						var shapes = font.generateShapes(text, 5);
						var geometry = new THREE.ShapeBufferGeometry(shapes);
						geometry.computeBoundingBox();
						var xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
						var yMid = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
						//geometry.translate(xMid, 0, 0);
						//geometry.center();

						//线框平面字
						function LineGeometry() {
								var matDark = new THREE.LineBasicMaterial({
										color: 0x006699,
										side: THREE.DoubleSide
								});
								//geometry.computeBoundingBox();
								//var xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
								//var yMid = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);

								var holeShapes = [];
								for (var i = 0; i < shapes.length; i++) {
										var shape = shapes[i];
										if (shape.holes && shape.holes.length > 0) {
												for (var j = 0; j < shape.holes.length; j++) {
														var hole = shape.holes[j];
														holeShapes.push(hole);
												}
										}
								};
								shapes.push.apply(shapes, holeShapes);

								var lineText = new THREE.Group();

								for (var i = 0; i < shapes.length; i++) {
										(function () {
												var shape = shapes[i];
												var points = shape.getPoints();
												var geometry = new THREE.BufferGeometry();
												var lineMesh = new THREE.Line(geometry, matDark);
												lineMesh.userData.pointsAll = points;
												var pointsAll = lineMesh.userData.pointsAll;
												var points = pointsAll.slice(0, Math.ceil(pointsAll.length / 100 * 100));
												lineMesh.geometry.setFromPoints(points);
												lineMesh.geometry.translate(xMid, yMid, 0);
												lineText.add(lineMesh);
										})();
								};

								lineText.scale.set(20, 20, 20);
								scene.add(lineText);
								console.log(lineText);
								var UpCount = 1;
								var render = function render() {
										UpCount++;
										if (UpCount <= 100) {
												requestAnimationFrame(render);
												lineText.children.forEach(function (lineMesh) {
														var pointsAll = lineMesh.userData.pointsAll;
														var points = pointsAll.slice(0, Math.ceil(pointsAll.length / 100 * UpCount));
														lineMesh.geometry.setFromPoints(points);

														lineMesh.geometry.translate(xMid, yMid, 0);
												});
										} else {
												PlaneGeometry();
												scene.remove(lineText);
										}
								};
								render();
						};

						function PlaneGeometry() {
								var matLite = new THREE.MeshPhongMaterial({
										color: 0x006699,
										transparent: true,
										opacity: 0.9,
										side: THREE.DoubleSide
								});
								var text = new THREE.Mesh(geometry, matLite);
								text.geometry.translate(xMid, yMid, 0);
								text.scale.set(20, 20, 20);
								scene.add(text);
								var UpCount = 1;
								var render = function render() {
										UpCount++;
										if (UpCount <= 10) {
												requestAnimationFrame(render);
										} else {
												TextGeometry();
												text.material.dispose();
												scene.remove(text);
										}
								};
								render();
						};

						function TextGeometry() {
								var textGeo = new THREE.TextGeometry(text, {
										font: font, //字体，默认是'helvetiker'，需对应引用的字体文件
										size: 5, //字号大小，一般为大写字母的高度
										height: 1, //文字的厚度
										weight: 'normal', //值为'normal'或'bold'，表示是否加粗
										style: 'normal', //值为'normal'或'italics'，表示是否斜体
										bevelThickness: 0.1, //倒角厚度
										bevelSize: 0.1, //倒角宽度
										curveSegments: 3, //弧线分段数，使得文字的曲线更加光滑
										bevelEnabled: true //布尔值，是否使用倒角，意为在边缘处斜切
								});
								textGeo.center();

								var shaderMaterial = new THREE.MeshPhongMaterial({
										color: 0xffffff,
										side: THREE.DoubleSide,
										vertexColors: THREE.VertexColors,
										morphTargets: true
								});

								var geometry = textGeo.clone();

								var tessellateModifier = new THREE.TessellateModifier(8);
								for (var i = 0; i < 6; i++) {
										tessellateModifier.modify(geometry);
								};

								geometry = new THREE.BufferGeometry().fromGeometry(geometry);
								geometry = new THREE.Geometry().fromBufferGeometry(geometry);

								//      geometry.translate(xMid, yMid, 0);

								var vertices = geometry.vertices;
								var verticesNew = [];
								verticesNew.length = vertices.length;
								for (var v = 0; v < geometry.faces.length; v++) {
										(function () {
												var face = geometry.faces[v];

												var color = new THREE.Color();
												var h = 0.4 + 0.155 * Math.random();
												var s = 0.5 + 0.5 * Math.random();
												var l = 0.3 + 0.5 * Math.random();
												color.setHSL(h, s, l);
												face.vertexColors[0] = color;
												face.vertexColors[1] = color;
												face.vertexColors[2] = color;

												var faceNormal = face.normal.clone().multiplyScalar(Math.random() * 2);
												verticesNew[face['a']] = vertices[face['a']].clone().add(faceNormal);
												verticesNew[face['b']] = vertices[face['b']].clone().add(faceNormal);
												verticesNew[face['c']] = vertices[face['c']].clone().add(faceNormal);
										})();
								};

								geometry.morphTargets.push({
										name: "target1",
										vertices: verticesNew
								});

								geometry = new THREE.BufferGeometry().fromGeometry(geometry);

								////
								var textMesh = new THREE.Mesh(geometry, shaderMaterial);
								//      textMesh.geometry.translate(xMid, yMid, 0);
								textMesh.scale.set(20, 20, 1);
								scene.add(textMesh);

								var UpCount = 1;
								var render = function render() {
										UpCount++;
										if (UpCount <= 20) {
												requestAnimationFrame(render);
												textMesh.scale.set(20, 20, UpCount);
										} else {
												renderTextAnimation(textMesh);
										}
								};
								render();
								console.log(textMesh);
								//renderTextAnimation(textMesh);
						};

						LineGeometry();
						//PlaneGeometry();
						//TextGeometry();
				});

				//renderScene();
		};

		//var renderScene = function() {
		//requestAnimationFrame(renderScene);
		//};

		var amplitude = 0;
		var clock = new THREE.Clock();
		var time = 0;

		var renderTextAnimation = function renderTextAnimation(textMesh) {

				requestAnimationFrame(function () {
						renderTextAnimation(textMesh);
				});

				var delta = clock.getDelta();
				time += delta;
				amplitude = Math.abs(Math.sin(time * 0.5));
				textMesh.morphTargetInfluences[0] = amplitude;
				if (time > 2) {
						scale1Fn(textMesh);
						if (!stateChangeB) {
								stateChange();
								stateChangeB = true;
						}
				};
		};

		var scale1 = 20;
		var scale1Fn = function scale1Fn(textMesh) {
				if (scale1 > 3) {
						scale1 -= 0.5;
						textMesh.scale.set(scale1, scale1, scale1);
						textMesh.position.y += 150 / (20 - 3) / 2;
				}
		};

		var stateChangeB = false;

		function stateChange() {
				state.msg = '标题文字即将到位';
				state.code++;
				stateChangeB = true;
		};

		function scene2() {
				renderer.domElement.style.opacity = 0;
				lights.forEach(function (light) {
						scene.remove(light);
				});

				var opacityN = 0;
				if (window.browserInfo.mobile) {
						camera.position.set(0, 0, 1600);
				} else {
						camera.position.set(0, 0, 500);
				}
				var render = function render() {
						opacityN += 5;
						if (opacityN <= 100) {
								requestAnimationFrame(render);
								renderer.domElement.style.opacity = opacityN / 100;
						}
				};
				render();

				skyBoxInit();
				lensflareInit(0x01ff67, {
						x: 908,
						y: 310,
						z: 1024
				});
				lensflareInit(0xff0101, {
						x: 1024,
						y: 342,
						z: -793
				});
				lensflareInit(0xfbff00, {
						x: -1024,
						y: 290,
						z: -918
				});
				lensflareInit(0x0400ff, {
						x: -228,
						y: 136,
						z: 1024
				});

				init();
		};

		var y_y = scene2;
		return y_y;
}();

/*js/content.js*/
var _content_module = function () {

		var interaction = _content_click_module;

		(function () {
				/**
     * @author alteredq / http://alteredqualia.com/
     */

				THREE.SceneUtils = {

						createMultiMaterialObject: function createMultiMaterialObject(geometry, materials) {

								var group = new THREE.Group();

								for (var i = 0, l = materials.length; i < l; i++) {

										group.add(new THREE.Mesh(geometry, materials[i]));
								}

								return group;
						},

						detach: function detach(child, parent, scene) {

								child.applyMatrix(parent.matrixWorld);
								parent.remove(child);
								scene.add(child);
						},

						attach: function attach(child, scene, parent) {

								child.applyMatrix(new THREE.Matrix4().getInverse(parent.matrixWorld));

								scene.remove(child);
								parent.add(child);
						}

				};
		})();

		var phoneMesh, EmailMesh, SiteMesh, htmlResume;
		var interactionObj;

		var urls = function (path) {
				var urls = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
				var format = arguments[2];

				return [path + urls[0] + format, path + urls[1] + format, path + urls[2] + format, path + urls[3] + format, path + urls[4] + format, path + urls[5] + format];
		}("./img/", ['px', 'nx', 'py', 'ny', 'pz', 'nz'], '.jpg');

		var planeInit = function planeInit() {
				/*创建平面*/
				var planeGeometry = new THREE.PlaneGeometry(240, 360);
				var planeMaterial = new THREE.MeshPhongMaterial({
						color: 0x666666
						//side: THREE.DoubleSide
				});
				var plane = new THREE.Mesh(planeGeometry, planeMaterial);
				plane.name = 'plane';
				//plane.receiveShadow = true; /*承接阴影*/

				plane.position.z = -10;
				scene.add(plane);
				var reflectionCube = new THREE.CubeTextureLoader().load(urls);
				reflectionCube.format = THREE.RGBFormat;
				plane.material.envMap = reflectionCube;
				//plane.material.emissiveIntensity = 0.1;
				//plane.material.shininess = 0.1;
				plane.material.needsUpdate = true;
				return plane;
		};

		var textInit = function textInit() {
				var rowAll = rowAllFn(5, 14, 220, 320);

				var theRow = 0,
				    theCol = 0;

				var s = 0;
				var textG = new THREE.Group();
				textG.position.set(-108, -180, 0);
				scene.add(textG);
				TextMain('姓姓名:王利　性别:男　 年龄:30　 学历:大专\n', 12);
				s = textG.children.length;
				TextMain('居住地:武汉洪山区　  ', 10);
				SiteMesh = textG.children.slice(s);
				s = textG.children.length;
				TextMain('电话:13260539108\n', 10);
				phoneMesh = textG.children.slice(s);
				s = textG.children.length;
				TextMain('E-mail:1046171507@qq.com', 10);
				EmailMesh = textG.children.slice(s);
				TextMain('  工作年限:5年 \n', 10);
				TextMain('职位方向:Vue webGL GIS BIM\n期望薪资:18K+　  工作状态:在职(一周到岗)', 10);
				s = textG.children.length;
				TextMain('\n\n              『html版简历』\n', 12);
				TextMain('    (做之前没考虑英文大小不定,做的有点差)\n\n', 8);
				htmlResume = textG.children.slice(s);
				TextMain('自我评价:我是一个执着于技术的程序员,能够发散式思考,灵活解决项目上的问题;熟练使用THREE,Vue,H5,CSS3-3d,Js,es6,svg,canvas,ECharts;熟悉Create.js,D3.js;熟悉webpack(做过从零开始搭建的那种), node.js(写过node工具), github(会用SourceTree);\n\n', 10);
				TextMain('历经公司:\n2018-02~至今  北京蜂向科技(武汉)研发中心;\n2016-09~2018-01 东湖大数据交易中心;\n2015-05~2016-08 良印科技(北京外包);\n2013-05~2014-12 北京清华医院', 10);
				interactionObj = {
						phone: phoneMesh,
						email: EmailMesh,
						site: SiteMesh,
						html: htmlResume
				};
				interaction(interactionObj);

				//var reflectionCube = new THREE.CubeTextureLoader().load(urls);
				//reflectionCube.format = THREE.RGBFormat;
				///*设置自发光*/
				//reflectionMesh.material.emissive.setHex(0xffffff);
				///*设置镜面反射*/
				//reflectionMesh.material.specular.setHex(0xffffff);
				///*设置环境贴图*/
				//reflectionMesh.material.envMap = reflectionCube;
				///*更新材质参数*/
				//reflectionMesh.material.needsUpdate = true;

				//Object.values(interactionObj).flat().forEach((mesh) => {
				//  mesh.material.envMap = reflectionCube;
				//  mesh.material.needsUpdate = true;
				//});

				var UpCount = 0;
				var textGCL = textG.children.length;
				var textGCR = 0;
				var textGCRB = 1;
				var minR = Math.PI / 180 * 15,
				    maxR = minR * -1;
				var render = function render() {
						UpCount++;
						requestAnimationFrame(render);
						if (UpCount < textGCL) {
								textG.children[UpCount].visible = true;
						} else if (UpCount > textGCL * 1.2) {
								if (textGCR > minR || textGCR < maxR) textGCRB *= -1;
								textG.children.forEach(function (c) {
										textGCR += 0.00003 * textGCRB;
										c.rotation.y = textGCR;
								});
						}
						if (UpCount == textGCL) {
								spriteT();
						}
				};
				render();

				function spriteT() {
						var spriteMap = new THREE.TextureLoader().load('./img/t-l.png');

						var spriteMaterial = new THREE.SpriteMaterial({
								map: spriteMap,
								color: 0xffffff
						});

						var sprite_t = new THREE.Sprite(spriteMaterial);
						sprite_t.scale.set(100, 100, 1);
						sprite_t.position.set(0, 295, 0);
						textG.add(sprite_t);

						var sprite_t2 = sprite_t.clone();
						sprite_t2.position.set(0, 282, 0);
						textG.add(sprite_t2);

						var spriteMap = new THREE.TextureLoader().load('./img/t-r.png');

						var spriteMaterial = new THREE.SpriteMaterial({
								map: spriteMap,
								color: 0xffffff
						});

						var sprite_t = new THREE.Sprite(spriteMaterial);
						sprite_t.scale.set(100, 100, 1);
						sprite_t.position.set(178, 295, 0);
						textG.add(sprite_t);
						var sprite_t2 = sprite_t.clone();
						sprite_t2.position.set(144, 225, 0);
						textG.add(sprite_t2);
				};

				function TextMain(texts, size) {
						var textArr = texts.split('');
						textArr.forEach(function (t) {
								if (t == '\n') {
										theRow++;
										theCol = 0;
								} else {
										if (theCol + 1 >= rowAll[0].length) {
												theRow++;
												theCol = 0;
										};
										if (t == ' ' || t == '　') {
												theCol++;
										} else if (/[\u2E80-\u9FFFmMWGQHD\@]/.test(t)) {
												var _sprite$position;

												var sprite = generateText(t, size, 'cn');
												//sprite.material.color.setHSL(0.5 + theCol / rowAll[0].length / 2, 1 - theRow / rowAll.length, 0.5);
												(_sprite$position = sprite.position).set.apply(_sprite$position, _toConsumableArray(rowAll[theRow][theCol]));
												sprite.position.x += 3;
												sprite.visible = false;
												textG.add(sprite);
												theCol += 2;
										} else {
												var _sprite$position2;

												var sprite = generateText(t, size, 'en');
												//sprite.material.color.setHSL(0.5 + theCol / rowAll[0].length / 2, 1 - theRow / rowAll.length, 0.5);
												(_sprite$position2 = sprite.position).set.apply(_sprite$position2, _toConsumableArray(rowAll[theRow][theCol]));
												sprite.visible = false;
												textG.add(sprite);
												theCol++;
										}
								}
						});
				};
		};

		function rowAllFn(xi, yi, w, h) {
				var rowAll = [];
				var wc = Math.floor(w / xi),
				    hc = Math.floor(h / yi);
				for (var i = 0; i < hc; i++) {
						var col = [];
						rowAll.push(col);
						for (var j = 0; j < wc; j++) {
								col.push([j * xi, (hc - i) * yi, 0]);
						}
				};
				return rowAll;
		};

		function generateText(text, size, l) {
				var canvas = document.createElement("canvas");
				var ctx = canvas.getContext("2d");
				if (l == 'en') {
						canvas.width = 16 * 8;
						canvas.height = 32 * 8;
				} else {
						canvas.width = 32 * 8;
						canvas.height = 32 * 8;
				}

				ctx.fillStyle = "#FFFFFF";
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				ctx.fillStyle = "#000000";
				ctx.font = "160pt arial bold";

				if (l == 'en') {
						ctx.fillText(text, 1 * 8, 24 * 8);
				} else {
						ctx.fillText(text, 3 * 8, 24 * 8);
				}

				var map = new THREE.CanvasTexture(canvas);
				map.wrapS = map.wrapT = THREE.RepeatWrapping;

				var spriteMaterial = new THREE.MeshPhongMaterial({
						map: map,
						color: 0xffffff
				});

				var cube = new THREE.BoxBufferGeometry(1, 1, 1);

				if (l == 'en') {
						var cube = new THREE.BoxBufferGeometry(size / 2, size, size);
				} else {
						var cube = new THREE.BoxBufferGeometry(size, size, size);
				}
				var sprite = new THREE.Mesh(cube, spriteMaterial);

				return sprite;
		};

		function init() {
				/*TODO 鼠标滚轮控制*/
				var mouseControls = new THREE.OrbitControls(camera, renderer.domElement);
				mouseControls.target.copy(scene.position);
				mouseControls.update();
				/*鼠标滚轮控制END*/
				planeInit();
				//textInit();

				setTimeout(textInit, 1500);
		};

		function scene3() {
				init();
		};

		var y_y = scene3;
		return y_y;
}();

/*./js/index.js*/
var _index_module = function () {
		var scene1 = _prologue_module; //开场相关3D场景
		var scene2 = _title_module; //加入'个人简历'字
		var scene3 = _content_module; //加入'个人简历'字
		state.events.push(scene1);
		state.events.push(scene2);
		state.events.push(scene3);

		body = document.querySelector('body');
		video = document.querySelector('#video');
		container = document.querySelector('#three-container');

		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
		if (window.browserInfo.mobile) {
				camera.position.z = 1600;
		} else {
				camera.position.z = 500;
		};

		var light = new THREE.AmbientLight(0xffffff, 0.1);
		scene.add(light);
		window.lights = [];
		lights[0] = new THREE.PointLight(0xff0000, 1, 0);
		lights[1] = new THREE.PointLight(0x00ff00, 1, 0);
		lights[2] = new THREE.PointLight(0x0000ff, 1, 0);

		lights[0].position.set(0, 200, 0);
		lights[1].position.set(100, 200, 100);
		lights[2].position.set(-100, -200, -100);

		scene.add(lights[0]);
		scene.add(lights[1]);
		scene.add(lights[2]);

		renderer = new THREE.WebGLRenderer({
				antialias: true
		});
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		//renderer.gammaOutput = true;
		//renderer.gammaFactor = 2.2;
		//renderer.autoClear = false;
		//
		//renderer.shadowMap.enabled = true;
		//renderer.shadowMap.type = THREE.PCFShadowMap;
		container.appendChild(renderer.domElement);

		doc.ready(function () {
				if (WEBGL.isWebGLAvailable() === false) {
						document.body.appendChild(WEBGL.getWebGLErrorMessage());
				};

				eventOne('body', 'click', function () {
						video.style.opacity = 0;
						container.style.opacity = 1;
						state.msg = '视屏切换为3D';
						state.code++;
				});
		});

		stats = new Stats();
		container.appendChild(stats.dom);

		function animate() {
				requestAnimationFrame(animate);
				stats.update();
				renderer.render(scene, camera);
		};

		animate();
}();

