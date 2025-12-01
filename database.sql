-- Users table (authentication)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sessions table for simple token auth
CREATE TABLE sessions (
    token VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Company Settings per user
CREATE TABLE company_settings (
    user_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    address TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    siret VARCHAR(50),
    vat_number VARCHAR(50),
    is_vat_subject BOOLEAN DEFAULT FALSE,
    logo_url TEXT,
    payment_rib TEXT,
    payment_terms TEXT,
    primary_color VARCHAR(50) DEFAULT '#000000',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Clients
CREATE TABLE clients (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    siret VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Services / Products
CREATE TABLE services (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_price DECIMAL(10, 2) NOT NULL,
    vat_rate DECIMAL(5, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Invoices and Quotes
CREATE TABLE invoices (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    client_id VARCHAR(50) NOT NULL,
    type ENUM('INVOICE', 'QUOTE') NOT NULL,
    number VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    due_date DATE,
    status ENUM('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'ACCEPTED', 'REJECTED') NOT NULL,
    notes TEXT,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    converted_from_quote_id VARCHAR(50),
    source_recurring_invoice_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- Invoice Items
CREATE TABLE invoice_items (
    id VARCHAR(50) PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    vat_rate DECIMAL(5, 2) NOT NULL,
    service_id VARCHAR(50),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

-- Recurring Invoices
CREATE TABLE recurring_invoices (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    client_id VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    frequency ENUM('WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_run_date DATE NOT NULL,
    last_run_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Recurring Invoice Items (Template items)
CREATE TABLE recurring_invoice_items (
    id VARCHAR(50) PRIMARY KEY,
    recurring_invoice_id VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    vat_rate DECIMAL(5, 2) NOT NULL,
    service_id VARCHAR(50),
    FOREIGN KEY (recurring_invoice_id) REFERENCES recurring_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

-- User Subscription (SaaS)
CREATE TABLE user_subscriptions (
    user_id VARCHAR(50) PRIMARY KEY,
    plan_id VARCHAR(50) NOT NULL,
    status ENUM('NONE', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED') NOT NULL,
    current_period_start DATETIME,
    current_period_end DATETIME,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
