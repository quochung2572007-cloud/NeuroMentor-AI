from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./neurommentor.db"
    auto_create_tables: bool = True
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    app_public_url: str = "http://localhost:5500/"
    cors_allowed_origins: str = "http://localhost:5500,http://127.0.0.1:5500"
    cors_origin_regex: str = ""
    email_reminder_scheduler_enabled: bool = True
    email_reminder_poll_seconds: int = 60
    resend_api_key: str = ""
    email_from: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "NeuroMentor AI"
    smtp_starttls: bool = True
    smtp_use_ssl: bool = False

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_allowed_origins.split(",") if origin.strip()]


settings = Settings()
