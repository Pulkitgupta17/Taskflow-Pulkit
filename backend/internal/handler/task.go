package handler

import (
	"encoding/json"
	"errors"
	"math"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/taskflow/backend/internal/middleware"
	"github.com/taskflow/backend/internal/model"
	"github.com/taskflow/backend/internal/service"
)

type TaskHandler struct {
	taskService *service.TaskService
}

func NewTaskHandler(taskService *service.TaskService) *TaskHandler {
	return &TaskHandler{taskService: taskService}
}

func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	projectID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid project id")
		return
	}

	var req model.CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate
	fields := make(map[string]string)
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		fields["title"] = "is required"
	}
	if req.Status != "" && !model.ValidTaskStatus(req.Status) {
		fields["status"] = "must be one of: todo, in_progress, done"
	}
	if req.Priority != "" && !model.ValidTaskPriority(req.Priority) {
		fields["priority"] = "must be one of: low, medium, high"
	}
	if len(fields) > 0 {
		writeValidationError(w, fields)
		return
	}

	task, err := h.taskService.Create(r.Context(), projectID, req, userID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, "project not found")
			return
		}
		if err.Error() == "invalid due_date format, expected YYYY-MM-DD" {
			writeValidationError(w, map[string]string{"due_date": "must be in YYYY-MM-DD format"})
			return
		}
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusCreated, task)
}

func (h *TaskHandler) List(w http.ResponseWriter, r *http.Request) {
	projectID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid project id")
		return
	}

	page, limit := parsePagination(r)

	var statusFilter *string
	if s := r.URL.Query().Get("status"); s != "" {
		statusFilter = &s
	}

	var assigneeFilter *uuid.UUID
	if a := r.URL.Query().Get("assignee"); a != "" {
		id, err := uuid.Parse(a)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid assignee id")
			return
		}
		assigneeFilter = &id
	}

	tasks, totalCount, err := h.taskService.ListByProject(r.Context(), projectID, statusFilter, assigneeFilter, page, limit)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, "project not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	if tasks == nil {
		tasks = []model.Task{}
	}

	totalPages := int(math.Ceil(float64(totalCount) / float64(limit)))

	writeJSON(w, http.StatusOK, model.PaginatedResponse{
		Data:       tasks,
		Page:       page,
		Limit:      limit,
		TotalCount: totalCount,
		TotalPages: totalPages,
	})
}

func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) {
	taskID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid task id")
		return
	}

	var req model.UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate provided fields
	fields := make(map[string]string)
	if req.Title != nil {
		trimmed := strings.TrimSpace(*req.Title)
		if trimmed == "" {
			fields["title"] = "cannot be empty"
		}
		req.Title = &trimmed
	}
	if req.Status != nil && !model.ValidTaskStatus(*req.Status) {
		fields["status"] = "must be one of: todo, in_progress, done"
	}
	if req.Priority != nil && !model.ValidTaskPriority(*req.Priority) {
		fields["priority"] = "must be one of: low, medium, high"
	}
	if len(fields) > 0 {
		writeValidationError(w, fields)
		return
	}

	task, err := h.taskService.Update(r.Context(), taskID, req)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		if err.Error() == "invalid due_date format, expected YYYY-MM-DD" {
			writeValidationError(w, map[string]string{"due_date": "must be in YYYY-MM-DD format"})
			return
		}
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, task)
}

func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	taskID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid task id")
		return
	}

	err = h.taskService.Delete(r.Context(), taskID, userID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		if errors.Is(err, service.ErrForbidden) {
			writeError(w, http.StatusForbidden, "forbidden")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
