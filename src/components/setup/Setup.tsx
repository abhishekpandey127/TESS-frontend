import React, { useState } from 'react';
import './Setup.scss';
import { Form, RadioChangeEvent, Row, Col, notification } from 'antd';
import CmrCollapse from '../shared/Cmr-components/collapse/Collapse';
import CmrPanel from '../shared/Cmr-components/panel/Panel';
import CmrLabel from '../shared/Cmr-components/label/Label';
import CmrButton from '../shared/Cmr-components/button/Button';
import CmrInputNumber from '../shared/Cmr-components/input-number/InputNumber';
import CmrInput from '../shared/Cmr-components/input/Input';
import CmrUpload from '../shared/Cmr-components/upload/Upload';
import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import { useAppDispatch, useAppSelector } from '../../redux/hooks/hooks';
import { scheduleNewJob, SetupDataType } from '../../redux/slices/pipeline/pipelineActionCreation';
import {FILEUPLOAD, getUploadedData} from '../../redux/slices/setup/setupActionCreation';
import { GeometryFile, updateMask, updateMaterialDensity, updateBloodPerfusion, updateHeatCapacity,updateThermalConductivity,updateMetabolism,updateSAR,updateTOld } from '../../redux/slices/setup/setupSlice';
import { formatBytes, getFileExtension } from '../../utils';
import moment from 'moment';
import { updatePipelineCreated } from '../../redux/slices/pipeline/pipelineSlice';
import { anonymizeTWIX } from '../../utils/file-transformation/anonymize';
import { Divider } from '@mui/material';
import CMRSelectUpload from "../shared/Cmr-components/select-upload/SelectUpload";
import {UploadedFile} from "../../redux/slices/home/homeSlice";

const initialMask: GeometryFile = {
    name: '',
    submittedDate: '',
    size: '',
    localLink: '',
    onlineLink: '',
    status: '',
};

const initialMaterialDensity: GeometryFile = {
    name: '',
    submittedDate: '',
    size: '',
    localLink: '',
    onlineLink: '',
    status: '',
};

const initialBloodPerfusion: GeometryFile = {
    name: '',
    submittedDate: '',
    size: '',
    localLink: '',
    onlineLink: '',
    status: '',
}

const initialHeatCapacity: GeometryFile ={
    name: '',
    submittedDate: '',
    size: '',
    localLink: '',
    onlineLink: '',
    status: '',
}
const initialsar: GeometryFile = {
    name: '',
    submittedDate: '',
    size: '',
    localLink: '',
    onlineLink: '',
    status: '',
}
const initialTermalConductivity: GeometryFile = {
    name: '',
    submittedDate: '',
    size: '',
    localLink: '',
    onlineLink: '',
    status: '',
}
const initialTOld: GeometryFile ={
    name: '',
    submittedDate: '',
    size: '',
    localLink: '',
    onlineLink: '',
    status: '',
}
const initialMetabolism: GeometryFile ={
    name: '',
    submittedDate: '',
    size: '',
    localLink: '',
    onlineLink: '',
    status: '',
}

const initialValues = {
    air_temperature: 293,
    blood_temperature:310,
    blood_capacity:1057.0,
    blood_density:3600,
    heatingtime:20,
    job_name: 'TESS - ' + moment().format('YYYY-MM-DD HH:mm:ss'),
};

