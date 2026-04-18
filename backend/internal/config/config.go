package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL string
	JWTSecret   string
	Port        string
	BcryptCost  int
	CORSOrigin  string
}

func Load() (*Config, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	bcryptCost := 12
	if v := os.Getenv("BCRYPT_COST"); v != "" {
		cost, err := strconv.Atoi(v)
		if err != nil {
			return nil, fmt.Errorf("BCRYPT_COST must be an integer: %w", err)
		}
		if cost < 4 || cost > 31 {
			return nil, fmt.Errorf("BCRYPT_COST must be between 4 and 31")
		}
		bcryptCost = cost
	}

	corsOrigin := os.Getenv("CORS_ORIGIN")
	if corsOrigin == "" {
		corsOrigin = "http://localhost:5173"
	}

	return &Config{
		DatabaseURL: dbURL,
		JWTSecret:   jwtSecret,
		Port:        port,
		BcryptCost:  bcryptCost,
		CORSOrigin:  corsOrigin,
	}, nil
}
