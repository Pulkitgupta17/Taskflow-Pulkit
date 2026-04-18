package model

import (
	"time"

	"github.com/google/uuid"
)

// Domain types

type User struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	CreatedAt time.Time `json:"created_at"`
}

type Project struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	OwnerID     uuid.UUID `json:"owner_id"`
	CreatedAt   time.Time `json:"created_at"`
}

type TaskStatus string

const (
	TaskStatusTodo       TaskStatus = "todo"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusDone       TaskStatus = "done"
)

type TaskPriority string

const (
	TaskPriorityLow    TaskPriority = "low"
	TaskPriorityMedium TaskPriority = "medium"
	TaskPriorityHigh   TaskPriority = "high"
)

type Task struct {
	ID          uuid.UUID    `json:"id"`
	Title       string       `json:"title"`
	Description *string      `json:"description"`
	Status      TaskStatus   `json:"status"`
	Priority    TaskPriority `json:"priority"`
	ProjectID   uuid.UUID    `json:"project_id"`
	AssigneeID  *uuid.UUID   `json:"assignee_id"`
	CreatedBy   uuid.UUID    `json:"created_by"`
	DueDate     *time.Time   `json:"due_date"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// Request types

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type CreateProjectRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

type UpdateProjectRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

type CreateTaskRequest struct {
	Title       string       `json:"title"`
	Description *string      `json:"description"`
	Status      TaskStatus   `json:"status"`
	Priority    TaskPriority `json:"priority"`
	AssigneeID  *uuid.UUID   `json:"assignee_id"`
	DueDate     *string      `json:"due_date"`
}

type UpdateTaskRequest struct {
	Title       *string       `json:"title"`
	Description *string       `json:"description"`
	Status      *TaskStatus   `json:"status"`
	Priority    *TaskPriority `json:"priority"`
	AssigneeID  *uuid.UUID    `json:"assignee_id"`
	DueDate     *string       `json:"due_date"`
}

// Response types

type AuthResponse struct {
	Token string   `json:"token"`
	User  UserInfo `json:"user"`
}

type UserInfo struct {
	ID    uuid.UUID `json:"id"`
	Name  string    `json:"name"`
	Email string    `json:"email"`
}

type ProjectWithTasks struct {
	Project
	Tasks []Task `json:"tasks"`
}

type ProjectStats struct {
	StatusCounts   map[string]int            `json:"status_counts"`
	AssigneeCounts map[string]AssigneeCount  `json:"assignee_counts"`
	TotalTasks     int                       `json:"total_tasks"`
}

type AssigneeCount struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalCount int         `json:"total_count"`
	TotalPages int         `json:"total_pages"`
}

// Validation

func ValidTaskStatus(s TaskStatus) bool {
	switch s {
	case TaskStatusTodo, TaskStatusInProgress, TaskStatusDone:
		return true
	}
	return false
}

func ValidTaskPriority(p TaskPriority) bool {
	switch p {
	case TaskPriorityLow, TaskPriorityMedium, TaskPriorityHigh:
		return true
	}
	return false
}
