import { ImageType, SliceType } from '../../components/results/Results';
import { complexToPolarP, complexToPolarR, isUndefined } from '../index';

export const getAvailableSlices = async (jsonData: any, selectedImage: number): Promise<Array<SliceType>> => {
    const slices = [];
    const sliceLength = await parseImageSlices(jsonData, selectedImage);
    let index = 0;

    if (sliceLength === 0) {
        index = sliceLength + 1;
        slices.push({
            id: sliceLength,
            name: 'Slice ' + index.toString(),
        });
    } else {
        for (let i = 0; i < sliceLength; i++) {
            index = i + 1;
            slices.push({
                id: i,
                name: 'Slice ' + index.toString(),
            });
        }
    }

    return slices;
};

const parseImageSlices = (jsonData: any, imageNumber: number): Promise<number> => {
    return new Promise<number>((resolve) => {
        //there can be just one image
        let result;

        if (isUndefined(jsonData)) {
            result = 0;
        } else {
            if (jsonData.images.length > 1) {
                if (isUndefined(jsonData.images[imageNumber].slice[0])) {
                    result = 0;
                } else {
                    result = jsonData.images[imageNumber].slice.length;
                }
            } else {
                if (isUndefined(jsonData.images.slice[0])) {
                    result = 0;
                } else {
                    result = jsonData.images.slice.length;
                }
            }
        }

        resolve(result);
    });
};

export const getAvailableImages = async (jsonData: any): Promise<Array<ImageType>> => {
    return await parseImages(jsonData);
};

const parseImages = (jsonData: any): Promise<Array<ImageType>> => {
    return new Promise((resolve) => {
        let images: PromiseLike<ImageType[]> | { id: number; imageName: string }[] = [];

        if (isUndefined(jsonData)) {
            resolve(images);
        } else {
            if (jsonData.images.length > 1) {
                for (let i = 0; i < jsonData.images.length; i++) {
                    images.push({ id: i, imageName: jsonData.images[i].imageName });
                }
                resolve(images);
            } else {
                resolve([
                    {
                        id: 0,
                        imageName: jsonData.images.imageName,
                    },
                ]);
            }
        }
    });
};

export const parseImageDetails = async (jsonData: any, imageNumber: number, sliceNumber: number, imageType: string) => {
    const arrayData = await getArrayFromJsonDataImageNumberAndSlice(jsonData, imageNumber, sliceNumber);
    let finalArrayData;

    switch (imageType) {
        case 'abs':
            finalArrayData = complexToPolarR(arrayData?.Vr, arrayData?.Vi);
            break;
        case 'angle':
            finalArrayData = complexToPolarP(arrayData?.Vr, arrayData?.Vi);
            break;
        case 'real':
            finalArrayData = arrayData?.Vr;
            break;
        case 'imag':
            finalArrayData = arrayData?.Vi;
            break;
    }

    return {
        array: finalArrayData,
        h: arrayData?.w,
        w: arrayData?.h,
    };
};

const getArrayFromJsonDataImageNumberAndSlice = (
    jsonData: any,
    imageNumber: number,
    sliceNumber: number,
): Promise<any> => {
    return new Promise((resolve) => {
        //there can be just one image
        //c'e' piu' di una immagine
        let result;
        if (isUndefined(jsonData)) {
            resolve(result);
        } else {
            if (jsonData.images.length > 1) {
                //e se c'e' piu di una slice
                if (jsonData.images[imageNumber].slice.length > 1) {
                    result = jsonData.images[imageNumber].slice[sliceNumber];
                } else {
                    //c'e solo una slice
                    result = jsonData.images[imageNumber].slice;
                }
            } else {
                //c'e' solo un'immagine
                //e se c'e' piu di una slice
                if (jsonData.images.slice.length > 1) {
                    result = jsonData.images.slice[sliceNumber];
                } else {
                    //c'e solo una slice
                    result = jsonData.images.slice;
                }
            }
        }

        resolve(result);
    });
};
