import React, { useEffect, useRef, useState } from 'react';
import './Results.scss';
import { Col, notification, Row, Space } from 'antd';
import CmrCollapse from '../shared/Cmr-components/collapse/Collapse';
import CmrPanel from '../shared/Cmr-components/panel/Panel';
import CmrLabel from '../shared/Cmr-components/label/Label';
import CmrTable from '../shared/CmrTable/CmrTable';
import CmrUpload from '../shared/Cmr-components/upload/Upload';
import CmrSelect from '../shared/Cmr-components/select/Select';
import CmrOption from '../shared/Cmr-components/option/Option';
import CmrButton from '../shared/Cmr-components/button/Button';
import CmrSlider from '../shared/Cmr-components/slider/Slider';
import CmrCheckbox from '../shared/Cmr-components/checkbox/Checkbox';
import CmrColorPicker from '../shared/CmrColorPicker/CmrColorPicker';
import { saveAs } from 'file-saver';
import { RcFile } from 'antd/lib/upload/interface';
import { ColorResult, RGBColor } from 'react-color';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCamera,
    faCircle,
    faCompress,
    faDrawPolygon,
    faEye,
    faFileAlt,
    faHandPaper,
    faSave,
    faSquare,
    faTrashAlt,
    faTrashRestoreAlt,
    faVectorSquare,
} from '@fortawesome/free-solid-svg-icons';
import Konva from 'konva';
import { Group, Layer, Stage, Transformer, Rect } from 'react-konva';
import { getAvailableImages, getAvailableSlices, parseImageDetails } from '../../utils/MRI';
import { drawBackgroundInCanvas, drawLegendInCanvas } from '../../utils/canvas';
import {
    getMouseCoordsOnMove,
    getTargetROIDataForHistogram,
    scaleStage,
    setViewportTransform,
    transformStage,
} from '../../utils/canvas/konva';
import { average, median, purgenan } from '../../utils';
import Plot from 'react-plotly.js';
import * as _ from 'lodash';
import { useAppDispatch, useAppSelector } from '../../redux/hooks/hooks';
import { getPipelineStatus, PipelineDataType } from '../../redux/slices/pipeline/pipelineActionCreation';
import CmrInputNumber from '../shared/Cmr-components/input-number/InputNumber';
import CmrInput from '../shared/Cmr-components/input/Input';
import { UploadUserROIDataType, uploadUserROI, getUserROI } from '../../redux/slices/result/resultActionCreation';
import axios from 'axios';
import { re } from 'mathjs';
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const histogramTableColumns = [
    {
        headerName: 'Features',
        field: 'features'
    },
    {
        headerName: 'Values',
        field: 'values'
    },
];

const values = [
    { name: 'abs', value: 'Abs' },
    { name: 'real', value: 'Real' },
    { name: 'imag', value: 'Imaginary' },
    { name: 'angle', value: 'Phase' },
];

const colorMaps = [
    { name: 'Plasma', value: 'Plasma' },
    { name: 'Inferno', value: 'Inferno' },
    { name: 'Fake_Parula', value: 'Parula' },
    { name: 'Viridis', value: 'Viridis' },
    { name: 'hot', value: 'Hot' },
    { name: 'cool', value: 'Cool' },
    { name: 'hsv', value: 'Hsv' },
    { name: 'jet', value: 'Jet' },
    { name: 'Gray', value: 'Gray' },
    { name: 'seismic', value: 'Seismic' },
];

export interface SliceType {
    id: number;
    name: string;
}

export interface ImageType {
    id: number;
    imageName: string;
}

export interface ParsedImageDataType {
    array: Array<number>;
    h: number;
    w: number;
}

