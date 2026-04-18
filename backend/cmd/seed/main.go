package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/taskflow/backend/internal/database"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	// Run migrations first to ensure tables exist
	if err := database.RunMigrations(dbURL); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Generate bcrypt hash for seed password
	password := "password123"
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		log.Fatalf("failed to hash password: %v", err)
	}

	userID := "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
	projectID := "b2c3d4e5-f6a7-8901-bcde-f12345678901"

	// Insert user (idempotent)
	_, err = pool.Exec(ctx, `
		INSERT INTO users (id, name, email, password)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (id) DO NOTHING`,
		userID, "Test User", "test@example.com", string(hash),
	)
	if err != nil {
		log.Fatalf("failed to insert user: %v", err)
	}
	fmt.Println("Seeded user: test@example.com / password123")

	// Insert project (idempotent)
	_, err = pool.Exec(ctx, `
		INSERT INTO projects (id, name, description, owner_id)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (id) DO NOTHING`,
		projectID, "Website Redesign", "Q2 redesign project for the marketing site", userID,
	)
	if err != nil {
		log.Fatalf("failed to insert project: %v", err)
	}
	fmt.Println("Seeded project: Website Redesign")

	// Insert tasks (idempotent)
	tasks := []struct {
		id          string
		title       string
		description string
		status      string
		priority    string
		assigneeID  *string
		dueDate     string
	}{
		{
			id:          "c3d4e5f6-a7b8-9012-cdef-123456789012",
			title:       "Design homepage mockup",
			description: "Create wireframes and high-fidelity mockups for the new homepage",
			status:      "done",
			priority:    "high",
			assigneeID:  &userID,
			dueDate:     "2026-04-20",
		},
		{
			id:          "d4e5f6a7-b8c9-0123-defa-234567890123",
			title:       "Implement responsive nav",
			description: "Build mobile-first navigation component",
			status:      "in_progress",
			priority:    "medium",
			assigneeID:  &userID,
			dueDate:     "2026-04-25",
		},
		{
			id:          "e5f6a7b8-c9d0-1234-efab-345678901234",
			title:       "Set up CI/CD pipeline",
			description: "Configure GitHub Actions for automated testing and deployment",
			status:      "todo",
			priority:    "low",
			assigneeID:  nil,
			dueDate:     "2026-05-01",
		},
	}

	for _, t := range tasks {
		_, err = pool.Exec(ctx, `
			INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, created_by, due_date)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			ON CONFLICT (id) DO NOTHING`,
			t.id, t.title, t.description, t.status, t.priority, projectID, t.assigneeID, userID, t.dueDate,
		)
		if err != nil {
			log.Fatalf("failed to insert task %s: %v", t.title, err)
		}
		fmt.Printf("Seeded task: %s\n", t.title)
	}

	fmt.Println("Seed completed successfully!")
}
