import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { FILEUPLOAD } from '../setup/setupActionCreation';

export const getUploadedData = createAsyncThunk('GetUploadedData', async (accessToken: string) => {
    const config = {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    };
    const response = await axios.get(FILEUPLOAD, config);
    return response.data;
});
