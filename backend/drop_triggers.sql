-- Drop problematic triggers that cause MySQL error 1442
-- ER_CANT_UPDATE_USED_TABLE_IN_SF_OR_TRG
-- 
-- These triggers try to update the same table that fired them,
-- which MySQL doesn't allow. Run this script in your MySQL client.
--
-- Usage: mysql -u your_user -p mindarena < drop_triggers.sql
-- Or run directly in MySQL Workbench, phpMyAdmin, etc.

-- Drop trigger that tries to update 'attempts' table after INSERT
DROP TRIGGER IF EXISTS log_attempt_creation;

-- Drop trigger that tries to update 'contest_registrations' table after INSERT  
DROP TRIGGER IF EXISTS log_contest_registration;

-- Verify triggers are dropped
SELECT TRIGGER_NAME, EVENT_OBJECT_TABLE, ACTION_STATEMENT 
FROM information_schema.TRIGGERS 
WHERE TRIGGER_SCHEMA = DATABASE() 
AND TRIGGER_NAME IN ('log_attempt_creation', 'log_contest_registration');
