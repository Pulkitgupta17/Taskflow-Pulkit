-- Seed data for TaskFlow
-- Password: password123 (bcrypt cost 12)
-- NOTE: Use cmd/seed/main.go for reliable seeding with runtime bcrypt hashing.
-- This file is provided as a reference.

INSERT INTO users (id, name, email, password)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Test User', 'test@example.com',
        '$2a$12$LJ3m4ys3Lf5BKsMxde4zXeJp5JcZ5Hm5OQMCUjJPOIDqMfdjxuFLm')
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, description, owner_id)
VALUES ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Website Redesign',
        'Q2 redesign project for the marketing site',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, created_by, due_date)
VALUES
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Design homepage mockup',
 'Create wireframes and high-fidelity mockups for the new homepage',
 'done', 'high', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-04-20'),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Implement responsive nav',
 'Build mobile-first navigation component',
 'in_progress', 'medium', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-04-25'),
('e5f6a7b8-c9d0-1234-efab-345678901234', 'Set up CI/CD pipeline',
 'Configure GitHub Actions for automated testing and deployment',
 'todo', 'low', 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
 NULL, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2026-05-01')
ON CONFLICT (id) DO NOTHING;
