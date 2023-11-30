import Konva from 'konva';
import { ParsedImageDataType } from '../../../components/results/Results';

interface TransformMatrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
}

interface RectCoordinate {
    x: number;
    y: number;
}

export const drawBackgroundImage = (stage: any, imageURL: string, rectCoordinate: RectCoordinate, scale: number) => {
    const backgroundLayer = stage.findOne('#background_layer');
    backgroundLayer.destroyChildren();

    Konva.Image.fromURL(imageURL, function (image: any) {
        const ctx = backgroundLayer.getContext()._context;
        ctx.imageSmoothingEnabled = false;
        image.scale({ x: scale, y: scale });
        image.x(rectCoordinate.x);
        image.y(rectCoordinate.y);
        image.id('background_image');
        backgroundLayer.add(image);
    });
};

export const scaleStage = (stage: any, zoom: number) => {
    stage.scale({ x: zoom / 100, y: zoom / 100 });
};

export const transformStage = (stage: any, rotateMatrix: any) => {
    let startingMatrix = undefined;
    startingMatrix = stage.getTransform().m;
    let size: any = {
        w: stage.width(),
        h: stage.height(),
    };
    let goToCenterMatrix = [1, 0, 0, 1, size.w / 2, size.h / 2];
    let goBackFromCenter = [1, 0, 0, 1, -size.w / 2, -size.h / 2];
    let finalMatrix = multiplyTransformMatrices(startingMatrix, goToCenterMatrix);
    setViewportTransform(multiplyTransformMatrices(startingMatrix, goToCenterMatrix), stage);
    finalMatrix = multiplyTransformMatrices(finalMatrix, rotateMatrix);
    setViewportTransform(multiplyTransformMatrices(finalMatrix, rotateMatrix), stage);
    setViewportTransform(multiplyTransformMatrices(finalMatrix, goBackFromCenter), stage);
};

// set viewport transform to stage
export const setViewportTransform = (matrix: any, stage: any) => {
    let transformMatrix = parseTransform(matrix);
    let attrs = decompose(transformMatrix);

    stage.setAttrs({
        x: attrs.position.x,
        y: attrs.position.y,
        scaleX: attrs.scale.x,
        scaleY: attrs.scale.y,
        skewX: attrs.skew.x,
        skewY: attrs.skew.y,
        rotation: (attrs.rotation / Math.PI) * 180,
    });
};

// decompose transform matrix
export const decompose = (transformMatrix: TransformMatrix) => {
    let a = transformMatrix.a,
        b = transformMatrix.b,
        c = transformMatrix.c,
        d = transformMatrix.d,
        acos = Math.acos,
        atan = Math.atan,
        sqrt = Math.sqrt,
        pi = Math.PI,
        translate = { x: transformMatrix.e, y: transformMatrix.f },
        rotation = 0,
        scale = { x: 1, y: 1 },
        skew = { x: 0, y: 0 },
        determ = a * d - b * c; // determinant(), skip DRY here...

    if (a || b) {
        let r = sqrt(a * a + b * b);
        rotation = b > 0 ? acos(a / r) : -acos(a / r);
        scale = { x: r, y: determ / r };
        skew.x = atan((a * c + b * d) / (r * r));
    } else if (c || d) {
        let s = sqrt(c * c + d * d);
        rotation = pi * 0.5 - (d > 0 ? acos(-c / s) : -acos(c / s));
        scale = { x: determ / s, y: s };
        skew.y = atan((a * c + b * d) / (s * s));
    } else {
        // a = b = c = d = 0
        scale = { x: 0, y: 0 }; // = invalid matrix
    }

    return {
        scale: scale,
        position: translate,
        rotation: rotation,
        skew: skew,
    };
};

// parse string of transform matrix
export const parseTransform = (array: Array<any>) => {
    return {
        a: parseFloat(array[0]),
        b: parseFloat(array[1]),
        c: parseFloat(array[2]),
        d: parseFloat(array[3]),
        e: parseFloat(array[4]),
        f: parseFloat(array[5]),
    };
};

export const multiplyTransformMatrices = (matrix1: any, matrix2: any) => {
    let m0 = matrix1[0] * matrix2[0] + matrix1[2] * matrix2[1];
    let m1 = matrix1[1] * matrix2[0] + matrix1[3] * matrix2[1];
    let m2 = matrix1[0] * matrix2[2] + matrix1[2] * matrix2[3];
    let m3 = matrix1[1] * matrix2[2] + matrix1[3] * matrix2[3];
    let m4 = matrix1[0] * matrix2[4] + matrix1[2] * matrix2[5] + matrix1[4];
    let m5 = matrix1[1] * matrix2[4] + matrix1[3] * matrix2[5] + matrix1[5];
    return [m0, m1, m2, m3, m4, m5];
};

