import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./reducers/authSlice";

//importing reducer

export const store:any = configureStore({
    reducer:{
        auth: authSlice,
    }
})

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
