type Point = {
    x: number;
    y: number;
};
type LightingAnimationPhase = "appear" | "flicker" | "hide";

type LightningProps = {
    canvasContext: CanvasRenderingContext2D,
    startPoint: Point,
    endPoint: Point,
    animationPhase: LightingAnimationPhase,
    frameDuration: number,
    frameCount: number,
    branchMaxLengthScale: number,
    maxSegmentationLevel: number,
    maximumOffset: number,
    showEndpoints?: boolean,
    strokeColor: string,
    fillColor: string,
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
    /* Lightnings current endpoint in animation (During appear animation grows)  */
    private currentEndPoint: Point;
    /* Maximum branch length in relation to lightning length */
    private branchMaxLengthScale;
    /* Recursively how many times segmentation process will happen */
    private maxSegmentationLevel: number;
    /* Phase of lightning animation */
    private phase: LightingAnimationPhase = "appear";
    private frameDuration: number;
    private frameCount: number;
    private stepX: number;
    private stepY: number;
    private maximumOffset: number;
    private showEndpoints: boolean;
    private strokeColor: string;
    private fillColor: string;

    constructor(props: LightningProps) {
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

        /* Calculate step count depending on frame count */
        this.stepX = (this.endPoint.x - this.startPoint.x) / this.frameCount;
        this.stepY = (this.endPoint.y - this.startPoint.y) / this.frameCount;
    }

    public regenerate(): void {
        requestAnimationFrame(() => {
            this.currentEndPoint = {
                x: this.currentEndPoint.x + this.stepX,
                y: this.currentEndPoint.y + this.stepY,
            };

            if (this.currentEndPoint.y > this.endPoint.y) {
                this.currentEndPoint = this.endPoint;
                return;
            }

            this.clearFrame();
            this.generateStrike(this.currentEndPoint);

            setTimeout(() => {
                this.regenerate();
            }, this.frameDuration);

            this.drawEndpoints();
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
        if (level === 1) {
            this.canvasContext.globalAlpha = 0.6
        } else {
            this.canvasContext.globalAlpha = 1 - level / 4
        }
        this.canvasContext.beginPath();
        this.canvasContext.strokeStyle = this.strokeColor;
        this.canvasContext.fillStyle = this.fillColor;
        this.canvasContext.moveTo(startPoint.x, startPoint.y);
        this.canvasContext.lineTo(endPoint.x, endPoint.y);
        this.canvasContext.closePath();
        this.canvasContext.stroke();
    }

    private clearFrame(): void {
        this.canvasContext.beginPath();
        this.canvasContext.fillStyle = this.fillColor;
        this.canvasContext.globalAlpha = 1;
        this.canvasContext.fillRect(0, 0, this.canvasContext.canvas.clientWidth, this.canvasContext.canvas.clientHeight,);
        this.canvasContext.stroke();
    }

    private generateStrike(endPoint: Point) {
        let segmentList = [];

        segmentList.push(new Segment([this.startPoint.x, this.startPoint.y], [endPoint.x, endPoint.y], 1));

        let offsetAmount = Math.min(endPoint.x / 8, this.maximumOffset); // the maximum amount to offset a lightning vertex.

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

                if (this.getRandomArbitrary(0, 2) < 1 && i % 2 == 0) {
                    const distance = Math.sqrt(
                        Math.pow(midPoint.x - segment.startPoint.x, 2) +
                        Math.pow(midPoint.y - segment.startPoint.y, 2))

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

        // Draw segments
        segmentList.forEach(s => {
            this.drawToCanvas(s.startPoint, s.endPoint, s.level);
        })
    }
}