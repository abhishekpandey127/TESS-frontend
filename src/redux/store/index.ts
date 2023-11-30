import { homeSlice } from '../slices/home/homeSlice';
import { configureStore, getDefaultMiddleware, combineReducers } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import { authenticateSlice } from '../slices/authenticate/authenticateSlice';
import { userSlice } from '../slices/user/userSlice';
import { setupSlice } from '../slices/setup/setupSlice';
import { pipelineSlice } from '../slices/pipeline/pipelineSlice';

const reducers = combineReducers({
    // here we will be adding reducers
    authenticate: authenticateSlice.reducer,
    user: userSlice.reducer,
    home: homeSlice.reducer,
    setup: setupSlice.reducer,
    pipeline: pipelineSlice.reducer,
});

const middleware = [
    ...getDefaultMiddleware(),
    /*YOUR CUSTOM MIDDLEWARES HERE*/
];

const persistConfig = {
    whitelist: ['authenticate', 'user', 'home', 'pipeline'],
    key: 'root',
    storage,
};

const persistedReducer = persistReducer(persistConfig, reducers);

export const store = configureStore({ reducer: persistedReducer, middleware });
export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
