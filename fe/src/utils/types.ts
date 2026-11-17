import { type ReactNode } from "react";

export type formModalType = {
    open: boolean,
    setOpen: any,
    title: string,
    handleAction?:any,
    initialValues?:any,
}

export type formType = {
    handleAction: any,
    handleClose: any,
    title: string,
    initialValues: any,
}
export type viewFormType = {
    handleClose: any,
    title: string,
    initialValues: any,
}

