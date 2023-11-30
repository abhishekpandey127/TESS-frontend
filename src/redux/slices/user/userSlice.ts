import { createSlice } from '@reduxjs/toolkit';
import {getUserProfile} from './userActionCreation';

interface UserState {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    emailVerifiedAt: string;
    status: string;
    level: string;
    createdAt: string;
    updatedAt: string;
    loading: boolean;
}

const initialState: UserState = {
    firstName: '',
    lastName: '',
    email: '',
    userName: '',
    emailVerifiedAt: '',
    status: '',
    level: '',
    createdAt: '',
    updatedAt: '',
    loading: false
};

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {},
    extraReducers: (builder) => (
        builder.addCase(getUserProfile.pending, (state, action) => {
            state.loading = true;
        }),
        builder.addCase(getUserProfile.fulfilled, (state, action) => {
            const { name, lastname, email, username, email_verified_at, status, level, created_at, updated_at } = action.payload;
            state.firstName = name;
            state.lastName = lastname;
            state.userName = username;
            state.emailVerifiedAt = email_verified_at;
            state.status = status;
            state.level = level;
            state.createdAt = created_at;
            state.updatedAt = updated_at;
            state.loading = false;
        })
    ),
});
