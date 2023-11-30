import { createSlice } from '@reduxjs/toolkit';
import { uploadUserROI } from './resultActionCreation';

interface ResultState {
    loading: boolean;
}

const initialState: ResultState = {
    loading: true,
};

export const resultSlice = createSlice({
    name: 'result',
    initialState,
    reducers: {},
    extraReducers: (builder) => (
        builder.addCase(uploadUserROI.pending, (state, action) => {
            state.loading = true;
        }),
        builder.addCase(uploadUserROI.fulfilled, (state, action) => {
            state.loading = false;
        })
    ),
});
