CREATE DATABASE IF NOT EXISTS school_management;
USE school_management;

-- Users table (all staff)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('teacher', 'admin', 'principal') NOT NULL DEFAULT 'teacher',
  employee_id VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  profile_picture VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Subjects table (per teacher)
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  grade_level VARCHAR(20) NOT NULL,
  code VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Learners table
CREATE TABLE IF NOT EXISTS learners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  student_number VARCHAR(50) UNIQUE NOT NULL,
  grade_level VARCHAR(20) NOT NULL,
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  parent_contact VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subject enrollment (which learners are in which subject)
CREATE TABLE IF NOT EXISTS subject_learners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  learner_id INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (learner_id) REFERENCES learners(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (subject_id, learner_id)
);

-- Grades table
CREATE TABLE IF NOT EXISTS grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  learner_id INT NOT NULL,
  subject_id INT NOT NULL,
  assessment_type ENUM('test', 'assignment', 'exam', 'project', 'CA') NOT NULL,
  assessment_name VARCHAR(100) NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  total_marks DECIMAL(5,2) NOT NULL,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS (marks_obtained / total_marks * 100) STORED,
  term ENUM('Term 1', 'Term 2', 'Term 3', 'Term 4') NOT NULL,
  year INT NOT NULL DEFAULT (YEAR(CURDATE())),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (learner_id) REFERENCES learners(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Refresh tokens for persistent login
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);