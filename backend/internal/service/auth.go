package service

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/taskflow/backend/internal/model"
	"github.com/taskflow/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailTaken         = errors.New("email already taken")
)

type AuthService struct {
	userRepo   *repository.UserRepository
	jwtSecret  string
	bcryptCost int
}

func NewAuthService(userRepo *repository.UserRepository, jwtSecret string, bcryptCost int) *AuthService {
	return &AuthService{
		userRepo:   userRepo,
		jwtSecret:  jwtSecret,
		bcryptCost: bcryptCost,
	}
}

func (s *AuthService) Register(ctx context.Context, req model.RegisterRequest) (*model.AuthResponse, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), s.bcryptCost)
	if err != nil {
		return nil, err
	}

	user, err := s.userRepo.Create(ctx, req.Name, req.Email, string(hashedPassword))
	if err != nil {
		if errors.Is(err, repository.ErrDuplicateEmail) {
			return nil, ErrEmailTaken
		}
		return nil, err
	}

	token, err := s.generateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		Token: token,
		User: model.UserInfo{
			ID:    user.ID,
			Name:  user.Name,
			Email: user.Email,
		},
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req model.LoginRequest) (*model.AuthResponse, error) {
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := s.generateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		Token: token,
		User: model.UserInfo{
			ID:    user.ID,
			Name:  user.Name,
			Email: user.Email,
		},
	}, nil
}

func (s *AuthService) generateToken(userID uuid.UUID, email string) (string, error) {
	claims := jwt.MapClaims{
		"sub":   userID.String(),
		"email": email,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
		"iat":   time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}
