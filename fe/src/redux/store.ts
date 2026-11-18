import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./reducers/authSlice";
import employeeSlice from "./reducers/employeeSlice";
import salarySlice from "./reducers/salarySlice";
import metricsSlice from "./reducers/metricsSlice";

export const store: any = configureStore({
    reducer: {
        auth:     authSlice,
        employee: employeeSlice,
        salary:   salarySlice,
        metrics:  metricsSlice,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
