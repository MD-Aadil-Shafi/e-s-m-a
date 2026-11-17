import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from 'antd';
import { IoAdd } from 'react-icons/io5';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { TbLogs } from 'react-icons/tb';
import { PiMoney } from 'react-icons/pi';
import { BiDetail } from 'react-icons/bi';
import type { MenuProps } from 'antd';

import RenderTableAction from '../../utils/RenderTableAction';
import CustomPagination from '../../utils/CustomPagination';
import FormModal from '../../utils/FormModal';
import Filter from '../../utils/Filters';
import type { FilterConfig } from '../../utils/Filters';
import { customTailwind } from '../../utils/styles';
import { useAppDispatch, useAppSelector } from '../../redux/useTypedSelectors';
import { getEmployees } from '../../redux/reducers/employeeSlice';
import type { Employee, EmployeeQueryParams } from '../../redux/reducers/employeeSlice';
import AddEmployeeForm from './modals/AddEmployeeForm';
import EditEmployeeForm from './modals/EditEmployeeForm';

export type ActionItemType = NonNullable<MenuProps['items']>[number];

// ─── Filter field definitions (static — no slice needed) ─────────────────────

const EMPLOYEE_FILTER_FIELDS: FilterConfig['fields'] = [
    {
        type: 'select',
        key: 'employment_type',
        label: 'Employment Type',
        placeholder: 'All types',
        options: [
            { value: 'fulltime', label: 'Full-Time' },
            { value: 'parttime', label: 'Part-Time' },
            { value: 'contract', label: 'Contract' },
        ],
    },
    {
        type: 'select',
        key: 'country',
        label: 'Country',
        placeholder: 'All countries',
        options: [
            { value: 'India',          label: 'India' },
            { value: 'United States',  label: 'United States' },
            { value: 'United Kingdom', label: 'United Kingdom' },
            { value: 'Canada',         label: 'Canada' },
            { value: 'Australia',      label: 'Australia' },
        ],
    },
    {
        type: 'radio',
        key: 'order',
        label: 'Sort',
        options: [
            { value: 'desc', label: 'Newest' },
            { value: 'asc',  label: 'Oldest' },
        ],
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

const EmployeeTable = () => {
    const dispatch  = useAppDispatch();
    const navigate  = useNavigate();
    const { loading, employees, pagination } = useAppSelector((s) => s.employee);

    // ── Local state ──────────────────────────────────────────────────────────
    const [search,      setSearch]      = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageLimit]                   = useState(20);

    // Filter state — keys match EmployeeQueryParams (minus page/limit/search)
    const [filters, setFilters] = useState<Record<string, any>>({ order: 'desc' });

    // Modal state
    const [addOpen,        setAddOpen]        = useState(false);
    const [editOpen,       setEditOpen]        = useState(false);
    const [initialValues,  setInitialValues]   = useState<Employee | null>(null);

    // ── Fetch helper ─────────────────────────────────────────────────────────
    const fetchEmployees = (page: number, searchTerm: string, extraFilters: Record<string, any>) => {
        const params: EmployeeQueryParams = {
            page,
            limit:  pageLimit,
            order:  'desc',
            ...extraFilters,
            ...(searchTerm ? { search: searchTerm } : {}),
        };
        dispatch(getEmployees(params));
    };

    // ── Single effect: debounce search, immediate on page/filter change ──────
    useEffect(() => {
        const delay = search ? 600 : 0;
        const timer = setTimeout(() => {
            fetchEmployees(currentPage, search, filters);
        }, delay);
        return () => clearTimeout(timer);
    }, [search, currentPage, filters]);

    // ── When filters change reset to page 1 ──────────────────────────────────
    const handleFilterChange = (newFilters: Record<string, any>) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handlePage = (pageNo: number) => setCurrentPage(pageNo);

    const handleAddSuccess = () => {
        setAddOpen(false);
        fetchEmployees(currentPage, search, filters);
    };

    const handleEditSuccess = () => {
        setEditOpen(false);
        fetchEmployees(currentPage, search, filters);
    };

    const openEdit = (val: Employee) => {
        setInitialValues(val);
        setEditOpen(true);
    };

    // ── Columns ──────────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'Id',
            dataIndex: 'id',
            key: 'id',
            width: '70px',
            sorter: (a: Employee, b: Employee) => a.id - b.id,
        },
        {
            title: 'Name',
            key: 'name',
            width: '150px',
            render: (_: any, row: Employee) => `${row.firstname} ${row.lastname}`,
        },
        { title: 'City',        dataIndex: 'city',         key: 'city',         width: '120px' },
        { title: 'State',       dataIndex: 'state',        key: 'state',        width: '120px' },
        { title: 'Country',     dataIndex: 'country',      key: 'country',      width: '120px' },
        { title: 'Designation', dataIndex: 'designation',  key: 'designation',  width: '180px' },
        { title: 'Email',       dataIndex: 'email',        key: 'email',        width: '190px' },
        { title: 'Contact No.', dataIndex: 'phone_number', key: 'phone_number', width: '150px' },
        { title: 'Department',  dataIndex: 'department',   key: 'department',   width: '120px' },
        {
            title: 'Joined At',
            dataIndex: 'joining_date',
            key: 'joining_date',
            width: '130px',
            render: (d: string) => <p>{new Date(d).toDateString()}</p>,
        },
        {
            title: 'Action',
            width: '120px',
            render: (_: any, data: Employee) => {
                const items: ActionItemType[] = [
                    {
                        label: 'Edit',
                        key: 1,
                        icon: <EditOutlined />,
                        onClick: () => openEdit(data),
                    },
                    {
                        label: 'View Logs',
                        key: 2,
                        icon: <TbLogs />,
                        onClick: () => navigate(`/employees/${data.id}/logs`),
                    },
                    {
                        label: 'Promote',
                        key: 3,
                        icon: <PiMoney />,
                        onClick: () => {},            // placeholder
                    },
                    {
                        label: 'View Full Detail',
                        key: 4,
                        icon: <BiDetail />,
                        onClick: () => {},            // placeholder
                    },
                    {
                        label: 'Delete',
                        key: 5,
                        danger: true,
                        icon: <DeleteOutlined />,
                        onClick: () => {},            // placeholder
                    },
                ];
                return <RenderTableAction items={items} />;
            },
        },
    ];

    const paginationProp = {
        last:          pagination.page * pagination.limit >= pagination.total,
        pageNo:        pagination.page,
        pageSize:      pagination.limit,
        totalElements: pagination.total,
        totalPages:    Math.ceil(pagination.total / pagination.limit),
    };

    // ── Filter config passed to <Filter> ────────────────────────────────────
    const filterConfig: FilterConfig = {
        fields:       EMPLOYEE_FILTER_FIELDS,
        queryData:    filters,
        setQueryData: handleFilterChange,
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── Top bar ── */}
            <div className='flex justify-between items-center mb-2'>
                <h3 className='text-xl'>Employees</h3>

                <div className='flex gap-3 items-center'>
                    <input
                        type='search'
                        placeholder='Search by name or email...'
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        value={search}
                        className='custom-inputs'
                    />
                    <button
                        onClick={() => setAddOpen(true)}
                        className={`${customTailwind.purpleGradient} text-white px-3 py-1 shadow rounded flex items-center gap-1`}
                    >
                        <IoAdd size={20} /> Add New
                    </button>
                </div>
            </div>

            {/* ── Filter bar ── */}
            <Filter config={filterConfig} />

            {/* ── Table ── */}
            <div className='min-h-[72vh] mt-2'>
                <Table
                    dataSource={employees}
                    columns={columns}
                    rowKey={(x) => x.id}
                    pagination={false}
                    loading={loading}
                    bordered
                    scroll={{ y: 520 }}
                />
            </div>

            <CustomPagination page={paginationProp} handlePage={handlePage} />

            {/* ── Add modal ── */}
            <FormModal
                open={addOpen}
                setOpen={setAddOpen}
                content={
                    <AddEmployeeForm
                        handleClose={() => setAddOpen(false)}
                        onSuccess={handleAddSuccess}
                    />
                }
            />

            {/* ── Edit modal ── */}
            <FormModal
                open={editOpen}
                setOpen={setEditOpen}
                content={
                    initialValues && (
                        <EditEmployeeForm
                            initialValues={initialValues}
                            handleClose={() => setEditOpen(false)}
                            onSuccess={handleEditSuccess}
                        />
                    )
                }
            />
        </>
    );
};

export default EmployeeTable;
