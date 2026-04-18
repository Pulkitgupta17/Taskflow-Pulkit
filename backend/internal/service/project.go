package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/taskflow/backend/internal/model"
	"github.com/taskflow/backend/internal/repository"
)

var (
	ErrNotFound  = errors.New("not found")
	ErrForbidden = errors.New("forbidden")
)

type ProjectService struct {
	projectRepo *repository.ProjectRepository
	taskRepo    *repository.TaskRepository
}

func NewProjectService(projectRepo *repository.ProjectRepository, taskRepo *repository.TaskRepository) *ProjectService {
	return &ProjectService{
		projectRepo: projectRepo,
		taskRepo:    taskRepo,
	}
}

func (s *ProjectService) Create(ctx context.Context, req model.CreateProjectRequest, ownerID uuid.UUID) (*model.Project, error) {
	return s.projectRepo.Create(ctx, req.Name, req.Description, ownerID)
}

func (s *ProjectService) List(ctx context.Context, userID uuid.UUID, page, limit int) ([]model.Project, int, error) {
	return s.projectRepo.ListByUser(ctx, userID, page, limit)
}

func (s *ProjectService) GetByID(ctx context.Context, id uuid.UUID) (*model.ProjectWithTasks, error) {
	project, err := s.projectRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	tasks, err := s.taskRepo.ListByProjectAll(ctx, id)
	if err != nil {
		return nil, err
	}
	if tasks == nil {
		tasks = []model.Task{}
	}

	return &model.ProjectWithTasks{
		Project: *project,
		Tasks:   tasks,
	}, nil
}

func (s *ProjectService) Update(ctx context.Context, id uuid.UUID, req model.UpdateProjectRequest, userID uuid.UUID) (*model.Project, error) {
	project, err := s.projectRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	if project.OwnerID != userID {
		return nil, ErrForbidden
	}

	return s.projectRepo.Update(ctx, id, req.Name, req.Description)
}

func (s *ProjectService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	project, err := s.projectRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return err
	}

	if project.OwnerID != userID {
		return ErrForbidden
	}

	return s.projectRepo.Delete(ctx, id)
}

func (s *ProjectService) GetStats(ctx context.Context, id uuid.UUID) (*model.ProjectStats, error) {
	_, err := s.projectRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return s.projectRepo.GetStats(ctx, id)
}
