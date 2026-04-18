package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/taskflow/backend/internal/config"
	"github.com/taskflow/backend/internal/database"
	"github.com/taskflow/backend/internal/handler"
	"github.com/taskflow/backend/internal/middleware"
	"github.com/taskflow/backend/internal/repository"
	"github.com/taskflow/backend/internal/service"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	// Load config
	cfg, err := config.Load()
	if err != nil {
		logger.Error("failed to load config", slog.String("error", err.Error()))
		os.Exit(1)
	}

	// Run migrations
	if err := database.RunMigrations(cfg.DatabaseURL); err != nil {
		logger.Error("failed to run migrations", slog.String("error", err.Error()))
		os.Exit(1)
	}
	logger.Info("migrations completed")

	// Connect to database
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("failed to connect to database", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		logger.Error("failed to ping database", slog.String("error", err.Error()))
		os.Exit(1)
	}
	logger.Info("database connected")

	// Initialize repositories
	userRepo := repository.NewUserRepository(pool)
	projectRepo := repository.NewProjectRepository(pool)
	taskRepo := repository.NewTaskRepository(pool)

	// Initialize services
	authService := service.NewAuthService(userRepo, cfg.JWTSecret, cfg.BcryptCost)
	projectService := service.NewProjectService(projectRepo, taskRepo)
	taskService := service.NewTaskService(taskRepo, projectRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	projectHandler := handler.NewProjectHandler(projectService)
	taskHandler := handler.NewTaskHandler(taskService)
	userHandler := handler.NewUserHandler(userRepo)

	// Setup router
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(middleware.Logging(logger))
	r.Use(chimiddleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   splitOrigins(cfg.CORSOrigin),
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Auth routes (public)
	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.Auth(cfg.JWTSecret))

		// Users
		r.Get("/users", userHandler.List)

		// Projects
		r.Route("/projects", func(r chi.Router) {
			r.Get("/", projectHandler.List)
			r.Post("/", projectHandler.Create)

			r.Route("/{id}", func(r chi.Router) {
				r.Get("/", projectHandler.GetByID)
				r.Patch("/", projectHandler.Update)
				r.Delete("/", projectHandler.Delete)
				r.Get("/stats", projectHandler.GetStats)

				// Tasks within a project
				r.Get("/tasks", taskHandler.List)
				r.Post("/tasks", taskHandler.Create)
			})
		})

		// Tasks (direct access for update/delete)
		r.Route("/tasks", func(r chi.Router) {
			r.Patch("/{id}", taskHandler.Update)
			r.Delete("/{id}", taskHandler.Delete)
		})
	})

	// Start server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		logger.Info("server starting", slog.String("port", cfg.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server failed", slog.String("error", err.Error()))
			os.Exit(1)
		}
	}()

	<-done
	logger.Info("server shutting down")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("server forced to shutdown", slog.String("error", err.Error()))
		os.Exit(1)
	}

	logger.Info("server stopped")
}

func splitOrigins(origins string) []string {
	parts := strings.Split(origins, ",")
	var result []string
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
