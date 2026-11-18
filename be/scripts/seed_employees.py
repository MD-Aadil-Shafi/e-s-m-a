import asyncio
import random
from datetime import date, timedelta
from faker import Faker
from app.db.session import AsyncSessionLocal
from app.models.employee import Employee
from app.enums.employment_type import EmploymentType

fake = Faker("en_IN")

TOTAL_EMPLOYEES = 10000
BATCH_SIZE = 1000

DEPARTMENTS = [
    "Engineering", "Human Resources", "Finance",
    "Marketing", "Sales", "Operations", "IT",
]

DESIGNATIONS = [
    "Software Engineer", "Senior Engineer",
    "Team Lead", "Project Manager", "HR Manager",
    "Accountant", "Business Analyst",
]

COUNTRIES = {
    "India": {
        "Uttar Pradesh": ["Kanpur", "Lucknow", "Noida"],
        "Maharashtra": ["Mumbai", "Pune"],
        "Karnataka": ["Bangalore", "Mysore"],
    },
    "USA": {
        "California": ["Los Angeles", "San Francisco"],
        "Texas": ["Houston", "Dallas"],
    },
    "UK": {
        "England": ["London", "Manchester"],
    },
}


def generate_employee(index: int) -> Employee:
    firstname = fake.first_name()[:12]
    lastname = fake.last_name()[:12]

    country = random.choice(list(COUNTRIES))
    state = random.choice(list(COUNTRIES[country]))
    city = random.choice(COUNTRIES[country][state])

    return Employee(
        firstname=firstname,
        lastname=lastname,
        email=f"employee{index}@example.com",
        country=country,
        state=state,
        city=city,
        zipcode=fake.postcode()[:10],
        address=fake.street_address()[:255],
        phone_number=fake.phone_number()[:15],
        department=random.choice(DEPARTMENTS),
        designation=random.choice(DESIGNATIONS),
        employment_type=random.choice(list(EmploymentType)),
        joining_date=fake.date_between(
            start_date=date.today() - timedelta(days=3650),
            end_date=date.today()
        ),
    )


async def seed_employees():
    async with AsyncSessionLocal() as db:
        try:
            for start in range(0, TOTAL_EMPLOYEES, BATCH_SIZE):

                employees = [
                    generate_employee(i)
                    for i in range(
                        start + 1,
                        min(start + BATCH_SIZE, TOTAL_EMPLOYEES) + 1
                    )
                ]

                db.add_all(employees)
                await db.commit()

                print(
                    f"Inserted {min(start + BATCH_SIZE, TOTAL_EMPLOYEES)}"
                    f" / {TOTAL_EMPLOYEES}"
                )

            print("Successfully inserted 10,000 employees!")

        except Exception:
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(seed_employees())


# To run : 
# python -m scripts.seed_employees