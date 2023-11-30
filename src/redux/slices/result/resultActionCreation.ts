import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

const UPLOADUSERROI = 'http://localhost:5010/roi';

export interface UploadUserROIDataType {
    accessToken: string;
    roiFile: Blob;
    pipelineId: string;
    roiType: string;
    applicationName: string;
}

export interface GetUserROIDataType {
    accessToken: string;
    pipelineId: string;
}

export const getTasks = createAsyncThunk('Tasks', async () => {
    const response: any = {};
    return response.data;
});

export const uploadUserROI = createAsyncThunk('UploadUserROI', async (uploadUserROIData: UploadUserROIDataType) => {
    const { accessToken, roiFile, pipelineId, roiType, applicationName } = uploadUserROIData;
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${accessToken}`,
        },
    };
    const formData = new FormData();
    formData.append('file', roiFile);
    formData.append('pipeline', pipelineId);
    formData.append('type', roiType);
    formData.append('application', applicationName);
    const response = await axios.post(UPLOADUSERROI, formData, config);
    return response.data;
});

export const getUserROI = createAsyncThunk('GetUserROI', async (getUserROIData: GetUserROIDataType) => {
    const { accessToken, pipelineId } = getUserROIData;
    const config = {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    };
    const response = await axios.get(UPLOADUSERROI, config);
    return response.data;
});
