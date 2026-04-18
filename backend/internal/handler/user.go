package handler

import (
	"net/http"

	"github.com/taskflow/backend/internal/model"
	"github.com/taskflow/backend/internal/repository"
)

type UserHandler struct {
	userRepo *repository.UserRepository
}

func NewUserHandler(userRepo *repository.UserRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo}
}

func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) {
	users, err := h.userRepo.ListAll(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	if users == nil {
		users = []model.UserInfo{}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"users": users})
}
