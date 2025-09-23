USE microbanking;

-- Employees table with first_name and last_name instead of name
CREATE TABLE IF NOT EXISTS Employee (
    employee_id VARCHAR(20) PRIMARY KEY,
    role ENUM('Manager', 'Agent', 'Admin') NOT NULL,
    username VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    nic VARCHAR(15) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    date_of_birth DATE NOT NULL,
    branch_id VARCHAR(20) NOT NULL,
    contact_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear any existing data
DELETE FROM Employee;

-- Insert initial admin user with placeholder password (we'll update this later)
INSERT INTO Employee (employee_id, role, username, password, first_name, last_name, nic, gender, date_of_birth, branch_id, contact_id)
VALUES ('ADM001', 'Admin', 'admin', 'temp_password', 'System', 'Administrator', '000000000V', 'Male', '1990-01-01', 'BR001', 'CT001');