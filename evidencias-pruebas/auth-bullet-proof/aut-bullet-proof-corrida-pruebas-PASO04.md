# CORRIDA AUTOMÁTICA DE LOS TEST CORRESPONDIENTES a PASO 04 -backoffice

## COMANDO:

@Laskmit ➜ /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api (auth-bullet-proof) $ PYTHONPATH="/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW:$PYTHONPATH" uv run pytest tests/test_suppliers.py tests/test_incidents_advanced.py -v -W all

## RESULTADO EN EL TERMINAL:  (no tiene warnings)

================================== test session starts ==================================
platform linux -- Python 3.12.1, pytest-9.1.1, pluggy-1.6.0 -- /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api/.venv/bin/python3
cachedir: .pytest_cache
rootdir: /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api
configfile: pyproject.toml
plugins: cov-7.1.0, anyio-4.14.2
collected 36 items                                                                      

tests/test_suppliers.py::TestCreateSupplier::test_happy_path_spain_with_eur PASSED [  2%]
tests/test_suppliers.py::TestCreateSupplier::test_happy_path_usa_with_usd PASSED  [  5%]
tests/test_suppliers.py::TestCreateSupplier::test_edge_case_without_optionals PASSED [  8%]
tests/test_suppliers.py::TestCreateSupplier::test_edge_case_all_categories PASSED [ 11%]
tests/test_suppliers.py::TestCreateSupplier::test_failure_wrong_currency_spain PASSED [ 13%]
tests/test_suppliers.py::TestCreateSupplier::test_failure_wrong_currency_usa PASSED [ 16%]
tests/test_suppliers.py::TestCreateSupplier::test_failure_rate_zero PASSED        [ 19%]
tests/test_suppliers.py::TestCreateSupplier::test_failure_rate_negative PASSED    [ 22%]
tests/test_suppliers.py::TestCreateSupplier::test_failure_invalid_category PASSED [ 25%]
tests/test_suppliers.py::TestCreateSupplier::test_failure_no_auth PASSED          [ 27%]
tests/test_suppliers.py::TestListSuppliers::test_happy_path_list_all PASSED       [ 30%]
tests/test_suppliers.py::TestListSuppliers::test_happy_path_filter_by_country PASSED [ 33%]
tests/test_suppliers.py::TestListSuppliers::test_happy_path_filter_by_category PASSED [ 36%]
tests/test_suppliers.py::TestListSuppliers::test_edge_case_empty_db PASSED        [ 38%]
tests/test_suppliers.py::TestListSuppliers::test_failure_no_auth PASSED           [ 41%]
tests/test_suppliers.py::TestGetSupplier::test_happy_path_existing_id PASSED      [ 44%]
tests/test_suppliers.py::TestGetSupplier::test_failure_nonexistent_id PASSED      [ 47%]
tests/test_suppliers.py::TestUpdateSupplierRate::test_happy_path_update_rate PASSED [ 50%]
tests/test_suppliers.py::TestUpdateSupplierRate::test_failure_rate_zero PASSED    [ 52%]
tests/test_suppliers.py::TestUpdateSupplierRate::test_failure_rate_negative PASSED [ 55%]
tests/test_suppliers.py::TestUpdateSupplierRate::test_failure_nonexistent_id PASSED [ 58%]
tests/test_suppliers.py::TestUpdateSupplierStatus::test_happy_path_update_status PASSED [ 61%]
tests/test_suppliers.py::TestUpdateSupplierStatus::test_failure_invalid_status PASSED [ 63%]
tests/test_suppliers.py::TestUpdateSupplierStatus::test_failure_nonexistent_id PASSED [ 66%]
tests/test_suppliers.py::TestDeleteSupplier::test_happy_path_delete PASSED        [ 69%]
tests/test_suppliers.py::TestDeleteSupplier::test_failure_nonexistent_id PASSED   [ 72%]
tests/test_suppliers.py::TestDeleteSupplier::test_failure_no_auth PASSED          [ 75%]
tests/test_incidents_advanced.py::TestIncidentsAdvanced::test_edge_case_title_max_length PASSED [ 77%]
tests/test_incidents_advanced.py::TestIncidentsAdvanced::test_failure_title_too_long PASSED [ 80%]
tests/test_incidents_advanced.py::TestIncidentsAdvanced::test_edge_case_description_minimum PASSED [ 83%]
tests/test_incidents_advanced.py::TestIncidentsAdvanced::test_failure_invalid_category PASSED [ 86%]
tests/test_incidents_advanced.py::TestIncidentsAdvanced::test_failure_invalid_origin PASSED [ 88%]
tests/test_incidents_advanced.py::TestIncidentsAdvanced::test_failure_invalid_branch PASSED [ 91%]
tests/test_incidents_advanced.py::TestIncidentsAdvanced::test_edge_case_multiple_filters PASSED [ 94%]
tests/test_incidents_advanced.py::TestIncidentsAdvanced::test_happy_path_get_by_id PASSED [ 97%]
tests/test_incidents_advanced.py::TestIncidentsAdvanced::test_failure_get_nonexistent_id PASSED [100%]

================================== 36 passed in 15.99s ==================================
