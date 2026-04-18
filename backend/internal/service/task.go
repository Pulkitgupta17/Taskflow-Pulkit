package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/taskflow/backend/internal/model"
	"github.com/taskflow/backend/internal/repository"
)

type TaskService struct {
	taskRepo    *repository.TaskRepository
	projectRepo *repository.ProjectRepository
}

func NewTaskService(taskRepo *repository.TaskRepository, projectRepo *repository.ProjectRepository) *TaskService {
	return &TaskService{
		taskRepo:    taskRepo,
		projectRepo: projectRepo,
	}
}

func (s *TaskService) Create(ctx context.Context, projectID uuid.UUID, req model.CreateTaskRequest, userID uuid.UUID) (*model.Task, error) {
	// Verify project exists
	_, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	status := req.Status
	if status == "" {
		status = model.TaskStatusTodo
	}
	priority := req.Priority
	if priority == "" {
		priority = model.TaskPriorityMedium
	}

	var dueDate *time.Time
	if req.DueDate != nil && *req.DueDate != "" {
		t, err := time.Parse("2006-01-02", *req.DueDate)
		if err != nil {
			return nil, errors.New("invalid due_date format, expected YYYY-MM-DD")
		}
		dueDate = &t
	}

	return s.taskRepo.Create(ctx, req.Title, req.Description, status, priority, projectID, userID, req.AssigneeID, dueDate)
}

func (s *TaskService) ListByProject(ctx context.Context, projectID uuid.UUID, status *string, assigneeID *uuid.UUID, page, limit int) ([]model.Task, int, error) {
	// Verify project exists
	_, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, 0, ErrNotFound
		}
		return nil, 0, err
	}

	return s.taskRepo.ListByProject(ctx, projectID, status, assigneeID, page, limit)
}

func (s *TaskService) Update(ctx context.Context, taskID uuid.UUID, req model.UpdateTaskRequest) (*model.Task, error) {
	_, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	var dueDate *time.Time
	var clearDueDate bool
	if req.DueDate != nil {
		if *req.DueDate == "" {
			clearDueDate = true
		} else {
			t, err := time.Parse("2006-01-02", *req.DueDate)
			if err != nil {
				return nil, errors.New("invalid due_date format, expected YYYY-MM-DD")
			}
			dueDate = &t
		}
	}

	// Determine if we should clear assignee (explicit null in JSON)
	// The handler will set AssigneeID to a special zero UUID if explicitly null
	clearAssignee := false
	var assigneePtr *uuid.UUID
	if req.AssigneeID != nil {
		if *req.AssigneeID == uuid.Nil {
			clearAssignee = true
		} else {
			assigneePtr = req.AssigneeID
		}
	}

	return s.taskRepo.Update(ctx, taskID, req.Title, req.Description, req.Status, req.Priority, assigneePtr, dueDate, clearAssignee, clearDueDate)
}

func (s *TaskService) Delete(ctx context.Context, taskID uuid.UUID, userID uuid.UUID) error {
	task, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return err
	}

	// Check if user is task creator
	if task.CreatedBy == userID {
		return s.taskRepo.Delete(ctx, taskID)
	}

	// Check if user is project owner
	project, err := s.projectRepo.GetByID(ctx, task.ProjectID)
	if err != nil {
		return err
	}
	if project.OwnerID == userID {
		return s.taskRepo.Delete(ctx, taskID)
	}

	return ErrForbidden
}
