
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.logs import Log


async def add_employee_log(
    db: AsyncSession,
    employee_id: int,
    message: str,
    position: str = "last"
):
    try:
        result = await db.execute(
            select(Log).where(Log.employee_id == employee_id)
        )

        log_record = result.scalar_one_or_none()

        if not log_record:
            log_record = Log(
                employee_id=employee_id,
                logs=[message]
            )
            db.add(log_record)
        else:
            logs = list(log_record.logs or [])

            if position == "first":
                logs.insert(0, message)
            else:
                logs.append(message)

            log_record.logs = logs

        await db.commit()

        return log_record
    
    except Exception as e:
        print("log error => : ", e)
        await db.rollback()
        raise