const Results = () => {
    const [imageData, setImageData] = useState();
    const [images, setImages] = useState<Array<ImageType>>();
    const [image, setImage] = useState<number>(0);
    const [slices, setSlices] = useState<Array<SliceType>>();
    const [slice, setSlice] = useState<number>(0);
    const [value, setValue] = useState<string>('abs');
    const [color, setColor] = useState<string>('Gray');
    const [min, setMin] = useState<number>(0);
    const [max, setMax] = useState<number>(0);
    const [zoom, setZoom] = useState<number>(100);
    const [parsedImageData, setParsedImageData] = useState<ParsedImageDataType>({ array: [], h: 0, w: 0 });
    const [roi, setROI] = useState<Array<any>>([]);
    const [cursor, setCursor] = useState('cursor');
    const [opacity, setOpacity] = useState<number>(50);
    const [roiColor, setROIColor] = useState<RGBColor>({
        r: 255,
        g: 0,
        b: 0,
        a: 1,
    });
    const [lastDestroyedROI, setLastDestroyedROI] = useState<any>();
    const [taskTableData, setTaskTableData] = useState<Array<any>>([]);
    const [roiTableData, setROITableData] = useState<Array<any>>([]);
    const [selectedROIName, setSelectedROIName] = useState<string>('');
    const [histogramChatData, setHistogramChatData] = useState<Array<any>>([]);
    const [histogramTableData, setHistogramTableData] = useState<Array<any>>([]);
    const [clockwiseDegree, setClockwiseDegree] = useState<number>(15);
    const [counterclockwiseDegree, setCounterclockwiseDegree] = useState<number>(15);
    const [canvasWidth, setCanvasWidth] = useState<number>(466);
    const [canvasHeight, setCanvasHeight] = useState<number>(466);

    const mainStageRef = useRef<Konva.Stage>(null);
    const legendStageRef = useRef<Konva.Stage>(null);
    let isPolygonDrawing = false;

    const dispatch = useAppDispatch();
    const { accessToken } = useAppSelector((state) => state.authenticate);
    const { pipelines } = useAppSelector((state) => state.pipeline);

    const handleBeforeUpload = async (file: File) => {
        const fileText = await file.text();
        setImageData(JSON.parse(fileText));
        return false;
    };

    useEffect(() => {
        const pipelineData: PipelineDataType = {
            accessToken: accessToken,
        };
        dispatch(getPipelineStatus(pipelineData));
        const interval = setInterval(() => {
            dispatch(getPipelineStatus(pipelineData));
        }, 10000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        let pipelineTableData: Array<any> = [];

        if (pipelines.length > 0) {
            pipelines.forEach((element, index) => {
                pipelineTableData.push({
                    key: index,
                    taskId: element.pipeline,
                    alias: element.alias,
                    submittedDate: element.createdAt,
                    status: element.status,
                    resultJson: element.results,
                });
            });
            setTaskTableData(pipelineTableData);
        }
    }, [pipelines]);

    const taskTableColumns = [
        {
            headerName: 'Task ID',
            field: 'taskId',
            flex: 1,
        },
        {
            headerName: 'Alias',
            field: 'alias',
            flex: 1,
        },
        {
            headerName: 'Date Submitted',
            field: 'submittedDate',
            flex: 1,
        },
        {
            headerName: 'Status',
            field: 'status',
            flex: 1,
        },
        {
            field: 'action',
            headerName: 'Action',
            sortable: false,
            width: 160,
            disableClickEventBubbling: true,
            renderCell: (params:any) => {
                return (
                    <div>
                        <IconButton onClick={() => {
                            console.log(params);
                            handleStartButtonClicked(params.row.resultJson)}}>
                            <PlayArrowIcon sx={{
                                color: '#4CAF50', // green color
                                '&:hover': {
                                    color: '#45a049', // darker green when hovering
                                },
                            }}/>
                        </IconButton>
                    </div>
                );
            },
        }
    ];

    const handleStartButtonClicked = async (resultJsonPath: string) => {
        const config: any = {
            method: 'GET',
        };
        const request = new Request(resultJsonPath, config);
        const res = await fetch(request);
        const fileText = await res.text();
        setImageData(JSON.parse(fileText));
    };

    useEffect(() => {
        async function getImages() {
            const images = await getAvailableImages(imageData);
            if (images.length > 0) {
                setImage(images[0].id);
            }
            setImages(images);
        }
        getImages();
    }, [imageData]);

    useEffect(() => {
        async function getSlices() {
            const slices = await getAvailableSlices(imageData, image);
            setSlices(slices);
        }
        getSlices();
    }, [images, image]);

    useEffect(() => {
        async function parseImage() {
            const parsedImage = await parseImageDetails(imageData, image, slice, value);
            registerTransformerEvents(parsedImage);
            setParsedImageData(parsedImage);
        }
        parseImage();

        return () => {
            removeTransformerEvents(mainStageRef.current);
        };
    }, [images, image, slice, value, color]);

    useEffect(() => {
        // draw background image based on the selected json file
        async function drawBackground() {
            await drawBackgroundInCanvas(
                parsedImageData.array,
                parsedImageData.h,
                parsedImageData.w,
                { FMax: '255', Max: max, Min: min, lut: color },
                color,
                mainStageRef.current,
            );
        }
        drawBackground();

        // draw legend based on the selected json file
        async function drawLegend() {
            await drawLegendInCanvas(
                { FMax: '255', Max: max, Min: min, lut: color },
                parsedImageData.array,
                color,
                legendStageRef.current,
            );
        }
        drawLegend();
    }, [parsedImageData, min, max]);

    useEffect(() => {
        scaleStage(mainStageRef.current, zoom);
    }, [zoom]);

    const registerTransformerEvents = (parsedImageData: ParsedImageDataType) => {
        if (parsedImageData.array.length > 0) {
            const mainStage: any = mainStageRef.current;
            const roiLayer = mainStage.findOne('#roi_layer');
            const tr = roiLayer.findOne('#roi_transformer');
            const roiGroup = roiLayer.findOne('#roi_group');
            const selectionRectangle = roiLayer.findOne('#selection_rectangle');
            let x1: number, y1: number, x2: number, y2: number;

            mainStage.on('mousedown touchstart', (e: any) => {
                // do nothing if we mousedown on any shape
                if (
                    (e.target !== mainStage && e.target.id() !== 'background_image') ||
                    isPolygonDrawing ||
                    checkCursorInROIGroup(mainStage, roiGroup)
                )
                    return;

                e.evt.preventDefault();
                x1 = mainStage.getRelativePointerPosition().x;
                y1 = mainStage.getRelativePointerPosition().y;
                x2 = mainStage.getRelativePointerPosition().x;
                y2 = mainStage.getRelativePointerPosition().y;

                selectionRectangle.visible(true);
                selectionRectangle.width(0);
                selectionRectangle.height(0);
            });

            mainStage.on('mousemove touchmove', (e: any) => {
                // do nothing if we didn't start selection
                if (!selectionRectangle.visible() || isPolygonDrawing) return;

                e.evt.preventDefault();
                x2 = mainStage.getRelativePointerPosition().x;
                y2 = mainStage.getRelativePointerPosition().y;

                selectionRectangle.setAttrs({
                    x: Math.min(x1, x2),
                    y: Math.min(y1, y2),
                    width: Math.abs(x2 - x1),
                    height: Math.abs(y2 - y1),
                });
            });

            mainStage.on('mouseup touchend', (e: any) => {
                // do nothing if we didn't start selection
                if (!selectionRectangle.visible() || isPolygonDrawing) return;

                e.evt.preventDefault();
                // update visibility in timeout, so we can check it in click event
                setTimeout(() => {
                    selectionRectangle.visible(false);
                });

                let shapes = roiLayer.getChildren(function (node: any) {
                    return (
                        node.id() !== 'selection_rectangle' &&
                        node.id() !== 'roi_transformer' &&
                        node.id() !== 'roi_group'
                    );
                });

                if (roiGroup.hasChildren()) {
                    roiGroup.getChildren((node: any) => {
                        shapes.push(node);
                    });
                }

                const box = selectionRectangle.getClientRect();
                const selected = shapes.filter((shape: any) => Konva.Util.haveIntersection(box, shape.getClientRect()));
                tr.nodes(selected);
            });

            // clicks should select/deselect shapes
            mainStage.on('click tap', async (e: any) => {
                // if we are selecting with rect, do nothing
                if (selectionRectangle.visible() || isPolygonDrawing) return;

                // if click on empty area - remove all selections
                if (
                    e.target === mainStage ||
                    (e.target.id() === 'background_image' && !checkCursorInROIGroup(mainStage, roiGroup)) ||
                    isPolygonDrawing
                ) {
                    tr.nodes([]);
                    return;
                }

                // do we pressed shift or ctrl?
                const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
                let isSelected = false;

                if (tr.nodes().indexOf(roiGroup) >= 0) {
                    if (roiGroup.findOne(`#${e.target.id()}`)) isSelected = true;
                } else {
                    isSelected = tr.nodes().indexOf(e.target) >= 0;
                }

                if (!metaPressed && !isSelected) {
                    if (e.target.id() !== 'background_image' && !isPolygonDrawing) {
                        if (roiGroup.findOne(`#${e.target.id()}`)) {
                            tr.nodes(roiGroup.getChildren());
                            await plotHistogram(roiGroup, parsedImageData);
                        } else {
                            // if no key pressed and the node is not selected
                            // select just one
                            tr.nodes([e.target]);
                            await plotHistogram(e.target, parsedImageData);
                        }
                    } else if (
                        (e.target.id() === 'background_image' && checkCursorInROIGroup(mainStage, roiGroup)) ||
                        !isPolygonDrawing
                    ) {
                        tr.nodes(roiGroup.getChildren());
                    }
                } else if (metaPressed && isSelected) {
                    if (e.target.id() !== 'background_image' && !isPolygonDrawing) {
                        // if we pressed keys and node was selected
                        // we need to remove it from selection:
                        const nodes = tr.nodes().slice(); // use slice to have new copy of array

                        if (roiGroup.findOne(`#${e.target.id()}`)) {
                            roiGroup.getChildren((node: any) => {
                                nodes.splice(nodes.indexOf(node), 1);
                            });
                        } else {
                            // remove node from array
                            nodes.splice(nodes.indexOf(e.target), 1);
                        }
                        tr.nodes(nodes);
                    } else if (
                        (e.target.id() === 'background_image' && checkCursorInROIGroup(mainStage, roiGroup)) ||
                        !isPolygonDrawing
                    ) {
                        const nodes = tr.nodes().slice(); // use slice to have new copy of array
                        roiGroup.getChildren((node: any) => {
                            nodes.splice(nodes.indexOf(node), 1);
                        });
                        tr.nodes(nodes);
                    }
                } else if (metaPressed && !isSelected) {
                    if (e.target.id() !== 'background_image' && !isPolygonDrawing) {
                        if (roiGroup.findOne(`#${e.target.id()}`)) {
                            // add the group into selection
                            const nodes = tr.nodes().slice(); // use slice to have new copy of array
                            roiGroup.getChildren((node: any) => {
                                nodes().concat(node);
                            });
                            tr.nodes(nodes);
                        } else {
                            // add the node into selection
                            const nodes = tr.nodes().concat([e.target]);
                            tr.nodes(nodes);
                        }
                    } else if (
                        (e.target.id() === 'background_image' && checkCursorInROIGroup(mainStage, roiGroup)) ||
                        !isPolygonDrawing
                    ) {
                        const nodes = tr.nodes().slice(); // use slice to have new copy of array
                        roiGroup.getChildren((node: any) => {
                            nodes().concat(node);
                        });
                        tr.nodes(nodes);
                    }
                }
            });

            tr.on('transformend', async (e: any) => {
                await plotHistogram(e.target, parsedImageData);
            });
        }
    };

    const checkCursorInROIGroup = (mainStage: any, roiGroup: any) => {
        const x = mainStage.getRelativePointerPosition().x;
        const y = mainStage.getRelativePointerPosition().y;
        const groupRect = roiGroup.getClientRect();

        if (roiGroup.hasChildren()) {
            return (
                groupRect.x < x &&
                x < groupRect.x + groupRect.width &&
                groupRect.y < y &&
                y < groupRect.y + groupRect.height
            );
        }

        return false;
    };

    const handleImageChanged = (imageNumber: number) => {
        setImage(imageNumber);
    };

    const handleSliceChanged = (sliceNumber: number) => {
        setSlice(sliceNumber);
    };

    const handleValueChanged = (value: string) => {
        setValue(value);
    };

    const handleColorChanged = (color: string) => {
        setColor(color);
    };

    const handleRotateCounterclockwise = () => {
        let radian = counterclockwiseDegree * (Math.PI / 180);
        let rotateMatrix = [Math.cos(radian), -Math.sin(radian), Math.sin(radian), Math.cos(radian), 0, 0];
        transformStage(mainStageRef.current, rotateMatrix);
    };

    const handleRotateClockwise = () => {
        let radian = clockwiseDegree * (Math.PI / 180);
        let rotateMatrix = [Math.cos(radian), Math.sin(radian), -Math.sin(radian), Math.cos(radian), 0, 0];
        transformStage(mainStageRef.current, rotateMatrix);
    };

    const handleFlipUpDown = () => {
        const flipMatrix = [1, 0, 0, -1, 0, 0];
        transformStage(mainStageRef.current, flipMatrix);
    };

    const handleFlipLeftRight = () => {
        const flipMatrix = [-1, 0, 0, 1, 0, 0];
        transformStage(mainStageRef.current, flipMatrix);
    };

    const handleZoomChanged = (zoom: number) => {
        setZoom(zoom);
    };

    const handleMaxChanged = (max: number) => {
        setMax(max);
    };

    const handleMinChanged = (min: number) => {
        setMin(min);
    };

    const handleMoveCanvas = () => {
        mainStageRef.current?.draggable(true);
        mainStageRef.current?.on('mouseup touchend', function (e: any) {
            mainStageRef.current?.draggable(false);
        });
    };

    const handleResetCanvas = () => {
        let identityMatrix = [1, 0, 0, 1, 0, 0];
        setZoom(100);
        setViewportTransform(identityMatrix, mainStageRef.current);
    };

    const handleSaveCanvas = () => {
        const mainCanvasContainer: any = mainStageRef.current?.container();
        const mainCanvas = mainCanvasContainer.firstChild.firstChild;
        const legendCanvasContainer: any = legendStageRef.current?.container();
        const legendCanvas = legendCanvasContainer.firstChild.firstChild;

        let imageName: string | null = 'TESS Shot';
        imageName = prompt('Specify a name for the image that will be saved', imageName);

        if (imageName != null) {
            const canvas = document.createElement('canvas');

            canvas.width = mainCanvas.width + parseInt(String(mainCanvas.width * 0.25));
            canvas.height = mainCanvas.height + 10;

            const contextScreenshot: any = canvas.getContext('2d');

            contextScreenshot.fillStyle = 'black';
            contextScreenshot.fillRect(0, 0, canvas.width, canvas.height);

            contextScreenshot.drawImage(mainCanvas, 0, 0);
            contextScreenshot.drawImage(legendCanvas, mainCanvas.width, 0);

            contextScreenshot.font = '10px Arial';
            contextScreenshot.fillStyle = 'white';
            contextScreenshot.fillText('Cloud MR www.cloudmrhub.com ', 0, mainCanvas.height + 10);

            canvas.toBlob(function (blob: any) {
                saveAs(blob, imageName + '.png');
            });
        }
    };

    const handleAddNewRect = async () => {
        const rectROI = await addNewROI(`ROI_${roi.length + 1}`, 'rect', opacity, mainStageRef.current);
        setROI([...roi, rectROI]);
        setROITableData([
            ...roiTableData,
            {
                key: roi.length + 1,
                roi: {
                    index: roi.length + 1,
                    name: `ROI_${roi.length + 1}`,
                    type: 'rect',
                    color: `rgba(${roiColor.r}, ${roiColor.g}, ${roiColor.b}, ${roiColor.a})`,
                },
            },
        ]);
    };

    const handleAddNewCircle = async () => {
        const circleROI = await addNewROI(`ROI_${roi.length + 1}`, 'circle', opacity, mainStageRef.current);
        setROI([...roi, circleROI]);
        setROITableData([
            ...roiTableData,
            {
                key: roi.length + 1,
                roi: {
                    index: roi.length + 1,
                    name: `ROI_${roi.length + 1}`,
                    type: 'circle',
                    color: `rgba(${roiColor.r}, ${roiColor.g}, ${roiColor.b}, ${roiColor.a})`,
                },
            },
        ]);
    };

    const handleAddNewPolygon = async () => {
        const polygonROI = await addNewROI(`ROI_${roi.length + 1}`, 'polygon', opacity, mainStageRef.current);
        setROI([...roi, polygonROI]);
        setROITableData([
            ...roiTableData,
            {
                key: roi.length + 1,
                roi: {
                    index: roi.length + 1,
                    name: `ROI_${roi.length + 1}`,
                    type: 'polygon',
                    color: `rgba(${roiColor.r}, ${roiColor.g}, ${roiColor.b}, ${roiColor.a})`,
                },
            },
        ]);
    };

    const addNewROI = (id: string, type: string, opacity: number, mainStage: any): Promise<any> => {
        let conf = {
            h: mainStage.height(),
            w: mainStage.width(),
            visible: true,
            x: mainStage.width() / 2,
            y: mainStage.height() / 2,
            opacity: opacity / 100,
        };

        let addedROI: any;

        return new Promise(async (resolve) => {
            switch (type) {
                case 'rect':
                    addedROI = await addNewRect(id, conf);
                    break;
                case 'circle':
                    addedROI = await addNewCircle(id, conf);
                    break;
                case 'polygon':
                    addedROI = await addNewPolygon(id, opacity / 100, mainStage);
                    break;
            }

            mainStage.findOne('#roi_layer').add(addedROI);
            resolve(addedROI);
        });
    };

    const addNewRect = (id: string, conf: any): Promise<any> => {
        return new Promise<any>((resolve) => {
            const rect = new Konva.Rect({
                id: id,
                x: conf.x,
                y: conf.y,
                fill: `rgba(${roiColor.r}, ${roiColor.g}, ${roiColor.b}, ${roiColor.a})`,
                width: 30,
                opacity: conf.opacity,
                height: 30,
                visible: conf.visible,
                draggable: true,
            });

            resolve(rect);
        });
    };

    const addNewCircle = (id: string, conf: any): Promise<any> => {
        return new Promise<any>((resolve) => {
            const circle = new Konva.Circle({
                id: id,
                x: conf.x,
                y: conf.y,
                fill: `rgba(${roiColor.r}, ${roiColor.g}, ${roiColor.b}, ${roiColor.a})`,
                radius: 10,
                opacity: conf.opacity,
                visible: conf.visible,
                draggable: true,
            });

            resolve(circle);
        });
    };

    const addNewPolygon = (id: string, opacity: number, mainStage: any): Promise<any> => {
        return new Promise<any>((resolve) => {
            let polygonPoints: Array<any> = [];
            let lines: Array<any> = [];
            isPolygonDrawing = true;
            removeTransformerEvents(mainStage);

            mainStage.on('dblclick', async function (evt: any) {
                if (isPolygonDrawing) await finalize();
                else isPolygonDrawing = false;
            });

            mainStage.on('mousedown touchstart', function (evt: any) {
                if (isPolygonDrawing) {
                    const mousePos = mainStage.getRelativePointerPosition();
                    let _x = mousePos.x;
                    let _y = mousePos.y;

                    const line = new Konva.Line({
                        id: 'polygon_line',
                        points: [_x, _y, _x, _y],
                        strokeWidth: 1,
                        stroke: `rgba(${roiColor.r}, ${roiColor.g}, ${roiColor.b}, ${roiColor.a})`,
                    });

                    polygonPoints.push(_x, _y);
                    lines.push(line);

                    mainStage.findOne('#roi_layer').add(line);
                }
            });

            mainStage.on('mousemove touchmove', function (evt: any) {
                if (lines.length && isPolygonDrawing) {
                    const mousePos = mainStage.getRelativePointerPosition();
                    let points = lines[lines.length - 1].points();
                    points[2] = mousePos.x;
                    points[3] = mousePos.y;
                    lines[lines.length - 1].points(points);
                }
            });

            function drawPolygon(id: string) {
                return new Konva.Line({
                    id: id,
                    points: polygonPoints,
                    fill: `rgba(${roiColor.r}, ${roiColor.g}, ${roiColor.b}, ${roiColor.a})`,
                    opacity: opacity,
                    visible: true,
                    closed: isPolygonDrawing,
                    draggable: true,
                });
            }

            async function finalize() {
                resolve(drawPolygon(id));

                isPolygonDrawing = false;
                const lines = mainStage.findOne('#roi_layer').find('#polygon_line');

                lines.forEach(function (line: any) {
                    line.destroy();
                });

                mainStage.off('mousedown touchstart');
                mainStage.off('mousemove touchmove');
                mainStage.off('mouseup touchend');
                mainStage.off('dblclick dbltap');
                registerTransformerEvents(parsedImageData);
            }
        });
    };

    const removeTransformerEvents = (mainStage: any) => {
        mainStage?.off('mousedown touchstart');
        mainStage?.off('mousemove touchmove');
        mainStage?.off('mouseup touchend');
        mainStage?.off('click tap');
    };

    const handleCursorChanged = (event: any) => {
        const checked = event.target.checked;

        if (checked) {
            mainStageRef.current?.on('mousemove', async function (evt: any) {
                const parsedPoint = await getMouseCoordsOnMove(mainStageRef.current, evt, parsedImageData);

                if (parsedPoint[0])
                    setCursor(parsedPoint[0].toFixed(3) + ' (' + parsedPoint[0].toExponential(3) + ') ');
            });
        } else {
            setCursor('cursor');
            mainStageRef.current?.off('mousemove');
            registerTransformerEvents(parsedImageData);
        }
    };

    const handleOpacityChanged = (opacity: number) => {
        const transformer = mainStageRef.current
            ?.findOne<Konva.Layer>('#roi_layer')
            .findOne<Konva.Transformer>('#roi_transformer');
        const nodes = transformer?.nodes();
        nodes?.map((node: any) => node.opacity(opacity / 100));
        setOpacity(opacity);
    };

    const handleROIColorChange = (color: ColorResult) => {
        const transformer = mainStageRef.current
            ?.findOne<Konva.Layer>('#roi_layer')
            .findOne<Konva.Transformer>('#roi_transformer');
        const nodes = transformer?.nodes();
        nodes?.map((node: any) => {
            node.setAttr('fill', `rgba(${roiColor.r}, ${roiColor.g}, ${roiColor.b}, ${roiColor.a})`);
            let newArr = [...roiTableData];
            const roiIndex = newArr.findIndex((element) => element.roi.name === node.id());
            if (roiIndex > -1) {
                newArr[roiIndex].roi.color = `rgba(${roiColor.r}, ${roiColor.g}, ${roiColor.b}, ${roiColor.a})`;
                setROITableData(newArr);
            }
        });
        setROIColor(color.rgb);
    };

    const roiTableColumns = [
        {
            headerName: 'ROI',
            field: 'roi',
            render: (roi: { index: number; name: string; type: string; color: string }) => (
                <div className="roi-information">
                    {renderROIThumbnail(roi.type, roi.color)}
                    <CmrInput
                        bordered={false}
                        value={roi.name}
                        onFocus={(e) => {
                            e.target.style.border = '1px solid black';
                            setSelectedROIName(roi.name);
                        }}
                        onBlur={(e) => {
                            e.target.style.border = 'none';
                            const filteredROI = roiTableData.filter((element) => element.roi.name === e.target.value);
                            if (filteredROI.length > 1) {
                                let newArr = [...roiTableData];
                                newArr[roi.index - 1].roi.name = selectedROIName;
                                setROITableData(newArr);
                                notification['warning']({
                                    message: 'Results Warning',
                                    description:
                                        'ROI name cannot be reused. It should be unique. Please retry to update with unique name',
                                });
                            } else {
                                if (e.target.value !== selectedROIName) {
                                    const selectedROIShape: any = mainStageRef.current
                                        ?.findOne<Konva.Layer>('#roi_layer')
                                        .findOne<Konva.Node>(`#${selectedROIName}`);
                                    selectedROIShape.id(e.target.value);
                                    notification['success']({
                                        message: 'Results Information',
                                        description: 'ROI name has been changed successfully.',
                                    });
                                }
                            }
                        }}
                        onChange={(e) => {
                            e.preventDefault();
                            let newArr = [...roiTableData];
                            const roiIndex = newArr.findIndex((element) => element.key === roi.index);
                            if (roiIndex > -1) {
                                newArr[roiIndex].roi.name = e.target.value;
                                setROITableData(newArr);
                            }
                        }}
                    />
                </div>
            ),
        },
        {
            headerName: 'Actions',
            field: 'actions',
            render: (text: string, record: any, index: number) => (
                <div className="action-buttons">
                    <CmrButton
                        size={'small'}
                        onClick={(e) => {
                            handleRemoveROI(record.roi.name);
                        }}
                    >
                        <FontAwesomeIcon icon={faTrashAlt} />
                    </CmrButton>
                    <CmrButton
                        size={'small'}
                        onClick={(e) => {
                            handleBackupROI(record.roi.name);
                        }}
                    >
                        <FontAwesomeIcon icon={faSave} />
                    </CmrButton>
                    <CmrButton
                        size={'small'}
                        onClick={(e) => {
                            handleActivateROI(record.roi.name);
                        }}
                    >
                        <FontAwesomeIcon icon={faVectorSquare} />
                    </CmrButton>
                </div>
            ),
        },
        {
            headerName: 'Show',
            field: 'show',
            render: (text: string, record: any, index: number) => (
                <div className="show-checkbox">
                    <CmrCheckbox
                        defaultChecked={true}
                        onChange={(e) => handleVisibleROI(e.target.checked, record.roi.name)}
                    />
                </div>
            ),
        },
        {
            headerName: 'Group',
            field: 'group',
            render: (text: string, record: any, index: number) => (
                <div className="group-checkbox">
                    <CmrCheckbox onChange={(e) => handleGroupROI(e.target.checked, record.roi.name)} />
                </div>
            ),
        },
    ];

    const renderROIThumbnail = (type: string, color: string) => {
        switch (type) {
            case 'rect':
                return <FontAwesomeIcon icon={faSquare} size="sm" color={color} />;
                break;
            case 'circle':
                return <FontAwesomeIcon icon={faCircle} size="sm" color={color} />;
                break;
            case 'polygon':
                return <FontAwesomeIcon icon={faDrawPolygon} size="sm" color={color} />;
                break;
        }
    };

    const handleRemoveROI = (roiId: string) => {
        const selectedROI = mainStageRef.current?.findOne<Konva.Layer>('#roi_layer').findOne<Konva.Shape>(`#${roiId}`);
        selectedROI?.destroy();
        setROITableData(roiTableData.filter((item) => item.roi.name !== roiId));
        setLastDestroyedROI(selectedROI?.toJSON());
    };

    const handleBackupROI = (roiId: string) => {
        const selectedROI = mainStageRef.current?.findOne<Konva.Layer>('#roi_layer').findOne<Konva.Shape>(`#${roiId}`);
        const selectedROIJsonString = selectedROI?.toJSON();
        if (selectedROIJsonString) {
            const blob = new Blob([selectedROIJsonString], {
                type: 'application/json',
            });
            const selectedROIData: UploadUserROIDataType = {
                accessToken: accessToken,
                roiFile: blob,
                pipelineId: 'c713580a-a2ea-395e-942f-ebea1c1ba01e',
                roiType: 'konva',
                applicationName: 'TESS',
            };
            dispatch(uploadUserROI(selectedROIData));
        }
    };

    const handleActivateROI = (roiId: string) => {
        const selectedROI: any = mainStageRef.current
            ?.findOne<Konva.Layer>('#roi_layer')
            .findOne<Konva.Node>(`#${roiId}`);
        const transformer = mainStageRef.current
            ?.findOne<Konva.Layer>('#roi_layer')
            .findOne<Konva.Transformer>('#roi_transformer');
        transformer?.nodes([selectedROI]);
    };

    const handleVisibleROI = (checked: boolean, roiId: string) => {
        const selectedROI: any = mainStageRef.current
            ?.findOne<Konva.Layer>('#roi_layer')
            .findOne<Konva.Node>(`#${roiId}`);
        if (checked) {
            selectedROI.show();
        } else {
            selectedROI.hide();
        }
    };

    const handleGroupROI = (checked: boolean, roiId: string) => {
        const roiLayer: any = mainStageRef.current?.findOne<Konva.Layer>('#roi_layer');
        const roiGroup: any = mainStageRef.current
            ?.findOne<Konva.Layer>('#roi_layer')
            .findOne<Konva.Transformer>('#roi_group');
        const selectedROI: any = mainStageRef.current
            ?.findOne<Konva.Layer>('#roi_layer')
            .findOne<Konva.Node>(`#${roiId}`);
        if (checked) {
            roiGroup.add(selectedROI);
        } else {
            selectedROI.moveTo(roiLayer);
        }
    };

    const handleUndoROI = () => {
        const roiLayer: any = mainStageRef.current?.findOne<Konva.Layer>('#roi_layer');
        if (lastDestroyedROI) {
            const parsedLastDestroyedROI = JSON.parse(lastDestroyedROI);
            switch (parsedLastDestroyedROI.className) {
                case 'Circle':
                    const circle = new Konva.Circle(parsedLastDestroyedROI);
                    roiLayer.add(circle);
                    setROITableData([
                        ...roiTableData,
                        {
                            key: parsedLastDestroyedROI.attrs.id.split('_').pop(),
                            roi: {
                                index: parsedLastDestroyedROI.attrs.id.split('_').pop(),
                                name: parsedLastDestroyedROI.attrs.id,
                                type: 'circle',
                                color: parsedLastDestroyedROI.attrs.fill,
                            },
                        },
                    ]);
                    setLastDestroyedROI(null);
                    break;
                case 'Rect':
                    const rect = new Konva.Rect(parsedLastDestroyedROI);
                    roiLayer.add(rect);
                    setROITableData([
                        ...roiTableData,
                        {
                            key: parsedLastDestroyedROI.attrs.id.split('_').pop(),
                            roi: {
                                index: parsedLastDestroyedROI.attrs.id.split('_').pop(),
                                name: parsedLastDestroyedROI.attrs.id,
                                type: 'rect',
                                color: parsedLastDestroyedROI.attrs.fill,
                            },
                        },
                    ]);
                    setLastDestroyedROI(null);
                    break;
                case 'Line':
                    const line = new Konva.Line(parsedLastDestroyedROI);
                    roiLayer.add(line);
                    setROITableData([
                        ...roiTableData,
                        {
                            key: parsedLastDestroyedROI.attrs.id.split('_').pop(),
                            roi: {
                                index: parsedLastDestroyedROI.attrs.id.split('_').pop(),
                                name: parsedLastDestroyedROI.attrs.id,
                                type: 'polygon',
                                color: parsedLastDestroyedROI.attrs.fill,
                            },
                        },
                    ]);
                    setLastDestroyedROI(null);
                    break;
            }
        }
    };

    const handleBackupAllROIs = () => {};

    const plotHistogram = async (selectedROI: any, parsedImageData: ParsedImageDataType) => {
        const targetROIData = await getTargetROIDataForHistogram(mainStageRef.current, selectedROI, parsedImageData);
        setHistogramChatData([{ x: targetROIData, type: 'histogram', name: 'pixel values' }]);
        setHistogramTableData([
            { key: 1, features: 'Pixel Count', values: purgenan(targetROIData).length },
            { key: 2, features: 'Mean', values: average(purgenan(targetROIData)).toFixed(2) },
            { key: 3, features: 'Median', values: median(purgenan(targetROIData)).toFixed(2) },
            { key: 4, features: 'Max', values: Math.max.apply(Math, purgenan(targetROIData)).toFixed(2) },
            { key: 5, features: 'Min', values: Math.min.apply(Math, purgenan(targetROIData)).toFixed(2) },
        ]);
    };

    return (
        <CmrCollapse accordion={false} defaultActiveKey={[0, 1]} expandIconPosition="right">
            <CmrPanel key="0" header="Job Queue">
                <Space direction="vertical">
                    <Row>
                        <Col span={24}>
                            <CmrTable idAlias='key' dataSource={[...taskTableData]} columns={taskTableColumns} />
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <CmrUpload maxCount={1} beforeUpload={handleBeforeUpload}  createPayload={async ()=>undefined} onUploaded={()=>{}}/>
                        </Col>
                    </Row>
                </Space>
            </CmrPanel>
            <CmrPanel key="1" header="Plot">
                <Row>
                    <Col span={10}>
                        <Space direction="vertical">
                            <Row>
                                <Col span={12}>
                                    <Row>
                                        <CmrLabel>Canvas Width</CmrLabel>
                                        <CmrInputNumber
                                            defaultValue={canvasWidth}
                                            onChange={(value: any) => setCanvasWidth(value)}
                                            max={466}
                                            min={233}
                                        />
                                    </Row>
                                </Col>
                                <Col span={12}>
                                    <Row>
                                        <CmrLabel>Canvas Height</CmrLabel>
                                        <CmrInputNumber
                                            defaultValue={canvasHeight}
                                            onChange={(value: any) => setCanvasHeight(value)}
                                            max={466}
                                            min={233}
                                        />
                                    </Row>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={12}>
                                    <Row>
                                        <CmrLabel>Data</CmrLabel>
                                        <CmrSelect
                                            value={images && images.length > 0 ? image : undefined}
                                            onChange={handleImageChanged}
                                        >
                                            {images?.map((value, key) => {
                                                return (
                                                    <CmrOption value={value.id} key={key}>
                                                        {value.imageName}
                                                    </CmrOption>
                                                );
                                            })}
                                        </CmrSelect>
                                    </Row>
                                </Col>
                                <Col span={12}>
                                    <Row>
                                        <CmrLabel>Value</CmrLabel>
                                        <CmrSelect value={value} onChange={handleValueChanged}>
                                            {values.map((item, key) => {
                                                return (
                                                    <CmrOption value={item.name} key={key}>
                                                        {_.capitalize(item.value)}
                                                    </CmrOption>
                                                );
                                            })}
                                        </CmrSelect>
                                    </Row>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={12}>
                                    <Row>
                                        <CmrLabel>Slice</CmrLabel>
                                        <CmrSelect value={slice} onChange={handleSliceChanged}>
                                            {slices?.map((value, key) => {
                                                return (
                                                    <CmrOption value={value.id} key={key}>
                                                        {value.name}
                                                    </CmrOption>
                                                );
                                            })}
                                        </CmrSelect>
                                    </Row>
                                </Col>
                                <Col span={12}>
                                    <Row>
                                        <CmrLabel>Color Map</CmrLabel>
                                        <CmrSelect value={color} onChange={handleColorChanged}>
                                            {colorMaps.map((item, key) => {
                                                return (
                                                    <CmrOption value={item.name} key={key}>
                                                        {_.capitalize(item.value)}
                                                    </CmrOption>
                                                );
                                            })}
                                        </CmrSelect>
                                    </Row>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={12}>
                                    <Row>
                                        <Space>
                                            <CmrButton onClick={handleRotateCounterclockwise}>
                                                Rotate Counterclockwise
                                            </CmrButton>
                                            <CmrInputNumber
                                                defaultValue={counterclockwiseDegree}
                                                onChange={(value: any) => setCounterclockwiseDegree(value)}
                                            />
                                        </Space>
                                    </Row>
                                </Col>
                                <Col span={12}>
                                    <Row>
                                        <Space>
                                            <CmrButton onClick={handleRotateClockwise}>Rotate Clockwise</CmrButton>
                                            <CmrInputNumber
                                                defaultValue={clockwiseDegree}
                                                onChange={(value: any) => setClockwiseDegree(value)}
                                            />
                                        </Space>
                                    </Row>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={12}>
                                    <Row>
                                        <CmrButton onClick={handleFlipUpDown}>Flip Up-Down</CmrButton>
                                    </Row>
                                </Col>
                                <Col span={12}>
                                    <Row>
                                        <CmrButton onClick={handleFlipLeftRight}>Flip Left-Right</CmrButton>
                                    </Row>
                                </Col>
                            </Row>
                            <Row justify="center">
                                <Stage width={canvasWidth} height={canvasHeight} id="main_stage" ref={mainStageRef}>
                                    <Layer id="background_layer" />
                                    <Layer id="roi_layer">
                                        <Transformer id="roi_transformer" />
                                        <Rect id="selection_rectangle" fill="rgba(0,0,255,0.5)" visible={false} />
                                        <Group id="roi_group" />
                                    </Layer>
                                </Stage>
                                <Stage
                                    width={canvasWidth / 4}
                                    height={canvasHeight}
                                    id="legend_stage"
                                    ref={legendStageRef}
                                />
                            </Row>
                            <Row justify="center">
                                <Col span={2}>
                                    <CmrButton className="canvas-control-button" onClick={handleMoveCanvas}>
                                        <FontAwesomeIcon icon={faHandPaper} size="2x" />
                                    </CmrButton>
                                </Col>
                                <Col span={2}>
                                    <CmrButton className="canvas-control-button" onClick={handleResetCanvas}>
                                        <FontAwesomeIcon icon={faCompress} size="2x" />
                                    </CmrButton>
                                </Col>
                                <Col span={2}>
                                    <CmrButton className="canvas-control-button" onClick={handleSaveCanvas}>
                                        <FontAwesomeIcon icon={faCamera} size="2x" />
                                    </CmrButton>
                                </Col>
                                <Col span={2}>
                                    <CmrButton className="canvas-control-button">
                                        <FontAwesomeIcon icon={faFileAlt} size="2x" />
                                    </CmrButton>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={12}>
                                    <Row>
                                        <CmrLabel>Min</CmrLabel>
                                        <Col span={16}>
                                            <CmrSlider max={255} min={0} value={min} onChange={handleMinChanged} />
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={12}>
                                    <Row>
                                        <CmrLabel>Max</CmrLabel>
                                        <Col span={16}>
                                            <CmrSlider max={255} min={0} value={max} onChange={handleMaxChanged} />
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                            <Row justify="center">
                                <CmrLabel>Zoom</CmrLabel>
                                <Col span={8}>
                                    <CmrSlider max={400} min={0} value={zoom} onChange={handleZoomChanged} />
                                </Col>
                            </Row>
                        </Space>
                    </Col>
                    <Col span={7}>
                        <Space direction="vertical">
                            <Row justify="center">
                                <Col span={3}>
                                    <CmrButton className="roi-button" onClick={handleAddNewRect}>
                                        <FontAwesomeIcon icon={faSquare} size="2x" />
                                    </CmrButton>
                                </Col>
                                <Col span={3}>
                                    <CmrButton className="roi-button" onClick={handleAddNewCircle}>
                                        <FontAwesomeIcon icon={faCircle} size="2x" />
                                    </CmrButton>
                                </Col>
                                <Col span={3}>
                                    <CmrButton className="roi-button" onClick={handleAddNewPolygon}>
                                        <FontAwesomeIcon icon={faDrawPolygon} size="2x" />
                                    </CmrButton>
                                </Col>
                            </Row>
                            <Row>
                                <CmrCheckbox onChange={handleCursorChanged}>{cursor}</CmrCheckbox>
                            </Row>
                            <Row>
                                <CmrLabel>Opacity</CmrLabel>
                                <Col span={12}>
                                    <CmrSlider max={100} min={0} value={opacity} onChange={handleOpacityChanged} />
                                </Col>
                            </Row>
                            <Row>
                                <CmrLabel>ROI Color</CmrLabel>
                                <CmrColorPicker color={roiColor} onColorChange={handleROIColorChange} />
                            </Row>
                            <Row>
                                <Col span={24}>
                                    <CmrTable
                                        dataSource={roiTableData}
                                        columns={roiTableColumns}
                                        idAlias='key'
                                        scroll={{ y: 400 }}
                                    />
                                </Col>
                            </Row>
                            <Row justify="center">
                                <Col span={3}>
                                    <CmrButton className="roi-button" onClick={handleUndoROI}>
                                        <FontAwesomeIcon icon={faTrashRestoreAlt} size="2x" />
                                    </CmrButton>
                                </Col>
                                <Col span={3}>
                                    <CmrButton className="roi-button" onClick={handleBackupAllROIs}>
                                        <FontAwesomeIcon icon={faSave} size="2x" />
                                    </CmrButton>
                                </Col>
                            </Row>
                        </Space>
                    </Col>
                    <Col span={7}>
                        <Row>
                            <Col span={24}>
                                <Plot
                                    data={histogramChatData}
                                    layout={{
                                        width: 500,
                                        height: 500,
                                        title: 'histogram',
                                        xaxis: {
                                            title: 'values',
                                            titlefont: {
                                                family: 'Courier New, monospace',
                                                size: 18,
                                                color: '#7f7f7f',
                                            },
                                        },
                                        yaxis: {
                                            title: 'Pixel Count',
                                            titlefont: {
                                                family: 'Courier New, monospace',
                                                size: 18,
                                                color: '#7f7f7f',
                                            },
                                        },
                                    }}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <CmrTable
                                    dataSource={histogramTableData}
                                    columns={histogramTableColumns}
                                    idAlias='key'
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </CmrPanel>
        </CmrCollapse>
    );
};

export default Results;
