import { abs, pow, floor, log10 } from 'mathjs';
import { drawBackgroundImage } from './konva';
import Konva from 'konva';
import { getUIID, linearFit2pts } from '../index';

export const drawBackgroundInCanvas = async (
    imageData: Array<number>,
    height: number,
    width: number,
    customSetting: any,
    color: string,
    stage: any,
) => {
    let canvasSizeR: any = {};
    canvasSizeR.w = stage.width() / width;
    canvasSizeR.h = stage.height() / height;

    let size = [canvasSizeR.w, canvasSizeR.h];
    let possibleScaling = size.GetMaxMin();

    const OPT = {
        scale: possibleScaling.Min,
        origin: {
            x: parseInt(String((stage.width() - width * possibleScaling.Min) / 2)),
            y: parseInt(String((stage.height() - height * possibleScaling.Min) / 2)),
        },
    };

    if (width || height) {
        // create the image url
        const imageUrl = await asyncArrayToImageURL(imageData, height, width, customSetting, color);
        // plot it into stage
        drawBackgroundImage(stage, imageUrl, { x: OPT.origin.x, y: OPT.origin.y }, OPT.scale);
    }
};

const asyncArrayToImageURL = (
    data: Array<number>,
    height: number,
    width: number,
    customSetting: any,
    color: string,
): Promise<any> => {
    // function(array,height,width,brightness{Min:0,Max:0},LUT,B)
    // create a fake canvas
    return new Promise(async (resolve) => {
        let canvas = document.createElement('canvas');
        let UIID = getUIID();
        canvas.setAttribute('id', UIID);
        canvas.width = width;
        canvas.height = height;
        // create imageData object
        // create imageData object set
        let context = canvas.getContext('2d');

        if (context) {
            let imageData = context.createImageData(canvas.width, canvas.height);
            // set our buffer as source
            const buffer = await asyncArrayToBuffer(data, customSetting, height, width, eval(color));
            // console.log("I'have a buffer");
            imageData.data.set(buffer);
            context.putImageData(imageData, 0, 0);
        }

        resolve(canvas.toDataURL());
        document.getElementById('_' + UIID)?.remove();
    });
};

const asyncArrayToBuffer = (
    data: Array<number>,
    customSetting: any,
    height: number,
    width: number,
    evalColor: any,
): Promise<any> => {
    // array, brightness evalLUT is the lut array
    // old "bufferFromArrayWithBrightnessv2;
    return new Promise((resolve) => {
        let buffer = new Uint8Array(width * height * 4);
        //maximum values to be drawn since 8bit, it ranges from 0 to 255
        const VIEWERMAX256 = {
            Min: 0,
            Max: 255,
        };

        const imageMaxAndMin = data.GetMaxMin();
        // this function give me the gray scale minimum and maximum of the image
        const xGrayScaleBoundary = getGrayScaleImageBoundaries(imageMaxAndMin, customSetting, 255.0);

        const P0 = {
            x: xGrayScaleBoundary.Min,
            y: VIEWERMAX256.Min,
        };

        const P1 = {
            x: xGrayScaleBoundary.Max,
            y: VIEWERMAX256.Max,
        };

        //fit the points
        const FIT = linearFit2pts(P0, P1);
        const m = FIT.m;
        const q = FIT.q;

        // the algorythm is repeated o that i tes tonly once if the slope is + or -
        if (FIT.m >= 0) {
            const saturationBand = {
                Min: VIEWERMAX256.Min,
                Max: VIEWERMAX256.Max,
            };

            let xGrayScale = 0;
            let V = 0;
            let V2 = 0;

            for (let i = 0; i < height; i++) {
                for (let j = 0; j < width; j++) {
                    let pos = (i * width + j) * 4; // position in buffer based on x and y
                    xGrayScale = data[pos / 4];

                    if (xGrayScale < xGrayScaleBoundary.Min || isNaN(xGrayScale)) {
                        V = saturationBand.Min;
                    }

                    if (xGrayScale > xGrayScaleBoundary.Max) {
                        V = saturationBand.Max;
                    }

                    if (xGrayScale <= xGrayScaleBoundary.Max && xGrayScale >= xGrayScaleBoundary.Min) {
                        V = Math.ceil(m * parseFloat(String(xGrayScale)) + q);
                    }

                    V2 = V * 2;

                    try {
                        buffer[pos] = 255 * evalColor[V2][1][0]; // some R value [0, 255]
                        buffer[pos + 1] = 255 * evalColor[V2][1][1]; // some G value
                        buffer[pos + 2] = 255 * evalColor[V2][1][2]; // some B value
                        buffer[pos + 3] = 255; // set alpha channel
                    } catch (e) {}
                }
            }

            resolve(buffer);
        } else {
            const saturationBand = {
                Min: VIEWERMAX256.Max,
                Max: VIEWERMAX256.Min,
            };

            let xGrayScale = 0;
            let V = 0;
            let V2 = 0;

            for (let i = 0; i < height; i++) {
                for (let j = 0; j < width; j++) {
                    const pos = (i * width + j) * 4; // position in buffer based on x and y

                    xGrayScale = data[pos / 4];

                    if (xGrayScale < xGrayScaleBoundary.Max || isNaN(xGrayScale)) {
                        V = saturationBand.Min;
                    }

                    if (xGrayScale > xGrayScaleBoundary.Min) {
                        V = saturationBand.Max;
                    }

                    if (xGrayScale <= xGrayScaleBoundary.Min && xGrayScale >= xGrayScaleBoundary.Max) {
                        V = Math.ceil(m * parseFloat(String(xGrayScale)) + q);
                    }

                    V2 = V * 2;

                    try {
                        buffer[pos] = 255 * evalColor[V2][1][0]; // some R value [0, 255]
                        buffer[pos + 1] = 255 * evalColor[V2][1][1]; // some G value
                        buffer[pos + 2] = 255 * evalColor[V2][1][2]; // some B value
                        buffer[pos + 3] = 255; // set alpha channel
                    } catch (e) {}
                }
            }

            resolve(buffer);
        }
    });
};

