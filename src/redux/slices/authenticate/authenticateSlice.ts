import { createSlice } from '@reduxjs/toolkit';
import {getAccessToken, signOut} from './authenticateActionCreation';
import {getUploadedData} from "../home/homeActionCreation";
import {UploadedFile} from "../home/homeSlice";

interface AuthenticateState {
    email: string;
    password: string;
    accessToken: string;
    tokenType: string;
    expiresIn: string;
    loading: boolean;
}

const initialState: AuthenticateState = {
    email: '',
    password: '',
    accessToken: '',
    tokenType: '',
    expiresIn: '',
    loading: true,
};

export const authenticateSlice = createSlice({
    name: 'authenticate',
    initialState,
    reducers: {},
    extraReducers: (builder) => (
        builder.addCase(getAccessToken.pending, (state, action) => {
            state.loading = true;
        }),
        builder.addCase(getAccessToken.fulfilled, (state, action) => {
            const { email, password, access_token, token_type, expires_in } = action.payload;
            state.email = email;
            state.password = password;
            state.accessToken = access_token;
            state.tokenType = token_type;
            state.expiresIn = expires_in;
            state.loading = false;
        }),
        builder.addCase(signOut.pending, (state, action) => {
            state.loading = true;
        }),
        builder.addCase(signOut.fulfilled, (state, action) => {
            const { message } = action.payload;
            if (message === "Successfully logged out") {
                state.accessToken = "";
                state.email = "";
                state.expiresIn = "";
                state.password = "";
                state.tokenType = "";
                state.loading = false;
            }
        }),
            builder.addCase(getUploadedData.pending, (state, action) => {
                state.loading = true;
            }),
            builder.addCase(getUploadedData.fulfilled, (state, action) => {
                let data: Array<UploadedFile> = [];
                const payloadData: Array<any> = action.payload;
                if (payloadData == undefined) {
                    state.accessToken = "";
                    state.expiresIn = "";
                    state.password = "";
                    state.tokenType = "";
                    state.loading = false;
                }
                state.loading = false;
            })
    ),
});
