-- EMERGENCY SEED DATA: Live Props for NFL Playoffs, NBA, NHL
-- Run this to immediately populate the feed with active markets.

-- 1. CLEAN UP (Optional: Uncomment to wipe existing)
-- TRUNCATE TABLE predictions CASCADE; 

-- 2. INSERT NFL PLAYOFF PROPS (Wildcard/Divisional Mock)
INSERT INTO predictions (category, question, external_id, yes_multiplier, no_multiplier, yes_percent, volume, resolved, expires_at, created_at)
VALUES 
('NFL', 'Will Houston Texans win against Pittsburgh Steelers?', 'manual-nfl-texans-steelers-h2h', 1.65, 2.25, 60, 15400, false, NOW() + INTERVAL '2 days', NOW()),
('NFL', 'Will Pittsburgh Steelers vs Houston Texans go OVER 41.5 points?', 'manual-nfl-texans-steelers-total', 1.91, 1.91, 50, 8900, false, NOW() + INTERVAL '2 days', NOW()),
('NFL', 'Will C.J. Stroud throw OVER 1.5 Touchdowns?', 'manual-nfl-stroud-tds', 1.85, 1.95, 55, 12000, false, NOW() + INTERVAL '2 days', NOW()),
('NFL', 'Will Patrick Mahomes throw for 250+ Yards?', 'manual-nfl-mahomes-yards', 1.75, 2.05, 58, 14500, false, NOW() + INTERVAL '3 days', NOW()),
('NFL', 'Will Kansas City Chiefs win against Miami Dolphins?', 'manual-nfl-chiefs-dolphins-h2h', 1.50, 2.60, 65, 22000, false, NOW() + INTERVAL '3 days', NOW()),
('NFL', 'Will Tyreek Hill score a Touchdown anytime?', 'manual-nfl-hill-td', 2.10, 1.70, 45, 9800, false, NOW() + INTERVAL '3 days', NOW());

-- 3. INSERT NBA PROPS
INSERT INTO predictions (category, question, external_id, yes_multiplier, no_multiplier, yes_percent, volume, resolved, expires_at, created_at)
VALUES
('NBA', 'Will Boston Celtics win against Milwaukee Bucks?', 'manual-nba-celtics-bucks-h2h', 1.70, 2.15, 58, 5400, false, NOW() + INTERVAL '1 day', NOW()),
('NBA', 'Will Giannis Antetokounmpo score OVER 30.5 Points?', 'manual-nba-giannis-points', 1.87, 1.87, 52, 6700, false, NOW() + INTERVAL '1 day', NOW()),
('NBA', 'Will Luka Doncic record a Triple Double?', 'manual-nba-luka-triple-double', 3.50, 1.25, 25, 3200, false, NOW() + INTERVAL '12 hours', NOW()),
('NBA', 'Will LeBron James score OVER 24.5 Points?', 'manual-nba-lebron-points', 1.85, 1.95, 55, 8900, false, NOW() + INTERVAL '12 hours', NOW()),
('NBA', 'Will Golden State Warriors win against Chicago Bulls?', 'manual-nba-warriors-bulls-h2h', 1.45, 2.75, 70, 4500, false, NOW() + INTERVAL '12 hours', NOW());

-- 4. INSERT NHL & SOCCER PROPS
INSERT INTO predictions (category, question, external_id, yes_multiplier, no_multiplier, yes_percent, volume, resolved, expires_at, created_at)
VALUES
('NHL', 'Will Toronto Maple Leafs win against Boston Bruins?', 'manual-nhl-leafs-bruins-h2h', 2.05, 1.80, 45, 2100, false, NOW() + INTERVAL '1 day', NOW()),
('NHL', 'Will Connor McDavid score a Goal?', 'manual-nhl-mcdavid-goal', 2.20, 1.65, 40, 3400, false, NOW() + INTERVAL '6 hours', NOW()),
('Soccer', 'Will Manchester City win against Newcastle?', 'manual-epl-city-newcastle-h2h', 1.60, 4.20, 75, 12000, false, NOW() + INTERVAL '1 day', NOW()),
('Soccer', 'Will Erling Haaland score anytime?', 'manual-epl-haaland-goal', 1.75, 2.00, 60, 15000, false, NOW() + INTERVAL '1 day', NOW());

-- 5. INSERT CRYPTO PROPS (Fun/High Volume)
INSERT INTO predictions (category, question, external_id, yes_multiplier, no_multiplier, yes_percent, volume, resolved, expires_at, created_at, oracle_type, oracle_id, target_value)
VALUES
('Crypto', 'Will Bitcoin hit $50k by Friday?', 'manual-crypto-btc-50k', 1.50, 2.50, 70, 50000, false, NOW() + INTERVAL '5 days', NOW(), 'crypto_price_gt', 'bitcoin', 50000),
('Crypto', 'Will Ethereum hit $3000 by Friday?', 'manual-crypto-eth-3k', 2.10, 1.75, 40, 25000, false, NOW() + INTERVAL '5 days', NOW(), 'crypto_price_gt', 'ethereum', 3000);
