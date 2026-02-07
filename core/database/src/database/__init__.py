from shared.utils import validate_aws_credentials
from .utils import validate_env_vars

validate_aws_credentials()
validate_env_vars()

from .data_table_client import DataTableClient  # noqa: E402
