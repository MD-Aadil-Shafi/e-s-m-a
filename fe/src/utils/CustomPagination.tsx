import type { PaginationProps } from 'antd';
import { Pagination } from 'antd';

type pageType = {
    page: {
        last: boolean;
        pageNo: number;
        pageSize: number;
        totalElements: number;
        totalPages: number;
    };
    handlePage: (pageNo: number, pageSize: number) => void;
};

const CustomPagination = ({ page, handlePage }: pageType) => {

    const onChange: PaginationProps['onChange'] = (pageNumber, pageSize) => {
        handlePage(pageNumber, pageSize);
    };

    return (
        <div className='flex justify-end mt-2'>
            <div className='p-1 shadow rounded'>
                <Pagination
                    responsive
                    size='small'
                    showQuickJumper
                    showSizeChanger
                    pageSizeOptions={[20, 50, 100]}
                    current={page.pageNo}
                    total={page.totalElements}
                    pageSize={page.pageSize}
                    onChange={onChange}
                />
            </div>
        </div>
    );
};

export default CustomPagination;
