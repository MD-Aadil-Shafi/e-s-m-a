import { type formModalType } from '../../../utils/types'
import FormModal from '../../../utils/FormModal'
import ConfirmModal from '../../../utils/ConfirmModal'
import GenericConfirmModal from '../../../utils/GenericConfirm'
import AddEmployeeForm from './AddEmployeeForm'
import PromoteForm from './Promote'
import TransferForm from './Transfer'
import View from './View'
import EditEmployeeForm from './EditEmployeeForm'

const ActionModal = ({open, setOpen, handleAction, title, initialValues}:formModalType) => {

    const handleClose = () =>{
        setOpen(false)
     }

     const renderItem = () =>{
        if(title === "Add Employee"){
            return <AddEmployeeForm
                    handleAction={handleAction}
                    handleClose={handleClose}
                    title={title}
                    initialValues={initialValues}
                    />
        }
        if(title === "Edit Employee"){
            return <EditEmployeeForm
                    handleAction={handleAction}
                    handleClose={handleClose}
                    title={title}
                    initialValues={initialValues}
                    />
        }
        if(title === "Delete Employee"){
          return <ConfirmModal
                    handleAction={handleAction}
                    handleClose={handleClose}
                    title={title}
                    initialValues={initialValues}
          />
        }
        if(title === "Approve" || title === "Reject" || title === "Make Active" || title === "Make In-Active"){
          return <GenericConfirmModal
                    handleAction={handleAction}
                    handleClose={handleClose}
                    title={title}
                    initialValues={initialValues}
          />
        }
        if(title === "Promote"){
          return <PromoteForm
                  handleAction={handleAction}
                  handleClose={handleClose}
                  title={title}
                  initialValues={initialValues}
          />
        }
        if(title === "Transfer"){
          return <TransferForm
                  handleAction={handleAction}
                  handleClose={handleClose}
                  title={title}
                  initialValues={initialValues}
          />
        }
        if(title === "View Full Detail"){
          return <View
                  handleClose={handleClose}
                  title={title}
                  initialValues={initialValues}
          />
        }
    }
  return (
    <FormModal
    open={open}
    setOpen={setOpen}
    content={renderItem()}
    />
  )
}

export default ActionModal