
import {  Modal } from 'antd';

type formModal = {
    open: boolean,
    setOpen: any,
    content: any,
}

const FormModal = ({open, setOpen, content}: formModal) => {

  return (
    <Modal
    centered
    open={open}
    onOk={() => setOpen(false)}
    onCancel={() => setOpen(false)}
    width={1000}
    maskClosable={false}
    footer={false}
  >
  {content}
  </Modal>
  )
}

export default FormModal