import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { baseUrl } from "../baseUrl";
import { errorToast } from "../../utils/actionToast";
import type { Employee } from "./employeeSlice";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BasePay = {
    employee_id: number;
    base_salary: string;   // Decimal comes as string from JSON
    allowances: string;
    added_by: string;
    created_at: string;
    employee: Employee;
};

// ─── State ────────────────────────────────────────────────────────────────────

interface SalaryState {
    basePayLoading: boolean;
    basePay: BasePay | null;
    basePayNotFound: boolean;
}

const initialState: SalaryState = {
    basePayLoading: false,
    basePay: null,
    basePayNotFound: false,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const getBasePay = createAsyncThunk(
    "salary/getBasePay",
    async (employeeId: number, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${baseUrl}/salary/base-pay/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data as BasePay;
        } catch (err: any) {
            // 404 means no base pay exists yet — not a hard error
            if (err?.response?.status === 404) {
                return rejectWithValue("NOT_FOUND");
            }
            errorToast(err);
            return rejectWithValue(err?.response?.data?.detail || "Something went wrong!");
        }
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const salarySlice = createSlice({
    name: "salary",
    initialState,
    reducers: {
        clearBasePay: (state) => {
            state.basePay = null;
            state.basePayNotFound = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getBasePay.pending, (state) => {
                state.basePayLoading = true;
                state.basePayNotFound = false;
                state.basePay = null;
            })
            .addCase(getBasePay.fulfilled, (state, action: PayloadAction<BasePay>) => {
                state.basePayLoading = false;
                state.basePay = action.payload;
                state.basePayNotFound = false;
            })
            .addCase(getBasePay.rejected, (state, action) => {
                state.basePayLoading = false;
                state.basePay = null;
                state.basePayNotFound = action.payload === "NOT_FOUND";
            });
    },
});

export const { clearBasePay } = salarySlice.actions;
export default salarySlice.reducer;
