from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, PositiveFloat, field_validator, model_validator


# Enumeraciones cerradas para alinear los valores válidos con el CONTEXT.
class SupplierCountry(str, Enum):
    SPAIN = "Spain"
    USA = "USA"


class SupplierCurrency(str, Enum):
    EUR = "EUR"
    USD = "USD"


class SupplierStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


class SupplierCategory(str, Enum):
    JOB_BOARDS = "job_boards"
    ATS_SOFTWARE = "ats_software"
    ASSESSMENT_TOOLS = "assessment_tools"
    TRAINING_PLATFORMS = "training_platforms"
    PAYROLL_AND_HR_SOFTWARE = "payroll_and_hr_software"
    VIDEO_INTERVIEW = "video_interview"
    BACKGROUND_CHECK = "background_check"
    OFFICE_AND_FACILITIES = "office_and_facilities"
    IT_AND_SOFTWARE_LICENSES = "it_and_software_licenses"


# Modelo base compartido entre creación y respuesta.
class SupplierBase(BaseModel):
    name: str = Field(min_length=1)
    country: SupplierCountry
    categories: list[SupplierCategory] = Field(min_length=1)
    monthly_rate: PositiveFloat
    currency: SupplierCurrency
    status: SupplierStatus
    contract_renewal_date: date | None = None
    contact_email: EmailStr | None = None
    notes: str | None = None

    # Regla de negocio: la moneda depende del país del contrato.
    @model_validator(mode="after")
    def validate_currency_by_country(self) -> "SupplierBase":
        if self.country == SupplierCountry.SPAIN and self.currency != SupplierCurrency.EUR:
            raise ValueError("Suppliers in Spain must use EUR currency.")
        if self.country == SupplierCountry.USA and self.currency != SupplierCurrency.USD:
            raise ValueError("Suppliers in USA must use USD currency.")
        return self


class SupplierCreate(SupplierBase):
    pass


# Respuesta pública: incluye ID de TinyDB y timestamp de actualización.
class SupplierResponse(SupplierBase):
    id: int
    updated_at: datetime


# Payload dedicado para cambio de tarifa.
class SupplierRateUpdate(BaseModel):
    monthly_rate: PositiveFloat


# Payload dedicado para cambio de estado.
class SupplierStatusUpdate(BaseModel):
    status: SupplierStatus


class IncidentCategory(str, Enum):
    TECHNICAL_FAILURE = "technical_failure"
    PROCESS_ERROR = "process_error"
    CLIENT_COMPLAINT = "client_complaint"
    CANDIDATE_ISSUE = "candidate_issue"
    STAFF_ISSUE = "staff_issue"
    SLA_BREACH = "sla_breach"
    DATA_QUALITY = "data_quality"
    OTHER = "other"


class IncidentStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISCARDED = "discarded"


class IncidentOrigin(str, Enum):
    CUSTOMER = "customer"
    BRANCH = "branch"
    INTERNAL = "internal"


class IncidentBranch(str, Enum):
    CENTRAL = "central"
    VALENCIA_OPERATIONS = "valencia_operations"
    MIAMI_OFFICE = "miami_office"
    REMOTE = "remote"


class IncidentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1)
    category: IncidentCategory
    origin: IncidentOrigin
    branch: IncidentBranch

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("El titulo es obligatorio.")
        return normalized

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("La descripcion es obligatoria.")
        return value


class IncidentStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: IncidentStatus


class IncidentResponse(IncidentCreate):
    id: int
    status: IncidentStatus
    created_at: datetime
    updated_at: datetime


class IncidentSummary(BaseModel):
    total: int
    by_status: dict[IncidentStatus, int]
    by_category: dict[IncidentCategory, int]
    by_origin: dict[IncidentOrigin, int]
    by_branch: dict[IncidentBranch, int]
