import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Spin, Timeline, Tag } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../redux/useTypedSelectors";
import { getEmployeeLogs, clearLogs } from "../redux/reducers/employeeSlice";

const EmployeeLogs = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const { logsLoading, employeeLogs } = useAppSelector((state) => state.employee);

    useEffect(() => {
        if (id) {
            dispatch(getEmployeeLogs(Number(id)));
        }
        return () => {
            dispatch(clearLogs());
        };
    }, [id]);

    // Set browser tab title once data is available
    useEffect(() => {
        if (employeeLogs?.employee) {
            const { firstname, lastname } = employeeLogs.employee;
            document.title = `${firstname} ${lastname} — Logs`;
        }
        return () => {
            document.title = "Employee Management";
        };
    }, [employeeLogs]);

    const employee = employeeLogs?.employee;

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => window.close()}
                    className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors"
                >
                    <CloseOutlined /> Close Tab
                </button>

                <div>
                    <h2 className="text-xl font-bold">
                        {employee ? `${employee.firstname} ${employee.lastname}` : "Employee Logs"}
                    </h2>
                    {employee && (
                        <p className="text-slate-400 text-sm">
                            {employee.designation} · {employee.department} · {employee.email}
                        </p>
                    )}
                </div>
            </div>

            {/* Content */}
            {logsLoading ? (
                <div className="flex justify-center items-center min-h-[60vh]">
                    <Spin size="large" />
                </div>
            ) : (
                <div className="w-full">
                    {employeeLogs?.logs && employeeLogs.logs.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-slate-500 text-sm">
                                    Last updated:{" "}
                                    {new Date(employeeLogs.updated_at).toLocaleString()}
                                </span>
                                <Tag color="purple">{employeeLogs.logs.length} entries</Tag>
                            </div>

                            <Timeline
                                items={employeeLogs.logs.map((log, index) => ({
                                    key: index,
                                    color: "purple",
                                    children: (
                                        <div className="bg-slate-50 rounded px-3 py-2 shadow-sm border border-slate-100">
                                            <p className="text-slate-700 text-sm">{log}</p>
                                        </div>
                                    ),
                                }))}
                            />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
                            <p className="text-lg">No logs found for this employee.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmployeeLogs;
