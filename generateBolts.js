var Segment = /** @class */ (function () {
    function Segment(startPoint, endPoint, level) {
        this.startPoint = {
            x: startPoint[0],
            y: startPoint[1]
        };
        this.endPoint = {
            x: endPoint[0],
            y: endPoint[1]
        };
        this.level = level;
    }
    Segment.prototype.clone = function () {
        return new Segment([this.startPoint.x, this.startPoint.y], [this.endPoint.x, this.endPoint.y], this.level);
    };
    return Segment;
}());
var Lightning = /** @class */ (function () {
    function Lightning(props) {
        var _a, _b, _c;
        /* Phase of lightning animation */
        this.phase = "appear";
        this.canvasContext = props.canvasContext;
        this.startPoint = props.startPoint;
        this.currentStartPoint = props.startPoint;
        this.currentEndPoint = props.startPoint;
        this.endPoint = props.endPoint;
        this.playAllPhasesConsecutively = (_a = props.playAllPhasesConsecutively) !== null && _a !== void 0 ? _a : false;
        this.phase = props.animationPhase;
        this.frameDuration = props.frameDuration;
        this.frameCountAppear = (_b = props.frameCountAppear) !== null && _b !== void 0 ? _b : 30;
        this.frameCountHide = (_c = props.frameCountHide) !== null && _c !== void 0 ? _c : 30;
        this.frameCountFlicker = props.frameCountFlicker;
        this.branchMaxLengthScale = props.branchMaxLengthScale;
        this.maxSegmentationLevel = props.maxSegmentationLevel;
        this.maximumOffset = props.maximumOffset;
        this.showEndpoints = props.showEndpoints;
        this.strokeColor = props.strokeColor;
        this.fillColor = props.fillColor;
        this.clearFrameAlpha = props.clearFrameAlpha;
    }
    Lightning.prototype.playLightningAnimation = function () {
        if (this.playAllPhasesConsecutively) {
            if (!this.frameCountFlicker) {
                this.frameCountFlicker = 30;
            }
            this.lightningAppearAnimation();
        }
        else if (this.phase === "appear") {
            this.lightningAppearAnimation();
        }
        else if (this.phase === "hide") {
            this.lightningHideAnimation();
        }
        else {
            this.lightningFlickerAnimation();
        }
    };
    Lightning.prototype.lightningAppearAnimation = function () {
        var _this = this;
        this.appearFrameNumber = 1;
        requestAnimationFrame(function () {
            _this.appearInterval = setInterval(function () {
                if (_this.frameCountAppear && _this.appearFrameNumber === _this.frameCountAppear) {
                    clearInterval(_this.appearInterval);
                    if (_this.playAllPhasesConsecutively) {
                        _this.lightningFlickerAnimation();
                    }
                }
                _this.currentEndPoint = {
                    x: _this.currentEndPoint.x + (_this.endPoint.x - _this.startPoint.x) / _this.frameCountAppear,
                    y: _this.currentEndPoint.y + (_this.endPoint.y - _this.startPoint.y) / _this.frameCountAppear
                };
                _this.clearFrame();
                _this.generateStrike(_this.startPoint, _this.currentEndPoint);
                _this.appearFrameNumber++;
                if (_this.showEndpoints) {
                    _this.drawEndpoints();
                }
            }, _this.frameDuration);
        });
    };
    Lightning.prototype.lightningFlickerAnimation = function () {
        var _this = this;
        this.flickerFrameNumber = 1;
        requestAnimationFrame(function () {
            _this.flickerInterval = setInterval(function () {
                if (_this.frameCountFlicker && _this.flickerFrameNumber === _this.frameCountFlicker) {
                    clearInterval(_this.flickerInterval);
                    if (_this.playAllPhasesConsecutively) {
                        _this.lightningHideAnimation();
                    }
                }
                _this.clearFrame();
                _this.generateStrike(_this.startPoint, _this.endPoint);
                _this.flickerFrameNumber++;
                if (_this.showEndpoints) {
                    _this.drawEndpoints();
                }
            }, _this.frameDuration);
        });
    };
    Lightning.prototype.lightningHideAnimation = function () {
        var _this = this;
        this.hideFrameNumber = 1;
        requestAnimationFrame(function () {
            _this.hideInterval = setInterval(function () {
                if (_this.frameCountHide && _this.hideFrameNumber === _this.frameCountHide) {
                    clearInterval(_this.hideInterval);
                }
                _this.currentStartPoint = {
                    x: _this.currentStartPoint.x + (_this.endPoint.x - _this.startPoint.x) / _this.frameCountHide,
                    y: _this.currentStartPoint.y + (_this.endPoint.y - _this.startPoint.y) / _this.frameCountHide
                };
                _this.clearFrame();
                _this.generateStrike(_this.currentStartPoint, _this.endPoint);
                _this.hideFrameNumber++;
                if (_this.showEndpoints) {
                    _this.drawEndpoints();
                }
            }, _this.frameDuration);
        });
    };
    Lightning.prototype.drawEndpoints = function () {
        this.canvasContext.beginPath();
        this.canvasContext.globalAlpha = 1;
        this.canvasContext.strokeStyle = "red";
        this.canvasContext.fillStyle = "red";
        this.canvasContext.fillRect(this.startPoint.x, this.startPoint.y, 5, 5);
        this.canvasContext.fillRect(this.endPoint.x, this.endPoint.y, 5, 5);
        this.canvasContext.stroke();
    };
    Lightning.prototype.stopFlickering = function () {
        clearInterval(this.flickerInterval);
    };
    /* Get middle point of the line */
    Lightning.prototype.getMiddlePointOfLine = function (startPoint, endPoint) {
        return {
            x: (startPoint.x + endPoint.x) / 2,
            y: (startPoint.y + endPoint.y) / 2
        };
    };
    /* Offset point a little bit to get broken line */
    Lightning.prototype.rotateAroundDistance = function (point, middlePoint, angle, distance) {
        var t = angle + Math.atan2(point.y - middlePoint.y, point.x - middlePoint.x);
        point.x = middlePoint.x + (distance * Math.cos(t));
        point.y = middlePoint.y + (distance * Math.sin(t));
        return point;
    };
    /* Returns a random number between min (inclusive) and max (exclusive) */
    Lightning.prototype.getRandomArbitrary = function (min, max) {
        return Math.random() * (max - min) + min;
    };
    /* Draw lightning in canvas */
    Lightning.prototype.drawToCanvas = function (startPoint, endPoint, level) {
        if (level === 1) {
            this.canvasContext.globalAlpha = 0.6;
        }
        else {
            this.canvasContext.globalAlpha = 1 - level / 4;
        }
        this.canvasContext.beginPath();
        this.canvasContext.strokeStyle = this.strokeColor;
        this.canvasContext.fillStyle = this.fillColor;
        this.canvasContext.moveTo(startPoint.x, startPoint.y);
        this.canvasContext.lineTo(endPoint.x, endPoint.y);
        this.canvasContext.closePath();
        this.canvasContext.stroke();
    };
    Lightning.prototype.clearFrame = function () {
        // For transparent canvas uncomment this
        // this.canvasContext.clearRect(0, 0, this.canvasContext.canvas.clientHeight, this.canvasContext.canvas.clientWidth);
        this.canvasContext.beginPath();
        this.canvasContext.fillStyle = this.fillColor;
        this.canvasContext.globalAlpha = this.clearFrameAlpha;
        this.canvasContext.fillRect(0, 0, this.canvasContext.canvas.clientWidth, this.canvasContext.canvas.clientHeight);
        this.canvasContext.stroke();
    };
    Lightning.prototype.generateStrike = function (startPoint, endPoint) {
        var _this = this;
        var segmentList = [];
        segmentList.push(new Segment([startPoint.x, startPoint.y], [endPoint.x, endPoint.y], 1));
        var minOffsetAmount = startPoint.x < endPoint.x
            ? (endPoint.x - startPoint.x) / 8
            : (startPoint.x - endPoint.x) / 8;
        var offsetAmount = Math.min(minOffsetAmount, this.maximumOffset); // the maximum amount to offset a lightning vertex.
        var maxLevel = Math.floor(Math.min(this.maxSegmentationLevel, 10 + endPoint.x / 100));
        for (var i = 0; i < maxLevel; i++) {
            var newList = [];
            for (var _i = 0, segmentList_1 = segmentList; _i < segmentList_1.length; _i++) {
                var segmentOld = segmentList_1[_i];
                var segment = segmentOld.clone();
                // Gets the middle of the point
                var midPoint = this.getMiddlePointOfLine(segment.startPoint, segment.endPoint);
                // Offset the midpoint by a random amount along the normal.
                var angle = Math.atan2(segment.endPoint.y - segment.startPoint.y, segment.endPoint.x - segment.startPoint.x);
                var randOffset = this.getRandomArbitrary(-offsetAmount, offsetAmount);
                var x1 = Math.sin(angle) * randOffset + midPoint.x;
                var y1 = -Math.cos(angle) * randOffset + midPoint.y;
                var x2 = -Math.sin(angle) * randOffset + midPoint.x;
                var y2 = Math.cos(angle) * randOffset + midPoint.y;
                if (this.getRandomArbitrary(-1, 1) < 0) {
                    midPoint.x = x1;
                    midPoint.y = y1;
                }
                else {
                    midPoint.x = x2;
                    midPoint.y = y2;
                }
                // Create two new segments that span from the start point to the end point,
                // but with the new (randomly-offset) midpoint.
                newList.push(new Segment([segment.startPoint.x, segment.startPoint.y], [midPoint.x, midPoint.y], segment.level));
                newList.push(new Segment([midPoint.x, midPoint.y], [segment.endPoint.x, segment.endPoint.y], segment.level));
                if (this.getRandomArbitrary(0, 2) < 1 && i % 2 == 0) {
                    var distance = Math.sqrt(Math.pow(midPoint.x - segment.startPoint.x, 2) +
                        Math.pow(midPoint.y - segment.startPoint.y, 2));
                    var splitEnd = {
                        x: segment.endPoint.x,
                        y: segment.endPoint.y
                    };
                    var branchAngle = void 0;
                    if (this.getRandomArbitrary(0, 2) < 1) {
                        branchAngle = this.getRandomArbitrary(-0.8, -0.2);
                    }
                    else {
                        branchAngle = this.getRandomArbitrary(0.2, 0.8);
                    }
                    splitEnd = this.rotateAroundDistance(splitEnd, midPoint, branchAngle, this.branchMaxLengthScale * distance);
                    newList.push(new Segment([midPoint.x, midPoint.y], [splitEnd.x, splitEnd.y], segment.level + 1));
                }
            }
            offsetAmount /= 2; // Each subsequent generation offsets at max half as much as the generation before.
            segmentList = newList;
        }
        // Draw segments
        segmentList.forEach(function (s) {
            _this.drawToCanvas(s.startPoint, s.endPoint, s.level);
        });
    };
    return Lightning;
}());
