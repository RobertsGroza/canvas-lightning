type Point = {
    x: number;
    y: number;
};
type LightingAnimationPhase = "appear" | "flicker" | "hide";

type LightningProps = {
    canvasContext: CanvasRenderingContext2D,
    startPoint: Point,
    endPoint: Point,
    animationPhase?: LightingAnimationPhase,
    frameDuration?: number,
    frameCountAppear?: number,
    frameCountFlicker?: number, // If frame count is not stated then it flickers infinitely
    frameCountHide?: number,
    branchMaxLengthScale?: number,
    maxSegmentationLevel?: number,
    maximumOffset?: number,
    showEndpoints?: boolean,
    strokeColor?: string,
    fillColor?: string,
    playAllPhasesConsecutively?: boolean; // If true then play all animations consecutively (False by default)
    branchConcentration?: number;
    offsetCoefficient?: number;
};

class Segment {
    public startPoint: Point;
    public endPoint: Point;
    public level: number;

    constructor(startPoint, endPoint, level) {
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

    public clone() {
        return new Segment([this.startPoint.x, this.startPoint.y], [this.endPoint.x, this.endPoint.y], this.level)
    }
}

class Lightning {
    private canvasContext: CanvasRenderingContext2D;
    private startPoint: Point;
    private endPoint: Point;
    /* Lightnings current start point & endpoint in animation (used during appear / hide animation)  */
    private currentStartPoint: Point;
    private currentEndPoint: Point;
    /* Maximum branch length in relation to lightning length */
    private branchMaxLengthScale;
    /* Recursively how many times segmentation process will happen */
    private maxSegmentationLevel: number;
    /* Phase of lightning animation */
    private phase: LightingAnimationPhase = "appear";
    private playAllPhasesConsecutively: boolean;
    private frameDuration: number;
    private frameCountAppear: number;
    private frameCountHide: number;
    private frameCountFlicker: number;
    private maximumOffset: number;
    private offsetCoefficient: number;
    private showEndpoints: boolean;
    private strokeColor: string;
    private branchConcentration: number;

    /* Frame related stuff */
    private flickerInterval: number;
    private flickerFrameNumber: number;
    private appearInterval: number;
    private appearFrameNumber: number;
    private hideInterval: number;
    private hideFrameNumber: number;

    /* Previous frame segments */
    private previousFrameSegments: Segment[];

    constructor(props: LightningProps) {
        this.canvasContext = props.canvasContext;
        this.startPoint = props.startPoint;
        this.currentStartPoint = props.startPoint;
        this.currentEndPoint = props.startPoint;
        this.endPoint = props.endPoint;
        this.playAllPhasesConsecutively = props.playAllPhasesConsecutively ?? true;
        this.phase = props.animationPhase ?? "flicker";
        this.frameDuration = props.frameDuration ?? 80;
        this.frameCountAppear = props.frameCountAppear ?? 30;
        this.frameCountHide = props.frameCountHide ?? 30;
        this.frameCountFlicker = props.frameCountFlicker;
        this.branchMaxLengthScale = props.branchMaxLengthScale ?? 0.7;
        this.maxSegmentationLevel = props.maxSegmentationLevel ?? 10;
        this.maximumOffset = props.maximumOffset ?? 100;
        this.offsetCoefficient = props.offsetCoefficient ?? 6;
        this.showEndpoints = props.showEndpoints;
        this.strokeColor = props.strokeColor ?? "#ffff00";
        this.branchConcentration = props.branchConcentration ?? 2;
        this.previousFrameSegments = [];
    }

    public playLightningAnimation(): void {
        if (this.playAllPhasesConsecutively) {
            if (!this.frameCountFlicker) {
                this.frameCountFlicker = 30;
            }
            this.phase = "appear";
            this.lightningAppearAnimation();
        } else if (this.phase === "appear") {
            this.lightningAppearAnimation();
        } else if (this.phase === "hide") {
            this.lightningHideAnimation();
        } else {
            this.lightningFlickerAnimation();
        }
    }

