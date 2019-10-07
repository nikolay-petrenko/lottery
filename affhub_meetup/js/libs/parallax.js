/**
* Parallax.js
* @author Matthew Wagerfield - @wagerfield, René Roth - mail@reneroth.org
* @description Creates a parallax effect between an array of layers,
*              driving the motion from the gyroscope output of a smartdevice.
*              If no gyroscope is available, the cursor position is used.
*/

const rqAnFr = require('raf')
const objectAssign = require('object-assign')

const helpers = {
  propertyCache: {},
  vendors: [null, ['-webkit-', 'webkit'], ['-moz-', 'Moz'], ['-o-', 'O'], ['-ms-', 'ms']],

  clamp(value, min, max) {
    return min < max
      ? (value < min ? min : value > max ? max : value)
      : (value < max ? max : value > min ? min : value)
  },

  data(element, name) {
    return helpers.deserialize(element.getAttribute('data-' + name))
  },

  deserialize(value) {
    if (value === 'true') {
      return true
    } else if (value === 'false') {
      return false
    } else if (value === 'null') {
      return null
    } else if (!isNaN(parseFloat(value)) && isFinite(value)) {
      return parseFloat(value)
    } else {
      return value
    }
  },

  camelCase(value) {
    return value.replace(/-+(.)?/g, (match, character) => {
      return character ? character.toUpperCase() : ''
    })
  },

  accelerate(element) {
    helpers.css(element, 'transform', 'translate3d(0,0,0) rotate(0.0001deg)')
    helpers.css(element, 'transform-style', 'preserve-3d')
    helpers.css(element, 'backface-visibility', 'hidden')
  },

  transformSupport(value) {
    let element = document.createElement('div'),
      propertySupport = false,
      propertyValue = null,
      featureSupport = false,
      cssProperty = null,
      jsProperty = null
    for (let i = 0, l = helpers.vendors.length; i < l; i++) {
      if (helpers.vendors[i] !== null) {
        cssProperty = helpers.vendors[i][0] + 'transform'
        jsProperty = helpers.vendors[i][1] + 'Transform'
      } else {
        cssProperty = 'transform'
        jsProperty = 'transform'
      }
      if (element.style[jsProperty] !== undefined) {
        propertySupport = true
        break
      }
    }
    switch (value) {
      case '2D':
        featureSupport = propertySupport
        break
      case '3D':
        if (propertySupport) {
          let body = document.body || document.createElement('body'),
            documentElement = document.documentElement,
            documentOverflow = documentElement.style.overflow,
            isCreatedBody = false

          if (!document.body) {
            isCreatedBody = true
            documentElement.style.overflow = 'hidden'
            documentElement.appendChild(body)
            body.style.overflow = 'hidden'
            body.style.background = ''
          }

          body.appendChild(element)
          element.style[jsProperty] = 'translate3d(1px,1px,1px)'
          propertyValue = window.getComputedStyle(element).getPropertyValue(cssProperty)
          featureSupport = propertyValue !== undefined && propertyValue.length > 0 && propertyValue !== 'none'
          documentElement.style.overflow = documentOverflow
          body.removeChild(element)

          if (isCreatedBody) {
            body.removeAttribute('style')
            body.parentNode.removeChild(body)
          }
        }
        break
    }
    return featureSupport
  },

  css(element, property, value) {
    let jsProperty = helpers.propertyCache[property]
    if (!jsProperty) {
      for (let i = 0, l = helpers.vendors.length; i < l; i++) {
        if (helpers.vendors[i] !== null) {
          jsProperty = helpers.camelCase(helpers.vendors[i][1] + '-' + property)
        } else {
          jsProperty = property
        }
        if (element.style[jsProperty] !== undefined) {
          helpers.propertyCache[property] = jsProperty
          break
        }
      }
    }
    element.style[jsProperty] = value
  }

}

const MAGIC_NUMBER = 30,
  DEFAULTS = {
    relativeInput: false,
    clipRelativeInput: false,
    inputElement: null,
    hoverOnly: false,
    calibrationThreshold: 100,
    calibrationDelay: 500,
    supportDelay: 500,
    calibrateX: false,
    calibrateY: true,
    invertX: true,
    invertY: true,
    limitX: false,
    limitY: false,
    scalarX: 10.0,
    scalarY: 10.0,
    frictionX: 0.1,
    frictionY: 0.1,
    originX: 0.5,
    originY: 0.5,
    pointerEvents: false,
    precision: 1,
    onReady: null,
    selector: null
  }

class Parallax {
  constructor(element, options) {

    this.element = element

    const data = {
      calibrateX: helpers.data(this.element, 'calibrate-x'),
      calibrateY: helpers.data(this.element, 'calibrate-y'),
      invertX: helpers.data(this.element, 'invert-x'),
      invertY: helpers.data(this.element, 'invert-y'),
      limitX: helpers.data(this.element, 'limit-x'),
      limitY: helpers.data(this.element, 'limit-y'),
      scalarX: helpers.data(this.element, 'scalar-x'),
      scalarY: helpers.data(this.element, 'scalar-y'),
      frictionX: helpers.data(this.element, 'friction-x'),
      frictionY: helpers.data(this.element, 'friction-y'),
      originX: helpers.data(this.element, 'origin-x'),
      originY: helpers.data(this.element, 'origin-y'),
      pointerEvents: helpers.data(this.element, 'pointer-events'),
      precision: helpers.data(this.element, 'precision'),
      relativeInput: helpers.data(this.element, 'relative-input'),
      clipRelativeInput: helpers.data(this.element, 'clip-relative-input'),
      hoverOnly: helpers.data(this.element, 'hover-only'),
      inputElement: document.querySelector(helpers.data(this.element, 'input-element')),
      selector: helpers.data(this.element, 'selector')
    }

    for (let key in data) {
      if (data[key] === null) {
        delete data[key]
      }
    }

    objectAssign(this, DEFAULTS, data, options)

    if (!this.inputElement) {
      this.inputElement = this.element
    }

    this.calibrationTimer = null
    this.calibrationFlag = true
    this.enabled = false
    this.depthsX = []
    this.depthsY = []
    this.raf = null

    this.bounds = null
    this.elementPositionX = 0
    this.elementPositionY = 0
    this.elementWidth = 0
    this.elementHeight = 0

    this.elementCenterX = 0
    this.elementCenterY = 0

    this.elementRangeX = 0
    this.elementRangeY = 0

    this.calibrationX = 0
    this.calibrationY = 0

    this.inputX = 0
    this.inputY = 0

    this.motionX = 0
    this.motionY = 0

    this.velocityX = 0
    this.velocityY = 0

    this.onMouseMove = this.onMouseMove.bind(this)
    this.onDeviceOrientation = this.onDeviceOrientation.bind(this)
    this.onDeviceMotion = this.onDeviceMotion.bind(this)
    this.onOrientationTimer = this.onOrientationTimer.bind(this)
    this.onMotionTimer = this.onMotionTimer.bind(this)
    this.onCalibrationTimer = this.onCalibrationTimer.bind(this)
    this.onAnimationFrame = this.onAnimationFrame.bind(this)
    this.onWindowResize = this.onWindowResize.bind(this)

    this.windowWidth = null
    this.windowHeight = null
    this.windowCenterX = null
    this.windowCenterY = null
    this.windowRadiusX = null
    this.windowRadiusY = null
    this.portrait = false
    this.desktop = !navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|mobi|tablet|opera mini|nexus 7)/i)
    this.motionSupport = !!window.DeviceMotionEvent && !this.desktop
    this.orientationSupport = !!window.DeviceOrientationEvent && !this.desktop
    this.orientationStatus = 0
    this.motionStatus = 0

    this.initialise()
  }

  initialise() {
    if (this.transform2DSupport === undefined) {
      this.transform2DSupport = helpers.transformSupport('2D')
      this.transform3DSupport = helpers.transformSupport('3D')
    }

    // Configure Context Styles
    if (this.transform3DSupport) {
      helpers.accelerate(this.element)
    }

    let style = window.getComputedStyle(this.element)
    if (style.getPropertyValue('position') === 'static') {
      this.element.style.position = 'relative'
    }

    // Pointer events
    if (!this.pointerEvents) {
      this.element.style.pointerEvents = 'visible'
    }

    // Setup
    this.updateLayers()
    this.updateDimensions()
    this.enable()
    this.queueCalibration(this.calibrationDelay)
  }

  doReadyCallback() {
    if (this.onReady) {
      this.onReady()
    }
  }

  updateLayers() {
    if (this.selector) {
      this.layers = this.element.querySelectorAll(this.selector)
    } else {
      this.layers = this.element.children
    }

    if (!this.layers.length) {
      console.warn('ParallaxJS: Your scene does not have any layers.')
    }

    this.depthsX = []
    this.depthsY = []

    for (let index = 0; index < this.layers.length; index++) {
      let layer = this.layers[index]

      if (this.transform3DSupport) {
        helpers.accelerate(layer)
      }

      layer.style.position = index ? 'absolute' : 'relative'
      layer.style.display = 'block'
      layer.style.left = 0
      layer.style.top = 0

      let depth = helpers.data(layer, 'depth') || 0
      this.depthsX.push(helpers.data(layer, 'depth-x') || depth)
      this.depthsY.push(helpers.data(layer, 'depth-y') || depth)
    }
  }

  updateDimensions() {
    this.windowWidth = window.innerWidth
    this.windowHeight = window.innerHeight
    this.windowCenterX = this.windowWidth * this.originX
    this.windowCenterY = this.windowHeight * this.originY
    this.windowRadiusX = Math.max(this.windowCenterX, this.windowWidth - this.windowCenterX)
    this.windowRadiusY = Math.max(this.windowCenterY, this.windowHeight - this.windowCenterY)
  }

  updateBounds() {
    this.bounds = this.inputElement.getBoundingClientRect()
    this.elementPositionX = this.bounds.left
    this.elementPositionY = this.bounds.top
    this.elementWidth = this.bounds.width
    this.elementHeight = this.bounds.height
    this.elementCenterX = this.elementWidth * this.originX
    this.elementCenterY = this.elementHeight * this.originY
    this.elementRangeX = Math.max(this.elementCenterX, this.elementWidth - this.elementCenterX)
    this.elementRangeY = Math.max(this.elementCenterY, this.elementHeight - this.elementCenterY)
  }

  queueCalibration(delay) {
    clearTimeout(this.calibrationTimer)
    this.calibrationTimer = setTimeout(this.onCalibrationTimer, delay)
  }

  enable() {
    if (this.enabled) {
      return
    }
    this.enabled = true

    if (this.orientationSupport) {
      this.portrait = false
      window.addEventListener('deviceorientation', this.onDeviceOrientation)
      this.detectionTimer = setTimeout(this.onOrientationTimer, this.supportDelay)
    } else if (this.motionSupport) {
      this.portrait = false
      window.addEventListener('devicemotion', this.onDeviceMotion)
      this.detectionTimer = setTimeout(this.onMotionTimer, this.supportDelay)
    } else {
      this.calibrationX = 0
      this.calibrationY = 0
      this.portrait = false
      window.addEventListener('mousemove', this.onMouseMove)
      this.doReadyCallback()
    }

    window.addEventListener('resize', this.onWindowResize)
    this.raf = rqAnFr(this.onAnimationFrame)
  }

  disable() {
    if (!this.enabled) {
      return
    }
    this.enabled = false

    if (this.orientationSupport) {
      window.removeEventListener('deviceorientation', this.onDeviceOrientation)
    } else if (this.motionSupport) {
      window.removeEventListener('devicemotion', this.onDeviceMotion)
    } else {
      window.removeEventListener('mousemove', this.onMouseMove)
    }

    window.removeEventListener('resize', this.onWindowResize)
    rqAnFr.cancel(this.raf)
  }

  calibrate(x, y) {
    this.calibrateX = x === undefined ? this.calibrateX : x
    this.calibrateY = y === undefined ? this.calibrateY : y
  }

  invert(x, y) {
    this.invertX = x === undefined ? this.invertX : x
    this.invertY = y === undefined ? this.invertY : y
  }

  friction(x, y) {
    this.frictionX = x === undefined ? this.frictionX : x
    this.frictionY = y === undefined ? this.frictionY : y
  }

  scalar(x, y) {
    this.scalarX = x === undefined ? this.scalarX : x
    this.scalarY = y === undefined ? this.scalarY : y
  }

  limit(x, y) {
    this.limitX = x === undefined ? this.limitX : x
    this.limitY = y === undefined ? this.limitY : y
  }

  origin(x, y) {
    this.originX = x === undefined ? this.originX : x
    this.originY = y === undefined ? this.originY : y
  }

  setInputElement(element) {
    this.inputElement = element
    this.updateDimensions()
  }

  setPosition(element, x, y) {
    x = x.toFixed(this.precision) + 'px'
    y = y.toFixed(this.precision) + 'px'
    if (this.transform3DSupport) {
      helpers.css(element, 'transform', 'translate3d(' + x + ',' + y + ',0)')
    } else if (this.transform2DSupport) {
      helpers.css(element, 'transform', 'translate(' + x + ',' + y + ')')
    } else {
      element.style.left = x
      element.style.top = y
    }
  }

  onOrientationTimer() {
    if (this.orientationSupport && this.orientationStatus === 0) {
      this.disable()
      this.orientationSupport = false
      this.enable()
    } else {
      this.doReadyCallback()
    }
  }

  onMotionTimer() {
    if (this.motionSupport && this.motionStatus === 0) {
      this.disable()
      this.motionSupport = false
      this.enable()
    } else {
      this.doReadyCallback()
    }
  }

  onCalibrationTimer() {
    this.calibrationFlag = true
  }

  onWindowResize() {
    this.updateDimensions()
  }

  onAnimationFrame() {
    this.updateBounds()
    let calibratedInputX = this.inputX - this.calibrationX,
      calibratedInputY = this.inputY - this.calibrationY
    if ((Math.abs(calibratedInputX) > this.calibrationThreshold) || (Math.abs(calibratedInputY) > this.calibrationThreshold)) {
      this.queueCalibration(0)
    }
    if (this.portrait) {
      this.motionX = this.calibrateX ? calibratedInputY : this.inputY
      this.motionY = this.calibrateY ? calibratedInputX : this.inputX
    } else {
      this.motionX = this.calibrateX ? calibratedInputX : this.inputX
      this.motionY = this.calibrateY ? calibratedInputY : this.inputY
    }
    this.motionX *= this.elementWidth * (this.scalarX / 100)
    this.motionY *= this.elementHeight * (this.scalarY / 100)
    if (!isNaN(parseFloat(this.limitX))) {
      this.motionX = helpers.clamp(this.motionX, -this.limitX, this.limitX)
    }
    if (!isNaN(parseFloat(this.limitY))) {
      this.motionY = helpers.clamp(this.motionY, -this.limitY, this.limitY)
    }
    this.velocityX += (this.motionX - this.velocityX) * this.frictionX
    this.velocityY += (this.motionY - this.velocityY) * this.frictionY
    for (let index = 0; index < this.layers.length; index++) {
      let layer = this.layers[index],
        depthX = this.depthsX[index],
        depthY = this.depthsY[index],
        xOffset = this.velocityX * (depthX * (this.invertX ? -1 : 1)),
        yOffset = this.velocityY * (depthY * (this.invertY ? -1 : 1))
      this.setPosition(layer, xOffset, yOffset)
    }
    this.raf = rqAnFr(this.onAnimationFrame)
  }

  rotate(beta, gamma) {
    // Extract Rotation
    let x = (beta || 0) / MAGIC_NUMBER, //  -90 :: 90
      y = (gamma || 0) / MAGIC_NUMBER // -180 :: 180

    // Detect Orientation Change
    let portrait = this.windowHeight > this.windowWidth
    if (this.portrait !== portrait) {
      this.portrait = portrait
      this.calibrationFlag = true
    }

    if (this.calibrationFlag) {
      this.calibrationFlag = false
      this.calibrationX = x
      this.calibrationY = y
    }

    this.inputX = x
    this.inputY = y
  }

  onDeviceOrientation(event) {
    let beta = event.beta
    let gamma = event.gamma
    if (beta !== null && gamma !== null) {
      this.orientationStatus = 1
      this.rotate(beta, gamma)
    }
  }

  onDeviceMotion(event) {
    let beta = event.rotationRate.beta
    let gamma = event.rotationRate.gamma
    if (beta !== null && gamma !== null) {
      this.motionStatus = 1
      this.rotate(beta, gamma)
    }
  }

  onMouseMove(event) {
    let clientX = event.clientX,
      clientY = event.clientY

    // reset input to center if hoverOnly is set and we're not hovering the element
    if (this.hoverOnly &&
      ((clientX < this.elementPositionX || clientX > this.elementPositionX + this.elementWidth) ||
        (clientY < this.elementPositionY || clientY > this.elementPositionY + this.elementHeight))) {
      this.inputX = 0
      this.inputY = 0
      return
    }

    if (this.relativeInput) {
      // Clip mouse coordinates inside element bounds.
      if (this.clipRelativeInput) {
        clientX = Math.max(clientX, this.elementPositionX)
        clientX = Math.min(clientX, this.elementPositionX + this.elementWidth)
        clientY = Math.max(clientY, this.elementPositionY)
        clientY = Math.min(clientY, this.elementPositionY + this.elementHeight)
      }
      // Calculate input relative to the element.
      if (this.elementRangeX && this.elementRangeY) {
        this.inputX = (clientX - this.elementPositionX - this.elementCenterX) / this.elementRangeX
        this.inputY = (clientY - this.elementPositionY - this.elementCenterY) / this.elementRangeY
      }
    } else {
      // Calculate input relative to the window.
      if (this.windowRadiusX && this.windowRadiusY) {
        this.inputX = (clientX - this.windowCenterX) / this.windowRadiusX
        this.inputY = (clientY - this.windowCenterY) / this.windowRadiusY
      }
    }
  }

  destroy() {
    this.disable()

    clearTimeout(this.calibrationTimer)
    clearTimeout(this.detectionTimer)

    this.element.removeAttribute('style')
    for (let index = 0; index < this.layers.length; index++) {
      this.layers[index].removeAttribute('style')
    }

    delete this.element
    delete this.layers
  }

  version() {
    return '3.1.0'
  }

}

