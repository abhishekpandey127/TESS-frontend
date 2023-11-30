import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getPipelineStatus, scheduleNewJob } from './pipelineActionCreation';

interface PipelineState {
    pipelines: Array<Pipeline>;
    isCreated: boolean;
    loading: boolean;
}

interface Pipeline {
    pipeline: string;
    status: string;
    input: any;
    output: any;
    results: any;
    alias: string;
    createdAt: string;
    tasks: Array<Task>;
}

interface Task {
    cuId: string;
    cuName: string;
    id: string;
    internalUrl: string;
    url: string;
    cu: CU;
}

interface CU {
    id: string;
    name: string;
}

const initialState: PipelineState = {
    pipelines: [],
    isCreated: false,
    loading: true,
};

export const pipelineSlice = createSlice({
    name: 'pipeline',
    initialState,
    reducers: {
        updatePipelineCreated(state, action: PayloadAction<{ isPipelineCreated: boolean }>) {
            const { isPipelineCreated } = action.payload;
            state.isCreated = isPipelineCreated;
        },
    },
    extraReducers: (builder) => (
        builder.addCase(scheduleNewJob.pending, (state, action) => {
            state.loading = true;
        }),
        builder.addCase(scheduleNewJob.fulfilled, (state, action) => {
            const { version, pipeline, pipelinestatus, percentagecompleted, tasks } = action.payload;
            state.loading = false;
            state.isCreated = true;
        }),
        builder.addCase(getPipelineStatus.pending, (state, action) => {
            state.loading = true;
        }),
        builder.addCase(getPipelineStatus.fulfilled, (state, action) => {
            let pipelines: Array<Pipeline> = [];
            if(action.payload.length>0){
                const payloadData: Array<any> = action.payload[0];
                if (payloadData.length > 0) {
                    payloadData.forEach((element) => {
                        pipelines.push({
                            pipeline: element.pipeline,
                            status: element.status,
                            input: element.input,
                            output: element.output,
                            results: element.results,
                            alias: element.alias,
                            createdAt: element.created_at,
                            tasks: element.tasks,
                        });
                    });
                }
            }

            state.pipelines = pipelines;
            state.loading = false;
        })
    ),
});

export const { updatePipelineCreated } = pipelineSlice.actions;
export default pipelineSlice.reducer;
