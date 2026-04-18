package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/taskflow/backend/internal/model"
)

type ProjectRepository struct {
	pool *pgxpool.Pool
}

func NewProjectRepository(pool *pgxpool.Pool) *ProjectRepository {
	return &ProjectRepository{pool: pool}
}

func (r *ProjectRepository) Create(ctx context.Context, name string, description *string, ownerID uuid.UUID) (*model.Project, error) {
	project := &model.Project{}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO projects (name, description, owner_id)
		 VALUES ($1, $2, $3)
		 RETURNING id, name, description, owner_id, created_at`,
		name, description, ownerID,
	).Scan(&project.ID, &project.Name, &project.Description, &project.OwnerID, &project.CreatedAt)
	if err != nil {
		return nil, err
	}
	return project, nil
}

func (r *ProjectRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Project, error) {
	project := &model.Project{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, description, owner_id, created_at FROM projects WHERE id = $1`,
		id,
	).Scan(&project.ID, &project.Name, &project.Description, &project.OwnerID, &project.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return project, nil
}

func (r *ProjectRepository) ListByUser(ctx context.Context, userID uuid.UUID, page, limit int) ([]model.Project, int, error) {
	offset := (page - 1) * limit

	var totalCount int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(DISTINCT p.id) FROM projects p
		 LEFT JOIN tasks t ON t.project_id = p.id
		 WHERE p.owner_id = $1 OR t.assignee_id = $1`,
		userID,
	).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx,
		`SELECT DISTINCT p.id, p.name, p.description, p.owner_id, p.created_at
		 FROM projects p
		 LEFT JOIN tasks t ON t.project_id = p.id
		 WHERE p.owner_id = $1 OR t.assignee_id = $1
		 ORDER BY p.created_at DESC
		 LIMIT $2 OFFSET $3`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var projects []model.Project
	for rows.Next() {
		var p model.Project
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.OwnerID, &p.CreatedAt); err != nil {
			return nil, 0, err
		}
		projects = append(projects, p)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return projects, totalCount, nil
}

func (r *ProjectRepository) Update(ctx context.Context, id uuid.UUID, name *string, description *string) (*model.Project, error) {
	project := &model.Project{}
	err := r.pool.QueryRow(ctx,
		`UPDATE projects
		 SET name = COALESCE($2, name),
		     description = COALESCE($3, description)
		 WHERE id = $1
		 RETURNING id, name, description, owner_id, created_at`,
		id, name, description,
	).Scan(&project.ID, &project.Name, &project.Description, &project.OwnerID, &project.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return project, nil
}

func (r *ProjectRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM projects WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *ProjectRepository) GetStats(ctx context.Context, projectID uuid.UUID) (*model.ProjectStats, error) {
	// Status counts
	rows, err := r.pool.Query(ctx,
		`SELECT status::text, COUNT(*) FROM tasks WHERE project_id = $1 GROUP BY status`,
		projectID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	statusCounts := make(map[string]int)
	totalTasks := 0
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		statusCounts[status] = count
		totalTasks += count
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Assignee counts
	rows2, err := r.pool.Query(ctx,
		`SELECT u.id::text, u.name, COUNT(*)
		 FROM tasks t
		 JOIN users u ON u.id = t.assignee_id
		 WHERE t.project_id = $1 AND t.assignee_id IS NOT NULL
		 GROUP BY u.id, u.name`,
		projectID,
	)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()

	assigneeCounts := make(map[string]model.AssigneeCount)
	for rows2.Next() {
		var userID, name string
		var count int
		if err := rows2.Scan(&userID, &name, &count); err != nil {
			return nil, err
		}
		assigneeCounts[userID] = model.AssigneeCount{Name: name, Count: count}
	}
	if err := rows2.Err(); err != nil {
		return nil, err
	}

	return &model.ProjectStats{
		StatusCounts:   statusCounts,
		AssigneeCounts: assigneeCounts,
		TotalTasks:     totalTasks,
	}, nil
}
