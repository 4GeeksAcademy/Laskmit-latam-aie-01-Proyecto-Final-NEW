# CORRIDA AUTOMÁTICA DE LOS TEST CORRESPONDIENTES A LOS ENDPOINTS DE AUTENTICACION

## COMANDO:

@Laskmit ➜ /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api (auth-bullet-proof) $ cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api && PYTHONPATH="/workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW:$PYTHONPATH" uv run pytest tests/ -v

## RESULTADO EN EL TERMINAL:

================================== test session starts ==================================
platform linux -- Python 3.12.1, pytest-9.1.1, pluggy-1.6.0 -- /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api/.venv/bin/python3
cachedir: .pytest_cache
rootdir: /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api
configfile: pyproject.toml
plugins: cov-7.1.0, anyio-4.14.2
collected 62 items                                                                      

tests/test_analyze_cli.py::AnalyzeCliErrorHandlingTest::test_export_failure_returns_one_without_exposing_exception PASSED [  1%]
tests/test_auth_me.py::TestAuthMe::test_happy_path_with_profile PASSED            [  3%]
tests/test_auth_me.py::TestAuthMe::test_happy_path_without_profile PASSED         [  4%]
tests/test_auth_me.py::TestAuthMe::test_edge_case_admin_user PASSED               [  6%]
tests/test_auth_me.py::TestAuthMe::test_failure_no_token PASSED                   [  8%]
tests/test_auth_me.py::TestAuthMe::test_failure_expired_token PASSED              [  9%]
tests/test_auth_me.py::TestAuthMe::test_failure_malformed_token PASSED            [ 11%]
tests/test_auth_me.py::TestAuthMe::test_failure_inactive_user PASSED              [ 12%]
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_change_password_requires_current_password_and_keeps_session PASSED [ 14%]
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_email_configuration_failure_keeps_generic_response_and_invalidates_token PASSED [ 16%]
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_email_failure_keeps_generic_response_and_invalidates_token PASSED [ 17%]
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_expired_token_is_rejected PASSED [ 19%]
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_forgot_password_does_not_enumerate_users PASSED [ 20%]
tests/test_auth_password.py::AuthPasswordEndpointsTest::test_reset_password_is_single_use_and_updates_login PASSED [ 22%]
tests/test_incident_manager.py::IncidentManagerTest::test_analyze_hides_unexpected_error_details PASSED [ 24%]
tests/test_incident_manager.py::IncidentManagerTest::test_analyze_returns_clean_error_for_invalid_csv PASSED [ 25%]
tests/test_incident_manager.py::IncidentManagerTest::test_create_list_filter_and_summary PASSED [ 27%]
tests/test_incident_manager.py::IncidentManagerTest::test_empty_missing_and_invalid_filter PASSED [ 29%]
tests/test_incident_manager.py::IncidentManagerTest::test_historical_seed_is_idempotent PASSED [ 30%]
tests/test_incident_manager.py::IncidentManagerTest::test_manager_endpoints_require_authentication PASSED [ 32%]
tests/test_incident_manager.py::IncidentManagerTest::test_validation_and_lifecycle PASSED [ 33%]
tests/test_login.py::TestLogin::test_happy_path_returns_jwt_token PASSED          [ 35%]
tests/test_login.py::TestLogin::test_edge_case_email_with_unexpected_case PASSED  [ 37%]
tests/test_login.py::TestLogin::test_edge_case_password_empty_string PASSED       [ 38%]
tests/test_login.py::TestLogin::test_failure_wrong_password PASSED                [ 40%]
tests/test_login.py::TestLogin::test_failure_unregistered_email PASSED            [ 41%]
tests/test_login.py::TestLogin::test_failure_inactive_user PASSED                 [ 43%]
tests/test_login.py::TestLogin::test_failure_message_does_not_enumerate_users PASSED [ 45%]
tests/test_profiles.py::TestGetProfile::test_happy_path_user_with_profile PASSED  [ 46%]
tests/test_profiles.py::TestGetProfile::test_failure_no_profile PASSED            [ 48%]
tests/test_profiles.py::TestGetProfile::test_failure_no_token PASSED              [ 50%]
tests/test_profiles.py::TestUpdateProfile::test_happy_path_create_profile PASSED  [ 51%]
tests/test_profiles.py::TestUpdateProfile::test_happy_path_update_existing_profile PASSED [ 53%]
tests/test_profiles.py::TestUpdateProfile::test_edge_case_partial_update PASSED   [ 54%]
tests/test_profiles.py::TestUpdateProfile::test_failure_no_token PASSED           [ 56%]
tests/test_register.py::TestRegister::test_happy_path_creates_user_with_role_user PASSED [ 58%]
tests/test_register.py::TestRegister::test_happy_path_with_optional_profile PASSED [ 59%]
tests/test_register.py::TestRegister::test_edge_case_duplicate_email PASSED       [ 61%]
tests/test_register.py::TestRegister::test_edge_case_password_exactly_8_chars PASSED [ 62%]
tests/test_register.py::TestRegister::test_failure_password_too_short PASSED      [ 64%]
tests/test_register.py::TestRegister::test_failure_invalid_email_format PASSED    [ 66%]
tests/test_register.py::TestRegister::test_failure_role_not_exposed_in_request PASSED [ 67%]
tests/test_seed_cli.py::SeedCliErrorHandlingTest::test_database_failure_returns_sanitized_error PASSED [ 69%]
tests/test_seed_cli.py::SeedCliErrorHandlingTest::test_missing_credentials_returns_one_without_traceback PASSED [ 70%]
tests/test_users.py::TestListUsers::test_happy_path_admin_can_list PASSED         [ 72%]
tests/test_users.py::TestListUsers::test_happy_path_regular_user_can_list PASSED  [ 74%]
tests/test_users.py::TestListUsers::test_failure_no_token PASSED                  [ 75%]
tests/test_users.py::TestGetUser::test_happy_path_own_user PASSED                 [ 77%]
tests/test_users.py::TestGetUser::test_happy_path_admin_gets_other_user PASSED    [ 79%]
tests/test_users.py::TestGetUser::test_edge_case_regular_user_gets_other_user PASSED [ 80%]
tests/test_users.py::TestGetUser::test_failure_nonexistent_user PASSED            [ 82%]
tests/test_users.py::TestGetUser::test_failure_no_token PASSED                    [ 83%]
tests/test_users.py::TestUpdateUser::test_happy_path_update_own_email PASSED      [ 85%]
tests/test_users.py::TestUpdateUser::test_happy_path_admin_changes_role PASSED    [ 87%]
tests/test_users.py::TestUpdateUser::test_edge_case_regular_user_cannot_change_role PASSED [ 88%]
tests/test_users.py::TestUpdateUser::test_edge_case_regular_user_updates_other PASSED [ 90%]
tests/test_users.py::TestUpdateUser::test_failure_nonexistent_user PASSED         [ 91%]
tests/test_users.py::TestUpdateUser::test_failure_no_token PASSED                 [ 93%]
tests/test_users.py::TestDeleteUser::test_happy_path_admin_deletes_user PASSED    [ 95%]
tests/test_users.py::TestDeleteUser::test_failure_regular_user_cannot_delete PASSED [ 96%]
tests/test_users.py::TestDeleteUser::test_failure_nonexistent_user PASSED         [ 98%]
tests/test_users.py::TestDeleteUser::test_failure_no_token PASSED                 [100%]

=================================== warnings summary ====================================
tests/test_auth_me.py: 5 warnings
tests/test_auth_password.py: 6 warnings
tests/test_login.py: 5 warnings
tests/test_profiles.py: 5 warnings
tests/test_register.py: 5 warnings
tests/test_users.py: 22 warnings
  /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api/auth/services.py:103: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
    created_at=datetime.utcnow(),

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
=========================== 62 passed, 48 warnings in 27.51s ============================
@Laskmit ➜ /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW/services/api (auth-bullet-proof) $ 
