import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { baseUrl } from "../baseUrl";
import { toast } from "react-toastify";
import { errorToast } from "../../utils/actionToast";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Employee = {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    country: string;
    state: string;
    city: string;
    zipcode: string;
    address: string;
    phone_number: string;
    department: string;
    designation: string;
    joining_date: string;
    created_at: string;
    added_by: string;
};

export type AddEmployeePayload = {
    firstname: string;
    lastname: string;
    email: string;
    country: string;
    state: string;
    city: string;
    zipcode: string;
    address: string;
    phone_number: string;
    department: string;
    designation: string;
    joining_date: string;
};

export type EditEmployeePayload = {
    id: number;
    firstname?: string;
    lastname?: string;
    email?: string;
    country?: string;
    state?: string;
    city?: string;
    zipcode?: string;
    address?: string;
    phone_number?: string;
    department?: string;
    designation?: string;
    joining_date?: string;
};

export type EmployeeQueryParams = {
    page?: number;
    limit?: number;
    search?: string;
    country?: string;
    employment_type?: "fulltime" | "parttime" | "contract" | "";
    order?: "asc" | "desc";
};

export type EmployeePagination = {
    total: number;
    page: number;
    limit: number;
};

export type EmployeeLog = {
    id: number;
    employee_id: number;
    logs: string[] | null;
    updated_at: string;
    employee: Employee;
};

// ─── State ────────────────────────────────────────────────────────────────────

interface EmployeeState {
    loading: boolean;
    employees: Employee[];
    pagination: EmployeePagination;
    logsLoading: boolean;
    employeeLogs: EmployeeLog | null;
}

const initialState: EmployeeState = {
    loading: false,
    employees: [],
    pagination: { total: 0, page: 1, limit: 20 },
    logsLoading: false,
    employeeLogs: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const getEmployees = createAsyncThunk(
    "employee/getAll",
    async (params: EmployeeQueryParams = {}, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const query = new URLSearchParams();
            if (params.page)            query.set("page",            String(params.page));
            if (params.limit)           query.set("limit",           String(params.limit));
            if (params.search)          query.set("search",          params.search);
            if (params.country)         query.set("country",         params.country);
            if (params.employment_type) query.set("employment_type", params.employment_type);
            if (params.order)           query.set("order",           params.order);

            const res = await axios.get(`${baseUrl}/employee?${query.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data;
        } catch (err: any) {
            errorToast(err);
            return rejectWithValue(err?.response?.data?.detail || "Something went wrong!");
        }
    }
);

export const addEmployee = createAsyncThunk(
    "employee/add",
    async (payload: AddEmployeePayload, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${baseUrl}/employee`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Employee added successfully!");
            return res.data;
        } catch (err: any) {
            errorToast(err);
            return rejectWithValue(err?.response?.data?.detail || "Something went wrong!");
        }
    }
);

export const editEmployee = createAsyncThunk(
    "employee/edit",
    async ({ id, ...payload }: EditEmployeePayload, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.patch(`${baseUrl}/employee/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Employee updated successfully!");
            return res.data;
        } catch (err: any) {
            errorToast(err);
            return rejectWithValue(err?.response?.data?.detail || "Something went wrong!");
        }
    }
);

export const getEmployeeLogs = createAsyncThunk(
    "employee/getLogs",
    async (employeeId: number, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${baseUrl}/employee/logs/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data as EmployeeLog;
        } catch (err: any) {
            errorToast(err);
            return rejectWithValue(err?.response?.data?.detail || "Something went wrong!");
        }
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const employeeSlice = createSlice({
    name: "employee",
    initialState,
    reducers: {
        clearLogs: (state) => {
            state.employeeLogs = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // getEmployees
            .addCase(getEmployees.pending,   (state) => { state.loading = true; })
            .addCase(getEmployees.fulfilled, (state, action: PayloadAction<{ total: number; page: number; limit: number; items: Employee[] }>) => {
                state.loading    = false;
                state.employees  = action.payload.items;
                state.pagination = {
                    total: action.payload.total,
                    page:  action.payload.page,
                    limit: action.payload.limit,
                };
            })
            .addCase(getEmployees.rejected,  (state) => { state.loading = false; })

            // addEmployee
            .addCase(addEmployee.pending,   (state) => { state.loading = true; })
            .addCase(addEmployee.fulfilled, (state) => { state.loading = false; })
            .addCase(addEmployee.rejected,  (state) => { state.loading = false; })

            // editEmployee
            .addCase(editEmployee.pending,   (state) => { state.loading = true; })
            .addCase(editEmployee.fulfilled, (state) => { state.loading = false; })
            .addCase(editEmployee.rejected,  (state) => { state.loading = false; })

            // getEmployeeLogs
            .addCase(getEmployeeLogs.pending,   (state) => { state.logsLoading = true; })
            .addCase(getEmployeeLogs.fulfilled, (state, action: PayloadAction<EmployeeLog>) => {
                state.logsLoading  = false;
                state.employeeLogs = action.payload;
            })
            .addCase(getEmployeeLogs.rejected,  (state) => { state.logsLoading = false; });
    },
});

export const { clearLogs } = employeeSlice.actions;
export default employeeSlice.reducer;
