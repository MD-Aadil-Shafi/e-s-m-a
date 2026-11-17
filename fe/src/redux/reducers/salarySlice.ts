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
    base_salary: string;
    allowances: string;
    added_by: string;
    created_at: string;
    employee?: Employee;    // present on GET & POST; absent on PATCH
};

export type SalaryRecord = {
    id: number;
    employee_id: number;
    payroll_month: number;
    payroll_year: number;
    base_salary: string;
    allowances: string;
    deductions: string;
    gross_salary: string;
    net_salary: string;
    total_days: number;
    working_days: number;
    paid_days: number;
    unpaid_days: number;
    payment_date: string | null;
    payment_status: string;
    added_by: string;
};

export type AddBasePayPayload = {
    employee_id: number;
    base_salary: string;
    allowances?: string;
};

export type EditBasePayPayload = {
    employee_id: number;
    base_salary?: string;
    allowances?: string;
    remark: string;
};

export type AddSalaryPayload = {
    employee_id: number;
    payroll_month: number;
    payroll_year: number;
    total_days: number;
    working_days: number;
    paid_days: number;
    unpaid_days: number;
};

export type EditSalaryPayload = {
    id: number;
    total_days?: number;
    working_days?: number;
    paid_days?: number;
    unpaid_days?: number;
};

export type ConfirmPaymentPayload = {
    id: number;
    payment_status: "PROCESSED" | "HOLD";
};

// ─── State ────────────────────────────────────────────────────────────────────

interface SalaryState {
    basePayLoading: boolean;
    basePay: BasePay | null;
    basePayNotFound: boolean;
    mutating: boolean;          // base-pay add / edit
    salaryListLoading: boolean;
    salaryList: SalaryRecord[];
    salaryMutating: boolean;    // monthly salary add / edit
}

const initialState: SalaryState = {
    basePayLoading: false,
    basePay: null,
    basePayNotFound: false,
    mutating: false,
    salaryListLoading: false,
    salaryList: [],
    salaryMutating: false,
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

export const getSalaryList = createAsyncThunk(
    "salary/getSalaryList",
    async (employeeId: number, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${baseUrl}/salary/employee/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data as SalaryRecord[];
        } catch (err: any) {
            errorToast(err);
            return rejectWithValue(err?.response?.data?.detail || "Something went wrong!");
        }
    }
);

export const addSalary = createAsyncThunk(
    "salary/addSalary",
    async (payload: AddSalaryPayload, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${baseUrl}/salary`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Salary record added successfully!");
            return res.data as SalaryRecord;
        } catch (err: any) {
            errorToast(err);
            return rejectWithValue(err?.response?.data?.detail || "Something went wrong!");
        }
    }
);

export const editSalary = createAsyncThunk(
    "salary/editSalary",
    async ({ id, ...payload }: EditSalaryPayload, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.patch(`${baseUrl}/salary/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Salary record updated successfully!");
            return res.data as SalaryRecord;
        } catch (err: any) {
            errorToast(err);
            return rejectWithValue(err?.response?.data?.detail || "Something went wrong!");
        }
    }
);

export const confirmPayment = createAsyncThunk(
    "salary/confirmPayment",
    async ({ id, ...payload }: ConfirmPaymentPayload, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.patch(`${baseUrl}/salary/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success(
                payload.payment_status === "PROCESSED"
                    ? "Payment marked as processed!"
                    : "Payment placed on hold."
            );
            return res.data as SalaryRecord;
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
            state.salaryList = [];
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

            // addBasePay
            .addCase(addBasePay.pending,   (state) => { state.mutating = true; })
            .addCase(addBasePay.fulfilled, (state, action: PayloadAction<BasePay>) => {
                state.mutating = false;
                state.basePay = action.payload;
                state.basePayNotFound = false;
            })
            .addCase(addBasePay.rejected,  (state) => { state.mutating = false; })

            // editBasePay — preserve employee from initial GET
            .addCase(editBasePay.pending,   (state) => { state.mutating = true; })
            .addCase(editBasePay.fulfilled, (state, action: PayloadAction<BasePay>) => {
                state.mutating = false;
                state.basePay = {
                    ...action.payload,
                    employee: action.payload.employee ?? state.basePay?.employee,
                };
            })
            .addCase(editBasePay.rejected,  (state) => { state.mutating = false; })

            // getSalaryList
            .addCase(getSalaryList.pending,   (state) => { state.salaryListLoading = true; })
            .addCase(getSalaryList.fulfilled, (state, action: PayloadAction<SalaryRecord[]>) => {
                state.salaryListLoading = false;
                state.salaryList = action.payload;
            })
            .addCase(getSalaryList.rejected,  (state) => { state.salaryListLoading = false; })

            // addSalary — prepend to list so the new record appears at top
            .addCase(addSalary.pending,   (state) => { state.salaryMutating = true; })
            .addCase(addSalary.fulfilled, (state, action: PayloadAction<SalaryRecord>) => {
                state.salaryMutating = false;
                state.salaryList = [action.payload, ...state.salaryList];
            })
            .addCase(addSalary.rejected,  (state) => { state.salaryMutating = false; })

            // editSalary — replace the matching record in the list
            .addCase(editSalary.pending,   (state) => { state.salaryMutating = true; })
            .addCase(editSalary.fulfilled, (state, action: PayloadAction<SalaryRecord>) => {
                state.salaryMutating = false;
                state.salaryList = state.salaryList.map((r) =>
                    r.id === action.payload.id ? action.payload : r
                );
            })
            .addCase(editSalary.rejected,  (state) => { state.salaryMutating = false; })

            // confirmPayment — same: replace the matching record
            .addCase(confirmPayment.pending,   (state) => { state.salaryMutating = true; })
            .addCase(confirmPayment.fulfilled, (state, action: PayloadAction<SalaryRecord>) => {
                state.salaryMutating = false;
                state.salaryList = state.salaryList.map((r) =>
                    r.id === action.payload.id ? action.payload : r
                );
            })
            .addCase(confirmPayment.rejected,  (state) => { state.salaryMutating = false; });
    },
});

export const { clearBasePay } = salarySlice.actions;
export default salarySlice.reducer;
