import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

const USERPROFILE = 'http://localhost:8000/api/auth/profile';

export const getUserProfile = createAsyncThunk('USER_PROFILE', async (accessToken: string) => {
    const config = {
        headers: { Authorization: `Bearer ${accessToken}` },
    };
    const response = await axios.get(USERPROFILE, config);
    return response.data;
});
