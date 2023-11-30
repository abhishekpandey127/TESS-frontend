import { createSlice } from '@reduxjs/toolkit';
import { getUploadedData } from './homeActionCreation';

export interface UploadedFile {
    id: number;
    fileName: string;
    link: string;
    md5: string;
    size: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface HomeState {
    data: Array<UploadedFile>;
    loading: boolean;
}

const initialState: HomeState = {
    data: [],
    loading: true,
};

export const homeSlice = createSlice({
    name: 'home',
    initialState,
    reducers: {},
    extraReducers: (builder) => (
        builder.addCase(getUploadedData.pending, (state, action) => {
            state.loading = true;
        }),
        builder.addCase(getUploadedData.fulfilled, (state, action) => {
            let data: Array<UploadedFile> = [];
            const payloadData: Array<any> = action.payload;
            if (payloadData.length > 0) {
                payloadData.forEach((element) => {
                    data.push({
                        id: element.id,
                        fileName: element.filename,
                        link: element.location,
                        md5: element.md5,
                        size: element.size,
                        status: element.status,
                        createdAt: element.created_at,
                        updatedAt: element.updated_at,
                    });
                });
            }

            state.data = data;
            state.loading = false;
        })
    ),
});
