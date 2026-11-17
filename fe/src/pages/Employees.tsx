import React from 'react'
import EmployeeTable from '../components/employee/EmployeeTable'
import { Helmet } from 'react-helmet'

const Employee = () => {
  return (
    <>
    <Helmet>
      <title>CI | Employees</title>
    </Helmet>
    <EmployeeTable/>
    </>
  )
}

export default Employee