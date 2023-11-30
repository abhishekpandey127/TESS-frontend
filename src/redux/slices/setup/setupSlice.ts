import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {getUploadedData} from "./setupActionCreation";
import {UploadedFile} from "../home/homeSlice";

interface SetupState {
    mask: GeometryFile;
    materialdensity: GeometryFile;
    bloodperfusion: GeometryFile;
    heatcapacity: GeometryFile;
    sar: GeometryFile;
    thermalconductivity: GeometryFile;
    metabolism: GeometryFile;
    told: GeometryFile;
    loading: boolean;
    data: UploadedFile[];
}

export interface GeometryFile {
    name: string;
    submittedDate: string;
    size: string;
    localLink: string;
    onlineLink: string;
    status: string;
}

const initialState: SetupState = {
    mask: {
        name: '',
        submittedDate: '',
        size: '',
        localLink: '',
        onlineLink: '',
        status: '',
    },
    materialdensity: {
        name: '',
        submittedDate: '',
        size: '',
        localLink: '',
        onlineLink: '',
        status: '',
    },
    bloodperfusion: {
        name: '',
        submittedDate: '',
        size: '',
        localLink: '',
        onlineLink: '',
        status: '',
    },
    heatcapacity: {
        name: '',
        submittedDate: '',
        size: '',
        localLink: '',
        onlineLink: '',
        status: '',
    },
    sar: {
        name: '',
        submittedDate: '',
        size: '',
        localLink: '',
        onlineLink: '',
        status: '',
    },
    thermalconductivity: {
        name: '',
        submittedDate: '',
        size: '',
        localLink: '',
        onlineLink: '',
        status: '',
    },
    told: {
        name: '',
        submittedDate: '',
        size: '',
        localLink: '',
        onlineLink: '',
        status: '',
    },
    metabolism: {
        name: '',
        submittedDate: '',
        size: '',
        localLink: '',
        onlineLink: '',
        status: '',
    },
    data:[],
    loading: true,
};

export const setupSlice = createSlice({
    name: 'setup',
    initialState,
    reducers: {
        updateMask(state, action: PayloadAction<GeometryFile>) {
            const mask = action.payload;
            state.mask = mask;
        },
        updateMaterialDensity(state, action: PayloadAction<GeometryFile>) {
            const materialdensity = action.payload;
            state.materialdensity = materialdensity;
        },
        updateBloodPerfusion(state, action: PayloadAction<GeometryFile>) {
            const bloodperfusion = action.payload;
            state.bloodperfusion = bloodperfusion;
        },
        updateHeatCapacity(state, action: PayloadAction<GeometryFile>) {
            const heatcapacity = action.payload;
            state.heatcapacity = heatcapacity;
        },
        updateThermalConductivity(state, action: PayloadAction<GeometryFile>) {
            const thermalconductivity = action.payload;
            state.thermalconductivity = thermalconductivity;
        },
        updateMetabolism(state, action: PayloadAction<GeometryFile>) {
            const metabolism = action.payload;
            state.metabolism = metabolism;
        },
        updateSAR(state, action: PayloadAction<GeometryFile>) {
            const sar = action.payload;
            state.sar = sar;
        },
        updateTOld(state, action: PayloadAction<GeometryFile>) {
            const told = action.payload;
            state.told = told;
        },
    },
    extraReducers: (builder) =>  (
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

export const { updateMask, updateMaterialDensity, updateBloodPerfusion, updateHeatCapacity,updateMetabolism,updateSAR,updateTOld,updateThermalConductivity } = setupSlice.actions;
export default setupSlice.reducer;
