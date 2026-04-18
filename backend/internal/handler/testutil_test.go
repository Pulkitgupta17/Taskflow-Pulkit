package handler_test

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/taskflow/backend/internal/handler"
	"github.com/taskflow/backend/internal/middleware"
	"github.com/taskflow/backend/internal/repository"
	"github.com/taskflow/backend/internal/service"
)

const testJWTSecret = "test-secret-key-for-integration-tests"
const testBcryptCost = 4 // low cost for fast tests

var testPool *pgxpool.Pool

func TestMain(m *testing.M) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Println("SKIP: DATABASE_URL not set, skipping integration tests")
		os.Exit(0)
	}

	ctx := context.Background()
	var err error
	testPool, err = pgxpool.New(ctx, dbURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to connect to database: %v\n", err)
		os.Exit(1)
	}

	if err := testPool.Ping(ctx); err != nil {
		fmt.Fprintf(os.Stderr, "failed to ping database: %v\n", err)
		os.Exit(1)
	}

	// Run migrations via direct SQL (avoids import of database package which uses embed)
	if err := ensureSchema(ctx, testPool); err != nil {
		fmt.Fprintf(os.Stderr, "failed to set up schema: %v\n", err)
		os.Exit(1)
	}

	code := m.Run()

	testPool.Close()
	os.Exit(code)
}

// ensureSchema creates the required tables if they do not already exist.
func ensureSchema(ctx context.Context, pool *pgxpool.Pool) error {
	ddl := `
	CREATE EXTENSION IF NOT EXISTS "pgcrypto";

	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		name VARCHAR(255) NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		password VARCHAR(255) NOT NULL,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	DO $$ BEGIN
		CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
	EXCEPTION WHEN duplicate_object THEN NULL;
	END $$;

	DO $$ BEGIN
		CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
	EXCEPTION WHEN duplicate_object THEN NULL;
	END $$;

	CREATE TABLE IF NOT EXISTS projects (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		name VARCHAR(255) NOT NULL,
		description TEXT,
		owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS tasks (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		title VARCHAR(255) NOT NULL,
		description TEXT,
		status task_status NOT NULL DEFAULT 'todo',
		priority task_priority NOT NULL DEFAULT 'medium',
		project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
		assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
		created_by UUID NOT NULL REFERENCES users(id),
		due_date DATE,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);
	`
	_, err := pool.Exec(ctx, ddl)
	return err
}

// truncateTables clears all data between tests for isolation.
func truncateTables(t *testing.T) {
	t.Helper()
	ctx := context.Background()
	_, err := testPool.Exec(ctx, "TRUNCATE tasks, projects, users CASCADE")
	if err != nil {
		t.Fatalf("failed to truncate tables: %v", err)
	}
}

// testRouter builds a fully wired chi.Router using real repositories, services, and handlers.
func testRouter() http.Handler {
	userRepo := repository.NewUserRepository(testPool)
	projectRepo := repository.NewProjectRepository(testPool)
	taskRepo := repository.NewTaskRepository(testPool)

	authService := service.NewAuthService(userRepo, testJWTSecret, testBcryptCost)
	projectService := service.NewProjectService(projectRepo, taskRepo)
	taskService := service.NewTaskService(taskRepo, projectRepo)

	authHandler := handler.NewAuthHandler(authService)
	projectHandler := handler.NewProjectHandler(projectService)
	taskHandler := handler.NewTaskHandler(taskService)

	r := chi.NewRouter()

	// Auth routes (public)
	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.Auth(testJWTSecret))

		r.Route("/projects", func(r chi.Router) {
			r.Get("/", projectHandler.List)
			r.Post("/", projectHandler.Create)

			r.Route("/{id}", func(r chi.Router) {
				r.Get("/", projectHandler.GetByID)
				r.Patch("/", projectHandler.Update)
				r.Delete("/", projectHandler.Delete)

				r.Get("/tasks", taskHandler.List)
				r.Post("/tasks", taskHandler.Create)
			})
		})

		r.Route("/tasks", func(r chi.Router) {
			r.Patch("/{id}", taskHandler.Update)
			r.Delete("/{id}", taskHandler.Delete)
		})
	})

	return r
}
