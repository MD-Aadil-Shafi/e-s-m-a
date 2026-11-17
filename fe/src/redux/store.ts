import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./reducers/authSlice";
import employeeSlice from "./reducers/employeeSlice";

//importing reducer

export const store:any = configureStore({
    reducer:{
        auth: authSlice,
        employee: employeeSlice,
    }
})

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
