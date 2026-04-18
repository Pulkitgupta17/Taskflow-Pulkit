package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/taskflow/backend/internal/model"
)

type TaskRepository struct {
	pool *pgxpool.Pool
}

func NewTaskRepository(pool *pgxpool.Pool) *TaskRepository {
	return &TaskRepository{pool: pool}
}

func (r *TaskRepository) Create(ctx context.Context, title string, description *string, status model.TaskStatus, priority model.TaskPriority, projectID, createdBy uuid.UUID, assigneeID *uuid.UUID, dueDate *time.Time) (*model.Task, error) {
	task := &model.Task{}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, created_by, due_date)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, title, description, status, priority, project_id, assignee_id, created_by, due_date, created_at, updated_at`,
		title, description, status, priority, projectID, assigneeID, createdBy, dueDate,
	).Scan(&task.ID, &task.Title, &task.Description, &task.Status, &task.Priority,
		&task.ProjectID, &task.AssigneeID, &task.CreatedBy, &task.DueDate,
		&task.CreatedAt, &task.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return task, nil
}

func (r *TaskRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Task, error) {
	task := &model.Task{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, title, description, status, priority, project_id, assignee_id, created_by, due_date, created_at, updated_at
		 FROM tasks WHERE id = $1`,
		id,
	).Scan(&task.ID, &task.Title, &task.Description, &task.Status, &task.Priority,
		&task.ProjectID, &task.AssigneeID, &task.CreatedBy, &task.DueDate,
		&task.CreatedAt, &task.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return task, nil
}

func (r *TaskRepository) ListByProject(ctx context.Context, projectID uuid.UUID, status *string, assigneeID *uuid.UUID, page, limit int) ([]model.Task, int, error) {
	offset := (page - 1) * limit

	// Build dynamic WHERE clause
	conditions := []string{"project_id = $1"}
	args := []interface{}{projectID}
	argIdx := 2

	if status != nil && *status != "" {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *status)
		argIdx++
	}
	if assigneeID != nil {
		conditions = append(conditions, fmt.Sprintf("assignee_id = $%d", argIdx))
		args = append(args, *assigneeID)
		argIdx++
	}

	where := strings.Join(conditions, " AND ")

	// Count query
	var totalCount int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tasks WHERE %s", where)
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	// Data query
	dataQuery := fmt.Sprintf(
		`SELECT id, title, description, status, priority, project_id, assignee_id, created_by, due_date, created_at, updated_at
		 FROM tasks WHERE %s
		 ORDER BY created_at DESC
		 LIMIT $%d OFFSET $%d`,
		where, argIdx, argIdx+1,
	)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var tasks []model.Task
	for rows.Next() {
		var t model.Task
		if err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Status, &t.Priority,
			&t.ProjectID, &t.AssigneeID, &t.CreatedBy, &t.DueDate,
			&t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, 0, err
		}
		tasks = append(tasks, t)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return tasks, totalCount, nil
}

func (r *TaskRepository) ListByProjectAll(ctx context.Context, projectID uuid.UUID) ([]model.Task, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, title, description, status, priority, project_id, assignee_id, created_by, due_date, created_at, updated_at
		 FROM tasks WHERE project_id = $1
		 ORDER BY created_at DESC`,
		projectID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []model.Task
	for rows.Next() {
		var t model.Task
		if err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Status, &t.Priority,
			&t.ProjectID, &t.AssigneeID, &t.CreatedBy, &t.DueDate,
			&t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}

func (r *TaskRepository) Update(ctx context.Context, id uuid.UUID, title *string, description *string, status *model.TaskStatus, priority *model.TaskPriority, assigneeID *uuid.UUID, dueDate *time.Time, clearAssignee bool, clearDueDate bool) (*model.Task, error) {
	// Build dynamic SET clause
	sets := []string{"updated_at = NOW()"}
	args := []interface{}{id}
	argIdx := 2

	if title != nil {
		sets = append(sets, fmt.Sprintf("title = $%d", argIdx))
		args = append(args, *title)
		argIdx++
	}
	if description != nil {
		sets = append(sets, fmt.Sprintf("description = $%d", argIdx))
		args = append(args, *description)
		argIdx++
	}
	if status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, string(*status))
		argIdx++
	}
	if priority != nil {
		sets = append(sets, fmt.Sprintf("priority = $%d", argIdx))
		args = append(args, string(*priority))
		argIdx++
	}
	if clearAssignee {
		sets = append(sets, "assignee_id = NULL")
	} else if assigneeID != nil {
		sets = append(sets, fmt.Sprintf("assignee_id = $%d", argIdx))
		args = append(args, *assigneeID)
		argIdx++
	}
	if clearDueDate {
		sets = append(sets, "due_date = NULL")
	} else if dueDate != nil {
		sets = append(sets, fmt.Sprintf("due_date = $%d", argIdx))
		args = append(args, *dueDate)
		argIdx++
	}

	query := fmt.Sprintf(
		`UPDATE tasks SET %s WHERE id = $1
		 RETURNING id, title, description, status, priority, project_id, assignee_id, created_by, due_date, created_at, updated_at`,
		strings.Join(sets, ", "),
	)

	task := &model.Task{}
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&task.ID, &task.Title, &task.Description, &task.Status, &task.Priority,
		&task.ProjectID, &task.AssigneeID, &task.CreatedBy, &task.DueDate,
		&task.CreatedAt, &task.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return task, nil
}

func (r *TaskRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM tasks WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