    public lightningAppearAnimation(): void {
        this.appearFrameNumber = 1;
        requestAnimationFrame(() => {
            this.appearInterval = setInterval(() => {
                if (this.frameCountAppear && this.appearFrameNumber === this.frameCountAppear) {
                    clearInterval(this.appearInterval);
                    if (this.playAllPhasesConsecutively) {
                        this.phase = "flicker";
                        this.lightningFlickerAnimation();
                    }
                }

                this.currentEndPoint = {
                    x: this.currentEndPoint.x + (this.endPoint.x - this.startPoint.x) / this.frameCountAppear,
                    y: this.currentEndPoint.y + (this.endPoint.y - this.startPoint.y) / this.frameCountAppear,
                };

                this.clearFrame();
                this.generateStrike(this.startPoint, this.currentEndPoint);
                this.appearFrameNumber++;

                if (this.showEndpoints) {
                    this.drawEndpoints();
                }
            }, this.frameDuration);
        })
    }

    public lightningFlickerAnimation(): void {
        this.flickerFrameNumber = 1;
        requestAnimationFrame(() => {
           this.flickerInterval = setInterval(() => {
               if (this.frameCountFlicker && this.flickerFrameNumber === this.frameCountFlicker) {
                   clearInterval(this.flickerInterval);
                   if (this.playAllPhasesConsecutively) {
                       this.phase = "hide";
                       this.lightningHideAnimation();
                   }
               }

               this.clearFrame();
               this.generateStrike(this.startPoint, this.endPoint);
               this.flickerFrameNumber++;

               if (this.showEndpoints) {
                   this.drawEndpoints();
               }
           }, this.frameDuration);
        });
    }

    public lightningHideAnimation(): void {
        this.hideFrameNumber = 1;
        requestAnimationFrame(() => {
            this.hideInterval = setInterval(() => {
                if (this.frameCountHide && this.hideFrameNumber === this.frameCountHide) {
                    clearInterval(this.hideInterval);
                }

                this.currentStartPoint = {
                    x: this.currentStartPoint.x + (this.endPoint.x - this.startPoint.x) / this.frameCountHide,
                    y: this.currentStartPoint.y + (this.endPoint.y - this.startPoint.y) / this.frameCountHide,
                };

                this.clearFrame();
                this.generateStrike(this.currentStartPoint, this.endPoint);
                this.hideFrameNumber++;

                if (this.showEndpoints) {
                    this.drawEndpoints();
                }
            }, this.frameDuration);
        })
    }

    public drawEndpoints(): void {
        this.canvasContext.beginPath();
        this.canvasContext.globalAlpha = 1;
        this.canvasContext.strokeStyle = "red";
        this.canvasContext.fillStyle = "red";
        this.canvasContext.fillRect(this.startPoint.x, this.startPoint.y, 5, 5);
        this.canvasContext.fillRect(this.endPoint.x, this.endPoint.y, 5, 5);
        this.canvasContext.stroke();
    }

    public stopFlickering(): void {
        clearInterval(this.flickerInterval);
    }

    /* Get middle point of the line */
    private getMiddlePointOfLine(startPoint: Point, endPoint: Point): Point {
        return {
            x: (startPoint.x + endPoint.x) / 2,
            y: (startPoint.y + endPoint.y) / 2,
        };
    }

    /* Offset point a little bit to get broken line */
    private rotateAroundDistance(point: Point, middlePoint: Point, angle: number, distance: number): Point {
        let t = angle + Math.atan2(point.y - middlePoint.y, point.x - middlePoint.x);

        point.x = middlePoint.x + (distance * Math.cos(t));
        point.y = middlePoint.y + (distance * Math.sin(t));

        return point;
    }

