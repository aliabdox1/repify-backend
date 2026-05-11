-- ═══════════════════════════════
-- REPIFY Database Schema
-- ═══════════════════════════════

-- Users (employees)
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) UNIQUE,
  role        VARCHAR(100),
  location    VARCHAR(100),
  bio         TEXT,
  plan        VARCHAR(20) DEFAULT 'free',
  trust_score INTEGER DEFAULT 0,
  avatar_url  TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) UNIQUE,
  industry    VARCHAR(100),
  location    VARCHAR(100),
  size        VARCHAR(50),
  about       TEXT,
  plan        VARCHAR(20) DEFAULT 'free',
  logo_url    TEXT,
  verified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  verified    BOOLEAN DEFAULT FALSE,
  polygon_tx  VARCHAR(200),
  score       INTEGER,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  company     VARCHAR(100),
  date        DATE,
  verified    BOOLEAN DEFAULT FALSE,
  polygon_tx  VARCHAR(200),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reviewer_name VARCHAR(100) NOT NULL,
  reviewer_role VARCHAR(100),
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  quality       VARCHAR(20),
  commitment    VARCHAR(20),
  communication VARCHAR(20),
  competence    VARCHAR(20),
  comment       TEXT,
  verified      BOOLEAN DEFAULT FALSE,
  polygon_tx    VARCHAR(200),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id           SERIAL PRIMARY KEY,
  company_id   INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  department   VARCHAR(100),
  type         VARCHAR(50) DEFAULT 'fulltime',
  location     VARCHAR(100),
  salary       VARCHAR(100),
  description  TEXT,
  skills       TEXT[],
  experience   VARCHAR(50),
  status       VARCHAR(20) DEFAULT 'active',
  applicants   INTEGER DEFAULT 0,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- Job Applications
CREATE TABLE IF NOT EXISTS applications (
  id          SERIAL PRIMARY KEY,
  job_id      INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status      VARCHAR(30) DEFAULT 'pending',
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  sender_id   INTEGER,
  sender_type VARCHAR(10),
  receiver_id INTEGER,
  receiver_type VARCHAR(10),
  content     TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(30),
  title       TEXT,
  body        TEXT,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER,
  entity_type VARCHAR(10),
  plan        VARCHAR(20),
  amount      INTEGER,
  currency    VARCHAR(10) DEFAULT 'IQD',
  method      VARCHAR(30),
  status      VARCHAR(20) DEFAULT 'pending',
  reference   VARCHAR(100),
  created_at  TIMESTAMP DEFAULT NOW()
);

RAISE NOTICE '✓ REPIFY schema created successfully';
