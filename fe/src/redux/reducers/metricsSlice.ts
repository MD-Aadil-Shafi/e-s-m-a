import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { baseUrl } from "../baseUrl";
import { errorToast } from "../../utils/actionToast";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TopPaidEmployee = {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    country: string;
    department: string;
    base_salary: number;
};

export type LatestEmployee = {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    department: string;
    country: string;
    created_at: string;
};

export type DepartmentStat = {
    department: string;
    total_employees: number;
};

export type CountryStat = {
    country: string;
    total_employees: number;
};

export type Metrics = {
    total_employees: number;
    total_management_professionals: number;
    top_3_paid_employees: TopPaidEmployee[];
    latest_employees: LatestEmployee[];
    oldest_employees: LatestEmployee[];
    department_wise_employees: DepartmentStat[];
    country_wise_employees: CountryStat[];
    last_month_total_net_pay: number;
};

// ─── State ────────────────────────────────────────────────────────────────────

interface MetricsState {
    loading: boolean;
    metrics: Metrics | null;
}

const initialState: MetricsState = {
    loading: false,
    metrics: null,
};

// ─── Thunk ────────────────────────────────────────────────────────────────────

export const getMetrics = createAsyncThunk(
    "metrics/get",
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${baseUrl}/metrics`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data as Metrics;
        } catch (err: any) {
            errorToast(err);
            return rejectWithValue(err?.response?.data?.detail || "Something went wrong!");
        }
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const metricsSlice = createSlice({
    name: "metrics",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getMetrics.pending,   (state) => { state.loading = true; })
            .addCase(getMetrics.fulfilled, (state, action: PayloadAction<Metrics>) => {
                state.loading  = false;
                state.metrics  = action.payload;
            })
            .addCase(getMetrics.rejected,  (state) => { state.loading = false; });
    },
});

export default metricsSlice.reducer;
