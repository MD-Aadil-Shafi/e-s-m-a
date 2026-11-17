import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { baseUrl } from "../baseUrl";
import { toast } from "react-toastify";
import { errorToast } from "../../utils/actionToast";
import type { Employee } from "./employeeSlice";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BasePay = {
    employee_id: number;
    base_salary: string;    // Decimal → string in JSON
    allowances: string;
    added_by: string;
    created_at: string;
    employee?: Employee;    // present on GET & POST; absent on PATCH response
};

export type AddBasePayPayload = {
    employee_id: number;
    base_salary: string;  // sent as string; API accepts numeric string for Decimal
    allowances?: string;
};

export type EditBasePayPayload = {
    employee_id: number;
    base_salary?: string;
    allowances?: string;
    remark: string;
};

// ─── State ────────────────────────────────────────────────────────────────────

interface SalaryState {
    basePayLoading: boolean;
    basePay: BasePay | null;
    basePayNotFound: boolean;
    mutating: boolean;        // shared loading flag for add / edit
}

const initialState: SalaryState = {
    basePayLoading: false,
    basePay: null,
    basePayNotFound: false,
    mutating: false,
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
            if (err?.response?.status === 404) return rejectWithValue("NOT_FOUND");
            errorToast(err);
            return rejectWithValue(err?.response?.data?.detail || "Something went wrong!");
        }
    }
);

export const addBasePay = createAsyncThunk(
    "salary/addBasePay",
    async (payload: AddBasePayPayload, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${baseUrl}/salary/base`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Base pay created successfully!");
            return res.data as BasePay;
        } catch (err: any) {
            errorToast(err);
            return rejectWithValue(err?.response?.data?.detail || "Something went wrong!");
        }
    }
);

export const editBasePay = createAsyncThunk(
    "salary/editBasePay",
    async ({ employee_id, ...payload }: EditBasePayPayload, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.patch(`${baseUrl}/salary/modify-base/${employee_id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Base pay updated successfully!");
            return res.data as BasePay;
        } catch (err: any) {
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
            // getBasePay
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
            })

            // addBasePay — on success update state directly so the page refreshes
            .addCase(addBasePay.pending,   (state) => { state.mutating = true; })
            .addCase(addBasePay.fulfilled, (state, action: PayloadAction<BasePay>) => {
                state.mutating = false;
                state.basePay = action.payload;
                state.basePayNotFound = false;
            })
            .addCase(addBasePay.rejected,  (state) => { state.mutating = false; })

            // editBasePay — merge returned fields with the preserved employee from state
            .addCase(editBasePay.pending,   (state) => { state.mutating = true; })
            .addCase(editBasePay.fulfilled, (state, action: PayloadAction<BasePay>) => {
                state.mutating = false;
                // Preserve the employee object from the initial GET — PATCH won't return it
                state.basePay = {
                    ...action.payload,
                    employee: action.payload.employee ?? state.basePay?.employee,
                };
            })
            .addCase(editBasePay.rejected,  (state) => { state.mutating = false; });
    },
});

export const { clearBasePay } = salarySlice.actions;
export default salarySlice.reducer;
