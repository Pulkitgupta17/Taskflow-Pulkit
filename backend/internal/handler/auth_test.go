package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/taskflow/backend/internal/model"
)

func TestRegister_Success(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	body := model.RegisterRequest{
		Name:     "Alice Smith",
		Email:    "alice@example.com",
		Password: "secret123",
	}
	payload, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp model.AuthResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Token == "" {
		t.Error("expected non-empty token")
	}
	if resp.User.Name != "Alice Smith" {
		t.Errorf("expected user name 'Alice Smith', got %q", resp.User.Name)
	}
	if resp.User.Email != "alice@example.com" {
		t.Errorf("expected user email 'alice@example.com', got %q", resp.User.Email)
	}
	if resp.User.ID.String() == "" || resp.User.ID.String() == "00000000-0000-0000-0000-000000000000" {
		t.Error("expected a valid non-nil user ID")
	}
}

func TestRegister_DuplicateEmail(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	body := model.RegisterRequest{
		Name:     "Bob Jones",
		Email:    "bob@example.com",
		Password: "password1",
	}
	payload, _ := json.Marshal(body)

	// First registration should succeed.
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("first register: expected 201, got %d: %s", rec.Code, rec.Body.String())
	}

	// Second registration with the same email should fail with validation error.
	payload, _ = json.Marshal(body)
	req = httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	// The handler returns 400 with a validation error containing fields.email = "already taken".
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("duplicate register: expected 400, got %d: %s", rec.Code, rec.Body.String())
	}

	var errResp map[string]interface{}
	if err := json.NewDecoder(rec.Body).Decode(&errResp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}

	if errResp["error"] != "validation failed" {
		t.Errorf("expected error 'validation failed', got %q", errResp["error"])
	}

	fields, ok := errResp["fields"].(map[string]interface{})
	if !ok {
		t.Fatal("expected 'fields' object in response")
	}
	if fields["email"] != "already taken" {
		t.Errorf("expected fields.email = 'already taken', got %q", fields["email"])
	}
}

func TestRegister_MissingFields(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	// Send an empty JSON object -- all fields missing.
	payload := []byte(`{}`)
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
	}

	var errResp map[string]interface{}
	if err := json.NewDecoder(rec.Body).Decode(&errResp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}

	if errResp["error"] != "validation failed" {
		t.Errorf("expected error 'validation failed', got %q", errResp["error"])
	}

	fields, ok := errResp["fields"].(map[string]interface{})
	if !ok {
		t.Fatal("expected 'fields' object in response")
	}

	// All three fields should have validation errors.
	for _, f := range []string{"name", "email", "password"} {
		if _, exists := fields[f]; !exists {
			t.Errorf("expected validation error for field %q", f)
		}
	}
}

func TestRegister_ShortPassword(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	body := model.RegisterRequest{
		Name:     "Short Pass",
		Email:    "short@example.com",
		Password: "abc", // less than 6 characters
	}
	payload, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
	}

	var errResp map[string]interface{}
	if err := json.NewDecoder(rec.Body).Decode(&errResp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}

	fields, ok := errResp["fields"].(map[string]interface{})
	if !ok {
		t.Fatal("expected 'fields' object in response")
	}
	if fields["password"] != "must be at least 6 characters" {
		t.Errorf("expected password validation message, got %q", fields["password"])
	}
}

func TestRegister_InvalidEmail(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	body := model.RegisterRequest{
		Name:     "Bad Email",
		Email:    "not-an-email",
		Password: "validpass",
	}
	payload, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
	}

	var errResp map[string]interface{}
	json.NewDecoder(rec.Body).Decode(&errResp)

	fields, ok := errResp["fields"].(map[string]interface{})
	if !ok {
		t.Fatal("expected 'fields' object in response")
	}
	if fields["email"] != "is invalid" {
		t.Errorf("expected fields.email = 'is invalid', got %q", fields["email"])
	}
}

