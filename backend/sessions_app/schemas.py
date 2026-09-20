"""
Pydantic v2 schemas for UserProfile.
Mirrors the TypeScript UserProfile interface in src/types/index.ts exactly.
All fields are Optional to allow partial profiles.
"""
from typing import Literal, Optional, Union

from pydantic import BaseModel, Field, field_validator


Gender = Literal["male", "female", "other", "all", "Male", "Female", "Other", "Prefer not to say", ""]
Category = Literal[
    "General", "OBC", "SC", "ST", "EWS", "Minority", "All",
    "Other", "Prefer not to say", "",
]
EmploymentType = Literal[
    "Student", "Farmer", "Business owner", "Employed", "Unemployed",
    "Self-employed", "Homemaker", "Retired", "Other",
    "GOVERNMENT", "PRIVATE", "Government", "Private", "",
]
IncomeRange = Literal[
    "Below ₹1 lakh", "₹1–2.5 lakh", "₹2.5–5 lakh",
    "₹5–10 lakh", "₹10 lakh+", "Prefer not to say", "",
]
AreaType = Literal["Urban", "Rural", "Semi-Urban", "All", ""]


class UserProfileSchema(BaseModel):
    model_config = {"extra": "ignore"}

    id: Optional[str] = None
    name: Optional[str] = None
    age: Optional[Union[int, str]] = None
    gender: Optional[Gender] = None
    state: Optional[str] = None
    district: Optional[str] = None
    area_type: Optional[AreaType] = Field(None, alias="areaType")
    residence_area: Optional[AreaType] = Field(None, alias="residenceArea")
    category: Optional[Category] = None
    is_disability: Optional[bool] = Field(None, alias="isDisability")
    has_disability: Optional[bool] = Field(None, alias="hasDisability")
    disability_percentage: Optional[int] = Field(None, alias="disabilityPercentage")
    is_minority: Optional[bool] = Field(None, alias="isMinority")
    has_bpl_card: Optional[bool] = Field(None, alias="hasBPLCard")
    is_bpl: Optional[bool] = Field(None, alias="isBPL")
    employment_status: Optional[str] = Field(None, alias="employmentStatus")
    employment_type: Optional[EmploymentType] = Field(None, alias="employmentType")
    occupation: Optional[str] = None
    student_course: Optional[str] = Field(None, alias="studentCourse")
    farmer_land_acre: Optional[float] = Field(None, alias="farmerLandAcre")
    business_stage: Optional[str] = Field(None, alias="businessStage")
    annual_income: Optional[Union[int, float, str]] = Field(None, alias="annualIncome")
    income_range: Optional[IncomeRange] = Field(None, alias="incomeRange")
    completed_at: Optional[str] = Field(None, alias="completedAt")

    @field_validator("area_type", "residence_area", mode="before")
    @classmethod
    def coerce_area_type(cls, v):
        if not v:
            return ""
        s = str(v).strip().lower()
        if s == "urban":
            return "Urban"
        if s == "rural":
            return "Rural"
        if s in ["semi-urban", "semi_urban"]:
            return "Semi-Urban"
        if s == "all":
            return "All"
        return v

    @field_validator("employment_type", mode="before")
    @classmethod
    def coerce_emp_type(cls, v):
        if not v:
            return ""
        s = str(v).strip().lower()
        mapping = {
            "student": "Student",
            "farmer": "Farmer",
            "business owner": "Business owner",
            "business_owner": "Business owner",
            "business": "Business owner",
            "employed": "Employed",
            "unemployed": "Unemployed",
            "self-employed": "Self-employed",
            "self_employed": "Self-employed",
            "homemaker": "Homemaker",
            "retired": "Retired",
            "other": "Other",
            "government": "Government",
            "private": "Private",
        }
        return mapping.get(s, v)

    @field_validator("age", mode="before")
    @classmethod
    def coerce_age(cls, v):
        if v == "" or v is None:
            return None
        try:
            return int(v)
        except (TypeError, ValueError):
            return None

    @field_validator("annual_income", mode="before")
    @classmethod
    def coerce_income(cls, v):
        if v == "" or v is None:
            return None
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    def to_frontend_dict(self) -> dict:
        """
        Serialise to camelCase dict matching the TypeScript UserProfile interface.
        """
        return self.model_dump(by_alias=True, exclude_none=True)
