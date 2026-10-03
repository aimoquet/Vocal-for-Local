CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    duration FLOAT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    prediction VARCHAR(50) NOT NULL,
    real_probability FLOAT NOT NULL,
    fake_probability FLOAT NOT NULL,
    confidence FLOAT NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analyses_prediction ON analyses(prediction);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
