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
        /* Phase of lightning animation */
        this.phase = "appear";
        this.canvasContext = props.canvasContext;
        this.startPoint = props.startPoint;
        this.currentEndPoint = props.startPoint;
        this.endPoint = props.endPoint;
        this.phase = props.animationPhase;
        this.frameDuration = props.frameDuration;
        this.frameCount = props.frameCount;
        this.branchMaxLengthScale = props.branchMaxLengthScale;
        this.maxSegmentationLevel = props.maxSegmentationLevel;
        this.maximumOffset = props.maximumOffset;
        this.showEndpoints = props.showEndpoints;
        this.strokeColor = props.strokeColor;
        this.fillColor = props.fillColor;
        this.clearFrameAlpha = props.clearFrameAlpha;
        /* Calculate step count depending on frame count */
        this.stepX = (this.endPoint.x - this.startPoint.x) / this.frameCount;
        this.stepY = (this.endPoint.y - this.startPoint.y) / this.frameCount;
    }
    Lightning.prototype.regenerate = function () {
        var _this = this;
        requestAnimationFrame(function () {
            _this.currentEndPoint = {
                x: _this.currentEndPoint.x + _this.stepX,
                y: _this.currentEndPoint.y + _this.stepY
            };
            if (_this.startPoint.y < _this.endPoint.y && _this.currentEndPoint.y > _this.endPoint.y && _this.currentEndPoint.x > _this.endPoint.x ||
                _this.endPoint.y < _this.startPoint.y && _this.currentEndPoint.y < _this.endPoint.y && _this.currentEndPoint.x < _this.endPoint.x) {
                _this.currentEndPoint = _this.endPoint;
                return;
            }
            _this.clearFrame();
            _this.generateStrike(_this.currentEndPoint);
            setTimeout(function () {
                _this.regenerate();
            }, _this.frameDuration);
            _this.drawEndpoints();
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
        this.canvasContext.beginPath();
        this.canvasContext.fillStyle = this.fillColor;
        this.canvasContext.globalAlpha = this.clearFrameAlpha;
        this.canvasContext.fillRect(0, 0, this.canvasContext.canvas.clientWidth, this.canvasContext.canvas.clientHeight);
        this.canvasContext.stroke();
    };
    Lightning.prototype.generateStrike = function (endPoint) {
        var _this = this;
        var segmentList = [];
        segmentList.push(new Segment([this.startPoint.x, this.startPoint.y], [endPoint.x, endPoint.y], 1));
        var minOffsetAmount = this.startPoint.x < endPoint.x
            ? (endPoint.x - this.startPoint.x) / 8
            : (this.startPoint.x - endPoint.x) / 8;
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
