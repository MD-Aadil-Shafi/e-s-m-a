/**
 * Generic, slice-agnostic filter bar.
 *
 * Usage — define a FilterConfig in the parent and pass it in:
 *
 *   const [filters, setFilters] = useState<Record<string,any>>({})
 *
 *   <Filter config={{
 *     fields: [
 *       { type:'select', key:'country',         label:'Country',  options:[...] },
 *       { type:'select', key:'employment_type', label:'Type',     options:[...] },
 *       { type:'radio',  key:'order',           label:'Order',
 *         options:[{value:'desc',label:'Newest'},{value:'asc',label:'Oldest'}] },
 *       { type:'date',   key:'start_date',      label:'From' },
 *       { type:'date',   key:'end_date',        label:'To', disabledIf:'start_date' },
 *     ],
 *     queryData: filters,
 *     setQueryData: setFilters,
 *   }} />
 *
 * Field types
 * ───────────
 * select  — Ant Design Select with allowClear
 * radio   — inline pill-style button group (good for fixed option sets like order/status)
 * date    — date input; set disabledIf to another key to block until that key has a value
 */

import { useState } from 'react';
import { Button, Input, Select } from 'antd';
import { FaFilter, FaEraser } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';

// ─── Public types (import these in consumer files) ───────────────────────────

export type SelectField = {
    type: 'select';
    key: string;
    label: string;
    options: { value: string; label: string }[];
    placeholder?: string;
    width?: number;
};

export type RadioField = {
    type: 'radio';
    key: string;
    label: string;
    options: { value: string; label: string }[];
};

export type DateField = {
    type: 'date';
    key: string;
    label: string;
    /** Disable this field until the named key has a value */
    disabledIf?: string;
};

export type FilterField = SelectField | RadioField | DateField;

export type FilterConfig = {
    fields: FilterField[];
    queryData: Record<string, any>;
    setQueryData: (q: Record<string, any>) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = { config: FilterConfig };

const Filter = ({ config }: Props) => {
    const { fields, queryData, setQueryData } = config;
    const [open, setOpen] = useState(false);

    const hasActiveFilter = fields.some(
        (f) => queryData[f.key] !== undefined && queryData[f.key] !== ''
    );

    const set = (key: string, value: any) => {
        const q = { ...queryData };
        if (value === undefined || value === null || value === '') {
            delete q[key];
        } else {
            q[key] = value;
        }
        setQueryData(q);
    };

    return (
        <section className='flex justify-end items-center gap-3 mt-1 flex-wrap'>

            {/* ── Filter fields (shown when open) ── */}
            {open && (
                <div className='flex gap-3 items-end flex-wrap'>
                    {fields.map((field) => (
                        <div key={field.key} className='flex flex-col gap-1'>
                            <label className='text-xs text-slate-500'>{field.label}</label>

                            {/* SELECT */}
                            {field.type === 'select' && (
                                <Select
                                    allowClear
                                    placeholder={field.placeholder ?? `All`}
                                    style={{ width: field.width ?? 180, height: 30 }}
                                    options={field.options}
                                    value={queryData[field.key] ?? undefined}
                                    onChange={(val) => set(field.key, val)}
                                />
                            )}

                            {/* RADIO (pill group) */}
                            {field.type === 'radio' && (
                                <div className='flex'>
                                    {field.options.map((opt, i) => {
                                        const active = queryData[field.key] === opt.value;
                                        const isFirst = i === 0;
                                        const isLast  = i === field.options.length - 1;
                                        return (
                                            <button
                                                key={opt.value}
                                                type='button'
                                                onClick={() =>
                                                    set(field.key, active ? undefined : opt.value)
                                                }
                                                className={[
                                                    'px-3 py-[3px] text-xs border transition-colors',
                                                    isFirst  ? 'rounded-l' : '',
                                                    isLast   ? 'rounded-r' : '',
                                                    !isFirst ? '-ml-px'    : '',
                                                    active
                                                        ? 'bg-purple-500 text-white border-purple-500 z-10'
                                                        : 'bg-white text-slate-600 border-slate-300 hover:border-purple-400 hover:text-purple-500',
                                                ].join(' ')}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* DATE */}
                            {field.type === 'date' && (
                                <Input
                                    type='date'
                                    style={{ width: 180, height: 30 }}
                                    value={queryData[field.key] ?? ''}
                                    disabled={
                                        field.disabledIf
                                            ? !queryData[field.disabledIf]
                                            : false
                                    }
                                    onChange={(e) => set(field.key, e.target.value || undefined)}
                                />
                            )}
                        </div>
                    ))}

                    {/* Clear button — only when at least one filter is active */}
                    {hasActiveFilter && (
                        <Button
                            htmlType='button'
                            size='small'
                            className='flex items-center gap-1'
                            onClick={() => setQueryData({})}
                        >
                            <FaEraser size={11} /> Clear
                        </Button>
                    )}
                </div>
            )}

            {/* ── Toggle button ── */}
            <Button
                htmlType='button'
                size='small'
                type='primary'
                danger={open}
                className='flex items-center gap-1'
                onClick={() => setOpen((v) => !v)}
            >
                {open ? <MdClose size={14} /> : <FaFilter size={11} />}
                {open ? 'Close' : 'Filter'}
                {/* Badge showing active filter count when closed */}
                {!open && hasActiveFilter && (
                    <span className='ml-1 bg-white text-purple-600 rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center'>
                        {fields.filter((f) => queryData[f.key] !== undefined && queryData[f.key] !== '').length}
                    </span>
                )}
            </Button>
        </section>
    );
};

export default Filter;
