import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { APP_NAME, VERSION, SUB_APP_NAME } from '../../../constants/Constants';
import { values } from 'lodash';

const SCHEDULENEWJOB = 'http://localhost:5010/pipelines';

export interface SetupDataType {
    mask:FileUpload
    materialdensity:FileUpload
    bloodperfusion:FileUpload
    heatcapacity:FileUpload
    thermalconductivity:FileUpload
    metabolism:FileUpload
    sar:FileUpload
    told:FileUpload
    air:MaterialParameters
    blood:MaterialParameters
    heatingtime:number
    alias: string;
    accessToken: string;
}

interface MaterialParameters{
temperature:number;
capacity:number;
density:number;
}

interface FileUpload {
    id: number;
    fileName: string;
    link: string;
    state: string;
}

export interface PipelineDataType {
    pipelineId?: string;
    accessToken: string;
}

export const scheduleNewJob = createAsyncThunk('SCHEDULE_NEW_JOB', async (setupData: SetupDataType) => {
    console.log(setupData);
    const { accessToken } = setupData;
    const config = {
        headers: { Authorization: `Bearer ${accessToken}` },
    };
    const jobData = {
        application: APP_NAME,
        pipeline: [
            {
                subApplication: SUB_APP_NAME,
                alias:setupData.alias,
                options: {
                    version: VERSION,
                    mask: {
                        id: setupData.mask.id,
                        filename: setupData.mask.fileName,
                        link: setupData.mask.link,
                        state: setupData.mask.state,
                    },
                    materialdensity: {
                        id: setupData.materialdensity.id,
                        filename: setupData.materialdensity.fileName,
                        link: setupData.materialdensity.link,
                        state: setupData.materialdensity.state,
                    },
                    bloodperfusion: {
                        id: setupData.bloodperfusion.id,
                        filename: setupData.bloodperfusion.fileName,
                        link: setupData.bloodperfusion.link,
                        state: setupData.bloodperfusion.state,
                    },
                    heatcapacity: {
                        id: setupData.heatcapacity.id,
                        filename: setupData.heatcapacity.fileName,
                        link: setupData.heatcapacity.link,
                        state: setupData.heatcapacity.state,
                    },
                    thermalconductivity: {
                        id: setupData.thermalconductivity.id,
                        filename: setupData.thermalconductivity.fileName,
                        link: setupData.thermalconductivity.link,
                        state: setupData.thermalconductivity.state,
                    },
                    metabolism: {
                        id: setupData.metabolism.id,
                        filename: setupData.metabolism.fileName,
                        link: setupData.metabolism.link,
                        state: setupData.metabolism.state,
                    },
                    sar: {
                        id: setupData.sar.id,
                        filename: setupData.sar.fileName,
                        link: setupData.sar.link,
                        state: setupData.sar.state,
                    },
                    told: {
                        id: setupData.told.id,
                        filename: setupData.told.fileName,
                        link: setupData.told.link,
                        state: setupData.told.state,
                    },
                    air:setupData.air,
                    blood:setupData.blood,
                    heatingtime:setupData.heatingtime,
                    Alias: setupData.alias,
                },
            },
        ],
    };
    const response = await axios.post(SCHEDULENEWJOB, jobData, config);
    return response.data;
});

export const getPipelineStatus = createAsyncThunk('CHECK_PIPELINE_STATUS', async (pipelineData: PipelineDataType) => {
    const { accessToken, pipelineId } = pipelineData;
    const config = {
        headers: { Authorization: `Bearer ${accessToken}` },
    };

    let checkPipelineStatusUrl = SCHEDULENEWJOB;

    if (pipelineId) checkPipelineStatusUrl = `${SCHEDULENEWJOB}/${pipelineId}`;

    const response = await axios.get(checkPipelineStatusUrl, config);
    return response.data;
});