const Setup = () => {
    const [openPanel, setOpenPanel] = useState([0]);

    // Form prop for antd forms
    const [setupForm] = Form.useForm();
    const dispatch = useAppDispatch();
    const { accessToken } = useAppSelector((state) => state.authenticate);

    const mask = useAppSelector((state) => state.setup.mask);
    const bloodperfusion = useAppSelector((state) => state.setup.bloodperfusion);
    const materialdensity = useAppSelector((state) => state.setup.materialdensity);
    const heatcapacity = useAppSelector((state) => state.setup.heatcapacity);
    const thermalconductivity = useAppSelector((state) => state.setup.thermalconductivity);
    const metabolism = useAppSelector((state) => state.setup.metabolism);
    const sar = useAppSelector((state) => state.setup.sar);
    const told = useAppSelector((state) => state.setup.told);

    const isPipelineCreated = useAppSelector((state) => state.pipeline.isCreated);

    const UploadHeaders:AxiosRequestConfig = {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${accessToken}`,
        },
    };


    const handlePanelSubmitClicked = (panelNumber: number) => {
        setOpenPanel([panelNumber]);
    };

    const getFiles = (e: any) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e && e.fileList;
    };


    /**
     * Create payload for all uploaded files
     * @param file
     * @param fileAlias
     */
    const createFilePayload = async (file: File, fileAlias: string) => {
        if (file) {
            const formData = new FormData();
            formData.append('application', 'TESS');
            formData.append('alias', fileAlias);

            const fileExtension = getFileExtension(file.name);

            if (fileExtension == 'dat') {
                const transformedFile = await anonymizeTWIX(file);
                formData.append('file', transformedFile);
            } else {
                formData.append('file', file);
            }
            return { destination: FILEUPLOAD, formData:formData, config: UploadHeaders};
        }
    };

    /**
     * Corresponding dispatchers: updateMask, updateMaterialDensity, updateBloodPerfusion,
     * updateHeatCapacity,updateThermalConductivity,updateMetabolism,updateSAR,updateTOld
     * @param reducer
     */
    const uploadResHandlerFactory=(reducer:
        (payload: GeometryFile)=>{payload: GeometryFile, type: string})=>{
        return (res: AxiosResponse, maskFile: File)=>{
            const submittedDatTime = moment().format('YYYY-MM-DD HH:mm:ss');
            const geometry: GeometryFile = {
                name: res.data.alias,
                submittedDate: submittedDatTime,
                size: formatBytes(maskFile.size),
                localLink: res.data.local,
                onlineLink: res.data.onlinelink,
                status: res.data.status,
            };
            dispatch(reducer(geometry));
            dispatch(getUploadedData(accessToken));
        };
    }

    /**
     * Corresponding dispatchers: updateMask, updateMaterialDensity, updateBloodPerfusion,
     * updateHeatCapacity,updateThermalConductivity,updateMetabolism,updateSAR,updateTOld
     * @param reducer
     */
    const selectHandlerFactory=(reducer:
                                       (payload: GeometryFile)=>{payload: GeometryFile, type: string})=>{
        return (file: UploadedFile)=>{
            /*
             *{ "type": "file", "options": { "type": "s3", "filename":"xx", "options": { "key":None, "bucket":None}} },
             */
            const geometry: GeometryFile = {
                name: file.fileName,
                submittedDate: file.updatedAt,
                size: file.size,
                localLink: file.link,
                //TODO: Verify this line
                onlineLink: file.link,
                status: file.status,
            };
            dispatch(reducer(geometry));
        };
    }

    const onFinish = (values: any) => {
        console.log(values)
        setupForm.resetFields();
        const pipelineData: SetupDataType = {
                mask: {
                    id: 0,
                    fileName: mask.name,
                    link: mask.localLink,
                    state: mask.status,
                },
                materialdensity: {
                    id: 0,
                    fileName: materialdensity.name,
                    link: materialdensity.localLink,
                    state: materialdensity.status,
                },
                bloodperfusion: {
                    id: 0,
                    fileName: bloodperfusion.name,
                    link: bloodperfusion.localLink,
                    state: bloodperfusion.status,
                },
                heatcapacity: {
                    id:0,
                    fileName: heatcapacity.name,
                    link: heatcapacity.localLink,
                    state: heatcapacity.status,
                },
                sar: {
                    id:0,
                    fileName: sar.name,
                    link: sar.localLink,
                    state: sar.status,
                },
                thermalconductivity: {
                    id:0,
                    fileName: thermalconductivity.name,
                    link: thermalconductivity.localLink,
                    state: thermalconductivity.status,
                },
                told: {
                    id:0,
                    fileName: told.name,
                    link: told.localLink,
                    state: told.status,
                },
                metabolism: {
                    id:0,
                    fileName: metabolism.name,
                    link: metabolism.localLink,
                    state: metabolism.status,
                },
            air:{temperature:values.air_temperature,capacity:NaN,density:NaN},
            blood:{temperature:values.blood_temperature,capacity:values.blood_capacity,density:values.blood_density},
            heatingtime:values.heatingtime,
            alias: values.job_name,
            accessToken: accessToken,
        };
        dispatch(scheduleNewJob(pipelineData));
        dispatch(updateMask(initialMask));
        dispatch(updateMaterialDensity(initialMaterialDensity));
        dispatch(updateBloodPerfusion(initialBloodPerfusion));
        dispatch(updateHeatCapacity(initialHeatCapacity));
        dispatch(updateThermalConductivity(initialTermalConductivity));
        dispatch(updateMetabolism(initialMetabolism));
        dispatch(updateSAR(initialsar));
        dispatch(updateTOld(initialTOld));
    };

    if (isPipelineCreated) {
        dispatch(updatePipelineCreated({ isPipelineCreated: false }));
        notification['success']({
            message: 'Setup Information',
            description: 'New job has successfully queued',
        });
    }

    return (
        <Form name="setup" className="setup" form={setupForm} initialValues={initialValues} onFinish={onFinish}>
            <CmrCollapse activeKey={openPanel} expandIconPosition="right" onChange={(key: any) => {
                console.log(key);
                setOpenPanel([key])
            }}>
                <CmrPanel key="0" header="Geometry">
                    {/* <Form.Item name="geometryfiles" valuePropName="geometryfiles" getValueFromEvent={getFiles}> */}
                        <Row>
                            <Col span={8}>
                                <Row>
                                    <Col span={12}>
                                        <CmrLabel>Mask</CmrLabel>
                                    </Col>
                                    <Col span={12}>
                                        <CMRSelectUpload
                                            maxCount={1}
                                            createPayload={createFilePayload}
                                            onUploaded={uploadResHandlerFactory(updateMask)}
                                            onSelected={selectHandlerFactory(updateMask)}
                                            fileSelection={useAppSelector((state) => state.setup).data}
                                            chosenFile={(mask.name!='')?mask.name:undefined}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={8}>
                                <Row>
                                    <Col span={12}>
                                        <CmrLabel>Material Density [Kg/m^3]</CmrLabel>
                                    </Col>
                                    <Col span={12}>
                                        <CMRSelectUpload
                                            maxCount={1}
                                            createPayload={createFilePayload}
                                            onUploaded={uploadResHandlerFactory(updateMaterialDensity)}
                                            onSelected={selectHandlerFactory(updateMaterialDensity)}
                                            fileSelection={useAppSelector((state) => state.setup).data}
                                            chosenFile={(materialdensity.name!='')?materialdensity.name:undefined}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={8}>
                                <Row>
                                    <Col span={12}>
                                        <CmrLabel>Blood Perfusion [mmL/M*Kg]</CmrLabel>
                                    </Col>
                                    <Col span={12}>
                                        <CMRSelectUpload
                                            maxCount={1}
                                            createPayload={createFilePayload}
                                            onUploaded={uploadResHandlerFactory(updateBloodPerfusion)}
                                            onSelected={selectHandlerFactory(updateBloodPerfusion)}
                                            fileSelection={useAppSelector((state) => state.setup).data}
                                            chosenFile={(bloodperfusion.name!='')?bloodperfusion.name:undefined}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                        <Divider variant="middle" sx={{marginTop:'5pt', marginBottom:'15pt', color:'light-gray'}} />
                        <Row>
                            <Col span={8}>
                                <Row>
                                    <Col span={12}>
                                        <CmrLabel>Heat Capacity [Joule/(Kg*K)]</CmrLabel>
                                    </Col>
                                    <Col span={12}>
                                        <CMRSelectUpload
                                            maxCount={1}
                                            createPayload={createFilePayload}
                                            onUploaded={uploadResHandlerFactory(updateHeatCapacity)}
                                            onSelected={selectHandlerFactory(updateHeatCapacity)}
                                            fileSelection={useAppSelector((state) => state.setup).data}
                                            chosenFile={(heatcapacity.name!='')?heatcapacity.name:undefined}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={8}>
                                <Row>
                                    <Col span={12}>
                                        <CmrLabel>  Thermal Conductivity [Watt/kg]</CmrLabel>
                                    </Col>
                                    <Col span={12}>
                                        <CMRSelectUpload
                                            maxCount={1}
                                            createPayload={createFilePayload}
                                            onUploaded={uploadResHandlerFactory(updateThermalConductivity)}
                                            onSelected={selectHandlerFactory(updateThermalConductivity)}
                                            fileSelection={useAppSelector((state) => state.setup).data}
                                            chosenFile={(thermalconductivity.name!='')?thermalconductivity.name:undefined}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={8}>
                                <Row>
                                    <Col span={12}>
                                        <CmrLabel>Metabolism Heat [K]</CmrLabel>
                                    </Col>
                                    <Col span={12}>
                                        <CMRSelectUpload
                                            maxCount={1}
                                            createPayload={createFilePayload}
                                            onUploaded={uploadResHandlerFactory(updateMetabolism)}
                                            onSelected={selectHandlerFactory(updateMetabolism)}
                                            fileSelection={useAppSelector((state) => state.setup).data}
                                            chosenFile={(metabolism.name!='')?metabolism.name:undefined}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                            </Row>
                    <Divider variant="middle" sx={{marginTop:'5pt', marginBottom:'15pt', color:'light-gray'}} />
                    {/* </Form.Item> */}
                    <Row>
                        <Col span={8}>
                            <Row>
                                <Col span={12}>
                                    <CmrLabel>  SAR [Watt/(kg)] </CmrLabel>
                                </Col>
                                <Col span={12}>
                                    <CMRSelectUpload
                                        maxCount={1}
                                        createPayload={createFilePayload}
                                        onUploaded={uploadResHandlerFactory(updateSAR)}
                                        onSelected={selectHandlerFactory(updateSAR)}
                                        fileSelection={useAppSelector((state) => state.setup).data}
                                        chosenFile={(sar.name!='')?sar.name:undefined}
                                    />
                                </Col>
                            </Row>
                        </Col>
                        <Col span={8}>
                            <Row>
                                <Col span={12}>
                                    <CmrLabel>TOld [K] </CmrLabel>
                                </Col>
                                <Col span={12}>
                                    <CMRSelectUpload
                                        maxCount={1}
                                        createPayload={createFilePayload}
                                        onUploaded={uploadResHandlerFactory(updateTOld)}
                                        onSelected={selectHandlerFactory(updateTOld)}
                                        fileSelection={useAppSelector((state) => state.setup).data}
                                        chosenFile={(told.name!='')?told.name:undefined}
                                    />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Divider variant="middle" sx={{marginTop:'5pt', marginBottom:'15pt', color:'light-gray'}} />
                    <Row>
                        <CmrButton onClick={() => handlePanelSubmitClicked(1)}>Submit</CmrButton>
                    </Row>
                </CmrPanel>
                <CmrPanel key="1" header="Parameters">
                    <Form.Item>
                        <Row justify="center">
                        <Col span={6}>
                                <Row>
                                    <Form.Item>
                                        <CmrLabel>Air Temperature [K]</CmrLabel>
                                    </Form.Item>
                                    <Form.Item name="air_temperature">
                                        <CmrInputNumber />
                                    </Form.Item>
                                </Row>
                            </Col>
                </Row>
               

                <Row justify="center">
                        <Col span={6}>
                                <Row>
                                    <Form.Item>
                                        <CmrLabel>Blood Temperature [K]</CmrLabel>
                                    </Form.Item>
                                    <Form.Item name="blood_temperature">
                                        <CmrInputNumber />
                                    </Form.Item>
                                </Row>
                            </Col>
                            <Col span={6}>
                                <Row>
                                    <Form.Item>
                                        <CmrLabel>Blood Capacity [Joule/(Kg*K)]</CmrLabel>
                                    </Form.Item>
                                    <Form.Item name="blood_capacity">
                                        <CmrInputNumber />
                                    </Form.Item>
                                </Row>
                            </Col>
                            <Col span={6}>
                                <Row>
                                    <Form.Item>
                                        <CmrLabel>Blood Density [Kg/m^3]</CmrLabel>
                                    </Form.Item>
                                    <Form.Item name="blood_density">
                                        <CmrInputNumber />
                                    </Form.Item>
                                </Row>
                            </Col>

                </Row>
                <Row justify="center">
                        <Col span={6}>
                                <Row>
                                    <Form.Item>
                                        <CmrLabel>Heating Time [s]</CmrLabel>
                                    </Form.Item>
                                    <Form.Item name="heatingtime">
                                        <CmrInputNumber />
                                    </Form.Item>
                                </Row>
                            </Col>
                </Row>
                </Form.Item>
                <Row>
                        <CmrButton onClick={() => handlePanelSubmitClicked(2)}>Submit</CmrButton>
                    </Row>
                </CmrPanel>            
                 <CmrPanel key="2" header="Start Calculation">
                    <Form.Item>
                        <Row justify="center">
                            <Col span={8}>
                                <Row>
                                    <Col span={4}>
                                        <Form.Item>
                                            <CmrLabel>Job Name</CmrLabel>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="job_name">
                                            <CmrInput />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item>
                                            <CmrButton
                                                type="primary"
                                                htmlType="submit"
                                                // disabled={!mask.localLink || !materialdensity.localLink || !bloodperfusion.localLink 
                                                    // ||!heatcapacity.localLink||!metabolism.localLink||!thermalconductivity.localLink
                                                    // ||!sar.localLink||!told.localLink}
                                            >
                                                Queue Job
                                            </CmrButton>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Form.Item>
                </CmrPanel>
            </CmrCollapse>
        </Form>
    );
};

export default Setup;