const getGrayScaleImageBoundaries = (realValue: any, customSetting: any, viewerRange: number) => {
    // from the original min and max of the image move a percentage of that
    const RANGE = abs(realValue.Max - realValue.Min);

    const D = {
        Max: (customSetting.Max * RANGE) / viewerRange,
        Min: (customSetting.Min * RANGE) / viewerRange,
    };

    return {
        Max: realValue.Max - D.Max,
        Min: realValue.Min + D.Min,
    };
};

export const drawLegendInCanvas = async (customSetting: any, imageData: any, color: string, stage: any) => {
    if (imageData.length > 0) {
        // destroy all children node into the current stage
        stage.destroyChildren();

        // then create layer
        const layer = new Konva.Layer({ id: 'legend_layer' });

        // add the layer to the stage
        stage.add(layer);

        //brightness, array max and min{Max:,Min:}, eval(scope.myfactory.functions.getlut()),
        const XL = getGrayScaleImageBoundaries(imageData.GetMaxMin(), customSetting, 255.0);

        const mi = XL.Min;
        const ma = XL.Max;

        const arr = await makeArr(0, 255, 256);

        let theLegend: any = {
            width: 16,
            height: 256,
        };

        theLegend.data = await createColor(theLegend.height, theLegend.width, arr);

        let O = 0;
        let begin = {
            top: 5,
            left: 5,
        };
        let T = (ma - mi) / 5;

        const DURL = await asyncArrayToImageURL(
            theLegend.data,
            theLegend.height,
            theLegend.width,
            {
                Min: 0,
                Max: 0,
            },
            color,
        );

        const o = [];
        const l1 = [];
        const LE = new Konva.Group();
        let v;

        let POWEROF = getNumberAsPowerOf(mi + T * 5, 10);

        for (let i = 5; i >= 0; i--) {
            const R = mi + T * i;
            O = (theLegend.height * (5 - i)) / 5;

            if (i === 5) {
                v = R.toExponential(2);
            } else {
                v = (R / POWEROF).toFixed(2);
            }

            o.push(
                new Konva.Text({
                    text: v.toString(),
                    fontFamily: 'Arial',
                    fontSize: 10,
                    x: begin.left + 18,
                    y: begin.top + O - 10 / 2,
                }),
            );

            LE.add(o[5 - i]);
            l1.push(makeLine([begin.left + 10, begin.top + O, begin.left + 18, begin.top + O]));
            LE.add(l1[5 - i]);
        }

        Konva.Image.fromURL(DURL, function (image: any) {
            // console.log(LE);
            // console.log(img);
            image.scale(1);
            image.setAttrs({
                x: begin.left,
                y: begin.top,
                stroke: 'black',
                strokeWidth: 0.5,
            });
            const group = new Konva.Group();
            group.add(image);
            group.add(LE);
            const textBoundingRect = group.getClientRect();
            const background = new Konva.Rect({
                top: textBoundingRect.x - 4,
                left: textBoundingRect.y - 4,
                width: textBoundingRect.width + 4,
                height: textBoundingRect.height + 4,
                // fill: 'rgba(242,242,242,0)'
                fill: 'white',
            });
            const newGroup = new Konva.Group({
                x: 0,
                y: 0,
            });
            newGroup.add(background);
            newGroup.add(group);
            layer.scale({ x: stage.height() / background.height(), y: stage.height() / background.height() });
            layer.clear();
            layer.add(newGroup);
        });
    }
};

const makeArr = (startValue: number, stopValue: number, cardinality: number) => {
    return new Promise((resolve) => {
        let arr = [];
        let currValue = startValue;
        let step = (stopValue - startValue) / (cardinality - 1);

        for (let i = 0; i < cardinality; i++) {
            arr.push(currValue + step * i);
        }

        resolve(arr);
    });
};

const createColor = (height: number, width: number, XX: any) => {
    return new Promise((resolve) => {
        let data = [];

        for (let i = height; i > 0; i--) {
            for (let j = width; j > 0; j--) {
                data.push(XX[i]);
            }
        }

        resolve(data);
    });
};

const getNumberAsPowerOf = (number: number, powerOf: number): any => {
    //  return Math.pow(powerof, Math.floor(number).toString().length - 1);
    switch (powerOf) {
        case 10:
            return pow(10, floor(log10(parseFloat(String(number)))));
    }
};

const makeLine = (coords: any) => {
    return new Konva.Line({
        points: coords,
        fill: 'black',
        stroke: 'black',
        strokeWidth: 1,
    });
};
