import { Result } from 'antd';
import { TeamOutlined } from '@ant-design/icons';

const Salaries = () => {
    return (
        <div className="flex justify-center items-center min-h-[70vh]">
            <Result
                icon={<TeamOutlined style={{ color: '#a855f7' }} />}
                title="No Employee Selected"
                subTitle="Go to the Employees page, select an employee from the table, and click View Full Detail to view their salary records."
            />
        </div>
    );
};

export default Salaries;