func TestLogin_Success(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	// First register a user.
	regBody := model.RegisterRequest{
		Name:     "Carol Lee",
		Email:    "carol@example.com",
		Password: "mypassword",
	}
	regPayload, _ := json.Marshal(regBody)
	regReq := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(regPayload))
	regReq.Header.Set("Content-Type", "application/json")
	regRec := httptest.NewRecorder()
	router.ServeHTTP(regRec, regReq)

	if regRec.Code != http.StatusCreated {
		t.Fatalf("register failed: %d %s", regRec.Code, regRec.Body.String())
	}

	// Now login with the same credentials.
	loginBody := model.LoginRequest{
		Email:    "carol@example.com",
		Password: "mypassword",
	}
	loginPayload, _ := json.Marshal(loginBody)
	loginReq := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(loginPayload))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRec := httptest.NewRecorder()
	router.ServeHTTP(loginRec, loginReq)

	if loginRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", loginRec.Code, loginRec.Body.String())
	}

	var resp model.AuthResponse
	if err := json.NewDecoder(loginRec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode login response: %v", err)
	}

	if resp.Token == "" {
		t.Error("expected non-empty token on login")
	}
	if resp.User.Email != "carol@example.com" {
		t.Errorf("expected email 'carol@example.com', got %q", resp.User.Email)
	}
	if resp.User.Name != "Carol Lee" {
		t.Errorf("expected name 'Carol Lee', got %q", resp.User.Name)
	}
}

func TestLogin_InvalidPassword(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	// Register a user.
	regBody := model.RegisterRequest{
		Name:     "Dave Kim",
		Email:    "dave@example.com",
		Password: "correct-password",
	}
	regPayload, _ := json.Marshal(regBody)
	regReq := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(regPayload))
	regReq.Header.Set("Content-Type", "application/json")
	regRec := httptest.NewRecorder()
	router.ServeHTTP(regRec, regReq)

	if regRec.Code != http.StatusCreated {
		t.Fatalf("register failed: %d %s", regRec.Code, regRec.Body.String())
	}

	// Attempt login with wrong password.
	loginBody := model.LoginRequest{
		Email:    "dave@example.com",
		Password: "wrong-password",
	}
	loginPayload, _ := json.Marshal(loginBody)
	loginReq := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(loginPayload))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRec := httptest.NewRecorder()
	router.ServeHTTP(loginRec, loginReq)

	if loginRec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", loginRec.Code, loginRec.Body.String())
	}

	var errResp map[string]string
	if err := json.NewDecoder(loginRec.Body).Decode(&errResp); err != nil {
		t.Fatalf("failed to decode error response: %v", err)
	}
	if errResp["error"] != "invalid email or password" {
		t.Errorf("expected error 'invalid email or password', got %q", errResp["error"])
	}
}

func TestLogin_NonExistentUser(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	loginBody := model.LoginRequest{
		Email:    "nobody@example.com",
		Password: "whatever",
	}
	loginPayload, _ := json.Marshal(loginBody)
	loginReq := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(loginPayload))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRec := httptest.NewRecorder()
	router.ServeHTTP(loginRec, loginReq)

	if loginRec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", loginRec.Code, loginRec.Body.String())
	}
}

func TestLogin_MissingFields(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	payload := []byte(`{}`)
	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
	}

	var errResp map[string]interface{}
	json.NewDecoder(rec.Body).Decode(&errResp)

	fields, ok := errResp["fields"].(map[string]interface{})
	if !ok {
		t.Fatal("expected 'fields' object in response")
	}
	if _, exists := fields["email"]; !exists {
		t.Error("expected validation error for field 'email'")
	}
	if _, exists := fields["password"]; !exists {
		t.Error("expected validation error for field 'password'")
	}
}

// registerAndLogin is a helper that registers a user and returns the auth token.
func registerAndLogin(t *testing.T, router http.Handler, name, email, password string) string {
	t.Helper()

	body := model.RegisterRequest{
		Name:     name,
		Email:    email,
		Password: password,
	}
	payload, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("registerAndLogin: register failed with status %d: %s", rec.Code, rec.Body.String())
	}

	var resp model.AuthResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("registerAndLogin: failed to decode response: %v", err)
	}
	return resp.Token
}
