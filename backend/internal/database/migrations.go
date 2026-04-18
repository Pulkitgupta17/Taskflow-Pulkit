package database

import (
	"embed"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

func RunMigrations(databaseURL string) error {
	d, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return err
	}

	// golang-migrate pgx v5 driver expects "pgx5://" scheme
	dbURL := databaseURL
	if strings.HasPrefix(dbURL, "postgres://") {
		dbURL = "pgx5://" + dbURL[len("postgres://"):]
	} else if strings.HasPrefix(dbURL, "postgresql://") {
		dbURL = "pgx5://" + dbURL[len("postgresql://"):]
	}

	m, err := migrate.NewWithSourceInstance("iofs", d, dbURL)
	if err != nil {
		return err
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return err
	}

	return nil
}
