-- Create database (run this first as postgres user)
-- CREATE DATABASE microbanking;

-- Connect to the database
\c microbanking;

-- Create enum types
CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE contact_type AS ENUM ('customer', 'employee', 'branch');
CREATE TYPE account_status_type AS ENUM ('Active', 'Inactive');
CREATE TYPE plan_type AS ENUM ('Children', 'Teen', 'Adult', 'Senior', 'Joint');
CREATE TYPE auto_renewal_status_type AS ENUM ('True', 'False');
CREATE TYPE fd_status_type AS ENUM ('Active', 'Matured', 'Closed');
CREATE TYPE employee_role AS ENUM ('Manager', 'Agent', 'Admin');
CREATE TYPE fd_options_type AS ENUM ('6 months', '1 year', '3 years');
CREATE TYPE transaction_type AS ENUM ('Deposit', 'Withdrawal', 'Interest', 'Transfer');

-- Contact table (must be created first as it's referenced by other tables)
CREATE TABLE IF NOT EXISTS Contact (
    contact_id VARCHAR(20) PRIMARY KEY,
    type contact_type NOT NULL,
    contact_no_1 VARCHAR(15),
    contact_no_2 VARCHAR(15),
    address VARCHAR(100),
    email VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branch table
CREATE TABLE IF NOT EXISTS Branch (
    branch_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    contact_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES Contact(contact_id) ON DELETE RESTRICT
);

-- FDPlan table
CREATE TABLE IF NOT EXISTS FDPlan (
    fd_plan_id VARCHAR(20) PRIMARY KEY,
    fd_options fd_options_type NOT NULL,
    interest DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SavingPlan table
CREATE TABLE IF NOT EXISTS SavingPlan (
    saving_plan_id VARCHAR(20) PRIMARY KEY,
    plan_type plan_type NOT NULL,
    interest DECIMAL(5,2) NOT NULL,
    min_balance DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FixedDeposit table
CREATE TABLE IF NOT EXISTS FixedDeposit (
    fd_id VARCHAR(20) PRIMARY KEY,
    fd_balance DECIMAL(15,2) NOT NULL,
    auto_renewal_status auto_renewal_status_type NOT NULL,
    fd_status fd_status_type NOT NULL,
    open_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    fd_plan_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fd_plan_id) REFERENCES FDPlan(fd_plan_id) ON DELETE RESTRICT
);

-- Employee table - UPDATED to match frontend
CREATE TABLE IF NOT EXISTS Employee (
    employee_id VARCHAR(20) PRIMARY KEY,
    role employee_role NOT NULL,
    username VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,  -- Changed from name
    last_name VARCHAR(50) NOT NULL,   -- Added
    nic VARCHAR(15) NOT NULL,
    gender gender_type NOT NULL,
    date_of_birth DATE NOT NULL,
    branch_id VARCHAR(20) NOT NULL,
    contact_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE RESTRICT,
    FOREIGN KEY (contact_id) REFERENCES Contact(contact_id) ON DELETE RESTRICT
);

-- Customer table
CREATE TABLE IF NOT EXISTS Customer (
    customer_id VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender gender_type NOT NULL,
    nic VARCHAR(15) NOT NULL,
    date_of_birth DATE NOT NULL,
    contact_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES Contact(contact_id) ON DELETE RESTRICT
);

-- Account table
CREATE TABLE IF NOT EXISTS Account (
    account_id VARCHAR(20) PRIMARY KEY,
    open_date DATE NOT NULL,
    account_status account_status_type NOT NULL,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    saving_plan_id VARCHAR(20),
    fd_id VARCHAR(20),
    branch_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (saving_plan_id) REFERENCES SavingPlan(saving_plan_id) ON DELETE SET NULL,
    FOREIGN KEY (fd_id) REFERENCES FixedDeposit(fd_id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE RESTRICT
);

-- Transaction table - IMPROVED with transaction type
CREATE TABLE IF NOT EXISTS Transaction (
    transaction_id VARCHAR(20) PRIMARY KEY,
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    time TIMESTAMP NOT NULL,
    description VARCHAR(100),
    account_id VARCHAR(20) NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES Account(account_id) ON DELETE RESTRICT,
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id) ON DELETE RESTRICT
);

-- Takes table (junction table for Customer-Account relationship)
CREATE TABLE IF NOT EXISTS Takes (
    takes_id VARCHAR(20) PRIMARY KEY,
    customer_id VARCHAR(20) NOT NULL,
    account_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES Account(account_id) ON DELETE CASCADE,
    UNIQUE(customer_id, account_id) -- Prevent duplicate relationships
);

-- Table to track FD interest calculations
CREATE TABLE IF NOT EXISTS fd_interest_calculations (
    id SERIAL PRIMARY KEY,
    fd_id VARCHAR(20) NOT NULL,
    calculation_date DATE NOT NULL,
    interest_amount DECIMAL(15,2) NOT NULL,
    days_in_period INTEGER NOT NULL,
    credited_to_account_id VARCHAR(20) NOT NULL,
    credited_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fd_id) REFERENCES FixedDeposit(fd_id) ON DELETE CASCADE,
    FOREIGN KEY (credited_to_account_id) REFERENCES Account(account_id) ON DELETE CASCADE
);

-- Table to store interest calculation periods
CREATE TABLE IF NOT EXISTS fd_interest_periods (
    id SERIAL PRIMARY KEY,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fd_interest_fd_id ON fd_interest_calculations(fd_id);
CREATE INDEX IF NOT EXISTS idx_fd_interest_status ON fd_interest_calculations(status);
CREATE INDEX IF NOT EXISTS idx_fd_interest_calculation_date ON fd_interest_calculations(calculation_date);
CREATE INDEX IF NOT EXISTS idx_fd_interest_periods_processed ON fd_interest_periods(is_processed);

-- Create sequences for ID generation (Optional but recommended)
CREATE SEQUENCE IF NOT EXISTS contact_id_seq;
CREATE SEQUENCE IF NOT EXISTS branch_id_seq;
CREATE SEQUENCE IF NOT EXISTS employee_id_seq;
CREATE SEQUENCE IF NOT EXISTS customer_id_seq;
CREATE SEQUENCE IF NOT EXISTS account_id_seq;
CREATE SEQUENCE IF NOT EXISTS transaction_id_seq;



-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_username ON Employee(username);
CREATE INDEX IF NOT EXISTS idx_employee_role ON Employee(role);
CREATE INDEX IF NOT EXISTS idx_customer_nic ON Customer(nic);
CREATE INDEX IF NOT EXISTS idx_account_status ON Account(account_status);
CREATE INDEX IF NOT EXISTS idx_account_branch ON Account(branch_id);
CREATE INDEX IF NOT EXISTS idx_transaction_account ON Transaction(account_id);
CREATE INDEX IF NOT EXISTS idx_transaction_time ON Transaction(time);
CREATE INDEX IF NOT EXISTS idx_transaction_employee ON Transaction(employee_id);
CREATE INDEX IF NOT EXISTS idx_takes_customer ON Takes(customer_id);
CREATE INDEX IF NOT EXISTS idx_takes_account ON Takes(account_id);
CREATE INDEX IF NOT EXISTS idx_fixed_deposit_status ON FixedDeposit(fd_status);
CREATE INDEX IF NOT EXISTS idx_contact_type ON Contact(type);

-- Add a constraint to ensure one FD per savings account
ALTER TABLE account ADD CONSTRAINT unique_fd_per_account UNIQUE (fd_id);

-- Add an index for better FD search performance
CREATE INDEX IF NOT EXISTS idx_account_fd_id ON Account(fd_id);
CREATE INDEX IF NOT EXISTS idx_fixed_deposit_status ON FixedDeposit(fd_status);