export const getMouseCoordsOnMove = (stage: any, event: any, parsedImageData: ParsedImageDataType): Promise<any> => {
    return new Promise(async (resolve) => {
        const pointer = event.currentTarget.pointerPos;
        const posX = pointer.x;
        const posY = pointer.y;

        const stageOriginAndScale = await getCanvasOriginAndScale(stage, parsedImageData.w, parsedImageData.h);

        const viewportTransform = stage.getAbsoluteTransform();
        const parsedPoint = await parseDataOnPoint(
            posX,
            posY,
            parsedImageData,
            stage,
            stageOriginAndScale.origin,
            stageOriginAndScale.scale,
            viewportTransform,
        );

        resolve(parsedPoint);
    });
};

export const getCanvasOriginAndScale = (stage: any, width: number, height: number): Promise<any> => {
    return new Promise((resolve) => {
        let canvasSizeR: any = {};
        canvasSizeR.w = stage.width() / width;
        canvasSizeR.h = stage.height() / height;

        let A = [canvasSizeR.w, canvasSizeR.h];
        let possibleScaling = A.GetMaxMin();

        resolve({
            scale: possibleScaling.Min,
            origin: {
                x: parseInt(String((stage.width() - width * possibleScaling.Min) / 2)),
                y: parseInt(String((stage.height() - height * possibleScaling.Min) / 2)),
            },
        });
    });
};

const parseDataOnPoint = (
    xt: number,
    yt: number,
    parsedImageData: ParsedImageDataType,
    stage: any,
    stageOrigin: any,
    stageScale: number,
    viewportTransform: any,
): Promise<any> => {
    return new Promise((resolve) => {
        const width = parsedImageData.w;

        let px0 = [];
        let arr = parsedImageData.array;

        let pos;
        let origin = stageOrigin;
        let F = stageScale;

        let xi, yi;

        const invertedTransform = new Konva.Transform(viewportTransform.getMatrix()).invert();
        const shapePos = invertedTransform.point({ x: xt, y: yt });

        xi = shapePos.x / F - origin.x;
        yi = shapePos.y / F - origin.y;
        pos = width * Math.round(yi) + Math.round(xi);
        px0.push(arr[pos]);

        resolve(px0);
    });
};

export const getTargetROIDataForHistogram = (
    stage: any,
    roi: any,
    parsedImageData: ParsedImageDataType,
): Promise<any> => {
    return new Promise(async (resolve) => {
        const stageOriginAndScale = await getCanvasOriginAndScale(stage, parsedImageData.w, parsedImageData.h);
        const viewportTransform = stage.getAbsoluteTransform();
        const roiData = await getROIData(
            parsedImageData,
            roi,
            stage,
            stageOriginAndScale.origin,
            stageOriginAndScale.scale,
            viewportTransform,
        );
        resolve(roiData);
    });
};

const getROIData = (
    parsedImageData: ParsedImageDataType,
    roiObject: any,
    stage: any,
    canvasOrigin: any,
    canvasScale: number,
    viewportTransform: any,
): Promise<any> => {
    //get the bounding box of the object in canvas
    return new Promise((resolve) => {
        const px0 = new Array<any>();
        let rois = new Array<any>();

        if (roiObject.getClassName() != 'Group') {
            rois.push(roiObject);
        } else {
            const children: Array<any> = roiObject.getChildren();
            children.forEach((element) => {
                rois.push(element);
            });
        }

        rois.forEach((roi) => {
            const roiBound = roi.getClientRect();

            const P: any = {};
            P.bound = roiBound;
            P.ALL = this;

            const width = parsedImageData.w;
            const height = parsedImageData.h;

            const arr = parsedImageData.array;

            let pos;

            const origin = canvasOrigin;
            const scale = canvasScale;

            let c = 0;
            let xi, yi;

            //point to canvas transformation
            const mInverse = new Konva.Transform(viewportTransform.getMatrix()).invert();

            for (let xt = roiBound.x; xt < roiBound.x + roiBound.width; xt += scale) {
                for (let yt = roiBound.y; yt < roiBound.y + roiBound.height; yt += scale) {
                    //points in the canvas
                    const ps = mInverse.point({ x: xt, y: yt });

                    if (c === 0) {
                        c++;
                    }

                    if (stage.getIntersection({ x: xt, y: yt }) === roi) {
                        xi = ps.x / scale - origin.x;
                        yi = ps.y / scale - origin.y;

                        pos = width * Math.round(yi) + Math.round(xi);
                        px0.push(arr[pos]);
                    }
                }
            }
        });

        resolve(px0);
    });
};