module.exports = Parallax

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsaWJzL3BhcmFsbGF4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBQYXJhbGxheC5qc1xuKiBAYXV0aG9yIE1hdHRoZXcgV2FnZXJmaWVsZCAtIEB3YWdlcmZpZWxkLCBSZW7DqSBSb3RoIC0gbWFpbEByZW5lcm90aC5vcmdcbiogQGRlc2NyaXB0aW9uIENyZWF0ZXMgYSBwYXJhbGxheCBlZmZlY3QgYmV0d2VlbiBhbiBhcnJheSBvZiBsYXllcnMsXG4qICAgICAgICAgICAgICBkcml2aW5nIHRoZSBtb3Rpb24gZnJvbSB0aGUgZ3lyb3Njb3BlIG91dHB1dCBvZiBhIHNtYXJ0ZGV2aWNlLlxuKiAgICAgICAgICAgICAgSWYgbm8gZ3lyb3Njb3BlIGlzIGF2YWlsYWJsZSwgdGhlIGN1cnNvciBwb3NpdGlvbiBpcyB1c2VkLlxuKi9cblxuY29uc3QgcnFBbkZyID0gcmVxdWlyZSgncmFmJylcbmNvbnN0IG9iamVjdEFzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKVxuXG5jb25zdCBoZWxwZXJzID0ge1xuICBwcm9wZXJ0eUNhY2hlOiB7fSxcbiAgdmVuZG9yczogW251bGwsIFsnLXdlYmtpdC0nLCAnd2Via2l0J10sIFsnLW1vei0nLCAnTW96J10sIFsnLW8tJywgJ08nXSwgWyctbXMtJywgJ21zJ11dLFxuXG4gIGNsYW1wKHZhbHVlLCBtaW4sIG1heCkge1xuICAgIHJldHVybiBtaW4gPCBtYXhcbiAgICAgID8gKHZhbHVlIDwgbWluID8gbWluIDogdmFsdWUgPiBtYXggPyBtYXggOiB2YWx1ZSlcbiAgICAgIDogKHZhbHVlIDwgbWF4ID8gbWF4IDogdmFsdWUgPiBtaW4gPyBtaW4gOiB2YWx1ZSlcbiAgfSxcblxuICBkYXRhKGVsZW1lbnQsIG5hbWUpIHtcbiAgICByZXR1cm4gaGVscGVycy5kZXNlcmlhbGl6ZShlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS0nICsgbmFtZSkpXG4gIH0sXG5cbiAgZGVzZXJpYWxpemUodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09ICd0cnVlJykge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAnZmFsc2UnKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAnbnVsbCcpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfSBlbHNlIGlmICghaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZSkpICYmIGlzRmluaXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsdWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH1cbiAgfSxcblxuICBjYW1lbENhc2UodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvLSsoLik/L2csIChtYXRjaCwgY2hhcmFjdGVyKSA9PiB7XG4gICAgICByZXR1cm4gY2hhcmFjdGVyID8gY2hhcmFjdGVyLnRvVXBwZXJDYXNlKCkgOiAnJ1xuICAgIH0pXG4gIH0sXG5cbiAgYWNjZWxlcmF0ZShlbGVtZW50KSB7XG4gICAgaGVscGVycy5jc3MoZWxlbWVudCwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUzZCgwLDAsMCkgcm90YXRlKDAuMDAwMWRlZyknKVxuICAgIGhlbHBlcnMuY3NzKGVsZW1lbnQsICd0cmFuc2Zvcm0tc3R5bGUnLCAncHJlc2VydmUtM2QnKVxuICAgIGhlbHBlcnMuY3NzKGVsZW1lbnQsICdiYWNrZmFjZS12aXNpYmlsaXR5JywgJ2hpZGRlbicpXG4gIH0sXG5cbiAgdHJhbnNmb3JtU3VwcG9ydCh2YWx1ZSkge1xuICAgIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICBwcm9wZXJ0eVN1cHBvcnQgPSBmYWxzZSxcbiAgICAgIHByb3BlcnR5VmFsdWUgPSBudWxsLFxuICAgICAgZmVhdHVyZVN1cHBvcnQgPSBmYWxzZSxcbiAgICAgIGNzc1Byb3BlcnR5ID0gbnVsbCxcbiAgICAgIGpzUHJvcGVydHkgPSBudWxsXG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBoZWxwZXJzLnZlbmRvcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAoaGVscGVycy52ZW5kb3JzW2ldICE9PSBudWxsKSB7XG4gICAgICAgIGNzc1Byb3BlcnR5ID0gaGVscGVycy52ZW5kb3JzW2ldWzBdICsgJ3RyYW5zZm9ybSdcbiAgICAgICAganNQcm9wZXJ0eSA9IGhlbHBlcnMudmVuZG9yc1tpXVsxXSArICdUcmFuc2Zvcm0nXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjc3NQcm9wZXJ0eSA9ICd0cmFuc2Zvcm0nXG4gICAgICAgIGpzUHJvcGVydHkgPSAndHJhbnNmb3JtJ1xuICAgICAgfVxuICAgICAgaWYgKGVsZW1lbnQuc3R5bGVbanNQcm9wZXJ0eV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwcm9wZXJ0eVN1cHBvcnQgPSB0cnVlXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIHN3aXRjaCAodmFsdWUpIHtcbiAgICAgIGNhc2UgJzJEJzpcbiAgICAgICAgZmVhdHVyZVN1cHBvcnQgPSBwcm9wZXJ0eVN1cHBvcnRcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJzNEJzpcbiAgICAgICAgaWYgKHByb3BlcnR5U3VwcG9ydCkge1xuICAgICAgICAgIGxldCBib2R5ID0gZG9jdW1lbnQuYm9keSB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib2R5JyksXG4gICAgICAgICAgICBkb2N1bWVudEVsZW1lbnQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXG4gICAgICAgICAgICBkb2N1bWVudE92ZXJmbG93ID0gZG9jdW1lbnRFbGVtZW50LnN0eWxlLm92ZXJmbG93LFxuICAgICAgICAgICAgaXNDcmVhdGVkQm9keSA9IGZhbHNlXG5cbiAgICAgICAgICBpZiAoIWRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIGlzQ3JlYXRlZEJvZHkgPSB0cnVlXG4gICAgICAgICAgICBkb2N1bWVudEVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJ1xuICAgICAgICAgICAgZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKGJvZHkpXG4gICAgICAgICAgICBib2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbidcbiAgICAgICAgICAgIGJvZHkuc3R5bGUuYmFja2dyb3VuZCA9ICcnXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYm9keS5hcHBlbmRDaGlsZChlbGVtZW50KVxuICAgICAgICAgIGVsZW1lbnQuc3R5bGVbanNQcm9wZXJ0eV0gPSAndHJhbnNsYXRlM2QoMXB4LDFweCwxcHgpJ1xuICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KS5nZXRQcm9wZXJ0eVZhbHVlKGNzc1Byb3BlcnR5KVxuICAgICAgICAgIGZlYXR1cmVTdXBwb3J0ID0gcHJvcGVydHlWYWx1ZSAhPT0gdW5kZWZpbmVkICYmIHByb3BlcnR5VmFsdWUubGVuZ3RoID4gMCAmJiBwcm9wZXJ0eVZhbHVlICE9PSAnbm9uZSdcbiAgICAgICAgICBkb2N1bWVudEVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSBkb2N1bWVudE92ZXJmbG93XG4gICAgICAgICAgYm9keS5yZW1vdmVDaGlsZChlbGVtZW50KVxuXG4gICAgICAgICAgaWYgKGlzQ3JlYXRlZEJvZHkpIHtcbiAgICAgICAgICAgIGJvZHkucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpXG4gICAgICAgICAgICBib2R5LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoYm9keSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICB9XG4gICAgcmV0dXJuIGZlYXR1cmVTdXBwb3J0XG4gIH0sXG5cbiAgY3NzKGVsZW1lbnQsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIGxldCBqc1Byb3BlcnR5ID0gaGVscGVycy5wcm9wZXJ0eUNhY2hlW3Byb3BlcnR5XVxuICAgIGlmICghanNQcm9wZXJ0eSkge1xuICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBoZWxwZXJzLnZlbmRvcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChoZWxwZXJzLnZlbmRvcnNbaV0gIT09IG51bGwpIHtcbiAgICAgICAgICBqc1Byb3BlcnR5ID0gaGVscGVycy5jYW1lbENhc2UoaGVscGVycy52ZW5kb3JzW2ldWzFdICsgJy0nICsgcHJvcGVydHkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAganNQcm9wZXJ0eSA9IHByb3BlcnR5XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsZW1lbnQuc3R5bGVbanNQcm9wZXJ0eV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGhlbHBlcnMucHJvcGVydHlDYWNoZVtwcm9wZXJ0eV0gPSBqc1Byb3BlcnR5XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlbGVtZW50LnN0eWxlW2pzUHJvcGVydHldID0gdmFsdWVcbiAgfVxuXG59XG5cbmNvbnN0IE1BR0lDX05VTUJFUiA9IDMwLFxuICBERUZBVUxUUyA9IHtcbiAgICByZWxhdGl2ZUlucHV0OiBmYWxzZSxcbiAgICBjbGlwUmVsYXRpdmVJbnB1dDogZmFsc2UsXG4gICAgaW5wdXRFbGVtZW50OiBudWxsLFxuICAgIGhvdmVyT25seTogZmFsc2UsXG4gICAgY2FsaWJyYXRpb25UaHJlc2hvbGQ6IDEwMCxcbiAgICBjYWxpYnJhdGlvbkRlbGF5OiA1MDAsXG4gICAgc3VwcG9ydERlbGF5OiA1MDAsXG4gICAgY2FsaWJyYXRlWDogZmFsc2UsXG4gICAgY2FsaWJyYXRlWTogdHJ1ZSxcbiAgICBpbnZlcnRYOiB0cnVlLFxuICAgIGludmVydFk6IHRydWUsXG4gICAgbGltaXRYOiBmYWxzZSxcbiAgICBsaW1pdFk6IGZhbHNlLFxuICAgIHNjYWxhclg6IDEwLjAsXG4gICAgc2NhbGFyWTogMTAuMCxcbiAgICBmcmljdGlvblg6IDAuMSxcbiAgICBmcmljdGlvblk6IDAuMSxcbiAgICBvcmlnaW5YOiAwLjUsXG4gICAgb3JpZ2luWTogMC41LFxuICAgIHBvaW50ZXJFdmVudHM6IGZhbHNlLFxuICAgIHByZWNpc2lvbjogMSxcbiAgICBvblJlYWR5OiBudWxsLFxuICAgIHNlbGVjdG9yOiBudWxsXG4gIH1cblxuY2xhc3MgUGFyYWxsYXgge1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50XG5cbiAgICBjb25zdCBkYXRhID0ge1xuICAgICAgY2FsaWJyYXRlWDogaGVscGVycy5kYXRhKHRoaXMuZWxlbWVudCwgJ2NhbGlicmF0ZS14JyksXG4gICAgICBjYWxpYnJhdGVZOiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnY2FsaWJyYXRlLXknKSxcbiAgICAgIGludmVydFg6IGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdpbnZlcnQteCcpLFxuICAgICAgaW52ZXJ0WTogaGVscGVycy5kYXRhKHRoaXMuZWxlbWVudCwgJ2ludmVydC15JyksXG4gICAgICBsaW1pdFg6IGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdsaW1pdC14JyksXG4gICAgICBsaW1pdFk6IGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdsaW1pdC15JyksXG4gICAgICBzY2FsYXJYOiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnc2NhbGFyLXgnKSxcbiAgICAgIHNjYWxhclk6IGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdzY2FsYXIteScpLFxuICAgICAgZnJpY3Rpb25YOiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnZnJpY3Rpb24teCcpLFxuICAgICAgZnJpY3Rpb25ZOiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnZnJpY3Rpb24teScpLFxuICAgICAgb3JpZ2luWDogaGVscGVycy5kYXRhKHRoaXMuZWxlbWVudCwgJ29yaWdpbi14JyksXG4gICAgICBvcmlnaW5ZOiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnb3JpZ2luLXknKSxcbiAgICAgIHBvaW50ZXJFdmVudHM6IGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdwb2ludGVyLWV2ZW50cycpLFxuICAgICAgcHJlY2lzaW9uOiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAncHJlY2lzaW9uJyksXG4gICAgICByZWxhdGl2ZUlucHV0OiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAncmVsYXRpdmUtaW5wdXQnKSxcbiAgICAgIGNsaXBSZWxhdGl2ZUlucHV0OiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnY2xpcC1yZWxhdGl2ZS1pbnB1dCcpLFxuICAgICAgaG92ZXJPbmx5OiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnaG92ZXItb25seScpLFxuICAgICAgaW5wdXRFbGVtZW50OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdpbnB1dC1lbGVtZW50JykpLFxuICAgICAgc2VsZWN0b3I6IGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdzZWxlY3RvcicpXG4gICAgfVxuXG4gICAgZm9yIChsZXQga2V5IGluIGRhdGEpIHtcbiAgICAgIGlmIChkYXRhW2tleV0gPT09IG51bGwpIHtcbiAgICAgICAgZGVsZXRlIGRhdGFba2V5XVxuICAgICAgfVxuICAgIH1cblxuICAgIG9iamVjdEFzc2lnbih0aGlzLCBERUZBVUxUUywgZGF0YSwgb3B0aW9ucylcblxuICAgIGlmICghdGhpcy5pbnB1dEVsZW1lbnQpIHtcbiAgICAgIHRoaXMuaW5wdXRFbGVtZW50ID0gdGhpcy5lbGVtZW50XG4gICAgfVxuXG4gICAgdGhpcy5jYWxpYnJhdGlvblRpbWVyID0gbnVsbFxuICAgIHRoaXMuY2FsaWJyYXRpb25GbGFnID0gdHJ1ZVxuICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlXG4gICAgdGhpcy5kZXB0aHNYID0gW11cbiAgICB0aGlzLmRlcHRoc1kgPSBbXVxuICAgIHRoaXMucmFmID0gbnVsbFxuXG4gICAgdGhpcy5ib3VuZHMgPSBudWxsXG4gICAgdGhpcy5lbGVtZW50UG9zaXRpb25YID0gMFxuICAgIHRoaXMuZWxlbWVudFBvc2l0aW9uWSA9IDBcbiAgICB0aGlzLmVsZW1lbnRXaWR0aCA9IDBcbiAgICB0aGlzLmVsZW1lbnRIZWlnaHQgPSAwXG5cbiAgICB0aGlzLmVsZW1lbnRDZW50ZXJYID0gMFxuICAgIHRoaXMuZWxlbWVudENlbnRlclkgPSAwXG5cbiAgICB0aGlzLmVsZW1lbnRSYW5nZVggPSAwXG4gICAgdGhpcy5lbGVtZW50UmFuZ2VZID0gMFxuXG4gICAgdGhpcy5jYWxpYnJhdGlvblggPSAwXG4gICAgdGhpcy5jYWxpYnJhdGlvblkgPSAwXG5cbiAgICB0aGlzLmlucHV0WCA9IDBcbiAgICB0aGlzLmlucHV0WSA9IDBcblxuICAgIHRoaXMubW90aW9uWCA9IDBcbiAgICB0aGlzLm1vdGlvblkgPSAwXG5cbiAgICB0aGlzLnZlbG9jaXR5WCA9IDBcbiAgICB0aGlzLnZlbG9jaXR5WSA9IDBcblxuICAgIHRoaXMub25Nb3VzZU1vdmUgPSB0aGlzLm9uTW91c2VNb3ZlLmJpbmQodGhpcylcbiAgICB0aGlzLm9uRGV2aWNlT3JpZW50YXRpb24gPSB0aGlzLm9uRGV2aWNlT3JpZW50YXRpb24uYmluZCh0aGlzKVxuICAgIHRoaXMub25EZXZpY2VNb3Rpb24gPSB0aGlzLm9uRGV2aWNlTW90aW9uLmJpbmQodGhpcylcbiAgICB0aGlzLm9uT3JpZW50YXRpb25UaW1lciA9IHRoaXMub25PcmllbnRhdGlvblRpbWVyLmJpbmQodGhpcylcbiAgICB0aGlzLm9uTW90aW9uVGltZXIgPSB0aGlzLm9uTW90aW9uVGltZXIuYmluZCh0aGlzKVxuICAgIHRoaXMub25DYWxpYnJhdGlvblRpbWVyID0gdGhpcy5vbkNhbGlicmF0aW9uVGltZXIuYmluZCh0aGlzKVxuICAgIHRoaXMub25BbmltYXRpb25GcmFtZSA9IHRoaXMub25BbmltYXRpb25GcmFtZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5vbldpbmRvd1Jlc2l6ZSA9IHRoaXMub25XaW5kb3dSZXNpemUuYmluZCh0aGlzKVxuXG4gICAgdGhpcy53aW5kb3dXaWR0aCA9IG51bGxcbiAgICB0aGlzLndpbmRvd0hlaWdodCA9IG51bGxcbiAgICB0aGlzLndpbmRvd0NlbnRlclggPSBudWxsXG4gICAgdGhpcy53aW5kb3dDZW50ZXJZID0gbnVsbFxuICAgIHRoaXMud2luZG93UmFkaXVzWCA9IG51bGxcbiAgICB0aGlzLndpbmRvd1JhZGl1c1kgPSBudWxsXG4gICAgdGhpcy5wb3J0cmFpdCA9IGZhbHNlXG4gICAgdGhpcy5kZXNrdG9wID0gIW5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goLyhpUGhvbmV8aVBvZHxpUGFkfEFuZHJvaWR8QmxhY2tCZXJyeXxCQjEwfG1vYml8dGFibGV0fG9wZXJhIG1pbml8bmV4dXMgNykvaSlcbiAgICB0aGlzLm1vdGlvblN1cHBvcnQgPSAhIXdpbmRvdy5EZXZpY2VNb3Rpb25FdmVudCAmJiAhdGhpcy5kZXNrdG9wXG4gICAgdGhpcy5vcmllbnRhdGlvblN1cHBvcnQgPSAhIXdpbmRvdy5EZXZpY2VPcmllbnRhdGlvbkV2ZW50ICYmICF0aGlzLmRlc2t0b3BcbiAgICB0aGlzLm9yaWVudGF0aW9uU3RhdHVzID0gMFxuICAgIHRoaXMubW90aW9uU3RhdHVzID0gMFxuXG4gICAgdGhpcy5pbml0aWFsaXNlKClcbiAgfVxuXG4gIGluaXRpYWxpc2UoKSB7XG4gICAgaWYgKHRoaXMudHJhbnNmb3JtMkRTdXBwb3J0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMudHJhbnNmb3JtMkRTdXBwb3J0ID0gaGVscGVycy50cmFuc2Zvcm1TdXBwb3J0KCcyRCcpXG4gICAgICB0aGlzLnRyYW5zZm9ybTNEU3VwcG9ydCA9IGhlbHBlcnMudHJhbnNmb3JtU3VwcG9ydCgnM0QnKVxuICAgIH1cblxuICAgIC8vIENvbmZpZ3VyZSBDb250ZXh0IFN0eWxlc1xuICAgIGlmICh0aGlzLnRyYW5zZm9ybTNEU3VwcG9ydCkge1xuICAgICAgaGVscGVycy5hY2NlbGVyYXRlKHRoaXMuZWxlbWVudClcbiAgICB9XG5cbiAgICBsZXQgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmVsZW1lbnQpXG4gICAgaWYgKHN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3Bvc2l0aW9uJykgPT09ICdzdGF0aWMnKSB7XG4gICAgICB0aGlzLmVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnXG4gICAgfVxuXG4gICAgLy8gUG9pbnRlciBldmVudHNcbiAgICBpZiAoIXRoaXMucG9pbnRlckV2ZW50cykge1xuICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAndmlzaWJsZSdcbiAgICB9XG5cbiAgICAvLyBTZXR1cFxuICAgIHRoaXMudXBkYXRlTGF5ZXJzKClcbiAgICB0aGlzLnVwZGF0ZURpbWVuc2lvbnMoKVxuICAgIHRoaXMuZW5hYmxlKClcbiAgICB0aGlzLnF1ZXVlQ2FsaWJyYXRpb24odGhpcy5jYWxpYnJhdGlvbkRlbGF5KVxuICB9XG5cbiAgZG9SZWFkeUNhbGxiYWNrKCkge1xuICAgIGlmICh0aGlzLm9uUmVhZHkpIHtcbiAgICAgIHRoaXMub25SZWFkeSgpXG4gICAgfVxuICB9XG5cbiAgdXBkYXRlTGF5ZXJzKCkge1xuICAgIGlmICh0aGlzLnNlbGVjdG9yKSB7XG4gICAgICB0aGlzLmxheWVycyA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHRoaXMuc2VsZWN0b3IpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGF5ZXJzID0gdGhpcy5lbGVtZW50LmNoaWxkcmVuXG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmxheWVycy5sZW5ndGgpIHtcbiAgICAgIGNvbnNvbGUud2FybignUGFyYWxsYXhKUzogWW91ciBzY2VuZSBkb2VzIG5vdCBoYXZlIGFueSBsYXllcnMuJylcbiAgICB9XG5cbiAgICB0aGlzLmRlcHRoc1ggPSBbXVxuICAgIHRoaXMuZGVwdGhzWSA9IFtdXG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBsZXQgbGF5ZXIgPSB0aGlzLmxheWVyc1tpbmRleF1cblxuICAgICAgaWYgKHRoaXMudHJhbnNmb3JtM0RTdXBwb3J0KSB7XG4gICAgICAgIGhlbHBlcnMuYWNjZWxlcmF0ZShsYXllcilcbiAgICAgIH1cblxuICAgICAgbGF5ZXIuc3R5bGUucG9zaXRpb24gPSBpbmRleCA/ICdhYnNvbHV0ZScgOiAncmVsYXRpdmUnXG4gICAgICBsYXllci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgICAgbGF5ZXIuc3R5bGUubGVmdCA9IDBcbiAgICAgIGxheWVyLnN0eWxlLnRvcCA9IDBcblxuICAgICAgbGV0IGRlcHRoID0gaGVscGVycy5kYXRhKGxheWVyLCAnZGVwdGgnKSB8fCAwXG4gICAgICB0aGlzLmRlcHRoc1gucHVzaChoZWxwZXJzLmRhdGEobGF5ZXIsICdkZXB0aC14JykgfHwgZGVwdGgpXG4gICAgICB0aGlzLmRlcHRoc1kucHVzaChoZWxwZXJzLmRhdGEobGF5ZXIsICdkZXB0aC15JykgfHwgZGVwdGgpXG4gICAgfVxuICB9XG5cbiAgdXBkYXRlRGltZW5zaW9ucygpIHtcbiAgICB0aGlzLndpbmRvd1dpZHRoID0gd2luZG93LmlubmVyV2lkdGhcbiAgICB0aGlzLndpbmRvd0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodFxuICAgIHRoaXMud2luZG93Q2VudGVyWCA9IHRoaXMud2luZG93V2lkdGggKiB0aGlzLm9yaWdpblhcbiAgICB0aGlzLndpbmRvd0NlbnRlclkgPSB0aGlzLndpbmRvd0hlaWdodCAqIHRoaXMub3JpZ2luWVxuICAgIHRoaXMud2luZG93UmFkaXVzWCA9IE1hdGgubWF4KHRoaXMud2luZG93Q2VudGVyWCwgdGhpcy53aW5kb3dXaWR0aCAtIHRoaXMud2luZG93Q2VudGVyWClcbiAgICB0aGlzLndpbmRvd1JhZGl1c1kgPSBNYXRoLm1heCh0aGlzLndpbmRvd0NlbnRlclksIHRoaXMud2luZG93SGVpZ2h0IC0gdGhpcy53aW5kb3dDZW50ZXJZKVxuICB9XG5cbiAgdXBkYXRlQm91bmRzKCkge1xuICAgIHRoaXMuYm91bmRzID0gdGhpcy5pbnB1dEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICB0aGlzLmVsZW1lbnRQb3NpdGlvblggPSB0aGlzLmJvdW5kcy5sZWZ0XG4gICAgdGhpcy5lbGVtZW50UG9zaXRpb25ZID0gdGhpcy5ib3VuZHMudG9wXG4gICAgdGhpcy5lbGVtZW50V2lkdGggPSB0aGlzLmJvdW5kcy53aWR0aFxuICAgIHRoaXMuZWxlbWVudEhlaWdodCA9IHRoaXMuYm91bmRzLmhlaWdodFxuICAgIHRoaXMuZWxlbWVudENlbnRlclggPSB0aGlzLmVsZW1lbnRXaWR0aCAqIHRoaXMub3JpZ2luWFxuICAgIHRoaXMuZWxlbWVudENlbnRlclkgPSB0aGlzLmVsZW1lbnRIZWlnaHQgKiB0aGlzLm9yaWdpbllcbiAgICB0aGlzLmVsZW1lbnRSYW5nZVggPSBNYXRoLm1heCh0aGlzLmVsZW1lbnRDZW50ZXJYLCB0aGlzLmVsZW1lbnRXaWR0aCAtIHRoaXMuZWxlbWVudENlbnRlclgpXG4gICAgdGhpcy5lbGVtZW50UmFuZ2VZID0gTWF0aC5tYXgodGhpcy5lbGVtZW50Q2VudGVyWSwgdGhpcy5lbGVtZW50SGVpZ2h0IC0gdGhpcy5lbGVtZW50Q2VudGVyWSlcbiAgfVxuXG4gIHF1ZXVlQ2FsaWJyYXRpb24oZGVsYXkpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5jYWxpYnJhdGlvblRpbWVyKVxuICAgIHRoaXMuY2FsaWJyYXRpb25UaW1lciA9IHNldFRpbWVvdXQodGhpcy5vbkNhbGlicmF0aW9uVGltZXIsIGRlbGF5KVxuICB9XG5cbiAgZW5hYmxlKCkge1xuICAgIGlmICh0aGlzLmVuYWJsZWQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmVuYWJsZWQgPSB0cnVlXG5cbiAgICBpZiAodGhpcy5vcmllbnRhdGlvblN1cHBvcnQpIHtcbiAgICAgIHRoaXMucG9ydHJhaXQgPSBmYWxzZVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2RldmljZW9yaWVudGF0aW9uJywgdGhpcy5vbkRldmljZU9yaWVudGF0aW9uKVxuICAgICAgdGhpcy5kZXRlY3Rpb25UaW1lciA9IHNldFRpbWVvdXQodGhpcy5vbk9yaWVudGF0aW9uVGltZXIsIHRoaXMuc3VwcG9ydERlbGF5KVxuICAgIH0gZWxzZSBpZiAodGhpcy5tb3Rpb25TdXBwb3J0KSB7XG4gICAgICB0aGlzLnBvcnRyYWl0ID0gZmFsc2VcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdkZXZpY2Vtb3Rpb24nLCB0aGlzLm9uRGV2aWNlTW90aW9uKVxuICAgICAgdGhpcy5kZXRlY3Rpb25UaW1lciA9IHNldFRpbWVvdXQodGhpcy5vbk1vdGlvblRpbWVyLCB0aGlzLnN1cHBvcnREZWxheSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYWxpYnJhdGlvblggPSAwXG4gICAgICB0aGlzLmNhbGlicmF0aW9uWSA9IDBcbiAgICAgIHRoaXMucG9ydHJhaXQgPSBmYWxzZVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmUpXG4gICAgICB0aGlzLmRvUmVhZHlDYWxsYmFjaygpXG4gICAgfVxuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMub25XaW5kb3dSZXNpemUpXG4gICAgdGhpcy5yYWYgPSBycUFuRnIodGhpcy5vbkFuaW1hdGlvbkZyYW1lKVxuICB9XG5cbiAgZGlzYWJsZSgpIHtcbiAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlXG5cbiAgICBpZiAodGhpcy5vcmllbnRhdGlvblN1cHBvcnQpIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdkZXZpY2VvcmllbnRhdGlvbicsIHRoaXMub25EZXZpY2VPcmllbnRhdGlvbilcbiAgICB9IGVsc2UgaWYgKHRoaXMubW90aW9uU3VwcG9ydCkge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RldmljZW1vdGlvbicsIHRoaXMub25EZXZpY2VNb3Rpb24pXG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlKVxuICAgIH1cblxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLm9uV2luZG93UmVzaXplKVxuICAgIHJxQW5Gci5jYW5jZWwodGhpcy5yYWYpXG4gIH1cblxuICBjYWxpYnJhdGUoeCwgeSkge1xuICAgIHRoaXMuY2FsaWJyYXRlWCA9IHggPT09IHVuZGVmaW5lZCA/IHRoaXMuY2FsaWJyYXRlWCA6IHhcbiAgICB0aGlzLmNhbGlicmF0ZVkgPSB5ID09PSB1bmRlZmluZWQgPyB0aGlzLmNhbGlicmF0ZVkgOiB5XG4gIH1cblxuICBpbnZlcnQoeCwgeSkge1xuICAgIHRoaXMuaW52ZXJ0WCA9IHggPT09IHVuZGVmaW5lZCA/IHRoaXMuaW52ZXJ0WCA6IHhcbiAgICB0aGlzLmludmVydFkgPSB5ID09PSB1bmRlZmluZWQgPyB0aGlzLmludmVydFkgOiB5XG4gIH1cblxuICBmcmljdGlvbih4LCB5KSB7XG4gICAgdGhpcy5mcmljdGlvblggPSB4ID09PSB1bmRlZmluZWQgPyB0aGlzLmZyaWN0aW9uWCA6IHhcbiAgICB0aGlzLmZyaWN0aW9uWSA9IHkgPT09IHVuZGVmaW5lZCA/IHRoaXMuZnJpY3Rpb25ZIDogeVxuICB9XG5cbiAgc2NhbGFyKHgsIHkpIHtcbiAgICB0aGlzLnNjYWxhclggPSB4ID09PSB1bmRlZmluZWQgPyB0aGlzLnNjYWxhclggOiB4XG4gICAgdGhpcy5zY2FsYXJZID0geSA9PT0gdW5kZWZpbmVkID8gdGhpcy5zY2FsYXJZIDogeVxuICB9XG5cbiAgbGltaXQoeCwgeSkge1xuICAgIHRoaXMubGltaXRYID0geCA9PT0gdW5kZWZpbmVkID8gdGhpcy5saW1pdFggOiB4XG4gICAgdGhpcy5saW1pdFkgPSB5ID09PSB1bmRlZmluZWQgPyB0aGlzLmxpbWl0WSA6IHlcbiAgfVxuXG4gIG9yaWdpbih4LCB5KSB7XG4gICAgdGhpcy5vcmlnaW5YID0geCA9PT0gdW5kZWZpbmVkID8gdGhpcy5vcmlnaW5YIDogeFxuICAgIHRoaXMub3JpZ2luWSA9IHkgPT09IHVuZGVmaW5lZCA/IHRoaXMub3JpZ2luWSA6IHlcbiAgfVxuXG4gIHNldElucHV0RWxlbWVudChlbGVtZW50KSB7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnQgPSBlbGVtZW50XG4gICAgdGhpcy51cGRhdGVEaW1lbnNpb25zKClcbiAgfVxuXG4gIHNldFBvc2l0aW9uKGVsZW1lbnQsIHgsIHkpIHtcbiAgICB4ID0geC50b0ZpeGVkKHRoaXMucHJlY2lzaW9uKSArICdweCdcbiAgICB5ID0geS50b0ZpeGVkKHRoaXMucHJlY2lzaW9uKSArICdweCdcbiAgICBpZiAodGhpcy50cmFuc2Zvcm0zRFN1cHBvcnQpIHtcbiAgICAgIGhlbHBlcnMuY3NzKGVsZW1lbnQsICd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlM2QoJyArIHggKyAnLCcgKyB5ICsgJywwKScpXG4gICAgfSBlbHNlIGlmICh0aGlzLnRyYW5zZm9ybTJEU3VwcG9ydCkge1xuICAgICAgaGVscGVycy5jc3MoZWxlbWVudCwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHggKyAnLCcgKyB5ICsgJyknKVxuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSB4XG4gICAgICBlbGVtZW50LnN0eWxlLnRvcCA9IHlcbiAgICB9XG4gIH1cblxuICBvbk9yaWVudGF0aW9uVGltZXIoKSB7XG4gICAgaWYgKHRoaXMub3JpZW50YXRpb25TdXBwb3J0ICYmIHRoaXMub3JpZW50YXRpb25TdGF0dXMgPT09IDApIHtcbiAgICAgIHRoaXMuZGlzYWJsZSgpXG4gICAgICB0aGlzLm9yaWVudGF0aW9uU3VwcG9ydCA9IGZhbHNlXG4gICAgICB0aGlzLmVuYWJsZSgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZG9SZWFkeUNhbGxiYWNrKClcbiAgICB9XG4gIH1cblxuICBvbk1vdGlvblRpbWVyKCkge1xuICAgIGlmICh0aGlzLm1vdGlvblN1cHBvcnQgJiYgdGhpcy5tb3Rpb25TdGF0dXMgPT09IDApIHtcbiAgICAgIHRoaXMuZGlzYWJsZSgpXG4gICAgICB0aGlzLm1vdGlvblN1cHBvcnQgPSBmYWxzZVxuICAgICAgdGhpcy5lbmFibGUoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRvUmVhZHlDYWxsYmFjaygpXG4gICAgfVxuICB9XG5cbiAgb25DYWxpYnJhdGlvblRpbWVyKCkge1xuICAgIHRoaXMuY2FsaWJyYXRpb25GbGFnID0gdHJ1ZVxuICB9XG5cbiAgb25XaW5kb3dSZXNpemUoKSB7XG4gICAgdGhpcy51cGRhdGVEaW1lbnNpb25zKClcbiAgfVxuXG4gIG9uQW5pbWF0aW9uRnJhbWUoKSB7XG4gICAgdGhpcy51cGRhdGVCb3VuZHMoKVxuICAgIGxldCBjYWxpYnJhdGVkSW5wdXRYID0gdGhpcy5pbnB1dFggLSB0aGlzLmNhbGlicmF0aW9uWCxcbiAgICAgIGNhbGlicmF0ZWRJbnB1dFkgPSB0aGlzLmlucHV0WSAtIHRoaXMuY2FsaWJyYXRpb25ZXG4gICAgaWYgKChNYXRoLmFicyhjYWxpYnJhdGVkSW5wdXRYKSA+IHRoaXMuY2FsaWJyYXRpb25UaHJlc2hvbGQpIHx8IChNYXRoLmFicyhjYWxpYnJhdGVkSW5wdXRZKSA+IHRoaXMuY2FsaWJyYXRpb25UaHJlc2hvbGQpKSB7XG4gICAgICB0aGlzLnF1ZXVlQ2FsaWJyYXRpb24oMClcbiAgICB9XG4gICAgaWYgKHRoaXMucG9ydHJhaXQpIHtcbiAgICAgIHRoaXMubW90aW9uWCA9IHRoaXMuY2FsaWJyYXRlWCA/IGNhbGlicmF0ZWRJbnB1dFkgOiB0aGlzLmlucHV0WVxuICAgICAgdGhpcy5tb3Rpb25ZID0gdGhpcy5jYWxpYnJhdGVZID8gY2FsaWJyYXRlZElucHV0WCA6IHRoaXMuaW5wdXRYXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubW90aW9uWCA9IHRoaXMuY2FsaWJyYXRlWCA/IGNhbGlicmF0ZWRJbnB1dFggOiB0aGlzLmlucHV0WFxuICAgICAgdGhpcy5tb3Rpb25ZID0gdGhpcy5jYWxpYnJhdGVZID8gY2FsaWJyYXRlZElucHV0WSA6IHRoaXMuaW5wdXRZXG4gICAgfVxuICAgIHRoaXMubW90aW9uWCAqPSB0aGlzLmVsZW1lbnRXaWR0aCAqICh0aGlzLnNjYWxhclggLyAxMDApXG4gICAgdGhpcy5tb3Rpb25ZICo9IHRoaXMuZWxlbWVudEhlaWdodCAqICh0aGlzLnNjYWxhclkgLyAxMDApXG4gICAgaWYgKCFpc05hTihwYXJzZUZsb2F0KHRoaXMubGltaXRYKSkpIHtcbiAgICAgIHRoaXMubW90aW9uWCA9IGhlbHBlcnMuY2xhbXAodGhpcy5tb3Rpb25YLCAtdGhpcy5saW1pdFgsIHRoaXMubGltaXRYKVxuICAgIH1cbiAgICBpZiAoIWlzTmFOKHBhcnNlRmxvYXQodGhpcy5saW1pdFkpKSkge1xuICAgICAgdGhpcy5tb3Rpb25ZID0gaGVscGVycy5jbGFtcCh0aGlzLm1vdGlvblksIC10aGlzLmxpbWl0WSwgdGhpcy5saW1pdFkpXG4gICAgfVxuICAgIHRoaXMudmVsb2NpdHlYICs9ICh0aGlzLm1vdGlvblggLSB0aGlzLnZlbG9jaXR5WCkgKiB0aGlzLmZyaWN0aW9uWFxuICAgIHRoaXMudmVsb2NpdHlZICs9ICh0aGlzLm1vdGlvblkgLSB0aGlzLnZlbG9jaXR5WSkgKiB0aGlzLmZyaWN0aW9uWVxuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLmxheWVycy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGxldCBsYXllciA9IHRoaXMubGF5ZXJzW2luZGV4XSxcbiAgICAgICAgZGVwdGhYID0gdGhpcy5kZXB0aHNYW2luZGV4XSxcbiAgICAgICAgZGVwdGhZID0gdGhpcy5kZXB0aHNZW2luZGV4XSxcbiAgICAgICAgeE9mZnNldCA9IHRoaXMudmVsb2NpdHlYICogKGRlcHRoWCAqICh0aGlzLmludmVydFggPyAtMSA6IDEpKSxcbiAgICAgICAgeU9mZnNldCA9IHRoaXMudmVsb2NpdHlZICogKGRlcHRoWSAqICh0aGlzLmludmVydFkgPyAtMSA6IDEpKVxuICAgICAgdGhpcy5zZXRQb3NpdGlvbihsYXllciwgeE9mZnNldCwgeU9mZnNldClcbiAgICB9XG4gICAgdGhpcy5yYWYgPSBycUFuRnIodGhpcy5vbkFuaW1hdGlvbkZyYW1lKVxuICB9XG5cbiAgcm90YXRlKGJldGEsIGdhbW1hKSB7XG4gICAgLy8gRXh0cmFjdCBSb3RhdGlvblxuICAgIGxldCB4ID0gKGJldGEgfHwgMCkgLyBNQUdJQ19OVU1CRVIsIC8vICAtOTAgOjogOTBcbiAgICAgIHkgPSAoZ2FtbWEgfHwgMCkgLyBNQUdJQ19OVU1CRVIgLy8gLTE4MCA6OiAxODBcblxuICAgIC8vIERldGVjdCBPcmllbnRhdGlvbiBDaGFuZ2VcbiAgICBsZXQgcG9ydHJhaXQgPSB0aGlzLndpbmRvd0hlaWdodCA+IHRoaXMud2luZG93V2lkdGhcbiAgICBpZiAodGhpcy5wb3J0cmFpdCAhPT0gcG9ydHJhaXQpIHtcbiAgICAgIHRoaXMucG9ydHJhaXQgPSBwb3J0cmFpdFxuICAgICAgdGhpcy5jYWxpYnJhdGlvbkZsYWcgPSB0cnVlXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2FsaWJyYXRpb25GbGFnKSB7XG4gICAgICB0aGlzLmNhbGlicmF0aW9uRmxhZyA9IGZhbHNlXG4gICAgICB0aGlzLmNhbGlicmF0aW9uWCA9IHhcbiAgICAgIHRoaXMuY2FsaWJyYXRpb25ZID0geVxuICAgIH1cblxuICAgIHRoaXMuaW5wdXRYID0geFxuICAgIHRoaXMuaW5wdXRZID0geVxuICB9XG5cbiAgb25EZXZpY2VPcmllbnRhdGlvbihldmVudCkge1xuICAgIGxldCBiZXRhID0gZXZlbnQuYmV0YVxuICAgIGxldCBnYW1tYSA9IGV2ZW50LmdhbW1hXG4gICAgaWYgKGJldGEgIT09IG51bGwgJiYgZ2FtbWEgIT09IG51bGwpIHtcbiAgICAgIHRoaXMub3JpZW50YXRpb25TdGF0dXMgPSAxXG4gICAgICB0aGlzLnJvdGF0ZShiZXRhLCBnYW1tYSlcbiAgICB9XG4gIH1cblxuICBvbkRldmljZU1vdGlvbihldmVudCkge1xuICAgIGxldCBiZXRhID0gZXZlbnQucm90YXRpb25SYXRlLmJldGFcbiAgICBsZXQgZ2FtbWEgPSBldmVudC5yb3RhdGlvblJhdGUuZ2FtbWFcbiAgICBpZiAoYmV0YSAhPT0gbnVsbCAmJiBnYW1tYSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5tb3Rpb25TdGF0dXMgPSAxXG4gICAgICB0aGlzLnJvdGF0ZShiZXRhLCBnYW1tYSlcbiAgICB9XG4gIH1cblxuICBvbk1vdXNlTW92ZShldmVudCkge1xuICAgIGxldCBjbGllbnRYID0gZXZlbnQuY2xpZW50WCxcbiAgICAgIGNsaWVudFkgPSBldmVudC5jbGllbnRZXG5cbiAgICAvLyByZXNldCBpbnB1dCB0byBjZW50ZXIgaWYgaG92ZXJPbmx5IGlzIHNldCBhbmQgd2UncmUgbm90IGhvdmVyaW5nIHRoZSBlbGVtZW50XG4gICAgaWYgKHRoaXMuaG92ZXJPbmx5ICYmXG4gICAgICAoKGNsaWVudFggPCB0aGlzLmVsZW1lbnRQb3NpdGlvblggfHwgY2xpZW50WCA+IHRoaXMuZWxlbWVudFBvc2l0aW9uWCArIHRoaXMuZWxlbWVudFdpZHRoKSB8fFxuICAgICAgICAoY2xpZW50WSA8IHRoaXMuZWxlbWVudFBvc2l0aW9uWSB8fCBjbGllbnRZID4gdGhpcy5lbGVtZW50UG9zaXRpb25ZICsgdGhpcy5lbGVtZW50SGVpZ2h0KSkpIHtcbiAgICAgIHRoaXMuaW5wdXRYID0gMFxuICAgICAgdGhpcy5pbnB1dFkgPSAwXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAodGhpcy5yZWxhdGl2ZUlucHV0KSB7XG4gICAgICAvLyBDbGlwIG1vdXNlIGNvb3JkaW5hdGVzIGluc2lkZSBlbGVtZW50IGJvdW5kcy5cbiAgICAgIGlmICh0aGlzLmNsaXBSZWxhdGl2ZUlucHV0KSB7XG4gICAgICAgIGNsaWVudFggPSBNYXRoLm1heChjbGllbnRYLCB0aGlzLmVsZW1lbnRQb3NpdGlvblgpXG4gICAgICAgIGNsaWVudFggPSBNYXRoLm1pbihjbGllbnRYLCB0aGlzLmVsZW1lbnRQb3NpdGlvblggKyB0aGlzLmVsZW1lbnRXaWR0aClcbiAgICAgICAgY2xpZW50WSA9IE1hdGgubWF4KGNsaWVudFksIHRoaXMuZWxlbWVudFBvc2l0aW9uWSlcbiAgICAgICAgY2xpZW50WSA9IE1hdGgubWluKGNsaWVudFksIHRoaXMuZWxlbWVudFBvc2l0aW9uWSArIHRoaXMuZWxlbWVudEhlaWdodClcbiAgICAgIH1cbiAgICAgIC8vIENhbGN1bGF0ZSBpbnB1dCByZWxhdGl2ZSB0byB0aGUgZWxlbWVudC5cbiAgICAgIGlmICh0aGlzLmVsZW1lbnRSYW5nZVggJiYgdGhpcy5lbGVtZW50UmFuZ2VZKSB7XG4gICAgICAgIHRoaXMuaW5wdXRYID0gKGNsaWVudFggLSB0aGlzLmVsZW1lbnRQb3NpdGlvblggLSB0aGlzLmVsZW1lbnRDZW50ZXJYKSAvIHRoaXMuZWxlbWVudFJhbmdlWFxuICAgICAgICB0aGlzLmlucHV0WSA9IChjbGllbnRZIC0gdGhpcy5lbGVtZW50UG9zaXRpb25ZIC0gdGhpcy5lbGVtZW50Q2VudGVyWSkgLyB0aGlzLmVsZW1lbnRSYW5nZVlcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ2FsY3VsYXRlIGlucHV0IHJlbGF0aXZlIHRvIHRoZSB3aW5kb3cuXG4gICAgICBpZiAodGhpcy53aW5kb3dSYWRpdXNYICYmIHRoaXMud2luZG93UmFkaXVzWSkge1xuICAgICAgICB0aGlzLmlucHV0WCA9IChjbGllbnRYIC0gdGhpcy53aW5kb3dDZW50ZXJYKSAvIHRoaXMud2luZG93UmFkaXVzWFxuICAgICAgICB0aGlzLmlucHV0WSA9IChjbGllbnRZIC0gdGhpcy53aW5kb3dDZW50ZXJZKSAvIHRoaXMud2luZG93UmFkaXVzWVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5kaXNhYmxlKClcblxuICAgIGNsZWFyVGltZW91dCh0aGlzLmNhbGlicmF0aW9uVGltZXIpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuZGV0ZWN0aW9uVGltZXIpXG5cbiAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdGhpcy5sYXllcnNbaW5kZXhdLnJlbW92ZUF0dHJpYnV0ZSgnc3R5bGUnKVxuICAgIH1cblxuICAgIGRlbGV0ZSB0aGlzLmVsZW1lbnRcbiAgICBkZWxldGUgdGhpcy5sYXllcnNcbiAgfVxuXG4gIHZlcnNpb24oKSB7XG4gICAgcmV0dXJuICczLjEuMCdcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFyYWxsYXhcbiJdLCJmaWxlIjoibGlicy9wYXJhbGxheC5qcyJ9

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsaWJzL3BhcmFsbGF4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBQYXJhbGxheC5qc1xuKiBAYXV0aG9yIE1hdHRoZXcgV2FnZXJmaWVsZCAtIEB3YWdlcmZpZWxkLCBSZW7DqSBSb3RoIC0gbWFpbEByZW5lcm90aC5vcmdcbiogQGRlc2NyaXB0aW9uIENyZWF0ZXMgYSBwYXJhbGxheCBlZmZlY3QgYmV0d2VlbiBhbiBhcnJheSBvZiBsYXllcnMsXG4qICAgICAgICAgICAgICBkcml2aW5nIHRoZSBtb3Rpb24gZnJvbSB0aGUgZ3lyb3Njb3BlIG91dHB1dCBvZiBhIHNtYXJ0ZGV2aWNlLlxuKiAgICAgICAgICAgICAgSWYgbm8gZ3lyb3Njb3BlIGlzIGF2YWlsYWJsZSwgdGhlIGN1cnNvciBwb3NpdGlvbiBpcyB1c2VkLlxuKi9cblxuY29uc3QgcnFBbkZyID0gcmVxdWlyZSgncmFmJylcbmNvbnN0IG9iamVjdEFzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKVxuXG5jb25zdCBoZWxwZXJzID0ge1xuICBwcm9wZXJ0eUNhY2hlOiB7fSxcbiAgdmVuZG9yczogW251bGwsIFsnLXdlYmtpdC0nLCAnd2Via2l0J10sIFsnLW1vei0nLCAnTW96J10sIFsnLW8tJywgJ08nXSwgWyctbXMtJywgJ21zJ11dLFxuXG4gIGNsYW1wKHZhbHVlLCBtaW4sIG1heCkge1xuICAgIHJldHVybiBtaW4gPCBtYXhcbiAgICAgID8gKHZhbHVlIDwgbWluID8gbWluIDogdmFsdWUgPiBtYXggPyBtYXggOiB2YWx1ZSlcbiAgICAgIDogKHZhbHVlIDwgbWF4ID8gbWF4IDogdmFsdWUgPiBtaW4gPyBtaW4gOiB2YWx1ZSlcbiAgfSxcblxuICBkYXRhKGVsZW1lbnQsIG5hbWUpIHtcbiAgICByZXR1cm4gaGVscGVycy5kZXNlcmlhbGl6ZShlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS0nICsgbmFtZSkpXG4gIH0sXG5cbiAgZGVzZXJpYWxpemUodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09ICd0cnVlJykge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAnZmFsc2UnKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAnbnVsbCcpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfSBlbHNlIGlmICghaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZSkpICYmIGlzRmluaXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsdWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB2YWx1ZVxuICAgIH1cbiAgfSxcblxuICBjYW1lbENhc2UodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvLSsoLik/L2csIChtYXRjaCwgY2hhcmFjdGVyKSA9PiB7XG4gICAgICByZXR1cm4gY2hhcmFjdGVyID8gY2hhcmFjdGVyLnRvVXBwZXJDYXNlKCkgOiAnJ1xuICAgIH0pXG4gIH0sXG5cbiAgYWNjZWxlcmF0ZShlbGVtZW50KSB7XG4gICAgaGVscGVycy5jc3MoZWxlbWVudCwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUzZCgwLDAsMCkgcm90YXRlKDAuMDAwMWRlZyknKVxuICAgIGhlbHBlcnMuY3NzKGVsZW1lbnQsICd0cmFuc2Zvcm0tc3R5bGUnLCAncHJlc2VydmUtM2QnKVxuICAgIGhlbHBlcnMuY3NzKGVsZW1lbnQsICdiYWNrZmFjZS12aXNpYmlsaXR5JywgJ2hpZGRlbicpXG4gIH0sXG5cbiAgdHJhbnNmb3JtU3VwcG9ydCh2YWx1ZSkge1xuICAgIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICBwcm9wZXJ0eVN1cHBvcnQgPSBmYWxzZSxcbiAgICAgIHByb3BlcnR5VmFsdWUgPSBudWxsLFxuICAgICAgZmVhdHVyZVN1cHBvcnQgPSBmYWxzZSxcbiAgICAgIGNzc1Byb3BlcnR5ID0gbnVsbCxcbiAgICAgIGpzUHJvcGVydHkgPSBudWxsXG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBoZWxwZXJzLnZlbmRvcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAoaGVscGVycy52ZW5kb3JzW2ldICE9PSBudWxsKSB7XG4gICAgICAgIGNzc1Byb3BlcnR5ID0gaGVscGVycy52ZW5kb3JzW2ldWzBdICsgJ3RyYW5zZm9ybSdcbiAgICAgICAganNQcm9wZXJ0eSA9IGhlbHBlcnMudmVuZG9yc1tpXVsxXSArICdUcmFuc2Zvcm0nXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjc3NQcm9wZXJ0eSA9ICd0cmFuc2Zvcm0nXG4gICAgICAgIGpzUHJvcGVydHkgPSAndHJhbnNmb3JtJ1xuICAgICAgfVxuICAgICAgaWYgKGVsZW1lbnQuc3R5bGVbanNQcm9wZXJ0eV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwcm9wZXJ0eVN1cHBvcnQgPSB0cnVlXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIHN3aXRjaCAodmFsdWUpIHtcbiAgICAgIGNhc2UgJzJEJzpcbiAgICAgICAgZmVhdHVyZVN1cHBvcnQgPSBwcm9wZXJ0eVN1cHBvcnRcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJzNEJzpcbiAgICAgICAgaWYgKHByb3BlcnR5U3VwcG9ydCkge1xuICAgICAgICAgIGxldCBib2R5ID0gZG9jdW1lbnQuYm9keSB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib2R5JyksXG4gICAgICAgICAgICBkb2N1bWVudEVsZW1lbnQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXG4gICAgICAgICAgICBkb2N1bWVudE92ZXJmbG93ID0gZG9jdW1lbnRFbGVtZW50LnN0eWxlLm92ZXJmbG93LFxuICAgICAgICAgICAgaXNDcmVhdGVkQm9keSA9IGZhbHNlXG5cbiAgICAgICAgICBpZiAoIWRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIGlzQ3JlYXRlZEJvZHkgPSB0cnVlXG4gICAgICAgICAgICBkb2N1bWVudEVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJ1xuICAgICAgICAgICAgZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKGJvZHkpXG4gICAgICAgICAgICBib2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbidcbiAgICAgICAgICAgIGJvZHkuc3R5bGUuYmFja2dyb3VuZCA9ICcnXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYm9keS5hcHBlbmRDaGlsZChlbGVtZW50KVxuICAgICAgICAgIGVsZW1lbnQuc3R5bGVbanNQcm9wZXJ0eV0gPSAndHJhbnNsYXRlM2QoMXB4LDFweCwxcHgpJ1xuICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KS5nZXRQcm9wZXJ0eVZhbHVlKGNzc1Byb3BlcnR5KVxuICAgICAgICAgIGZlYXR1cmVTdXBwb3J0ID0gcHJvcGVydHlWYWx1ZSAhPT0gdW5kZWZpbmVkICYmIHByb3BlcnR5VmFsdWUubGVuZ3RoID4gMCAmJiBwcm9wZXJ0eVZhbHVlICE9PSAnbm9uZSdcbiAgICAgICAgICBkb2N1bWVudEVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSBkb2N1bWVudE92ZXJmbG93XG4gICAgICAgICAgYm9keS5yZW1vdmVDaGlsZChlbGVtZW50KVxuXG4gICAgICAgICAgaWYgKGlzQ3JlYXRlZEJvZHkpIHtcbiAgICAgICAgICAgIGJvZHkucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpXG4gICAgICAgICAgICBib2R5LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoYm9keSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICB9XG4gICAgcmV0dXJuIGZlYXR1cmVTdXBwb3J0XG4gIH0sXG5cbiAgY3NzKGVsZW1lbnQsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIGxldCBqc1Byb3BlcnR5ID0gaGVscGVycy5wcm9wZXJ0eUNhY2hlW3Byb3BlcnR5XVxuICAgIGlmICghanNQcm9wZXJ0eSkge1xuICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBoZWxwZXJzLnZlbmRvcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChoZWxwZXJzLnZlbmRvcnNbaV0gIT09IG51bGwpIHtcbiAgICAgICAgICBqc1Byb3BlcnR5ID0gaGVscGVycy5jYW1lbENhc2UoaGVscGVycy52ZW5kb3JzW2ldWzFdICsgJy0nICsgcHJvcGVydHkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAganNQcm9wZXJ0eSA9IHByb3BlcnR5XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsZW1lbnQuc3R5bGVbanNQcm9wZXJ0eV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGhlbHBlcnMucHJvcGVydHlDYWNoZVtwcm9wZXJ0eV0gPSBqc1Byb3BlcnR5XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlbGVtZW50LnN0eWxlW2pzUHJvcGVydHldID0gdmFsdWVcbiAgfVxuXG59XG5cbmNvbnN0IE1BR0lDX05VTUJFUiA9IDMwLFxuICBERUZBVUxUUyA9IHtcbiAgICByZWxhdGl2ZUlucHV0OiBmYWxzZSxcbiAgICBjbGlwUmVsYXRpdmVJbnB1dDogZmFsc2UsXG4gICAgaW5wdXRFbGVtZW50OiBudWxsLFxuICAgIGhvdmVyT25seTogZmFsc2UsXG4gICAgY2FsaWJyYXRpb25UaHJlc2hvbGQ6IDEwMCxcbiAgICBjYWxpYnJhdGlvbkRlbGF5OiA1MDAsXG4gICAgc3VwcG9ydERlbGF5OiA1MDAsXG4gICAgY2FsaWJyYXRlWDogZmFsc2UsXG4gICAgY2FsaWJyYXRlWTogdHJ1ZSxcbiAgICBpbnZlcnRYOiB0cnVlLFxuICAgIGludmVydFk6IHRydWUsXG4gICAgbGltaXRYOiBmYWxzZSxcbiAgICBsaW1pdFk6IGZhbHNlLFxuICAgIHNjYWxhclg6IDEwLjAsXG4gICAgc2NhbGFyWTogMTAuMCxcbiAgICBmcmljdGlvblg6IDAuMSxcbiAgICBmcmljdGlvblk6IDAuMSxcbiAgICBvcmlnaW5YOiAwLjUsXG4gICAgb3JpZ2luWTogMC41LFxuICAgIHBvaW50ZXJFdmVudHM6IGZhbHNlLFxuICAgIHByZWNpc2lvbjogMSxcbiAgICBvblJlYWR5OiBudWxsLFxuICAgIHNlbGVjdG9yOiBudWxsXG4gIH1cblxuY2xhc3MgUGFyYWxsYXgge1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50XG5cbiAgICBjb25zdCBkYXRhID0ge1xuICAgICAgY2FsaWJyYXRlWDogaGVscGVycy5kYXRhKHRoaXMuZWxlbWVudCwgJ2NhbGlicmF0ZS14JyksXG4gICAgICBjYWxpYnJhdGVZOiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnY2FsaWJyYXRlLXknKSxcbiAgICAgIGludmVydFg6IGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdpbnZlcnQteCcpLFxuICAgICAgaW52ZXJ0WTogaGVscGVycy5kYXRhKHRoaXMuZWxlbWVudCwgJ2ludmVydC15JyksXG4gICAgICBsaW1pdFg6IGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdsaW1pdC14JyksXG4gICAgICBsaW1pdFk6IGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdsaW1pdC15JyksXG4gICAgICBzY2FsYXJYOiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnc2NhbGFyLXgnKSxcbiAgICAgIHNjYWxhclk6IGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdzY2FsYXIteScpLFxuICAgICAgZnJpY3Rpb25YOiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnZnJpY3Rpb24teCcpLFxuICAgICAgZnJpY3Rpb25ZOiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnZnJpY3Rpb24teScpLFxuICAgICAgb3JpZ2luWDogaGVscGVycy5kYXRhKHRoaXMuZWxlbWVudCwgJ29yaWdpbi14JyksXG4gICAgICBvcmlnaW5ZOiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnb3JpZ2luLXknKSxcbiAgICAgIHBvaW50ZXJFdmVudHM6IGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdwb2ludGVyLWV2ZW50cycpLFxuICAgICAgcHJlY2lzaW9uOiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAncHJlY2lzaW9uJyksXG4gICAgICByZWxhdGl2ZUlucHV0OiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAncmVsYXRpdmUtaW5wdXQnKSxcbiAgICAgIGNsaXBSZWxhdGl2ZUlucHV0OiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnY2xpcC1yZWxhdGl2ZS1pbnB1dCcpLFxuICAgICAgaG92ZXJPbmx5OiBoZWxwZXJzLmRhdGEodGhpcy5lbGVtZW50LCAnaG92ZXItb25seScpLFxuICAgICAgaW5wdXRFbGVtZW50OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdpbnB1dC1lbGVtZW50JykpLFxuICAgICAgc2VsZWN0b3I6IGhlbHBlcnMuZGF0YSh0aGlzLmVsZW1lbnQsICdzZWxlY3RvcicpXG4gICAgfVxuXG4gICAgZm9yIChsZXQga2V5IGluIGRhdGEpIHtcbiAgICAgIGlmIChkYXRhW2tleV0gPT09IG51bGwpIHtcbiAgICAgICAgZGVsZXRlIGRhdGFba2V5XVxuICAgICAgfVxuICAgIH1cblxuICAgIG9iamVjdEFzc2lnbih0aGlzLCBERUZBVUxUUywgZGF0YSwgb3B0aW9ucylcblxuICAgIGlmICghdGhpcy5pbnB1dEVsZW1lbnQpIHtcbiAgICAgIHRoaXMuaW5wdXRFbGVtZW50ID0gdGhpcy5lbGVtZW50XG4gICAgfVxuXG4gICAgdGhpcy5jYWxpYnJhdGlvblRpbWVyID0gbnVsbFxuICAgIHRoaXMuY2FsaWJyYXRpb25GbGFnID0gdHJ1ZVxuICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlXG4gICAgdGhpcy5kZXB0aHNYID0gW11cbiAgICB0aGlzLmRlcHRoc1kgPSBbXVxuICAgIHRoaXMucmFmID0gbnVsbFxuXG4gICAgdGhpcy5ib3VuZHMgPSBudWxsXG4gICAgdGhpcy5lbGVtZW50UG9zaXRpb25YID0gMFxuICAgIHRoaXMuZWxlbWVudFBvc2l0aW9uWSA9IDBcbiAgICB0aGlzLmVsZW1lbnRXaWR0aCA9IDBcbiAgICB0aGlzLmVsZW1lbnRIZWlnaHQgPSAwXG5cbiAgICB0aGlzLmVsZW1lbnRDZW50ZXJYID0gMFxuICAgIHRoaXMuZWxlbWVudENlbnRlclkgPSAwXG5cbiAgICB0aGlzLmVsZW1lbnRSYW5nZVggPSAwXG4gICAgdGhpcy5lbGVtZW50UmFuZ2VZID0gMFxuXG4gICAgdGhpcy5jYWxpYnJhdGlvblggPSAwXG4gICAgdGhpcy5jYWxpYnJhdGlvblkgPSAwXG5cbiAgICB0aGlzLmlucHV0WCA9IDBcbiAgICB0aGlzLmlucHV0WSA9IDBcblxuICAgIHRoaXMubW90aW9uWCA9IDBcbiAgICB0aGlzLm1vdGlvblkgPSAwXG5cbiAgICB0aGlzLnZlbG9jaXR5WCA9IDBcbiAgICB0aGlzLnZlbG9jaXR5WSA9IDBcblxuICAgIHRoaXMub25Nb3VzZU1vdmUgPSB0aGlzLm9uTW91c2VNb3ZlLmJpbmQodGhpcylcbiAgICB0aGlzLm9uRGV2aWNlT3JpZW50YXRpb24gPSB0aGlzLm9uRGV2aWNlT3JpZW50YXRpb24uYmluZCh0aGlzKVxuICAgIHRoaXMub25EZXZpY2VNb3Rpb24gPSB0aGlzLm9uRGV2aWNlTW90aW9uLmJpbmQodGhpcylcbiAgICB0aGlzLm9uT3JpZW50YXRpb25UaW1lciA9IHRoaXMub25PcmllbnRhdGlvblRpbWVyLmJpbmQodGhpcylcbiAgICB0aGlzLm9uTW90aW9uVGltZXIgPSB0aGlzLm9uTW90aW9uVGltZXIuYmluZCh0aGlzKVxuICAgIHRoaXMub25DYWxpYnJhdGlvblRpbWVyID0gdGhpcy5vbkNhbGlicmF0aW9uVGltZXIuYmluZCh0aGlzKVxuICAgIHRoaXMub25BbmltYXRpb25GcmFtZSA9IHRoaXMub25BbmltYXRpb25GcmFtZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5vbldpbmRvd1Jlc2l6ZSA9IHRoaXMub25XaW5kb3dSZXNpemUuYmluZCh0aGlzKVxuXG4gICAgdGhpcy53aW5kb3dXaWR0aCA9IG51bGxcbiAgICB0aGlzLndpbmRvd0hlaWdodCA9IG51bGxcbiAgICB0aGlzLndpbmRvd0NlbnRlclggPSBudWxsXG4gICAgdGhpcy53aW5kb3dDZW50ZXJZID0gbnVsbFxuICAgIHRoaXMud2luZG93UmFkaXVzWCA9IG51bGxcbiAgICB0aGlzLndpbmRvd1JhZGl1c1kgPSBudWxsXG4gICAgdGhpcy5wb3J0cmFpdCA9IGZhbHNlXG4gICAgdGhpcy5kZXNrdG9wID0gIW5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goLyhpUGhvbmV8aVBvZHxpUGFkfEFuZHJvaWR8QmxhY2tCZXJyeXxCQjEwfG1vYml8dGFibGV0fG9wZXJhIG1pbml8bmV4dXMgNykvaSlcbiAgICB0aGlzLm1vdGlvblN1cHBvcnQgPSAhIXdpbmRvdy5EZXZpY2VNb3Rpb25FdmVudCAmJiAhdGhpcy5kZXNrdG9wXG4gICAgdGhpcy5vcmllbnRhdGlvblN1cHBvcnQgPSAhIXdpbmRvdy5EZXZpY2VPcmllbnRhdGlvbkV2ZW50ICYmICF0aGlzLmRlc2t0b3BcbiAgICB0aGlzLm9yaWVudGF0aW9uU3RhdHVzID0gMFxuICAgIHRoaXMubW90aW9uU3RhdHVzID0gMFxuXG4gICAgdGhpcy5pbml0aWFsaXNlKClcbiAgfVxuXG4gIGluaXRpYWxpc2UoKSB7XG4gICAgaWYgKHRoaXMudHJhbnNmb3JtMkRTdXBwb3J0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMudHJhbnNmb3JtMkRTdXBwb3J0ID0gaGVscGVycy50cmFuc2Zvcm1TdXBwb3J0KCcyRCcpXG4gICAgICB0aGlzLnRyYW5zZm9ybTNEU3VwcG9ydCA9IGhlbHBlcnMudHJhbnNmb3JtU3VwcG9ydCgnM0QnKVxuICAgIH1cblxuICAgIC8vIENvbmZpZ3VyZSBDb250ZXh0IFN0eWxlc1xuICAgIGlmICh0aGlzLnRyYW5zZm9ybTNEU3VwcG9ydCkge1xuICAgICAgaGVscGVycy5hY2NlbGVyYXRlKHRoaXMuZWxlbWVudClcbiAgICB9XG5cbiAgICBsZXQgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmVsZW1lbnQpXG4gICAgaWYgKHN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3Bvc2l0aW9uJykgPT09ICdzdGF0aWMnKSB7XG4gICAgICB0aGlzLmVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnXG4gICAgfVxuXG4gICAgLy8gUG9pbnRlciBldmVudHNcbiAgICBpZiAoIXRoaXMucG9pbnRlckV2ZW50cykge1xuICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAndmlzaWJsZSdcbiAgICB9XG5cbiAgICAvLyBTZXR1cFxuICAgIHRoaXMudXBkYXRlTGF5ZXJzKClcbiAgICB0aGlzLnVwZGF0ZURpbWVuc2lvbnMoKVxuICAgIHRoaXMuZW5hYmxlKClcbiAgICB0aGlzLnF1ZXVlQ2FsaWJyYXRpb24odGhpcy5jYWxpYnJhdGlvbkRlbGF5KVxuICB9XG5cbiAgZG9SZWFkeUNhbGxiYWNrKCkge1xuICAgIGlmICh0aGlzLm9uUmVhZHkpIHtcbiAgICAgIHRoaXMub25SZWFkeSgpXG4gICAgfVxuICB9XG5cbiAgdXBkYXRlTGF5ZXJzKCkge1xuICAgIGlmICh0aGlzLnNlbGVjdG9yKSB7XG4gICAgICB0aGlzLmxheWVycyA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHRoaXMuc2VsZWN0b3IpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGF5ZXJzID0gdGhpcy5lbGVtZW50LmNoaWxkcmVuXG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmxheWVycy5sZW5ndGgpIHtcbiAgICAgIGNvbnNvbGUud2FybignUGFyYWxsYXhKUzogWW91ciBzY2VuZSBkb2VzIG5vdCBoYXZlIGFueSBsYXllcnMuJylcbiAgICB9XG5cbiAgICB0aGlzLmRlcHRoc1ggPSBbXVxuICAgIHRoaXMuZGVwdGhzWSA9IFtdXG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBsZXQgbGF5ZXIgPSB0aGlzLmxheWVyc1tpbmRleF1cblxuICAgICAgaWYgKHRoaXMudHJhbnNmb3JtM0RTdXBwb3J0KSB7XG4gICAgICAgIGhlbHBlcnMuYWNjZWxlcmF0ZShsYXllcilcbiAgICAgIH1cblxuICAgICAgbGF5ZXIuc3R5bGUucG9zaXRpb24gPSBpbmRleCA/ICdhYnNvbHV0ZScgOiAncmVsYXRpdmUnXG4gICAgICBsYXllci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgICAgbGF5ZXIuc3R5bGUubGVmdCA9IDBcbiAgICAgIGxheWVyLnN0eWxlLnRvcCA9IDBcblxuICAgICAgbGV0IGRlcHRoID0gaGVscGVycy5kYXRhKGxheWVyLCAnZGVwdGgnKSB8fCAwXG4gICAgICB0aGlzLmRlcHRoc1gucHVzaChoZWxwZXJzLmRhdGEobGF5ZXIsICdkZXB0aC14JykgfHwgZGVwdGgpXG4gICAgICB0aGlzLmRlcHRoc1kucHVzaChoZWxwZXJzLmRhdGEobGF5ZXIsICdkZXB0aC15JykgfHwgZGVwdGgpXG4gICAgfVxuICB9XG5cbiAgdXBkYXRlRGltZW5zaW9ucygpIHtcbiAgICB0aGlzLndpbmRvd1dpZHRoID0gd2luZG93LmlubmVyV2lkdGhcbiAgICB0aGlzLndpbmRvd0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodFxuICAgIHRoaXMud2luZG93Q2VudGVyWCA9IHRoaXMud2luZG93V2lkdGggKiB0aGlzLm9yaWdpblhcbiAgICB0aGlzLndpbmRvd0NlbnRlclkgPSB0aGlzLndpbmRvd0hlaWdodCAqIHRoaXMub3JpZ2luWVxuICAgIHRoaXMud2luZG93UmFkaXVzWCA9IE1hdGgubWF4KHRoaXMud2luZG93Q2VudGVyWCwgdGhpcy53aW5kb3dXaWR0aCAtIHRoaXMud2luZG93Q2VudGVyWClcbiAgICB0aGlzLndpbmRvd1JhZGl1c1kgPSBNYXRoLm1heCh0aGlzLndpbmRvd0NlbnRlclksIHRoaXMud2luZG93SGVpZ2h0IC0gdGhpcy53aW5kb3dDZW50ZXJZKVxuICB9XG5cbiAgdXBkYXRlQm91bmRzKCkge1xuICAgIHRoaXMuYm91bmRzID0gdGhpcy5pbnB1dEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICB0aGlzLmVsZW1lbnRQb3NpdGlvblggPSB0aGlzLmJvdW5kcy5sZWZ0XG4gICAgdGhpcy5lbGVtZW50UG9zaXRpb25ZID0gdGhpcy5ib3VuZHMudG9wXG4gICAgdGhpcy5lbGVtZW50V2lkdGggPSB0aGlzLmJvdW5kcy53aWR0aFxuICAgIHRoaXMuZWxlbWVudEhlaWdodCA9IHRoaXMuYm91bmRzLmhlaWdodFxuICAgIHRoaXMuZWxlbWVudENlbnRlclggPSB0aGlzLmVsZW1lbnRXaWR0aCAqIHRoaXMub3JpZ2luWFxuICAgIHRoaXMuZWxlbWVudENlbnRlclkgPSB0aGlzLmVsZW1lbnRIZWlnaHQgKiB0aGlzLm9yaWdpbllcbiAgICB0aGlzLmVsZW1lbnRSYW5nZVggPSBNYXRoLm1heCh0aGlzLmVsZW1lbnRDZW50ZXJYLCB0aGlzLmVsZW1lbnRXaWR0aCAtIHRoaXMuZWxlbWVudENlbnRlclgpXG4gICAgdGhpcy5lbGVtZW50UmFuZ2VZID0gTWF0aC5tYXgodGhpcy5lbGVtZW50Q2VudGVyWSwgdGhpcy5lbGVtZW50SGVpZ2h0IC0gdGhpcy5lbGVtZW50Q2VudGVyWSlcbiAgfVxuXG4gIHF1ZXVlQ2FsaWJyYXRpb24oZGVsYXkpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5jYWxpYnJhdGlvblRpbWVyKVxuICAgIHRoaXMuY2FsaWJyYXRpb25UaW1lciA9IHNldFRpbWVvdXQodGhpcy5vbkNhbGlicmF0aW9uVGltZXIsIGRlbGF5KVxuICB9XG5cbiAgZW5hYmxlKCkge1xuICAgIGlmICh0aGlzLmVuYWJsZWQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmVuYWJsZWQgPSB0cnVlXG5cbiAgICBpZiAodGhpcy5vcmllbnRhdGlvblN1cHBvcnQpIHtcbiAgICAgIHRoaXMucG9ydHJhaXQgPSBmYWxzZVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2RldmljZW9yaWVudGF0aW9uJywgdGhpcy5vbkRldmljZU9yaWVudGF0aW9uKVxuICAgICAgdGhpcy5kZXRlY3Rpb25UaW1lciA9IHNldFRpbWVvdXQodGhpcy5vbk9yaWVudGF0aW9uVGltZXIsIHRoaXMuc3VwcG9ydERlbGF5KVxuICAgIH0gZWxzZSBpZiAodGhpcy5tb3Rpb25TdXBwb3J0KSB7XG4gICAgICB0aGlzLnBvcnRyYWl0ID0gZmFsc2VcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdkZXZpY2Vtb3Rpb24nLCB0aGlzLm9uRGV2aWNlTW90aW9uKVxuICAgICAgdGhpcy5kZXRlY3Rpb25UaW1lciA9IHNldFRpbWVvdXQodGhpcy5vbk1vdGlvblRpbWVyLCB0aGlzLnN1cHBvcnREZWxheSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYWxpYnJhdGlvblggPSAwXG4gICAgICB0aGlzLmNhbGlicmF0aW9uWSA9IDBcbiAgICAgIHRoaXMucG9ydHJhaXQgPSBmYWxzZVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmUpXG4gICAgICB0aGlzLmRvUmVhZHlDYWxsYmFjaygpXG4gICAgfVxuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMub25XaW5kb3dSZXNpemUpXG4gICAgdGhpcy5yYWYgPSBycUFuRnIodGhpcy5vbkFuaW1hdGlvbkZyYW1lKVxuICB9XG5cbiAgZGlzYWJsZSgpIHtcbiAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlXG5cbiAgICBpZiAodGhpcy5vcmllbnRhdGlvblN1cHBvcnQpIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdkZXZpY2VvcmllbnRhdGlvbicsIHRoaXMub25EZXZpY2VPcmllbnRhdGlvbilcbiAgICB9IGVsc2UgaWYgKHRoaXMubW90aW9uU3VwcG9ydCkge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RldmljZW1vdGlvbicsIHRoaXMub25EZXZpY2VNb3Rpb24pXG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlKVxuICAgIH1cblxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLm9uV2luZG93UmVzaXplKVxuICAgIHJxQW5Gci5jYW5jZWwodGhpcy5yYWYpXG4gIH1cblxuICBjYWxpYnJhdGUoeCwgeSkge1xuICAgIHRoaXMuY2FsaWJyYXRlWCA9IHggPT09IHVuZGVmaW5lZCA/IHRoaXMuY2FsaWJyYXRlWCA6IHhcbiAgICB0aGlzLmNhbGlicmF0ZVkgPSB5ID09PSB1bmRlZmluZWQgPyB0aGlzLmNhbGlicmF0ZVkgOiB5XG4gIH1cblxuICBpbnZlcnQoeCwgeSkge1xuICAgIHRoaXMuaW52ZXJ0WCA9IHggPT09IHVuZGVmaW5lZCA/IHRoaXMuaW52ZXJ0WCA6IHhcbiAgICB0aGlzLmludmVydFkgPSB5ID09PSB1bmRlZmluZWQgPyB0aGlzLmludmVydFkgOiB5XG4gIH1cblxuICBmcmljdGlvbih4LCB5KSB7XG4gICAgdGhpcy5mcmljdGlvblggPSB4ID09PSB1bmRlZmluZWQgPyB0aGlzLmZyaWN0aW9uWCA6IHhcbiAgICB0aGlzLmZyaWN0aW9uWSA9IHkgPT09IHVuZGVmaW5lZCA/IHRoaXMuZnJpY3Rpb25ZIDogeVxuICB9XG5cbiAgc2NhbGFyKHgsIHkpIHtcbiAgICB0aGlzLnNjYWxhclggPSB4ID09PSB1bmRlZmluZWQgPyB0aGlzLnNjYWxhclggOiB4XG4gICAgdGhpcy5zY2FsYXJZID0geSA9PT0gdW5kZWZpbmVkID8gdGhpcy5zY2FsYXJZIDogeVxuICB9XG5cbiAgbGltaXQoeCwgeSkge1xuICAgIHRoaXMubGltaXRYID0geCA9PT0gdW5kZWZpbmVkID8gdGhpcy5saW1pdFggOiB4XG4gICAgdGhpcy5saW1pdFkgPSB5ID09PSB1bmRlZmluZWQgPyB0aGlzLmxpbWl0WSA6IHlcbiAgfVxuXG4gIG9yaWdpbih4LCB5KSB7XG4gICAgdGhpcy5vcmlnaW5YID0geCA9PT0gdW5kZWZpbmVkID8gdGhpcy5vcmlnaW5YIDogeFxuICAgIHRoaXMub3JpZ2luWSA9IHkgPT09IHVuZGVmaW5lZCA/IHRoaXMub3JpZ2luWSA6IHlcbiAgfVxuXG4gIHNldElucHV0RWxlbWVudChlbGVtZW50KSB7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnQgPSBlbGVtZW50XG4gICAgdGhpcy51cGRhdGVEaW1lbnNpb25zKClcbiAgfVxuXG4gIHNldFBvc2l0aW9uKGVsZW1lbnQsIHgsIHkpIHtcbiAgICB4ID0geC50b0ZpeGVkKHRoaXMucHJlY2lzaW9uKSArICdweCdcbiAgICB5ID0geS50b0ZpeGVkKHRoaXMucHJlY2lzaW9uKSArICdweCdcbiAgICBpZiAodGhpcy50cmFuc2Zvcm0zRFN1cHBvcnQpIHtcbiAgICAgIGhlbHBlcnMuY3NzKGVsZW1lbnQsICd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlM2QoJyArIHggKyAnLCcgKyB5ICsgJywwKScpXG4gICAgfSBlbHNlIGlmICh0aGlzLnRyYW5zZm9ybTJEU3VwcG9ydCkge1xuICAgICAgaGVscGVycy5jc3MoZWxlbWVudCwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHggKyAnLCcgKyB5ICsgJyknKVxuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSB4XG4gICAgICBlbGVtZW50LnN0eWxlLnRvcCA9IHlcbiAgICB9XG4gIH1cblxuICBvbk9yaWVudGF0aW9uVGltZXIoKSB7XG4gICAgaWYgKHRoaXMub3JpZW50YXRpb25TdXBwb3J0ICYmIHRoaXMub3JpZW50YXRpb25TdGF0dXMgPT09IDApIHtcbiAgICAgIHRoaXMuZGlzYWJsZSgpXG4gICAgICB0aGlzLm9yaWVudGF0aW9uU3VwcG9ydCA9IGZhbHNlXG4gICAgICB0aGlzLmVuYWJsZSgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZG9SZWFkeUNhbGxiYWNrKClcbiAgICB9XG4gIH1cblxuICBvbk1vdGlvblRpbWVyKCkge1xuICAgIGlmICh0aGlzLm1vdGlvblN1cHBvcnQgJiYgdGhpcy5tb3Rpb25TdGF0dXMgPT09IDApIHtcbiAgICAgIHRoaXMuZGlzYWJsZSgpXG4gICAgICB0aGlzLm1vdGlvblN1cHBvcnQgPSBmYWxzZVxuICAgICAgdGhpcy5lbmFibGUoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRvUmVhZHlDYWxsYmFjaygpXG4gICAgfVxuICB9XG5cbiAgb25DYWxpYnJhdGlvblRpbWVyKCkge1xuICAgIHRoaXMuY2FsaWJyYXRpb25GbGFnID0gdHJ1ZVxuICB9XG5cbiAgb25XaW5kb3dSZXNpemUoKSB7XG4gICAgdGhpcy51cGRhdGVEaW1lbnNpb25zKClcbiAgfVxuXG4gIG9uQW5pbWF0aW9uRnJhbWUoKSB7XG4gICAgdGhpcy51cGRhdGVCb3VuZHMoKVxuICAgIGxldCBjYWxpYnJhdGVkSW5wdXRYID0gdGhpcy5pbnB1dFggLSB0aGlzLmNhbGlicmF0aW9uWCxcbiAgICAgIGNhbGlicmF0ZWRJbnB1dFkgPSB0aGlzLmlucHV0WSAtIHRoaXMuY2FsaWJyYXRpb25ZXG4gICAgaWYgKChNYXRoLmFicyhjYWxpYnJhdGVkSW5wdXRYKSA+IHRoaXMuY2FsaWJyYXRpb25UaHJlc2hvbGQpIHx8IChNYXRoLmFicyhjYWxpYnJhdGVkSW5wdXRZKSA+IHRoaXMuY2FsaWJyYXRpb25UaHJlc2hvbGQpKSB7XG4gICAgICB0aGlzLnF1ZXVlQ2FsaWJyYXRpb24oMClcbiAgICB9XG4gICAgaWYgKHRoaXMucG9ydHJhaXQpIHtcbiAgICAgIHRoaXMubW90aW9uWCA9IHRoaXMuY2FsaWJyYXRlWCA/IGNhbGlicmF0ZWRJbnB1dFkgOiB0aGlzLmlucHV0WVxuICAgICAgdGhpcy5tb3Rpb25ZID0gdGhpcy5jYWxpYnJhdGVZID8gY2FsaWJyYXRlZElucHV0WCA6IHRoaXMuaW5wdXRYXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubW90aW9uWCA9IHRoaXMuY2FsaWJyYXRlWCA/IGNhbGlicmF0ZWRJbnB1dFggOiB0aGlzLmlucHV0WFxuICAgICAgdGhpcy5tb3Rpb25ZID0gdGhpcy5jYWxpYnJhdGVZID8gY2FsaWJyYXRlZElucHV0WSA6IHRoaXMuaW5wdXRZXG4gICAgfVxuICAgIHRoaXMubW90aW9uWCAqPSB0aGlzLmVsZW1lbnRXaWR0aCAqICh0aGlzLnNjYWxhclggLyAxMDApXG4gICAgdGhpcy5tb3Rpb25ZICo9IHRoaXMuZWxlbWVudEhlaWdodCAqICh0aGlzLnNjYWxhclkgLyAxMDApXG4gICAgaWYgKCFpc05hTihwYXJzZUZsb2F0KHRoaXMubGltaXRYKSkpIHtcbiAgICAgIHRoaXMubW90aW9uWCA9IGhlbHBlcnMuY2xhbXAodGhpcy5tb3Rpb25YLCAtdGhpcy5saW1pdFgsIHRoaXMubGltaXRYKVxuICAgIH1cbiAgICBpZiAoIWlzTmFOKHBhcnNlRmxvYXQodGhpcy5saW1pdFkpKSkge1xuICAgICAgdGhpcy5tb3Rpb25ZID0gaGVscGVycy5jbGFtcCh0aGlzLm1vdGlvblksIC10aGlzLmxpbWl0WSwgdGhpcy5saW1pdFkpXG4gICAgfVxuICAgIHRoaXMudmVsb2NpdHlYICs9ICh0aGlzLm1vdGlvblggLSB0aGlzLnZlbG9jaXR5WCkgKiB0aGlzLmZyaWN0aW9uWFxuICAgIHRoaXMudmVsb2NpdHlZICs9ICh0aGlzLm1vdGlvblkgLSB0aGlzLnZlbG9jaXR5WSkgKiB0aGlzLmZyaWN0aW9uWVxuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLmxheWVycy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGxldCBsYXllciA9IHRoaXMubGF5ZXJzW2luZGV4XSxcbiAgICAgICAgZGVwdGhYID0gdGhpcy5kZXB0aHNYW2luZGV4XSxcbiAgICAgICAgZGVwdGhZID0gdGhpcy5kZXB0aHNZW2luZGV4XSxcbiAgICAgICAgeE9mZnNldCA9IHRoaXMudmVsb2NpdHlYICogKGRlcHRoWCAqICh0aGlzLmludmVydFggPyAtMSA6IDEpKSxcbiAgICAgICAgeU9mZnNldCA9IHRoaXMudmVsb2NpdHlZICogKGRlcHRoWSAqICh0aGlzLmludmVydFkgPyAtMSA6IDEpKVxuICAgICAgdGhpcy5zZXRQb3NpdGlvbihsYXllciwgeE9mZnNldCwgeU9mZnNldClcbiAgICB9XG4gICAgdGhpcy5yYWYgPSBycUFuRnIodGhpcy5vbkFuaW1hdGlvbkZyYW1lKVxuICB9XG5cbiAgcm90YXRlKGJldGEsIGdhbW1hKSB7XG4gICAgLy8gRXh0cmFjdCBSb3RhdGlvblxuICAgIGxldCB4ID0gKGJldGEgfHwgMCkgLyBNQUdJQ19OVU1CRVIsIC8vICAtOTAgOjogOTBcbiAgICAgIHkgPSAoZ2FtbWEgfHwgMCkgLyBNQUdJQ19OVU1CRVIgLy8gLTE4MCA6OiAxODBcblxuICAgIC8vIERldGVjdCBPcmllbnRhdGlvbiBDaGFuZ2VcbiAgICBsZXQgcG9ydHJhaXQgPSB0aGlzLndpbmRvd0hlaWdodCA+IHRoaXMud2luZG93V2lkdGhcbiAgICBpZiAodGhpcy5wb3J0cmFpdCAhPT0gcG9ydHJhaXQpIHtcbiAgICAgIHRoaXMucG9ydHJhaXQgPSBwb3J0cmFpdFxuICAgICAgdGhpcy5jYWxpYnJhdGlvbkZsYWcgPSB0cnVlXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2FsaWJyYXRpb25GbGFnKSB7XG4gICAgICB0aGlzLmNhbGlicmF0aW9uRmxhZyA9IGZhbHNlXG4gICAgICB0aGlzLmNhbGlicmF0aW9uWCA9IHhcbiAgICAgIHRoaXMuY2FsaWJyYXRpb25ZID0geVxuICAgIH1cblxuICAgIHRoaXMuaW5wdXRYID0geFxuICAgIHRoaXMuaW5wdXRZID0geVxuICB9XG5cbiAgb25EZXZpY2VPcmllbnRhdGlvbihldmVudCkge1xuICAgIGxldCBiZXRhID0gZXZlbnQuYmV0YVxuICAgIGxldCBnYW1tYSA9IGV2ZW50LmdhbW1hXG4gICAgaWYgKGJldGEgIT09IG51bGwgJiYgZ2FtbWEgIT09IG51bGwpIHtcbiAgICAgIHRoaXMub3JpZW50YXRpb25TdGF0dXMgPSAxXG4gICAgICB0aGlzLnJvdGF0ZShiZXRhLCBnYW1tYSlcbiAgICB9XG4gIH1cblxuICBvbkRldmljZU1vdGlvbihldmVudCkge1xuICAgIGxldCBiZXRhID0gZXZlbnQucm90YXRpb25SYXRlLmJldGFcbiAgICBsZXQgZ2FtbWEgPSBldmVudC5yb3RhdGlvblJhdGUuZ2FtbWFcbiAgICBpZiAoYmV0YSAhPT0gbnVsbCAmJiBnYW1tYSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5tb3Rpb25TdGF0dXMgPSAxXG4gICAgICB0aGlzLnJvdGF0ZShiZXRhLCBnYW1tYSlcbiAgICB9XG4gIH1cblxuICBvbk1vdXNlTW92ZShldmVudCkge1xuICAgIGxldCBjbGllbnRYID0gZXZlbnQuY2xpZW50WCxcbiAgICAgIGNsaWVudFkgPSBldmVudC5jbGllbnRZXG5cbiAgICAvLyByZXNldCBpbnB1dCB0byBjZW50ZXIgaWYgaG92ZXJPbmx5IGlzIHNldCBhbmQgd2UncmUgbm90IGhvdmVyaW5nIHRoZSBlbGVtZW50XG4gICAgaWYgKHRoaXMuaG92ZXJPbmx5ICYmXG4gICAgICAoKGNsaWVudFggPCB0aGlzLmVsZW1lbnRQb3NpdGlvblggfHwgY2xpZW50WCA+IHRoaXMuZWxlbWVudFBvc2l0aW9uWCArIHRoaXMuZWxlbWVudFdpZHRoKSB8fFxuICAgICAgICAoY2xpZW50WSA8IHRoaXMuZWxlbWVudFBvc2l0aW9uWSB8fCBjbGllbnRZID4gdGhpcy5lbGVtZW50UG9zaXRpb25ZICsgdGhpcy5lbGVtZW50SGVpZ2h0KSkpIHtcbiAgICAgIHRoaXMuaW5wdXRYID0gMFxuICAgICAgdGhpcy5pbnB1dFkgPSAwXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAodGhpcy5yZWxhdGl2ZUlucHV0KSB7XG4gICAgICAvLyBDbGlwIG1vdXNlIGNvb3JkaW5hdGVzIGluc2lkZSBlbGVtZW50IGJvdW5kcy5cbiAgICAgIGlmICh0aGlzLmNsaXBSZWxhdGl2ZUlucHV0KSB7XG4gICAgICAgIGNsaWVudFggPSBNYXRoLm1heChjbGllbnRYLCB0aGlzLmVsZW1lbnRQb3NpdGlvblgpXG4gICAgICAgIGNsaWVudFggPSBNYXRoLm1pbihjbGllbnRYLCB0aGlzLmVsZW1lbnRQb3NpdGlvblggKyB0aGlzLmVsZW1lbnRXaWR0aClcbiAgICAgICAgY2xpZW50WSA9IE1hdGgubWF4KGNsaWVudFksIHRoaXMuZWxlbWVudFBvc2l0aW9uWSlcbiAgICAgICAgY2xpZW50WSA9IE1hdGgubWluKGNsaWVudFksIHRoaXMuZWxlbWVudFBvc2l0aW9uWSArIHRoaXMuZWxlbWVudEhlaWdodClcbiAgICAgIH1cbiAgICAgIC8vIENhbGN1bGF0ZSBpbnB1dCByZWxhdGl2ZSB0byB0aGUgZWxlbWVudC5cbiAgICAgIGlmICh0aGlzLmVsZW1lbnRSYW5nZVggJiYgdGhpcy5lbGVtZW50UmFuZ2VZKSB7XG4gICAgICAgIHRoaXMuaW5wdXRYID0gKGNsaWVudFggLSB0aGlzLmVsZW1lbnRQb3NpdGlvblggLSB0aGlzLmVsZW1lbnRDZW50ZXJYKSAvIHRoaXMuZWxlbWVudFJhbmdlWFxuICAgICAgICB0aGlzLmlucHV0WSA9IChjbGllbnRZIC0gdGhpcy5lbGVtZW50UG9zaXRpb25ZIC0gdGhpcy5lbGVtZW50Q2VudGVyWSkgLyB0aGlzLmVsZW1lbnRSYW5nZVlcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ2FsY3VsYXRlIGlucHV0IHJlbGF0aXZlIHRvIHRoZSB3aW5kb3cuXG4gICAgICBpZiAodGhpcy53aW5kb3dSYWRpdXNYICYmIHRoaXMud2luZG93UmFkaXVzWSkge1xuICAgICAgICB0aGlzLmlucHV0WCA9IChjbGllbnRYIC0gdGhpcy53aW5kb3dDZW50ZXJYKSAvIHRoaXMud2luZG93UmFkaXVzWFxuICAgICAgICB0aGlzLmlucHV0WSA9IChjbGllbnRZIC0gdGhpcy53aW5kb3dDZW50ZXJZKSAvIHRoaXMud2luZG93UmFkaXVzWVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5kaXNhYmxlKClcblxuICAgIGNsZWFyVGltZW91dCh0aGlzLmNhbGlicmF0aW9uVGltZXIpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuZGV0ZWN0aW9uVGltZXIpXG5cbiAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdGhpcy5sYXllcnNbaW5kZXhdLnJlbW92ZUF0dHJpYnV0ZSgnc3R5bGUnKVxuICAgIH1cblxuICAgIGRlbGV0ZSB0aGlzLmVsZW1lbnRcbiAgICBkZWxldGUgdGhpcy5sYXllcnNcbiAgfVxuXG4gIHZlcnNpb24oKSB7XG4gICAgcmV0dXJuICczLjEuMCdcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFyYWxsYXhcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pSWl3aWMyOTFjbU5sY3lJNld5SnNhV0p6TDNCaGNtRnNiR0Y0TG1weklsMHNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJaThxS2x4dUtpQlFZWEpoYkd4aGVDNXFjMXh1S2lCQVlYVjBhRzl5SUUxaGRIUm9aWGNnVjJGblpYSm1hV1ZzWkNBdElFQjNZV2RsY21acFpXeGtMQ0JTWlc3RHFTQlNiM1JvSUMwZ2JXRnBiRUJ5Wlc1bGNtOTBhQzV2Y21kY2Jpb2dRR1JsYzJOeWFYQjBhVzl1SUVOeVpXRjBaWE1nWVNCd1lYSmhiR3hoZUNCbFptWmxZM1FnWW1WMGQyVmxiaUJoYmlCaGNuSmhlU0J2WmlCc1lYbGxjbk1zWEc0cUlDQWdJQ0FnSUNBZ0lDQWdJQ0JrY21sMmFXNW5JSFJvWlNCdGIzUnBiMjRnWm5KdmJTQjBhR1VnWjNseWIzTmpiM0JsSUc5MWRIQjFkQ0J2WmlCaElITnRZWEowWkdWMmFXTmxMbHh1S2lBZ0lDQWdJQ0FnSUNBZ0lDQWdTV1lnYm04Z1ozbHliM05qYjNCbElHbHpJR0YyWVdsc1lXSnNaU3dnZEdobElHTjFjbk52Y2lCd2IzTnBkR2x2YmlCcGN5QjFjMlZrTGx4dUtpOWNibHh1WTI5dWMzUWdjbkZCYmtaeUlEMGdjbVZ4ZFdseVpTZ25jbUZtSnlsY2JtTnZibk4wSUc5aWFtVmpkRUZ6YzJsbmJpQTlJSEpsY1hWcGNtVW9KMjlpYW1WamRDMWhjM05wWjI0bktWeHVYRzVqYjI1emRDQm9aV3h3WlhKeklEMGdlMXh1SUNCd2NtOXdaWEowZVVOaFkyaGxPaUI3ZlN4Y2JpQWdkbVZ1Wkc5eWN6b2dXMjUxYkd3c0lGc25MWGRsWW10cGRDMG5MQ0FuZDJWaWEybDBKMTBzSUZzbkxXMXZlaTBuTENBblRXOTZKMTBzSUZzbkxXOHRKeXdnSjA4blhTd2dXeWN0YlhNdEp5d2dKMjF6SjExZExGeHVYRzRnSUdOc1lXMXdLSFpoYkhWbExDQnRhVzRzSUcxaGVDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCdGFXNGdQQ0J0WVhoY2JpQWdJQ0FnSUQ4Z0tIWmhiSFZsSUR3Z2JXbHVJRDhnYldsdUlEb2dkbUZzZFdVZ1BpQnRZWGdnUHlCdFlYZ2dPaUIyWVd4MVpTbGNiaUFnSUNBZ0lEb2dLSFpoYkhWbElEd2diV0Y0SUQ4Z2JXRjRJRG9nZG1Gc2RXVWdQaUJ0YVc0Z1B5QnRhVzRnT2lCMllXeDFaU2xjYmlBZ2ZTeGNibHh1SUNCa1lYUmhLR1ZzWlcxbGJuUXNJRzVoYldVcElIdGNiaUFnSUNCeVpYUjFjbTRnYUdWc2NHVnljeTVrWlhObGNtbGhiR2w2WlNobGJHVnRaVzUwTG1kbGRFRjBkSEpwWW5WMFpTZ25aR0YwWVMwbklDc2dibUZ0WlNrcFhHNGdJSDBzWEc1Y2JpQWdaR1Z6WlhKcFlXeHBlbVVvZG1Gc2RXVXBJSHRjYmlBZ0lDQnBaaUFvZG1Gc2RXVWdQVDA5SUNkMGNuVmxKeWtnZTF4dUlDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdWY2JpQWdJQ0I5SUdWc2MyVWdhV1lnS0haaGJIVmxJRDA5UFNBblptRnNjMlVuS1NCN1hHNGdJQ0FnSUNCeVpYUjFjbTRnWm1Gc2MyVmNiaUFnSUNCOUlHVnNjMlVnYVdZZ0tIWmhiSFZsSUQwOVBTQW5iblZzYkNjcElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlCdWRXeHNYRzRnSUNBZ2ZTQmxiSE5sSUdsbUlDZ2hhWE5PWVU0b2NHRnljMlZHYkc5aGRDaDJZV3gxWlNrcElDWW1JR2x6Um1sdWFYUmxLSFpoYkhWbEtTa2dlMXh1SUNBZ0lDQWdjbVYwZFhKdUlIQmhjbk5sUm14dllYUW9kbUZzZFdVcFhHNGdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQjJZV3gxWlZ4dUlDQWdJSDFjYmlBZ2ZTeGNibHh1SUNCallXMWxiRU5oYzJVb2RtRnNkV1VwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkbUZzZFdVdWNtVndiR0ZqWlNndkxTc29MaWsvTDJjc0lDaHRZWFJqYUN3Z1kyaGhjbUZqZEdWeUtTQTlQaUI3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdZMmhoY21GamRHVnlJRDhnWTJoaGNtRmpkR1Z5TG5SdlZYQndaWEpEWVhObEtDa2dPaUFuSjF4dUlDQWdJSDBwWEc0Z0lIMHNYRzVjYmlBZ1lXTmpaV3hsY21GMFpTaGxiR1Z0Wlc1MEtTQjdYRzRnSUNBZ2FHVnNjR1Z5Y3k1amMzTW9aV3hsYldWdWRDd2dKM1J5WVc1elptOXliU2NzSUNkMGNtRnVjMnhoZEdVelpDZ3dMREFzTUNrZ2NtOTBZWFJsS0RBdU1EQXdNV1JsWnlrbktWeHVJQ0FnSUdobGJIQmxjbk11WTNOektHVnNaVzFsYm5Rc0lDZDBjbUZ1YzJadmNtMHRjM1I1YkdVbkxDQW5jSEpsYzJWeWRtVXRNMlFuS1Z4dUlDQWdJR2hsYkhCbGNuTXVZM056S0dWc1pXMWxiblFzSUNkaVlXTnJabUZqWlMxMmFYTnBZbWxzYVhSNUp5d2dKMmhwWkdSbGJpY3BYRzRnSUgwc1hHNWNiaUFnZEhKaGJuTm1iM0p0VTNWd2NHOXlkQ2gyWVd4MVpTa2dlMXh1SUNBZ0lHeGxkQ0JsYkdWdFpXNTBJRDBnWkc5amRXMWxiblF1WTNKbFlYUmxSV3hsYldWdWRDZ25aR2wySnlrc1hHNGdJQ0FnSUNCd2NtOXdaWEowZVZOMWNIQnZjblFnUFNCbVlXeHpaU3hjYmlBZ0lDQWdJSEJ5YjNCbGNuUjVWbUZzZFdVZ1BTQnVkV3hzTEZ4dUlDQWdJQ0FnWm1WaGRIVnlaVk4xY0hCdmNuUWdQU0JtWVd4elpTeGNiaUFnSUNBZ0lHTnpjMUJ5YjNCbGNuUjVJRDBnYm5Wc2JDeGNiaUFnSUNBZ0lHcHpVSEp2Y0dWeWRIa2dQU0J1ZFd4c1hHNGdJQ0FnWm05eUlDaHNaWFFnYVNBOUlEQXNJR3dnUFNCb1pXeHdaWEp6TG5abGJtUnZjbk11YkdWdVozUm9PeUJwSUR3Z2JEc2dhU3NyS1NCN1hHNGdJQ0FnSUNCcFppQW9hR1ZzY0dWeWN5NTJaVzVrYjNKelcybGRJQ0U5UFNCdWRXeHNLU0I3WEc0Z0lDQWdJQ0FnSUdOemMxQnliM0JsY25SNUlEMGdhR1ZzY0dWeWN5NTJaVzVrYjNKelcybGRXekJkSUNzZ0ozUnlZVzV6Wm05eWJTZGNiaUFnSUNBZ0lDQWdhbk5RY205d1pYSjBlU0E5SUdobGJIQmxjbk11ZG1WdVpHOXljMXRwWFZzeFhTQXJJQ2RVY21GdWMyWnZjbTBuWEc0Z0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0JqYzNOUWNtOXdaWEowZVNBOUlDZDBjbUZ1YzJadmNtMG5YRzRnSUNBZ0lDQWdJR3B6VUhKdmNHVnlkSGtnUFNBbmRISmhibk5tYjNKdEoxeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2FXWWdLR1ZzWlcxbGJuUXVjM1I1YkdWYmFuTlFjbTl3WlhKMGVWMGdJVDA5SUhWdVpHVm1hVzVsWkNrZ2UxeHVJQ0FnSUNBZ0lDQndjbTl3WlhKMGVWTjFjSEJ2Y25RZ1BTQjBjblZsWEc0Z0lDQWdJQ0FnSUdKeVpXRnJYRzRnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVJQ0FnSUhOM2FYUmphQ0FvZG1Gc2RXVXBJSHRjYmlBZ0lDQWdJR05oYzJVZ0p6SkVKenBjYmlBZ0lDQWdJQ0FnWm1WaGRIVnlaVk4xY0hCdmNuUWdQU0J3Y205d1pYSjBlVk4xY0hCdmNuUmNiaUFnSUNBZ0lDQWdZbkpsWVd0Y2JpQWdJQ0FnSUdOaGMyVWdKek5FSnpwY2JpQWdJQ0FnSUNBZ2FXWWdLSEJ5YjNCbGNuUjVVM1Z3Y0c5eWRDa2dlMXh1SUNBZ0lDQWdJQ0FnSUd4bGRDQmliMlI1SUQwZ1pHOWpkVzFsYm5RdVltOWtlU0I4ZkNCa2IyTjFiV1Z1ZEM1amNtVmhkR1ZGYkdWdFpXNTBLQ2RpYjJSNUp5a3NYRzRnSUNBZ0lDQWdJQ0FnSUNCa2IyTjFiV1Z1ZEVWc1pXMWxiblFnUFNCa2IyTjFiV1Z1ZEM1a2IyTjFiV1Z1ZEVWc1pXMWxiblFzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmtiMk4xYldWdWRFOTJaWEptYkc5M0lEMGdaRzlqZFcxbGJuUkZiR1Z0Wlc1MExuTjBlV3hsTG05MlpYSm1iRzkzTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdhWE5EY21WaGRHVmtRbTlrZVNBOUlHWmhiSE5sWEc1Y2JpQWdJQ0FnSUNBZ0lDQnBaaUFvSVdSdlkzVnRaVzUwTG1KdlpIa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbHpRM0psWVhSbFpFSnZaSGtnUFNCMGNuVmxYRzRnSUNBZ0lDQWdJQ0FnSUNCa2IyTjFiV1Z1ZEVWc1pXMWxiblF1YzNSNWJHVXViM1psY21ac2IzY2dQU0FuYUdsa1pHVnVKMXh1SUNBZ0lDQWdJQ0FnSUNBZ1pHOWpkVzFsYm5SRmJHVnRaVzUwTG1Gd2NHVnVaRU5vYVd4a0tHSnZaSGtwWEc0Z0lDQWdJQ0FnSUNBZ0lDQmliMlI1TG5OMGVXeGxMbTkyWlhKbWJHOTNJRDBnSjJocFpHUmxiaWRjYmlBZ0lDQWdJQ0FnSUNBZ0lHSnZaSGt1YzNSNWJHVXVZbUZqYTJkeWIzVnVaQ0E5SUNjblhHNGdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ1ltOWtlUzVoY0hCbGJtUkRhR2xzWkNobGJHVnRaVzUwS1Z4dUlDQWdJQ0FnSUNBZ0lHVnNaVzFsYm5RdWMzUjViR1ZiYW5OUWNtOXdaWEowZVYwZ1BTQW5kSEpoYm5Oc1lYUmxNMlFvTVhCNExERndlQ3d4Y0hncEoxeHVJQ0FnSUNBZ0lDQWdJSEJ5YjNCbGNuUjVWbUZzZFdVZ1BTQjNhVzVrYjNjdVoyVjBRMjl0Y0hWMFpXUlRkSGxzWlNobGJHVnRaVzUwS1M1blpYUlFjbTl3WlhKMGVWWmhiSFZsS0dOemMxQnliM0JsY25SNUtWeHVJQ0FnSUNBZ0lDQWdJR1psWVhSMWNtVlRkWEJ3YjNKMElEMGdjSEp2Y0dWeWRIbFdZV3gxWlNBaFBUMGdkVzVrWldacGJtVmtJQ1ltSUhCeWIzQmxjblI1Vm1Gc2RXVXViR1Z1WjNSb0lENGdNQ0FtSmlCd2NtOXdaWEowZVZaaGJIVmxJQ0U5UFNBbmJtOXVaU2RjYmlBZ0lDQWdJQ0FnSUNCa2IyTjFiV1Z1ZEVWc1pXMWxiblF1YzNSNWJHVXViM1psY21ac2IzY2dQU0JrYjJOMWJXVnVkRTkyWlhKbWJHOTNYRzRnSUNBZ0lDQWdJQ0FnWW05a2VTNXlaVzF2ZG1WRGFHbHNaQ2hsYkdWdFpXNTBLVnh1WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLR2x6UTNKbFlYUmxaRUp2WkhrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdKdlpIa3VjbVZ0YjNabFFYUjBjbWxpZFhSbEtDZHpkSGxzWlNjcFhHNGdJQ0FnSUNBZ0lDQWdJQ0JpYjJSNUxuQmhjbVZ1ZEU1dlpHVXVjbVZ0YjNabFEyaHBiR1FvWW05a2VTbGNiaUFnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ1luSmxZV3RjYmlBZ0lDQjlYRzRnSUNBZ2NtVjBkWEp1SUdabFlYUjFjbVZUZFhCd2IzSjBYRzRnSUgwc1hHNWNiaUFnWTNOektHVnNaVzFsYm5Rc0lIQnliM0JsY25SNUxDQjJZV3gxWlNrZ2UxeHVJQ0FnSUd4bGRDQnFjMUJ5YjNCbGNuUjVJRDBnYUdWc2NHVnljeTV3Y205d1pYSjBlVU5oWTJobFczQnliM0JsY25SNVhWeHVJQ0FnSUdsbUlDZ2hhbk5RY205d1pYSjBlU2tnZTF4dUlDQWdJQ0FnWm05eUlDaHNaWFFnYVNBOUlEQXNJR3dnUFNCb1pXeHdaWEp6TG5abGJtUnZjbk11YkdWdVozUm9PeUJwSUR3Z2JEc2dhU3NyS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hvWld4d1pYSnpMblpsYm1SdmNuTmJhVjBnSVQwOUlHNTFiR3dwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnFjMUJ5YjNCbGNuUjVJRDBnYUdWc2NHVnljeTVqWVcxbGJFTmhjMlVvYUdWc2NHVnljeTUyWlc1a2IzSnpXMmxkV3pGZElDc2dKeTBuSUNzZ2NISnZjR1Z5ZEhrcFhHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdhbk5RY205d1pYSjBlU0E5SUhCeWIzQmxjblI1WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2FXWWdLR1ZzWlcxbGJuUXVjM1I1YkdWYmFuTlFjbTl3WlhKMGVWMGdJVDA5SUhWdVpHVm1hVzVsWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJR2hsYkhCbGNuTXVjSEp2Y0dWeWRIbERZV05vWlZ0d2NtOXdaWEowZVYwZ1BTQnFjMUJ5YjNCbGNuUjVYRzRnSUNBZ0lDQWdJQ0FnWW5KbFlXdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdmVnh1SUNBZ0lIMWNiaUFnSUNCbGJHVnRaVzUwTG5OMGVXeGxXMnB6VUhKdmNHVnlkSGxkSUQwZ2RtRnNkV1ZjYmlBZ2ZWeHVYRzU5WEc1Y2JtTnZibk4wSUUxQlIwbERYMDVWVFVKRlVpQTlJRE13TEZ4dUlDQkVSVVpCVlV4VVV5QTlJSHRjYmlBZ0lDQnlaV3hoZEdsMlpVbHVjSFYwT2lCbVlXeHpaU3hjYmlBZ0lDQmpiR2x3VW1Wc1lYUnBkbVZKYm5CMWREb2dabUZzYzJVc1hHNGdJQ0FnYVc1d2RYUkZiR1Z0Wlc1ME9pQnVkV3hzTEZ4dUlDQWdJR2h2ZG1WeVQyNXNlVG9nWm1Gc2MyVXNYRzRnSUNBZ1kyRnNhV0p5WVhScGIyNVVhSEpsYzJodmJHUTZJREV3TUN4Y2JpQWdJQ0JqWVd4cFluSmhkR2x2YmtSbGJHRjVPaUExTURBc1hHNGdJQ0FnYzNWd2NHOXlkRVJsYkdGNU9pQTFNREFzWEc0Z0lDQWdZMkZzYVdKeVlYUmxXRG9nWm1Gc2MyVXNYRzRnSUNBZ1kyRnNhV0p5WVhSbFdUb2dkSEoxWlN4Y2JpQWdJQ0JwYm5abGNuUllPaUIwY25WbExGeHVJQ0FnSUdsdWRtVnlkRms2SUhSeWRXVXNYRzRnSUNBZ2JHbHRhWFJZT2lCbVlXeHpaU3hjYmlBZ0lDQnNhVzFwZEZrNklHWmhiSE5sTEZ4dUlDQWdJSE5qWVd4aGNsZzZJREV3TGpBc1hHNGdJQ0FnYzJOaGJHRnlXVG9nTVRBdU1DeGNiaUFnSUNCbWNtbGpkR2x2YmxnNklEQXVNU3hjYmlBZ0lDQm1jbWxqZEdsdmJsazZJREF1TVN4Y2JpQWdJQ0J2Y21sbmFXNVlPaUF3TGpVc1hHNGdJQ0FnYjNKcFoybHVXVG9nTUM0MUxGeHVJQ0FnSUhCdmFXNTBaWEpGZG1WdWRITTZJR1poYkhObExGeHVJQ0FnSUhCeVpXTnBjMmx2YmpvZ01TeGNiaUFnSUNCdmJsSmxZV1I1T2lCdWRXeHNMRnh1SUNBZ0lITmxiR1ZqZEc5eU9pQnVkV3hzWEc0Z0lIMWNibHh1WTJ4aGMzTWdVR0Z5WVd4c1lYZ2dlMXh1SUNCamIyNXpkSEoxWTNSdmNpaGxiR1Z0Wlc1MExDQnZjSFJwYjI1ektTQjdYRzVjYmlBZ0lDQjBhR2x6TG1Wc1pXMWxiblFnUFNCbGJHVnRaVzUwWEc1Y2JpQWdJQ0JqYjI1emRDQmtZWFJoSUQwZ2UxeHVJQ0FnSUNBZ1kyRnNhV0p5WVhSbFdEb2dhR1ZzY0dWeWN5NWtZWFJoS0hSb2FYTXVaV3hsYldWdWRDd2dKMk5oYkdsaWNtRjBaUzE0Snlrc1hHNGdJQ0FnSUNCallXeHBZbkpoZEdWWk9pQm9aV3h3WlhKekxtUmhkR0VvZEdocGN5NWxiR1Z0Wlc1MExDQW5ZMkZzYVdKeVlYUmxMWGtuS1N4Y2JpQWdJQ0FnSUdsdWRtVnlkRmc2SUdobGJIQmxjbk11WkdGMFlTaDBhR2x6TG1Wc1pXMWxiblFzSUNkcGJuWmxjblF0ZUNjcExGeHVJQ0FnSUNBZ2FXNTJaWEowV1RvZ2FHVnNjR1Z5Y3k1a1lYUmhLSFJvYVhNdVpXeGxiV1Z1ZEN3Z0oybHVkbVZ5ZEMxNUp5a3NYRzRnSUNBZ0lDQnNhVzFwZEZnNklHaGxiSEJsY25NdVpHRjBZU2gwYUdsekxtVnNaVzFsYm5Rc0lDZHNhVzFwZEMxNEp5a3NYRzRnSUNBZ0lDQnNhVzFwZEZrNklHaGxiSEJsY25NdVpHRjBZU2gwYUdsekxtVnNaVzFsYm5Rc0lDZHNhVzFwZEMxNUp5a3NYRzRnSUNBZ0lDQnpZMkZzWVhKWU9pQm9aV3h3WlhKekxtUmhkR0VvZEdocGN5NWxiR1Z0Wlc1MExDQW5jMk5oYkdGeUxYZ25LU3hjYmlBZ0lDQWdJSE5qWVd4aGNsazZJR2hsYkhCbGNuTXVaR0YwWVNoMGFHbHpMbVZzWlcxbGJuUXNJQ2R6WTJGc1lYSXRlU2NwTEZ4dUlDQWdJQ0FnWm5KcFkzUnBiMjVZT2lCb1pXeHdaWEp6TG1SaGRHRW9kR2hwY3k1bGJHVnRaVzUwTENBblpuSnBZM1JwYjI0dGVDY3BMRnh1SUNBZ0lDQWdabkpwWTNScGIyNVpPaUJvWld4d1pYSnpMbVJoZEdFb2RHaHBjeTVsYkdWdFpXNTBMQ0FuWm5KcFkzUnBiMjR0ZVNjcExGeHVJQ0FnSUNBZ2IzSnBaMmx1V0RvZ2FHVnNjR1Z5Y3k1a1lYUmhLSFJvYVhNdVpXeGxiV1Z1ZEN3Z0oyOXlhV2RwYmkxNEp5a3NYRzRnSUNBZ0lDQnZjbWxuYVc1Wk9pQm9aV3h3WlhKekxtUmhkR0VvZEdocGN5NWxiR1Z0Wlc1MExDQW5iM0pwWjJsdUxYa25LU3hjYmlBZ0lDQWdJSEJ2YVc1MFpYSkZkbVZ1ZEhNNklHaGxiSEJsY25NdVpHRjBZU2gwYUdsekxtVnNaVzFsYm5Rc0lDZHdiMmx1ZEdWeUxXVjJaVzUwY3ljcExGeHVJQ0FnSUNBZ2NISmxZMmx6YVc5dU9pQm9aV3h3WlhKekxtUmhkR0VvZEdocGN5NWxiR1Z0Wlc1MExDQW5jSEpsWTJsemFXOXVKeWtzWEc0Z0lDQWdJQ0J5Wld4aGRHbDJaVWx1Y0hWME9pQm9aV3h3WlhKekxtUmhkR0VvZEdocGN5NWxiR1Z0Wlc1MExDQW5jbVZzWVhScGRtVXRhVzV3ZFhRbktTeGNiaUFnSUNBZ0lHTnNhWEJTWld4aGRHbDJaVWx1Y0hWME9pQm9aV3h3WlhKekxtUmhkR0VvZEdocGN5NWxiR1Z0Wlc1MExDQW5ZMnhwY0MxeVpXeGhkR2wyWlMxcGJuQjFkQ2NwTEZ4dUlDQWdJQ0FnYUc5MlpYSlBibXg1T2lCb1pXeHdaWEp6TG1SaGRHRW9kR2hwY3k1bGJHVnRaVzUwTENBbmFHOTJaWEl0YjI1c2VTY3BMRnh1SUNBZ0lDQWdhVzV3ZFhSRmJHVnRaVzUwT2lCa2IyTjFiV1Z1ZEM1eGRXVnllVk5sYkdWamRHOXlLR2hsYkhCbGNuTXVaR0YwWVNoMGFHbHpMbVZzWlcxbGJuUXNJQ2RwYm5CMWRDMWxiR1Z0Wlc1MEp5a3BMRnh1SUNBZ0lDQWdjMlZzWldOMGIzSTZJR2hsYkhCbGNuTXVaR0YwWVNoMGFHbHpMbVZzWlcxbGJuUXNJQ2R6Wld4bFkzUnZjaWNwWEc0Z0lDQWdmVnh1WEc0Z0lDQWdabTl5SUNoc1pYUWdhMlY1SUdsdUlHUmhkR0VwSUh0Y2JpQWdJQ0FnSUdsbUlDaGtZWFJoVzJ0bGVWMGdQVDA5SUc1MWJHd3BJSHRjYmlBZ0lDQWdJQ0FnWkdWc1pYUmxJR1JoZEdGYmEyVjVYVnh1SUNBZ0lDQWdmVnh1SUNBZ0lIMWNibHh1SUNBZ0lHOWlhbVZqZEVGemMybG5iaWgwYUdsekxDQkVSVVpCVlV4VVV5d2daR0YwWVN3Z2IzQjBhVzl1Y3lsY2JseHVJQ0FnSUdsbUlDZ2hkR2hwY3k1cGJuQjFkRVZzWlcxbGJuUXBJSHRjYmlBZ0lDQWdJSFJvYVhNdWFXNXdkWFJGYkdWdFpXNTBJRDBnZEdocGN5NWxiR1Z0Wlc1MFhHNGdJQ0FnZlZ4dVhHNGdJQ0FnZEdocGN5NWpZV3hwWW5KaGRHbHZibFJwYldWeUlEMGdiblZzYkZ4dUlDQWdJSFJvYVhNdVkyRnNhV0p5WVhScGIyNUdiR0ZuSUQwZ2RISjFaVnh1SUNBZ0lIUm9hWE11Wlc1aFlteGxaQ0E5SUdaaGJITmxYRzRnSUNBZ2RHaHBjeTVrWlhCMGFITllJRDBnVzExY2JpQWdJQ0IwYUdsekxtUmxjSFJvYzFrZ1BTQmJYVnh1SUNBZ0lIUm9hWE11Y21GbUlEMGdiblZzYkZ4dVhHNGdJQ0FnZEdocGN5NWliM1Z1WkhNZ1BTQnVkV3hzWEc0Z0lDQWdkR2hwY3k1bGJHVnRaVzUwVUc5emFYUnBiMjVZSUQwZ01GeHVJQ0FnSUhSb2FYTXVaV3hsYldWdWRGQnZjMmwwYVc5dVdTQTlJREJjYmlBZ0lDQjBhR2x6TG1Wc1pXMWxiblJYYVdSMGFDQTlJREJjYmlBZ0lDQjBhR2x6TG1Wc1pXMWxiblJJWldsbmFIUWdQU0F3WEc1Y2JpQWdJQ0IwYUdsekxtVnNaVzFsYm5SRFpXNTBaWEpZSUQwZ01GeHVJQ0FnSUhSb2FYTXVaV3hsYldWdWRFTmxiblJsY2xrZ1BTQXdYRzVjYmlBZ0lDQjBhR2x6TG1Wc1pXMWxiblJTWVc1blpWZ2dQU0F3WEc0Z0lDQWdkR2hwY3k1bGJHVnRaVzUwVW1GdVoyVlpJRDBnTUZ4dVhHNGdJQ0FnZEdocGN5NWpZV3hwWW5KaGRHbHZibGdnUFNBd1hHNGdJQ0FnZEdocGN5NWpZV3hwWW5KaGRHbHZibGtnUFNBd1hHNWNiaUFnSUNCMGFHbHpMbWx1Y0hWMFdDQTlJREJjYmlBZ0lDQjBhR2x6TG1sdWNIVjBXU0E5SURCY2JseHVJQ0FnSUhSb2FYTXViVzkwYVc5dVdDQTlJREJjYmlBZ0lDQjBhR2x6TG0xdmRHbHZibGtnUFNBd1hHNWNiaUFnSUNCMGFHbHpMblpsYkc5amFYUjVXQ0E5SURCY2JpQWdJQ0IwYUdsekxuWmxiRzlqYVhSNVdTQTlJREJjYmx4dUlDQWdJSFJvYVhNdWIyNU5iM1Z6WlUxdmRtVWdQU0IwYUdsekxtOXVUVzkxYzJWTmIzWmxMbUpwYm1Rb2RHaHBjeWxjYmlBZ0lDQjBhR2x6TG05dVJHVjJhV05sVDNKcFpXNTBZWFJwYjI0Z1BTQjBhR2x6TG05dVJHVjJhV05sVDNKcFpXNTBZWFJwYjI0dVltbHVaQ2gwYUdsektWeHVJQ0FnSUhSb2FYTXViMjVFWlhacFkyVk5iM1JwYjI0Z1BTQjBhR2x6TG05dVJHVjJhV05sVFc5MGFXOXVMbUpwYm1Rb2RHaHBjeWxjYmlBZ0lDQjBhR2x6TG05dVQzSnBaVzUwWVhScGIyNVVhVzFsY2lBOUlIUm9hWE11YjI1UGNtbGxiblJoZEdsdmJsUnBiV1Z5TG1KcGJtUW9kR2hwY3lsY2JpQWdJQ0IwYUdsekxtOXVUVzkwYVc5dVZHbHRaWElnUFNCMGFHbHpMbTl1VFc5MGFXOXVWR2x0WlhJdVltbHVaQ2gwYUdsektWeHVJQ0FnSUhSb2FYTXViMjVEWVd4cFluSmhkR2x2YmxScGJXVnlJRDBnZEdocGN5NXZia05oYkdsaWNtRjBhVzl1VkdsdFpYSXVZbWx1WkNoMGFHbHpLVnh1SUNBZ0lIUm9hWE11YjI1QmJtbHRZWFJwYjI1R2NtRnRaU0E5SUhSb2FYTXViMjVCYm1sdFlYUnBiMjVHY21GdFpTNWlhVzVrS0hSb2FYTXBYRzRnSUNBZ2RHaHBjeTV2YmxkcGJtUnZkMUpsYzJsNlpTQTlJSFJvYVhNdWIyNVhhVzVrYjNkU1pYTnBlbVV1WW1sdVpDaDBhR2x6S1Z4dVhHNGdJQ0FnZEdocGN5NTNhVzVrYjNkWGFXUjBhQ0E5SUc1MWJHeGNiaUFnSUNCMGFHbHpMbmRwYm1SdmQwaGxhV2RvZENBOUlHNTFiR3hjYmlBZ0lDQjBhR2x6TG5kcGJtUnZkME5sYm5SbGNsZ2dQU0J1ZFd4c1hHNGdJQ0FnZEdocGN5NTNhVzVrYjNkRFpXNTBaWEpaSUQwZ2JuVnNiRnh1SUNBZ0lIUm9hWE11ZDJsdVpHOTNVbUZrYVhWeldDQTlJRzUxYkd4Y2JpQWdJQ0IwYUdsekxuZHBibVJ2ZDFKaFpHbDFjMWtnUFNCdWRXeHNYRzRnSUNBZ2RHaHBjeTV3YjNKMGNtRnBkQ0E5SUdaaGJITmxYRzRnSUNBZ2RHaHBjeTVrWlhOcmRHOXdJRDBnSVc1aGRtbG5ZWFJ2Y2k1MWMyVnlRV2RsYm5RdWJXRjBZMmdvTHlocFVHaHZibVY4YVZCdlpIeHBVR0ZrZkVGdVpISnZhV1I4UW14aFkydENaWEp5ZVh4Q1FqRXdmRzF2WW1sOGRHRmliR1YwZkc5d1pYSmhJRzFwYm1sOGJtVjRkWE1nTnlrdmFTbGNiaUFnSUNCMGFHbHpMbTF2ZEdsdmJsTjFjSEJ2Y25RZ1BTQWhJWGRwYm1SdmR5NUVaWFpwWTJWTmIzUnBiMjVGZG1WdWRDQW1KaUFoZEdocGN5NWtaWE5yZEc5d1hHNGdJQ0FnZEdocGN5NXZjbWxsYm5SaGRHbHZibE4xY0hCdmNuUWdQU0FoSVhkcGJtUnZkeTVFWlhacFkyVlBjbWxsYm5SaGRHbHZia1YyWlc1MElDWW1JQ0YwYUdsekxtUmxjMnQwYjNCY2JpQWdJQ0IwYUdsekxtOXlhV1Z1ZEdGMGFXOXVVM1JoZEhWeklEMGdNRnh1SUNBZ0lIUm9hWE11Ylc5MGFXOXVVM1JoZEhWeklEMGdNRnh1WEc0Z0lDQWdkR2hwY3k1cGJtbDBhV0ZzYVhObEtDbGNiaUFnZlZ4dVhHNGdJR2x1YVhScFlXeHBjMlVvS1NCN1hHNGdJQ0FnYVdZZ0tIUm9hWE11ZEhKaGJuTm1iM0p0TWtSVGRYQndiM0owSUQwOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQWdJSFJvYVhNdWRISmhibk5tYjNKdE1rUlRkWEJ3YjNKMElEMGdhR1ZzY0dWeWN5NTBjbUZ1YzJadmNtMVRkWEJ3YjNKMEtDY3lSQ2NwWEc0Z0lDQWdJQ0IwYUdsekxuUnlZVzV6Wm05eWJUTkVVM1Z3Y0c5eWRDQTlJR2hsYkhCbGNuTXVkSEpoYm5ObWIzSnRVM1Z3Y0c5eWRDZ25NMFFuS1Z4dUlDQWdJSDFjYmx4dUlDQWdJQzh2SUVOdmJtWnBaM1Z5WlNCRGIyNTBaWGgwSUZOMGVXeGxjMXh1SUNBZ0lHbG1JQ2gwYUdsekxuUnlZVzV6Wm05eWJUTkVVM1Z3Y0c5eWRDa2dlMXh1SUNBZ0lDQWdhR1ZzY0dWeWN5NWhZMk5sYkdWeVlYUmxLSFJvYVhNdVpXeGxiV1Z1ZENsY2JpQWdJQ0I5WEc1Y2JpQWdJQ0JzWlhRZ2MzUjViR1VnUFNCM2FXNWtiM2N1WjJWMFEyOXRjSFYwWldSVGRIbHNaU2gwYUdsekxtVnNaVzFsYm5RcFhHNGdJQ0FnYVdZZ0tITjBlV3hsTG1kbGRGQnliM0JsY25SNVZtRnNkV1VvSjNCdmMybDBhVzl1SnlrZ1BUMDlJQ2R6ZEdGMGFXTW5LU0I3WEc0Z0lDQWdJQ0IwYUdsekxtVnNaVzFsYm5RdWMzUjViR1V1Y0c5emFYUnBiMjRnUFNBbmNtVnNZWFJwZG1VblhHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHk4Z1VHOXBiblJsY2lCbGRtVnVkSE5jYmlBZ0lDQnBaaUFvSVhSb2FYTXVjRzlwYm5SbGNrVjJaVzUwY3lrZ2UxeHVJQ0FnSUNBZ2RHaHBjeTVsYkdWdFpXNTBMbk4wZVd4bExuQnZhVzUwWlhKRmRtVnVkSE1nUFNBbmRtbHphV0pzWlNkY2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2THlCVFpYUjFjRnh1SUNBZ0lIUm9hWE11ZFhCa1lYUmxUR0Y1WlhKektDbGNiaUFnSUNCMGFHbHpMblZ3WkdGMFpVUnBiV1Z1YzJsdmJuTW9LVnh1SUNBZ0lIUm9hWE11Wlc1aFlteGxLQ2xjYmlBZ0lDQjBhR2x6TG5GMVpYVmxRMkZzYVdKeVlYUnBiMjRvZEdocGN5NWpZV3hwWW5KaGRHbHZia1JsYkdGNUtWeHVJQ0I5WEc1Y2JpQWdaRzlTWldGa2VVTmhiR3hpWVdOcktDa2dlMXh1SUNBZ0lHbG1JQ2gwYUdsekxtOXVVbVZoWkhrcElIdGNiaUFnSUNBZ0lIUm9hWE11YjI1U1pXRmtlU2dwWEc0Z0lDQWdmVnh1SUNCOVhHNWNiaUFnZFhCa1lYUmxUR0Y1WlhKektDa2dlMXh1SUNBZ0lHbG1JQ2gwYUdsekxuTmxiR1ZqZEc5eUtTQjdYRzRnSUNBZ0lDQjBhR2x6TG14aGVXVnljeUE5SUhSb2FYTXVaV3hsYldWdWRDNXhkV1Z5ZVZObGJHVmpkRzl5UVd4c0tIUm9hWE11YzJWc1pXTjBiM0lwWEc0Z0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lIUm9hWE11YkdGNVpYSnpJRDBnZEdocGN5NWxiR1Z0Wlc1MExtTm9hV3hrY21WdVhHNGdJQ0FnZlZ4dVhHNGdJQ0FnYVdZZ0tDRjBhR2x6TG14aGVXVnljeTVzWlc1bmRHZ3BJSHRjYmlBZ0lDQWdJR052Ym5OdmJHVXVkMkZ5YmlnblVHRnlZV3hzWVhoS1V6b2dXVzkxY2lCelkyVnVaU0JrYjJWeklHNXZkQ0JvWVhabElHRnVlU0JzWVhsbGNuTXVKeWxjYmlBZ0lDQjlYRzVjYmlBZ0lDQjBhR2x6TG1SbGNIUm9jMWdnUFNCYlhWeHVJQ0FnSUhSb2FYTXVaR1Z3ZEdoeldTQTlJRnRkWEc1Y2JpQWdJQ0JtYjNJZ0tHeGxkQ0JwYm1SbGVDQTlJREE3SUdsdVpHVjRJRHdnZEdocGN5NXNZWGxsY25NdWJHVnVaM1JvT3lCcGJtUmxlQ3NyS1NCN1hHNGdJQ0FnSUNCc1pYUWdiR0Y1WlhJZ1BTQjBhR2x6TG14aGVXVnljMXRwYm1SbGVGMWNibHh1SUNBZ0lDQWdhV1lnS0hSb2FYTXVkSEpoYm5ObWIzSnRNMFJUZFhCd2IzSjBLU0I3WEc0Z0lDQWdJQ0FnSUdobGJIQmxjbk11WVdOalpXeGxjbUYwWlNoc1lYbGxjaWxjYmlBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnYkdGNVpYSXVjM1I1YkdVdWNHOXphWFJwYjI0Z1BTQnBibVJsZUNBL0lDZGhZbk52YkhWMFpTY2dPaUFuY21Wc1lYUnBkbVVuWEc0Z0lDQWdJQ0JzWVhsbGNpNXpkSGxzWlM1a2FYTndiR0Y1SUQwZ0oySnNiMk5ySjF4dUlDQWdJQ0FnYkdGNVpYSXVjM1I1YkdVdWJHVm1kQ0E5SURCY2JpQWdJQ0FnSUd4aGVXVnlMbk4wZVd4bExuUnZjQ0E5SURCY2JseHVJQ0FnSUNBZ2JHVjBJR1JsY0hSb0lEMGdhR1ZzY0dWeWN5NWtZWFJoS0d4aGVXVnlMQ0FuWkdWd2RHZ25LU0I4ZkNBd1hHNGdJQ0FnSUNCMGFHbHpMbVJsY0hSb2MxZ3VjSFZ6YUNob1pXeHdaWEp6TG1SaGRHRW9iR0Y1WlhJc0lDZGtaWEIwYUMxNEp5a2dmSHdnWkdWd2RHZ3BYRzRnSUNBZ0lDQjBhR2x6TG1SbGNIUm9jMWt1Y0hWemFDaG9aV3h3WlhKekxtUmhkR0VvYkdGNVpYSXNJQ2RrWlhCMGFDMTVKeWtnZkh3Z1pHVndkR2dwWEc0Z0lDQWdmVnh1SUNCOVhHNWNiaUFnZFhCa1lYUmxSR2x0Wlc1emFXOXVjeWdwSUh0Y2JpQWdJQ0IwYUdsekxuZHBibVJ2ZDFkcFpIUm9JRDBnZDJsdVpHOTNMbWx1Ym1WeVYybGtkR2hjYmlBZ0lDQjBhR2x6TG5kcGJtUnZkMGhsYVdkb2RDQTlJSGRwYm1SdmR5NXBibTVsY2tobGFXZG9kRnh1SUNBZ0lIUm9hWE11ZDJsdVpHOTNRMlZ1ZEdWeVdDQTlJSFJvYVhNdWQybHVaRzkzVjJsa2RHZ2dLaUIwYUdsekxtOXlhV2RwYmxoY2JpQWdJQ0IwYUdsekxuZHBibVJ2ZDBObGJuUmxjbGtnUFNCMGFHbHpMbmRwYm1SdmQwaGxhV2RvZENBcUlIUm9hWE11YjNKcFoybHVXVnh1SUNBZ0lIUm9hWE11ZDJsdVpHOTNVbUZrYVhWeldDQTlJRTFoZEdndWJXRjRLSFJvYVhNdWQybHVaRzkzUTJWdWRHVnlXQ3dnZEdocGN5NTNhVzVrYjNkWGFXUjBhQ0F0SUhSb2FYTXVkMmx1Wkc5M1EyVnVkR1Z5V0NsY2JpQWdJQ0IwYUdsekxuZHBibVJ2ZDFKaFpHbDFjMWtnUFNCTllYUm9MbTFoZUNoMGFHbHpMbmRwYm1SdmQwTmxiblJsY2xrc0lIUm9hWE11ZDJsdVpHOTNTR1ZwWjJoMElDMGdkR2hwY3k1M2FXNWtiM2REWlc1MFpYSlpLVnh1SUNCOVhHNWNiaUFnZFhCa1lYUmxRbTkxYm1SektDa2dlMXh1SUNBZ0lIUm9hWE11WW05MWJtUnpJRDBnZEdocGN5NXBibkIxZEVWc1pXMWxiblF1WjJWMFFtOTFibVJwYm1kRGJHbGxiblJTWldOMEtDbGNiaUFnSUNCMGFHbHpMbVZzWlcxbGJuUlFiM05wZEdsdmJsZ2dQU0IwYUdsekxtSnZkVzVrY3k1c1pXWjBYRzRnSUNBZ2RHaHBjeTVsYkdWdFpXNTBVRzl6YVhScGIyNVpJRDBnZEdocGN5NWliM1Z1WkhNdWRHOXdYRzRnSUNBZ2RHaHBjeTVsYkdWdFpXNTBWMmxrZEdnZ1BTQjBhR2x6TG1KdmRXNWtjeTUzYVdSMGFGeHVJQ0FnSUhSb2FYTXVaV3hsYldWdWRFaGxhV2RvZENBOUlIUm9hWE11WW05MWJtUnpMbWhsYVdkb2RGeHVJQ0FnSUhSb2FYTXVaV3hsYldWdWRFTmxiblJsY2xnZ1BTQjBhR2x6TG1Wc1pXMWxiblJYYVdSMGFDQXFJSFJvYVhNdWIzSnBaMmx1V0Z4dUlDQWdJSFJvYVhNdVpXeGxiV1Z1ZEVObGJuUmxjbGtnUFNCMGFHbHpMbVZzWlcxbGJuUklaV2xuYUhRZ0tpQjBhR2x6TG05eWFXZHBibGxjYmlBZ0lDQjBhR2x6TG1Wc1pXMWxiblJTWVc1blpWZ2dQU0JOWVhSb0xtMWhlQ2gwYUdsekxtVnNaVzFsYm5SRFpXNTBaWEpZTENCMGFHbHpMbVZzWlcxbGJuUlhhV1IwYUNBdElIUm9hWE11Wld4bGJXVnVkRU5sYm5SbGNsZ3BYRzRnSUNBZ2RHaHBjeTVsYkdWdFpXNTBVbUZ1WjJWWklEMGdUV0YwYUM1dFlYZ29kR2hwY3k1bGJHVnRaVzUwUTJWdWRHVnlXU3dnZEdocGN5NWxiR1Z0Wlc1MFNHVnBaMmgwSUMwZ2RHaHBjeTVsYkdWdFpXNTBRMlZ1ZEdWeVdTbGNiaUFnZlZ4dVhHNGdJSEYxWlhWbFEyRnNhV0p5WVhScGIyNG9aR1ZzWVhrcElIdGNiaUFnSUNCamJHVmhjbFJwYldWdmRYUW9kR2hwY3k1allXeHBZbkpoZEdsdmJsUnBiV1Z5S1Z4dUlDQWdJSFJvYVhNdVkyRnNhV0p5WVhScGIyNVVhVzFsY2lBOUlITmxkRlJwYldWdmRYUW9kR2hwY3k1dmJrTmhiR2xpY21GMGFXOXVWR2x0WlhJc0lHUmxiR0Y1S1Z4dUlDQjlYRzVjYmlBZ1pXNWhZbXhsS0NrZ2UxeHVJQ0FnSUdsbUlDaDBhR2x6TG1WdVlXSnNaV1FwSUh0Y2JpQWdJQ0FnSUhKbGRIVnlibHh1SUNBZ0lIMWNiaUFnSUNCMGFHbHpMbVZ1WVdKc1pXUWdQU0IwY25WbFhHNWNiaUFnSUNCcFppQW9kR2hwY3k1dmNtbGxiblJoZEdsdmJsTjFjSEJ2Y25RcElIdGNiaUFnSUNBZ0lIUm9hWE11Y0c5eWRISmhhWFFnUFNCbVlXeHpaVnh1SUNBZ0lDQWdkMmx1Wkc5M0xtRmtaRVYyWlc1MFRHbHpkR1Z1WlhJb0oyUmxkbWxqWlc5eWFXVnVkR0YwYVc5dUp5d2dkR2hwY3k1dmJrUmxkbWxqWlU5eWFXVnVkR0YwYVc5dUtWeHVJQ0FnSUNBZ2RHaHBjeTVrWlhSbFkzUnBiMjVVYVcxbGNpQTlJSE5sZEZScGJXVnZkWFFvZEdocGN5NXZiazl5YVdWdWRHRjBhVzl1VkdsdFpYSXNJSFJvYVhNdWMzVndjRzl5ZEVSbGJHRjVLVnh1SUNBZ0lIMGdaV3h6WlNCcFppQW9kR2hwY3k1dGIzUnBiMjVUZFhCd2IzSjBLU0I3WEc0Z0lDQWdJQ0IwYUdsekxuQnZjblJ5WVdsMElEMGdabUZzYzJWY2JpQWdJQ0FnSUhkcGJtUnZkeTVoWkdSRmRtVnVkRXhwYzNSbGJtVnlLQ2RrWlhacFkyVnRiM1JwYjI0bkxDQjBhR2x6TG05dVJHVjJhV05sVFc5MGFXOXVLVnh1SUNBZ0lDQWdkR2hwY3k1a1pYUmxZM1JwYjI1VWFXMWxjaUE5SUhObGRGUnBiV1Z2ZFhRb2RHaHBjeTV2YmsxdmRHbHZibFJwYldWeUxDQjBhR2x6TG5OMWNIQnZjblJFWld4aGVTbGNiaUFnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnZEdocGN5NWpZV3hwWW5KaGRHbHZibGdnUFNBd1hHNGdJQ0FnSUNCMGFHbHpMbU5oYkdsaWNtRjBhVzl1V1NBOUlEQmNiaUFnSUNBZ0lIUm9hWE11Y0c5eWRISmhhWFFnUFNCbVlXeHpaVnh1SUNBZ0lDQWdkMmx1Wkc5M0xtRmtaRVYyWlc1MFRHbHpkR1Z1WlhJb0oyMXZkWE5sYlc5MlpTY3NJSFJvYVhNdWIyNU5iM1Z6WlUxdmRtVXBYRzRnSUNBZ0lDQjBhR2x6TG1SdlVtVmhaSGxEWVd4c1ltRmpheWdwWEc0Z0lDQWdmVnh1WEc0Z0lDQWdkMmx1Wkc5M0xtRmtaRVYyWlc1MFRHbHpkR1Z1WlhJb0ozSmxjMmw2WlNjc0lIUm9hWE11YjI1WGFXNWtiM2RTWlhOcGVtVXBYRzRnSUNBZ2RHaHBjeTV5WVdZZ1BTQnljVUZ1Um5Jb2RHaHBjeTV2YmtGdWFXMWhkR2x2YmtaeVlXMWxLVnh1SUNCOVhHNWNiaUFnWkdsellXSnNaU2dwSUh0Y2JpQWdJQ0JwWmlBb0lYUm9hWE11Wlc1aFlteGxaQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVYRzRnSUNBZ2ZWeHVJQ0FnSUhSb2FYTXVaVzVoWW14bFpDQTlJR1poYkhObFhHNWNiaUFnSUNCcFppQW9kR2hwY3k1dmNtbGxiblJoZEdsdmJsTjFjSEJ2Y25RcElIdGNiaUFnSUNBZ0lIZHBibVJ2ZHk1eVpXMXZkbVZGZG1WdWRFeHBjM1JsYm1WeUtDZGtaWFpwWTJWdmNtbGxiblJoZEdsdmJpY3NJSFJvYVhNdWIyNUVaWFpwWTJWUGNtbGxiblJoZEdsdmJpbGNiaUFnSUNCOUlHVnNjMlVnYVdZZ0tIUm9hWE11Ylc5MGFXOXVVM1Z3Y0c5eWRDa2dlMXh1SUNBZ0lDQWdkMmx1Wkc5M0xuSmxiVzkyWlVWMlpXNTBUR2x6ZEdWdVpYSW9KMlJsZG1salpXMXZkR2x2Ymljc0lIUm9hWE11YjI1RVpYWnBZMlZOYjNScGIyNHBYRzRnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUhkcGJtUnZkeTV5WlcxdmRtVkZkbVZ1ZEV4cGMzUmxibVZ5S0NkdGIzVnpaVzF2ZG1VbkxDQjBhR2x6TG05dVRXOTFjMlZOYjNabEtWeHVJQ0FnSUgxY2JseHVJQ0FnSUhkcGJtUnZkeTV5WlcxdmRtVkZkbVZ1ZEV4cGMzUmxibVZ5S0NkeVpYTnBlbVVuTENCMGFHbHpMbTl1VjJsdVpHOTNVbVZ6YVhwbEtWeHVJQ0FnSUhKeFFXNUdjaTVqWVc1alpXd29kR2hwY3k1eVlXWXBYRzRnSUgxY2JseHVJQ0JqWVd4cFluSmhkR1VvZUN3Z2VTa2dlMXh1SUNBZ0lIUm9hWE11WTJGc2FXSnlZWFJsV0NBOUlIZ2dQVDA5SUhWdVpHVm1hVzVsWkNBL0lIUm9hWE11WTJGc2FXSnlZWFJsV0NBNklIaGNiaUFnSUNCMGFHbHpMbU5oYkdsaWNtRjBaVmtnUFNCNUlEMDlQU0IxYm1SbFptbHVaV1FnUHlCMGFHbHpMbU5oYkdsaWNtRjBaVmtnT2lCNVhHNGdJSDFjYmx4dUlDQnBiblpsY25Rb2VDd2dlU2tnZTF4dUlDQWdJSFJvYVhNdWFXNTJaWEowV0NBOUlIZ2dQVDA5SUhWdVpHVm1hVzVsWkNBL0lIUm9hWE11YVc1MlpYSjBXQ0E2SUhoY2JpQWdJQ0IwYUdsekxtbHVkbVZ5ZEZrZ1BTQjVJRDA5UFNCMWJtUmxabWx1WldRZ1B5QjBhR2x6TG1sdWRtVnlkRmtnT2lCNVhHNGdJSDFjYmx4dUlDQm1jbWxqZEdsdmJpaDRMQ0I1S1NCN1hHNGdJQ0FnZEdocGN5NW1jbWxqZEdsdmJsZ2dQU0I0SUQwOVBTQjFibVJsWm1sdVpXUWdQeUIwYUdsekxtWnlhV04wYVc5dVdDQTZJSGhjYmlBZ0lDQjBhR2x6TG1aeWFXTjBhVzl1V1NBOUlIa2dQVDA5SUhWdVpHVm1hVzVsWkNBL0lIUm9hWE11Wm5KcFkzUnBiMjVaSURvZ2VWeHVJQ0I5WEc1Y2JpQWdjMk5oYkdGeUtIZ3NJSGtwSUh0Y2JpQWdJQ0IwYUdsekxuTmpZV3hoY2xnZ1BTQjRJRDA5UFNCMWJtUmxabWx1WldRZ1B5QjBhR2x6TG5OallXeGhjbGdnT2lCNFhHNGdJQ0FnZEdocGN5NXpZMkZzWVhKWklEMGdlU0E5UFQwZ2RXNWtaV1pwYm1Wa0lEOGdkR2hwY3k1elkyRnNZWEpaSURvZ2VWeHVJQ0I5WEc1Y2JpQWdiR2x0YVhRb2VDd2dlU2tnZTF4dUlDQWdJSFJvYVhNdWJHbHRhWFJZSUQwZ2VDQTlQVDBnZFc1a1pXWnBibVZrSUQ4Z2RHaHBjeTVzYVcxcGRGZ2dPaUI0WEc0Z0lDQWdkR2hwY3k1c2FXMXBkRmtnUFNCNUlEMDlQU0IxYm1SbFptbHVaV1FnUHlCMGFHbHpMbXhwYldsMFdTQTZJSGxjYmlBZ2ZWeHVYRzRnSUc5eWFXZHBiaWg0TENCNUtTQjdYRzRnSUNBZ2RHaHBjeTV2Y21sbmFXNVlJRDBnZUNBOVBUMGdkVzVrWldacGJtVmtJRDhnZEdocGN5NXZjbWxuYVc1WUlEb2dlRnh1SUNBZ0lIUm9hWE11YjNKcFoybHVXU0E5SUhrZ1BUMDlJSFZ1WkdWbWFXNWxaQ0EvSUhSb2FYTXViM0pwWjJsdVdTQTZJSGxjYmlBZ2ZWeHVYRzRnSUhObGRFbHVjSFYwUld4bGJXVnVkQ2hsYkdWdFpXNTBLU0I3WEc0Z0lDQWdkR2hwY3k1cGJuQjFkRVZzWlcxbGJuUWdQU0JsYkdWdFpXNTBYRzRnSUNBZ2RHaHBjeTUxY0dSaGRHVkVhVzFsYm5OcGIyNXpLQ2xjYmlBZ2ZWeHVYRzRnSUhObGRGQnZjMmwwYVc5dUtHVnNaVzFsYm5Rc0lIZ3NJSGtwSUh0Y2JpQWdJQ0I0SUQwZ2VDNTBiMFpwZUdWa0tIUm9hWE11Y0hKbFkybHphVzl1S1NBcklDZHdlQ2RjYmlBZ0lDQjVJRDBnZVM1MGIwWnBlR1ZrS0hSb2FYTXVjSEpsWTJsemFXOXVLU0FySUNkd2VDZGNiaUFnSUNCcFppQW9kR2hwY3k1MGNtRnVjMlp2Y20welJGTjFjSEJ2Y25RcElIdGNiaUFnSUNBZ0lHaGxiSEJsY25NdVkzTnpLR1ZzWlcxbGJuUXNJQ2QwY21GdWMyWnZjbTBuTENBbmRISmhibk5zWVhSbE0yUW9KeUFySUhnZ0t5QW5MQ2NnS3lCNUlDc2dKeXd3S1NjcFhHNGdJQ0FnZlNCbGJITmxJR2xtSUNoMGFHbHpMblJ5WVc1elptOXliVEpFVTNWd2NHOXlkQ2tnZTF4dUlDQWdJQ0FnYUdWc2NHVnljeTVqYzNNb1pXeGxiV1Z1ZEN3Z0ozUnlZVzV6Wm05eWJTY3NJQ2QwY21GdWMyeGhkR1VvSnlBcklIZ2dLeUFuTENjZ0t5QjVJQ3NnSnlrbktWeHVJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0JsYkdWdFpXNTBMbk4wZVd4bExteGxablFnUFNCNFhHNGdJQ0FnSUNCbGJHVnRaVzUwTG5OMGVXeGxMblJ2Y0NBOUlIbGNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQnZiazl5YVdWdWRHRjBhVzl1VkdsdFpYSW9LU0I3WEc0Z0lDQWdhV1lnS0hSb2FYTXViM0pwWlc1MFlYUnBiMjVUZFhCd2IzSjBJQ1ltSUhSb2FYTXViM0pwWlc1MFlYUnBiMjVUZEdGMGRYTWdQVDA5SURBcElIdGNiaUFnSUNBZ0lIUm9hWE11WkdsellXSnNaU2dwWEc0Z0lDQWdJQ0IwYUdsekxtOXlhV1Z1ZEdGMGFXOXVVM1Z3Y0c5eWRDQTlJR1poYkhObFhHNGdJQ0FnSUNCMGFHbHpMbVZ1WVdKc1pTZ3BYRzRnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUhSb2FYTXVaRzlTWldGa2VVTmhiR3hpWVdOcktDbGNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQnZiazF2ZEdsdmJsUnBiV1Z5S0NrZ2UxeHVJQ0FnSUdsbUlDaDBhR2x6TG0xdmRHbHZibE4xY0hCdmNuUWdKaVlnZEdocGN5NXRiM1JwYjI1VGRHRjBkWE1nUFQwOUlEQXBJSHRjYmlBZ0lDQWdJSFJvYVhNdVpHbHpZV0pzWlNncFhHNGdJQ0FnSUNCMGFHbHpMbTF2ZEdsdmJsTjFjSEJ2Y25RZ1BTQm1ZV3h6WlZ4dUlDQWdJQ0FnZEdocGN5NWxibUZpYkdVb0tWeHVJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0IwYUdsekxtUnZVbVZoWkhsRFlXeHNZbUZqYXlncFhHNGdJQ0FnZlZ4dUlDQjlYRzVjYmlBZ2IyNURZV3hwWW5KaGRHbHZibFJwYldWeUtDa2dlMXh1SUNBZ0lIUm9hWE11WTJGc2FXSnlZWFJwYjI1R2JHRm5JRDBnZEhKMVpWeHVJQ0I5WEc1Y2JpQWdiMjVYYVc1a2IzZFNaWE5wZW1Vb0tTQjdYRzRnSUNBZ2RHaHBjeTUxY0dSaGRHVkVhVzFsYm5OcGIyNXpLQ2xjYmlBZ2ZWeHVYRzRnSUc5dVFXNXBiV0YwYVc5dVJuSmhiV1VvS1NCN1hHNGdJQ0FnZEdocGN5NTFjR1JoZEdWQ2IzVnVaSE1vS1Z4dUlDQWdJR3hsZENCallXeHBZbkpoZEdWa1NXNXdkWFJZSUQwZ2RHaHBjeTVwYm5CMWRGZ2dMU0IwYUdsekxtTmhiR2xpY21GMGFXOXVXQ3hjYmlBZ0lDQWdJR05oYkdsaWNtRjBaV1JKYm5CMWRGa2dQU0IwYUdsekxtbHVjSFYwV1NBdElIUm9hWE11WTJGc2FXSnlZWFJwYjI1WlhHNGdJQ0FnYVdZZ0tDaE5ZWFJvTG1GaWN5aGpZV3hwWW5KaGRHVmtTVzV3ZFhSWUtTQStJSFJvYVhNdVkyRnNhV0p5WVhScGIyNVVhSEpsYzJodmJHUXBJSHg4SUNoTllYUm9MbUZpY3loallXeHBZbkpoZEdWa1NXNXdkWFJaS1NBK0lIUm9hWE11WTJGc2FXSnlZWFJwYjI1VWFISmxjMmh2YkdRcEtTQjdYRzRnSUNBZ0lDQjBhR2x6TG5GMVpYVmxRMkZzYVdKeVlYUnBiMjRvTUNsY2JpQWdJQ0I5WEc0Z0lDQWdhV1lnS0hSb2FYTXVjRzl5ZEhKaGFYUXBJSHRjYmlBZ0lDQWdJSFJvYVhNdWJXOTBhVzl1V0NBOUlIUm9hWE11WTJGc2FXSnlZWFJsV0NBL0lHTmhiR2xpY21GMFpXUkpibkIxZEZrZ09pQjBhR2x6TG1sdWNIVjBXVnh1SUNBZ0lDQWdkR2hwY3k1dGIzUnBiMjVaSUQwZ2RHaHBjeTVqWVd4cFluSmhkR1ZaSUQ4Z1kyRnNhV0p5WVhSbFpFbHVjSFYwV0NBNklIUm9hWE11YVc1d2RYUllYRzRnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUhSb2FYTXViVzkwYVc5dVdDQTlJSFJvYVhNdVkyRnNhV0p5WVhSbFdDQS9JR05oYkdsaWNtRjBaV1JKYm5CMWRGZ2dPaUIwYUdsekxtbHVjSFYwV0Z4dUlDQWdJQ0FnZEdocGN5NXRiM1JwYjI1WklEMGdkR2hwY3k1allXeHBZbkpoZEdWWklEOGdZMkZzYVdKeVlYUmxaRWx1Y0hWMFdTQTZJSFJvYVhNdWFXNXdkWFJaWEc0Z0lDQWdmVnh1SUNBZ0lIUm9hWE11Ylc5MGFXOXVXQ0FxUFNCMGFHbHpMbVZzWlcxbGJuUlhhV1IwYUNBcUlDaDBhR2x6TG5OallXeGhjbGdnTHlBeE1EQXBYRzRnSUNBZ2RHaHBjeTV0YjNScGIyNVpJQ285SUhSb2FYTXVaV3hsYldWdWRFaGxhV2RvZENBcUlDaDBhR2x6TG5OallXeGhjbGtnTHlBeE1EQXBYRzRnSUNBZ2FXWWdLQ0ZwYzA1aFRpaHdZWEp6WlVac2IyRjBLSFJvYVhNdWJHbHRhWFJZS1NrcElIdGNiaUFnSUNBZ0lIUm9hWE11Ylc5MGFXOXVXQ0E5SUdobGJIQmxjbk11WTJ4aGJYQW9kR2hwY3k1dGIzUnBiMjVZTENBdGRHaHBjeTVzYVcxcGRGZ3NJSFJvYVhNdWJHbHRhWFJZS1Z4dUlDQWdJSDFjYmlBZ0lDQnBaaUFvSVdselRtRk9LSEJoY25ObFJteHZZWFFvZEdocGN5NXNhVzFwZEZrcEtTa2dlMXh1SUNBZ0lDQWdkR2hwY3k1dGIzUnBiMjVaSUQwZ2FHVnNjR1Z5Y3k1amJHRnRjQ2gwYUdsekxtMXZkR2x2Ymxrc0lDMTBhR2x6TG14cGJXbDBXU3dnZEdocGN5NXNhVzFwZEZrcFhHNGdJQ0FnZlZ4dUlDQWdJSFJvYVhNdWRtVnNiMk5wZEhsWUlDczlJQ2gwYUdsekxtMXZkR2x2YmxnZ0xTQjBhR2x6TG5abGJHOWphWFI1V0NrZ0tpQjBhR2x6TG1aeWFXTjBhVzl1V0Z4dUlDQWdJSFJvYVhNdWRtVnNiMk5wZEhsWklDczlJQ2gwYUdsekxtMXZkR2x2YmxrZ0xTQjBhR2x6TG5abGJHOWphWFI1V1NrZ0tpQjBhR2x6TG1aeWFXTjBhVzl1V1Z4dUlDQWdJR1p2Y2lBb2JHVjBJR2x1WkdWNElEMGdNRHNnYVc1a1pYZ2dQQ0IwYUdsekxteGhlV1Z5Y3k1c1pXNW5kR2c3SUdsdVpHVjRLeXNwSUh0Y2JpQWdJQ0FnSUd4bGRDQnNZWGxsY2lBOUlIUm9hWE11YkdGNVpYSnpXMmx1WkdWNFhTeGNiaUFnSUNBZ0lDQWdaR1Z3ZEdoWUlEMGdkR2hwY3k1a1pYQjBhSE5ZVzJsdVpHVjRYU3hjYmlBZ0lDQWdJQ0FnWkdWd2RHaFpJRDBnZEdocGN5NWtaWEIwYUhOWlcybHVaR1Y0WFN4Y2JpQWdJQ0FnSUNBZ2VFOW1abk5sZENBOUlIUm9hWE11ZG1Wc2IyTnBkSGxZSUNvZ0tHUmxjSFJvV0NBcUlDaDBhR2x6TG1sdWRtVnlkRmdnUHlBdE1TQTZJREVwS1N4Y2JpQWdJQ0FnSUNBZ2VVOW1abk5sZENBOUlIUm9hWE11ZG1Wc2IyTnBkSGxaSUNvZ0tHUmxjSFJvV1NBcUlDaDBhR2x6TG1sdWRtVnlkRmtnUHlBdE1TQTZJREVwS1Z4dUlDQWdJQ0FnZEdocGN5NXpaWFJRYjNOcGRHbHZiaWhzWVhsbGNpd2dlRTltWm5ObGRDd2dlVTltWm5ObGRDbGNiaUFnSUNCOVhHNGdJQ0FnZEdocGN5NXlZV1lnUFNCeWNVRnVSbklvZEdocGN5NXZia0Z1YVcxaGRHbHZia1p5WVcxbEtWeHVJQ0I5WEc1Y2JpQWdjbTkwWVhSbEtHSmxkR0VzSUdkaGJXMWhLU0I3WEc0Z0lDQWdMeThnUlhoMGNtRmpkQ0JTYjNSaGRHbHZibHh1SUNBZ0lHeGxkQ0I0SUQwZ0tHSmxkR0VnZkh3Z01Da2dMeUJOUVVkSlExOU9WVTFDUlZJc0lDOHZJQ0F0T1RBZ09qb2dPVEJjYmlBZ0lDQWdJSGtnUFNBb1oyRnRiV0VnZkh3Z01Da2dMeUJOUVVkSlExOU9WVTFDUlZJZ0x5OGdMVEU0TUNBNk9pQXhPREJjYmx4dUlDQWdJQzh2SUVSbGRHVmpkQ0JQY21sbGJuUmhkR2x2YmlCRGFHRnVaMlZjYmlBZ0lDQnNaWFFnY0c5eWRISmhhWFFnUFNCMGFHbHpMbmRwYm1SdmQwaGxhV2RvZENBK0lIUm9hWE11ZDJsdVpHOTNWMmxrZEdoY2JpQWdJQ0JwWmlBb2RHaHBjeTV3YjNKMGNtRnBkQ0FoUFQwZ2NHOXlkSEpoYVhRcElIdGNiaUFnSUNBZ0lIUm9hWE11Y0c5eWRISmhhWFFnUFNCd2IzSjBjbUZwZEZ4dUlDQWdJQ0FnZEdocGN5NWpZV3hwWW5KaGRHbHZia1pzWVdjZ1BTQjBjblZsWEc0Z0lDQWdmVnh1WEc0Z0lDQWdhV1lnS0hSb2FYTXVZMkZzYVdKeVlYUnBiMjVHYkdGbktTQjdYRzRnSUNBZ0lDQjBhR2x6TG1OaGJHbGljbUYwYVc5dVJteGhaeUE5SUdaaGJITmxYRzRnSUNBZ0lDQjBhR2x6TG1OaGJHbGljbUYwYVc5dVdDQTlJSGhjYmlBZ0lDQWdJSFJvYVhNdVkyRnNhV0p5WVhScGIyNVpJRDBnZVZ4dUlDQWdJSDFjYmx4dUlDQWdJSFJvYVhNdWFXNXdkWFJZSUQwZ2VGeHVJQ0FnSUhSb2FYTXVhVzV3ZFhSWklEMGdlVnh1SUNCOVhHNWNiaUFnYjI1RVpYWnBZMlZQY21sbGJuUmhkR2x2YmlobGRtVnVkQ2tnZTF4dUlDQWdJR3hsZENCaVpYUmhJRDBnWlhabGJuUXVZbVYwWVZ4dUlDQWdJR3hsZENCbllXMXRZU0E5SUdWMlpXNTBMbWRoYlcxaFhHNGdJQ0FnYVdZZ0tHSmxkR0VnSVQwOUlHNTFiR3dnSmlZZ1oyRnRiV0VnSVQwOUlHNTFiR3dwSUh0Y2JpQWdJQ0FnSUhSb2FYTXViM0pwWlc1MFlYUnBiMjVUZEdGMGRYTWdQU0F4WEc0Z0lDQWdJQ0IwYUdsekxuSnZkR0YwWlNoaVpYUmhMQ0JuWVcxdFlTbGNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQnZia1JsZG1salpVMXZkR2x2YmlobGRtVnVkQ2tnZTF4dUlDQWdJR3hsZENCaVpYUmhJRDBnWlhabGJuUXVjbTkwWVhScGIyNVNZWFJsTG1KbGRHRmNiaUFnSUNCc1pYUWdaMkZ0YldFZ1BTQmxkbVZ1ZEM1eWIzUmhkR2x2YmxKaGRHVXVaMkZ0YldGY2JpQWdJQ0JwWmlBb1ltVjBZU0FoUFQwZ2JuVnNiQ0FtSmlCbllXMXRZU0FoUFQwZ2JuVnNiQ2tnZTF4dUlDQWdJQ0FnZEdocGN5NXRiM1JwYjI1VGRHRjBkWE1nUFNBeFhHNGdJQ0FnSUNCMGFHbHpMbkp2ZEdGMFpTaGlaWFJoTENCbllXMXRZU2xjYmlBZ0lDQjlYRzRnSUgxY2JseHVJQ0J2YmsxdmRYTmxUVzkyWlNobGRtVnVkQ2tnZTF4dUlDQWdJR3hsZENCamJHbGxiblJZSUQwZ1pYWmxiblF1WTJ4cFpXNTBXQ3hjYmlBZ0lDQWdJR05zYVdWdWRGa2dQU0JsZG1WdWRDNWpiR2xsYm5SWlhHNWNiaUFnSUNBdkx5QnlaWE5sZENCcGJuQjFkQ0IwYnlCalpXNTBaWElnYVdZZ2FHOTJaWEpQYm14NUlHbHpJSE5sZENCaGJtUWdkMlVuY21VZ2JtOTBJR2h2ZG1WeWFXNW5JSFJvWlNCbGJHVnRaVzUwWEc0Z0lDQWdhV1lnS0hSb2FYTXVhRzkyWlhKUGJteDVJQ1ltWEc0Z0lDQWdJQ0FvS0dOc2FXVnVkRmdnUENCMGFHbHpMbVZzWlcxbGJuUlFiM05wZEdsdmJsZ2dmSHdnWTJ4cFpXNTBXQ0ErSUhSb2FYTXVaV3hsYldWdWRGQnZjMmwwYVc5dVdDQXJJSFJvYVhNdVpXeGxiV1Z1ZEZkcFpIUm9LU0I4ZkZ4dUlDQWdJQ0FnSUNBb1kyeHBaVzUwV1NBOElIUm9hWE11Wld4bGJXVnVkRkJ2YzJsMGFXOXVXU0I4ZkNCamJHbGxiblJaSUQ0Z2RHaHBjeTVsYkdWdFpXNTBVRzl6YVhScGIyNVpJQ3NnZEdocGN5NWxiR1Z0Wlc1MFNHVnBaMmgwS1NrcElIdGNiaUFnSUNBZ0lIUm9hWE11YVc1d2RYUllJRDBnTUZ4dUlDQWdJQ0FnZEdocGN5NXBibkIxZEZrZ1BTQXdYRzRnSUNBZ0lDQnlaWFIxY201Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JwWmlBb2RHaHBjeTV5Wld4aGRHbDJaVWx1Y0hWMEtTQjdYRzRnSUNBZ0lDQXZMeUJEYkdsd0lHMXZkWE5sSUdOdmIzSmthVzVoZEdWeklHbHVjMmxrWlNCbGJHVnRaVzUwSUdKdmRXNWtjeTVjYmlBZ0lDQWdJR2xtSUNoMGFHbHpMbU5zYVhCU1pXeGhkR2wyWlVsdWNIVjBLU0I3WEc0Z0lDQWdJQ0FnSUdOc2FXVnVkRmdnUFNCTllYUm9MbTFoZUNoamJHbGxiblJZTENCMGFHbHpMbVZzWlcxbGJuUlFiM05wZEdsdmJsZ3BYRzRnSUNBZ0lDQWdJR05zYVdWdWRGZ2dQU0JOWVhSb0xtMXBiaWhqYkdsbGJuUllMQ0IwYUdsekxtVnNaVzFsYm5SUWIzTnBkR2x2YmxnZ0t5QjBhR2x6TG1Wc1pXMWxiblJYYVdSMGFDbGNiaUFnSUNBZ0lDQWdZMnhwWlc1MFdTQTlJRTFoZEdndWJXRjRLR05zYVdWdWRGa3NJSFJvYVhNdVpXeGxiV1Z1ZEZCdmMybDBhVzl1V1NsY2JpQWdJQ0FnSUNBZ1kyeHBaVzUwV1NBOUlFMWhkR2d1YldsdUtHTnNhV1Z1ZEZrc0lIUm9hWE11Wld4bGJXVnVkRkJ2YzJsMGFXOXVXU0FySUhSb2FYTXVaV3hsYldWdWRFaGxhV2RvZENsY2JpQWdJQ0FnSUgxY2JpQWdJQ0FnSUM4dklFTmhiR04xYkdGMFpTQnBibkIxZENCeVpXeGhkR2wyWlNCMGJ5QjBhR1VnWld4bGJXVnVkQzVjYmlBZ0lDQWdJR2xtSUNoMGFHbHpMbVZzWlcxbGJuUlNZVzVuWlZnZ0ppWWdkR2hwY3k1bGJHVnRaVzUwVW1GdVoyVlpLU0I3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVhVzV3ZFhSWUlEMGdLR05zYVdWdWRGZ2dMU0IwYUdsekxtVnNaVzFsYm5SUWIzTnBkR2x2YmxnZ0xTQjBhR2x6TG1Wc1pXMWxiblJEWlc1MFpYSllLU0F2SUhSb2FYTXVaV3hsYldWdWRGSmhibWRsV0Z4dUlDQWdJQ0FnSUNCMGFHbHpMbWx1Y0hWMFdTQTlJQ2hqYkdsbGJuUlpJQzBnZEdocGN5NWxiR1Z0Wlc1MFVHOXphWFJwYjI1WklDMGdkR2hwY3k1bGJHVnRaVzUwUTJWdWRHVnlXU2tnTHlCMGFHbHpMbVZzWlcxbGJuUlNZVzVuWlZsY2JpQWdJQ0FnSUgxY2JpQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdMeThnUTJGc1kzVnNZWFJsSUdsdWNIVjBJSEpsYkdGMGFYWmxJSFJ2SUhSb1pTQjNhVzVrYjNjdVhHNGdJQ0FnSUNCcFppQW9kR2hwY3k1M2FXNWtiM2RTWVdScGRYTllJQ1ltSUhSb2FYTXVkMmx1Wkc5M1VtRmthWFZ6V1NrZ2UxeHVJQ0FnSUNBZ0lDQjBhR2x6TG1sdWNIVjBXQ0E5SUNoamJHbGxiblJZSUMwZ2RHaHBjeTUzYVc1a2IzZERaVzUwWlhKWUtTQXZJSFJvYVhNdWQybHVaRzkzVW1Ga2FYVnpXRnh1SUNBZ0lDQWdJQ0IwYUdsekxtbHVjSFYwV1NBOUlDaGpiR2xsYm5SWklDMGdkR2hwY3k1M2FXNWtiM2REWlc1MFpYSlpLU0F2SUhSb2FYTXVkMmx1Wkc5M1VtRmthWFZ6V1Z4dUlDQWdJQ0FnZlZ4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUdSbGMzUnliM2tvS1NCN1hHNGdJQ0FnZEdocGN5NWthWE5oWW14bEtDbGNibHh1SUNBZ0lHTnNaV0Z5VkdsdFpXOTFkQ2gwYUdsekxtTmhiR2xpY21GMGFXOXVWR2x0WlhJcFhHNGdJQ0FnWTJ4bFlYSlVhVzFsYjNWMEtIUm9hWE11WkdWMFpXTjBhVzl1VkdsdFpYSXBYRzVjYmlBZ0lDQjBhR2x6TG1Wc1pXMWxiblF1Y21WdGIzWmxRWFIwY21saWRYUmxLQ2R6ZEhsc1pTY3BYRzRnSUNBZ1ptOXlJQ2hzWlhRZ2FXNWtaWGdnUFNBd095QnBibVJsZUNBOElIUm9hWE11YkdGNVpYSnpMbXhsYm1kMGFEc2dhVzVrWlhnckt5a2dlMXh1SUNBZ0lDQWdkR2hwY3k1c1lYbGxjbk5iYVc1a1pYaGRMbkpsYlc5MlpVRjBkSEpwWW5WMFpTZ25jM1I1YkdVbktWeHVJQ0FnSUgxY2JseHVJQ0FnSUdSbGJHVjBaU0IwYUdsekxtVnNaVzFsYm5SY2JpQWdJQ0JrWld4bGRHVWdkR2hwY3k1c1lYbGxjbk5jYmlBZ2ZWeHVYRzRnSUhabGNuTnBiMjRvS1NCN1hHNGdJQ0FnY21WMGRYSnVJQ2N6TGpFdU1DZGNiaUFnZlZ4dVhHNTlYRzVjYm0xdlpIVnNaUzVsZUhCdmNuUnpJRDBnVUdGeVlXeHNZWGhjYmlKZExDSm1hV3hsSWpvaWJHbGljeTl3WVhKaGJHeGhlQzVxY3lKOVxuIl0sImZpbGUiOiJsaWJzL3BhcmFsbGF4LmpzIn0=