     /* Returns a random number between min (inclusive) and max (exclusive) */
    private getRandomArbitrary(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    /* Draw lightning in canvas */
    private drawToCanvas(startPoint: Point, endPoint: Point, level: number): void {

        this.canvasContext.beginPath();
        this.canvasContext.lineJoin = "round";
        this.canvasContext.lineCap = "round";
        this.canvasContext.globalCompositeOperation = "lighter";
        this.canvasContext.strokeStyle = this.strokeColor;

        this.canvasContext.moveTo(startPoint.x, startPoint.y);

        if (level === 1) {
            if (
                this.phase === "flicker" ||
                (
                    this.phase === "appear" &&
                    this.getRandomArbitrary(0, 600) < this.currentEndPoint.y - this.startPoint.y
                ) ||
                (
                    this.phase === "hide" &&
                    this.getRandomArbitrary(0, 600) < this.endPoint.y - this.currentStartPoint.y
                )
            ) {
                this.canvasContext.lineWidth = this.phase === "flicker" ? 18 : 14;
                this.canvasContext.strokeStyle = `rgba(255,255,0,${this.phase === "flicker" ? .016 : .014})`;
                this.canvasContext.moveTo(startPoint.x, startPoint.y);
                this.canvasContext.lineTo(endPoint.x, endPoint.y);
                this.canvasContext.stroke();
            }

            this.canvasContext.lineWidth = 2;
            this.canvasContext.strokeStyle = this.strokeColor;
            this.canvasContext.moveTo(startPoint.x, startPoint.y);
            this.canvasContext.lineTo(endPoint.x, endPoint.y);
            this.canvasContext.stroke();
        } else {
            this.canvasContext.lineWidth = 1;
            this.canvasContext.moveTo(startPoint.x, startPoint.y);
            this.canvasContext.lineTo(endPoint.x, endPoint.y);
            this.canvasContext.stroke();
        }

        this.canvasContext.closePath();
    }

    private clearFrame(): void {
        this.canvasContext.clearRect(0, 0, this.canvasContext.canvas.clientHeight, this.canvasContext.canvas.clientWidth);
    }

    private generateStrike(startPoint: Point, endPoint: Point) {
        let segmentList = [];

        segmentList.push(new Segment([startPoint.x, startPoint.y], [endPoint.x, endPoint.y], 1));

        const minOffsetAmount = startPoint.x < endPoint.x
            ? (endPoint.x - startPoint.x) / this.offsetCoefficient
            : (startPoint.x - endPoint.x) / this.offsetCoefficient
        let offsetAmount = Math.min(minOffsetAmount, this.maximumOffset); // the maximum amount to offset a lightning vertex.

        const maxLevel = Math.floor(Math.min(this.maxSegmentationLevel, 10 + endPoint.x / 100));

        for (let i = 0; i < maxLevel; i++) {
            let newList = [];
            for (const segmentOld of segmentList) {
                let segment = segmentOld.clone()

                // Gets the middle of the point
                let midPoint = this.getMiddlePointOfLine(segment.startPoint, segment.endPoint);

                // Offset the midpoint by a random amount along the normal.
                const angle = Math.atan2(segment.endPoint.y - segment.startPoint.y, segment.endPoint.x - segment.startPoint.x)
                const randOffset = this.getRandomArbitrary(-offsetAmount, offsetAmount);
                const x1 = Math.sin(angle) * randOffset + midPoint.x;
                const y1 = -Math.cos(angle) * randOffset + midPoint.y;
                const x2 = -Math.sin(angle) * randOffset + midPoint.x;
                const y2 = Math.cos(angle) * randOffset + midPoint.y;

                if (this.getRandomArbitrary(-1, 1) < 0) {
                    midPoint.x = x1
                    midPoint.y = y1
                } else {
                    midPoint.x = x2
                    midPoint.y = y2
                }

                // Create two new segments that span from the start point to the end point,
                // but with the new (randomly-offset) midpoint.
                newList.push(new Segment([segment.startPoint.x, segment.startPoint.y], [midPoint.x, midPoint.y], segment.level))
                newList.push(new Segment([midPoint.x, midPoint.y], [segment.endPoint.x, segment.endPoint.y], segment.level))

                if (this.getRandomArbitrary(0, 2) < 1 && i % this.branchConcentration == 0) {
                    const distance = Math.sqrt(
                        Math.pow(midPoint.x - segment.startPoint.x, 2) +
                        Math.pow(midPoint.y - segment.startPoint.y, 2)
                    )

                    let splitEnd = {
                        x: segment.endPoint.x,
                        y: segment.endPoint.y
                    }
                    let branchAngle;
                    if (this.getRandomArbitrary(0, 2) < 1) {
                        branchAngle = this.getRandomArbitrary(-0.8, -0.2)
                    } else {
                        branchAngle = this.getRandomArbitrary(0.2, 0.8)
                    }

                    splitEnd = this.rotateAroundDistance(splitEnd, midPoint, branchAngle, this.branchMaxLengthScale * distance)

                    newList.push(new Segment([midPoint.x, midPoint.y], [splitEnd.x, splitEnd.y], segment.level + 1));
                }

            }
            offsetAmount /= 2; // Each subsequent generation offsets at max half as much as the generation before.
            segmentList = newList;
        }

        // Save segments
        this.previousFrameSegments = segmentList;

        // Draw segments
        segmentList.forEach(s => {
            this.drawToCanvas(s.startPoint, s.endPoint, s.level);
        })
    }
}
