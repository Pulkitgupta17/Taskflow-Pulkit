package handler_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/taskflow/backend/internal/model"
)

// createProject is a helper that creates a project and returns its ID.
func createProject(t *testing.T, router http.Handler, token, name string) string {
	t.Helper()

	body := model.CreateProjectRequest{Name: name}
	payload, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/projects", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("createProject: expected 201, got %d: %s", rec.Code, rec.Body.String())
	}

	var project model.Project
	if err := json.NewDecoder(rec.Body).Decode(&project); err != nil {
		t.Fatalf("createProject: decode failed: %v", err)
	}
	return project.ID.String()
}

func TestCreateTask_Success(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	token := registerAndLogin(t, router, "Task User", "taskuser@example.com", "password123")
	projectID := createProject(t, router, token, "Test Project")

	taskBody := model.CreateTaskRequest{
		Title:    "My first task",
		Status:   model.TaskStatusTodo,
		Priority: model.TaskPriorityHigh,
	}
	payload, _ := json.Marshal(taskBody)
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/projects/%s/tasks", projectID), bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
	}

	var task model.Task
	if err := json.NewDecoder(rec.Body).Decode(&task); err != nil {
		t.Fatalf("failed to decode task response: %v", err)
	}

	if task.Title != "My first task" {
		t.Errorf("expected title 'My first task', got %q", task.Title)
	}
	if task.Status != model.TaskStatusTodo {
		t.Errorf("expected status 'todo', got %q", task.Status)
	}
	if task.Priority != model.TaskPriorityHigh {
		t.Errorf("expected priority 'high', got %q", task.Priority)
	}
	if task.ProjectID.String() != projectID {
		t.Errorf("expected project_id %q, got %q", projectID, task.ProjectID.String())
	}
}

func TestCreateTask_Unauthorized(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	// Attempt to create a task without an auth token.
	payload := []byte(`{"title":"Sneaky task"}`)
	req := httptest.NewRequest(http.MethodPost, "/projects/00000000-0000-0000-0000-000000000001/tasks", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestCreateTask_MissingTitle(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	token := registerAndLogin(t, router, "Title User", "titleuser@example.com", "password123")
	projectID := createProject(t, router, token, "Title Project")

	// Send a task with an empty title.
	payload := []byte(`{"title":"","status":"todo","priority":"low"}`)
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/projects/%s/tasks", projectID), bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
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
	if fields["title"] != "is required" {
		t.Errorf("expected fields.title = 'is required', got %q", fields["title"])
	}
}

func TestListTasks_Empty(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	token := registerAndLogin(t, router, "List User", "listuser@example.com", "password123")
	projectID := createProject(t, router, token, "Empty Project")

	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/projects/%s/tasks", projectID), nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp model.PaginatedResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.TotalCount != 0 {
		t.Errorf("expected total_count 0, got %d", resp.TotalCount)
	}
}

func TestListTasks_WithTasks(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	token := registerAndLogin(t, router, "Multi User", "multiuser@example.com", "password123")
	projectID := createProject(t, router, token, "Multi Project")

	// Create two tasks.
	for i := 1; i <= 2; i++ {
		taskBody := model.CreateTaskRequest{
			Title:    fmt.Sprintf("Task %d", i),
			Status:   model.TaskStatusTodo,
			Priority: model.TaskPriorityMedium,
		}
		payload, _ := json.Marshal(taskBody)
		req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/projects/%s/tasks", projectID), bytes.NewReader(payload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		if rec.Code != http.StatusCreated {
			t.Fatalf("create task %d: expected 201, got %d: %s", i, rec.Code, rec.Body.String())
		}
	}

	// List tasks.
	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/projects/%s/tasks", projectID), nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp model.PaginatedResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.TotalCount != 2 {
		t.Errorf("expected total_count 2, got %d", resp.TotalCount)
	}

	// Data should be a list of 2 tasks.
	tasks, ok := resp.Data.([]interface{})
	if !ok {
		t.Fatal("expected Data to be a list")
	}
	if len(tasks) != 2 {
		t.Errorf("expected 2 tasks in data, got %d", len(tasks))
	}
}

func TestDeleteTask_Success(t *testing.T) {
	truncateTables(t)
	router := testRouter()

	token := registerAndLogin(t, router, "Del User", "deluser@example.com", "password123")
	projectID := createProject(t, router, token, "Del Project")

	// Create a task.
	taskBody := model.CreateTaskRequest{
		Title:    "Doomed task",
		Status:   model.TaskStatusTodo,
		Priority: model.TaskPriorityLow,
	}
	payload, _ := json.Marshal(taskBody)
	createReq := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/projects/%s/tasks", projectID), bytes.NewReader(payload))
	createReq.Header.Set("Content-Type", "application/json")
	createReq.Header.Set("Authorization", "Bearer "+token)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusCreated {
		t.Fatalf("create task: expected 201, got %d: %s", createRec.Code, createRec.Body.String())
	}

	var task model.Task
	json.NewDecoder(createRec.Body).Decode(&task)

	// Delete the task.
	delReq := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/tasks/%s", task.ID.String()), nil)
	delReq.Header.Set("Authorization", "Bearer "+token)
	delRec := httptest.NewRecorder()
	router.ServeHTTP(delRec, delReq)

	if delRec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d: %s", delRec.Code, delRec.Body.String())
	}

	// Verify the task list is now empty.
	listReq := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/projects/%s/tasks", projectID), nil)
	listReq.Header.Set("Authorization", "Bearer "+token)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)

	var resp model.PaginatedResponse
	json.NewDecoder(listRec.Body).Decode(&resp)
	if resp.TotalCount != 0 {
		t.Errorf("expected 0 tasks after delete, got %d", resp.TotalCount)
	}
}
