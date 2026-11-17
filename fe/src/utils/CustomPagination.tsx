import type { PaginationProps } from 'antd';
import { Pagination } from 'antd';

type pageType = {
  page:{
    last: boolean,
    pageNo: number,
    pageSize: number,
    totalElements: number,
    totalPages: number
  },
  handlePage: any;
 
}

const CustomPagination = ({page, handlePage}:pageType) => {

    const onChange: PaginationProps['onChange'] = (pageNumber, pageSize) => {
        console.log('Page: ', pageNumber, pageSize);
        handlePage(pageNumber -1, pageSize)
      };

  return (
    <div className='flex justify-end'>
        <div className='p-1 shadow rounded'>
    <Pagination
    responsive={true}
    size='small'
    showQuickJumper defaultCurrent={0} total={page.totalElements} pageSize={page?.pageSize} onChange={onChange} />
    </div>
    </div>
  )
}

export default CustomPagination