-- Create database (run this first as postgres user)
CREATE DATABASE microbanking;

-- Connect to the database
\c microbanking;

-- Create enum type for role
CREATE TYPE employee_role AS ENUM ('Manager', 'Agent', 'Admin');

-- Create enum type for gender
CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');

-- Employees table with first_name and last_name
CREATE TABLE IF NOT EXISTS employee (
    employee_id VARCHAR(20) PRIMARY KEY,
    role employee_role NOT NULL,
    username VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    nic VARCHAR(15) NOT NULL,
    gender gender_type NOT NULL,
    date_of_birth DATE NOT NULL,
    branch_id VARCHAR(20) NOT NULL,
    contact_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear any existing data
TRUNCATE TABLE employee;

-- Insert initial admin user with hashed password for 'admin123'
INSERT INTO employee (employee_id, role, username, password, first_name, last_name, nic, gender, date_of_birth, branch_id, contact_id)
VALUES (
    'ADM001', 
    'Admin', 
    'admin', 
    '$2a$10$gCRXyR0Z5hW53wT1zTIJkeudG4q36a9fmVa.mOaAUDbu2VUHdWuHC', 
    'System', 
    'Administrator', 
    '000000000V', 
    'Male', 
    '1990-01-01', 
    'BR001', 
    'CT001'
);


-- Create indexes for better performance
CREATE INDEX idx_employee_username ON employee(username);
CREATE INDEX idx_employee_role ON employee(role);

-- Verify the data
SELECT * FROM employee;